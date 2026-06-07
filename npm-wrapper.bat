@ECHO OFF
:: NPM Wrapper for VNStock AI v3.0
:: Uses absolute path to Kimi Desktop bundled Node/npm
:: because npm is not in the system PATH.

SET "NODE_DIR=C:\Users\NHVANG\AppData\Local\Programs\kimi-desktop\resources\resources\runtime"
SET "NPM_CMD=%NODE_DIR%\npm.cmd"

IF NOT EXIST "%NPM_CMD%" (
  ECHO [ERROR] npm.cmd not found at %NPM_CMD%
  EXIT /B 1
)

"%NPM_CMD%" %*
