const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

const SCRIPT_PATH = path.join(__dirname, '../scripts/youtube_analyzer.py');

// 29 YouTube channels from config
const DEFAULT_CHANNELS = [
  'https://youtube.com/@ichimokutrinhphat',
  'https://youtube.com/@thaiphamofficialvn',
  'https://youtube.com/@tungbeeinvesting1',
  'https://youtube.com/@nguyendatofficial',
  'https://youtube.com/@hientransmile',
  'https://youtube.com/@cfa99',
  'https://youtube.com/@levanthangofficial',
  'https://youtube.com/@trongtaichinh88',
  'https://youtube.com/@haidanstock',
  'https://youtube.com/@hoasumin',
  'https://youtube.com/@kakatachungkhoan',
  'https://youtube.com/@dungbuiofficial4317',
  'https://youtube.com/@ichimoku',
  'https://youtube.com/@vtvindex',
  'https://youtube.com/@ngantranstock7241',
  'https://youtube.com/@koliaphan',
  'https://youtube.com/@quocanstock',
  'https://youtube.com/@lctvinvestment',
  'https://youtube.com/@qtstocks',
  'https://youtube.com/@marubozu99',
  'https://youtube.com/@nvtvietnam',
  'https://youtube.com/@hoathan-trading',
  'https://youtube.com/@longguru',
  'https://youtube.com/@alias_team',
  'https://youtube.com/@chungkhoanvps',
  'https://youtube.com/@vndirect1',
  'https://youtube.com/@dautuchungkhoancungmiracleteam',
  'https://youtube.com/@dautuchungkhoancungquangdung',
  'https://youtube.com/@doanducofficial'
];

function runPython(args) {
  return new Promise((resolve, reject) => {
    const py = spawn('python', [SCRIPT_PATH, ...args]);
    let stdout = '';
    let stderr = '';
    py.stdout.on('data', (data) => { stdout += data.toString(); });
    py.stderr.on('data', (data) => { stderr += data.toString(); });
    py.on('close', (code) => {
      if (code !== 0) {
        reject(new Error(`Python script exited ${code}: ${stderr || stdout}`));
      } else {
        try {
          resolve(JSON.parse(stdout));
        } catch (e) {
          resolve({ raw: stdout, error: e.message });
        }
      }
    });
  });
}

class YouTubeWorker {
  constructor(config = {}) {
    this.channels = config.channels || DEFAULT_CHANNELS;
    this.days = config.days || 7;
    this.maxVideosPerChannel = config.maxVideosPerChannel || 10;
    this.progressCallback = config.onProgress || (() => {});
  }

  async collect(config = {}) {
    const channels = config.channels || this.channels;
    const days = config.days || this.days;
    const maxPerChannel = config.maxVideosPerChannel || this.maxVideosPerChannel;

    this.progressCallback({ stage: 'start', totalChannels: channels.length });

    const allVideos = [];
    const allTranscripts = [];
    const failed = [];

    for (let i = 0; i < channels.length; i++) {
      const ch = channels[i];
      this.progressCallback({ stage: 'channel', current: i + 1, total: channels.length, url: ch });

      try {
        const videos = await runPython(['channel', ch, String(days), String(maxPerChannel)]);
        if (!Array.isArray(videos)) {
          failed.push({ channel: ch, reason: 'invalid_response', detail: videos });
          continue;
        }

        for (const v of videos) {
          if (v.error) {
            failed.push({ channel: ch, videoId: v.id, reason: v.error });
            continue;
          }
          allVideos.push(v);

          // Extract transcript with fallback chain
          const tx = await this.extractTranscript(v.url, Math.floor((v.duration || 0) / 60));
          if (tx.success) {
            allTranscripts.push({
              videoId: v.id,
              title: v.title,
              channel: ch,
              transcript: tx
            });
          } else {
            failed.push({
              videoId: v.id,
              title: v.title,
              channel: ch,
              reason: tx.error || 'transcript_failed',
              attempts: tx.attempts
            });
          }
        }
      } catch (err) {
        failed.push({ channel: ch, reason: 'channel_collect_error', detail: err.message });
      }

      this.progressCallback({
        stage: 'channel_done',
        current: i + 1,
        total: channels.length,
        videosSoFar: allVideos.length,
        transcriptsSoFar: allTranscripts.length,
        failedSoFar: failed.length
      });
    }

    this.progressCallback({ stage: 'complete', videos: allVideos.length, transcripts: allTranscripts.length, failed: failed.length });

    return {
      videos: allVideos,
      transcripts: allTranscripts,
      failed: failed
    };
  }

  async extractTranscript(videoUrl, durationMinutes = 0) {
    return runPython(['transcript', videoUrl, String(durationMinutes)]);
  }

  async validateTranscript(transcript, videoDurationMinutes) {
    if (!transcript || !transcript.text) {
      return { valid: false, score: 0, reason: 'no_text' };
    }
    const text = transcript.text;
    const length = text.length;
    const checks = {
      lengthRatio: length / Math.max(videoDurationMinutes, 1),
      hasContent: length > 100,
      hasStockTerms: /\b(VNINDEX|FPT|VCB|HPG|GAS|VHM|MSN|SAB|GVR|MWG|PLX|VIC|TCB|MBB|ACB|VPB|SSB|TPB|cổ phiếu|thị trường|ngành|tăng trưởng|lợi nhuận|EPS|P\/E|P\/B|ROE)\b/i.test(text),
      hasParagraphs: text.includes('\n\n') || length > 500
    };
    let score = 0;
    if (checks.hasContent) score += 0.3;
    if (checks.hasStockTerms) score += 0.3;
    if (checks.hasParagraphs) score += 0.2;
    if (checks.lengthRatio > 50) score += 0.2;
    const valid = score >= 0.5;
    return {
      valid,
      score: Math.round(score * 100) / 100,
      checks,
      action: valid ? 'accept' : 'fallback_to_whisper'
    };
  }
}

module.exports = { YouTubeWorker, DEFAULT_CHANNELS };
