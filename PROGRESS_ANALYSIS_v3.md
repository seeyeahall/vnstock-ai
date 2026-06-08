# VNStock AI v3.0 - Phân tích tiến trình & Tối ưu

> **File này ghi lại tiến trình thực hiện V3.0, phân tích tối ưu, và hướng phát triển tiếp theo.**
> Chat mới đọc để biết đã làm gì, còn gì cần làm.

---

## 1. Tiến trình thực hiện (2026-06-08)

### ✅ ĐÃ HOÀN THÀNH (V2.0 + V3.0)

| # | Tính năng | Trạng thái | Chi tiết |
|---|-----------|-----------|----------|
| 1 | **V1 UI restored** | ✅ | ModuleSelector, SystemConfigPanel, Header, ExecutiveBrainConsole, HealthCheckPanel, WorkflowVisualizer |
| 2 | **Chat AI** | ✅ | ChatPanel.tsx với Messenger bubbles, NLU, SQLite storage |
| 3 | **SQLite Backend** | ✅ | 8 tables, 35+ API endpoints, port 3004 |
| 4 | **Telegram Bot NLU** | ✅ | @HuuVangbot, 9 intents, webhook, action execution |
| 5 | **Build & Deploy** | ✅ | Vite build, GitHub Pages live |
| 6 | **D1 + Turso Sync** | ✅ | sync.js với push/pull, conflict resolution |
| 7 | **Email Gmail SMTP** | ✅ | Python smtplib, App Password: qialfxmpfedshqgn |
| 8 | **YouTube Analyzer** | ✅ | 29 kênh FREE-first, subtitle-first, fallback chain |
| 9 | **Push All Script** | ✅ | `push-all.bat` tự động build + deploy |
| 10 | **Auto Start Script** | ✅ | `auto-start.bat` (3 dòng) + `auto_start.py` |
| 11 | **Report Builder** | ✅ | UI preset, section toggle/reorder, output channel matrix |
| 12 | **Data Collection Panel** | ✅ | YouTube 29 kênh, RSS, API, Manual với progress real-time |
| 13 | **Chart Viewer** | ✅ | 10 chỉ báo: MA, EMA, RSI, MACD, Bollinger, Ichimoku 9-17-26-26-26, Ichimoku 65-129-5-2-2, Volume MA, OBV, Stochastic |
| 14 | **Audio Player** | ✅ | Web Speech API + Python TTS fallback |
| 15 | **3D Knowledge Graph** | ✅ | D3.js force-directed graph |
| 16 | **Agent Swarm** | ✅ | 4 workers (YouTube, Stock, News, Analysis) + Data Merge + Report Renderer + TTS Service |
| 17 | **Precheck Engine** | ✅ | 6 bước: API Health, Quota Forecast, Hardware, Dependency, Transcript, Dry-Run |
| 18 | **Router 9** | ✅ | AI provider router: Gemini → Groq → OpenRouter → Ollama |
| 19 | **State Manager** | ✅ | Lưu/load workflow state, resume sau crash |
| 20 | **Meta-Prompt** | ✅ | 5 bước adaptive synthesis |
| 21 | **Push All v3** | ✅ | `push_all.py` — 7 bước tự động: Build → Backend → Tunnel → GitHub Pages → Webhook → Browser → Test |
| 22 | **Chat AI Engine** | ✅ | `chatEngine.js` — System prompt + Function calling + Smart local processing. AI tự hiểu app, điều khiển workflow |
| 23 | **Viber Webhook** | ✅ | Endpoint `/api/viber/webhook` — dùng chung chat engine với Telegram |
| 24 | **NotebookLM Sync** | ✅ | Services created (`notebooklmSync.js`, `notebooklmAudio.js`). Cần Google Drive credentials để kích hoạt |
| 25 | **n8n Bridge** | ✅ | Service created (`n8nBridge.js`). Cần n8n webhook URL để kích hoạt |
| 26 | **Workflow Runner** | ✅ | `workflowRunner.js` — Full pipeline 7 bước end-to-end: Precheck → Agent Swarm → Merge → Synthesis → Render → Deliver |
| 27 | **API Test Endpoints** | ✅ | `POST /api/test-api-key` + `GET /api/test-all-keys` — Test tất cả providers, trả về `can_run_workflow` flag |
| 28 | **Dashboard Status API** | ✅ | `GET /api/dashboard/status` — Tổng quan hệ thống: health, apiStatus, active workflows, recent reports |
| 29 | **Health Check Panel v2** | ✅ | Hiển thị API status chi tiết từ `/api/dashboard/status`, cảnh báo Gemini nổi bật, API Configuration grid |
| 30 | **Chat AI API Guard** | ✅ | Chat AI tự động detect API chưa cấu hình, cảnh báo user và navigate đến Settings |
| 31 | **Health Check Engine v2** | ✅ | `healthCheck.js` rewrite — Dùng Node.js `http`/`https` thay vì `curl`, hoạt động trên Windows |
| 33 | **Build Freshness Checker** | ✅ | `buildChecker.js` — Tự động kiểm tra `dist/` vs `src/` timestamps. Báo trên dashboard nếu frontend chưa build bản mới nhất |
| 34 | **Push All v3.1** | ✅ | `push_all.py` — Tự động check build freshness trước khi build, log số files + size, skip nếu đã fresh |

### 🔧 FIX GẦN NHẤT

| Ngày | File | Vấn đề | Giải pháp |
|------|------|--------|-----------|
| 2026-06-08 | `server.js` | Thiếu `app.listen()` ở cuối file (dòng 439 bị `NaN`) | Thêm `app.listen(PORT, () => console.log(...))` |
| 2026-06-08 | `node_modules` | Thiếu dependencies (0 packages) | Chạy `npm install` → 290 packages |
| 2026-06-08 | `chatEngine.js` | Import path sai `import db from './db.js'` | Sửa thành `import db from '../db.js'` |
| 2026-06-08 | `chatEngine.js` | Schema `workflow_states` không khớp (dùng `workflow_id` thay vì `state_id`) | Sửa query INSERT khớp với schema thực tế |
| 2026-06-08 | `ChatPanel.tsx` | `executeAction` định nghĩa sau `sendMessage`, gây lỗi TS | Đưa `executeAction` ra trước, dùng `useCallback` |
| 2026-06-08 | `server.js` | SQLite `datetime("now")` dùng double quotes → lỗi `no such column: "now"` | Sửa thành `datetime('now')` trong template literals |
| 2026-06-08 | `server.js` | `agent_tasks` query dùng cột `agent_name`, `progress`, `report_id` không tồn tại | Sửa query khớp schema thực tế: `task_type`, `status`, `created_at` |
| 2026-06-08 | `healthCheck.js` | Dùng `curl` với `/dev/null` — không hoạt động trên Windows | Rewrite dùng Node.js `http`/`https` built-in modules |
| 2026-06-08 | `stateManager.js` | Dùng cột `workflow_id`, `step`, `progress`, `status`, `data` không tồn tại | Rewrite lưu state vào `state_json` JSON blob, dùng `state_id` làm key |
| 2026-06-08 | `server.js` | `/api/test-all-keys` lỗi CHECK constraint: status `healthy`/`unhealthy` không hợp lệ | Map status: `healthy`→`ok`, `unhealthy`→`error`, `unknown`→`unknown` |
| 2026-06-08 | `chatEngine.js` | `navigate` function không có case trong `executeFunction()` | Thêm case `navigate` vào switch statement |
| 2026-06-08 | `index.html` | Title vẫn là "VNStock AI v2.0" | Cập nhật lên "VNStock AI v3.0" |
| 2026-06-08 | `push_all.py` | Không kill process cũ trước khi start backend → EADDRINUSE | Thêm `kill_existing_processes()` — taskkill + socket check port 3004 |
| 2026-06-08 | `auto_start.py` | Không kill process cũ trước khi start backend → EADDRINUSE | Thêm `kill_existing_processes()` — taskkill + socket check port 3004 |
| 2026-06-08 | `auto-start.bat` | Không kill process cũ trước khi start → port conflict | Thêm `taskkill /F /IM node.exe` + `timeout /t 2` trước khi start services |

---

## 2. Phân tích tối ưu V3.0

### 2.1. Kiến trúc 4 tầng

**Tầng 0 - Executive Brain**: Precheck Engine + 9Router + State Manager + Recovery Engine
**Tầng 1 - Agent Swarm**: 4 workers chạy song song (YouTube, Stock, News, Web)
**Tầng 2 - Grounding**: SQLite + Qdrant + Gemini Context Cache + NotebookLM (optional)
**Tầng 3 - Adaptive Synthesis**: Meta-Prompt 5 bước
**Tầng 4 - Delivery**: Report Builder với 6 output formats × 4 channels

### 2.2. Code-splitting hiệu quả

| Chunk | Size | Mô tả |
|-------|------|-------|
| index | 114KB | Core app |
| react-vendor | 162KB | React + Router |
| charts | 166KB | Chart.js + indicators |
| d3 | 61KB | D3.js for 3D graph |
| icons | 25KB | Lucide icons |
| ReportBuilder | 11KB | Report Builder UI |
| ChartViewer | 12KB | Chart Viewer UI |
| CollectionPanel | 5KB | Data Collection UI |
| Graph3D | 7KB | 3D Graph UI |
| AudioPlayer | 4KB | Audio Player UI |

**Total**: ~566KB JS (gzipped: ~150KB) — tối ưu cho GitHub Pages

### 2.3. Backend services

| Service | File | Chức năng |
|---------|------|-----------|
| healthCheck.js | ✅ | Ping API health, latency, quota |
| quotaForecast.js | ✅ | Estimate tokens, detect overload |
| hardwareCheck.js | ✅ | RAM/CPU/Disk check |
| precheckEngine.js | ✅ | Tổng hợp 6 bước precheck |
| router9.js | ✅ | Select AI provider, fallback chain |
| stateManager.js | ✅ | Save/load workflow state |
| dataMerge.js | ✅ | Merge + deduplicate agent results |
| reportRenderer.js | ✅ | Render report: Markdown/HTML/Audio/Excel/PDF |
| ttsService.js | ✅ | Text-to-Speech |
| notebooklmSync.js | ✅ | Google Drive sync |
| notebooklmAudio.js | ✅ | Poll Audio Overview |
| n8nBridge.js | ✅ | Webhook to n8n |
| **chatEngine.js** | ✅ | AI Chat Engine — System prompt + Function calling + Smart local processing |

---

## 2.4. Phân tích 2 vấn đề người dùng báo cáo (2026-06-08)

### Vấn đề 1: Push All chưa upload lên hết các kênh

**Thực trạng**:
- `push-all.bat` chỉ 19 dòng, chỉ chạy `npm run build`
- Không tự động: start backend, tạo tunnel, cập nhật webhook, mở browser, push GitHub Pages
- Người dùng phải tự làm 6 bước còn lại thủ công

**Giải pháp đã triển khai**:
- Tạo `push_all.py` (350 dòng) với class `PushAll` đầy đủ 7 bước
- Parse tunnel URL từ cloudflared stdout bằng regex
- Tự động cập nhật Telegram webhook qua API
- Tự động push gh-pages branch (git stash → checkout → copy → commit → push → restore)
- Tự động mở browser (local + tunnel URL)
- Test 5 endpoints sau deploy
- `push-all.bat` chỉ 12 dòng — gọi Python script

**Kết quả**: Double-click `push-all.bat` → toàn bộ quy trình tự động

### Vấn đề 2: Chat AI không tự hiểu về app để điều khiển

**Thực trạng**:
- Backend `POST /api/chat/message` chỉ lưu SQLite, không gọi AI
- Frontend `processLocalResponse()` chỉ keyword matching (7 patterns)
- Không có system prompt, function calling, context awareness
- Người dùng phải đánh đúng lệnh, AI không hiểu ngữ cảnh

**Giải pháp đã triển khai**:
- Tạo `chatEngine.js` — AI Chat Engine backend
- System prompt đầy đủ: mô tả 11 tab, 8 lệnh điều khiển, format function call
- Smart local processing: 10+ intent patterns, extract symbols, detect functions
- Function calling schema: create_report, check_health, run_precheck, get_chart, send_report, get_agent_status, create_schedule, test_api
- `executeFunction()` thực thi: gọi healthCheck, precheckEngine, insert workflow_states, query agent_tasks
- Frontend `ChatPanel.tsx` nâng cấp: nhận `actions` từ AI, `executeAction()` với navigate/setParam/send
- Viber webhook endpoint: `/api/viber/webhook` — dùng chung chat engine

**Kết quả test**:
- "chào bạn" → Trả lời tự nhiên + gợi ý các lệnh
- "tạo báo cáo tuần" → Tạo workflow + navigate to /brain
- "kiểm tra hệ thống" → Health check all APIs + trả kết quả thực
- "help" → Hướng dẫn đầy đủ 11 tab + 5 lệnh

---

## 3. Phân tích rủi ro & Giải pháp

| Rủi ro | Mức độ | Giải pháp |
|--------|--------|-----------|
| **better-sqlite3 với Node v24** | Cao | Prebuilt binary có thể lỗi. Giải pháp: rebuild hoặc dùng Node v22 LTS |
| **Tunnel expire** | Cao | Cloudflared quick tunnel expire khi restart. Dùng `auto-start.bat` để tự động hóa |
| **API quota hết** | Trung bình | 9Router tự động fallback. Precheck Engine cảnh báo trước |
| **D1/Turso quota** | Trung bình | Free tier giới hạn. Monitor usage. Fallback local-only |
| **NotebookLM không có API** | Trung bình | Dùng Google Drive API + manual trigger. Fallback: Gemini Context Caching |
| **n8n instance không chạy** | Thấp | Toggle fallback về local workers tự động |
| **GitHub Pages limit** | Thấp | 1GB limit. Hiện tại ~600KB, không lo |
| **Bot token leak** | Thấp | Token trong .env, không commit. Nếu leak: revoke |

---

## 4. Hướng phát triển tiếp theo (sau V3.0)

| # | Tính năng | Mô tả | Độ phức tạp |
|---|-----------|-------|-------------|
| 1 | **Real-time data** | WebSocket feed giá cổ phiếu real-time | Cao |
| 2 | **Advanced AI** | Fine-tuned model tiếng Việt chứng khoán | Cao |
| 3 | **PWA** | Service worker, offline mode, installable | Trung bình |
| 4 | **Backtesting** | Test chiến lược giao dịch trên lịch sử | Cao |
| 5 | **Alert system** | Thông báo khi chỉ báo đạt ngưỡng | Trung bình |
| 6 | **Multi-language** | English mode cho nhà đầu tư nước ngoài | Trung bình |
| 7 | **Social features** | Share báo cáo, comment, rating | Cao |

---

## 5. Metrics hiện tại (V3.0)

| Metric | Giá trị |
|--------|---------|
| **Frontend bundle** | 566KB JS (150KB gzipped) + 32KB CSS |
| **API endpoints** | 40+ (thêm 5 endpoint mới: workflow, dashboard, test-api-key, test-all-keys, agent-tasks) |
| **Database tables** | 8 |
| **Telegram intents** | 9 |
| **Sync engines** | 2 (D1 + Turso) |
| **YouTube channels** | 29 |
| **Technical indicators** | 10 |
| **Agent workers** | 4 |
| **Build time** | ~32 giây |
| **Backend port** | 3004 |
| **Remote access channels** | 4 |
| **Workflow pipeline steps** | 7 (Precheck → Swarm → Merge → Synthesis → Render → Deliver → Complete) |
| **AI providers** | 4 (Gemini → Groq → OpenRouter → Ollama) |
| **Health check providers** | 7 (Gemini, Groq, OpenRouter, Ollama, Telegram, Email, VNStock) |

---

## 6. Lưu ý cho chat mới

1. **Đọc RESUME_PROMPT.md trước** - Tóm tắt nhanh 2 phút
2. **Đọc MASTER_PROMPT.md** - Chi tiết đầy đủ
3. **Source code**: `src/` (frontend), `local-backend/` (backend)
4. **Backup**: `backup/vnstock-ai-v2.0/` (khôi phục khi cần)
5. **Test**: `npm run dev` (frontend), `node local-backend/server.js` (backend)
6. **Auto Start**: `auto-start.bat` → gọi Python `auto_start.py`
7. **Deploy**: `npm run build` → commit dist/ → push gh-pages
8. **Push All**: `push-all.bat`
9. **Quy tắc FIX CODE**:
   - **Trước khi sửa**: Backup `src/`, `local-backend/` vào `backup/`
   - **Sau khi fix**: Cập nhật `MASTER_PROMPT.md`, `RESUME_PROMPT.md`, `PROGRESS_ANALYSIS_v3.md`, `HUONG_DAN_SU_DUNG.md`
   - **Không xóa source hẳn**: Chỉ thay thế sau khi backup
   - **Kiểm tra schema SQLite**: Dùng `PRAGMA table_info(table_name)` trước khi viết query
   - **Windows compatibility**: Không dùng `curl /dev/null` hoặc `python` command trực tiếp
10. **API Test**: `GET /api/test-all-keys` — Kiểm tra tất cả API providers
11. **Dashboard Status**: `GET /api/dashboard/status` — Tổng quan hệ thống

---

*Cập nhật: 2026-06-08. V3.0 đã hoàn thành 32/32 pha — chỉ còn cần credentials để kích hoạt NotebookLM và n8n.*
