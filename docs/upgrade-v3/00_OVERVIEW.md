# VNStock AI v3.0 — Thiết kế nâng cấp tổng quan

> **Mục đích**: Tài liệu nguồn duy nhất (Single Source of Truth) mô tả kiến trúc nâng cấp toàn diện cho VNStock AI, từ v2.0 hiện tại lên v3.0 Adaptive Autonomous AI OS.
> **Ngày cập nhật**: 2026-06-07
> **Phiên bản**: Draft v3.0
> **Trạng thái**: Phân tích thiết kế hoàn tồn | Pha 0-6,9 đã triển khai code | Pha 7,8,10 chưa làm

---

## 1. Tóm tắt động lực nâng cấp

### Vấn đề của v2.0 hiện tại

| Vấn đề | Mức độ | Mô tả |
|--------|--------|-------|
| Luồng không closed-loop | Cao | 6 tab hoạt động rời rạc, không có pipeline end-to-end để tạo báo cáo |
| Mock data everywhere | Cao | Executive Brain, Health Check, Workflow Graph đều là dữ liệu giả lập |
| Không có Report Builder | Cao | Người dùng không thể tự thiết lập mẫu báo cáo theo ý muốn |
| Output đơn giản | Trung bình | Chỉ có text/HTML cơ bản, thiếu audio, chart tương tác, 3D model |
| Thiếu Precheck Engine | Trung bình | Chạy workflow mà không kiểm tra API health, quota, hardware trước |
| Thiếu Self-Healing | Trung bình | Khi API chết hoặc quota hết, hệ thống dừng luôn, không tự fallback |
| NotebookLM chưa tích hợp | Thấp | Chưa dùng NotebookLM để grounding tri thức và tạo audio overview |
| n8n chưa làm bridge | Thấp | n8n có thể đóng vai trò external worker nhưng chưa tích hợp |

### Tầm nhìn v3.0

> **"Adaptive Autonomous AI Operating System cho phân tích chứng khoán Việt Nam"**

- **Adaptive**: Tự nhận diện trạng thái thị trường (Uptrend/Downtrend/Sideway) và điều chỉnh bộ quy tắc phân tích phản biện tương ứng
- **Autonomous**: Chạy tự động theo lịch, tự phục hồi khi lỗi, tự chọn AI provider tối ưu
- **AI OS**: Không chỉ là app, mà là hệ điều hành AI với Executive Brain quản lý Agent Swarm

---

## 2. Kiến trúc tổng thể v3.0

### 2.1. Sơ đồ 4 tầng chính

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  TẦNG 0: EXECUTIVE BRAIN (AI COO)                                           │
│  ├─ Goal Manager        ← Nhận mục tiêu từ người dùng / lịch trình          │
│  ├─ Precheck Engine     ← Kiểm tra toàn bộ hệ thống trước khi chạy         │
│  ├─ Task Planner        ← Chia mục tiêu thành Agent Swarm                    │
│  ├─ 9Router             ← Chọn AI provider động (Gemini/Groq/OpenRouter)    │
│  ├─ State Manager       ← Lưu/resume tiến trình khi crash                  │
│  ├─ Recovery Engine     ← Self-healing, fallback chain tự động              │
│  ├─ Resource Controller ← Điều chỉnh parallel workers theo CPU/RAM          │
│  └─ Audit Engine        ← Ghi log để AI học tối ưu lần sau                 │
└─────────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│  TẦNG 1: DATA INGESTION (Agent Swarm - Parallel)                            │
│  ┌──────────────┐ ┌──────────────┐ ┌──────────────┐ ┌──────────────────────┐ │
│  │ YouTube      │ │ Stock Data   │ │ RSS News     │ │ PDF/Website        │ │
│  │ Collector    │ │ Fetcher      │ │ Collector    │ │ Scraper            │ │
│  │ (29 kênh)    │ │ (VNStock API)│ │ (CafeF...)   │ │ (Báo cáo CTCK)     │ │
│  └──────┬───────┘ └──────┬───────┘ └──────┬───────┘ └──────────┬─────────┘ │
│         └─────────────────┴─────────────────┴────────────────────┘           │
│                              ↓                                             │
│                    ┌─────────────────┐                                      │
│                    │  DATA MERGE     │  ← Gom + deduplicate               │
│                    │  + Validation   │    thành mega_context              │
│                    └─────────────────┘                                      │
└─────────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│  TẦNG 2: GROUNDING & KNOWLEDGE (NotebookLM / Local Context Cache)            │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │  Cách 1 (Cloud): Google Drive → NotebookLM                          │   │
│  │  • Tự động index, citation, vector embedding                        │   │
│  │  • Audio Overview (podcast tự động)                                   │   │
│  │  • 0% hallucination nhờ source-grounded                               │   │
│  │                                                                     │   │
│  │  Cách 2 (Local Hybrid): SQLite + Qdrant + Gemini Context Cache        │   │
│  │  • raw_data_json lưu SQLite                                         │   │
│  │  • Qdrant semantic search                                           │   │
│  │  • Gemini Context Caching cho prompt cố định                        │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│  TẦNG 3: ADAPTIVE SYNTHESIS (AI Analysis Engine)                            │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │  META-PROMPT 5 BƯỚC (Chạy ngầm):                                   │   │
│  │  B1. Quét bất thường → Đếm tần suất từ khóa, vol nổ, giá gãy nền    │   │
│  │  B2. Phân loại trạng thái: Uptrend FOMO / Downtrend / Sideway       │   │
│  │  B3. Kích hoạt bộ quy tắc phản biện tương ứng                       │   │
│  │  B4. Đối chiếu chéo chuyên gia: Bullish vs Bearish + Blind Spots   │   │
│  │  B5. Tạo báo cáo theo mẫu người dùng đã thiết lập                   │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│  TẦNG 4: MULTI-FORMAT DELIVERY (Report Builder Output)                      │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────────────┐  │
│  │ Text/    │ │ HTML     │ │ Audio    │ │ Charts   │ │ 3D/Network       │  │
│  │ Markdown │ │ Rich     │ │ Podcast  │ │ Technical│ │ Graph            │  │
│  │          │ │          │ │ (TTS)    │ │          │ │                  │  │
│  └──────────┘ └──────────┘ └──────────┘ └──────────┘ └──────────────────┘  │
│                              ↓                                             │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────────────┐  │
│  │ Telegram │ │ Email    │ │ Notion   │ │ Dashboard│ │ Excel/PDF        │  │
│  │          │ │          │ │          │ │          │ │                  │  │
│  └──────────┘ └──────────┘ └──────────┘ └──────────┘ └──────────────────┘  │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 2.2. Các thành phần mới cần thêm vào app

| Thành phần | Tab/UI mới | Mô tả | Độ phức tạp |
|-----------|-----------|-------|-------------|
| **Report Builder** | Tab mới | UI thiết lập mẫu báo cáo: chọn sections, output format, kênh delivery | Cao |
| **Data Collection Panel** | Tab mới / Executive Brain | Hiển thị tiến trình thu thập thực từ từng agent | Trung bình |
| **Precheck Dashboard** | Tab mới / Health Check | Hiển thị kết quả kiểm tra API, quota, hardware trước chạy | Trung bình |
| **Technical Chart Viewer** | Section trong Report Builder | TradingView Lightweight Charts / Chart.js với 10 chỉ báo | Trung bình |
| **Audio Player** | Section trong Dashboard | Phát audio overview từ NotebookLM TTS hoặc Google TTS | Trung bình |
| **3D Market Graph** | Section trong Dashboard | D3.js/Cytoscape force-directed graph cổ phiếu-ngành | Cao |
| **n8n Bridge Toggle** | Settings | Bật/tắt redirect task sang n8n external worker | Trung bình |
| **NotebookLM Sync** | Settings | Cấu hình Google Drive sync → NotebookLM | Trung bình |
| **Dynamic Regime Badge** | Header / Report | Hiển thị trạng thái thị trường AI nhận diện được | Thấp |

---

## 3. Luồng xử lý end-to-end (Ví dụ: Báo cáo tuần)

### Bước 1: Thiết lập mẫu báo cáo (Report Builder)

Người dùng vào tab **Report Builder**:
- Đặt tên mẫu: "Báo cáo thị trường tuần"
- Chọn trigger: Manual hoặc Scheduled (07:00, 20:00)
- Chọn sections (kéo thả sắp xếp):
  1. ☑ Macro Overview (Text)
  2. ☑ Sector Rotation Map (Text + Table)
  3. ☑ Stock Detail Cards (Text + Chart mini)
  4. ☑ Technical Chart (Interactive Chart.js)
  5. ☑ Sentiment Gauge (SVG Gauge)
  6. ☑ Insight & Blind Spots (Text)
  7. ☑ Watchlist Action Table (Table + Excel export)
  8. ☐ Audio Summary (MP3 TTS)
  9. ☐ 3D Market Model (D3.js)
- Chọn output channels cho từng section:
  - Telegram: Macro + Sentiment + Audio
  - Email: Full HTML + đính kèm Excel
  - Dashboard: Full interactive
- Chọn time range: "7 ngày qua"
- Chọn sources: YouTube (29 kênh) + Stock Data + RSS News

### Bước 2: Precheck Engine (Chạy tự động)

Trước khi thu thập, Executive Brain chạy Precheck:
```
[Precheck] API Health:
  ✓ Gemini API: OK (latency 420ms, quota 78%)
  ✓ Groq API: OK (latency 85ms, quota 92%)
  ✓ VNStock API: OK
  ✓ Telegram Bot: OK
  ✓ Email SMTP: OK

[Precheck] Quota Forecast:
  • 29 kênh × ~50 video/tuần = ~1.2M tokens
  • Gemini limit: 2M tokens → PASS (còn dư 800K)

[Precheck] Hardware:
  • RAM: 8.2/16GB (51%) → cho phép 3 parallel workers
  • CPU: 23% → OK
  • Disk: 45% → OK

[Precheck] Dependencies:
  ✓ SQLite: OK
  ✓ Qdrant: OK
  ✓ n8n (nếu bật): OK

→ Kết quả: PASS. Executive Brain phê duyệt chạy.
```

### Bước 3: Agent Swarm thu thập (Parallel)

```
[Agent 1: YouTube Collector]
  • Quét 29 kênh, lọc video 7 ngày qua
  • Transcript: subtitle-first (youtube-transcript-api)
  • Fallback: yt-dlp caption → Groq Whisper → Gemini audio
  • Output: raw_transcript_json

[Agent 2: Stock Data Fetcher]
  • Lấy OHLCV 7 ngày: VNINDEX, FPT, VCB, HPG, ...
  • Tính chỉ báo: MA, RSI, MACD, Bollinger, Ichimoku
  • Output: stock_ohlcv_json + indicators_json

[Agent 3: RSS News Collector]
  • Thu thập CafeF, VietStock, SSI Research
  • Lọc 50 bài/tuần, extract keywords + sentiment
  • Output: news_articles_json

[Agent 4: PDF/Website Scraper]
  • Crawl báo cáo phân tích CTCK từ website
  • Extract text + tables
  • Output: pdf_text_json

→ Data Merge: Gom tất cả + deduplicate → mega_context
```

### Bước 4: Grounding (Lưu trữ & Index)

```
[Grounding] Lưu mega_context vào:
  • SQLite: reports.raw_data_json (local primary)
  • Qdrant: vector embedding transcript (semantic search)
  • (Optional) Google Drive → NotebookLM:
    - Tự động index + citation
    - Tạo Audio Overview (podcast 5 phút)
```

### Bước 5: Adaptive Synthesis (Gemini/NotebookLM)

```
[Synthesis] Meta-Prompt 5 bước:
  B1. Quét tần suất từ khóa tuần qua
      → "Bất động sản" xuất hiện 47 lần, "Ngân hàng" 32 lần
      → Ngành tiêu điểm: Bất động sản

  B2. Phân loại trạng thái thị trường
      → VNINDEX +2.3%, vol tăng 35%, 80% chuyên gia hô "Múc"
      → Trạng thái: Uptrend FOMO

  B3. Kích hoạt bộ quy tắc: "Lọc nhiễu lạc quan"
      → Ép AI tìm rủi ro ẩn, bẫy tăng giá, cảnh báo quá mua

  B4. Đối chiếu chéo chuyên gia
      → Bullish: DNSE (vùng 1,250), SSI (vùng 1,280)
      → Bearish: Fiin (rủi ro lãi suất), Dragon Capital (vol bất thường)
      → Blind Spot: Không ai nhắc đến rủi ro tỷ giá USD/VND

  B5. Tạo báo cáo theo mẫu người dùng đã chọn
      → 7 sections, định dạng theo từng kênh output
```

### Bước 6: Render Output theo mẫu

```
[Render] Text sections → Markdown → HTML (Email/Dashboard)
[Render] Technical Chart → TradingView Lightweight Charts
         • OHLCV + MA(5,20,50) + RSI(14) + MACD + Bollinger
         • Ichimoku 9-17-26-26-26 + Ichimoku 65-129-5-2-2
[Render] Sentiment Gauge → SVG gauge (FOMO ↔ Hoảng loạn)
[Render] Audio → TTS (Google Cloud TTS) → MP3 5 phút
[Render] 3D Model → D3.js force-directed graph
[Render] Excel → SheetJS export watchlist data
```

### Bước 7: Multi-Channel Delivery

```
[Delivery] Telegram:
  • Text: Macro Overview + Sentiment Gauge (emoji)
  • File: audio_report.mp3 (5 phút)

[Delivery] Email:
  • HTML: Full báo cáo (tất cả sections)
  • Đính kèm: watchlist.xlsx + audio_report.mp3

[Delivery] Dashboard:
  • Interactive: Charts tương tác, filter, drill-down
  • Lưu vào lịch sử báo cáo

[Delivery] Notion:
  • Page mới với properties:
    Date: 2026-06-07
    Market Regime: Uptrend FOMO
    Focus Sectors: Bất động sản, Ngân hàng
    Status: Đã đọc / Chưa đọc

[DB Update] reports.telegram_sent=1, email_sent=1, html_path=...
```

---

## 4. Cấu trúc báo cáo 4 phần (Theo thiết kế gốc)

### Phần 1: Toàn cảnh vĩ mô & Cơ chế truyền dẫn nhân quả
- Ma trận biến động thời sự toàn cầu → khu vực → Việt Nam
- Phân tích nhân quả chéo: Sự kiện vĩ mô tác động đến VNINDEX qua đường nào?
- Trọng tài chuyên gia: Bullish vs Bearish + đánh giá logic
- Kết luận VNINDEX dựa trên đối chiếu

### Phần 2: Vi mô ngành & Bản đồ cổ phiếu biện chứng
- Ngành tiêu điểm động (tự động bốc đầu ngành biến động nhất)
- Phân cụm sức khỏe nhóm ngành: Hưởng lợi / Tiêu cực / Đi ngang
- Chi tiết cổ phiếu: So sánh vùng giá, kỳ vọng định giá giữa các chuyên gia
- Lọc nhiễu: Chỉ giữ số liệu (Sản lượng, Giá bán, P/E, P/B, Vol)

### Phần 3: Insights & Cảnh báo bẫy tâm lý
- Khoảng trống thông tin (Blind Spots): Rủi ro/cơ hội 29 kênh đều bỏ sót
- Bẫy tâm lý thị trường: Mức độ FOMO/Hoảng loạn
- Chiếu xạ dòng tiền ngắn hạn
- Chiếu xạ danh mục quan tâm của người dùng

### Phần 4: Bản đồ theo dõi & Kịch bản hành động
- Ma trận Watchlist động:
  | Mã CP | Xu hướng chung | Trigger | Hành động khuyến nghị |
- 2 kịch bản: Cơ sở & Rủi ro cho phiên tiếp theo
- Điểm kích hoạt hành động (Trigger points)

---

## 5. Tích hợp NotebookLM

### 5.1. Vai trò trong kiến trúc

| Vai trò | Cách thực hiện | Lợi ích |
|---------|---------------|---------|
| **Grounding Knowledge** | Đẩy raw data lên Google Drive → NotebookLM tự index | 0% hallucination, có citation nguồn |
| **Audio Overview** | NotebookLM tự tạo podcast 2 MC ảo đối thoại | Người dùng nghe khi lái xe, đánh răng |
| **Cross-reference** | NotebookLM đối chiếu chéo nguồn A vs nguồn B | Phát hiện mâu thuẫn giữa các chuyên gia |
| **Source-grounded Q&A** | Hỏi NotebookLM về dữ liệu đã index | Trả lời chỉ dựa trên 29 kênh, không bịa đặt |

### 5.2. Luồng tích hợp

```
[App] Thu thập xong raw data
    ↓
[App] Đẩy lên Google Drive folder "VNStock_Daily_Intelligence"
    ↓
[NotebookLM] Tự động sync + index (có thể cần trigger thủ công hoặc API)
    ↓
[NotebookLM] Tạo Audio Overview (podcast 5 phút)
    ↓
[App] Lấy Audio Overview URL/file về
    ↓
[App] Gửi kèm trong báo cáo Telegram/Email
```

### 5.3. Hạn chế & Giải pháp

| Hạn chế | Giải pháp |
|---------|-----------|
| NotebookLM không có API chính thức để tự động hoàn toàn | Dùng Google Drive API để upload, rồi hướng dẫn người dùng bật sync trong NotebookLM UI. Hoặc dùng **Gemini Context Caching** thay thế |
| Audio Overview chỉ tạo khi có đủ dữ liệu | Fallback: Dùng Google Cloud TTS hoặc Gemini TTS để tạo audio từ text báo cáo |
| Chỉ hỗ trợ tiếng Anh tốt nhất | Dùng Gemini để dịch transcript sang tiếng Việt trước khi đẩy lên NotebookLM |

---

## 6. Tích hợp n8n

### 6.1. Vai trò trong kiến trúc Hybrid

```
Executive Brain (trong app)
        ↓
    9Router
        ↓
    ┌──────────┬──────────┐
    │ Local    │ External │
    │ Workers  │ n8n      │
    │ (Python) │ Worker   │
    └──────────┴──────────┘
```

| Vai trò | Cách tích hợp | Khi nào dùng |
|---------|--------------|-------------|
| **YouTube Ingestion Worker** | n8n chạy Schedule Trigger → YouTube API → HTTP Request (transcript) → Code Node (merge) → Webhook về app | Khi app local bị giới hạn network hoặc cần chạy 24/7 trên cloud |
| **Delivery Worker** | App gửi báo cáo qua webhook → n8n Switch Node → Telegram/Email/Notion | Khi cần retry logic phức tạp, rate limiting, queue |
| **External Orchestrator** | Executive Brain gọi n8n webhook để chạy workflow phức tạp | Khi task vượt quá khả năng xử lý local (RAM, CPU) |

### 6.2. Cấu hình trong app

Tab **Settings** → **External Workers**:
- Toggle "Enable n8n Bridge": Bật/tắt
- n8n Webhook URL: `https://n8n.your-domain.com/webhook/vnstock`
- API Key: `n8n_api_...`
- Fallback: Khi n8n fail → tự động chuyển về local workers

---

## 7. Bảo mật & Quota Management

### 7.1. API Registry

Mọi API phải được khai báo trong `api_registry.json`:
```json
{
  "api_name": "gemini",
  "provider": "google",
  "api_key": "...",
  "health_url": "...",
  "rpm_limit": 15,
  "rpd_limit": 1500,
  "max_context": 2000000,
  "priority": 1,
  "fallback": ["openrouter", "groq", "ollama"]
}
```

### 7.2. Quota Forecast

Trước khi chạy workflow:
```
Inputs: 29 kênh × ~50 video = ~1,450 video
Estimated tokens: ~3.4M tokens
Gemini capacity: 2M tokens
Status: OVERLOAD
Action: Chia batch → Batch 1 (1M tokens) + Batch 2 (1M tokens) + Batch 3 (1.4M tokens)
```

### 7.3. Self-Healing Engine

```
Error Detect → Analyze → Fix → Retry → Continue

Ví dụ:
  Gemini 429 (Quota exceeded)
    ↓
  9Router: Chuyển sang Groq
    ↓
  Groq OK → Tiếp tục workflow
    ↓
  Groq cũng fail → Chuyển OpenRouter
    ↓
  OpenRouter OK → Tiếp tục
    ↓
  Tất cả fail → Ollama local
    ↓
  Ollama fail → Gửi cảnh báo người dùng, dừng workflow
```

---

## 8. Database Schema mở rộng (SQLite)

### Bảng `reports` (mở rộng)

```sql
CREATE TABLE reports (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  report_id TEXT UNIQUE NOT NULL,
  template TEXT,                    -- Tên mẫu báo cáo
  format TEXT DEFAULT 'html',       -- html | markdown | pdf | audio
  sections TEXT,                    -- JSON: ["macro", "sector", "stock", ...]
  symbols TEXT,                     -- JSON: ["VNINDEX", "FPT", "VCB"]
  raw_data_json TEXT,               -- Mega context từ Agent Swarm
  analysis_result TEXT,             -- Kết quả phân tích AI
  html_path TEXT,                   -- Đường dẫn file HTML
  audio_path TEXT,                  -- Đường dẫn file MP3
  excel_path TEXT,                  -- Đường dẫn file Excel
  market_regime TEXT,               -- Uptrend | Downtrend | Sideway
  focus_sectors TEXT,               -- JSON: ["Bất động sản", "Ngân hàng"]
  telegram_sent BOOLEAN DEFAULT 0,
  email_sent BOOLEAN DEFAULT 0,
  notion_sent BOOLEAN DEFAULT 0,
  dashboard_saved BOOLEAN DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

### Bảng `report_templates`

```sql
CREATE TABLE report_templates (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  template_id TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  sections TEXT,                    -- JSON: thứ tự và cấu hình sections
  output_channels TEXT,             -- JSON: {"telegram": [...], "email": [...]}
  time_range TEXT,                  -- 1d | 1w | 1m
  sources TEXT,                     -- JSON: ["youtube", "stock", "rss"]
  schedule TEXT,                    -- JSON: ["07:00", "20:00"] hoặc null
  enabled BOOLEAN DEFAULT 1,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

### Bảng `agent_tasks`

```sql
CREATE TABLE agent_tasks (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  task_id TEXT UNIQUE NOT NULL,
  report_id TEXT,
  agent_name TEXT,                  -- youtube_collector | stock_fetcher | ...
  status TEXT,                      -- pending | running | success | failed | retrying
  progress INTEGER DEFAULT 0,       -- 0-100
  input_params TEXT,                -- JSON: tham số đầu vào
  output_data TEXT,                 -- JSON: kết quả đầu ra
  error_message TEXT,
  started_at DATETIME,
  completed_at DATETIME,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

---

## 9. Kết luận

VNStock AI v3.0 không chỉ là nâng cấp tính năng, mà là **chuyển đổi kiến trúc** từ app dashboard tĩnh thành **Adaptive Autonomous AI Operating System**.

**3 trụ cột cốt lõi**:
1. **Executive Brain**: AI quản lý AI — tự động, tự phục hồi, tự tối ưu
2. **Report Builder**: Người dùng làm chủ mẫu báo cáo — chọn sections, format, kênh output
3. **Hybrid Delivery**: Text + Audio + Charts + 3D — đa dạng, đa kênh, đúng ngữ cảnh

**Lộ trình thực hiện**: Xem file `02_UPGRADE_ROADMAP.md`
**Chi tiết graph hệ thống**: Xem file `01_SYSTEM_GRAPH.md`
**Tính năng nâng cao**: Xem file `03_ADVANCED_FEATURES.md`
