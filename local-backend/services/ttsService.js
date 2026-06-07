const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

const TTS_SCRIPT = path.join(__dirname, '../scripts/tts_generator.py');

function runPython(args) {
  return new Promise((resolve, reject) => {
    const py = spawn('python', [TTS_SCRIPT, ...args]);
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

class TtsService {
  constructor(config = {}) {
    this.defaultVoice = config.defaultVoice || 'vi-VN-Neural2-A';
    this.fallbackVoice = config.fallbackVoice || 'vi-VN-HoaiMyNeural';
    this.outputDir = config.outputDir || path.join(__dirname, '../data/audio');
    this.maxDurationMinutes = config.maxDurationMinutes || 7;
    fs.mkdirSync(this.outputDir, { recursive: true });
  }

  async generate(text, options = {}) {
    const outputPath = options.outputPath || path.join(this.outputDir, `tts_${Date.now()}.mp3`);
    const preferred = options.method || 'google_cloud';
    const voice = options.voice || this.defaultVoice;

    // Truncate text to target 3-5 minutes (~5000 chars for Vietnamese at normal speed)
    const maxChars = options.maxChars || 5000;
    const truncated = text.length > maxChars ? text.substring(0, maxChars) + '...' : text;

    try {
      const result = await runPython(['generate', truncated, outputPath, preferred]);
      return {
        success: result.success !== false,
        path: result.output_path || outputPath,
        method: result.method || preferred,
        durationEstimate: result.duration_estimate || Math.round(truncated.length * 0.05),
        error: result.error || null
      };
    } catch (err) {
      // Try fallback methods
      const fallbacks = ['edge_tts', 'pyttsx3'];
      for (const fb of fallbacks) {
        try {
          const result = await runPython(['generate', truncated, outputPath, fb]);
          if (result.success !== false) {
            return {
              success: true,
              path: result.output_path || outputPath,
              method: result.method || fb,
              durationEstimate: result.duration_estimate || Math.round(truncated.length * 0.05),
              fallback_from: preferred
            };
          }
        } catch (fbErr) {
          // Continue to next fallback
        }
      }
      return {
        success: false,
        error: err.message,
        path: outputPath
      };
    }
  }

  async generateFromReport(report, options = {}) {
    // Extract text from report parts
    const parts = report.parts || {};
    const texts = [];
    for (const [key, part] of Object.entries(parts)) {
      if (part && part.content) {
        texts.push(part.content);
      }
    }
    const fullText = texts.join('\n\n');
    return this.generate(fullText, options);
  }

  async generateSegments(segments, options = {}) {
    // segments: [{ text, outputName, method }]
    const results = [];
    for (const seg of segments) {
      const out = path.join(this.outputDir, seg.outputName || `seg_${Date.now()}.mp3`);
      const r = await this.generate(seg.text, { ...options, outputPath: out, method: seg.method });
      results.push(r);
    }
    return results;
  }

  async generateBatch(texts, options = {}) {
    const segments = texts.map((t, i) => ({
      text: t,
      outputName: `batch_${i}_${Date.now()}.mp3`
    }));
    return this.generateSegments(segments, options);
  }

  listAudioFiles() {
    try {
      return fs.readdirSync(this.outputDir)
        .filter(f => f.endsWith('.mp3') || f.endsWith('.wav'))
        .map(f => ({
          name: f,
          path: path.join(this.outputDir, f),
          size: fs.statSync(path.join(this.outputDir, f)).size
        }));
    } catch (err) {
      return [];
    }
  }

  deleteAudioFile(filename) {
    const p = path.join(this.outputDir, filename);
    try {
      fs.unlinkSync(p);
      return { success: true };
    } catch (err) {
      return { success: false, error: err.message };
    }
  }
}

module.exports = { TtsService };
