import { router9 } from './router9.js';
import { callGemini } from './aiService.js';
import db from '../db.js';

/**
 * Chat Engine — AI-powered chat with function calling
 * Processes user messages, calls AI via 9Router, executes functions
 */
class ChatEngine {
  constructor() {
    this.systemPrompt = this.buildSystemPrompt();
    this.functions = this.buildFunctionSchema();
  }

  buildSystemPrompt() {
    return `Bạn là VNStock AI Assistant — trợ lý phân tích chứng khoán Việt Nam thông minh.

Bạn có thể điều khiển app qua các lệnh tự nhiên. Người dùng không cần đánh đúng lệnh — bạn tự hiểu ý định.

## Các tab trong app:
- System Config: Cấu hình preset (Daily/Weekly/Deep), mode (autonomous/scheduled/manual), schedule
- Module Registry: 24 modules (Input/AI/Memory/Output/Validation/Recovery)
- Workflow Graph: Visual graph nodes/edges
- Executive Brain: AI COO console — xem tiến trình, agent status
- Health Check: Kiểm tra API health, quota, hardware
- Report Builder: Tạo mẫu báo cáo — chọn sections, output channels
- Data Collection: Theo dõi agent progress (YouTube 29 kênh, Stock, News)
- Chart Viewer: 10 chỉ báo kỹ thuật (MA, EMA, RSI, MACD, Bollinger, Ichimoku, Volume MA, OBV, Stochastic)
- Audio Player: Nghe báo cáo TTS
- 3D Graph: Force-directed graph cổ phiếu-ngành
- Settings: Cấu hình Telegram, Email, Notion, NotebookLM, n8n

## Các lệnh bạn có thể thực hiện:
1. "Tạo báo cáo [template]" → Gọi workflow tạo báo cáo
2. "Kiểm tra hệ thống" → Chạy health check + precheck
3. "Xem chart [mã CP]" → Trả về link chart với indicators
4. "Gửi báo cáo qua [kênh]" → Gửi qua Telegram/Email
5. "Chạy precheck" → Kiểm tra API, quota, hardware
6. "Xem agent status" → Trả về tiến trình agent swarm
7. "Cài lịch [giờ]" → Tạo schedule mới
8. "Test API [provider]" → Kiểm tra API provider

## Cách trả lời:
- Tự nhiên, thân thiện, tiếng Việt
- Nếu người dùng yêu cầu điều khiển app, trả về JSON function call trong code block
- Nếu hỏi thông tin chung, trả lời trực tiếp
- Luôn giải thích ngắn gọn trước khi thực hiện action

## Format function call:
Khi cần điều khiển app, trả về:
\`\`\`json
{"function": "function_name", "parameters": {...}}
\`\`\`
`;
  }

  buildFunctionSchema() {
    return {
      create_report: {
        description: "Tạo báo cáo mới",
        parameters: {
          template_id: { type: "string", enum: ["daily_brief", "weekly_deep", "youtube_only"] },
          symbols: { type: "array", items: { type: "string" } },
          outputs: { type: "array", items: { type: "string", enum: ["telegram", "email", "notion", "dashboard"] } }
        }
      },
      check_health: {
        description: "Kiểm tra sức khỏe hệ thống"
      },
      run_precheck: {
        description: "Chạy precheck engine trước khi chạy workflow"
      },
      get_chart: {
        description: "Lấy chart cổ phiếu",
        parameters: {
          symbol: { type: "string" },
          timeframe: { type: "string", enum: ["1d", "1w", "1m"] },
          indicators: { type: "array", items: { type: "string" } }
        }
      },
      send_report: {
        description: "Gửi báo cáo qua kênh",
        parameters: {
          report_id: { type: "string" },
          channel: { type: "string", enum: ["telegram", "email", "notion"] }
        }
      },
      get_agent_status: {
        description: "Lấy trạng thái agent swarm"
      },
      create_schedule: {
        description: "Tạo lịch chạy báo cáo",
        parameters: {
          name: { type: "string" },
          cron: { type: "string" },
          template: { type: "string" }
        }
      },
      test_api: {
        description: "Test API provider",
        parameters: {
          provider: { type: "string", enum: ["gemini", "groq", "openrouter", "telegram", "email"] }
        }
      }
    };
  }

  async getHistory(sessionId, limit = 10) {
    try {
      const rows = db.prepare(
        'SELECT role, content, intent FROM chat_history WHERE session_id = ? ORDER BY created_at DESC LIMIT ?'
      ).all(sessionId, limit);
      return rows.reverse().map(r => ({
        role: r.role,
        content: r.content
      }));
    } catch (e) {
      return [];
    }
  }

  async callAI(systemPrompt, history, userMessage) {
    // Try to call AI via 9Router
    try {
      const provider = await router9.selectProvider('chat', 'gemini');
      
      // Build prompt
      const messages = [
        { role: 'system', content: systemPrompt },
        ...history,
        { role: 'user', content: userMessage }
      ];

      if (provider === 'gemini') {
        try {
          const prompt = messages.map(m => `${m.role}: ${m.content}`).join('\n\n');
          const aiText = await callGemini(prompt, {
            temperature: 0.7,
            maxOutputTokens: 1024
          });
          
          // Try to extract function call from AI response
          const functionCall = this.extractFunctionCall(aiText);
          if (functionCall) {
            return {
              text: this.cleanText(aiText),
              functionCall: functionCall
            };
          }
          
          return { text: aiText };
        } catch (aiErr) {
          console.error('[ChatEngine] Gemini API failed:', aiErr.message);
          // Fallback to smart local processing
          return this.smartProcess(userMessage, messages);
        }
      }
      
      // For other providers, use smart local processing
      return this.smartProcess(userMessage, messages);
    } catch (e) {
      // Fallback to smart local processing
      console.log('[ChatEngine] 9Router failed, using local processing:', e.message);
      return this.smartProcess(userMessage, []);
    }
  }

  extractFunctionCall(text) {
    // Extract JSON function call from code blocks
    const codeBlockMatch = text.match(/```json\s*([\s\S]*?)\s*```/);
    if (codeBlockMatch) {
      try {
        const json = JSON.parse(codeBlockMatch[1]);
        if (json.function && this.functions[json.function]) {
          return {
            function: json.function,
            parameters: json.parameters || {}
          };
        }
      } catch (e) {
        // Not valid JSON, ignore
      }
    }
    return null;
  }

  cleanText(text) {
    // Remove JSON code blocks from display text
    return text.replace(/```json\s*[\s\S]*?\s*```/g, '').trim();
  }

  smartProcess(userMessage, context) {
    const text = userMessage.toLowerCase();
    
    // Check API configuration status first for workflow-related requests
    const apiStatus = this.checkApiStatus();
    
    // Detect function calls from natural language
    const functionCall = this.detectFunction(text);
    if (functionCall) {
      // For workflow-related functions, check if API is ready
      if (['create_report', 'run_precheck', 'check_health'].includes(functionCall.function)) {
        if (!apiStatus.geminiReady) {
          return {
            text: `⚠️ **Chưa thể chạy workflow!**

${apiStatus.message}

**Cách khắc phục:**
1. Vào tab **Settings** → **API Keys**
2. Thêm **Gemini API Key** (quan trọng nhất)
3. Click **Test** để kiểm tra
4. Quay lại chat và thử lại

Bạn cần hướng dẫn chi tiết không?`,
            functionCall: {
              function: 'navigate',
              parameters: { target: '/settings' }
            }
          };
        }
      }
      
      return {
        text: `Đang thực hiện: ${functionCall.description}...`,
        functionCall: functionCall
      };
    }

    // General responses
    if (text.includes('chào') || text.includes('hello') || text.includes('hi')) {
      let greeting = `Chào bạn! 👋 Tôi là VNStock AI Assistant.

Tôi có thể giúp bạn:
• Tạo báo cáo phân tích thị trường
• Kiểm tra sức khỏe hệ thống
• Xem biểu đồ kỹ thuật
• Điều khiển workflow tự động
• Gửi báo cáo qua Telegram/Email

Bạn cần gì?`;
      
      if (!apiStatus.geminiReady) {
        greeting += `

⚠️ **Lưu ý:** Gemini API chưa cấu hình. Một số tính năng AI sẽ chạy ở chế độ local. Vào Settings → API Keys để cấu hình.`;
      }
      
      return { text: greeting };
    }

    if (text.includes('help') || text.includes('hướng dẫn') || text.includes('cách dùng')) {
      return {
        text: `📘 Hướng dẫn sử dụng VNStock AI:

**Các tab chính:**
• System Config — Cấu hình preset, mode, lịch
• Report Builder — Tạo mẫu báo cáo tùy chỉnh
• Data Collection — Theo dõi thu thập dữ liệu real-time
• Chart Viewer — Xem 10 chỉ báo kỹ thuật
• Executive Brain — Giám sát AI workflow
• Health Check — Kiểm tra API & quota

**Lệnh chat:**
• "Tạo báo cáo tuần" → Tạo báo cáo weekly_deep
• "Kiểm tra hệ thống" → Health check all APIs
• "Xem chart FPT" → Mở chart cổ phiếu FPT
• "Chạy precheck" → Kiểm tra trước khi chạy
• "Gửi báo cáo qua Telegram" → Gửi báo cáo gần nhất

${!apiStatus.geminiReady ? '\n⚠️ **Quan trọng:** Gemini API chưa cấu hình. Vào Settings → API Keys để thêm key.' : ''}`
      };
    }

    if (text.includes('báo cáo') || text.includes('report') || text.includes('phân tích')) {
      if (!apiStatus.geminiReady) {
        return {
          text: `⚠️ **Chưa thể tạo báo cáo AI!**

${apiStatus.message}

**Tại sao cần Gemini?**
Gemini là AI provider chính để phân tích dữ liệu, nhận diện market regime, và tạo báo cáo chất lượng.

**Cách khắc phục:**
1. Vào tab **Settings** (góc trên bên phải)
2. Chọn **API Keys**
3. Thêm **Gemini API Key**
4. Click **Test Connection**
5. Quay lại chat và gõ "tạo báo cáo"

Bạn muốn tôi hướng dẫn chi tiết hơn không?`,
          actions: [{ type: 'navigate', target: '/settings' }]
        };
      }
      
      return {
        text: `Tôi sẽ tạo báo cáo cho bạn! 📊

Bạn muốn loại báo cáo nào?
• **Daily Brief** — Tóm tắt hàng ngày (macro, sentiment, watchlist)
• **Weekly Deep** — Phân tích chuyên sâu tuần (7 sections)
• **YouTube Only** — Tổng hợp 29 kênh YouTube

Hoặc tùy chỉnh trong tab **Report Builder**.`,
        functionCall: {
          function: 'create_report',
          parameters: { template_id: 'daily_brief', symbols: ['VNINDEX'], outputs: ['dashboard'] }
        }
      };
    }

    if (text.includes('api') || text.includes('kiểm tra api') || text.includes('test api')) {
      return {
        text: `🔌 Kiểm tra API providers...

${apiStatus.message}

**Trạng thái hiện tại:**
• Gemini: ${apiStatus.geminiReady ? '✅ OK' : '❌ Chưa cấu hình'}
• Groq: ${apiStatus.groqReady ? '✅ OK' : '❌ Chưa cấu hình'}
• OpenRouter: ${apiStatus.openrouterReady ? '✅ OK' : '❌ Chưa cấu hình'}

Vào **Settings → API Keys** để cấu hình.`,
        functionCall: { function: 'test_api', parameters: { provider: 'all' } }
      };
    }

    // ... rest of existing smartProcess code ...
    // Keep existing chart, health, precheck, agent, schedule, send, test patterns
    
    if (text.includes('chart') || text.includes('biểu đồ') || text.includes('đồ thị') || text.includes('kỹ thuật')) {
      const symbols = this.extractSymbols(text);
      const symbol = symbols[0] || 'VNINDEX';
      return {
        text: `Mở chart ${symbol} trong tab Chart Viewer 📈

Bạn có thể xem:
• MA, EMA, RSI, MACD, Bollinger
• Ichimoku (9-17-26-26-26 và 65-129-5-2-2)
• Volume MA, OBV, Stochastic
• Tín hiệu tổng hợp từ 10 chỉ báo`,
        functionCall: {
          function: 'get_chart',
          parameters: { symbol, timeframe: '1d', indicators: ['ma', 'rsi', 'macd', 'ichimoku_standard'] }
        }
      };
    }

    if (text.includes('health') || text.includes('kiểm tra') || text.includes('status') || text.includes('trạng thái')) {
      return {
        text: `Đang kiểm tra sức khỏe hệ thống... 🔍`,
        functionCall: { function: 'check_health', parameters: {} }
      };
    }

    if (text.includes('precheck')) {
      return {
        text: `Chạy Precheck Engine — kiểm tra 6 bước trước khi chạy workflow:
1. API Health
2. Quota Forecast
3. Hardware Check
4. Dependency Check
5. Transcript Config
6. Dry-Run`,
        functionCall: { function: 'run_precheck', parameters: {} }
      };
    }

    if (text.includes('agent') || text.includes('worker') || text.includes('tiến trình')) {
      return {
        text: `Đang lấy trạng thái Agent Swarm... 🤖`,
        functionCall: { function: 'get_agent_status', parameters: {} }
      };
    }

    if (text.includes('lịch') || text.includes('schedule') || text.includes('hẹn giờ')) {
      return {
        text: `Tạo lịch chạy báo cáo tự động ⏰

Ví dụ:
• "Cài lịch 7h sáng" → 0 7 * * *
• "Cài lịch 8h tối" → 0 20 * * *
• "Cài lịch mỗi giờ" → 0 * * * *`,
        functionCall: {
          function: 'create_schedule',
          parameters: { name: 'Daily Report', cron: '0 7 * * *', template: 'daily_brief' }
        }
      };
    }

    if (text.includes('gửi') || text.includes('send')) {
      const channel = text.includes('telegram') ? 'telegram' : text.includes('email') ? 'email' : 'telegram';
      return {
        text: `Đang gửi báo cáo qua ${channel}... 📤`,
        functionCall: {
          function: 'send_report',
          parameters: { report_id: 'latest', channel }
        }
      };
    }

    // Default response
    let defaultResponse = `Tôi hiểu ý bạn! 💡

Bạn có thể hỏi tôi:
• "Tạo báo cáo" — Tạo báo cáo phân tích
• "Kiểm tra hệ thống" — Health check
• "Xem chart [mã CP]" — Biểu đồ kỹ thuật
• "Chạy precheck" — Kiểm tra trước khi chạy
• "Gửi báo cáo" — Gửi qua Telegram/Email

Hoặc gõ "help" để xem danh sách đầy đủ.`;

    if (!apiStatus.geminiReady) {
      defaultResponse += `

⚠️ **Lưu ý:** Gemini API chưa cấu hình. Vào Settings → API Keys để thêm key.`;
    }

    return { text: defaultResponse };
  }

  checkApiStatus() {
    try {
      const geminiRow = db.prepare('SELECT api_key, status FROM api_keys WHERE provider = ?').get('gemini');
      const groqRow = db.prepare('SELECT api_key, status FROM api_keys WHERE provider = ?').get('groq');
      const openrouterRow = db.prepare('SELECT api_key, status FROM api_keys WHERE provider = ?').get('openrouter');
      
      const geminiConfigured = !!(geminiRow?.api_key && geminiRow.api_key.length > 10 && !geminiRow.api_key.includes('YOUR_'));
      const geminiHealthy = geminiRow?.status === 'active' || geminiRow?.status === 'healthy' || geminiRow?.status === 'ok';
      const geminiReady = geminiConfigured && geminiHealthy;
      
      const groqConfigured = !!(groqRow?.api_key && groqRow.api_key.length > 10 && !groqRow.api_key.includes('YOUR_'));
      const groqReady = groqConfigured && (groqRow?.status === 'active' || groqRow?.status === 'healthy' || groqRow?.status === 'ok');
      
      const openrouterConfigured = !!(openrouterRow?.api_key && openrouterRow.api_key.length > 10 && !openrouterRow.api_key.includes('YOUR_'));
      const openrouterReady = openrouterConfigured && (openrouterRow?.status === 'active' || openrouterRow?.status === 'healthy' || openrouterRow?.status === 'ok');
      
      let message = '';
      if (geminiReady) {
        message = '✅ Gemini API đã sẵn sàng. Workflow có thể chạy với AI analysis.';
      } else if (geminiConfigured) {
        message = '⚠️ Gemini API key đã nhập nhưng chưa kết nối được. Kiểm tra lại key hoặc mạng.';
      } else {
        message = '❌ Gemini API chưa cấu hình. Workflow sẽ chạy ở chế độ local (không có AI analysis). Vào Settings → API Keys để thêm.';
      }
      
      return {
        geminiReady,
        groqReady,
        openrouterReady,
        anyAiReady: geminiReady || groqReady || openrouterReady,
        message
      };
    } catch (e) {
      return {
        geminiReady: false,
        groqReady: false,
        openrouterReady: false,
        anyAiReady: false,
        message: '❌ Không thể kiểm tra API status. Lỗi: ' + e.message
      };
    }
  }

  detectFunction(text) {
    const patterns = [
      { regex: /tạo\s+báo\s+cáo|report|phân\s+tích/, func: 'create_report', desc: 'Tạo báo cáo' },
      { regex: /kiểm\s+tra\s+hệ\s+thống|health\s+check|status/, func: 'check_health', desc: 'Kiểm tra hệ thống' },
      { regex: /precheck/, func: 'run_precheck', desc: 'Chạy precheck' },
      { regex: /chart|biểu\s+đồ|đồ\s+thị/, func: 'get_chart', desc: 'Xem chart' },
      { regex: /gửi\s+báo\s+cáo|send\s+report/, func: 'send_report', desc: 'Gửi báo cáo' },
      { regex: /agent|worker|tiến\s+trình/, func: 'get_agent_status', desc: 'Xem agent status' },
      { regex: /lịch|schedule|hẹn\s+giờ/, func: 'create_schedule', desc: 'Tạo lịch' },
      { regex: /test\s+api|kiểm\s+tra\s+api/, func: 'test_api', desc: 'Test API' }
    ];

    for (const p of patterns) {
      if (p.regex.test(text)) {
        return { function: p.func, description: p.desc };
      }
    }
    return null;
  }

  extractSymbols(text) {
    // Extract stock symbols (2-5 uppercase letters)
    const matches = text.match(/\b[A-Z]{2,5}\b/g);
    return matches || [];
  }

  async executeFunction(functionCall) {
    const { function: funcName, parameters = {} } = functionCall;
    const actions = [];
    let message = '';

    switch (funcName) {
      case 'create_report': {
        const templateId = parameters.template_id || 'daily_brief';
        const workflowId = `wf-${Date.now()}`;
        db.prepare(
          `INSERT INTO workflow_states (state_id, name, state_json) VALUES (?, ?, ?)`
        ).run(workflowId, 'report_workflow', JSON.stringify({ step: 'init', progress: 0, template_id: templateId, status: 'running' }));
        message = `✅ Đã khởi tạo báo cáo "${templateId}". Workflow ID: ${workflowId}\nKiểm tra tab Executive Brain để xem tiến trình.`;
        actions.push({ type: 'navigate', target: '/brain' });
        break;
      }

      case 'check_health': {
        const { checkAllHealth } = await import('./healthCheck.js');
        const results = await checkAllHealth();
        const lines = Object.entries(results).map(([k, v]) => {
          const status = v.status === 'healthy' ? '✅' : '❌';
          return `${status} ${k}: ${v.status} (${v.latency_ms}ms)`;
        }).join('\n');
        message = `🔍 Health Check Results:\n${lines}`;
        break;
      }

      case 'run_precheck': {
        const { runPrecheck } = await import('./precheckEngine.js');
        const result = await runPrecheck({});
        const status = result.pass ? '✅ PASS' : '❌ FAIL';
        message = `🔍 Precheck Engine: ${status}\n${JSON.stringify(result.results, null, 2)}`;
        break;
      }

      case 'get_chart': {
        const symbol = parameters.symbol || 'VNINDEX';
        message = `📈 Chart ${symbol} đã sẵn sàng trong tab Chart Viewer.\nIndicators: ${(parameters.indicators || []).join(', ')}`;
        actions.push({ type: 'navigate', target: '/charts' });
        actions.push({ type: 'setParam', key: 'chartSymbol', value: symbol });
        break;
      }

      case 'send_report': {
        const channel = parameters.channel || 'telegram';
        message = `📤 Đã gửi báo cáo qua ${channel}!`;
        actions.push({ type: 'send', channel });
        break;
      }

      case 'get_agent_status': {
        const rows = db.prepare('SELECT task_type, status, payload FROM agent_tasks ORDER BY created_at DESC LIMIT 10').all();
        if (rows.length === 0) {
          message = '🤖 Không có agent nào đang chạy. Tất cả đã hoàn thành!';
        } else {
          const lines = rows.map(r => `• ${r.task_type}: ${r.status}`).join('\n');
          message = `🤖 Agent Swarm Status:\n${lines}`;
        }
        actions.push({ type: 'navigate', target: '/data-collection' });
        break;
      }

      case 'create_schedule': {
        const sid = `sch-${Date.now()}`;
        db.prepare(
          `INSERT INTO schedules (schedule_id, name, cron, template, outputs, enabled) VALUES (?, ?, ?, ?, ?, ?)`
        ).run(sid, parameters.name || 'Schedule', parameters.cron || '0 7 * * *', parameters.template || 'daily_brief', JSON.stringify(['telegram']), 1);
        message = `⏰ Đã tạo lịch "${parameters.name || 'Schedule'}" (${parameters.cron || '0 7 * * *'})`;
        break;
      }

      case 'test_api': {
        const { checkApiHealth } = await import('./healthCheck.js');
        const provider = parameters.provider || 'gemini';
        const result = await checkApiHealth(provider);
        const status = result.status === 'healthy' ? '✅' : '❌';
        message = `${status} API ${provider}: ${result.status}\nLatency: ${result.latency_ms}ms\nQuota: ${result.quota_remaining || 'N/A'}`;
        break;
      }

      case 'navigate': {
        const target = parameters.target || '/dashboard';
        message = `🔄 Đang chuyển đến ${target}...`;
        actions.push({ type: 'navigate', target });
        break;
      }

      default:
        message = `❓ Không hiểu lệnh: ${funcName}`;
    }

    return { message, actions };
  }

  async processMessage(sessionId, userMessage, context = {}) {
    // Save user message
    db.prepare(
      'INSERT INTO chat_history (session_id, role, content) VALUES (?, ?, ?)'
    ).run(sessionId, 'user', userMessage);

    // Get history
    const history = await this.getHistory(sessionId, 10);

    // Call AI / smart process
    const aiResponse = await this.callAI(this.systemPrompt, history, userMessage);

    let content = aiResponse.text;
    let actions = [];
    let intent = null;

    // Execute function if detected
    if (aiResponse.functionCall) {
      intent = aiResponse.functionCall.function;
      const result = await this.executeFunction(aiResponse.functionCall);
      content = result.message || content;
      actions = result.actions || [];
    }

    // Save assistant response
    db.prepare(
      'INSERT INTO chat_history (session_id, role, content, intent) VALUES (?, ?, ?, ?)'
    ).run(sessionId, 'assistant', content, intent);

    return {
      success: true,
      content,
      intent,
      actions,
      sessionId
    };
  }
}

export const chatEngine = new ChatEngine();
