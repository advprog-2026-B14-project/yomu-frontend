$backendPath = "c:\adpro\IdeaProjects\group\yomu-bacaan-dan-kuis"
$frontendPath = "c:\adpro\IdeaProjects\group\yomu-bacaan-dan-kuis-fe"

Write-Host "Starting backend in a new PowerShell window..." -ForegroundColor Cyan
Start-Process powershell -ArgumentList @(
  "-NoExit",
  "-Command",
  "Set-Location '$backendPath'; & '.\\gradlew.bat' -p '$backendPath' bootRun"
)

Write-Host "Starting frontend in current terminal..." -ForegroundColor Cyan
Set-Location $frontendPath
npm run dev
