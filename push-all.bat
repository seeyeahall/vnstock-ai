@ECHO OFF
:: Build & Deploy script for VNStock AI v3.0
:: Builds frontend and copies dist/ to gh-pages branch

SET "NODE_DIR=C:\Users\NHVANG\AppData\Local\Programs\kimi-desktop\resources\resources\runtime"
SET "NPM_CMD=%NODE_DIR%\npm.cmd"

ECHO [VNStock AI v3.0] Building frontend for production...

"%NPM_CMD%" run build
IF %ERRORLEVEL% NEQ 0 (
  ECHO [ERROR] Build failed.
  EXIT /B 1
)

ECHO [VNStock AI v3.0] Build complete. dist/ folder is ready.
ECHO Next steps:
ECHO   1. Copy dist/* to gh-pages branch
ECHO   2. Commit and push to deploy
