import express from 'express';
import cors from 'cors';
import { exec } from 'child_process';
import { promisify } from 'util';
import { readFileSync, writeFileSync, existsSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';
import { v4 as uuidv4 } from 'uuid';
import cron from 'node-cron';

import db from './db.js';
import { syncEngine } from './sync.js';
import { checkApiHealth, checkAllHealth } from './services/healthCheck.js';
import { runPrecheck } from './services/precheckEngine.js';
import { router9 } from './services/router9.js';
import { stateManager } from './services/stateManager.js';
import { n8nBridge } from './services/n8nBridge.js';

const execAsync = promisify(exec);
const __dirname = dirname(fileURLToPath(import.meta.url));
const app = express();
const PORT = 3004;

app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// ── Health ──
app.get('/api/health', (req, res) => {
  res.json({ success: true, status: 'ok', version: '3.0.0', timestamp: new Date().toISOString() });
});

app.get('/api/health/all', async (req, res) => {
  const results = await checkAllHealth();
  res.json({ success: true, results });
});

app.get('/api/health/:provider', async (req, res) => {
  const result = await checkApiHealth(req.params.provider);
  res.json({ success: true, result });
});

// ── Chat ──
app.post('/api/chat/message', (req, res) => {
  const { sessionId, role, content, intent, metadata } = req.body;
  const sid = sessionId || uuidv4();
  db.prepare(
    'INSERT INTO chat_history (session_id, role, content, intent, metadata) VALUES (?, ?, ?, ?, ?)'
  ).run(sid, role || 'user', content || '', intent || null, metadata ? JSON.stringify(metadata) : null);
  res.json({ success: true, sessionId: sid });
});

app.get('/api/chat/history', (req, res) => {
  const { sessionId, limit = 50 } = req.query;
  let rows;
  if (sessionId) {
    rows = db.prepare('SELECT * FROM chat_history WHERE session_id = ? ORDER BY created_at DESC LIMIT ?')
      .all(sessionId, parseInt(limit, 10));
  } else {
    rows = db.prepare('SELECT * FROM chat_history ORDER BY created_at DESC LIMIT ?')
      .all(parseInt(limit, 10));
  }
  res.json({ success: true, data: rows });
});

// ── DB Settings ──
app.get('/api/db/settings', (req, res) => {
  const rows = db.prepare('SELECT * FROM settings').all();
  const obj = {};
  for (const r of rows) obj[r.key] = r.value;
  res.json({ success: true, data: obj });
});

app.post('/api/db/settings', (req, res) => {
  const { key, value } = req.body;
  if (!key) return res.status(400).json({ success: false, error: 'key required' });
  db.prepare('INSERT OR REPLACE INTO settings (key, value, updated_at) VALUES (?, ?, datetime("now"))')
    .run(key, typeof value === 'string' ? value : JSON.stringify(value));
  res.json({ success: true });
});

// ── DB Chat (alias for history with CRUD) ──
app.get('/api/db/chat', (req, res) => {
  const rows = db.prepare('SELECT * FROM chat_history ORDER BY created_at DESC LIMIT 100').all();
  res.json({ success: true, data: rows });
});

app.post('/api/db/chat', (req, res) => {
  const { session_id, role, content, intent, metadata } = req.body;
  const result = db.prepare(
    'INSERT INTO chat_history (session_id, role, content, intent, metadata) VALUES (?, ?, ?, ?, ?)'
  ).run(session_id || uuidv4(), role || 'user', content || '', intent || null, metadata ? JSON.stringify(metadata) : null);
  res.json({ success: true, id: result.lastInsertRowid });
});

// ── DB Reports ──
app.get('/api/db/reports', (req, res) => {
  const rows = db.prepare('SELECT * FROM reports ORDER BY created_at DESC LIMIT 100').all();
  res.json({ success: true, data: rows });
});

app.post('/api/db/reports', (req, res) => {
  const { report_id, template, format, sections, symbols, html_path, telegram_sent, email_sent } = req.body;
  const rid = report_id || uuidv4();
  const result = db.prepare(
    `INSERT INTO reports (report_id, template, format, sections, symbols, html_path, telegram_sent, email_sent)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
  ).run(rid, template || null, format || 'html', sections ? JSON.stringify(sections) : null, symbols ? JSON.stringify(symbols) : null, html_path || null, telegram_sent ? 1 : 0, email_sent ? 1 : 0);
  res.json({ success: true, report_id: rid, id: result.lastInsertRowid });
});

// ── DB Schedules ──
app.get('/api/db/schedules', (req, res) => {
  const rows = db.prepare('SELECT * FROM schedules ORDER BY created_at DESC').all();
  res.json({ success: true, data: rows });
});

app.post('/api/db/schedules', (req, res) => {
  const { schedule_id, name, cron: cronExpr, template, outputs, enabled } = req.body;
  const sid = schedule_id || uuidv4();
  const result = db.prepare(
    `INSERT INTO schedules (schedule_id, name, cron, template, outputs, enabled)
     VALUES (?, ?, ?, ?, ?, ?)`
  ).run(sid, name || 'Schedule', cronExpr || '0 7 * * *', template || null, outputs ? JSON.stringify(outputs) : null, enabled !== false ? 1 : 0);
  res.json({ success: true, schedule_id: sid, id: result.lastInsertRowid });
});

// ── DB API Keys ──
app.get('/api/db/keys', (req, res) => {
  const rows = db.prepare('SELECT * FROM api_keys').all();
  res.json({ success: true, data: rows });
});

app.post('/api/db/keys', (req, res) => {
  const { provider, api_key, status } = req.body;
  if (!provider) return res.status(400).json({ success: false, error: 'provider required' });
  db.prepare('INSERT OR REPLACE INTO api_keys (provider, api_key, status, last_tested) VALUES (?, ?, ?, datetime("now"))')
    .run(provider, api_key || '', status || 'unknown');
  res.json({ success: true });
});

// ── Sync ──
app.get('/api/sync/status', (req, res) => {
  res.json({ success: true, data: syncEngine.getStatus() });
});

app.post('/api/sync/config', (req, res) => {
  const cfg = syncEngine.saveConfig(req.body);
  res.json({ success: true, config: cfg });
});

app.post('/api/sync/push', async (req, res) => {
  const { tables } = req.body;
  const result = await syncEngine.push(tables || ['chat_history', 'reports', 'settings', 'schedules', 'api_keys']);
  res.json(result);
});

app.post('/api/sync/pull', async (req, res) => {
  const { tables } = req.body;
  const result = await syncEngine.pull(tables || ['chat_history', 'reports', 'settings', 'schedules', 'api_keys']);
  res.json(result);
});

// ── Email ──
app.post('/api/send-email', async (req, res) => {
  const { to, subject, body, html, attachments } = req.body;
  if (!to || !subject || !body) {
    return res.status(400).json({ success: false, error: 'to, subject, body required' });
  }
  const scriptPath = join(__dirname, 'scripts', 'send_email.py');
  const args = [
    `--to`, to,
    `--subject`, subject,
    `--body`, body,
    ...(html ? [`--html`, html] : []),
    ...(attachments ? attachments.flatMap(a => [`--attachments`, a]) : [])
  ];
  const cmd = `python "${scriptPath}" ${args.map(a => `"${a.replace(/"/g, '\\"')}"`).join(' ')}`;
  try {
    const { stdout, stderr } = await execAsync(cmd, { timeout: 30000 });
    const result = JSON.parse(stdout.trim());
    res.json(result);
  } catch (e) {
    res.status(500).json({ success: false, error: e.message, stderr: e.stderr });
  }
});

// ── Telegram ──
app.post('/api/send-telegram', async (req, res) => {
  const { chat_id, text, parse_mode = 'HTML' } = req.body;
  const token = '7055879874:AAE8PmCuPMMV7uyIiamDBNN5xZgWBctYIVc';
  const cid = chat_id || '6226786681';
  const url = `https://api.telegram.org/bot${token}/sendMessage`;
  try {
    const { stdout } = await execAsync(
      `curl -s -X POST "${url}" -H "Content-Type: application/json" -d "{\\"chat_id\\":\\"${cid}\\",\\"text\\":\\"${text.replace(/"/g, '\\"').replace(/\n/g, '\\n')}\\",\\"parse_mode\\":\\"${parse_mode}\\"}"`,
      { timeout: 15000 }
    );
    const result = JSON.parse(stdout);
    res.json({ success: result.ok, data: result });
  } catch (e) {
    res.status(500).json({ success: false, error: e.message });
  }
});

// ── YouTube Analyze ──
app.post('/api/youtube/analyze', async (req, res) => {
  const { channels, days, max_videos } = req.body;
  const scriptPath = join(__dirname, 'scripts', 'youtube_analyzer.py');
  if (!existsSync(scriptPath)) {
    return res.json({ success: false, error: 'youtube_analyzer.py not found', note: 'Stub endpoint - implement analyzer script' });
  }
  const args = [
    ...(channels ? [`--channels`, JSON.stringify(channels)] : []),
    ...(days ? [`--days`, String(days)] : []),
    ...(max_videos ? [`--max-videos`, String(max_videos)] : [])
  ];
  const cmd = `python "${scriptPath}" ${args.join(' ')}`;
  try {
    const { stdout, stderr } = await execAsync(cmd, { timeout: 120000 });
    res.json({ success: true, output: stdout, stderr });
  } catch (e) {
    res.status(500).json({ success: false, error: e.message, stderr: e.stderr });
  }
});

// ── Precheck ──
app.post('/api/precheck/run', async (req, res) => {
  const result = await runPrecheck(req.body);
  res.json({ success: true, ...result });
});

// ── Registry ──
app.get('/api/registry', (req, res) => {
  try {
    const registry = JSON.parse(readFileSync(join(__dirname, 'config', 'api_registry.json'), 'utf-8'));
    // Mask API keys
    const safe = {};
    for (const [k, v] of Object.entries(registry)) {
      safe[k] = { ...v, api_key: v.api_key ? '***' : '' };
    }
    res.json({ success: true, data: safe });
  } catch (e) {
    res.status(500).json({ success: false, error: e.message });
  }
});

app.post('/api/registry/:provider', (req, res) => {
  const { provider } = req.params;
  const { api_key } = req.body;
  const path = join(__dirname, 'config', 'api_registry.json');
  try {
    const registry = JSON.parse(readFileSync(path, 'utf-8'));
    if (!registry[provider]) return res.status(404).json({ success: false, error: 'Provider not found' });
    if (api_key !== undefined) registry[provider].api_key = api_key;
    writeFileSync(path, JSON.stringify(registry, null, 2));
    // Also update DB
    db.prepare('INSERT OR REPLACE INTO api_keys (provider, api_key, last_tested) VALUES (?, ?, datetime("now"))')
      .run(provider, api_key || '');
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ success: false, error: e.message });
  }
});

// ── Report Templates ──
app.get('/api/report-templates', (req, res) => {
  const rows = db.prepare('SELECT * FROM report_templates ORDER BY created_at DESC').all();
  res.json({ success: true, data: rows });
});

app.post('/api/report-templates', (req, res) => {
  const { template_id, name, sections, output_channels, time_range, sources, schedule, enabled } = req.body;
  if (!name) return res.status(400).json({ success: false, error: 'name required' });
  const tid = template_id || uuidv4();
  const result = db.prepare(
    `INSERT OR REPLACE INTO report_templates (template_id, name, sections, output_channels, time_range, sources, schedule, enabled)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
  ).run(tid, name, sections ? JSON.stringify(sections) : null, output_channels ? JSON.stringify(output_channels) : null, time_range || '1d', sources ? JSON.stringify(sources) : null, schedule ? JSON.stringify(schedule) : null, enabled !== false ? 1 : 0);
  res.json({ success: true, template_id: tid, id: result.lastInsertRowid });
});

// ── Agent Tasks ──
app.get('/api/agent-tasks', (req, res) => {
  const { report_id, status } = req.query;
  let rows;
  if (report_id && status) {
    rows = db.prepare('SELECT * FROM agent_tasks WHERE report_id = ? AND status = ? ORDER BY created_at DESC').all(report_id, status);
  } else if (report_id) {
    rows = db.prepare('SELECT * FROM agent_tasks WHERE report_id = ? ORDER BY created_at DESC').all(report_id);
  } else if (status) {
    rows = db.prepare('SELECT * FROM agent_tasks WHERE status = ? ORDER BY created_at DESC').all(status);
  } else {
    rows = db.prepare('SELECT * FROM agent_tasks ORDER BY created_at DESC LIMIT 200').all();
  }
  res.json({ success: true, data: rows });
});

app.post('/api/agent-tasks', (req, res) => {
  const { task_id, report_id, agent_name, status, progress, input_params, output_data, error_message } = req.body;
  const tid = task_id || uuidv4();
  const result = db.prepare(
    `INSERT OR REPLACE INTO agent_tasks (task_id, report_id, agent_name, status, progress, input_params, output_data, error_message, started_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, datetime("now"))`
  ).run(tid, report_id || null, agent_name || null, status || 'pending', progress || 0, input_params ? JSON.stringify(input_params) : null, output_data ? JSON.stringify(output_data) : null, error_message || null);
  res.json({ success: true, task_id: tid, id: result.lastInsertRowid });
});

// ── Workflow ──
app.post('/api/workflow/run', async (req, res) => {
  const { workflow_id, template_id, inputs } = req.body;
  const wid = workflow_id || uuidv4();
  // Initialize workflow state
  await stateManager.saveState(wid, { step: 'init', progress: 0, data: { template_id, inputs }, status: 'running' });
  res.json({ success: true, workflow_id: wid, status: 'running', message: 'Workflow initialized. Use /api/workflow/status to poll.' });
});

app.get('/api/workflow/status', async (req, res) => {
  const { workflow_id } = req.query;
  if (!workflow_id) {
    // List all workflow states
    const rows = await stateManager.listStates();
    return res.json({ success: true, data: rows });
  }
  const state = await stateManager.resumeState(workflow_id);
  res.json({ success: true, ...state });
});

// ── Telegram Webhook + NLU ──
const TELEGRAM_INTENTS = [
  { name: 'greeting', patterns: ['chào', 'hello', 'hi', 'xin chào', 'hey'] },
  { name: 'help', patterns: ['help', 'hướng dẫn', 'cách dùng', 'trợ giúp'] },
  { name: 'create_report', patterns: ['tạo báo cáo', 'báo cáo', 'report', 'phân tích'] },
  { name: 'check_status', patterns: ['status', 'trạng thái', 'health', 'kiểm tra'] },
  { name: 'test_api', patterns: ['test api', 'kiểm tra api', 'test gemini', 'test groq'] },
  { name: 'set_schedule', patterns: ['cài lịch', 'lịch trình', 'schedule', 'hẹn giờ'] },
  { name: 'get_report', patterns: ['xem báo cáo', 'lấy báo cáo', 'báo cáo đâu', 'report link'] },
  { name: 'thanks', patterns: ['cảm ơn', 'thank', 'thanks', 'ok', 'tuyệt'] },
  { name: 'chat', patterns: [] } // fallback
];

function parseTelegramIntent(text) {
  const lower = (text || '').toLowerCase();
  for (const intent of TELEGRAM_INTENTS) {
    if (intent.patterns.some(p => lower.includes(p))) {
      return intent.name;
    }
  }
  return 'chat';
}

async function executeTelegramIntent(intent, text, chatId) {
  const token = '7055879874:AAE8PmCuPMMV7uyIiamDBNN5xZgWBctYIVc';
  const send = async (msg) => {
    const cmd = `curl -s -X POST "https://api.telegram.org/bot${token}/sendMessage" -H "Content-Type: application/json" -d "{\\"chat_id\\":\\"${chatId}\\",\\"text\\":\\"${msg.replace(/"/g, '\\"').replace(/\n/g, '\\n')}\\",\\"parse_mode\\":\\"HTML\\"}"`;
    await execAsync(cmd, { timeout: 15000 });
  };

  switch (intent) {
    case 'greeting':
      await send('Chào bạn! 👋 Tôi là VNStock AI Bot. Gõ "help" để xem danh sách lệnh.');
      break;
    case 'help':
      await send(`<b>Danh sách lệnh:</b>\n• "tạo báo cáo" - Tạo báo cáo mới\n• "trạng thái" - Kiểm tra hệ thống\n• "test api" - Kiểm tra API\n• "cài lịch 8h" - Đặt lịch chạy\n• "xem báo cáo" - Lấy báo cáo gần nhất`);
      break;
    case 'create_report':
      await send('Đang tạo báo cáo... ⏳ (stub: chưa tích hợp worker thực)');
      break;
    case 'check_status':
      const health = await checkAllHealth();
      const lines = Object.entries(health).map(([k, v]) => `${k}: ${v.status} (${v.latency_ms}ms)`).join('\n');
      await send(`<b>Health Check:</b>\n${lines}`);
      break;
    case 'test_api':
      await send('Kiểm tra API... (dùng /api/health/all trên dashboard để xem chi tiết)');
      break;
    case 'set_schedule':
      await send('Đã nhận yêu cầu cài lịch. (stub: cần UI để cấu hình chi tiết)');
      break;
    case 'get_report':
      const report = db.prepare('SELECT * FROM reports ORDER BY created_at DESC LIMIT 1').get();
      if (report) {
        await send(`Báo cáo gần nhất: ${report.report_id}\nTemplate: ${report.template || 'N/A'}\nNgày: ${report.created_at}`);
      } else {
        await send('Chưa có báo cáo nào.');
      }
      break;
    case 'thanks':
      await send('Không có gì! 😊 Chúc bạn đầu tư thành công!');
      break;
    default:
      // Save to chat history and echo
      db.prepare('INSERT INTO chat_history (session_id, role, content, intent) VALUES (?, ?, ?, ?)')
        .run(`telegram_${chatId}`, 'user', text, intent);
      await send(`Bạn nói: ${text}\n(Intent: ${intent})`);
  }
}

app.post('/api/telegram/webhook', async (req, res) => {
  res.json({ ok: true }); // Ack immediately
  const msg = req.body?.message;
  if (!msg) return;
  const chatId = msg.chat?.id;
  const text = msg.text || '';
  const intent = parseTelegramIntent(text);
  try {
    await executeTelegramIntent(intent, text, chatId);
  } catch (e) {
    console.error('[Telegram Webhook Error]', e.message);
  }
});

// ── 9Router direct endpoint ──
app.post('/api/router/select', async (req, res) => {
  const { task, preferred } = req.body;
  try {
    const provider = await router9.selectProvider(task, preferred);
    res.json({ success: true, provider, audit: router9.getAuditLog(1) });
  } catch (e) {
    res.status(503).json({ success: false, error: e.message });
  }
});

// ── State Manager direct endpoints ──
app.post('/api/state/save', async (req, res) => {
  const { workflow_id, step, progress, data, status } = req.body;
  const result = await stateManager.saveState(workflow_id, { step, progress, data, status });
  res.json({ success: true, ...result });
});

app.get('/api/state/load', async (req, res) => {
  const { workflow_id } = req.query;
  const result = await stateManager.resumeState(workflow_id);
  res.json({ success: true, ...result });
});

// ── n8n Bridge ──
app.post('/api/n8n/send', async (req, res) => {
  const { taskType, payload } = req.body;
  if (!taskType) {
    return res.status(400).json({ success: false, error: 'taskType required' });
  }
  const result = await n8nBridge.sendTask(taskType, payload);
  res.json({ success: result.success, taskId: result.taskId, status: result.success ? 'sent' : 'failed', error: result.error });
});

app.post('/api/n8n/callback', async (req, res) => {
  const result = await n8nBridge.receiveResult(req.body);
  res.json({ success: result.success, taskId: result.taskId, status: result.status });
});

app.get('/api/n8n/status/:taskId', async (req, res) => {
  const result = await n8nBridge.getTaskStatus(req.params.taskId);
  if (!result.success) {
    return res.status(404).json(result);
  }
  res.json(result);
});

app.post('/api/n8n/test', async (req, res) => {
  const { webhookUrl, apiKey } = req.body;
  if (webhookUrl) {
    n8nBridge.config.webhookUrl = webhookUrl;
  }
  if (apiKey) {
    n8nBridge.config.apiKey = apiKey;
  }
  const result = await n8nBridge.testConnection();
  res.json({ success: result.connected, connected: result.connected, latency: result.latency, error: result.error });
});

app.get('/api/n8n/config', (req, res) => {
  const rows = db.prepare("SELECT * FROM settings WHERE key LIKE 'n8n_%'").all();
  const config = { enabled: false, webhookUrl: '', fallbackMode: 'local' };
  for (const r of rows) {
    if (r.key === 'n8n_enabled') config.enabled = r.value === 'true' || r.value === '1';
    if (r.key === 'n8n_webhook_url') config.webhookUrl = r.value || '';
    if (r.key === 'n8n_fallback_mode') config.fallbackMode = r.value || 'local';
  }
  res.json({ success: true, ...config });
});

app.post('/api/n8n/config', (req, res) => {
  const { enabled, webhookUrl, apiKey, fallbackMode } = req.body;
  const settings = [
    { key: 'n8n_enabled', value: enabled !== undefined ? String(enabled) : undefined },
    { key: 'n8n_webhook_url', value: webhookUrl },
    { key: 'n8n_api_key', value: apiKey },
    { key: 'n8n_fallback_mode', value: fallbackMode }
  ];
  for (const s of settings) {
    if (s.value !== undefined) {
      db.prepare('INSERT OR REPLACE INTO settings (key, value, updated_at) VALUES (?, ?, datetime("now"))')
        .run(s.key, s.value);
    }
  }
  // Reload config
  n8nBridge.loadConfig();
  res.json({ success: true });
});

// ── Serve static (fallback for SPA if needed) ──
app.use(express.static(join(__dirname, '..', 'dist')));

// ── Start ──
app.listen(PORT, () => {
  console.log(`[Server] VNStock AI v3.0 backend running on http://localhost:${PORT}`);
  console.log(`[Server] API docs: GET /api/health`);
});

export default app;
