@echo off
echo ================================================
echo  CyberSentinel AI - Backend Server
echo ================================================
echo.
echo Backend will run on: http://localhost:8000
echo API health check:    http://localhost:8000/api/health
echo.

cd /d "%~dp0"

echo Checking Python...
py --version 2>nul
if %ERRORLEVEL% neq 0 (
    echo ERROR: Python not found! Install Python 3.11+ from python.org
    pause
    exit /b 1
)

echo.
echo Installing/verifying dependencies...
py -m pip install -r features_extractor/requirements.txt -q

echo.
echo Starting server...
py backend/main.py
pause
