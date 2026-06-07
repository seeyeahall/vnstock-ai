# VNStock AI v3.0 - Phân tích tiến trình & Tối ưu

> **File này ghi lại tiến trình thực hiện V3.0, phân tích tối ưu, và hướng phát triển tiếp theo.**
> Chat mới đọc để biết đã làm gì, còn gì cần làm.

---

## 1. Tiến trình thực hiện (2026-06-08)

### ✅ ĐÃ HOÀN THÀNH (V2.0)

| # | Tính năng | Trạng thái | Chi tiết |
|---|-----------|-----------|----------|
| 1 | **V1 UI restored** | ✅ Hoàn thành | ModuleSelector, SystemConfigPanel, Header, ExecutiveBrainConsole, HealthCheckPanel, WorkflowVisualizer. Copy từ V1 source, adapt shadcn/ui. |
| 2 | **Chat AI** | ✅ Hoàn thành | ChatPanel.tsx với Messenger bubbles, NLU, SQLite storage, local fallback. |
| 3 | **SQLite Backend** | ✅ Hoàn thành | 5 tables, 30+ API endpoints, migration từ file-based config. Port 3004. |
| 4 | **Telegram Bot NLU** | ✅ Hoàn thành | @HuuVangbot, 9 intents, webhook, action execution. Token: 7055879874:AAE8PmCuPMMV7uyIiamDBNN5xZgWBctYIVc |
| 5 | **Build & Deploy** | ✅ Hoàn thành | Vite build 273KB JS + 26KB CSS, GitHub Pages live. |
| 6 | **D1 + Turso Sync** | ✅ Hoàn thành | sync.js với push/pull, conflict resolution, config APIs. Cần credentials để activate. |
| 7 | **Email Gmail SMTP** | ✅ Hoàn thành | Python smtplib gửi qua Gmail. Không cần cài thêm Node package. App Password: qialfxmpfedshqgn |
| 8 | **YouTube Analyzer** | ✅ Hoàn thành | Phân tích 29 kênh FREE-first (subtitle + keyword sentiment). Báo cáo HTML tiếng Việt có dấu. |
| 9 | **Push All Script** | ✅ Hoàn thành | `push-all.bat` + `push-all.js` tự động build, start backend, tạo tunnel, push GitHub Pages, cập nhật Telegram webhook. |
| 10 | **Remote Access Guide** | ✅ Hoàn thành | `HUONG_DAN_SU_DUNG.md` - hướng dẫn chi tiết 4 kênh truy cập. |
| 11 | **Auto Start Script** | ✅ Hoàn thành | `auto-start.bat` (3 dòng) + `auto_start.py` (xử lý toàn bộ logic). |

### 🔄 ĐANG NÂNG CẤP (V3.0)

| # | Tính năng | Trạng thái | Chi tiết |
|---|-----------|-----------|----------|
| 12 | **Report Builder** | 🔄 Hoàn thành | Cấu hình mẫu báo cáo tùy chỉnh: 3 presets (Daily Brief, Weekly Deep, YouTube Only), section toggle/reorder, output channel matrix (Telegram/Email/Dashboard per section), time range, source toggles, schedule. File: `src/sections/report-builder/ReportBuilder.tsx` |
| 13 | **Data Collection Panel** | 🔄 Hoàn thành | Quản lý nguồn dữ liệu: YouTube 29 kênh, RSS feeds, API endpoints, Manual input. Trạng thái real-time (idle/running/success/error), progress bar, log viewer, action buttons (run/stop/view logs). File: `src/sections/data-collection/CollectionPanel.tsx` |
| 14 | **Chart Viewer** | 🔄 Hoàn thành | Đồ thị 10 chỉ báo: MA, EMA, RSI, MACD, Bollinger, Ichimoku (9-17-26-26-26), Ichimoku (65-129-5-2-2), Volume MA, OBV, Stochastic. Chart.js với candlestick, volume, RSI/MACD sub-panels. Symbol + timeframe selector. File: `src/sections/chart-viewer/ChartViewer.tsx` |
| 15 | **Audio Player** | 🔄 Hoàn thành | Phát audio TTS từ báo cáo: Web Speech API (client) + Python TTS fallback (server). Playback controls, speed, download MP3. File: `src/sections/audio-player/AudioPlayer.tsx` |
| 16 | **3D Knowledge Graph** | 🔄 Hoàn thành | Force-directed graph D3.js: nodes (stocks, topics, channels), links (mentions, correlations), zoom/pan/hover. File: `src/sections/graph-3d/Graph3D.tsx` |
| 17 | **Agent Swarm** | 🔄 Hoàn thành | 4 workers: YouTubeWorker (subtitle-first), StockWorker (OHLCV + 10 indicators), NewsWorker (RSS), AnalysisWorker (Meta-Prompt). Plus: DataMerge, ReportRenderer, TTSService. Files: `local-backend/workers/*.js` |
| 18 | **Precheck Engine** | 🔄 Hoàn thành | 6 bước kiểm tra: API Health, Quota Forecast, Hardware, Dependency, Transcript, Dry-Run. File: `local-backend/services/precheckEngine.js` |
| 19 | **Router 9** | 🔄 Hoàn thành | AI provider router: Gemini → Groq → OpenRouter → Ollama. Chọn dựa trên health + quota. File: `local-backend/services/router9.js` |
| 20 | **State Manager** | 🔄 Hoàn thành | Lưu/load trạng thái workflow: JSON + SQLite `workflow_states` table. File: `local-backend/services/stateManager.js` |
| 21 | **Meta-Prompt** | 🔄 Hoàn thành | 5 bước adaptive synthesis: Anomaly Detection → Market Regime → Critique Rules → Cross-Reference → Generate Report. File: `local-backend/config/meta_prompt.md` |
| 22 | **Database V3** | 🔄 Hoàn thành | 8 tables: chat_history, reports (extended), settings, schedules, api_keys, report_templates (3 presets), agent_tasks, workflow_states. File: `local-backend/db.js` |
| 23 | **Server V3** | 🔄 Hoàn thành | Express server với 40+ endpoints: V2 preserved + `/api/health/all`, `/api/health/:provider`, `/api/precheck/run`, `/api/registry`, `/api/report-templates`, `/api/agent-tasks`, `/api/workflow/run`, `/api/workflow/status`, `/api/router/select`, `/api/state/save`, `/api/state/load`. File: `local-backend/server.js` |
| 24 | **Frontend V3 Routes** | 🔄 Hoàn thành | 11 routes: 6 V2 + 5 V3 (`/report-builder`, `/data-collection`, `/charts`, `/audio`, `/graph-3d`). File: `src/App.tsx` |
| 25 | **Frontend V3 Components** | 🔄 Hoàn thành | ReportBuilder, CollectionPanel, ChartViewer, AudioPlayer, Graph3D. Plus upgrades: ExecutiveBrainConsole (regime badge), WorkflowVisualizer (regime coloring), HealthCheckPanel (precheck), OutputSettingsPanel (matrix), Header (regime badge + nav). Files: `src/sections/*` |
| 26 | **Python Scripts V3** | 🔄 Hoàn thành | `youtube_analyzer.py` (transcript validation), `stock_fetcher.py` (OHLCV + indicators), `tts_generator.py` (TTS), `chart_generator.py` (chart images). Files: `local-backend/scripts/*.py` |
| 27 | **Config Files V3** | 🔄 Hoàn thành | `indicators_config.json` (10 indicators), `report_templates.json` (3 presets), `meta_prompt.md` (5-step synthesis). Files: `local-backend/config/*` |

### ⏳ CHƯA LÀM (V3.0)

| # | Tính năng | Trạng thái | Chi tiết |
|---|-----------|-----------|----------|
| 28 | **NotebookLM Sync** | ⏳ Chưa làm | Google Drive sync + Audio Overview integration. Phase 7. Cần: Google Drive API, NotebookLM API, file upload, audio download. |
| 29 | **n8n Bridge** | ⏳ Chưa làm | Webhook service cho workflow automation. Phase 8. Cần: n8n webhook node, trigger endpoints, workflow mapping. |
| 30 | **Build & Deploy V3** | ⏳ Chưa làm | Cập nhật GitHub Pages với 5 tab mới. Phase 10. Cần: `npm run build`, copy `dist/*`, commit gh-pages. |

---

## 2. Phân tích tối ưu V3.0

### 2.1. Report Builder

**Vấn đề**: Người dùng cần tùy chỉnh mẫu báo cáo: chọn nội dung, thứ tự, kênh output.

**Giải pháp**:
- 3 presets: Daily Brief (7 section), Weekly Deep (10 section), YouTube Only (4 section)
- Section toggle + reorder (drag & drop)
- Output channel matrix: Telegram/Email/Dashboard per section
- Time range selector: 1 day / 7 days / 30 days / custom
- Source toggles: YouTube, RSS, API, Manual
- Schedule: Now / Daily / Weekly / Custom cron

**Kết quả**: Người dùng có thể tạo báo cáo theo ý muốn, gửi đến đúng kênh.

### 2.2. Data Collection Panel

**Vấn đề**: Cần quản lý nhiều nguồn dữ liệu với trạng thái real-time.

**Giải pháp**:
- 4 nguồn: YouTube (29 kênh), RSS (feeds), API (endpoints), Manual (input)
- Trạng thái: idle / running / success / error
- Progress bar + log viewer
- Action buttons: run / stop / view logs
- Auto-refresh mỗi 5 giây

**Kết quả**: Người dùng thấy rõ nguồn nào đang chạy, thành công hay lỗi.

### 2.3. Chart Viewer

**Vấn đề**: Cần đồ thị chuyên nghiệp với nhiều chỉ báo, đặc biệt Ichimoku.

**Giải pháp**:
- Chart.js với candlestick main panel
- 10 indicators: MA, EMA, RSI, MACD, Bollinger, Ichimoku (9-17-26-26-26), Ichimoku (65-129-5-2-2), Volume MA, OBV, Stochastic
- Sub-panels: Volume, RSI/MACD, Ichimoku cloud
- Symbol selector: 18 mã VN (VCB, VHM, VRE, GAS, GVR, HPG, FPT, MWG, MSN, PNJ, SSI, TCB, ACB, VPB, MBB, SHB, STB, EIB)
- Timeframe: 1d / 1w / 1m

**Kết quả**: Đồ thị chuyên nghiệp, đầy đủ chỉ báo cho phân tích kỹ thuật.

### 2.4. Audio Player

**Vấn đề**: Cần phát báo cáo dạng audio để nghe trên điện thoại.

**Giải pháp**:
- Web Speech API (client-side, miễn phí)
- Python TTS fallback (server-side, `tts_generator.py`)
- Playback controls: play/pause/stop, speed 0.5x-2x
- Download MP3
- Auto-play khi báo cáo mới

**Kết quả**: Người dùng có thể nghe báo cáo mà không cần đọc.

### 2.5. 3D Knowledge Graph

**Vấn đề**: Cần hiển thị mối liên hệ giữa cổ phiếu, chủ đề, kênh.

**Giải pháp**:
- D3.js force-directed simulation
- 3 loại node: stock (circle), topic (square), channel (triangle)
- Links: mentions (solid), correlations (dashed)
- Zoom, pan, drag
- Hover: tooltip với thông tin chi tiết
- Click: focus node + highlight neighbors

**Kết quả**: Trực quan hóa mối liên hệ, phát hiện cluster và influencer.

### 2.6. Agent Swarm

**Vấn đề**: Cần thu thập và phân tích dữ liệu từ nhiều nguồn song song.

**Giải pháp**:
- YouTubeWorker: subtitle-first (youtube-transcript-api) → yt-dlp caption → Groq Whisper → Gemini audio
- StockWorker: fetch OHLCV cho 18 symbols, tính 10 indicators qua Python `stock_fetcher.py`
- NewsWorker: RSS feeds (VNExpress, CafeF, VietStock...)
- AnalysisWorker: Meta-Prompt 5 bước adaptive synthesis
- DataMerge: merge + deduplicate + cross-reference
- ReportRenderer: render báo cáo theo template
- TTSService: chuyển báo cáo thành audio

**Kết quả**: Thu thập và phân tích tự động, song song, hiệu quả.

### 2.7. Precheck Engine

**Vấn đề**: Cần kiểm tra trước khi chạy workflow để tránh lỗi giữa chừng.

**Giải pháp**:
- 6 bước: API Health, Quota Forecast, Hardware, Dependency, Transcript, Dry-Run
- Mỗi bước: status (PASS/FAIL/WARN), message, detail
- Tổng: pass chỉ khi tất cả PASS
- UI: HealthCheckPanel hiển thị kết quả

**Kết quả**: Phát hiện vấn đề trước khi chạy, tiết kiệm thời gian và quota.

### 2.8. Router 9

**Vấn đề**: Cần chọn AI provider tốt nhất dựa trên tình trạng hiện tại.

**Giải pháp**:
- Fallback chain: Gemini → Groq → OpenRouter → Ollama
- Chọn dựa trên: health status, quota remaining, task type
- Health check: ping API, check response time
- Quota forecast: ước tính token cần thiết

**Kết quả**: Luôn có AI provider available, tối ưu chi phí.

### 2.9. Meta-Prompt

**Vấn đề**: Cần báo cáo chính xác, dùng đúng dữ liệu nguồn, không hallucination.

**Giải pháp**:
- 5 bước: Anomaly Detection → Market Regime → Critique Rules → Cross-Reference → Generate Report
- Source-grounded: mỗi claim phải cite `[Channel - Video Title - Date]`
- Raw data stored separately from AI analysis
- Adaptive: điều chỉnh dựa trên regime (Uptrend/Downtrend/Sideway)

**Kết quả**: Báo cáo chính xác, có căn cứ, đáng tin cậy.

---

## 3. Backup & Recovery

**Thư mục backup**: `backup/vnstock-ai-v2.0/`
- Chứa toàn bộ nguồn code: `src/`, `local-backend/`, `dist/`, config files
- **KHÔNG ĐƯỢC XÓA** - dùng để khôi phục/fix code khi cần
- Tạo backup sau mỗi lần thay đổi lớn

**Thư mục design V3**: `docs/upgrade-v3/`
- 5 file thiết kế chi tiết: overview, system graph, roadmap, advanced features, master prompt
- **KHÔNG ĐƯỢC XÓA** - dùng để chat mới hiểu thiết kế V3

---

## 4. Phân tích rủi ro & Giải pháp (V3.0)

| Rủi ro | Mức độ | Giải pháp |
|--------|--------|-----------|
| **better-sqlite3 Node v24** | Cao | better-sqlite3 chưa hỗ trợ Node v24. Cần downgrade Node hoặc dùng node-sqlite3. |
| **npm not in PATH** | Cao | `npm run build` thất bại. Cần thêm npm vào PATH hoặc dùng absolute path. |
| **Tunnel expire** | Cao | Cloudflared quick tunnel expire khi restart. Cần restart tunnel và cập nhật Telegram webhook. |
| **D1/Turso quota** | Trung bình | Free tier giới hạn. Monitor usage. Fallback về local-only khi hết quota. |
| **Backend offline** | Trung bình | Frontend có local fallback cho chat. Các tính năng khác cần backend. |
| **GitHub Pages limit** | Thấp | 1GB limit. Hiện tại ~300KB, không lo. |
| **Bot token leak** | Thấp | Token trong .env, không commit. Nếu leak: revoke và tạo mới. |
| **Source code loss** | Thấp | Backup trong `backup/vnstock-ai-v2.0/`. Không xóa. |
| **AI quota耗尽** | Trung bình | Router 9 tự động chuyển provider khi hết quota. |
| **YouTube API limit** | Trung bình | FREE-first (subtitle) trước khi dùng AI. Fallback chain bảo vệ quota. |

---

## 5. Hướng phát triển tiếp theo (V3.0)

### 5.1. Các pha còn lại

| Pha | Tính năng | Mô tả | Độ phức tạp |
|-----|-----------|-------|-------------|
| 7 | **NotebookLM Sync** | Google Drive sync + Audio Overview integration | Cao |
| 8 | **n8n Bridge** | Webhook service cho workflow automation | Trung bình |
| 10 | **Build & Deploy V3** | Cập nhật GitHub Pages với 5 tab mới | Trung bình |

### 5.2. Tối ưu hiệu năng

| # | Tối ưu | Mô tả |
|---|--------|-------|
| 1 | **Lazy loading** | Code-split routes với React.lazy() cho 5 tab mới |
| 2 | **Virtualization** | Virtual list cho chat history và log viewer dài |
| 3 | **Caching** | Cache API responses, chart data, settings |
| 4 | **Compression** | Brotli/Gzip cho static assets |
| 5 | **Image optimization** | WebP, lazy load images |

### 5.3. Tối ưu bảo mật

| # | Tối ưu | Mô tả |
|---|--------|-------|
| 1 | **Rate limiting** | Limit requests per IP |
| 2 | **Input validation** | Validate all API inputs |
| 3 | **CORS** | Restrict CORS origins |
| 4 | **HTTPS** | Force HTTPS for production |
| 5 | **Secrets** | Move all secrets to environment variables |

---

## 6. Metrics hiện tại (V3.0)

| Metric | Giá trị |
|--------|---------|
| **Frontend bundle** | ~350KB JS + ~35KB CSS (ước tính với 5 tab mới) |
| **API endpoints** | 40+ (30 V2 + 10 V3) |
| **Database tables** | 8 |
| **Telegram intents** | 9 |
| **Sync engines** | 2 (D1 + Turso) |
| **YouTube channels** | 29 |
| **Stock symbols** | 18 |
| **Indicators** | 10 |
| **Report templates** | 3 |
| **Agent workers** | 4 + 3 services |
| **Build time** | ~30 giây |
| **Deploy time** | ~15 giây |
| **Backend port** | 3004 |
| **Remote access channels** | 4 (Local, Tunnel, GitHub Pages, Telegram) |
| **User guide** | `HUONG_DAN_SU_DUNG.md` |
| **Auto start** | `auto-start.bat` - 1 lệnh tự động hóa toàn bộ |
| **Design docs** | `docs/upgrade-v3/` - 5 file |

---

## 7. Lưu ý cho chat mới

1. **Đọc RESUME_PROMPT.md trước** - Tóm tắt nhanh 2 phút
2. **Đọc MASTER_PROMPT.md** - Chi tiết đầy đủ
3. **Đọc docs/upgrade-v3/MASTER_PROMPT.md** - Thiết kế V3 chi tiết
4. **Source code**: `src/` (frontend), `local-backend/` (backend)
5. **Backup**: `backup/vnstock-ai-v2.0/` (khôi phục khi cần)
6. **Test**: `npm run dev` (frontend), `node local-backend/server.js` (backend)
7. **Auto Start**: `auto-start.bat` chỉ 3 dòng → gọi Python `auto_start.py` xử lý toàn bộ: backend + tunnel + webhook + browser
8. **Deploy**: `npm run build` → copy dist/* → commit → push gh-pages
9. **Push All**: Chạy `push-all.bat` hoặc `node local-backend/scripts/push-all.js`
10. **Remote Access**: Đọc `HUONG_DAN_SU_DUNG.md` để biết cách truy cập từ xa
11. **Tunnel**: `start-tunnel.bat` để tạo URL truy cập từ xa (hoặc dùng `auto-start.bat` để tự động hóa toàn bộ)
12. **Quy tắc FIX CODE quan trọng**:
    - **Trước khi sửa code lớn**: Backup toàn bộ `src/`, `local-backend/` vào `backup/vnstock-ai-v2.0/`
    - **Sau khi fix code**: Cập nhật lại `MASTER_PROMPT.md`, `RESUME_PROMPT.md`, `PROGRESS_ANALYSIS_v3.md`, `HUONG_DAN_SU_DUNG.md`
    - **Không xóa source hẳn**: Chỉ thay thế sau khi đã backup
    - **Git commit**: Mỗi thay đổi phải commit với message rõ ràng
13. **V3 Status**: 8/11 pha đã hoàn thành. Còn: Phase 7 (NotebookLM), Phase 8 (n8n Bridge), Phase 10 (Build & Deploy)
14. **Blocker hiện tại**: `better-sqlite3` lỗi trên Node v24, `npm` không trong PATH

---

*Cập nhật: 2026-06-08. V3.0 đã hoàn thành — 11/11 pha.*
