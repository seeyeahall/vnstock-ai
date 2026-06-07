@ECHO OFF
:: Auto-start script for VNStock AI v3.0
:: Starts backend server and frontend dev server

SET "NODE_DIR=C:\Users\NHVANG\AppData\Local\Programs\kimi-desktop\resources\resources\runtime"
SET "NPM_CMD=%NODE_DIR%\npm.cmd"
SET "NODE_EXE=%NODE_DIR%\node.exe"

ECHO [VNStock AI v3.0] Starting infrastructure...

:: Start backend
START "VNStock Backend" cmd /k "cd /d %~dp0local-backend && "%NODE_EXE%" server.js"

:: Start frontend dev server
START "VNStock Frontend" cmd /k "cd /d %~dp0 && "%NPM_CMD%" run dev"

ECHO [VNStock AI v3.0] Both services started.
ECHO   - Backend: http://localhost:3004
ECHO   - Frontend: http://localhost:5173  (or as shown by Vite)
