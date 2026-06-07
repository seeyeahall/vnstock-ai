import { writeFileSync, mkdirSync, existsSync } from 'fs';
import { join } from 'path';
import { dirname } from 'path';
import { fileURLToPath } from 'url';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);
const __dirname = dirname(fileURLToPath(import.meta.url));
const AUDIO_DIR = join(__dirname, '..', 'data', 'audio');

/**
 * NotebookLMAudio — Audio Overview & TTS fallback for NotebookLM.
 *
 * NotebookLM has no public API for requesting or downloading Audio Overview.
 * This service provides:
 * 1. Placeholder methods for Audio Overview (logs actions, returns instructions)
 * 2. MP3 download utility
 * 3. Local TTS fallback using Python scripts or edge-tts
 */
class NotebookLMAudio {
  constructor() {
    this.audioJobs = new Map(); // jobId -> { notebookId, status, createdAt, audioUrl, error }
    this.ensureAudioDir();
  }

  ensureAudioDir() {
    if (!existsSync(AUDIO_DIR)) {
      mkdirSync(AUDIO_DIR, { recursive: true });
    }
  }

  /**
   * Request Audio Overview generation.
   * PLACEHOLDER: NotebookLM has no public API. Logs the action and returns
   * instructions for manual trigger or fallback TTS.
   */
  async requestAudioOverview(notebookId) {
    const jobId = `audio-${Date.now()}`;
    console.log(`[NotebookLMAudio] Placeholder: Requested Audio Overview for notebook ${notebookId}`);

    this.audioJobs.set(jobId, {
      notebookId: notebookId || 'unknown',
      status: 'requested',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      audioUrl: null,
      localPath: null,
      error: null,
    });

    return {
      success: true,
      jobId,
      status: 'requested',
      message: 'Audio Overview request logged. NotebookLM has no public API — trigger manually in NotebookLM UI or use fallback TTS.',
      note: 'Placeholder: In production, this would poll NotebookLM or use a Google Drive webhook.',
      fallback: 'Use POST /api/notebooklm/audio/tts to generate local TTS audio.',
    };
  }

  /**
   * Poll for audio readiness.
   * PLACEHOLDER: Always returns pending since there is no real NotebookLM API.
   */
  async pollAudioStatus(notebookId) {
    console.log(`[NotebookLMAudio] Placeholder: Polling audio status for notebook ${notebookId}`);

    // Find latest job for this notebook
    let latestJob = null;
    for (const job of this.audioJobs.values()) {
      if (job.notebookId === notebookId) {
        if (!latestJob || new Date(job.createdAt) > new Date(latestJob.createdAt)) {
          latestJob = job;
        }
      }
    }

    return {
      success: true,
      ready: false,
      status: latestJob ? latestJob.status : 'unknown',
      message: 'NotebookLM Audio Overview is not available via public API. Manual trigger required in NotebookLM UI.',
      recommendation: 'Use the fallback TTS endpoint or manually download from NotebookLM and use /api/notebooklm/audio/download with a direct URL.',
    };
  }

  /**
   * Download MP3 from a URL to local-backend/data/audio/.
   * @param {string} audioUrl — direct MP3 URL
   * @param {string} outputPath — optional custom path
   * @returns {Object} { success, path? }
   */
  async downloadAudio(audioUrl, outputPath) {
    if (!audioUrl) {
      return { success: false, error: 'No audio URL provided' };
    }

    const filename = `notebooklm_audio_${Date.now()}.mp3`;
    const finalPath = outputPath || join(AUDIO_DIR, filename);

    try {
      const cmd = `curl -sL "${audioUrl}" -o "${finalPath}"`;
      await execAsync(cmd, { timeout: 120000 });

      if (!existsSync(finalPath)) {
        throw new Error('Download failed — file not created');
      }

      console.log(`[NotebookLMAudio] Downloaded audio to ${finalPath}`);
      return { success: true, path: finalPath, filename };
    } catch (error) {
      console.error('[NotebookLMAudio] Download error:', error.message);
      return { success: false, error: error.message };
    }
  }

  /**
   * Generate local TTS audio as fallback.
   * Tries: 1) tts_generator.py  2) edge-tts  3) error with instructions
   * @param {string} text — text to synthesize
   * @param {string} outputPath — optional output path
   * @returns {Object} { success, path?, source? }
   */
  async generateLocalTTS(text, outputPath) {
    if (!text || typeof text !== 'string') {
      return { success: false, error: 'No text provided for TTS' };
    }

    const filename = `tts_fallback_${Date.now()}.mp3`;
    const finalPath = outputPath || join(AUDIO_DIR, filename);

    try {
      // Attempt 1: Python tts_generator.py
      const scriptPath = join(__dirname, '..', 'scripts', 'tts_generator.py');
      if (existsSync(scriptPath)) {
        const escapedText = text.replace(/"/g, '\\"').replace(/\n/g, ' ');
        const cmd = `python "${scriptPath}" --text "${escapedText}" --output "${finalPath}"`;
        await execAsync(cmd, { timeout: 120000 });
        if (existsSync(finalPath)) {
          console.log(`[NotebookLMAudio] TTS generated via Python script: ${finalPath}`);
          return { success: true, path: finalPath, source: 'python_tts' };
        }
      }

      // Attempt 2: edge-tts (pip install edge-tts)
      const escapedText = text.replace(/"/g, '\\"').replace(/\n/g, ' ');
      const edgeCmd = `edge-tts --text "${escapedText}" --write-media "${finalPath}"`;
      try {
        await execAsync(edgeCmd, { timeout: 120000 });
        if (existsSync(finalPath)) {
          console.log(`[NotebookLMAudio] TTS generated via edge-tts: ${finalPath}`);
          return { success: true, path: finalPath, source: 'edge_tts' };
        }
      } catch (e) {
        // edge-tts not available — continue to fallback
      }

      // Attempt 3: Web Speech API fallback (not available in Node, log only)
      console.log(`[NotebookLMAudio] No local TTS engine available. Would generate: ${finalPath}`);
      return {
        success: false,
        error: 'No TTS engine available. Install edge-tts (pip install edge-tts) or provide local-backend/scripts/tts_generator.py.',
        suggestedPath: finalPath,
        instructions: 'Fallback TTS engines: 1) Python tts_generator.py  2) edge-tts CLI  3) Web Speech API (browser-only)',
      };
    } catch (error) {
      console.error('[NotebookLMAudio] TTS error:', error.message);
      return { success: false, error: error.message };
    }
  }

  getJobStatus(jobId) {
    const job = this.audioJobs.get(jobId);
    if (!job) {
      return { success: false, error: 'Job not found' };
    }
    return { success: true, ...job };
  }

  listJobs() {
    const jobs = Array.from(this.audioJobs.entries()).map(([id, job]) => ({ jobId: id, ...job }));
    return { success: true, count: jobs.length, jobs };
  }
}

export const notebooklmAudio = new NotebookLMAudio();
export default NotebookLMAudio;
