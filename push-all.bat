@ECHO OFF
:: VNStock AI v3.0 — Push All
:: Tự động hóa toàn bộ: Build → Backend → Tunnel → GitHub Pages → Webhook → Browser → Test
:: Chỉ 1 lệnh: double-click file này

SET "PYTHON=C:\Users\NHVANG\AppData\Roaming\kimi-desktop\daimon-share\daimon\runtime\python\.venv\Scripts\python.exe"
SET "SCRIPT=E:\AI TONG HOP THONG TIN\app\local-backend\scripts\push_all.py"

ECHO [VNStock AI v3.0] Push All — Đang khởi động...
ECHO.

"%PYTHON%" "%SCRIPT%"

IF %ERRORLEVEL% NEQ 0 (
  ECHO [ERROR] Push All failed with code %ERRORLEVEL%.
  PAUSE
  EXIT /B %ERRORLEVEL%
)

PAUSE
