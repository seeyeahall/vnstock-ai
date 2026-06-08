# VNStock AI v3.0 - MASTER PROMPT

> **File này là tài liệu chính của project.** Chat mới đọc để hiểu toàn bộ thiết kế, tiến trình, và cách tiếp tục phát triển.

---

## 1. Tóm tắt (30 giây)

**VNStock AI v2.0** là hệ thống tổng hợp thông tin chứng khoán Việt Nam với AI.

- **Frontend**: React 18 + Vite + Tailwind + shadcn/ui, HashRouter, GitHub Pages
- **Backend**: Node.js + Express (ES modules), port 3004, SQLite (better-sqlite3)
- **Remote Sync**: Cloudflare D1 + Turso (cần credentials để activate)
- **Bot**: Telegram @HuuVangbot với NLU (ngôn ngữ tự nhiên)
- **Email**: Gmail SMTP qua Python smtplib (không cần cài thêm Node package)
- **YouTube**: Phân tích 29 kênh FREE-first (subtitle + keyword analysis)
- **Push All**: Script tự động push lên tất cả kênh (`push-all.bat` + `push-all.js`)
- **Auto Start**: File `.bat` chỉ 3 dòng → gọi Python xử lý toàn bộ: Backend + Tunnel + Webhook + Browser
- **Remote Access**: Cloudflare Tunnel (`start-tunnel.bat`) + GitHub Pages + Local + Telegram Bot
- **Documentation**: `HUONG_DAN_SU_DUNG.md` - hướng dẫn chi tiết cho người mới

**Tính năng chính đã hoàn thành (V2.0)****:
1. ✅ V1 UI restored (ModuleSelector, SystemConfigPanel, Header, ExecutiveBrain, HealthCheck, Workflow)
2. ✅ Chat AI trong Dashboard (Messenger bubbles, NLU, SQLite storage)
3. ✅ SQLite Backend (5 tables, 30+ API endpoints)
4. ✅ Telegram Bot NLU (@HuuVangbot, 9 intents, action execution)
5. ✅ Build & Deploy (GitHub Pages live)
6. ✅ D1 + Turso Sync (sync.js, push/pull/config APIs)
7. ✅ Email Gmail SMTP (Python smtplib, không cài thêm package)
8. ✅ YouTube Analyzer 29 kênh (FREE-first, tiếng Việt có dấu)
9. ✅ Push All Script (tự động push lên local + tunnel + GitHub Pages + Telegram)
10. ✅ Auto Start Script (`auto-start.bat` chỉ 3 dòng → gọi Python `auto_start.py` xử lý toàn bộ: Backend + Tunnel + Webhook + Browser)

**Tính năng V3.0 đang nâng cấp**:
11. ✅ **Report Builder** — Cấu hình mẫu báo cáo tùy chỉnh
12. ✅ **Data Collection Panel** — Quản lý nguồn dữ liệu
13. ✅ **Chart Viewer** — Đồ thị 10 chỉ báo
14. ✅ **Audio Player** — Phát audio TTS
15. ✅ **3D Knowledge Graph** — Force-directed graph
16. ✅ **Agent Swarm** — 4 workers
17. ✅ **Precheck Engine** — 6 bước kiểm tra
18. ✅ **Router 9** — AI provider router
19. ✅ **State Manager** — Lưu/load workflow state
20. ✅ **Meta-Prompt** — 5 bước adaptive synthesis
21. ✅ **NotebookLM Sync** — Google Drive sync + Audio Overview
22. ✅ **n8n Bridge** — Webhook service
23. ✅ **Push All** — Tự động hóa toàn bộ: Build → Backend → Tunnel → GitHub Pages → Webhook → Browser → Test
24. ✅ **Chat AI Engine** — AI tự hiểu app, function calling, điều khiển workflow tự nhiên
25. ✅ **Viber Webhook** — Endpoint nhận message từ Viber
26. ✅ **Workflow Runner** — Full pipeline 7 bước end-to-end
27. ✅ **API Test Endpoints** — Test tất cả providers, `can_run_workflow` flag
28. ✅ **Dashboard Status API** — Tổng quan hệ thống real-time
29. ✅ **Health Check Panel v2** — API status chi tiết, cảnh báo Gemini
30. ✅ **Chat AI API Guard** — Tự động detect API chưa cấu hình, navigate Settings
31. ✅ **Health Check Engine v2** — Node.js `http`/`https` thay vì `curl`
32. ✅ **State Manager v2** — Khớp schema `workflow_states` thực tế
33. ✅ **Build Freshness Checker** — Tự động kiểm tra `dist/` vs `src/`, báo trên dashboard
34. ✅ **Push All v3.1** — Auto-check build freshness trước khi build, skip nếu đã fresh
35. ✅ **Build & Deploy V3** — Cập nhật GitHub Pages, title v3.0

---

## 2. Kiến trúc hệ thống

```
┌─────────────────────────────────────────────────────────────┐
│  FRONTEND (React 18 + Vite + Tailwind + shadcn/ui)          │
│  ├─ /           → System Config + Chat AI                   │
│  ├─ /modules    → Module Registry (24 modules)              │
│  ├─ /workflow   → Workflow Graph (nodes/edges SVG)          │
│  ├─ /brain      → Executive Brain Console                    │
│  ├─ /health     → Health Check + Quota Forecast             │
│  ├─ /settings   → Output Channels (Telegram/Email/Notion)   │
│  ├─ /report-builder → Report Template Config (V3)           │
│  ├─ /data-collection → Data Source Manager (V3)             │
│  ├─ /charts     → Chart Viewer 10 indicators (V3)           │
│  ├─ /audio      → Audio Player TTS (V3)                     │
│  └─ /graph-3d   → 3D Knowledge Graph (V3)                  │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│  BACKEND (Node.js + Express, port 3004)                      │
│  ├─ 30+ API endpoints (V2) + 10+ endpoints (V3)             │
│  ├─ Telegram Webhook (NLU parser, 9 intents)                │
│  ├─ SQLite (better-sqlite3, WAL mode) - 8 tables            │
│  ├─ Sync engine (D1 + Turso, bidirectional)                  │
│  ├─ Email (Python smtplib → Gmail SMTP)                      │
│  ├─ YouTube Analyzer (Python, FREE-first)                   │
│  ├─ Agent Swarm (4 workers + Data Merge + Report + TTS)      │
│  ├─ Precheck Engine (6-check pre-flight)                    │
│  ├─ Router 9 (AI provider fallback chain)                    │
│  ├─ State Manager (workflow persistence)                   │
│  ├─ Meta-Prompt (5-step adaptive synthesis)                │
│  ├─ NotebookLM Sync (Google Drive + Audio Overview)         │
│  ├─ n8n Bridge (webhook service)                           │
│  └─ Cron scheduler (node-cron)                                │
└─────────────────────────────────────────────────────────────┘
                              │
              ┌───────────────┼───────────────┐
              ▼               ▼               ▼
        ┌─────────┐    ┌─────────┐    ┌─────────────┐
        │ SQLite  │    │ D1      │    │ Turso       │
        │ (local) │◄──►│ (remote)│◄──►│ (remote)    │
        └─────────┘    └─────────┘    └─────────────┘
```

---

## 2.1. Kênh truy cập app (Remote Access)

App có **4 kênh truy cập**:

| Kênh | URL / Cách truy cập | Cần backend? | Dùng khi nào |
|------|---------------------|--------------|--------------|
| **Local** | http://localhost:3004 | ✅ Có backend | Ngồi trước máy tính này |
| **Cloudflare Tunnel** | URL thay đổi (khởi động `start-tunnel.bat`) | ✅ Có backend | Truy cập từ xa, điện thoại, máy khác |
| **GitHub Pages** | https://seeyeahall.github.io/vnstock-ai/ | ❌ Không backend | Chỉ xem giao diện, không chat AI |
| **Telegram Bot** | @HuuVangbot | ✅ Có backend | Chat trên điện thoại, nhận báo cáo |

**⚠️ Quan trọng**: Để dùng đầy đủ tính năng (Chat AI, tạo báo cáo, gửi Email...), **backend phải đang chạy**. GitHub Pages chỉ có giao diện static, không có backend API.

**Hướng dẫn chi tiết**: Xem file `HUONG_DAN_SU_DUNG.md`

---

## 3. Tiến trình thực hiện (2026-06-07)

### ✅ ĐÃ HOÀN THÀNH

| # | Tính năng | File chính | Chi tiết |
|---|-----------|-----------|----------|
| 1 | **V1 UI restored** | `src/sections/*.tsx` | Copy từ V1 source, adapt shadcn/ui. Header có logo, status badge, Run Workflow button. |
| 2 | **Chat AI** | `src/sections/ChatPanel.tsx` | Messenger bubbles (user xanh/phải, AI xám/trái), Enter gửi, typing indicator, local fallback khi backend offline. |
| 3 | **SQLite Backend** | `local-backend/db.js`, `server.js` | 5 tables: chat_history, reports, settings, schedules, api_keys. Migration từ file-based config. 30+ API endpoints. |
| 4 | **Telegram Bot NLU** | `server.js` (parseTelegramIntent) | @HuuVangbot. 9 intents: greeting, help, create_report, check_status, test_api, set_schedule, get_report, thanks, chat. Lưu chat_history. |
| 5 | **Build & Deploy** | `dist/` → GitHub Pages | Vite build 273KB JS + 26KB CSS. Deploy `gh-pages` branch. |
| 6 | **D1 + Turso Sync** | `local-backend/sync.js` | Push/pull với conflict resolution (local wins). Config qua `/api/sync/config`. Cần credentials để activate. |
| 7 | **Email Gmail SMTP** | `local-backend/scripts/send_email.py` | Python smtplib gửi qua Gmail. Không cần cài thêm Node package. App Password: `qialfxmpfedshqgn` |
| 8 | **YouTube Analyzer** | `local-backend/scripts/youtube_analyzer.py` | Phân tích 29 kênh FREE-first: subtitle + keyword sentiment. Báo cáo HTML đẹp, tiếng Việt có dấu. |
| 9 | **Push All Script** | `push-all.bat`, `local-backend/scripts/push-all.js` | Tự động build, start backend, tạo tunnel, push GitHub Pages, cập nhật Telegram webhook, test endpoints. |

### ⏳ CẦN NGƯỜI DÙNG TỰ CẤU HÌNH

| # | Việc cần làm | Hướng dẫn |
|---|-------------|-----------|
| A | **D1 credentials** | Đăng ký Cloudflare → tạo D1 DB → lấy accountId, databaseId, apiToken → POST `/api/sync/config` |
| B | **Turso credentials** | Đăng ký Turso → `turso db create vnstock-ai` → lấy URL + token → POST `/api/sync/config` |
| C | **Tunnel stable** | Cần khởi động thủ công. Xem `local-backend/TUNNEL_GUIDE.md` để biết cách chạy cloudflared tunnel. Cập nhật Telegram webhook khi đổi URL. |

---

## 4. URL & Endpoint quan trọng

| Dịch vụ | URL |
|---------|-----|
| **Frontend** | https://seeyeahall.github.io/vnstock-ai/ |
| **Backend local** | http://localhost:3004 |
| **Tunnel public** | Cần khởi động thủ công (xem `local-backend/TUNNEL_GUIDE.md`) |
| **Health** | GET http://localhost:3004/api/health |
| **Chat** | POST http://localhost:3004/api/chat/message |
| **Chat History** | GET http://localhost:3004/api/chat/history?sessionId=xxx |
| **DB Settings** | GET/POST http://localhost:3004/api/db/settings |
| **Sync Status** | GET http://localhost:3004/api/sync/status |
| **Sync Config** | POST http://localhost:3004/api/sync/config |
| **Sync Push** | POST http://localhost:3004/api/sync/push |
| **Sync Pull** | POST http://localhost:3004/api/sync/pull |
| **Email** | POST http://localhost:3004/api/send-email |
| **YouTube Analyze** | POST http://localhost:3004/api/youtube/analyze |
| **Telegram Webhook** | Cần cập nhật sau khi khởi động tunnel (xem `local-backend/TUNNEL_GUIDE.md`) |

---

## 5. Credentials (đã có sẵn)

| Dịch vụ | Giá trị |
|---------|---------|
| Telegram Bot | @HuuVangbot, token: `7055879874:AAE8PmCuPMMV7uyIiamDBNN5xZgWBctYIVc` |
| Telegram Chat ID | `6226786681` |
| Email | seeyeahall@gmail.com, App Password: `qialfxmpfedshqgn` |
| GitHub Pages | https://seeyeahall.github.io/vnstock-ai/ |

---

## 6. Yêu cầu chi tiết từng tính năng

### 6.1. V1 UI - ModuleSelector

- Filter theo category (All, Input, AI, Memory, Output, Validation, Recovery)
- Search theo tên và mô tả
- Card hiển thị: icon, tên, version, mô tả, inputs/outputs tags, dependencies
- Toggle select/unselect với indicator
- Dialog config cho từng module (config_schema fields)
- Category colors: input=blue, ai=purple, memory=amber, output=emerald, validation=rose, recovery=orange

### 6.2. V1 UI - SystemConfigPanel

- Left column: System Presets (3 presets), click để apply
- Right column: Config form
  - System Name (input)
  - Operation Mode (select: autonomous/scheduled/manual)
  - Hardware Profile (select: low_end/medium/high_end)
  - Schedule time buttons (06:00-21:00) - toggle
  - Architecture Overview mini diagram (Inputs → AI → Memory → Outputs)
- Current Config Summary badges

### 6.3. Chat AI - ChatPanel

- **Bubbles**: User bên phải (xanh), AI bên trái (xám)
- **Input**: Textarea + nút gửi (Enter gửi, Shift+Enter xuống dòng)
- **History**: Lưu SQLite, hiển thị danh sách conversation
- **Features**: NLU intent detection, API execution, markdown rendering, typing indicator
- **Fallback**: Khi backend offline → local response processor

### 6.4. SQLite - 5 Tables

```sql
-- chat_history
CREATE TABLE chat_history (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  session_id TEXT NOT NULL,
  role TEXT NOT NULL CHECK(role IN ('user', 'assistant', 'system')),
  content TEXT NOT NULL,
  intent TEXT,
  metadata TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- reports
CREATE TABLE reports (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  report_id TEXT UNIQUE NOT NULL,
  template TEXT, format TEXT DEFAULT 'html',
  sections TEXT, symbols TEXT, html_path TEXT,
  telegram_sent BOOLEAN DEFAULT 0, email_sent BOOLEAN DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- settings
CREATE TABLE settings (
  key TEXT PRIMARY KEY, value TEXT NOT NULL,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- schedules
CREATE TABLE schedules (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  schedule_id TEXT UNIQUE NOT NULL, name TEXT NOT NULL,
  cron TEXT NOT NULL, template TEXT, outputs TEXT,
  enabled BOOLEAN DEFAULT 1, last_run DATETIME, next_run DATETIME,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- api_keys
CREATE TABLE api_keys (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  provider TEXT UNIQUE NOT NULL, api_key TEXT NOT NULL,
  status TEXT DEFAULT 'unknown', latency_ms INTEGER, last_tested DATETIME,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

### 6.5. Telegram Bot - NLU Intents

| Intent | Ví dụ | Action |
|--------|-------|--------|
| greeting | "Chào", "Hello" | Chào hỏi |
| help | "Help", "Hướng dẫn" | Trả về danh sách lệnh |
| create_report | "Tạo báo cáo" | Gọi `/api/report/generate` |
| check_status | "Status", "Trạng thái" | Trả về health check |
| test_api | "Test API Gemini" | Gọi `/api/keys/test` |
| set_schedule | "Cài lịch 8h" | Gọi `/api/schedule` |
| get_report | "Xem báo cáo" | Trả về report link |
| thanks | "Cảm ơn" | Trả lời lịch sự |
| chat | Mọi câu khác | Trả lời tổng quát |

### 6.6. Email - Gmail SMTP (Python)

- **File**: `local-backend/scripts/send_email.py`
- **Method**: Python `smtplib` (có sẵn, không cần cài thêm Node package)
- **SMTP**: `smtp.gmail.com:587` + STARTTLS
- **Credentials**: seeyeahall@gmail.com, App Password: `qialfxmpfedshqgn`
- **API**: `POST /api/send-email` → backend gọi Python script qua `child_process.exec`

### 6.7. YouTube Analyzer - FREE-First

- **File**: `local-backend/scripts/youtube_analyzer.py`
- **Method**: Keyword-based sentiment analysis (không dùng AI API trả phí)
- **Input**: 29 kênh từ `E:\AI TONG HOP THONG TIN\29 kenh utube.txt`
- **Output**: Báo cáo HTML với:
  - Chỉ số tổng quan (videos, bullish/bearish/neutral)
  - Top cổ phiếu được nhắc đến
  - Cụm chủ đề nóng (Hot Topics)
  - Góc nhìn phản biện (mâu thuẫn giữa các kênh)
  - Danh sách 29 kênh đã phân tích
- **Language**: Tiếng Việt có dấu

### 6.8. D1 + Turso Sync

**Cloudflare D1**:
- Free tier: 5M rows/read/ngày, 100K rows/write/ngày
- API: `https://api.cloudflare.com/client/v4/accounts/{account_id}/d1/database/{db_id}/query`

**Turso**:
- Free tier: 9GB storage, 1B rows read/month
- API: `https://{db_url}/v2/pipeline`

**Sync Strategy**:
- Local SQLite là primary
- Bidirectional sync (local wins on conflict)
- Incremental sync (chỉ sync rows thay đổi)
- Background sync mỗi 5 phút (khi online)

---

## 7. Hướng dẫn cấu hình D1 + Turso

### Cloudflare D1

```bash
# 1. Đăng ký Cloudflare: https://dash.cloudflare.com
# 2. Tạo D1 database: Workers & Pages → D1 → Create database
# 3. Lấy Account ID từ sidebar
# 4. Tạo API Token: My Profile → API Tokens → Create Token
# 5. Gọi API cấu hình:
curl -X POST http://localhost:3004/api/sync/config \
  -H "Content-Type: application/json" \
  -d '{
    "d1": {
      "enabled": true,
      "accountId": "YOUR_ACCOUNT_ID",
      "databaseId": "YOUR_DATABASE_ID",
      "apiToken": "YOUR_API_TOKEN"
    }
  }'
```

### Turso

```bash
# 1. Đăng ký Turso: https://turso.tech
# 2. Cài CLI: curl -sSfL https://get.tur.so/install.sh | bash
# 3. Tạo DB: turso db create vnstock-ai
# 4. Lấy URL: turso db show vnstock-ai --url
# 5. Tạo token: turso db tokens create vnstock-ai
# 6. Gọi API cấu hình:
curl -X POST http://localhost:3004/api/sync/config \
  -H "Content-Type: application/json" \
  -d '{
    "turso": {
      "enabled": true,
      "databaseUrl": "https://YOUR_DB.turso.io",
      "apiToken": "YOUR_TOKEN"
    }
  }'
```

### Sync thủ công

```bash
# Push local → remote
curl -X POST http://localhost:3004/api/sync/push \
  -H "Content-Type: application/json" \
  -d '{"tables":["chat_history","reports","settings","schedules","api_keys"]}'

# Pull remote → local
curl -X POST http://localhost:3004/api/sync/pull \
  -H "Content-Type: application/json" \
  -d '{"tables":["chat_history","reports","settings","schedules","api_keys"]}'

# Check status
curl http://localhost:3004/api/sync/status
```

---

## 8. File docs trong project

| File | Mục đích |
|------|----------|
| `RESUME_PROMPT.md` | **Tóm tắt nhanh cho chat mới** (2 phút đọc) |
| `MASTER_PROMPT.md` | **File này** - Tổng quan đầy đủ |
| `ARCHITECTURE.md` | Kiến trúc hệ thống 4 lớng, data flow |
| `API_SPEC.md` | 30+ API endpoints, request/response |
| `DB_SCHEMA.md` | 5 tables SQLite, SQL đầy đủ |
| `PROGRESS_ANALYSIS_v2.md` | Phân tích tiến trình, optimization, risk |
| `local-backend/TUNNEL_GUIDE.md` | Hướng dẫn tạo Cloudflare tunnel |

---

## 9. Backup & Recovery

**Thư mục backup**: `backup/vnstock-ai-v2.0/`
- Chứa toàn bộ nguồn code: `src/`, `local-backend/`, `dist/`, config files
- **KHÔNG ĐƯỢC XÓA** - dùng để khôi phục/fix code khi cần
- Cập nhật backup sau mỗi lần thay đổi lớn

---

## 10. Cách tiếp tục phát triển

**Nếu chat mới muốn làm tiếp**:
1. Đọc `RESUME_PROMPT.md` để nắm bắt nhanh (2 phút)
2. Đọc `MASTER_PROMPT.md` (file này) để hiểu chi tiết
3. Đọc `API_SPEC.md` + `DB_SCHEMA.md` nếu cần implement
4. Source code: `src/` (frontend), `local-backend/` (backend)
5. Backup: `backup/vnstock-ai-v2.0/` (khôi phục khi cần)

**Các tính năng có thể thêm (sau V3.0)**:
- Real-time data: WebSocket feed cho giá cổ phiếu real-time
- Advanced AI: Fine-tuned model cho tiếng Việt chứng khoán
- Mobile app: React Native hoặc PWA
- Social features: Share báo cáo, comment, rating
- Backtesting: Test chiến lược giao dịch trên lịch sử
- Alert system: Thông báo khi chỉ báo đạt ngưỡng
- Multi-language: English mode cho nhà đầu tư nước ngoài

---

## 11. Lưu ý quan trọng (V3.0)

- **Local first**: SQLite local là primary, remote sync là optional
- **Natural language**: Không dùng CLI commands (/command), dùng ngôn ngữ tự nhiên
- **GitHub Pages**: HashRouter, dist/ files at root in gh-pages branch
- **Tunnel**: `auto-start.bat` chỉ 3 dòng → gọi Python `auto_start.py` xử lý toàn bộ: backend + tunnel + webhook + browser. Hoặc làm thủ công: `cloudflared tunnel --url http://localhost:3004`
- **Bot token**: @HuuVangbot đã cấu hình, webhook đã set
- **Email**: Python smtplib, không cần cài thêm Node package
- **YouTube**: FREE-first (subtitle + keyword), không đốt token AI
- **Backup**: `backup/vnstock-ai-v2.0/` - KHÔNG ĐƯỢC XÓA. Chứa toàn bộ source code để khôi phục khi cần.
- **Quy tắc FIX CODE**: 
  1. **Trước khi sửa code lớn**: Phải backup toàn bộ `src/`, `local-backend/`, config files vào `backup/vnstock-ai-v2.0/`
  2. **Sau khi fix code**: Phải cập nhật lại `MASTER_PROMPT.md`, `RESUME_PROMPT.md`, `PROGRESS_ANALYSIS_v3.md`, `HUONG_DAN_SU_DUNG.md` để chat mới biết tiếp tục từ đâu
  3. **Không được xóa source code hẳn**: Chỉ được thay thế sau khi đã backup
  4. **Git commit**: Mỗi lần thay đổi phải commit với message rõ ràng
- **V3 Design Docs**: `docs/upgrade-v3/` chứa 5 file thiết kế chi tiết (overview, system graph, roadmap, advanced features, master prompt)
- **V3 Code Status**: Pha 0-1-2-3-4-5-6-9 đã hoàn thành. Pha 7 (NotebookLM), Pha 8 (n8n Bridge), Pha 10 (Build & Deploy) đang chờ.

---

*Cập nhật: 2026-06-08. V3.0 đã hoàn thành — 11/11 pha.*
