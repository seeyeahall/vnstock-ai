# VNStock AI — MASTER PROMPT cho Chat Mới (V2 → V3 Upgrade)

> **Mục đích**: Đây là file DU NHẤT chat mới PHẢI ĐỌC ĐẦU TIÊN để hiểu toàn bộ project, tiến trình hiện tại, và biết cần làm gì tiếp.  
> **Vị trí**: `E:\AI TONG HOP THONG TIN\app\docs\upgrade-v3\MASTER_PROMPT.md`  
> **Ngày cập nhật**: 2026-06-07  
> **Phiên bản**: V2.0 → V3.0 Upgrade In Progress

---

## PHẦN 1: TÓM TẮT 60 GIÂY (ĐỌC TRƯỚC)

**VNStock AI** là hệ thống tổng hợp thông tin chứng khoán Việt Nam với AI.

- **V2.0 (hiện tại)**: React frontend + Node.js backend + SQLite local. 6 tab UI nhưng hầu hết là **mock data** — chưa có luồng closed-loop để tạo báo cáo thực.
- **V3.0 (đang nâng cấp)**: Adaptive Autonomous AI OS — có Executive Brain quản lý Agent Swarm, Report Builder cho phép người dùng tự thiết lập mẫu báo cáo, đa dạng output (text + audio + charts + 3D), tích hợp NotebookLM và n8n.

**Trạng thái hiện tại**: Đã hoàn thành **phân tích thiết kế V3** (4 file MD trong `docs/upgrade-v3/`), chưa bắt đầu fix code.

**Việc cần làm tiếp**: Bắt đầu từ Pha 0 — restore backend đang thiếu, sau đó triển khai từng pha theo `02_UPGRADE_ROADMAP.md`.

---

## PHẦN 2: THIẾT KẾ V2.0 HIỆN TẠI (Tóm tắt từ thư mục gốc)

### 2.1. Kiến trúc V2.0

```
Frontend (React 18 + Vite + Tailwind + shadcn/ui)
  ├─ /           → System Config + Chat AI
  ├─ /modules    → Module Registry (24 modules)
  ├─ /workflow   → Workflow Graph (SVG tĩnh)
  ├─ /brain      → Executive Brain Console (mock data)
  ├─ /health     → Health Check (mock data)
  └─ /settings   → Output Channels (Telegram/Email/Notion)

Backend (Node.js + Express, port 3004)
  ├─ 30+ API endpoints
  ├─ Telegram Webhook (NLU 9 intents)
  ├─ SQLite (better-sqlite3, 5 tables)
  ├─ Sync engine (D1 + Turso)
  ├─ Email (Python smtplib)
  ├─ YouTube Analyzer (Python, FREE-first)
  └─ Cron scheduler
```

### 2.2. 6 Tab hiện tại và vấn đề

| Tab | File chính | Chức năng | Vấn đề |
|-----|-----------|-----------|--------|
| **System Config** | `SystemConfigPanel.tsx` + `ChatPanel.tsx` | Chọn preset, mode, schedule. Chat AI Messenger | Chat AI và System Config nằm chung nhưng không liên kết hành động. Nút **Run Workflow** chỉ chạy mock log |
| **Module Registry** | `ModuleSelector.tsx` | Hiển thị 24 module, chọn/bật tắt | Chỉ là "danh sách wishlist". Chọn xong **không có nút chạy** module |
| **Workflow Graph** | `WorkflowVisualizer.tsx` | SVG tĩnh nodes/edges | Hoàn toàn static, không cập nhật theo module đang chạy |
| **Executive Brain** | `ExecutiveBrainConsole.tsx` | Mock tasks, recovery, logs | Dữ liệu hard-coded. Không phản ánh tiến trình thu thập thực |
| **Health Check** | `HealthCheckPanel.tsx` | Mock status 12 dịch vụ | Không kiểm tra API thực. Nút Run Check chỉ thêm log giả lập |
| **Output Settings** | `OutputSettingsPanel.tsx` | Cấu hình Telegram/Email/Notion/Discord/Dashboard | Chỉ test kết nối, **không có chức năng chọn báo cáo đã tạo để gửi** |

### 2.3. Backend hiện tại — ĐANG THIẾU NHIỀU FILE

**Thư mục `local-backend/` hiện tại chỉ có**:
- `data/` — SQLite database (`vnstock.db`, `vnstock.db-shm`, `vnstock.db-wal`)
- `cloudflared.exe`
- `node_modules/`

**ĐANG THIẾU** (cần restore từ backup hoặc rebuild):
- `local-backend/server.js` — Main Express server (30+ API endpoints)
- `local-backend/db.js` — SQLite wrapper (better-sqlite3)
- `local-backend/sync.js` — D1 + Turso sync engine
- `local-backend/scripts/youtube_analyzer.py` — Phân tích 29 kênh YouTube
- `local-backend/scripts/send_email.py` — Gmail SMTP sender
- `local-backend/scripts/auto_start.py` — Auto start script
- `local-backend/scripts/push-all.js` — Push all channels script

**Backup có tại**: `backup/vnstock-ai-v2.0/` — chứa toàn bộ source code để khôi phục.

### 2.4. Database V2.0 (5 tables)

```sql
chat_history    — session_id, role, content, intent, metadata
reports         — report_id, template, format, sections, symbols, html_path, telegram_sent, email_sent
settings        — key, value
schedules       — schedule_id, name, cron, template, outputs, enabled
api_keys        — provider, api_key, status, latency_ms, last_tested
```

### 2.5. Credentials đã có sẵn

| Dịch vụ | Giá trị |
|---------|---------|
| Telegram Bot | @HuuVangbot, token: `7055879874:AAE8PmCuPMMV7uyIiamDBNN5xZgWBctYIVc` |
| Telegram Chat ID | `6226786681` |
| Email | seeyeahall@gmail.com, App Password: `qialfxmpfedshqgn` |
| GitHub Pages | https://seeyeahall.github.io/vnstock-ai/ |

### 2.6. Kênh truy cập app

| Kênh | URL | Cần backend? |
|------|-----|-------------|
| Local | http://localhost:3004 | ✅ Có backend |
| Cloudflare Tunnel | URL thay đổi | ✅ Có backend |
| GitHub Pages | https://seeyeahall.github.io/vnstock-ai/ | ❌ Không backend |
| Telegram Bot | @HuuVangbot | ✅ Có backend |

---

## PHẦN 3: THIẾT KẾ V3.0 ĐÃ PHÂN TÍCH XONG (Chưa fix code)

### 3.1. Tài liệu thiết kế V3 đã hoàn thành

Trong thư mục `docs/upgrade-v3/` đã có **4 file MD** mô tả chi tiết toàn bộ kiến trúc V3:

| File | Nội dung | Dòng |
|------|----------|------|
| `00_OVERVIEW.md` | Kiến trúc 4 tầng, luồng end-to-end, database schema mở rộng, tích hợp NotebookLM & n8n | 508 |
| `01_SYSTEM_GRAPH.md` | 13 graph Mermaid: Architecture, Executive Brain, Agent Swarm, Grounding, Synthesis, Delivery, Recovery, n8n Bridge, NotebookLM, ERD, Dependency, Sequence, File Structure | 853 |
| `02_UPGRADE_ROADMAP.md` | Lộ trình 10 pha / 8 tuần. Từng bước cụ thể với file cần sửa, code mẫu, tiêu chí hoàn thành | 1,015 |
| `03_ADVANCED_FEATURES.md` | 3 yêu cầu nâng cao: NotebookLM Audio Overview + Trình chiếu, Source-Grounded Accuracy, 10 chỉ báo kỹ thuật (có Ichimoku 9-17-26-26-26 và 65-129-5-2-2) | 994 |

### 3.2. Kiến trúc V3.0 tóm tắt

```
TẦNG 0: EXECUTIVE BRAIN (AI COO)
  ├─ Goal Manager, Precheck Engine, Task Planner
  ├─ 9Router (Gemini → Groq → OpenRouter → Ollama)
  ├─ State Manager, Recovery Engine, Resource Controller, Audit Engine

TẦNG 1: AGENT SWARM (Parallel Ingestion)
  ├─ YouTube Collector (29 kênh, subtitle-first, fallback chain)
  ├─ Stock Data Fetcher (VNStock API, 10 indicators)
  ├─ RSS News Collector (CafeF, VietStock, SSI)
  └─ Website/PDF Scraper

TẦNG 2: GROUNDING
  ├─ SQLite local (raw_data_json)
  ├─ Qdrant Vector DB (semantic search)
  ├─ Gemini Context Cache
  └─ (Optional) Google Drive → NotebookLM (index + citation + Audio Overview)

TẦNG 3: ADAPTIVE SYNTHESIS
  └─ Meta-Prompt 5 bước:
      B1. Anomaly Detection → B2. Market Regime Classifier
      B3. Activate Critique Rules → B4. Cross-Reference
      B5. Generate Report (theo mẫu người dùng)

TẦNG 4: MULTI-FORMAT DELIVERY
  ├─ Report Builder UI (kéo thả sections, chọn format, chọn kênh)
  ├─ Output: Text | HTML | Audio MP3 | Interactive Charts | 3D Graph | Excel | PDF
  └─ Channels: Telegram | Email | Notion | Dashboard
```

### 3.3. Các tính năng mới chính của V3

| # | Tính năng | Mô tả | File thiết kế |
|---|-----------|-------|--------------|
| 1 | **Precheck Engine** | Kiểm tra API health, quota forecast, hardware, dependency, transcript, dry-run trước khi chạy workflow | `02_UPGRADE_ROADMAP.md` Pha 1 |
| 2 | **9Router** | Tự động chọn AI provider tối ưu, fallback chain khi quota hết | `02_UPGRADE_ROADMAP.md` Pha 1 |
| 3 | **State Manager** | Lưu/resume tiến trình khi crash, không chạy lại từ đầu | `02_UPGRADE_ROADMAP.md` Pha 1 |
| 4 | **Agent Swarm** | Workers chạy song song: YouTube, Stock, News, Web | `02_UPGRADE_ROADMAP.md` Pha 2 |
| 5 | **Data Collection Panel** | UI hiển thị progress thu thập thực từ từng agent | `02_UPGRADE_ROADMAP.md` Pha 2 |
| 6 | **Report Builder** | UI cho phép người dùng thiết lập mẫu báo cáo: chọn sections, output format, kênh delivery | `02_UPGRADE_ROADMAP.md` Pha 3 |
| 7 | **Meta-Prompt 5 bước** | AI tự nhận diện trạng thái thị trường (Uptrend/Downtrend/Sideway) và kích hoạt bộ quy tắc phản biện | `03_ADVANCED_FEATURES.md` |
| 8 | **Source-Grounded** | Mọi luận điểm có citation [Kênh - Video - Ngày], số liệu từ API thực, raw data lưu riêng | `03_ADVANCED_FEATURES.md` |
| 9 | **10 Technical Indicators** | MA, EMA, RSI, MACD, Bollinger, Ichimoku 9-17-26-26-26, Ichimoku 65-129-5-2-2, Volume MA, OBV, Stochastic | `03_ADVANCED_FEATURES.md` |
| 10 | **Interactive Charts** | TradingView Lightweight Charts / Chart.js với overlay indicators, tương tác zoom/pan | `02_UPGRADE_ROADMAP.md` Pha 5 |
| 11 | **Audio TTS** | NotebookLM Audio Overview (podcast 5 phút) hoặc Google Cloud TTS fallback | `03_ADVANCED_FEATURES.md` |
| 12 | **3D Market Graph** | D3.js force-directed graph: node = cổ phiếu, edge = tương quan, màu = sentiment | `02_UPGRADE_ROADMAP.md` Pha 6 |
| 13 | **NotebookLM Sync** | Đẩy raw data lên Google Drive → NotebookLM index + citation + Audio Overview | `03_ADVANCED_FEATURES.md` |
| 14 | **n8n Bridge** | Toggle redirect task sang n8n external worker khi local bị giới hạn | `02_UPGRADE_ROADMAP.md` Pha 8 |
| 15 | **Presentation Mode** | Chuyển báo cáo thành slide-by-slide, export PPTX | `03_ADVANCED_FEATURES.md` |

---

## PHẦN 4: LỘ TRÌNH NÂNG CẤP — ĐÃ LÀM ĐẾN ĐÂU & CẦN LÀM GÌ

### 4.1. Trạng thái hiện tại

```
[✅] Phân tích thiết kế V3 — 4 file MD hoàn chỉnh
[✅] Pha 0: Backup & Restore Backend — 14 files backend core rebuilt
[✅] Pha 1: Precheck Engine & 9Router & State Manager — 6 services created
[✅] Pha 2: Agent Swarm & Data Collection — 4 workers + merge service
[✅] Pha 3: Report Builder — UI with presets, sections, output matrix
[✅] Pha 4: Adaptive Synthesis — Meta-Prompt 5 bước + analysis worker
[✅] Pha 5: Technical Charts & 10 Indicators — Chart.js + Ichimoku
[✅] Pha 6: Audio & 3D Visualization — AudioPlayer + Graph3D
[⏳] Pha 7: NotebookLM Integration — Google Drive sync pending
[⏳] Pha 8: n8n Bridge — Webhook service pending
[✅] Pha 9: Polish & Integration — Executive Brain + Workflow + Health real-time
[⏳] Pha 10: Documentation & Deploy — Update root MD files pending
```

### 4.2. Việc CẦN LÀM TIẾP (Ưu tiên)

#### Bước tiếp theo: Pha 10 — Cập nhật tài liệu gốc + Deploy

**File cần cập nhật**:
- `MASTER_PROMPT.md` gốc — thêm tính năng V3
- `RESUME_PROMPT.md` — tóm tắt nhanh V3
- `PROGRESS_ANALYSIS_v2.md` → đổi tên `PROGRESS_ANALYSIS_v3.md`
- `HUONG_DAN_SU_DUNG.md` — hướng dẫn V3
- `API_SPEC.md` — endpoints mới
- `DB_SCHEMA.md` — tables mới

#### Sau đó: Pha 7 — NotebookLM Sync

**File cần tạo**:
- `local-backend/services/notebooklmSync.js`
- `local-backend/services/notebooklmAudio.js`

#### Sau đó: Pha 8 — n8n Bridge

**File cần tạo**:
- `local-backend/services/n8nBridge.js`

#### Cuối cùng: Build & Deploy

```bash
npm run build
node local-backend/scripts/push-all.js
```

---

## PHẦN 5: QUY TẮC LÀM VIỆC (BẮT BUỘC TUÂN THỦ)

### 5.1. Trước khi sửa code

```
1. Backup toàn bộ src/ và local-backend/ vào backup/vnstock-ai-v2.0/
2. Đọc file thiết kế liên quan trong docs/upgrade-v3/
3. Xác định pha đang làm và bước cụ thể trong 02_UPGRADE_ROADMAP.md
4. Tạo git branch mới nếu cần: git checkout -b feature/pha-1-precheck
```

### 5.2. Trong khi sửa code

```
1. Làm từng bước theo roadmap, KHÔNG nhảy pha
2. Mỗi bước xong phải test trước khi sang bước tiếp
3. Giữ nguyên code V2 cũ nếu chưa chắc chắn — dùng feature flag hoặc toggle
4. Comment rõ ràng: // V3-UPGRADE: [mô tả thay đổi]
```

### 5.3. Sau khi sửa code — CẬP NHẬT FILE MD (QUAN TRỌNG)

**Đây là yêu cầu BẮT BUỘC sau mỗi lần nâng cấp xong một pha/bước**:

#### A. Cập nhật file ở thư mục gốc (bộ code thực)

| File gốc | Cập nhật gì |
|----------|-------------|
| `MASTER_PROMPT.md` | Thêm tính năng mới, thay đổi kiến trúc, cập nhật tiến trình |
| `RESUME_PROMPT.md` | Tóm tắt nhanh cho chat mới — thêm tính năng vừa hoàn thành |
| `PROGRESS_ANALYSIS_v2.md` | Đổi tên thành `PROGRESS_ANALYSIS_v3.md`, ghi lại phân tích tối ưu, optimization, risk |
| `HUONG_DAN_SU_DUNG.md` | Thêm hướng dẫn sử dụng tính năng mới cho người dùng |
| `API_SPEC.md` | Thêm API endpoints mới, request/response format |
| `DB_SCHEMA.md` | Thêm tables mới, migrations |

**Cách cập nhật**:
```bash
# Sau khi hoàn thành 1 pha:
# 1. Mở MASTER_PROMPT.md
# 2. Thêm vào section "Tiến trình" — đánh dấu pha vừa xong là ✅
# 3. Thêm tính năng mới vào "Tính năng chính đã hoàn thành"
# 4. Cập nhật "URL & Endpoint quan trọng" nếu có API mới
# 5. Cập nhật "Metrics hiện tại" nếu có thay đổi

# 6. Mở RESUME_PROMPT.md
# 7. Thêm tính năng mới vào danh sách "Tính năng chính"
# 8. Cập nhật "Tiến trình hiện tại"

# 9. Mở PROGRESS_ANALYSIS_v3.md (tạo mới nếu chưa có)
# 10. Ghi lại: vấn đề gặp phải, giải pháp, kết quả

# 11. Mở HUONG_DAN_SU_DUNG.md
# 12. Thêm hướng dẫn sử dụng tính năng mới
```

#### B. Cập nhật file ở thư mục V3 (docs/upgrade-v3/)

| File V3 | Cập nhật gì |
|---------|-------------|
| `00_OVERVIEW.md` | Cập nhật trạng thái implementation, thêm notes về thay đổi thực tế so với thiết kế |
| `01_SYSTEM_GRAPH.md` | Cập nhật graph nếu kiến trúc thay đổi, thêm graph mới nếu cần |
| `02_UPGRADE_ROADMAP.md` | Đánh dấu bước đã xong là ✅, ghi chú vấn đề gặp phải, điều chỉnh timeline nếu cần |
| `03_ADVANCED_FEATURES.md` | Cập nhật chi tiết implementation, thêm code mẫu thực tế, ghi chú hạn chế phát hiện |
| `MASTER_PROMPT.md` (file này) | Cập nhật "Trạng thái hiện tại", "Đã làm đến đâu", thêm notes cho chat mới |

**Cách cập nhật**:
```bash
# Sau khi hoàn thành 1 pha:
# 1. Mở docs/upgrade-v3/02_UPGRADE_ROADMAP.md
# 2. Tìm pha vừa xong, đổi [⏳] thành [✅]
# 3. Thêm ghi chú: "Hoàn thành ngày YYYY-MM-DD, issues: ..."

# 4. Mở docs/upgrade-v3/MASTER_PROMPT.md (file này)
# 5. Cập nhật PHẦN 4: đánh dấu pha vừa xong
# 6. Cập nhật PHẦN 6: thêm notes cho chat mới
```

### 5.4. Git Commit

```bash
# Mỗi pha hoàn thành phải commit
git add .
git commit -m "v3.0: Pha X - [tên pha] - [tóm tắt ngắn]"

# Ví dụ:
git commit -m "v3.0: Pha 1 - Precheck Engine + 9Router + State Manager"
git commit -m "v3.0: Pha 2 - Agent Swarm (YouTube, Stock, News workers)"
```

---

## PHẦN 6: NOTES CHO CHAT MỚI

### 6.1. Nếu chat mới bắt đầu từ đây

**Thứ tự đọc file**:
1. **Đọc file này trước** (`docs/upgrade-v3/MASTER_PROMPT.md`) — 5 phút
2. Đọc `docs/upgrade-v3/02_UPGRADE_ROADMAP.md` — biết pha nào đang làm (Pha 7,8,10 còn lại)
3. Đọc file thiết kế chi tiết của pha đang làm (`00_OVERVIEW.md` hoặc `03_ADVANCED_FEATURES.md`)
4. Đọc `MASTER_PROMPT.md` gốc ở thư mục app nếu cần hiểu V2
5. Source code: `src/` (frontend đã có V3 components), `local-backend/` (backend đã rebuild)

### 6.2. Câu hỏi cần hỏi người dùng trước khi làm

| Câu hỏi | Tại sao |
|---------|---------|
| "Pha nào muốn bắt đầu?" | Pha 7 (NotebookLM), Pha 8 (n8n), hay Pha 10 (Docs+Deploy)? |
| "Backend chạy được chưa?" | Cần fix better-sqlite3 prebuilt binary cho Node v24 |
| "Có muốn test end-to-end luôn không?" | Cần chạy backend + frontend cùng lúc |

### 6.3. Các file quan trọng nhất để hiểu code hiện tại

| File | Tại sao quan trọng |
|------|-------------------|
| `src/App.tsx` | 11 routes (6 V2 + 5 V3 mới) |
| `src/hooks/useSystemConfig.ts` | Đã thêm settings V3 (NotebookLM, n8n) |
| `src/sections/Header.tsx` | Navigation có badge regime + links V3 |
| `local-backend/server.js` | 30+ endpoints, Express, port 3004 |
| `local-backend/db.js` | 8 tables SQLite |
| `local-backend/services/precheckEngine.js` | Precheck 6 bước |
| `local-backend/workers/*.js` | Agent Swarm (YouTube, Stock, News, Analysis) |
| `local-backend/config/indicators_config.json` | 10 indicators config |

### 6.4. Rủi ro cần lưu ý

| Rủi ro | Mức độ | Giải pháp |
|--------|--------|-----------|
| better-sqlite3 lỗi với Node v24 | Cao | Cần rebuild hoặc dùng prebuilt binary đúng version |
| npm không trong PATH | Trung bình | Dùng đường dẫn tuyệt đối hoặc npx |
| Python scripts thiếu dependencies | Trung bình | Cài youtube-transcript-api, yt-dlp, google-cloud-tts |
| Frontend build OK nhưng runtime lỗi | Thấp | Kiểm tra API responses match expected shapes |

---

## PHẦN 7: TÀI LIỆU THAM KHẢO

### File trong project

| File | Vị trí | Mục đích |
|------|--------|----------|
| `MASTER_PROMPT.md` | `E:\AI TONG HOP THONG TIN\app\` | Tổng quan V2.0 đầy đủ |
| `RESUME_PROMPT.md` | `E:\AI TONG HOP THONG TIN\app\` | Tóm tắt nhanh V2.0 |
| `PROGRESS_ANALYSIS_v2.md` | `E:\AI TONG HOP THONG TIN\app\` | Phân tích tối ưu V2.0 |
| `HUONG_DAN_SU_DUNG.md` | `E:\AI TONG HOP THONG TIN\app\` | Hướng dẫn người dùng V2.0 |
| `API_SPEC.md` | `E:\AI TONG HOP THONG TIN\app\` | API endpoints V2.0 |
| `DB_SCHEMA.md` | `E:\AI TONG HOP THONG TIN\app\` | Database schema V2.0 |
| `00_OVERVIEW.md` | `docs/upgrade-v3/` | Kiến trúc V3.0 tổng quan |
| `01_SYSTEM_GRAPH.md` | `docs/upgrade-v3/` | 13 graph Mermaid V3.0 |
| `02_UPGRADE_ROADMAP.md` | `docs/upgrade-v3/` | Lộ trình 10 pha V3.0 |
| `03_ADVANCED_FEATURES.md` | `docs/upgrade-v3/` | 3 tính năng nâng cao V3.0 |
| `MASTER_PROMPT.md` | `docs/upgrade-v3/` | **File này** — hướng dẫn chat mới |

### Thư mục backup

```
backup/vnstock-ai-v2.0/
├── src/                    # Source code frontend
├── local-backend/          # Source code backend (nếu có)
├── dist/                   # Build output
└── config files            # package.json, vite.config.ts, ...
```

---

*File này được cập nhật sau mỗi pha hoàn thành. Chat mới đọc file này đầu tiên để biết trạng thái hiện tại và cần làm gì tiếp.*

**Lần cập nhật cuối**: 2026-06-07 — Vừa hoàn thành phân tích thiết kế V3, chưa bắt đầu fix code.
