@echo off
setlocal
cd /d "%~dp0"

REM Open backend in new window
start "backend" powershell -ExecutionPolicy Bypass -File ".\start_backend.ps1" -BackendRel "emotsioonid-backend"

REM Delay a bit and open frontend in new window
timeout /t 2 >nul
start "frontend" powershell -ExecutionPolicy Bypass -File ".\start_frontend.ps1" -FrontendRel "emotsioonid-frontend"

echo Both windows launched. You can close this console.
