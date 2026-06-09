# 📘 HƯỚNG DẪN SỬ DỤNG VNStock AI v2.0

> **Dành cho người mới** - Đọc từ đầu đến cuối để hiểu cách truy cập và sử dụng app.

---

## 📋 Mục lục

1. [Các kênh truy cập app](#1-các-kênh-truy-cập-app)
2. [Cách 0: Auto Start - Chỉ 1 lệnh (Khuyên dùng)](#2-cách-0-auto-start---chỉ-1-lệnh-khuyên-dùng)
3. [Cách 1: Truy cập từ xa thủ công](#3-cách-1-truy-cập-từ-xa-thủ-công)
4. [Cách 2: Truy cập Local (chỉ trên máy tính này)](#4-cách-2-truy-cập-local-chỉ-trên-máy-tính-này)
5. [Cách 3: GitHub Pages (chỉ giao diện, không có AI)](#5-cách-3-github-pages-chỉ-giao-diện-không-có-ai)
6. [Cách 4: Telegram Bot (trên điện thoại)](#6-cách-4-telegram-bot-trên-điện-thoại)
7. [Hướng dẫn sử dụng Chat AI](#7-hướng-dẫn-sử-dụng-chat-ai)
8. [Hướng dẫn tạo báo cáo và gửi output](#8-hướng-dẫn-tạo-báo-cáo-và-gửi-output)
9. [Lệnh Push All - Push app lên tất cả kênh](#9-lệnh-push-all---push-app-lên-tất-cả-kênh)
10. [Xử lý lỗi thường gặp](#10-xử-lý-lỗi-thường-gặp)
11. [Thông tin kỹ thuật](#11-thông-tin-kỹ-thuật)

---

## 1. Các kênh truy cập app

| Kênh | URL | Cần backend? | Dùng khi nào |
|------|-----|--------------|--------------|
| **Local** | http://localhost:3004 | ✅ Có backend | Ngồi trước máy tính này |
| **Cloudflare Tunnel** | URL thay đổi (xem Cách 1) | ✅ Có backend | Truy cập từ xa, điện thoại, máy khác |
| **GitHub Pages** | https://seeyeahall.github.io/vnstock-ai/ | ❌ Không backend | Chỉ xem giao diện, không chat AI |
| **Telegram Bot** | @HuuVangbot | ✅ Có backend | Chat trên điện thoại, nhận báo cáo |

**⚠️ Quan trọng**: Để dùng đầy đủ tính năng (Chat AI, tạo báo cáo, gửi Email...), **backend phải đang chạy**. GitHub Pages chỉ có giao diện, không có backend.

---

## 2. Cách 0: Auto Start - Chỉ 1 lệnh (Khuyên dùng)

**Đây là cách dễ nhất và được khuyên dùng.** File `auto-start.bat` tự động:
1. Tìm Node.js
2. Kill process cũ (tránh port conflict)
3. Start backend server (port 3004)
4. Start frontend dev server (port 5173)
5. Start Cloudflare tunnel (nếu có)
6. Mở browser ở `http://localhost:5173`

```
[1/5] Kiem tra backend... OK
[2/5] Tao Cloudflare tunnel... OK -> URL: https://abc123.trycloudflare.com
[3/5] Cap nhat Telegram webhook... OK
[4/5] Mo trinh duyet... OK
[5/5] APP DA SAN SANG!
```

### Bước duy nhất: Double-click file auto-start.bat

Mở **File Explorer**, đi đến thư mục:

```
E:\AI TONG HOP THONG TIN\app\
```

**Double-click** file: **`auto-start.bat`**

Hoặc mở **Command Prompt**, chạy:

```bash
cd "E:\AI TONG HOP THONG TIN\app"
auto-start.bat
```

### Kết quả

Bạn sẽ thấy cửa sổ hiện ra với tiến trình:

```
============================================================
VNStock AI v3.0 - AUTO START
Backend + Frontend Dev + Tunnel + Browser
============================================================

[1/4] Kiem tra Node.js... OK
[2/4] Khoi dong backend... OK (port 3004)
[3/4] Khoi dong frontend dev... OK (port 5173)
[4/4] Khoi dong tunnel... OK (neu co cloudflared.exe)

============================================================
APP DA SAN SANG!
============================================================

TRUY CAP LOCAL (frontend dev):
    http://localhost:5173

TRUY CAP API (backend):
    http://localhost:3004

TRUY CAP TU XA (neu tunnel chay):
    Xem cua so "VNStock Tunnel" de lay URL

TELEGRAM BOT:
    @HuuVangbot

GITHUB PAGES (chi giao dien):
    https://seeyeahall.github.io/vnstock-ai/

============================================================
LUU Y QUAN TRONG:
    - Giua cua so backend mo de API hoat dong
    - URL tunnel thay doi moi lan khoi dong lai
    - Frontend dev server (5173) tu dong reload khi sua code
    - Backend chay rieng, khong bi anh huong khi dung tunnel
============================================================
```

**Trình duyệt sẽ tự động mở** với URL frontend dev (`http://localhost:5173`). Bạn có thể:
- Truy cập trên máy tính này
- Truy cập trên điện thoại (nhập URL tunnel nếu có)
- Gửi URL cho người khác qua Zalo/Messenger

### ⚠️ Lưu ý

- **Giữ cửa sổ backend mở**: API sẽ tắt nếu đóng cửa sổ backend
- **Giữ cửa sổ tunnel mở**: Tunnel sẽ tắt nếu đóng cửa sổ
- **URL tunnel thay đổi mỗi lần**: Mỗi lần chạy lại `auto-start.bat` sẽ có URL mới
- **Frontend auto-reload**: Khi sửa code frontend, trang tự động reload
- **Không cần làm gì thêm**: Tất cả đã tự động

### File auto-start.bat có gì?

File `auto-start.bat` tự động tìm Node.js, kill process cũ, start backend, start frontend dev, start tunnel, và mở browser:

- Tìm `node.exe` trong các thư mục phổ biến hoặc PATH
- Kill `node.exe` cũ để tránh port conflict
- Kiểm tra port 3004 trống
- Start backend trong cửa sổ mới (`START "VNStock Backend"`)
- Test backend health (`curl http://localhost:3004/api/health`)
- Start frontend dev server trong cửa sổ mới (`npm run dev`)
- Start Cloudflare tunnel nếu `cloudflared.exe` tồn tại
- Mở browser ở `http://localhost:5173`

---

## 3. Cách 1: Truy cập từ xa thủ công

Nếu `auto-start.bat` không hoạt động, bạn có thể làm thủ công theo các bước sau.

### Bước 1: Khởi động Backend

```bash
cd "E:\AI TONG HOP THONG TIN\app\local-backend"
node server.js
```

### Bước 2: Tạo Cloudflare Tunnel

Mở **cửa sổ mới**, chạy:

```bash
cloudflared tunnel --url http://localhost:3004
```

**Kết quả đúng**: Thấy URL dạng `https://abc123-def456.trycloudflare.com`

### Bước 3: Cập nhật Telegram Webhook

```bash
curl -X POST "https://api.telegram.org/bot7055879874:AAE8PmCuPMMV7uyIiamDBNN5xZgWBctYIVc/setWebhook" \
  -H "Content-Type: application/json" \
  -d "{\"url\":\"https://URL-CUA-BAN/api/telegram/webhook\"}"
```

### ⚠️ Lưu ý về Tunnel

- URL thay đổi mỗi lần khởi động
- Tunnel tự tắt khi đóng cửa sổ
- Miễn phí, không cần đăng ký

---

## 4. Cách 2: Truy cập Local (chỉ trên máy tính này)

Dùng khi ngồi trước máy tính cài đặt app.

### Bước 1: Khởi động Backend

```bash
cd "E:\AI TONG HOP THONG TIN\app\local-backend"
node server.js
```

### Bước 2: Mở trình duyệt

Nhập vào thanh địa chỉ:

```
http://localhost:3004
```

**✅ App sẽ hiện ra đầy đủ tính năng.**

---

## 5. Cách 3: GitHub Pages (chỉ giao diện, không có AI)

Dùng khi chỉ muốn xem giao diện, không cần tính năng AI.

### URL:

```
https://seeyeahall.github.io/vnstock-ai/
```

### ⚠️ Hạn chế:

- ❌ Không chat AI
- ❌ Không tạo báo cáo
- ❌ Không gửi Telegram/Email
- ❌ Không lưu dữ liệu
- ✅ Chỉ xem giao diện, điều hướng trang

---

## 6. Cách 4: Telegram Bot (trên điện thoại)

Dùng khi muốn chat nhanh trên điện thoại, nhận báo cáo tự động.

### Bước 1: Tìm bot

- Mở Telegram app
- Tìm `@HuuVangbot` hoặc click: https://t.me/HuuVangbot
- Nhấn **Start**

### Bước 2: Chat với bot

Gõ lệnh tự nhiên bằng tiếng Việt:

| Bạn gõ | Bot trả lời |
|--------|-------------|
| `Xin chào` | Chào hỏi, giới thiệu |
| `Tạo báo cáo` | Tạo báo cáo phân tích |
| `Gửi báo cáo` | Gửi báo cáo qua Telegram |
| `Kiểm tra sức khỏe` | Health check hệ thống |
| `Cài đặt` | Hướng dẫn cấu hình |
| `Giúp đỡ` | Danh sách lệnh |

### Bước 3: Nhận báo cáo tự động

Bot sẽ tự động gửi báo cáo khi:
- Bạn yêu cầu trong Chat AI
- Có lịch trình (schedule) được cài đặt
- Push All script chạy xong

---

## 7. Hướng dẫn sử dụng Chat AI

### Mở Chat AI

1. Truy cập app (local hoặc tunnel)
2. Ở màn hình chính, nhìn xuống góc dưới bên phải
3. Click vào **biểu tượng chat** (bong bóng Messenger)

### Các lệnh Chat AI

Gõ tự nhiên bằng tiếng Việt có dấu:

| Ý định | Ví dụ câu lệnh |
|--------|----------------|
| **Chào hỏi** | "Xin chào", "Chào bot", "Hi" |
| **Tạo báo cáo** | "Tạo báo cáo VN-Index", "Phân tích cổ phiếu VIC" |
| **Kiểm tra** | "Kiểm tra hệ thống", "Health check" |
| **Cài đặt** | "Cài đặt lịch chạy", "Thêm API key" |
| **Gửi output** | "Gửi báo cáo qua Telegram", "Email báo cáo cho tôi" |
| **Xem lịch sử** | "Xem báo cáo cũ", "Lịch sử chat" |
| **Giúp đỡ** | "Help", "Hướng dẫn", "Tôi cần giúp đỡ" |

### Ví dụ cuộc trò chuyện

**Bạn**: "Tạo báo cáo phân tích thị trường hôm nay"

**Bot**: "Đang tạo báo cáo phân tích thị trường... ✅ Đã tạo xong! Bạn muốn gửi qua kênh nào? (Telegram/Email/Notion)"

**Bạn**: "Gửi qua Telegram và Email"

**Bot**: "📤 Đã gửi báo cáo:\n• Telegram: ✅ Gửi thành công\n• Email: ✅ Gửi thành công"

---

## 8. Hướng dẫn tạo báo cáo và gửi output

### Cách 1: Qua Chat AI (dễ nhất)

1. Mở Chat AI
2. Gõ: "Tạo báo cáo [chủ đề]"
3. Bot hỏi kênh output → Chọn Telegram/Email/Notion
4. Báo cáo tự động gửi

### Cách 2: Qua màn hình Settings

1. Vào app → click **Settings** (góc trên bên phải)
2. Chọn tab **Output Channels**
3. Cấu hình:
   - **Telegram**: Nhập Bot Token và Chat ID
   - **Email**: Nhập Gmail và App Password
   - **Notion**: Nhập Integration Token và Database ID
4. Click **Test** để kiểm tra kết nối
5. Click **Save** để lưu

### Cách 3: Qua Telegram Bot

1. Mở Telegram, tìm `@HuuVangbot`
2. Gõ: "Tạo báo cáo"
3. Bot tạo và gửi báo cáo trực tiếp trong chat

### Các loại báo cáo

| Loại báo cáo | Mô tả | Kênh output |
|--------------|-------|-------------|
| **Báo cáo thị trường** | Phân tích VN-Index, HNX, UPCOM | Telegram, Email |
| **Báo cáo cổ phiếu** | Phân tích 1 mã cụ thể | Telegram, Email |
| **Báo cáo YouTube** | Tổng hợp 29 kênh YouTube | Telegram, Email |
| **Health Check** | Kiểm tra sức khỏe hệ thống | Telegram, Email |
| **Báo cáo tùy chỉnh** | Theo yêu cầu người dùng | Tất cả kênh |

---

## 8.5. Tính năng V3.0 mới

### Report Builder — Thiết lập mẫu báo cáo

1. Vào app → click **Report Builder** (tab mới)
2. Chọn preset: **Daily Brief** | **Weekly Deep** | **YouTube Only**
3. Toggle bật/tắt từng section:
   - ☑ Macro Overview
   - ☑ Sector Rotation
   - ☑ Stock Cards
   - ☑ Technical Chart
   - ☑ Sentiment Gauge
   - ☑ Insights & Blind Spots
   - ☑ Watchlist Table
   - ☐ Audio Summary
   - ☐ 3D Market Graph
4. Chọn output channel cho từng section:
   - Telegram: Macro + Sentiment
   - Email: Full HTML + Excel
   - Dashboard: All interactive
5. Chọn time range: 1d | 1w | 1m
6. Chọn sources: ☑ YouTube ☑ Stock ☑ RSS
7. Click **Save Template** hoặc **Run Now**

### Chart Viewer — 10 chỉ báo kỹ thuật

1. Vào app → click **Charts** (tab mới)
2. Chọn symbol: VNINDEX, FPT, VCB, HPG...
3. Chọn timeframe: 1d | 1w | 1m
4. Toggle indicators:
   - MA (5, 20, 50)
   - EMA (12, 26)
   - RSI (14)
   - MACD (12, 26, 9)
   - Bollinger Bands (20, 2)
   - Ichimoku Standard (9, 17, 26, 26, 26)
   - Ichimoku Long-term (65, 129, 5, 2, 2)
   - Volume MA (20)
   - OBV
   - Stochastic (14, 3, 3)
5. Xem tín hiệu tổng hợp ở footer
6. Click **Add to Report** để chèn vào báo cáo

### Data Collection Panel — Theo dõi thu thập dữ liệu

1. Vào app → click **Data Collection** (tab mới)
2. Xem progress real-time:
   - YouTube Collector: ████████░░ 80%
   - Stock Data Fetcher: ██████████ 100%
   - RSS News Collector: ██████░░░░ 60%
3. Có thể Pause / Resume / Cancel từng agent
4. Xem error log nếu agent fail

### Audio Player — Nghe báo cáo

1. Trong Dashboard hoặc Report Builder, chọn **Audio Summary**
2. Hệ thống tạo MP3 từ text báo cáo (TTS)
3. Player nhúng trong app với play/pause/seek/speed
4. Có thể download MP3

### 3D Market Graph — Mối liên hệ cổ phiếu

1. Vào app → click **3D Graph** (tab mới)
2. Xem force-directed graph:
   - Node = cổ phiếu (màu xanh = bullish, đỏ = bearish)
   - Edge = tương quan giá hoặc cùng ngành
3. Zoom, pan, click node để xem chi tiết
4. Click **Add to Report** để chèn vào báo cáo

### Precheck Engine — Kiểm tra trước khi chạy

1. Trước khi chạy workflow, hệ thống tự động chạy Precheck:
   - ✓ API Health (Gemini, Groq, VNStock, Telegram, Email)
   - ✓ Quota Forecast (đủ token không?)
   - ✓ Hardware (RAM, CPU, Disk)
   - ✓ Dependencies (SQLite, Qdrant)
   - ✓ Transcript Config
   - ✓ Dry-Run
2. Nếu FAIL → hiển thị lý do và nút **Auto-fix**
3. Nếu PASS → tự động chạy workflow

---

## 9. Lệnh Push All - Push app lên tất cả kênh

Push All = Build app → Khởi động backend → Tạo tunnel → Push GitHub Pages → Cập nhật Telegram.

### Cách chạy

#### Trên Windows (Command Prompt hoặc Git Bash):

```bash
cd "E:\AI TONG HOP THONG TIN\app"
push-all.bat
```

#### Trên Node.js (nếu có npm):

```bash
cd "E:\AI TONG HOP THONG TIN\app\local-backend"
node scripts/push-all.js
```

### Quy trình Push All

```
1. Build frontend (Vite)     → Tạo thư mục dist/
2. Khởi động backend          → Chạy trên port 3004
3. Tạo Cloudflare tunnel     → URL từ xa
4. Push GitHub Pages         → https://seeyeahall.github.io/vnstock-ai/
5. Cập nhật Telegram webhook → Bot nhận lệnh từ URL mới
6. Test kết nối              → Kiểm tra tất cả API
```

### ⚠️ Lưu ý khi chạy Push All

- **Cần đăng nhập GitHub**: Nếu chưa đăng nhập, script sẽ hỏi username/password
- **Giữ cửa sổ mở**: Backend và tunnel chạy liên tục, đừng đóng cửa sổ
- **Tunnel URL thay đổi**: Mỗi lần chạy lại sẽ có URL mới

---

## 10. Xử lý lỗi thường gặp

### ❌ Lỗi: "Không thể kết nối localhost:3004"

**Nguyên nhân**: Backend chưa chạy

**Cách fix**:
```bash
cd "E:\AI TONG HOP THONG TIN\app\local-backend"
node server.js
```

### ❌ Lỗi: "Cloudflared không tìm thấy lệnh"

**Nguyên nhân**: Chưa cài đặt cloudflared

**Cách fix**:
1. Tải từ: https://developers.cloudflare.com/cloudflare-one/connections/connect-apps/install-and-setup/tunnel-guide/
2. Hoặc dùng npm: `npm install -g cloudflared`
3. Hoặc tải binary trực tiếp

### ❌ Lỗi: "GitHub Pages không cập nhật"

**Nguyên nhân**: Chưa push dist/ lên branch gh-pages

**Cách fix**:
```bash
cd "E:\AI TONG HOP THONG TIN\app"
git subtree push --prefix dist origin gh-pages
```

### ❌ Lỗi: "Telegram bot không trả lời"

**Nguyên nhân**: Webhook chưa cập nhật URL mới

**Cách fix**:
```bash
curl -X POST "https://api.telegram.org/bot7055879874:AAE8PmCuPMMV7uyIiamDBNN5xZgWBctYIVc/setWebhook" \
  -H "Content-Type: application/json" \
  -d "{\"url\":\"https://URL-CUA-BAN/api/telegram/webhook\"}"
```

### ❌ Lỗi: "Email gửi không thành công"

**Nguyên nhân**: Gmail App Password sai hoặc bị vô hiệu hóa

**Cách fix**:
1. Vào Google Account → Security → 2-Step Verification → App passwords
2. Tạo App Password mới cho "Mail"
3. Cập nhật trong Settings hoặc file `local-backend/scripts/send_email.py`

### ❌ Lỗi: "src/ bị mất sau khi push GitHub Pages"

**Nguyên nhân**: `git subtree push` có thể xóa working tree

**Cách fix**:
```bash
git checkout HEAD -- src/
```

Hoặc khôi phục từ backup:
```bash
cp -r backup/vnstock-ai-v2.0/src .
```

---

## 📊 Hướng dẫn sử dụng V3.0 (Mới)

### 12.1. Report Builder — Tạo báo cáo tùy chỉnh

**Truy cập**: `/#/report-builder`

**Các bước**:
1. Chọn preset: Daily Brief / Weekly Deep / YouTube Only
2. Bật/tắt các section muốn có trong báo cáo
3. Kéo thả để sắp xếp thứ tự section
4. Chọn kênh output cho từng section (Telegram/Email/Dashboard)
5. Chọn time range (1 ngày / 7 ngày / 30 ngày / tùy chỉnh)
6. Chọn nguồn dữ liệu (YouTube, RSS, API, Manual)
7. Chọn lịch chạy (Ngay / Hàng ngày / Hàng tuần / Tùy chỉnh)
8. Nhấn **Save Template** hoặc **Run Now**

**Ví dụ**: Tạo báo cáo tổng hợp thị trường tuần qua
- Preset: Weekly Deep
- Sections: Market Overview, Stock Analysis, YouTube Summary, News Digest, Risk Alert
- Output: Telegram (tất cả), Email (Market Overview + Stock Analysis)
- Time range: 7 ngày
- Sources: YouTube (29 kênh), RSS (CafeF, VietStock)
- Schedule: Hàng tuần, thứ 2 lúc 7:00

### 12.2. Data Collection — Quản lý nguồn dữ liệu

**Truy cập**: `/#/data-collection`

**Các nguồn**:
- **YouTube**: 29 kênh đã cấu hình, tự động thu thập subtitle
- **RSS**: CafeF, VietStock, VNExpress, Bloomberg...
- **API**: VNStock API, TradingView, các nguồn khác
- **Manual**: Nhập tay dữ liệu đặc biệt

**Thao tác**:
- Nhấn **Run** để chạy thu thập cho từng nguồn
- Xem progress bar và log real-time
- Nhấn **Stop** để dừng
- Nhấn **View Logs** để xem chi tiết

### 12.3. Chart Viewer — Xem đồ thị chỉ báo

**Truy cập**: `/#/charts`

**Các chỉ báo** (10 loại):
1. MA (Moving Average)
2. EMA (Exponential MA)
3. RSI (Relative Strength Index)
4. MACD (Moving Average Convergence Divergence)
5. Bollinger Bands
6. Ichimoku Cloud (9-17-26-26-26) — chuẩn
7. Ichimoku Cloud (65-129-5-2-2) — dài hạn
8. Volume MA
9. OBV (On-Balance Volume)
10. Stochastic

**Thao tác**:
- Chọn mã cổ phiếu (18 mã VN)
- Chọn timeframe (1 ngày / 1 tuần / 1 tháng)
- Bật/tắt chỉ báo từng loại
- Zoom, pan trên đồ thị

### 12.4. Audio Player — Nghe báo cáo

**Truy cập**: `/#/audio`

**Tính năng**:
- Phát báo cáo dạng audio (TTS)
- Tốc độ: 0.5x - 2x
- Tải xuống MP3
- Tự động phát khi có báo cáo mới

### 12.5. 3D Knowledge Graph — Mối liên hệ

**Truy cập**: `/#/graph-3d`

**Tính năng**:
- Xem mối liên hệ giữa cổ phiếu, chủ đề, kênh
- Zoom, pan, kéo thả
- Click để xem chi tiết
- Phát hiện cluster và influencer

---

## 13. Thông tin kỹ thuật

### Cấu trúc thư mục

```
E:\AI TONG HOP THONG TIN\app\
├── src/                          # Source code frontend (React)
│   ├── components/               # UI components
│   ├── services/api.ts           # API calls
│   └── pages/                    # Các trang (/modules, /workflow...)
├── local-backend/                # Backend (Node.js + Express)
│   ├── server.js                 # Main server file
│   ├── scripts/                  # Python scripts
│   │   ├── auto_start.py         # ⭐ Auto Start (1 lệnh)
│   │   ├── send_email.py         # Gmail SMTP
│   │   └── youtube_analyzer.py   # YouTube phân tích
│   └── data/                     # SQLite database
├── dist/                         # Frontend build (static files)
├── backup/                       # Backup source code
│   └── vnstock-ai-v2.0/          # ⚠️ KHÔNG XÓA
├── auto-start.bat                # ⭐ Chỉ 1 lệnh: Backend + Tunnel + Browser
├── push-all.bat                  # Script push tất cả kênh
└── HUONG_DAN_SU_DUNG.md          # File này
```

### Cổng (Ports)

| Dịch vụ | Port | Mô tả |
|---------|------|-------|
| Backend API | 3004 | Express server |
| Frontend dev | 5173 | Vite dev server (khi dev) |
| Tunnel | 3004 → 443 | Cloudflare tunnel |

### Tài khoản & Token

| Dịch vụ | Thông tin |
|---------|-----------|
| **Telegram Bot** | @HuuVangbot |
| **Bot Token** | `7055879874:AAE8PmCuPMMV7uyIiamDBNN5xZgWBctYIVc` |
| **Chat ID** | `6226786681` |
| **Gmail** | seeyeahall@gmail.com |
| **GitHub** | seeyeahall |
| **GitHub Pages** | https://seeyeahall.github.io/vnstock-ai/ |

### Node.js runtime

```
/c/Users/NHVANG/AppData/Local/Programs/kimi-desktop/resources/resources/runtime/node.exe
```

### Python runtime

```
C:\Users\NHVANG\AppData\Roaming\kimi-desktop\daimon-share\daimon\runtime\python\.venv\Scripts\python.exe
```

---

## 📞 Hỗ trợ

Nếu gặp lỗi không xử lý được:

1. Kiểm tra backend đang chạy: http://localhost:3004/api/health
2. Kiểm tra log trong cửa sổ chạy `node server.js`
3. Khôi phục từ backup: `backup/vnstock-ai-v2.0/`
4. Liên hệ: seeyeahall@gmail.com

---

## 📋 Quy tắc phát triển (dành cho chat mới)

> **QUAN TRỌNG - Phải tuân thủ khi fix code:**

1. **Trước khi sửa code lớn**: 
   - Backup toàn bộ `src/`, `local-backend/`, config files vào `backup/vnstock-ai-v2.0/`
   - Đảm bảo backup chứa code hoạt động tốt nhất

2. **Sau khi fix code**:
   - Cập nhật `MASTER_PROMPT.md` - thêm tính năng mới, thay đổi kiến trúc
   - Cập nhật `RESUME_PROMPT.md` - tóm tắt nhanh cho chat mới
   - Cập nhật `PROGRESS_ANALYSIS_v3.md` - ghi lại phân tích tối ưu V3
   - Cập nhật `HUONG_DAN_SU_DUNG.md` - hướng dẫn sử dụng mới
   - Cập nhật `docs/upgrade-v3/*.md` - thiết kế V3

3. **Không được xóa source code hẳn**:
   - Chỉ được thay thế file sau khi đã backup
   - Nếu cần xóa, di chuyển vào backup trước

4. **Git commit**:
   - Mỗi lần thay đổi phải commit với message rõ ràng
   - Push lên GitHub để bảo toàn lịch sử

---

**Cập nhật**: 2026-06-08  
**Phiên bản**: VNStock AI v3.0 (đã hoàn thành — 22/22 pha)  
**Tác giả**: seeyeahall
