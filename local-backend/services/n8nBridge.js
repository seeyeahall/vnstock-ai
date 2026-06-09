import { v4 as uuidv4 } from 'uuid';
import db from '../db.js';

class N8nBridge {
  constructor() {
    this.loadConfig();
  }

  loadConfig() {
    const rows = db.prepare("SELECT * FROM settings WHERE key LIKE 'n8n_%'").all();
    this.config = {
      enabled: false,
      webhookUrl: '',
      apiKey: '',
      fallbackMode: 'local'
    };
    for (const r of rows) {
      if (r.key === 'n8n_enabled') this.config.enabled = r.value === 'true' || r.value === '1';
      if (r.key === 'n8n_webhook_url') this.config.webhookUrl = r.value || '';
      if (r.key === 'n8n_api_key') this.config.apiKey = r.value || '';
      if (r.key === 'n8n_fallback_mode') this.config.fallbackMode = r.value || 'local';
    }
  }

  isConfigured() {
    this.loadConfig(); // Reload from DB each time
    return this.config.enabled && this.config.webhookUrl && this.config.apiKey;
  }

  async sendTask(taskType, payload) {
    if (!this.isConfigured()) {
      return { success: false, error: 'n8n not configured' };
    }

    const taskId = uuidv4();
    const callbackUrl = 'http://localhost:3004/api/n8n/callback';

    // Record task in agent_tasks table
    db.prepare(
      `INSERT INTO agent_tasks (task_id, agent_name, status, progress, input_params, started_at)
       VALUES (?, ?, ?, ?, ?, datetime('now'))`
    ).run(taskId, `n8n_${taskType}`, 'pending', 0, JSON.stringify({ taskType, payload }));

    try {
      const startTime = Date.now();
      const response = await fetch(this.config.webhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-API-Key': this.config.apiKey
        },
        body: JSON.stringify({
          taskType,
          payload,
          callbackUrl,
          taskId
        })
      });

      const latency = Date.now() - startTime;

      if (!response.ok) {
        const errorMsg = `HTTP ${response.status}: ${response.statusText}`;
        db.prepare(
          `UPDATE agent_tasks SET status = ?, error_message = ?, completed_at = datetime('now') WHERE task_id = ?`
        ).run('failed', errorMsg, taskId);
        return { success: false, error: errorMsg, taskId, fallback: this.config.fallbackMode };
      }

      const result = await response.json().catch(() => ({}));
      
      // Update task to running (n8n is processing)
      db.prepare(
        `UPDATE agent_tasks SET status = ?, output_data = ? WHERE task_id = ?`
      ).run('running', JSON.stringify(result), taskId);

      return { success: true, result, taskId, latency };
    } catch (error) {
      db.prepare(
        `UPDATE agent_tasks SET status = ?, error_message = ?, completed_at = datetime('now') WHERE task_id = ?`
      ).run('failed', error.message, taskId);
      return { success: false, error: error.message, taskId, fallback: this.config.fallbackMode };
    }
  }

  async receiveResult(webhookData) {
    const { taskId, result, error, status } = webhookData || {};

    if (!taskId) {
      return { success: false, error: 'taskId required' };
    }

    const task = db.prepare('SELECT * FROM agent_tasks WHERE task_id = ?').get(taskId);
    if (!task) {
      return { success: false, error: 'Task not found' };
    }

    const newStatus = status || (error ? 'failed' : 'success');
    
    db.prepare(
      `UPDATE agent_tasks 
       SET status = ?, output_data = ?, error_message = ?, completed_at = datetime('now'), progress = ?
       WHERE task_id = ?`
    ).run(
      newStatus,
      result ? JSON.stringify(result) : null,
      error || null,
      newStatus === 'success' ? 100 : (task.progress || 0),
      taskId
    );

    return { success: true, taskId, result, status: newStatus };
  }

  async testConnection() {
    if (!this.isConfigured()) {
      return { connected: false, latency: null, error: 'n8n not configured' };
    }

    try {
      const startTime = Date.now();
      const response = await fetch(this.config.webhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-API-Key': this.config.apiKey
        },
        body: JSON.stringify({
          taskType: 'health_check',
          payload: { ping: true, timestamp: new Date().toISOString() },
          callbackUrl: 'http://localhost:3004/api/n8n/callback',
          taskId: uuidv4()
        })
      });

      const latency = Date.now() - startTime;

      if (!response.ok) {
        return { connected: false, latency, error: `HTTP ${response.status}: ${response.statusText}` };
      }

      await response.json().catch(() => ({}));
      return { connected: true, latency, error: null };
    } catch (error) {
      return { connected: false, latency: null, error: error.message };
    }
  }

  async getTaskStatus(taskId) {
    const task = db.prepare('SELECT * FROM agent_tasks WHERE task_id = ?').get(taskId);
    if (!task) {
      return { success: false, error: 'Task not found' };
    }
    return {
      success: true,
      taskId: task.task_id,
      status: task.status,
      result: task.output_data ? JSON.parse(task.output_data) : null,
      error: task.error_message,
      progress: task.progress,
      startedAt: task.started_at,
      completedAt: task.completed_at
    };
  }
}

export const n8nBridge = new N8nBridge();
