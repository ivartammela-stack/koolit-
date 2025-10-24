@echo off
setlocal ENABLEEXTENSIONS
chcp 65001 >nul

REM === Emotsioonid: Start Backend & Frontend (2 windows) — Unicode-safe ===
REM Put this .bat in the project root (same folder that contains emotsioonid-backend and emotsioonid-frontend).

set "BASE=%~dp0"

REM --- BACKEND WINDOW ---
start "Emotsioonid Backend" cmd /k "pushd ""%BASE%emotsioonid-backend"" && call .venv\Scripts\activate && uvicorn app.main:app --reload"

REM --- FRONTEND WINDOW ---
start "Emotsioonid Frontend" cmd /k "pushd ""%BASE%emotsioonid-frontend"" && npm run dev"

echo.
echo Opened two windows (backend and frontend). If a window closes immediately, run the commands manually to see the error.
echo.
