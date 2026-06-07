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

**Đây là cách dễ nhất và được khuyên dùng.** File `.bat` chỉ có **3 dòng**, gọi Python để tự động làm hết:

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
VNStock AI v2.0 - AUTO START
Chi 1 lenh -> Backend + Tunnel + Webhook + Browser
============================================================

[1/5] Kiem tra backend...
    Backend chua chay. Dang khoi dong...
    Dang cho backend khoi dong... OK (mat 5s)

[2/5] Tao Cloudflare tunnel...
    Dang khoi dong tunnel...
    Dang cho URL tunnel... OK
    URL tu xa: https://abc123-def456.trycloudflare.com

[3/5] Cap nhat Telegram webhook...
    OK - Webhook da cap nhat
    https://abc123-def456.trycloudflare.com/api/telegram/webhook

[4/5] Mo trinh duyet...
    OK - Da mo: https://abc123-def456.trycloudflare.com

============================================================
APP DA SAN SANG!
============================================================

TRUY CAP TU XA (moi thiet bi):
    https://abc123-def456.trycloudflare.com

TRUY CAP LOCAL (may nay):
    http://localhost:3004

TELEGRAM BOT:
    @HuuVangbot

EMAIL:
    seeyeahall@gmail.com

GITHUB PAGES (chi giao dien):
    https://seeyeahall.github.io/vnstock-ai/

============================================================
LUU Y QUAN TRONG:
    - Giua cua so NAY mo de tunnel hoat dong
    - URL tunnel thay doi moi lan khoi dong lai
    - Nhan Ctrl+C de dung tunnel va thoat
    - Backend chay rieng, khong bi anh huong khi dung tunnel
============================================================

Dang giu tunnel hoat dong... (Ctrl+C de dung)
```

**Trình duyệt sẽ tự động mở** với URL từ xa. Bạn có thể:
- Truy cập trên máy tính này
- Truy cập trên điện thoại (nhập URL)
- Gửi URL cho người khác qua Zalo/Messenger

### ⚠️ Lưu ý

- **Giữ cửa sổ auto-start.bat mở**: Tunnel sẽ tắt nếu đóng cửa sổ
- **URL thay đổi mỗi lần**: Mỗi lần chạy lại `auto-start.bat` sẽ có URL mới
- **Backend tự khởi động**: Nếu backend chưa chạy, script tự động khởi động
- **Không cần làm gì thêm**: Tất cả đã tự động

### File .bat có gì?

File `auto-start.bat` **chỉ có 15 dòng** - cực kỳ đơn giản:

```batch
@echo off
set PYTHON_EXE=C:\Users\NHVANG\AppData\Roaming\kimi-desktop\daimon-share\daimon\runtime\python\.venv\Scripts\python.exe
set SCRIPT=E:\AI TONG HOP THONG TIN\app\local-backend\scripts\auto_start.py

if not exist "%PYTHON_EXE%" (
    echo [LOI] Khong tim thay Python: %PYTHON_EXE%
    pause
    exit /b 1
)

if not exist "%SCRIPT%" (
    echo [LOI] Khong tim thay script: %SCRIPT%
    pause
    exit /b 1
)

"%PYTHON_EXE%" "%SCRIPT%"
pause
```

- Dòng 1: Tắt echo
- Dòng 2: Gọi Python chạy script `auto_start.py`
- Dòng 3: Đợi người dùng nhấn phím trước khi đóng cửa sổ

**Toàn bộ logic nằm trong file Python** `local-backend/scripts/auto_start.py`:
- Kiểm tra backend đang chạy chưa
- Khởi động backend nếu chưa chạy (mở cửa sổ mới)
- Kiểm tra cloudflared đã cài chưa
- Tạo Cloudflare tunnel và lấy URL
- Cập nhật Telegram webhook
- Mở trình duyệt tự động
- Hiển thị tóm tắt tất cả kênh truy cập
- Giữ tunnel chạy cho đến khi người dùng nhấn Ctrl+C

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

## 11. Thông tin kỹ thuật

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
   - Cập nhật `PROGRESS_ANALYSIS_v2.md` - ghi lại phân tích tối ưu
   - Cập nhật `HUONG_DAN_SU_DUNG.md` - hướng dẫn sử dụng mới

3. **Không được xóa source code hẳn**:
   - Chỉ được thay thế file sau khi đã backup
   - Nếu cần xóa, di chuyển vào backup trước

4. **Git commit**:
   - Mỗi lần thay đổi phải commit với message rõ ràng
   - Push lên GitHub để bảo toàn lịch sử

---

**Cập nhật**: 2026-06-07  
**Phiên bản**: VNStock AI v2.0  
**Tác giả**: seeyeahall
