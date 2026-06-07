# VNStock AI v2.0 - Project Resume

> **Mục đích file này**: Chat mới đọc để hiểu app đang làm gì và tiến trình hiện tại.

---

## 1. App là gì? (30 giây đọc)

**VNStock AI** = Hệ thống tổng hợp thông tin chứng khoán Việt Nam với AI.
- **V1** (cũ): `VNStock Adaptive Intelligence System` - n8n + Google Sheets + Python microservice + Gemini AI
- **V2.0** (hiện tại): React frontend + Node.js backend + SQLite local + sync D1/Turso + Email Python SMTP + YouTube Analyzer FREE

**Tính năng chính**:
1. **Module Registry** - 24 modules (Input/AI/Memory/Output/Validation/Recovery), chọn/bật tắt
2. **System Config** - 3 presets, mode (autonomous/scheduled/manual), hardware, schedule
3. **Chat AI** - Chat kiểu Messenger trong Dashboard, NLU, lưu SQLite
4. **Telegram Bot** - @HuuVangbot, ngôn ngữ tự nhiên (không CLI)
5. **SQLite DB** - 5 tables: chat_history, reports, settings, schedules, api_keys
6. **Remote Sync** - Cloudflare D1 + Turso (cần credentials để activate)
7. **Workflow** - Visual graph, Executive Brain, Health Check
8. **Email Gmail SMTP** - Python smtplib, không cài thêm Node package
9. **YouTube Analyzer** - 29 kênh FREE-first, tiếng Việt có dấu
10. **Push All Script** - Tự động push lên local + tunnel + GitHub Pages + Telegram
11. **Auto Start** - File `.bat` chỉ 3 dòng → gọi Python `auto_start.py` xử lý toàn bộ: Backend + Tunnel + Webhook + Browser
12. **Remote Access** - 4 kênh: Local (3004), Cloudflare Tunnel, GitHub Pages, Telegram Bot
13. **User Guide** - `HUONG_DAN_SU_DUNG.md` - hướng dẫn chi tiết cho người mới

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

### ✅ ĐÃ HOÀN THÀNH

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

### ⏳ CẦN NGƯỜI DÙNG TỰ CẤU HÌNH

| # | Việc cần làm | Hướng dẫn |
|---|-------------|-----------|
| A | **D1 credentials** | Đăng ký Cloudflare → tạo D1 DB → lấy accountId, databaseId, apiToken → POST `/api/sync/config` |
| B | **Turso credentials** | Đăng ký Turso → `turso db create vnstock-ai` → lấy URL + token → POST `/api/sync/config` |
| C | **Tunnel stable** | Cần khởi động thủ công. Xem `local-backend/TUNNEL_GUIDE.md` để biết cách chạy cloudflared tunnel. |

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
2. Đọc `API_SPEC.md` để biết API endpoints
3. Đọc `DB_SCHEMA.md` để biết database structure
4. Source code: `src/` (frontend), `local-backend/` (backend)
5. Backup: `backup/vnstock-ai-v2.0/` (khôi phục khi cần)
6. **Quy tắc FIX CODE quan trọng**:
   - **Trước khi sửa**: Backup toàn bộ `src/`, `local-backend/` vào `backup/vnstock-ai-v2.0/`
   - **Sau khi sửa**: Cập nhật lại `MASTER_PROMPT.md`, `RESUME_PROMPT.md`, `PROGRESS_ANALYSIS_v2.md`, `HUONG_DAN_SU_DUNG.md`
   - **Không xóa source hẳn**: Chỉ thay thế sau khi backup
   - **Commit**: Mỗi thay đổi phải commit với message rõ ràng

**Các tính năng có thể thêm**:
- Real data: VNStock API, YouTube Data API v3, RSS feeds
- Charts: Tích hợp charting library (TradingView, Chart.js)
- Audio: TTS API (Google TTS, Azure TTS)
- AI: Tích hợp Gemini/Groq API thực (thay stub)
- PWA: Service worker, offline mode
- Auth: Login system

---

*File này được tạo để chat mới có thể nắm bắt project trong 2 phút.*
