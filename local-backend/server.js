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
import { notebooklmSync } from './services/notebooklmSync.js';
import { notebooklmAudio } from './services/notebooklmAudio.js';

import { chatEngine } from './services/chatEngine.js';

import { workflowRunner } from './services/workflowRunner.js';

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

// ── Chat AI Engine ──
app.post('/api/chat/message', async (req, res) => {
  const { sessionId, message, context } = req.body;
  const sid = sessionId || uuidv4();
  
  if (!message) {
    return res.status(400).json({ success: false, error: 'message required' });
  }
  
  try {
    const result = await chatEngine.processMessage(sid, message, context || {});
    res.json(result);
  } catch (e) {
    console.error('[ChatEngine Error]', e.message);
    // Fallback: save message and return generic response
    db.prepare(
      'INSERT INTO chat_history (session_id, role, content) VALUES (?, ?, ?)'
    ).run(sid, 'user', message);
    db.prepare(
      'INSERT INTO chat_history (session_id, role, content) VALUES (?, ?, ?)'
    ).run(sid, 'assistant', 'Xin lỗi, tôi gặp lỗi khi xử lý. Vui lòng thử lại!');
    res.json({
      success: true,
      content: 'Xin lỗi, tôi gặp lỗi khi xử lý. Vui lòng thử lại!',
      sessionId: sid,
      actions: []
    });
  }
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

// ── Viber Webhook ──
app.post('/api/viber/webhook', async (req, res) => {
  res.json({ ok: true });
  const msg = req.body?.message;
  if (!msg) return;
  const userId = msg.sender?.id;
  const text = msg.text || '';
  
  try {
    const result = await chatEngine.processMessage(`viber_${userId}`, text);
    // Send response back via Viber API (requires Viber bot token)
    // For now, log the response
    console.log('[Viber Response]', userId, result.content);
  } catch (e) {
    console.error('[Viber Webhook Error]', e.message);
  }
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
  db.prepare(`INSERT OR REPLACE INTO settings (key, value, updated_at) VALUES (?, ?, datetime('now'))`)
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
  db.prepare(`INSERT OR REPLACE INTO api_keys (provider, api_key, status, last_tested) VALUES (?, ?, ?, datetime('now'))`)
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
    db.prepare(`INSERT OR REPLACE INTO api_keys (provider, api_key, last_tested) VALUES (?, ?, datetime('now'))`)
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
  const { status } = req.query;
  let rows;
  if (status) {
    rows = db.prepare('SELECT * FROM agent_tasks WHERE status = ? ORDER BY created_at DESC').all(status);
  } else {
    rows = db.prepare('SELECT * FROM agent_tasks ORDER BY created_at DESC LIMIT 200').all();
  }
  res.json({ success: true, data: rows });
});

app.post('/api/agent-tasks', (req, res) => {
  const { task_id, task_type, status, payload, result, error } = req.body;
  const tid = task_id || uuidv4();
  const resultDb = db.prepare(
    `INSERT INTO agent_tasks (task_id, task_type, status, payload, result, error)
     VALUES (?, ?, ?, ?, ?, ?)`
  ).run(tid, task_type || 'generic', status || 'pending', payload ? JSON.stringify(payload) : null, result ? JSON.stringify(result) : null, error || null);
  res.json({ success: true, task_id: tid, id: resultDb.lastInsertRowid });
});

// ── Workflow (Full Pipeline) ──
app.post('/api/workflow/run', async (req, res) => {
  const { workflow_id, template_id, inputs, skip_precheck } = req.body;
  const wid = workflow_id || uuidv4();
  
  // Start workflow asynchronously
  workflowRunner.run(wid, template_id || 'daily_brief', inputs || {}, { skipPrecheck: skip_precheck })
    .then(result => {
      console.log(`[Workflow] ${wid} completed:`, result.success ? 'SUCCESS' : 'FAILED');
    })
    .catch(err => {
      console.error(`[Workflow] ${wid} error:`, err.message);
    });

  res.json({ 
    success: true, 
    workflow_id: wid, 
    status: 'running', 
    message: 'Workflow started. Use /api/workflow/status to poll progress.',
    poll_url: `/api/workflow/status?workflow_id=${wid}`
  });
});

app.get('/api/workflow/status', async (req, res) => {
  const { workflow_id } = req.query;
  if (!workflow_id) {
    const rows = await stateManager.listStates();
    const active = workflowRunner.getActiveWorkflows();
    return res.json({ success: true, data: rows, active });
  }
  const state = await stateManager.resumeState(workflow_id);
  const active = workflowRunner.getActiveWorkflows().find(w => w.workflowId === workflow_id);
  res.json({ success: true, ...state, active: active || null });
});

app.post('/api/workflow/cancel', async (req, res) => {
  const { workflow_id } = req.body;
  if (!workflow_id) return res.status(400).json({ success: false, error: 'workflow_id required' });
  const result = await workflowRunner.cancelWorkflow(workflow_id);
  res.json(result);
});

// ── Dashboard Status ──
app.get('/api/dashboard/status', async (req, res) => {
  const health = await checkAllHealth();
  const activeWorkflows = workflowRunner.getActiveWorkflows();
  const recentReports = db.prepare('SELECT report_id, template, market_regime, created_at FROM reports ORDER BY created_at DESC LIMIT 5').all();
  const recentTasks = db.prepare('SELECT task_id, task_type, status, created_at FROM agent_tasks ORDER BY created_at DESC LIMIT 10').all();
  
  // Check API key configuration status
  const apiKeys = db.prepare('SELECT provider, api_key, status FROM api_keys').all();
  const apiStatus = {};
  for (const key of apiKeys) {
    apiStatus[key.provider] = {
      configured: !!(key.api_key && key.api_key.length > 10 && !key.api_key.includes('YOUR_')),
      status: key.status,
      last_tested: key.last_tested
    };
  }
  
  // Gemini is most important
  const geminiConfigured = apiStatus.gemini?.configured || false;
  const geminiHealthy = health.gemini?.status === 'healthy';
  
  res.json({
    success: true,
    system: {
      version: '3.0.0',
      backend: 'online',
      timestamp: new Date().toISOString()
    },
    api: {
      health,
      apiStatus,
      gemini: {
        configured: geminiConfigured,
        healthy: geminiHealthy,
        critical: true, // Gemini is most important
        message: !geminiConfigured 
          ? '⚠️ Gemini API key chưa cấu hình. Vào Settings → API Keys để thêm.' 
          : !geminiHealthy 
            ? '⚠️ Gemini API key đã cấu hình nhưng không kết nối được. Kiểm tra lại key.' 
            : '✅ Gemini OK'
      }
    },
    workflows: {
      active: activeWorkflows.length,
      active_list: activeWorkflows,
      recent: recentReports
    },
    agents: {
      recent_tasks: recentTasks
    }
  });
});

// ── API Key Test ──
app.post('/api/test-api-key', async (req, res) => {
  const { provider, api_key } = req.body;
  if (!provider) return res.status(400).json({ success: false, error: 'provider required' });
  
  // Update key in DB if provided
  if (api_key) {
    db.prepare(`INSERT OR REPLACE INTO api_keys (provider, api_key, last_tested) VALUES (?, ?, datetime('now'))`)
      .run(provider, api_key);
  }
  
  // Test the provider
  const result = await checkApiHealth(provider);
  
  // Update status in DB
  const dbStatus = result.status === 'healthy' ? 'ok' : result.status === 'unhealthy' ? 'error' : 'unknown';
  db.prepare(`UPDATE api_keys SET status = ?, latency_ms = ?, last_tested = datetime('now') WHERE provider = ?`)
    .run(dbStatus, result.latency_ms || 0, provider);
  
  res.json({
    success: true,
    provider,
    status: result.status,
    latency_ms: result.latency_ms,
    quota_remaining: result.quota_remaining,
    error: result.error || null,
    message: result.status === 'healthy' 
      ? `✅ ${provider} OK (${result.latency_ms}ms)` 
      : `❌ ${provider} failed: ${result.error || 'Unknown error'}`
  });
});

app.get('/api/test-all-keys', async (req, res) => {
  const providers = ['gemini', 'groq', 'openrouter', 'telegram', 'email'];
  const results = {};
  
  for (const provider of providers) {
    try {
      const result = await checkApiHealth(provider);
      results[provider] = {
        status: result.status,
        latency_ms: result.latency_ms,
        quota_remaining: result.quota_remaining,
        error: result.error || null
      };
      
      // Update DB - map health status to DB status
      const dbStatus = result.status === 'healthy' ? 'ok' : result.status === 'unhealthy' ? 'error' : 'unknown';
      db.prepare(`UPDATE api_keys SET status = ?, latency_ms = ?, last_tested = datetime('now') WHERE provider = ?`)
        .run(dbStatus, result.latency_ms || 0, provider);
    } catch (e) {
      results[provider] = { status: 'error', error: e.message };
    }
  }
  
  const allHealthy = Object.values(results).every(r => r.status === 'healthy');
  const geminiOk = results.gemini?.status === 'healthy';
  
  res.json({
    success: true,
    all_healthy: allHealthy,
    gemini_ok: geminiOk,
    can_run_workflow: geminiOk, // Gemini is required for workflow
    results,
    message: !geminiOk 
      ? '⚠️ Gemini API chưa sẵn sàng. Workflow cần Gemini để chạy AI analysis.' 
      : allHealthy 
        ? '✅ Tất cả API đã sẵn sàng!' 
        : '⚠️ Một số API chưa sẵn sàng nhưng vẫn có thể chạy workflow.'
  });
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

// ── Static Files (Frontend) ──
app.use(express.static(join(__dirname, '..', 'dist')));

// ── Start Server ──
app.listen(PORT, () => {
  console.log(`[Server] VNStock AI v3.0 running on http://localhost:${PORT}`);
});