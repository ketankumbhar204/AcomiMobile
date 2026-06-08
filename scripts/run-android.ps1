# Low-memory friendly Android dev build helper for Windows.
# Usage: .\scripts\run-android.ps1

$ErrorActionPreference = "Stop"
$projectRoot = Split-Path -Parent $PSScriptRoot

Write-Host "Stopping Gradle daemons..."
Push-Location "$projectRoot\android"
& .\gradlew.bat --stop 2>$null
Pop-Location

Write-Host "Freeing Metro port 8081 if occupied..."
$portPid = (Get-NetTCPConnection -LocalPort 8081 -ErrorAction SilentlyContinue |
  Select-Object -ExpandProperty OwningProcess -Unique)
if ($portPid) {
  $portPid | ForEach-Object {
    Stop-Process -Id $_ -Force -ErrorAction SilentlyContinue
  }
  Start-Sleep -Seconds 2
}

Write-Host "Starting Android build..."
Push-Location $projectRoot
& npx react-native run-android --port 8081
Pop-Location
