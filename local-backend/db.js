import Database from 'better-sqlite3';
import { existsSync, mkdirSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const DATA_DIR = join(__dirname, 'data');
if (!existsSync(DATA_DIR)) mkdirSync(DATA_DIR, { recursive: true });

const DB_PATH = join(DATA_DIR, 'vnstock-ai.db');
const db = new Database(DB_PATH);
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

// V2 tables
const V2_SCHEMA = `
CREATE TABLE IF NOT EXISTS chat_history (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  session_id TEXT NOT NULL,
  role TEXT NOT NULL CHECK(role IN ('user', 'assistant', 'system')),
  content TEXT NOT NULL,
  intent TEXT,
  metadata TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS reports (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  report_id TEXT UNIQUE NOT NULL,
  template TEXT,
  format TEXT DEFAULT 'html',
  sections TEXT,
  symbols TEXT,
  raw_data_json TEXT,
  analysis_result TEXT,
  html_path TEXT,
  audio_path TEXT,
  excel_path TEXT,
  market_regime TEXT,
  focus_sectors TEXT,
  telegram_sent BOOLEAN DEFAULT 0,
  email_sent BOOLEAN DEFAULT 0,
  notion_sent BOOLEAN DEFAULT 0,
  dashboard_saved BOOLEAN DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS schedules (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  schedule_id TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  cron TEXT NOT NULL,
  template TEXT,
  outputs TEXT,
  enabled BOOLEAN DEFAULT 1,
  last_run DATETIME,
  next_run DATETIME,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS api_keys (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  provider TEXT UNIQUE NOT NULL,
  api_key TEXT NOT NULL,
  status TEXT DEFAULT 'unknown',
  latency_ms INTEGER,
  last_tested DATETIME,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
`;

// V3 new tables
const V3_SCHEMA = `
CREATE TABLE IF NOT EXISTS report_templates (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  template_id TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  sections TEXT,
  output_channels TEXT,
  time_range TEXT,
  sources TEXT,
  schedule TEXT,
  enabled BOOLEAN DEFAULT 1,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS agent_tasks (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  task_id TEXT UNIQUE NOT NULL,
  report_id TEXT,
  agent_name TEXT,
  status TEXT DEFAULT 'pending' CHECK(status IN ('pending', 'running', 'success', 'failed', 'retrying')),
  progress INTEGER DEFAULT 0,
  input_params TEXT,
  output_data TEXT,
  error_message TEXT,
  started_at DATETIME,
  completed_at DATETIME,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS workflow_states (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  workflow_id TEXT UNIQUE NOT NULL,
  step TEXT,
  progress INTEGER DEFAULT 0,
  data TEXT,
  status TEXT DEFAULT 'running' CHECK(status IN ('running', 'paused', 'completed', 'failed')),
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
`;

// Run schema creation
db.exec(V2_SCHEMA);
db.exec(V3_SCHEMA);

// Migration: ensure V2 reports table has new V3 columns
function migrateV2toV3() {
  const columns = db.prepare("PRAGMA table_info(reports)").all();
  const colNames = columns.map(c => c.name);
  const newCols = [
    ['raw_data_json', 'TEXT'],
    ['analysis_result', 'TEXT'],
    ['audio_path', 'TEXT'],
    ['excel_path', 'TEXT'],
    ['market_regime', 'TEXT'],
    ['focus_sectors', 'TEXT'],
    ['notion_sent', 'BOOLEAN DEFAULT 0'],
    ['dashboard_saved', 'BOOLEAN DEFAULT 0']
  ];
  for (const [name, type] of newCols) {
    if (!colNames.includes(name)) {
      db.exec(`ALTER TABLE reports ADD COLUMN ${name} ${type}`);
    }
  }
}

try {
  migrateV2toV3();
} catch (e) {
  console.log('[DB] Migration note:', e.message);
}

// Seed default templates
const DEFAULT_TEMPLATES = [
  {
    template_id: 'daily_brief',
    name: 'Báo cáo hàng ngày',
    sections: JSON.stringify([{ id: 'macro', enabled: true, order: 1 }, { id: 'sentiment', enabled: true, order: 2 }, { id: 'watchlist', enabled: true, order: 3 }]),
    output_channels: JSON.stringify({ telegram: ['macro', 'sentiment'], email: ['all'] }),
    time_range: '1d',
    sources: JSON.stringify(['youtube', 'stock', 'rss']),
    schedule: JSON.stringify(['07:00', '20:00'])
  },
  {
    template_id: 'weekly_deep',
    name: 'Báo cáo chuyên sâu tuần',
    sections: JSON.stringify([
      { id: 'macro', enabled: true, order: 1 },
      { id: 'sector', enabled: true, order: 2 },
      { id: 'stock', enabled: true, order: 3 },
      { id: 'chart', enabled: true, order: 4 },
      { id: 'sentiment', enabled: true, order: 5 },
      { id: 'insight', enabled: true, order: 6 },
      { id: 'watchlist', enabled: true, order: 7 }
    ]),
    output_channels: JSON.stringify({ email: ['all'], dashboard: ['all'] }),
    time_range: '1w',
    sources: JSON.stringify(['youtube', 'stock', 'rss']),
    schedule: null
  },
  {
    template_id: 'youtube_only',
    name: 'Tổng hợp YouTube',
    sections: JSON.stringify([{ id: 'macro', enabled: true, order: 1 }, { id: 'sentiment', enabled: true, order: 2 }, { id: 'audio', enabled: true, order: 3 }]),
    output_channels: JSON.stringify({ telegram: ['macro', 'audio'] }),
    time_range: '1d',
    sources: JSON.stringify(['youtube']),
    schedule: null
  }
];

const insertTemplate = db.prepare(`
  INSERT OR IGNORE INTO report_templates (template_id, name, sections, output_channels, time_range, sources, schedule)
  VALUES (@template_id, @name, @sections, @output_channels, @time_range, @sources, @schedule)
`);

for (const t of DEFAULT_TEMPLATES) {
  insertTemplate.run(t);
}

// Seed default API keys from registry
import { readFileSync } from 'fs';
const registryPath = join(__dirname, 'config', 'api_registry.json');
try {
  const registry = JSON.parse(readFileSync(registryPath, 'utf-8'));
  const insertKey = db.prepare(`INSERT OR IGNORE INTO api_keys (provider, api_key, status) VALUES (?, ?, 'unknown')`);
  for (const [provider, config] of Object.entries(registry)) {
    insertKey.run(provider, config.api_key || '');
  }
} catch (e) {
  console.log('[DB] Registry seed note:', e.message);
}

console.log('[DB] SQLite initialized at', DB_PATH);
console.log('[DB] Tables:', db.prepare("SELECT name FROM sqlite_master WHERE type='table'").all().map(r => r.name).join(', '));

export default db;
