@echo off
REM Reverts the performance pass. Run from anywhere; paths are relative to this file.
cd /d "%~dp0.."
copy /Y "_perf_backup\ConciergeContext.tsx.bak" "contexts\ConciergeContext.tsx"
copy /Y "_perf_backup\AgentDock.tsx.bak" "components\v2\AgentDock.tsx"
copy /Y "_perf_backup\Hero.tsx.bak" "components\v2\Hero.tsx"
copy /Y "_perf_backup\next.config.ts.bak" "next.config.ts"
copy /Y "_perf_backup\public\*" "public\"
echo.
echo Reverted. Restart the dev server.
pause
