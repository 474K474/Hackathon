@echo off
chcp 65001 >nul
cd /d "%~dp0"
if not exist node_modules\vite (
  echo Installing dependencies...
  call npm install
)
echo Starting RiskScore dev server...
call npm run dev -- --port 5173 --open
pause
