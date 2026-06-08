import { router9 } from './router9.js';
import { stateManager } from './stateManager.js';
import { runPrecheck } from './precheckEngine.js';
import { checkAllHealth } from './healthCheck.js';
import { callGemini, buildAnalysisPrompt, parseAnalysisResponse } from './aiService.js';
import db from '../db.js';

/**
 * Workflow Runner — Chạy full pipeline end-to-end
 * 
 * Pipeline:
 * 1. Precheck Engine (API health, quota, hardware, dependencies)
 * 2. Agent Swarm (YouTube + Stock + News — song song)
 * 3. Data Merge + Validation
 * 4. Adaptive Synthesis (9Router → Gemini/Groq + Meta-Prompt 5 bước)
 * 5. Report Renderer (HTML + Charts + Audio)
 * 6. Delivery (Telegram + Email + Dashboard)
 * 7. State Update + Audit
 */
class WorkflowRunner {
  constructor() {
    this.activeWorkflows = new Map(); // workflowId -> { abortController, status }
  }

  async run(workflowId, templateId, inputs = {}, options = {}) {
    const startTime = Date.now();
    const reportId = `rpt-${Date.now()}`;

    // Initialize workflow tracking
    this.activeWorkflows.set(workflowId, {
      status: 'running',
      step: 'init',
      progress: 0,
      startTime,
      reportId
    });

    try {
      // ── Step 1: Precheck ──
      await this.updateState(workflowId, 'precheck', 5, { reportId, templateId });
      const precheck = await runPrecheck({ templateId, inputs });
      
      if (!precheck.pass && !options.skipPrecheck) {
        // Check if at least Gemini is available (most important)
        const geminiHealth = precheck.results.apiHealth.gemini;
        const groqHealth = precheck.results.apiHealth.groq;
        
        if (geminiHealth?.status !== 'healthy' && groqHealth?.status !== 'healthy') {
          await this.updateState(workflowId, 'failed', 0, { 
            error: 'No AI provider available. Please configure API keys in Settings.',
            precheck: precheck.results 
          });
          return {
            success: false,
            workflowId,
            reportId,
            error: 'Precheck failed: No AI provider available. Configure API keys in Settings → API Keys.',
            precheck: precheck.results,
            duration_ms: Date.now() - startTime
          };
        }
      }

      // ── Step 2: Agent Swarm (Parallel) ──
      await this.updateState(workflowId, 'ingestion', 15, { reportId });
      
      const agentResults = await this.runAgentSwarm(workflowId, templateId, inputs);
      
      if (agentResults.failed > 0 && agentResults.success === 0) {
        await this.updateState(workflowId, 'failed', 15, { 
          error: 'All agents failed. Check agent logs.',
          agentResults 
        });
        return {
          success: false,
          workflowId,
          reportId,
          error: 'Agent Swarm failed: All agents failed.',
          agentResults,
          duration_ms: Date.now() - startTime
        };
      }

      // ── Step 3: Data Merge ──
      await this.updateState(workflowId, 'merge', 35, { reportId });
      const mergedData = this.mergeAgentData(agentResults);

      // ── Step 4: Adaptive Synthesis (AI Analysis) ──
      await this.updateState(workflowId, 'analysis', 50, { reportId });
      const analysis = await this.runAdaptiveSynthesis(workflowId, mergedData, templateId);

      // ── Step 5: Report Renderer ──
      await this.updateState(workflowId, 'render', 75, { reportId });
      const rendered = await this.renderReport(workflowId, reportId, analysis, templateId);

      // ── Step 6: Delivery ──
      await this.updateState(workflowId, 'delivery', 90, { reportId });
      const delivery = await this.deliverReport(workflowId, reportId, rendered, templateId);

      // ── Step 7: Complete ──
      await this.updateState(workflowId, 'completed', 100, { 
        reportId, 
        htmlPath: rendered.htmlPath,
        delivery 
      });

      // Save report to DB
      db.prepare(`
        INSERT INTO reports (report_id, template, format, sections, symbols, raw_data_json, analysis_result, html_path, market_regime, focus_sectors, telegram_sent, email_sent, dashboard_saved)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        reportId,
        templateId,
        'html',
        JSON.stringify(rendered.sections || []),
        JSON.stringify(inputs.symbols || ['VNINDEX']),
        JSON.stringify(mergedData),
        JSON.stringify(analysis),
        rendered.htmlPath || null,
        analysis.marketRegime || 'unknown',
        JSON.stringify(analysis.focusSectors || []),
        delivery.telegram ? 1 : 0,
        delivery.email ? 1 : 0,
        1
      );

      this.activeWorkflows.delete(workflowId);

      return {
        success: true,
        workflowId,
        reportId,
        precheck: precheck.pass,
        agentResults: {
          total: agentResults.total,
          success: agentResults.success,
          failed: agentResults.failed
        },
        analysis: {
          marketRegime: analysis.marketRegime,
          focusSectors: analysis.focusSectors,
          summary: analysis.summary?.substring(0, 200) + '...'
        },
        rendered: {
          htmlPath: rendered.htmlPath,
          sections: rendered.sections?.length || 0
        },
        delivery: {
          telegram: delivery.telegram,
          email: delivery.email,
          dashboard: true
        },
        duration_ms: Date.now() - startTime
      };

    } catch (error) {
      console.error(`[WorkflowRunner] Workflow ${workflowId} failed:`, error.message);
      
      await this.updateState(workflowId, 'failed', this.activeWorkflows.get(workflowId)?.progress || 0, {
        error: error.message,
        stack: error.stack
      });

      this.activeWorkflows.delete(workflowId);

      return {
        success: false,
        workflowId,
        reportId,
        error: error.message,
        duration_ms: Date.now() - startTime
      };
    }
  }

  async updateState(workflowId, step, progress, data = {}) {
    await stateManager.saveState(workflowId, { step, progress, data, status: 'running' });
    
    const active = this.activeWorkflows.get(workflowId);
    if (active) {
      active.step = step;
      active.progress = progress;
    }
  }

  async runAgentSwarm(workflowId, templateId, inputs) {
    const agents = [];
    const template = this.getTemplate(templateId);
    const sources = template?.sources || ['youtube', 'stock', 'rss'];

    // YouTube Collector
    if (sources.includes('youtube')) {
      agents.push(this.runYouTubeAgent(workflowId, inputs));
    }

    // Stock Data Fetcher
    if (sources.includes('stock')) {
      agents.push(this.runStockAgent(workflowId, inputs));
    }

    // RSS News Collector
    if (sources.includes('rss')) {
      agents.push(this.runNewsAgent(workflowId, inputs));
    }

    // Run all agents in parallel with timeout
    const results = await Promise.allSettled(agents);
    
    const agentResults = {
      total: agents.length,
      success: 0,
      failed: 0,
      data: {}
    };

    const agentNames = ['youtube', 'stock', 'news'];
    results.forEach((result, index) => {
      const name = agentNames[index] || `agent_${index}`;
      if (result.status === 'fulfilled') {
        agentResults.success++;
        agentResults.data[name] = result.value;
      } else {
        agentResults.failed++;
        agentResults.data[name] = { error: result.reason?.message || 'Unknown error' };
        console.error(`[Agent ${name}] Failed:`, result.reason?.message);
      }
    });

    return agentResults;
  }

  async runYouTubeAgent(workflowId, inputs) {
    try {
      // Get channels from settings
      const settings = db.prepare('SELECT value FROM settings WHERE key = ?').get('youtube_channels');
      const channels = settings ? JSON.parse(settings.value) : [];
      
      // Create agent task
      const taskId = `yt-${Date.now()}`;
      db.prepare(`
        INSERT INTO agent_tasks (task_id, task_type, status, payload)
        VALUES (?, ?, ?, ?)
      `).run(taskId, 'youtube_collector', 'running', JSON.stringify({ channels: channels.length, days: 7 }));

      // Simulate YouTube collection (in production, call youtubeWorker.js)
      await this.delay(2000); // Simulate work
      
      // Update task
      db.prepare(`
        UPDATE agent_tasks SET status = ?, result = ?, completed_at = datetime('now')
        WHERE task_id = ?
      `).run('success', JSON.stringify({ videos: 0, transcripts: 0, channels: channels.length }), taskId);

      return {
        agent: 'youtube_collector',
        status: 'success',
        channels: channels.length,
        videos: 0,
        note: 'YouTube agent stub — implement youtubeWorker.js for real collection'
      };
    } catch (e) {
      throw new Error(`YouTube agent failed: ${e.message}`);
    }
  }

  async runStockAgent(workflowId, inputs) {
    try {
      const symbols = inputs.symbols || ['VNINDEX', 'FPT', 'VCB', 'HPG'];
      const taskId = `st-${Date.now()}`;
      
      db.prepare(`
        INSERT INTO agent_tasks (task_id, task_type, status, payload)
        VALUES (?, ?, ?, ?)
      `).run(taskId, 'stock_fetcher', 'running', JSON.stringify({ symbols, days: 7 }));

      // Simulate stock data fetch (in production, call stockWorker.js)
      await this.delay(1500);

      // Generate mock OHLCV data
      const stockData = {};
      for (const symbol of symbols) {
        stockData[symbol] = {
          ohlcv: this.generateMockOHLCV(symbol, 7),
          indicators: {
            ma20: 100 + Math.random() * 20,
            rsi14: 30 + Math.random() * 40,
            macd: Math.random() * 2 - 1
          }
        };
      }

      db.prepare(`
        UPDATE agent_tasks SET status = ?, result = ?, completed_at = datetime('now')
        WHERE task_id = ?
      `).run('success', JSON.stringify(stockData), taskId);

      return {
        agent: 'stock_fetcher',
        status: 'success',
        symbols: symbols.length,
        data: stockData
      };
    } catch (e) {
      throw new Error(`Stock agent failed: ${e.message}`);
    }
  }

  async runNewsAgent(workflowId, inputs) {
    try {
      const taskId = `nw-${Date.now()}`;
      
      db.prepare(`
        INSERT INTO agent_tasks (task_id, task_type, status, payload)
        VALUES (?, ?, ?, ?)
      `).run(taskId, 'news_collector', 'running', JSON.stringify({ feeds: ['CafeF', 'VietStock', 'SSI'] }));

      // Simulate news collection
      await this.delay(1000);

      const articles = [
        { title: 'VNINDEX tăng điểm phiên sáng', source: 'CafeF', sentiment: 'positive' },
        { title: 'Ngân hàng dẫn dắt thị trường', source: 'VietStock', sentiment: 'positive' },
        { title: 'Dòng tiền ngoại quay lại', source: 'SSI', sentiment: 'neutral' }
      ];

      db.prepare(`
        UPDATE agent_tasks SET status = ?, result = ?, completed_at = datetime('now')
        WHERE task_id = ?
      `).run('success', JSON.stringify({ articles: articles.length, articles }), taskId);

      return {
        agent: 'news_collector',
        status: 'success',
        articles: articles.length,
        data: articles
      };
    } catch (e) {
      throw new Error(`News agent failed: ${e.message}`);
    }
  }

  mergeAgentData(agentResults) {
    const merged = {
      youtube: agentResults.data.youtube || {},
      stock: agentResults.data.stock || {},
      news: agentResults.data.news || {},
      timestamp: new Date().toISOString(),
      sources: Object.keys(agentResults.data).filter(k => !agentResults.data[k]?.error)
    };
    return merged;
  }

  async runAdaptiveSynthesis(workflowId, mergedData, templateId) {
    try {
      // Try to use 9Router to select AI provider
      let provider = 'local';
      try {
        provider = await router9.selectProvider('analysis', 'gemini');
      } catch (e) {
        console.log('[WorkflowRunner] 9Router failed, using local fallback:', e.message);
        provider = 'local';
      }

      // If no AI provider available, use local smart analysis
      if (provider === 'local') {
        return this.runLocalAnalysis(mergedData, templateId);
      }

      // Call AI API with Meta-Prompt 5 steps
      try {
        const prompt = buildAnalysisPrompt(mergedData, templateId);
        console.log('[WorkflowRunner] Calling Gemini API for analysis...');
        const aiResponse = await callGemini(prompt, {
          temperature: 0.7,
          maxOutputTokens: 2048
        });
        
        const parsed = parseAnalysisResponse(aiResponse);
        if (parsed) {
          console.log('[WorkflowRunner] Gemini analysis received:', parsed.marketRegime);
          return {
            ...parsed,
            symbols: Object.keys(mergedData.stock?.data || {}).length,
            articles: (mergedData.news?.data || []).length,
            note: null // Clear local-only warning
          };
        }
      } catch (aiErr) {
        console.error('[WorkflowRunner] Gemini API failed:', aiErr.message);
      }

      // Fallback to local analysis if AI call fails
      return this.runLocalAnalysis(mergedData, templateId);

    } catch (e) {
      console.error('[WorkflowRunner] Adaptive synthesis failed:', e.message);
      return this.runLocalAnalysis(mergedData, templateId);
    }
  }

  runLocalAnalysis(mergedData, templateId) {
    // Smart local analysis without AI API
    const stockData = mergedData.stock?.data || {};
    const newsData = mergedData.news?.data || [];
    
    const symbols = Object.keys(stockData);
    const avgRSI = symbols.length > 0 
      ? symbols.reduce((sum, s) => sum + (stockData[s]?.indicators?.rsi14 || 50), 0) / symbols.length 
      : 50;

    // Determine market regime
    let marketRegime = 'Sideway';
    if (avgRSI > 60) marketRegime = 'Uptrend FOMO';
    else if (avgRSI < 40) marketRegime = 'Downtrend';

    // Extract focus sectors from news
    const focusSectors = [];
    if (newsData.some(n => n.title?.includes('Ngân hàng'))) focusSectors.push('Ngân hàng');
    if (newsData.some(n => n.title?.includes('Bất động sản'))) focusSectors.push('Bất động sản');
    if (newsData.some(n => n.title?.includes('Chứng khoán'))) focusSectors.push('Chứng khoán');
    if (focusSectors.length === 0) focusSectors.push('Tổng hợp');

    return {
      marketRegime,
      focusSectors,
      avgRSI: Math.round(avgRSI * 10) / 10,
      symbols: symbols.length,
      articles: newsData.length,
      summary: `Thị trường đang ở trạng thái ${marketRegime}. RSI trung bình: ${avgRSI.toFixed(1)}. Ngành tiêu điểm: ${focusSectors.join(', ')}.`,
      provider: 'local',
      note: 'Local analysis (no AI API configured). Configure API keys for AI-powered analysis.'
    };
  }

  async renderReport(workflowId, reportId, analysis, templateId) {
    const template = this.getTemplate(templateId);
    const sections = template?.sections || ['macro', 'sentiment', 'watchlist'];

    // Generate HTML report
    const html = this.generateHTMLReport(reportId, analysis, sections);
    
    // Save HTML file
    const fs = await import('fs');
    const path = await import('path');
    const { fileURLToPath } = await import('url');
    const __dirname = path.dirname(fileURLToPath(import.meta.url));
    
    const reportsDir = path.join(__dirname, '..', 'data', 'reports');
    if (!fs.existsSync(reportsDir)) {
      fs.mkdirSync(reportsDir, { recursive: true });
    }

    const htmlPath = path.join(reportsDir, `${reportId}.html`);
    fs.writeFileSync(htmlPath, html, 'utf-8');

    return {
      htmlPath,
      sections: sections.length,
      format: 'html'
    };
  }

  generateHTMLReport(reportId, analysis, sections) {
    return `<!DOCTYPE html>
<html lang="vi">
<head>
  <meta charset="UTF-8">
  <title>VNStock AI Report — ${reportId}</title>
  <style>
    body { font-family: system-ui, sans-serif; max-width: 800px; margin: 0 auto; padding: 20px; background: #0f172a; color: #e2e8f0; }
    h1 { color: #60a5fa; }
    .badge { display: inline-block; padding: 4px 12px; border-radius: 12px; font-size: 12px; font-weight: 600; }
    .badge-uptrend { background: #166534; color: #86efac; }
    .badge-downtrend { background: #7f1d1d; color: #fca5a5; }
    .badge-sideway { background: #713f12; color: #fde047; }
    .section { background: #1e293b; border-radius: 8px; padding: 16px; margin: 12px 0; }
    .metric { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #334155; }
  </style>
</head>
<body>
  <h1>📊 VNStock AI Report</h1>
  <p>Report ID: <code>${reportId}</code> | Generated: ${new Date().toLocaleString('vi-VN')}</p>
  
  <div class="section">
    <h2>🎯 Market Regime</h2>
    <span class="badge badge-${analysis.marketRegime?.toLowerCase().replace(/\s+/g, '-') || 'sideway'}">${analysis.marketRegime || 'Unknown'}</span>
    <p>${analysis.summary || ''}</p>
  </div>

  <div class="section">
    <h2>📈 Metrics</h2>
    <div class="metric"><span>Avg RSI (14)</span><span>${analysis.avgRSI || 'N/A'}</span></div>
    <div class="metric"><span>Symbols Analyzed</span><span>${analysis.symbols || 0}</span></div>
    <div class="metric"><span>News Articles</span><span>${analysis.articles || 0}</span></div>
    <div class="metric"><span>Focus Sectors</span><span>${(analysis.focusSectors || []).join(', ')}</span></div>
    <div class="metric"><span>AI Provider</span><span>${analysis.provider || 'local'}</span></div>
  </div>

  <div class="section">
    <h2>📝 Sections</h2>
    <ul>
      ${(sections || []).map(s => typeof s === 'string' ? `<li>${s}</li>` : `<li>${s.id || s.name || JSON.stringify(s)}</li>`).join('')}
    </ul>
  </div>

  ${analysis.note ? `<div class="section" style="background:#451a03;"><p>⚠️ ${analysis.note}</p></div>` : ''}
</body>
</html>`;
  }

  async deliverReport(workflowId, reportId, rendered, templateId) {
    const template = this.getTemplate(templateId);
    const channels = template?.output_channels || {};
    const results = { telegram: false, email: false, dashboard: true };

    // Telegram delivery
    if (channels.telegram && channels.telegram.length > 0) {
      try {
        const token = '7055879874:AAE8PmCuPMMV7uyIiamDBNN5xZgWBctYIVc';
        const chatId = '6226786681';
        const message = `📊 VNStock AI Report\nID: ${reportId}\nView: http://localhost:3004`;
        
        // Actually send via Telegram API
        const { exec } = await import('child_process');
        const { promisify } = await import('util');
        const execAsync = promisify(exec);
        const cmd = `curl -s -X POST "https://api.telegram.org/bot${token}/sendMessage" -H "Content-Type: application/json" -d "{\\"chat_id\\":\\"${chatId}\\",\\"text\\":\\"${message.replace(/"/g, '\\"').replace(/\n/g, '\\n')}\\",\\"parse_mode\\":\\"HTML\\"}"`;
        const { stdout } = await execAsync(cmd, { timeout: 15000 });
        const telegramResult = JSON.parse(stdout);
        results.telegram = telegramResult.ok === true;
        console.log('[Delivery] Telegram:', results.telegram ? 'sent' : 'failed', telegramResult.ok ? '' : telegramResult.description);
      } catch (e) {
        console.error('[Delivery] Telegram failed:', e.message);
      }
    }

    // Email delivery
    if (channels.email && channels.email.length > 0) {
      try {
        const { exec } = await import('child_process');
        const { promisify } = await import('util');
        const execAsync = promisify(exec);
        const { dirname, join } = await import('path');
        const { fileURLToPath } = await import('url');
        const __dirname = dirname(fileURLToPath(import.meta.url));
        const scriptPath = join(__dirname, '..', 'scripts', 'send_email.py');
        
        // Check if script exists
        const { existsSync } = await import('fs');
        if (!existsSync(scriptPath)) {
          console.error('[Delivery] Email script not found:', scriptPath);
        } else {
          const subject = `[VNStock AI] Báo cáo ${reportId}`;
          const body = `Báo cáo phân tích thị trường chứng khoán Việt Nam.\n\nReport ID: ${reportId}\nXem chi tiết: http://localhost:3004`;
          const html = `<h2>VNStock AI Report</h2><p>Report ID: <code>${reportId}</code></p><p><a href="http://localhost:3004">Xem Dashboard</a></p>`;
          const cmd = `py "${scriptPath}" "--to" "seeyeahall@gmail.com" "--subject" "${subject}" "--body" "${body}" "--html" "${html}"`;
          const { stdout } = await execAsync(cmd, { timeout: 30000 });
          const emailResult = JSON.parse(stdout.trim());
          results.email = emailResult.success === true;
          console.log('[Delivery] Email:', results.email ? 'sent' : 'failed', emailResult.message || emailResult.error);
        }
      } catch (e) {
        console.error('[Delivery] Email failed:', e.message);
      }
    }

    return results;
  }

  getTemplate(templateId) {
    try {
      const row = db.prepare('SELECT * FROM report_templates WHERE template_id = ?').get(templateId);
      if (!row) return null;
      return {
        template_id: row.template_id,
        name: row.name,
        sections: row.sections ? JSON.parse(row.sections) : [],
        output_channels: row.output_channels ? JSON.parse(row.output_channels) : {},
        sources: row.sources ? JSON.parse(row.sources) : ['youtube', 'stock', 'rss'],
        time_range: row.time_range || '1d'
      };
    } catch (e) {
      console.error('[WorkflowRunner] getTemplate error:', e.message);
      return null;
    }
  }

  generateMockOHLCV(symbol, days) {
    const data = [];
    let price = 100 + Math.random() * 50;
    for (let i = 0; i < days; i++) {
      const change = (Math.random() - 0.5) * 5;
      const open = price;
      const close = price + change;
      const high = Math.max(open, close) + Math.random() * 2;
      const low = Math.min(open, close) - Math.random() * 2;
      const volume = 1000000 + Math.random() * 2000000;
      data.push({ date: new Date(Date.now() - (days - i) * 86400000).toISOString().split('T')[0], open, high, low, close, volume });
      price = close;
    }
    return data;
  }

  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // Get active workflow status for dashboard
  getActiveWorkflows() {
    const result = [];
    for (const [workflowId, data] of this.activeWorkflows) {
      result.push({ workflowId, ...data });
    }
    return result;
  }

  // Cancel a running workflow
  async cancelWorkflow(workflowId) {
    const active = this.activeWorkflows.get(workflowId);
    if (!active) {
      return { success: false, error: 'Workflow not found or already completed' };
    }

    active.status = 'cancelled';
    await stateManager.saveState(workflowId, { step: 'cancelled', progress: active.progress, status: 'cancelled' });
    this.activeWorkflows.delete(workflowId);

    return { success: true, workflowId, status: 'cancelled' };
  }
}

const workflowRunner = new WorkflowRunner();

export { WorkflowRunner, workflowRunner };
