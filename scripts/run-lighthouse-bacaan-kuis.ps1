param(
  [string]$Url = "http://localhost:3000/bacaan-kuis",
  [string]$Name = "current"
)

$ErrorActionPreference = "Stop"

$reportDir = Join-Path $PSScriptRoot "..\docs\reports"
New-Item -ItemType Directory -Force -Path $reportDir | Out-Null

$basePath = Join-Path $reportDir "lighthouse-bacaan-kuis-$Name"

npx lighthouse $Url `
  --output=html `
  --output=json `
  --output-path=$basePath `
  --chrome-flags="--headless=new --no-sandbox"

Write-Host "Lighthouse reports written to:"
Write-Host "$basePath.report.html"
Write-Host "$basePath.report.json"
