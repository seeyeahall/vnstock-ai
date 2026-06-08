@ECHO OFF
:: VNStock AI v3.0 — Push All
:: Tự động hóa toàn bộ: Build → Backend → Tunnel → GitHub Pages → Webhook → Browser → Test
:: Chỉ 1 lệnh: double-click file này
:: Includes error handling, path validation, and backup

SETLOCAL EnableDelayedExpansion

:: Find Python automatically
SET "PYTHON="

:: Check common Python locations
FOR %%P IN (
    "C:\Users\%USERNAME%\AppData\Roaming\kimi-desktop\daimon-share\daimon\runtime\python\.venv\Scripts\python.exe"
    "C:\Users\%USERNAME%\AppData\Local\Programs\Python\Python311\python.exe"
    "C:\Users\%USERNAME%\AppData\Local\Programs\Python\Python310\python.exe"
    "C:\Program Files\Python311\python.exe"
    "C:\Program Files\Python310\python.exe"
    "C:\Windows\py.exe"
) DO (
    IF EXIST "%%~P" (
        SET "PYTHON=%%~P"
        GOTO :FOUND_PYTHON
    )
)

:: Try to find python in PATH
FOR %%I IN (python.exe) DO (
    SET "PYTHON=%%~$PATH:I"
    IF NOT "!PYTHON!"=="" GOTO :FOUND_PYTHON
)

FOR %%I IN (py.exe) DO (
    SET "PYTHON=%%~$PATH:I"
    IF NOT "!PYTHON!"=="" GOTO :FOUND_PYTHON
)

:PYTHON_NOT_FOUND
ECHO [ERROR] Python not found! Please install Python or set PYTHON environment variable.
ECHO.
ECHO Searched locations:
ECHO   - C:\Users\%USERNAME%\AppData\Roaming\kimi-desktop\daimon-share\daimon\runtime\python\.venv\Scripts\python.exe
ECHO   - C:\Users\%USERNAME%\AppData\Local\Programs\Python\Python311\python.exe
ECHO   - C:\Program Files\Python311\python.exe
ECHO   - C:\Windows\py.exe
ECHO   - PATH environment variable
ECHO.
ECHO To fix: Set PYTHON environment variable to your Python executable path.
PAUSE
EXIT /B 1

:FOUND_PYTHON
ECHO [VNStock AI v3.0] Python found at: %PYTHON%

:: Validate script exists
SET "SCRIPT=%~dp0local-backend\scripts\push_all.py"
IF NOT EXIST "%SCRIPT%" (
    ECHO [ERROR] Push All script not found: %SCRIPT%
    ECHO Please ensure local-backend\scripts\push_all.py exists.
    PAUSE
    EXIT /B 1
)

ECHO [VNStock AI v3.0] Push All — Đang khởi động...
ECHO.

:: Create backup before running
ECHO [VNStock AI v3.0] Creating backup...
SET "BACKUP_DIR=%~dp0backup\pre-push-%date:~-4,4%%date:~-10,2%%date:~-7,2%-%time:~0,2%%time:~3,2%%time:~6,2%"
SET "BACKUP_DIR=%BACKUP_DIR: =0%"
mkdir "%BACKUP_DIR%" 2>nul
xcopy /E /I /Y "%~dp0src" "%BACKUP_DIR%\src" >nul 2>&1
xcopy /E /I /Y "%~dp0local-backend" "%BACKUP_DIR%\local-backend" >nul 2>&1
xcopy /Y "%~dp0*.md" "%BACKUP_DIR%\" >nul 2>&1
xcopy /Y "%~dp0*.json" "%BACKUP_DIR%\" >nul 2>&1
ECHO [VNStock AI v3.0] Backup created at: %BACKUP_DIR%
ECHO.

:: Run the script
"%PYTHON%" "%SCRIPT%"

IF %ERRORLEVEL% NEQ 0 (
  ECHO [ERROR] Push All failed with code %ERRORLEVEL%.
  ECHO.
  ECHO [VNStock AI v3.0] Backup is available at: %BACKUP_DIR%
  PAUSE
  EXIT /B %ERRORLEVEL%
)

ECHO.
ECHO [VNStock AI v3.0] Push All completed successfully!
ECHO [VNStock AI v3.0] Backup available at: %BACKUP_DIR%
PAUSE

ENDLOCAL
