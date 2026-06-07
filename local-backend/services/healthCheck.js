import { exec } from 'child_process';
import { promisify } from 'util';
import { readFileSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const execAsync = promisify(exec);
const __dirname = dirname(fileURLToPath(import.meta.url));

let registry = {};
try {
  registry = JSON.parse(readFileSync(join(__dirname, '..', 'config', 'api_registry.json'), 'utf-8'));
} catch (e) {
  console.log('[HealthCheck] Registry load error:', e.message);
}

async function checkApiHealth(provider) {
  const config = registry[provider];
  if (!config) {
    return { provider, status: 'unknown', error: 'Not in registry' };
  }

  const start = Date.now();
  try {
    if (provider === 'email') {
      // Email health: try SMTP connection via Python
      const { stdout, stderr } = await execAsync(
        `python -c "import smtplib; s=smtplib.SMTP('smtp.gmail.com',587); s.starttls(); s.quit(); print('OK')"`,
        { timeout: 10000 }
      );
      const latency = Date.now() - start;
      return {
        provider,
        status: 'healthy',
        latency_ms: latency,
        quota_remaining: config.rpd_limit || 0,
        message: 'SMTP connection OK'
      };
    }

    if (provider === 'ollama') {
      const { stdout } = await execAsync(
        `curl -s -o /dev/null -w "%{http_code}" "${config.health_url}"`,
        { timeout: 5000 }
      );
      const latency = Date.now() - start;
      const ok = stdout.trim() === '200';
      return {
        provider,
        status: ok ? 'healthy' : 'unhealthy',
        latency_ms: latency,
        quota_remaining: ok ? 100 : 0,
        message: ok ? 'Ollama local server reachable' : 'Ollama not running on :11434'
      };
    }

    // Generic HTTP health check
    const { stdout } = await execAsync(
      `curl -s -o /dev/null -w "%{http_code},%{time_total}" "${config.health_url}"`,
      { timeout: 15000 }
    );
    const latency = Date.now() - start;
    const [httpCode, timeTotal] = stdout.trim().split(',');
    const code = parseInt(httpCode, 10);
    const ok = code >= 200 && code < 400;

    return {
      provider,
      status: ok ? 'healthy' : 'unhealthy',
      latency_ms: latency,
      quota_remaining: ok ? (config.rpd_limit || 100) : 0,
      http_code: code,
      message: ok ? `${provider} API reachable` : `${provider} returned HTTP ${code}`
    };
  } catch (error) {
    return {
      provider,
      status: 'unhealthy',
      latency_ms: Date.now() - start,
      quota_remaining: 0,
      error: error.message
    };
  }
}

async function checkAllHealth() {
  const providers = Object.keys(registry);
  const results = {};
  for (const p of providers) {
    results[p] = await checkApiHealth(p);
  }
  return results;
}

export { checkApiHealth, checkAllHealth };
