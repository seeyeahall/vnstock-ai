import { checkApiHealth } from './healthCheck.js';
import { readFileSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

let registry = {};
try {
  registry = JSON.parse(readFileSync(join(__dirname, '..', 'config', 'api_registry.json'), 'utf-8'));
} catch (e) {
  console.log('[Router9] Registry load error:', e.message);
}

class Router9 {
  constructor() {
    this.fallbackChain = ['gemini', 'groq', 'openrouter', 'ollama'];
    this.auditLog = [];
  }

  async selectProvider(task = {}, preferred = 'gemini') {
    const candidates = [preferred, ...this.fallbackChain.filter(p => p !== preferred)];
    const selected = [];

    for (const provider of candidates) {
      const health = await checkApiHealth(provider);
      const cfg = registry[provider];
      if (!cfg) continue;
      const quotaMin = 20; // minimum % quota to consider usable

      if (health.status === 'healthy') {
        const quotaRemaining = health.quota_remaining || 0;
        const quotaPercent = cfg.rpd_limit > 0 ? Math.round((quotaRemaining / cfg.rpd_limit) * 100) : 100;

        if (quotaPercent > quotaMin || cfg.rpd_limit === 0) {
          selected.push({ provider, health, quotaPercent, priority: cfg.priority || 99 });
        }
      }
    }

    // Sort by priority then quota
    selected.sort((a, b) => {
      if (a.priority !== b.priority) return a.priority - b.priority;
      return b.quotaPercent - a.quotaPercent;
    });

    if (selected.length === 0) {
      const err = new Error('No available AI provider');
      this.auditLog.push({ timestamp: new Date().toISOString(), task, error: err.message });
      throw err;
    }

    const choice = selected[0];
    this.auditLog.push({
      timestamp: new Date().toISOString(),
      task,
      selected: choice.provider,
      candidates: selected.map(s => ({ provider: s.provider, quotaPercent: s.quotaPercent, latency_ms: s.health.latency_ms })),
      fallback_used: choice.provider !== preferred
    });

    // Keep audit log bounded
    if (this.auditLog.length > 1000) this.auditLog = this.auditLog.slice(-500);

    return choice.provider;
  }

  getAuditLog(limit = 50) {
    return this.auditLog.slice(-limit);
  }
}

const router9 = new Router9();

export { Router9, router9 };
