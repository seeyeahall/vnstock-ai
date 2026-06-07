# VNStock AI v3.0 — Lộ trình nâng cấp (Upgrade Roadmap)

> **Mục đích**: Tiến trình tuần tự các bước cần thực hiện để nâng cấp từ v2.0 lên v3.0. Mỗi bước có mục tiêu, file cần sửa, và tiêu chí hoàn thành.
> **Ngày cập nhật**: 2026-06-07
> **Tổng thời gian ước tính**: 6-8 tuần (1 developer full-time)

---

## Pha 0: Chuẩn bị nền tảng (Tuần 1)

### Bước 0.1: Backup & Branch

**Mục tiêu**: Đảm bảo có thể rollback bất cứ lúc nào

**Thao tác**:
```bash
# Backup toàn bộ source hiện tại
cp -r src backup/vnstock-ai-v2.0-before-v3/
cp -r local-backend backup/vnstock-ai-v2.0-before-v3/

# Tạo branch git mới
git checkout -b upgrade-v3.0
```

**Tiêu chí hoàn thành**:
- [ ] Thư mục backup chứa toàn bộ source v2.0
- [ ] Git branch `upgrade-v3.0` đã tạo
- [ ] Có thể checkout về v2.0 bất cứ lúc nào

### Bước 0.2: Restore Backend đang thiếu

**Mục tiêu**: `local-backend/` hiện tại chỉ có `data/` (SQLite), thiếu `server.js`, scripts Python

**Thao tác**:
```bash
# Restore từ backup hoặc rebuild
# File cần có:
# - local-backend/server.js (Express, 30+ API endpoints)
# - local-backend/db.js (better-sqlite3, 5 tables)
# - local-backend/sync.js (D1 + Turso)
# - local-backend/scripts/youtube_analyzer.py
# - local-backend/scripts/send_email.py
# - local-backend/scripts/auto_start.py
# - local-backend/scripts/push-all.js
```

**Tiêu chí hoàn thành**:
- [ ] `node local-backend/server.js` chạy được trên port 3004
- [ ] `GET /api/health` trả về `{"success": true}`
- [ ] SQLite 5 tables đã tạo
- [ ] `POST /api/youtube/analyze` hoạt động
- [ ] `POST /api/send-email` hoạt động

### Bước 0.3: Tạo cấu trúc thư mục mới

**Mục tiêu**: Chuẩn bị chỗ cho các module mới

**Thao tác**:
```bash
mkdir -p src/sections/report-builder
mkdir -p src/sections/data-collection
mkdir -p src/sections/chart-viewer
mkdir -p src/sections/audio-player
mkdir -p src/sections/graph-3d
mkdir -p local-backend/workers
mkdir -p local-backend/scripts/charts
mkdir -p local-backend/scripts/tts
mkdir -p local-backend/config
mkdir -p docs/upgrade-v3
```

**Tiêu chí hoàn thành**:
- [ ] Cấu trúc thư mục mới đã tạo xong

---

## Pha 1: Precheck Engine & Executive Brain (Tuần 1-2)

### Bước 1.1: API Registry

**File cần sửa**:
- `local-backend/config/api_registry.json` (mới)
- `local-backend/server.js` (thêm endpoint)

**Mô tả**:
Tạo registry chứa thông tin tất cả API:
```json
{
  "gemini": {
    "provider": "google",
    "api_key": "",
    "health_url": "https://generativelanguage.googleapis.com/v1beta/models",
    "rpm_limit": 15,
    "rpd_limit": 1500,
    "max_context": 2000000,
    "priority": 1,
    "fallback": ["groq", "openrouter", "ollama"]
  },
  "groq": { ... },
  "openrouter": { ... },
  "telegram": { ... },
  "email": { ... }
}
```

**Tiêu chí hoàn thành**:
- [ ] File `api_registry.json` tạo xong với đầy đủ API
- [ ] API `GET /api/registry` trả về danh sách API
- [ ] API `POST /api/registry/:provider` cập nhật API key

### Bước 1.2: API Health Check Service

**File cần sửa**:
- `local-backend/services/healthCheck.js` (mới)
- `local-backend/server.js` (thêm endpoint)

**Mô tả**:
Tạo service kiểm tra health của tất cả API:
```javascript
async function checkApiHealth(provider) {
  // Ping health_url
  // Trả về: { status: 'healthy'|'unhealthy', latency_ms, quota_remaining }
}
```

**Endpoint mới**:
- `GET /api/health/all` — Kiểm tra tất cả API
- `GET /api/health/:provider` — Kiểm tra 1 API

**Tiêu chí hoàn thành**:
- [ ] Health check chạy được cho Gemini, Groq, Telegram, Email
- [ ] Trả về latency và quota remaining
- [ ] Lưu kết quả vào SQLite `api_keys` table

### Bước 1.3: Quota Forecast Service

**File cần sửa**:
- `local-backend/services/quotaForecast.js` (mới)

**Mô tả**:
Tính toán token estimate trước khi chạy workflow:
```javascript
function forecastQuota(inputs) {
  // inputs: { videos: 50, articles: 30, symbols: 10 }
  // Tính estimated_tokens
  // So sánh với api_registry quota limit
  // Trả về: { status: 'PASS'|'OVERLOAD', batches: 3 }
}
```

**Tiêu chí hoàn thành**:
- [ ] Tính đúng estimated tokens cho 29 kênh YouTube
- [ ] Phát hiện OVERLOAD và đề xuất batch split
- [ ] Tích hợp vào Precheck Engine

### Bước 1.4: Hardware Validator

**File cần sửa**:
- `local-backend/services/hardwareCheck.js` (mới)

**Mô tả**:
Kiểm tra CPU, RAM, Disk trước khi chạy:
```javascript
function checkHardware() {
  // Đọc CPU usage, RAM free, Disk free
  // So sánh với yêu cầu workflow
  // Trả về: { status: 'PASS'|'FAIL', ram_required, ram_available }
}
```

**Tiêu chí hoàn thành**:
- [ ] Đọc được RAM, CPU, Disk trên Windows
- [ ] So sánh với profile hardware (low/medium/high_end)
- [ ] Đề xuất điều chỉnh parallel workers

### Bước 1.5: Precheck Engine (Tổng hợp)

**File cần sửa**:
- `local-backend/services/precheckEngine.js` (mới)
- `src/sections/PrecheckPanel.tsx` (mới)

**Mô tả**:
Tổng hợp tất cả check thành 1 engine:
```javascript
async function runPrecheck(workflowConfig) {
  const results = {
    apiHealth: await checkApiHealth(),
    quota: await forecastQuota(workflowConfig),
    hardware: await checkHardware(),
    dependencies: await checkDependencies(),
    transcript: await validateTranscriptConfig(),
    dryRun: await runDryRun()
  };
  
  const pass = Object.values(results).every(r => r.status === 'PASS');
  return { pass, results };
}
```

**UI mới**: Tab "Precheck" hoặc tích hợp vào Health Check:
- Hiển thị từng check với icon ✓/✗
- Progress bar cho từng bước
- Nút "Run Precheck" trước khi chạy workflow

**Tiêu chí hoàn thành**:
- [ ] Precheck chạy đúng 6 bước: API, Quota, Hardware, Dependency, Transcript, Dry-Run
- [ ] UI hiển thị kết quả rõ ràng
- [ ] Nếu FAIL → hiển thị lý do và nút "Auto-fix"

### Bước 1.6: 9Router (AI Provider Router)

**File cần sửa**:
- `local-backend/services/router9.js` (mới)

**Mô tả**:
Tự động chọn AI provider tối ưu:
```javascript
class Router9 {
  async selectProvider(task, preferred = 'gemini') {
    const providers = ['gemini', 'groq', 'openrouter', 'ollama'];
    
    for (const provider of providers) {
      const health = await checkApiHealth(provider);
      if (health.status === 'healthy' && health.quota_remaining > 20) {
        return provider;
      }
    }
    
    throw new Error('No available AI provider');
  }
}
```

**Tiêu chí hoàn thành**:
- [ ] Tự động chọn provider dựa trên health + quota
- [ ] Fallback chain: Gemini → Groq → OpenRouter → Ollama
- [ ] Log lại lựa chọn để audit

### Bước 1.7: State Manager

**File cần sửa**:
- `local-backend/services/stateManager.js` (mới)
- `local-backend/db.js` (thêm bảng `workflow_states`)

**Mô tả**:
Lưu và phục hồi trạng thái workflow:
```javascript
class StateManager {
  async saveState(workflowId, state) {
    // Lưu vào SQLite: { workflow_id, step, progress, data }
  }
  
  async resumeState(workflowId) {
    // Đọc từ SQLite, trả về state để tiếp tục
  }
}
```

**Tiêu chí hoàn thành**:
- [ ] Lưu state mỗi 10% progress
- [ ] Phục hồi đúng từ step đã chạy
- [ ] Không chạy lại từ đầu khi crash

---

## Pha 2: Agent Swarm & Data Ingestion (Tuần 2-3)

### Bước 2.1: YouTube Worker (Nâng cấp)

**File cần sửa**:
- `local-backend/workers/youtubeWorker.js` (mới)
- `local-backend/scripts/youtube_analyzer.py` (nâng cấp)

**Mô tả**:
Tách youtube_analyzer.py thành worker độc lập:
```javascript
class YouTubeWorker {
  async collect(config) {
    // config: { channels: 29, days: 7, max_videos_per_channel: 10 }
    // Gọi Python script qua child_process
    // Trả về: { videos: [...], transcripts: [...] }
  }
  
  async validateTranscript(video) {
    // Kiểm tra transcript length vs video duration
    // Nếu lỗi → fallback chain
  }
}
```

**Tiêu chí hoàn thành**:
- [ ] Worker chạy độc lập, có progress callback
- [ ] Transcript validation: length check
- [ ] Fallback chain: subtitle → yt-dlp → Whisper → Gemini audio
- [ ] Lưu kết quả vào SQLite

### Bước 2.2: Stock Data Worker (Mới)

**File cần sửa**:
- `local-backend/workers/stockWorker.js` (mới)
- `local-backend/scripts/stock_fetcher.py` (mới)

**Mô tả**:
Tạo worker lấy dữ liệu chứng khoán:
```javascript
class StockWorker {
  async fetchOHLCV(symbols, timeframe = '1d', days = 7) {
    // Gọi VNStock API / TCBS / SSI iBoard
    // Trả về: { symbol, ohlcv: [...] }
  }
  
  async calculateIndicators(ohlcv) {
    // Tính MA, RSI, MACD, Bollinger, Ichimoku
    // Trả về: indicators object
  }
}
```

**Tiêu chí hoàn thành**:
- [ ] Lấy được OHLCV cho VNINDEX, FPT, VCB, HPG, ...
- [ ] Tính đúng 10 chỉ báo (xem Pha 5)
- [ ] Lưu vào SQLite

### Bước 2.3: RSS News Worker (Mới)

**File cần sửa**:
- `local-backend/workers/newsWorker.js` (mới)

**Mô tả**:
Tạo worker thu thập tin tức:
```javascript
class NewsWorker {
  async collect(feeds, maxArticles = 50) {
    // feeds: ['CafeF', 'VietStock', 'SSI Research']
    // Parse RSS, extract title, content, date
    // Keyword extraction + sentiment analysis
    // Trả về: { articles: [...] }
  }
}
```

**Tiêu chí hoàn thành**:
- [ ] Thu thập từ CafeF, VietStock, SSI Research
- [ ] Extract keywords tự động
- [ ] Sentiment analysis (positive/negative/neutral)

### Bước 2.4: Data Merge Service

**File cần sửa**:
- `local-backend/services/dataMerge.js` (mới)

**Mô tả**:
Gom dữ liệu từ tất cả agents:
```javascript
class DataMergeService {
  async merge(agentResults) {
    // agentResults: { youtube: [...], stock: [...], news: [...] }
    // Deduplicate: loại bỏ video/tin trùng
    // Tạo mega_context JSON
    // Trả về: mergedData
  }
}
```

**Tiêu chí hoàn thành**:
- [ ] Gom đúng dữ liệu từ tất cả agents
- [ ] Deduplicate hoạt động
- [ ] Tạo mega_context đúng format

### Bước 2.5: Data Collection Panel (UI)

**File cần sửa**:
- `src/sections/data-collection/CollectionPanel.tsx` (mới)

**Mô tả**:
UI hiển thị tiến trình thu thập:
```tsx
// Hiển thị từng agent với progress bar
// YouTube Collector: ████████░░ 80% (46/58 videos)
// Stock Data Fetcher: ██████████ 100% (10 symbols)
// RSS News Collector: ██████░░░░ 60% (30/50 articles)
// Nút "Pause" / "Resume" / "Cancel"
```

**Tiêu chí hoàn thành**:
- [ ] Hiển thị progress real-time (WebSocket hoặc polling)
- [ ] Có thể pause/resume từng agent
- [ ] Hiển thị error nếu agent fail

---

## Pha 3: Report Builder (Tuần 3-4)

### Bước 3.1: Report Template Database

**File cần sửa**:
- `local-backend/db.js` (thêm bảng `report_templates`)

**Schema**:
```sql
CREATE TABLE report_templates (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  template_id TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  sections TEXT, -- JSON: [{"id": "macro", "enabled": true, "order": 1}]
  output_channels TEXT, -- JSON: {"telegram": ["macro", "sentiment"], "email": [...]}
  time_range TEXT, -- 1d | 1w | 1m
  sources TEXT, -- JSON: ["youtube", "stock", "rss"]
  schedule TEXT, -- JSON: ["07:00", "20:00"] hoặc null
  enabled BOOLEAN DEFAULT 1,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

**Tiêu chí hoàn thành**:
- [ ] Bảng tạo xong
- [ ] API CRUD: GET/POST/PUT/DELETE `/api/report-templates`

### Bước 3.2: Report Builder UI

**File cần sửa**:
- `src/sections/report-builder/ReportBuilder.tsx` (mới)
- `src/sections/report-builder/SectionSelector.tsx` (mới)
- `src/sections/report-builder/OutputConfig.tsx` (mới)

**Mô tả**:
UI cho phép người dùng thiết lập mẫu báo cáo:
```tsx
// 1. Template Name input
// 2. Section list (kéo thả sắp xếp):
//    ☑ Macro Overview
//    ☑ Sector Rotation
//    ☑ Stock Cards
//    ☑ Technical Chart
//    ☑ Sentiment Gauge
//    ☑ Insights
//    ☑ Watchlist Table
//    ☐ Audio Summary
//    ☐ 3D Graph
// 3. Output channel matrix:
//    | Section      | Telegram | Email | Dashboard |
//    | Macro        |    ☑     |   ☑   |     ☑     |
// 4. Time range: [7 days ▼]
// 5. Sources: ☑ YouTube ☑ Stock ☑ RSS
// 6. Schedule: [Manual ▼] hoặc [07:00, 20:00]
// 7. Nút: "Save Template" | "Run Now"
```

**Tiêu chí hoàn thành**:
- [ ] Kéo thả sắp xếp sections
- [ ] Toggle bật/tắt từng section
- [ ] Chọn output channel cho từng section
- [ ] Lưu template vào SQLite

### Bước 3.3: Report Template Presets

**File cần sửa**:
- `local-backend/config/report_templates.json` (mới)

**Mô tả**:
Tạo sẵn 3 mẫu mặc định:
```json
{
  "daily_brief": {
    "name": "Báo cáo hàng ngày",
    "sections": ["macro", "sentiment", "watchlist"],
    "channels": { "telegram": ["macro", "sentiment"], "email": ["all"] },
    "time_range": "1d",
    "schedule": ["07:00", "20:00"]
  },
  "weekly_deep": {
    "name": "Báo cáo chuyên sâu tuần",
    "sections": ["macro", "sector", "stock", "chart", "sentiment", "insight", "watchlist"],
    "channels": { "email": ["all"], "dashboard": ["all"] },
    "time_range": "1w"
  },
  "youtube_only": {
    "name": "Tổng hợp YouTube",
    "sections": ["macro", "sentiment", "audio"],
    "channels": { "telegram": ["macro", "audio"] },
    "sources": ["youtube"]
  }
}
```

**Tiêu chí hoàn thành**:
- [ ] 3 preset tạo sẵn trong DB khi khởi động
- [ ] Người dùng có thể clone và chỉnh sửa

---

## Pha 4: Adaptive Synthesis & AI Engine (Tuần 4-5)

### Bước 4.1: Meta-Prompt Template

**File cần sửa**:
- `local-backend/config/meta_prompt.md` (mới)

**Mô tả**:
Tạo file Meta-Prompt 5 bước:
```markdown
ROLE: Chuyên gia phân tích thị trường tài chính, tư duy phản biện cực đoan.

QUY TRÌNH 5 BƯỚC (BẮT BUỘC):
B1. Quét tần suất từ khóa, vol nổ, giá gãy nền → Xác định ngành tiêu điểm
B2. Phân loại trạng thái: Uptrend FOMO / Downtrend / Sideway
B3. Kích hoạt bộ quy tắc phản biện tương ứng
B4. Đối chiếu chéo chuyên gia: Bullish vs Bearish + Blind Spots
B5. Xuất báo cáo theo mẫu người dùng

CẤU TRÚC 4 PHẦN:
PHẦN 1: Toàn cảnh vĩ mô & Nhân quả
PHẦN 2: Vi mô ngành & Cổ phiếu
PHẦN 3: Insights & Cảnh báo
PHẦN 4: Watchlist & Hành động
```

**Tiêu chí hoàn thành**:
- [ ] File meta_prompt.md hoàn chỉnh
- [ ] Có thể nạp động vào Gemini API

### Bước 4.2: Analysis Worker

**File cần sửa**:
- `local-backend/workers/analysisWorker.js` (mới)

**Mô tả**:
Worker gọi AI để phân tích:
```javascript
class AnalysisWorker {
  async analyze(megaContext, template, provider = 'gemini') {
    // 1. Nạp Meta-Prompt
    // 2. Nạp mega_context
    // 3. Nạp template sections
    // 4. Gọi AI provider qua 9Router
    // 5. Parse kết quả thành structured report
    // 6. Trả về: { sections: {...}, market_regime, focus_sectors }
  }
}
```

**Tiêu chí hoàn thành**:
- [ ] Chạy đúng 5 bước Meta-Prompt
- [ ] Trả về structured report với đúng 4 phần
- [ ] Nhận diện đúng market regime

### Bước 4.3: Report Renderer

**File cần sửa**:
- `local-backend/services/reportRenderer.js` (mới)

**Mô tả**:
Render báo cáo theo từng format:
```javascript
class ReportRenderer {
  async render(report, format) {
    switch(format) {
      case 'markdown': return this.toMarkdown(report);
      case 'html': return this.toHTML(report);
      case 'audio': return this.toAudio(report); // TTS
      case 'excel': return this.toExcel(report);
      case 'pdf': return this.toPDF(report);
    }
  }
}
```

**Tiêu chí hoàn thành**:
- [ ] Render Markdown đúng format
- [ ] Render HTML có CSS inline
- [ ] Tích hợp TTS cho audio

---

## Pha 5: Technical Charts & Indicators (Tuần 5)

### Bước 5.1: Chart Data API

**File cần sửa**:
- `local-backend/services/chartService.js` (mới)
- `local-backend/scripts/chart_generator.py` (mới)

**Mô tả**:
API trả về dữ liệu chart + indicators:
```javascript
// GET /api/charts/:symbol?timeframe=1d&indicators=ma,rsi,macd
{
  "symbol": "FPT",
  "ohlcv": [...],
  "indicators": {
    "ma": { "ma5": [...], "ma20": [...], "ma50": [...] },
    "rsi": { "rsi14": [...] },
    "macd": { "macd": [...], "signal": [...], "histogram": [...] },
    "bollinger": { "upper": [...], "middle": [...], "lower": [...] },
    "ichimoku": { "tenkan": [...], "kijun": [...], "senkou_a": [...], "senkou_b": [...], "chikou": [...] }
  }
}
```

**Tiêu chí hoàn thành**:
- [ ] API trả về OHLCV + indicators
- [ ] Hỗ trợ multiple timeframes

### Bước 5.2: 10 Chỉ báo cơ bản

**File cần sửa**:
- `local-backend/config/indicators_config.json` (mới)
- `local-backend/scripts/indicators/` (thư mục mới)

**Danh sách 10 chỉ báo**:

| # | Chỉ báo | Tham số | Mô tả |
|---|---------|---------|-------|
| 1 | **MA** | 5, 20, 50 | Moving Average đơn giản |
| 2 | **EMA** | 12, 26 | Exponential Moving Average |
| 3 | **RSI** | 14 | Relative Strength Index |
| 4 | **MACD** | 12, 26, 9 | Moving Average Convergence Divergence |
| 5 | **Bollinger Bands** | 20, 2 | Dải Bollinger |
| 6 | **Ichimoku Standard** | **9, 17, 26, 26, 26** | Tenkan, Kijun, Senkou A/B, Chikou |
| 7 | **Ichimoku Long-term** | **65, 129, 5, 2, 2** | Ichimoku cho khung dài hạn |
| 8 | **Volume MA** | 20 | Khối lượng trung bình |
| 9 | **OBV** | - | On-Balance Volume |
| 10 | **Stochastic** | 14, 3, 3 | Stochastic Oscillator |

**Cấu hình Ichimoku**:
```json
{
  "ichimoku_standard": {
    "tenkan": 9,
    "kijun": 17,
    "senkou_b": 26,
    "senkou_span": 26,
    "chikou": 26,
    "description": "Ichimoku chuẩn cho khung ngày"
  },
  "ichimoku_longterm": {
    "tenkan": 65,
    "kijun": 129,
    "senkou_b": 5,
    "senkou_span": 2,
    "chikou": 2,
    "description": "Ichimoku cho khung tuần/tháng"
  }
}
```

**Tiêu chí hoàn thành**:
- [ ] Tính đúng công thức 10 chỉ báo
- [ ] Ichimoku 9-17-26-26-26 tính đúng Tenkan, Kijun, Senkou A/B, Chikou
- [ ] Ichimoku 65-129-5-2-2 tính đúng cho khung dài hạn
- [ ] Unit test cho từng chỉ báo

### Bước 5.3: Chart Viewer UI

**File cần sửa**:
- `src/sections/chart-viewer/ChartViewer.tsx` (mới)
- `src/sections/chart-viewer/IndicatorOverlay.tsx` (mới)

**Mô tả**:
Tích hợp TradingView Lightweight Charts hoặc Chart.js:
```tsx
// Hiển thị chart nến với overlay indicators
// Dropdown chọn: Symbol, Timeframe, Indicators
// Checkbox bật/tắt từng indicator
// Nút "Add to Report" để chèn vào báo cáo
```

**Tiêu chí hoàn thành**:
- [ ] Hiển thị nến OHLCV
- [ ] Overlay MA, RSI, MACD, Bollinger
- [ ] Overlay Ichimoku (cả 2 cấu hình)
- [ ] Tương tác: zoom, pan, crosshair

---

## Pha 6: Audio & 3D Visualization (Tuần 5-6)

### Bước 6.1: TTS Service

**File cần sửa**:
- `local-backend/services/ttsService.js` (mới)
- `local-backend/scripts/tts_generator.py` (mới)

**Mô tả**:
Tạo audio từ text báo cáo:
```python
# tts_generator.py
def generate_audio(text, voice='vi-VN-Standard-A', output_path='report.mp3'):
    # Dùng Google Cloud TTS hoặc Gemini TTS
    # Trả về: file MP3
```

**Tiêu chí hoàn thành**:
- [ ] Tạo MP3 từ text báo cáo
- [ ] Hỗ trợ tiếng Việt
- [ ] Thời lượng 3-5 phút

### Bước 6.2: Audio Player UI

**File cần sửa**:
- `src/sections/audio-player/AudioPlayer.tsx` (mới)

**Mô tả**:
Player nhúng trong Dashboard:
```tsx
// Audio player với controls: play, pause, seek, speed
// Hiển thị transcript sync (karaoke style)
// Nút "Download MP3"
```

**Tiêu chí hoàn thành**:
- [ ] Phát audio trong app
- [ ] Controls cơ bản
- [ ] Hiển thị trong báo cáo Dashboard

### Bước 6.3: 3D Market Graph

**File cần sửa**:
- `src/sections/graph-3d/Graph3D.tsx` (mới)

**Mô tả**:
D3.js force-directed graph:
```tsx
// Node = cổ phiếu (màu = sentiment: xanh = bullish, đỏ = bearish)
// Edge = tương quan giá hoặc cùng ngành
// Zoom, pan, click node để xem chi tiết
// Nút "Add to Report"
```

**Tiêu chí hoàn thành**:
- [ ] Hiển thị graph tương tác
- [ ] Node màu theo sentiment
- [ ] Có thể thêm vào báo cáo

---

## Pha 7: NotebookLM Integration (Tuần 6)

### Bước 7.1: Google Drive Sync

**File cần sửa**:
- `local-backend/services/notebooklmSync.js` (mới)

**Mô tả**:
Đồng bộ raw data lên Google Drive:
```javascript
class NotebookLMSync {
  async syncToDrive(megaContext, folderName = 'VNStock_Daily_Intelligence') {
    // 1. Tạo/tìm folder trên Google Drive
    // 2. Tạo file Markdown từ megaContext
    // 3. Upload lên folder
    // 4. Trả về: file IDs
  }
}
```

**Tiêu chí hoàn thành**:
- [ ] Upload file Markdown lên Google Drive
- [ ] Tạo đúng folder structure
- [ ] Có thể cấu hình folder ID

### Bước 7.2: NotebookLM Audio Overview

**File cần sửa**:
- `local-backend/services/notebooklmAudio.js` (mới)

**Mô tả**:
Lấy Audio Overview từ NotebookLM:
```javascript
class NotebookLMAudio {
  async getAudioOverview(notebookId) {
    // NotebookLM tự tạo audio khi có đủ dữ liệu
    // Cần poll hoặc webhook để biết khi nào audio sẵn sàng
    // Trả về: audio URL hoặc file
  }
}
```

**Tiêu chí hoàn thành**:
- [ ] Lấy được Audio Overview từ NotebookLM
- [ ] Tích hợp vào báo cáo

### Bước 7.3: NotebookLM Settings UI

**File cần sửa**:
- `src/sections/OutputSettingsPanel.tsx` (thêm section)

**Mô tả**:
Thêm cấu hình NotebookLM vào Settings:
```tsx
// Toggle: "Enable NotebookLM Sync"
// Input: Google Drive Folder ID
// Input: Notebook ID (nếu có)
// Nút: "Test Sync"
// Nút: "Manual Sync Now"
```

**Tiêu chí hoàn thành**:
- [ ] Cấu hình NotebookLM trong Settings
- [ ] Nút test sync hoạt động

---

## Pha 8: n8n Bridge (Tuần 6-7)

### Bước 8.1: n8n Webhook Service

**File cần sửa**:
- `local-backend/services/n8nBridge.js` (mới)

**Mô tả**:
Service gọi webhook n8n:
```javascript
class N8nBridge {
  async sendTask(taskType, payload) {
    // taskType: 'ingest_youtube' | 'deliver' | 'full_workflow'
    // payload: dữ liệu cần xử lý
    // Gọi webhook n8n
    // Trả về: kết quả hoặc error
  }
  
  async receiveResult(webhookData) {
    // Nhận kết quả từ n8n webhook callback
    // Cập nhật state trong SQLite
  }
}
```

**Tiêu chí hoàn thành**:
- [ ] Gọi được webhook n8n
- [ ] Nhận được kết quả callback
- [ ] Xử lý error khi n8n fail

### Bước 8.2: n8n Toggle UI

**File cần sửa**:
- `src/sections/OutputSettingsPanel.tsx` (thêm section)

**Mô tả**:
Thêm toggle n8n vào Settings:
```tsx
// Toggle: "Enable n8n External Worker"
// Input: n8n Webhook URL
// Input: n8n API Key
// Select: Fallback mode [Local ▼] khi n8n fail
// Nút: "Test Connection"
```

**Tiêu chí hoàn thành**:
- [ ] Toggle bật/tắt n8n
- [ ] Test connection hoạt động
- [ ] Fallback về local khi n8n fail

---

## Pha 9: Polish & Integration (Tuần 7-8)

### Bước 9.1: Executive Brain Console (Nâng cấp)

**File cần sửa**:
- `src/sections/ExecutiveBrainConsole.tsx`

**Mô tả**:
Thay mock data bằng real-time:
```tsx
// Hiển thị:
// - Agent Swarm status (real progress từ DB)
// - Current task đang chạy
// - 9Router: provider đang dùng
// - Recovery events (nếu có)
// - Live logs từ backend (WebSocket)
```

**Tiêu chí hoàn thành**:
- [ ] Hiển thị tiến trình thực từ DB
- [ ] Logs real-time qua WebSocket hoặc polling
- [ ] Không còn mock data

### Bước 9.2: Workflow Graph (Nâng tầng)

**File cần sửa**:
- `src/sections/WorkflowVisualizer.tsx`

**Mô tả**:
Thay static SVG bằng dynamic graph:
```tsx
// Nodes hiển thị trạng thái thực:
// - Màu xanh: đang chạy
// - Màu xám: chờ
// - Màu đỏ: lỗi
// - Click node để xem chi tiết
// - Animation khi data chảy qua
```

**Tiêu chí hoàn thành**:
- [ ] Graph cập nhật theo trạng thái thực
- [ ] Animation data flow
- [ ] Click node xem chi tiết

### Bước 9.3: Health Check (Nâng cấp)

**File cần sửa**:
- `src/sections/HealthCheckPanel.tsx`

**Mô tả**:
Thay mock data bằng real API check:
```tsx
// Gọi GET /api/health/all
// Hiển thị latency thực
// Hiển thị quota remaining
// Cảnh báo khi quota < 20%
```

**Tiêu chí hoàn thành**:
- [ ] Health check gọi API thực
- [ ] Hiển thị latency, quota thực
- [ ] Cảnh báo khi quota thấp

### Bước 9.4: Chat AI (Nâng cấp)

**File cần sửa**:
- `src/sections/ChatPanel.tsx`
- `local-backend/server.js` (NLU)

**Mô tả**:
Tích hợp NLU để trigger workflow:
```
User: "Tạo báo cáo tuần"
→ Intent: create_report
→ Action: Gọi Report Builder với template "weekly_deep"
→ Bot: "Đang tạo báo cáo tuần... [progress]"

User: "Gửi báo cáo qua Telegram"
→ Intent: deliver_report
→ Action: Gọi Delivery Service
→ Bot: "Đã gửi! ✅"
```

**Tiêu chí hoàn thành**:
- [ ] NLU nhận diện intent tạo báo cáo
- [ ] Chat trigger workflow thực
- [ ] Hiển thị progress trong chat

### Bước 9.5: Testing & Bugfix

**Thao tác**:
```bash
# Test end-to-end
npm run dev          # Frontend
node local-backend/server.js  # Backend

# Test từng pha:
# 1. Precheck → PASS
# 2. Data Collection → 29 kênh OK
# 3. Report Builder → Tạo mẫu OK
# 4. Analysis → 4 phần OK
# 5. Charts → 10 indicators OK
# 6. Audio → MP3 OK
# 7. Delivery → Telegram + Email OK
```

**Tiêu chí hoàn thành**:
- [ ] End-to-end test thành công
- [ ] Không còn mock data
- [ ] Tất cả API hoạt động

---

## Pha 10: Documentation & Deploy (Tuần 8)

### Bước 10.1: Cập nhật tài liệu

**File cần sửa**:
- `MASTER_PROMPT.md`
- `RESUME_PROMPT.md`
- `PROGRESS_ANALYSIS_v2.md` → `PROGRESS_ANALYSIS_v3.md`
- `HUONG_DAN_SU_DUNG.md`

**Tiêu chí hoàn thành**:
- [ ] Tất cả prompt files cập nhật lên v3.0
- [ ] Hướng dẫn sử dụng mới có Report Builder
- [ ] API spec cập nhật

### Bước 10.2: Build & Deploy

**Thao tác**:
```bash
npm run build
node local-backend/scripts/push-all.js
```

**Tiêu chí hoàn thành**:
- [ ] Build thành công
- [ ] Deploy lên GitHub Pages
- [ ] Backend chạy ổn định
- [ ] Telegram bot hoạt động

---

## Tóm tắt timeline

| Tuần | Pha | Mục tiêu chính |
|------|-----|---------------|
| 1 | 0 + 1 | Backup, restore backend, Precheck Engine, 9Router, State Manager |
| 2 | 1 + 2 | Hoàn thiện Precheck, Agent Swarm (YouTube, Stock, News) |
| 3 | 2 + 3 | Data Collection UI, Report Builder DB + UI |
| 4 | 3 + 4 | Report Templates, Meta-Prompt, Analysis Worker |
| 5 | 4 + 5 | Report Renderer, 10 Indicators, Chart Viewer |
| 6 | 5 + 6 + 7 | Audio TTS, 3D Graph, NotebookLM Sync |
| 7 | 7 + 8 + 9 | n8n Bridge, Executive Brain real-time, Workflow Graph dynamic |
| 8 | 9 + 10 | Chat AI nâng cấp, Testing, Documentation, Deploy |

---

*Lộ trình này có thể điều chỉnh tùy theo tiến độ thực tế. Ưu tiên: Precheck Engine → Agent Swarm → Report Builder → Charts → Delivery.*
