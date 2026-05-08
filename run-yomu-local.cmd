@echo off
set BACKEND_PATH=c:\adpro\IdeaProjects\group\yomu-bacaan-dan-kuis
set FRONTEND_PATH=c:\adpro\IdeaProjects\group\yomu-bacaan-dan-kuis-fe

echo Starting backend in a new window...
start "Yomu Backend" powershell -NoExit -Command "Set-Location '%BACKEND_PATH%'; & '.\gradlew.bat' -p '%BACKEND_PATH%' bootRun"

echo Starting frontend in current terminal...
cd /d "%FRONTEND_PATH%"
npm run dev
