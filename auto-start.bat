@ECHO OFF
:: Auto-start script for VNStock AI v3.0
:: Starts backend server and frontend dev server
:: Kills existing Node.js processes first to avoid port conflicts
:: Includes error handling and path validation

SETLOCAL EnableDelayedExpansion

:: Find Node.js automatically
SET "NODE_DIR="
SET "NODE_EXE="
SET "NPM_CMD="

:: Check common Node.js locations
FOR %%P IN (
    "C:\Users\%USERNAME%\AppData\Local\Programs\kimi-desktop\resources\resources\runtime"
    "C:\Program Files\nodejs"
    "C:\Program Files (x86)\nodejs"
    "C:\Users\%USERNAME%\AppData\Roaming\kimi-desktop\daimon-bundle\runtime"
) DO (
    IF EXIST "%%~P\node.exe" (
        SET "NODE_DIR=%%~P"
        SET "NODE_EXE=%%~P\node.exe"
        SET "NPM_CMD=%%~P\npm.cmd"
        GOTO :FOUND_NODE
    )
)

:: Try to find node in PATH
FOR %%I IN (node.exe) DO (
    SET "NODE_EXE=%%~$PATH:I"
    IF NOT "!NODE_EXE!"=="" (
        SET "NODE_DIR=%%~dpI"
        SET "NODE_EXE=%%~$PATH:I"
        FOR %%J IN (npm.cmd) DO SET "NPM_CMD=%%~$PATH:J"
        GOTO :FOUND_NODE
    )
)

:NODE_NOT_FOUND
ECHO [ERROR] Node.js not found! Please install Node.js or set NODE_DIR manually.
ECHO.
ECHO Searched locations:
ECHO   - C:\Users\%USERNAME%\AppData\Local\Programs\kimi-desktop\resources\resources\runtime
ECHO   - C:\Program Files\nodejs
ECHO   - C:\Program Files (x86)\nodejs
ECHO   - PATH environment variable
ECHO.
ECHO To fix: Set NODE_DIR environment variable to your Node.js installation path.
PAUSE
EXIT /B 1

:FOUND_NODE
ECHO [VNStock AI v3.0] Node.js found at: %NODE_EXE%

:: Validate paths
IF NOT EXIST "%NODE_EXE%" (
    ECHO [ERROR] node.exe not found at: %NODE_EXE%
    GOTO :NODE_NOT_FOUND
)
IF NOT EXIST "%NPM_CMD%" (
    ECHO [WARNING] npm.cmd not found at: %NPM_CMD%, trying npm.exe...
    SET "NPM_CMD=%NODE_DIR%\npm.exe"
    IF NOT EXIST "%NPM_CMD%" (
        ECHO [ERROR] npm not found. Cannot start frontend dev server.
        PAUSE
        EXIT /B 1
    )
)

:: Check if backend exists
SET "BACKEND_DIR=%~dp0local-backend"
SET "BACKEND_JS=%BACKEND_DIR%\server.js"
IF NOT EXIST "%BACKEND_JS%" (
    ECHO [ERROR] Backend not found: %BACKEND_JS%
    ECHO Please ensure local-backend\server.js exists.
    PAUSE
    EXIT /B 1
)

ECHO [VNStock AI v3.0] Killing existing Node.js processes...
taskkill /F /IM node.exe 2>nul
timeout /t 2 /nobreak >nul

:: Verify port 3004 is free
ECHO [VNStock AI v3.0] Checking port 3004...
netstat -ano | findstr :3004 >nul
IF %ERRORLEVEL% EQU 0 (
    ECHO [WARNING] Port 3004 is still in use. Waiting...
    timeout /t 3 /nobreak >nul
    netstat -ano | findstr :3004 >nul
    IF %ERRORLEVEL% EQU 0 (
        ECHO [ERROR] Port 3004 is still occupied. Please close the application using it.
        PAUSE
        EXIT /B 1
    )
)

ECHO [VNStock AI v3.0] Starting infrastructure...

:: Start backend
START "VNStock Backend" cmd /k "cd /d %BACKEND_DIR% && "%NODE_EXE%" server.js"

:: Wait for backend to start
ECHO [VNStock AI v3.0] Waiting for backend to start...
timeout /t 3 /nobreak >nul

:: Test backend health
ECHO [VNStock AI v3.0] Testing backend health...
curl -s http://localhost:3004/api/health >nul 2>&1
IF %ERRORLEVEL% NEQ 0 (
    ECHO [WARNING] Backend health check failed. It may still be starting...
) ELSE (
    ECHO [VNStock AI v3.0] Backend is responding!
)

:: Start frontend dev server
START "VNStock Frontend" cmd /k "cd /d %~dp0 && "%NPM_CMD%" run dev"

:: Start Cloudflare tunnel (if available)
SET "TUNNEL_EXE=%~dp0local-backend\cloudflared.exe"
IF EXIST "%TUNNEL_EXE%" (
    ECHO [VNStock AI v3.0] Starting Cloudflare tunnel...
    START "VNStock Tunnel" cmd /k "cd /d %~dp0local-backend && "%TUNNEL_EXE%" tunnel --url http://localhost:3004"
    ECHO [VNStock AI v3.0] Tunnel starting... URL will appear in tunnel window.
) ELSE (
    ECHO [VNStock AI v3.0] cloudflared.exe not found. Tunnel skipped.
    ECHO   Download from: https://github.com/cloudflare/cloudflared/releases
)

ECHO.
ECHO [VNStock AI v3.0] Services started.
ECHO   - Backend API:  http://localhost:3004
ECHO   - Frontend Dev: http://localhost:5173
ECHO   - Tunnel:       Check tunnel window for public URL
ECHO.
ECHO Press any key to open browser...
PAUSE >nul

:: Open browser to frontend dev server
START http://localhost:5173

ENDLOCAL
