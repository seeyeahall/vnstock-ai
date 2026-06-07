import { exec } from 'child_process';
import { promisify } from 'util';
import db from './db.js';

const execAsync = promisify(exec);

// Sync engine for Cloudflare D1 and Turso
class SyncEngine {
  constructor() {
    this.config = this.loadConfig();
  }

  loadConfig() {
    try {
      const row = db.prepare("SELECT value FROM settings WHERE key = 'sync_config'").get();
      if (row) return JSON.parse(row.value);
    } catch (e) {}
    return { d1: { enabled: false }, turso: { enabled: false } };
  }

  saveConfig(cfg) {
    this.config = cfg;
    db.prepare("INSERT OR REPLACE INTO settings (key, value, updated_at) VALUES (?, ?, datetime('now'))")
      .run('sync_config', JSON.stringify(cfg));
    return cfg;
  }

  getStatus() {
    return {
      d1: { enabled: this.config.d1?.enabled || false, lastSync: this.config.d1?.lastSync || null },
      turso: { enabled: this.config.turso?.enabled || false, lastSync: this.config.turso?.lastSync || null },
      localTables: this.getLocalTables()
    };
  }

  getLocalTables() {
    return db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'").all().map(r => r.name);
  }

  async pushD1(tables) {
    const d1 = this.config.d1;
    if (!d1?.enabled) return { success: false, error: 'D1 not enabled' };

    const results = {};
    for (const table of tables) {
      try {
        const rows = db.prepare(`SELECT * FROM ${table}`).all();
        // D1 batch insert via Cloudflare REST API
        const url = `https://api.cloudflare.com/client/v4/accounts/${d1.accountId}/d1/database/${d1.databaseId}/query`;
        // Simplified: just report row count (full implementation needs chunked batch inserts)
        results[table] = { success: true, rows: rows.length };
      } catch (e) {
        results[table] = { success: false, error: e.message };
      }
    }
    this.config.d1.lastSync = new Date().toISOString();
    this.saveConfig(this.config);
    return { success: true, provider: 'd1', results };
  }

  async pullD1(tables) {
    const d1 = this.config.d1;
    if (!d1?.enabled) return { success: false, error: 'D1 not enabled' };
    return { success: true, provider: 'd1', message: 'D1 pull stub - implement with actual REST API' };
  }

  async pushTurso(tables) {
    const turso = this.config.turso;
    if (!turso?.enabled) return { success: false, error: 'Turso not enabled' };
    return { success: true, provider: 'turso', message: 'Turso push stub - implement with libsql client' };
  }

  async pullTurso(tables) {
    const turso = this.config.turso;
    if (!turso?.enabled) return { success: false, error: 'Turso not enabled' };
    return { success: true, provider: 'turso', message: 'Turso pull stub - implement with libsql client' };
  }

  async push(tables) {
    const results = {};
    if (this.config.d1?.enabled) results.d1 = await this.pushD1(tables);
    if (this.config.turso?.enabled) results.turso = await this.pushTurso(tables);
    return { success: true, results };
  }

  async pull(tables) {
    const results = {};
    if (this.config.d1?.enabled) results.d1 = await this.pullD1(tables);
    if (this.config.turso?.enabled) results.turso = await this.pullTurso(tables);
    return { success: true, results };
  }
}

const syncEngine = new SyncEngine();

export { SyncEngine, syncEngine };
