import { get } from 'https';
import { get as httpGet } from 'http';
import { readFileSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

function loadRegistry() {
  try {
    return JSON.parse(readFileSync(join(__dirname, '..', 'config', 'api_registry.json'), 'utf-8'));
  } catch (e) {
    console.log('[HealthCheck] Registry load error:', e.message);
    return {};
  }
}

let registry = loadRegistry();

function httpRequest(url, timeout = 15000) {
  return new Promise((resolve, reject) => {
    const start = Date.now();
    const client = url.startsWith('https:') ? get : httpGet;
    const req = client(url, { timeout }, (res) => {
      const latency = Date.now() - start;
      resolve({ statusCode: res.statusCode, latency });
    });
    req.on('error', (err) => reject(err));
    req.on('timeout', () => {
      req.destroy();
      reject(new Error('Request timeout'));
    });
  });
}

async function checkApiHealth(provider) {
  // Reload registry each time to pick up changes
  const currentRegistry = loadRegistry();
  const config = currentRegistry[provider];
  if (!config) {
    return { provider, status: 'unknown', error: 'Not in registry' };
  }

  const start = Date.now();
  try {
    if (provider === 'email') {
      // Email health: try SMTP connection via Node.js net
      const { createConnection } = await import('net');
      await new Promise((resolve, reject) => {
        const socket = createConnection(587, 'smtp.gmail.com', () => {
          socket.end();
          resolve();
        });
        socket.on('error', reject);
        socket.setTimeout(10000, () => {
          socket.destroy();
          reject(new Error('SMTP timeout'));
        });
      });
      const latency = Date.now() - start;
      return {
        provider,
        status: 'healthy',
        latency_ms: latency,
        quota_remaining: config.rpd_limit || 0,
        message: 'SMTP connection OK'
      };
    }

    // Generic HTTP health check
    const { statusCode, latency } = await httpRequest(config.health_url, 15000);
    const ok = statusCode >= 200 && statusCode < 400;

    return {
      provider,
      status: ok ? 'healthy' : 'unhealthy',
      latency_ms: latency,
      quota_remaining: ok ? (config.rpd_limit || 100) : 0,
      http_code: statusCode,
      message: ok ? `${provider} API reachable` : `${provider} returned HTTP ${statusCode}`
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
  // Reload registry each time to pick up changes
  registry = loadRegistry();
  const providers = Object.keys(registry);
  const results = {};
  for (const p of providers) {
    results[p] = await checkApiHealth(p);
  }
  return results;
}

export { checkApiHealth, checkAllHealth };
