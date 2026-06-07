import { checkApiHealth, checkAllHealth } from './healthCheck.js';
import { forecastQuota } from './quotaForecast.js';
import { checkHardware } from './hardwareCheck.js';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

async function checkDependencies() {
  const checks = [
    { name: 'sqlite', cmd: 'node -e "require(\'better-sqlite3\')"' },
    { name: 'python', cmd: 'python --version || python3 --version' },
    { name: 'curl', cmd: 'curl --version' },
    { name: 'git', cmd: 'git --version' }
  ];

  const results = {};
  let allPass = true;

  for (const c of checks) {
    try {
      const { stdout } = await execAsync(c.cmd, { timeout: 5000 });
      results[c.name] = { status: 'PASS', version: stdout.trim().split('\n')[0] };
    } catch (e) {
      results[c.name] = { status: 'FAIL', error: e.message };
      allPass = false;
    }
  }

  return { status: allPass ? 'PASS' : 'FAIL', details: results };
}

async function validateTranscriptConfig() {
  // Check if youtube-transcript-api or yt-dlp is available
  const checks = [
    { name: 'yt_dlp', cmd: 'yt-dlp --version' },
    { name: 'youtube_transcript_api', cmd: 'python -c "import youtube_transcript_api; print(youtube_transcript_api.__version__)"' }
  ];

  const results = {};
  let anyPass = false;

  for (const c of checks) {
    try {
      const { stdout } = await execAsync(c.cmd, { timeout: 5000 });
      results[c.name] = { status: 'PASS', version: stdout.trim() };
      anyPass = true;
    } catch (e) {
      results[c.name] = { status: 'FAIL', error: e.message };
    }
  }

  // At least one transcript method must work
  return {
    status: anyPass ? 'PASS' : 'FAIL',
    details: results,
    fallback_available: anyPass
  };
}

async function runDryRun(workflowConfig = {}) {
  // Simulate a minimal workflow to verify end-to-end connectivity
  const start = Date.now();
  try {
    // Try to write and read a test record to DB
    const dbModule = await import('../db.js');
    const db = dbModule.default;
    const testId = 'dryrun_' + Date.now();
    db.prepare('INSERT INTO workflow_states (workflow_id, step, progress, status) VALUES (?, ?, ?, ?)')
      .run(testId, 'dry_run', 0, 'running');
    const row = db.prepare('SELECT * FROM workflow_states WHERE workflow_id = ?').get(testId);
    db.prepare('DELETE FROM workflow_states WHERE workflow_id = ?').run(testId);

    return {
      status: row ? 'PASS' : 'FAIL',
      db_write_read: row ? 'OK' : 'FAILED',
      latency_ms: Date.now() - start
    };
  } catch (e) {
    return {
      status: 'FAIL',
      error: e.message,
      latency_ms: Date.now() - start
    };
  }
}

async function runPrecheck(workflowConfig = {}) {
  const results = {
    apiHealth: await checkAllHealth(),
    quota: forecastQuota(workflowConfig),
    hardware: await checkHardware(),
    dependencies: await checkDependencies(),
    transcript: await validateTranscriptConfig(),
    dryRun: await runDryRun(workflowConfig)
  };

  // API health: all must be healthy or at least one AI provider healthy
  const aiProviders = ['gemini', 'groq', 'openrouter', 'ollama'];
  const aiHealthy = aiProviders.some(p => results.apiHealth[p]?.status === 'healthy');
  const apiPass = aiHealthy && results.apiHealth.telegram?.status === 'healthy';

  const pass =
    apiPass &&
    results.quota.status !== 'OVERLOAD' &&
    results.hardware.status === 'PASS' &&
    results.dependencies.status === 'PASS' &&
    results.transcript.status === 'PASS' &&
    results.dryRun.status === 'PASS';

  return {
    pass,
    timestamp: new Date().toISOString(),
    results
  };
}

export { runPrecheck, checkDependencies, validateTranscriptConfig, runDryRun };
