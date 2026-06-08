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

    const stateJson = JSON.stringify({
      step,
      progress,
      data: typeof data === 'string' ? data : JSON.stringify(data),
      status,
      updated_at: new Date().toISOString()
    });

    const stmt = db.prepare(`
      INSERT INTO workflow_states (state_id, name, state_json)
      VALUES (?, ?, ?)
      ON CONFLICT(state_id) DO UPDATE SET
        name = excluded.name,
        state_json = excluded.state_json,
        updated_at = datetime('now')
    `);

    stmt.run(workflowId, step || 'unknown', stateJson);

    this.lastSavedProgress.set(workflowId, progress);

    return { saved: true, workflowId, progress, step, status };
  }

  async resumeState(workflowId) {
    const row = db.prepare('SELECT * FROM workflow_states WHERE state_id = ?').get(workflowId);
    if (!row) {
      return { found: false, workflowId };
    }

    let state = {};
    try {
      state = JSON.parse(row.state_json);
    } catch (e) {
      state = { data: row.state_json };
    }

    this.lastSavedProgress.set(workflowId, state.progress || 0);

    return {
      found: true,
      workflowId,
      step: state.step || row.name,
      progress: state.progress || 0,
      data: state.data,
      status: state.status || 'unknown',
      updated_at: row.updated_at,
      created_at: row.created_at
    };
  }

  async listStates(statusFilter = null) {
    const rows = db.prepare('SELECT state_id, name, state_json, updated_at FROM workflow_states ORDER BY updated_at DESC').all();
    return rows.map(row => {
      let state = {};
      try { state = JSON.parse(row.state_json); } catch (e) {}
      return {
        workflow_id: row.state_id,
        step: state.step || row.name,
        progress: state.progress || 0,
        status: state.status || 'unknown',
        updated_at: row.updated_at
      };
    }).filter(r => !statusFilter || r.status === statusFilter);
  }

  async deleteState(workflowId) {
    db.prepare('DELETE FROM workflow_states WHERE state_id = ?').run(workflowId);
    this.lastSavedProgress.delete(workflowId);
    return { deleted: true, workflowId };
  }
}

const stateManager = new StateManager();

export { StateManager, stateManager };
