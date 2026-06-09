@echo off
:: VNStock AI v3.0 - Auto Start
:: File nay chi co 1 lenh: goi Python script
:: Toan bo logic nam trong auto_start.py

set "PYTHON=C:\Users\%USERNAME%\AppData\Local\Programs\Python\Python311\python.exe"
set "SCRIPT=%~dp0local-backend\scripts\auto_start.py"

if not exist "%PYTHON%" (
    echo [LOI] Khong tim thay Python: %PYTHON%
    echo Dang thu tim Python khac...
    for %%I in (python.exe) do set "PYTHON=%%~$PATH:I"
    if not exist "%PYTHON%" (
        echo [LOI] Khong tim thay Python. Vui long cai dat Python 3.11+
        pause
        exit /b 1
    )
)

if not exist "%SCRIPT%" (
    echo [LOI] Khong tim thay script: %SCRIPT%
    pause
    exit /b 1
)

echo [VNStock AI v3.0] Dang khoi dong...
echo [VNStock AI v3.0] Python: %PYTHON%
echo [VNStock AI v3.0] Script: %SCRIPT%
echo.

"%PYTHON%" "%SCRIPT%"

if %ERRORLEVEL% NEQ 0 (
    echo.
    echo [LOI] Khoi dong that bai. Xem loi tren.
    pause
)
