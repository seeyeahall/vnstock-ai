import db from '../db.js';

class StateManager {
  constructor() {
    this.saveInterval = 10; // save every 10% progress
    this.lastSavedProgress = new Map(); // workflowId -> last saved progress
  }

  async saveState(workflowId, state) {
    const { step, progress = 0, data, status = 'running' } = state;
    const lastSaved = this.lastSavedProgress.get(workflowId) || 0;

    // Only save if progress increased by at least saveInterval% or status changed
    const shouldSave = progress >= lastSaved + this.saveInterval || status !== 'running' || progress === 0 || progress === 100;

    if (!shouldSave) {
      return { saved: false, workflowId, progress };
    }

    const stmt = db.prepare(`
      INSERT INTO workflow_states (workflow_id, step, progress, data, status, updated_at)
      VALUES (@workflowId, @step, @progress, @data, @status, datetime('now'))
      ON CONFLICT(workflow_id) DO UPDATE SET
        step = excluded.step,
        progress = excluded.progress,
        data = excluded.data,
        status = excluded.status,
        updated_at = datetime('now')
    `);

    stmt.run({
      workflowId,
      step,
      progress,
      data: typeof data === 'string' ? data : JSON.stringify(data),
      status
    });

    this.lastSavedProgress.set(workflowId, progress);

    return { saved: true, workflowId, progress, step, status };
  }

  async resumeState(workflowId) {
    const row = db.prepare('SELECT * FROM workflow_states WHERE workflow_id = ?').get(workflowId);
    if (!row) {
      return { found: false, workflowId };
    }

    let data = row.data;
    try {
      data = JSON.parse(data);
    } catch (e) {
      // keep as string
    }

    this.lastSavedProgress.set(workflowId, row.progress);

    return {
      found: true,
      workflowId,
      step: row.step,
      progress: row.progress,
      data,
      status: row.status,
      updated_at: row.updated_at,
      created_at: row.created_at
    };
  }

  async listStates(statusFilter = null) {
    let rows;
    if (statusFilter) {
      rows = db.prepare('SELECT workflow_id, step, progress, status, updated_at FROM workflow_states WHERE status = ? ORDER BY updated_at DESC')
        .all(statusFilter);
    } else {
      rows = db.prepare('SELECT workflow_id, step, progress, status, updated_at FROM workflow_states ORDER BY updated_at DESC')
        .all();
    }
    return rows;
  }

  async deleteState(workflowId) {
    db.prepare('DELETE FROM workflow_states WHERE workflow_id = ?').run(workflowId);
    this.lastSavedProgress.delete(workflowId);
    return { deleted: true, workflowId };
  }
}

const stateManager = new StateManager();

export { StateManager, stateManager };
