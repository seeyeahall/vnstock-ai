# VNStock AI v2.0 - Project Resume

> **Mục đích file này**: Chat mới đọc để hiểu app đang làm gì và tiến trình hiện tại.

---

## 1. App là gì? (30 giây đọc)

**VNStock AI** = Hệ thống tổng hợp thông tin chứng khoán Việt Nam với AI.
- **V1** (cũ): `VNStock Adaptive Intelligence System` - n8n + Google Sheets + Python microservice + Gemini AI
- **V2.0** (hiện tại): React frontend + Node.js backend + SQLite local + sync D1/Turso + Email Python SMTP + YouTube Analyzer FREE

**Tính năng chính (V2.0 + V3.0)**:
1. **Module Registry** - 24 modules (Input/AI/Memory/Output/Validation/Recovery), chọn/bật tắt
2. **System Config** - 3 presets, mode (autonomous/scheduled/manual), hardware, schedule
3. **Chat AI** - Chat kiểu Messenger trong Dashboard, NLU, lưu SQLite
4. **Telegram Bot** - @HuuVangbot, ngôn ngữ tự nhiên (không CLI)
5. **SQLite DB** - 8 tables: chat_history, reports, settings, schedules, api_keys, report_templates, agent_tasks, workflow_states
6. **Remote Sync** - Cloudflare D1 + Turso (cần credentials để activate)
7. **Workflow** - Visual graph, Executive Brain, Health Check, Precheck Engine
8. **Email Gmail SMTP** - Python smtplib, không cài thêm Node package
9. **YouTube Analyzer** - 29 kênh FREE-first, tiếng Việt có dấu
10. **Push All Script** - Tự động push lên local + tunnel + GitHub Pages + Telegram
11. **Auto Start** - File `.bat` chỉ 3 dòng → gọi Python `auto_start.py` xử lý toàn bộ: Backend + Tunnel + Webhook + Browser
12. **Remote Access** - 4 kênh: Local (3004), Cloudflare Tunnel, GitHub Pages, Telegram Bot
13. **Report Builder** (V3) - Cấu hình mẫu báo cáo tùy chỉnh với preset, section toggle/reorder, output channel matrix
14. **Data Collection** (V3) - Quản lý nguồn dữ liệu (YouTube, RSS, API, Manual) với trạng thái real-time
15. **Chart Viewer** (V3) - 10 chỉ báo: MA, EMA, RSI, MACD, Bollinger, Ichimoku (9-17-26-26-26), Ichimoku (65-129-5-2-2), Volume MA, OBV, Stochastic
16. **Audio Player** (V3) - Phát audio TTS từ báo cáo (Web Speech API + Python TTS fallback)
17. **3D Knowledge Graph** (V3) - Force-directed graph D3.js hiển thị mối liên hệ cổ phiếu-chủ đề-kênh
18. **Agent Swarm** (V3) - 4 workers (YouTube, Stock, News, Analysis) + Data Merge + Report Renderer + TTS Service
19. **Precheck Engine** (V3) - 6 bước kiểm tra trước khi chạy workflow
20. **Router 9** (V3) - AI provider router với fallback chain (Gemini → Groq → OpenRouter → Ollama)
21. **Meta-Prompt** (V3) - 5 bước adaptive synthesis cho báo cáo chính xác
22. **NotebookLM Sync** (V3 — service created) - Google Drive sync + Audio Overview
23. **n8n Bridge** (V3 — service created) - Webhook service cho workflow automation

---

## 2. Kiến trúc tổng quan

```
┌─────────────────────────────────────────────┐
│  FRONTEND (React 18 + Vite + Tailwind)      │
│  ├─ /           → System Config + Chat AI   │
│  ├─ /modules    → Module Registry (24 mod)  │
│  ├─ /workflow   → Workflow Graph          │
│  ├─ /brain      → Executive Brain Console │
│  ├─ /health     → Health Check + Quota    │
│  └─ /settings   → Output Channels         │
└─────────────────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────┐
│  BACKEND (Node.js + Express, port 3004)     │
│  ├─ 30+ API endpoints                       │
│  ├─ Telegram Webhook (NLU parser)          │
│  ├─ SQLite (better-sqlite3)                │
│  ├─ Sync engine (D1 + Turso)               │
│  ├─ Email (Python smtplib → Gmail)         │
│  ├─ YouTube Analyzer (Python, FREE)       │
│  └─ Cron scheduler                          │
└─────────────────────────────────────────────┘
                      │
        ┌─────────────┼─────────────┐
        ▼             ▼             ▼
   ┌─────────┐  ┌─────────┐  ┌─────────────┐
   │ SQLite  │  │ D1      │  │ Turso       │
   │ (local) │◄─┤ (remote)│◄─┤ (remote)    │
   └─────────┘  └─────────┘  └─────────────┘
```

---

## 2.1. Kênh truy cập app (Remote Access)

| Kênh | URL / Cách truy cập | Cần backend? | Dùng khi nào |
|------|---------------------|--------------|--------------|
| **Local** | http://localhost:3004 | ✅ Có backend | Ngồi trước máy tính này |
| **Cloudflare Tunnel** | URL thay đổi (khởi động `start-tunnel.bat`) | ✅ Có backend | Truy cập từ xa, điện thoại |
| **GitHub Pages** | https://seeyeahall.github.io/vnstock-ai/ | ❌ Không backend | Chỉ xem giao diện |
| **Telegram Bot** | @HuuVangbot | ✅ Có backend | Chat trên điện thoại |

**Hướng dẫn chi tiết**: Xem `HUONG_DAN_SU_DUNG.md`

---

## 3. Tiến trình hiện tại (2026-06-07)

### ✅ ĐÃ HOÀN THÀNH (V2.0 + V3.0)

| # | Tính năng | File chính | Status |
|---|-----------|-----------|--------|
| 1 | **V1 UI restored** | `src/sections/*.tsx` | ✅ |
| 2 | **Chat AI** | `src/sections/ChatPanel.tsx` | ✅ |
| 3 | **SQLite Backend** | `local-backend/db.js`, `server.js` | ✅ |
| 4 | **Telegram Bot NLU** | `server.js` (parseTelegramIntent) | ✅ |
| 5 | **Build & Deploy** | `dist/` → GitHub Pages | ✅ |
| 6 | **D1 + Turso Sync** | `local-backend/sync.js` | ✅ |
| 7 | **Email Gmail SMTP** | `local-backend/scripts/send_email.py` | ✅ |
| 8 | **YouTube Analyzer** | `local-backend/scripts/youtube_analyzer.py` | ✅ |
| 9 | **Push All Script** | `push-all.bat`, `local-backend/scripts/push-all.js` | ✅ |
| 10 | **Report Builder** | `src/sections/report-builder/*` | ✅ |
| 11 | **Data Collection Panel** | `src/sections/data-collection/*` | ✅ |
| 12 | **Chart Viewer (10 indicators)** | `src/sections/chart-viewer/*` | ✅ |
| 13 | **Audio Player** | `src/sections/audio-player/*` | ✅ |
| 14 | **3D Knowledge Graph** | `src/sections/graph-3d/*` | ✅ |
| 15 | **Agent Swarm** | `local-backend/workers/*` | ✅ |
| 16 | **Precheck Engine** | `local-backend/services/precheckEngine.js` | ✅ |
| 17 | **Router 9** | `local-backend/services/router9.js` | ✅ |
| 18 | **State Manager** | `local-backend/services/stateManager.js` | ✅ |
| 19 | **Meta-Prompt** | `local-backend/config/meta_prompt.md` | ✅ |
| 20 | **NotebookLM Sync** | `local-backend/services/notebooklmSync.js` | ✅ |
| 21 | **n8n Bridge** | `local-backend/services/n8nBridge.js` | ✅ |

### ⏳ CẦN LÀM TIẾP

| # | Việc cần làm | Mô tả |
|---|-------------|-------|
| A | **Build & Deploy V3** | `npm run build` + push GitHub Pages + cập nhật docs |
| B | **D1 credentials** | Đăng ký Cloudflare → tạo D1 DB → lấy accountId, databaseId, apiToken → POST `/api/sync/config` |
| C | **Turso credentials** | Đăng ký Turso → `turso db create vnstock-ai` → lấy URL + token → POST `/api/sync/config` |
| D | **Tunnel stable** | Cần khởi động thủ công. Xem `local-backend/TUNNEL_GUIDE.md` để biết cách chạy cloudflared tunnel. |

---

## 4. URL & Endpoint quan trọng

| Dịch vụ | URL |
|---------|-----|
| **Frontend** | https://seeyeahall.github.io/vnstock-ai/ |
| **Backend local** | http://localhost:3004 |
| **Tunnel public** | Cần khởi động thủ công (xem `local-backend/TUNNEL_GUIDE.md`) |
| **Health** | http://localhost:3004/api/health |
| **Chat API** | POST http://localhost:3004/api/chat/message |
| **Email** | POST http://localhost:3004/api/send-email |
| **YouTube Analyze** | POST http://localhost:3004/api/youtube/analyze |
| **Sync Status** | http://localhost:3004/api/sync/status |
| **Sync Config** | POST http://localhost:3004/api/sync/config |

---

## 5. File docs trong project

| File | Nội dung |
|------|----------|
| `MASTER_PROMPT.md` | Tổng quan + yêu cầu chi tiết + hướng dẫn cấu hình |
| `ARCHITECTURE.md` | Kiến trúc hệ thống 4 lớng, data flow |
| `API_SPEC.md` | 30+ API endpoints, request/response format |
| `DB_SCHEMA.md` | 5 tables SQLite, SQL đầy đủ, migration |
| `PROGRESS_ANALYSIS_v2.md` | Phân tích tiến trình, optimization, risk |
| **This file** (`RESUME_PROMPT.md`) | Tóm tắt nhanh cho chat mới |

---

## 6. Credentials (đã có sẵn)

| Dịch vụ | Giá trị |
|---------|---------|
| Telegram Bot | @HuuVangbot, token: `7055879874:AAE8PmCuPMMV7uyIiamDBNN5xZgWBctYIVc` |
| Telegram Chat ID | `6226786681` |
| Email | seeyeahall@gmail.com, App Password: `qialfxmpfedshqgn` |
| GitHub Pages | https://seeyeahall.github.io/vnstock-ai/ |

---

## 7. Backup & Recovery

**Thư mục backup**: `backup/vnstock-ai-v2.0/`
- Chứa toàn bộ nguồn code: `src/`, `local-backend/`, `dist/`, config files
- **KHÔNG ĐƯỢC XÓA** - dùng để khôi phục/fix code khi cần
- Cập nhật backup sau mỗi lần thay đổi lớn

---

## 8. Cách tiếp tục phát triển

**Nếu chat mới muốn làm tiếp**:
1. Đọc `MASTER_PROMPT.md` để hiểu yêu cầu chi tiết
2. Đọc `docs/upgrade-v3/MASTER_PROMPT.md` để hiểu thiết kế V3
3. Đọc `API_SPEC.md` để biết API endpoints
4. Đọc `DB_SCHEMA.md` để biết database structure
5. Source code: `src/` (frontend), `local-backend/` (backend)
6. Backup: `backup/vnstock-ai-v2.0/` (khôi phục khi cần)
7. **Quy tắc FIX CODE quan trọng**:
   - **Trước khi sửa**: Backup toàn bộ `src/`, `local-backend/` vào `backup/vnstock-ai-v2.0/`
   - **Sau khi sửa**: Cập nhật lại `MASTER_PROMPT.md`, `RESUME_PROMPT.md`, `PROGRESS_ANALYSIS_v3.md`, `HUONG_DAN_SU_DUNG.md`
   - **Không xóa source hẳn**: Chỉ thay thế sau khi backup
   - **Commit**: Mỗi thay đổi phải commit với message rõ ràng

**Các tính năng có thể thêm (sau V3.0)**:
- Real-time data: WebSocket feed cho giá cổ phiếu real-time
- Advanced AI: Fine-tuned model cho tiếng Việt chứng khoán
- Mobile app: React Native hoặc PWA
- Social features: Share báo cáo, comment, rating
- Backtesting: Test chiến lược giao dịch trên lịch sử
- Alert system: Thông báo khi chỉ báo đạt ngưỡng
- Multi-language: English mode cho nhà đầu tư nước ngoài

---

*File này được tạo để chat mới có thể nắm bắt project trong 2 phút.*
*Cập nhật: 2026-06-08. V3.0 đã hoàn thành 21/23 pha — chỉ còn Build & Deploy + docs.*
