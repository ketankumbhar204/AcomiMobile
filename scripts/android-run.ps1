param(
  [switch]$SkipBuild
)

$ErrorActionPreference = 'Stop'
$root = Split-Path $PSScriptRoot -Parent
Set-Location $root

& (Join-Path $PSScriptRoot 'android-wait-device.ps1')

if (-not $SkipBuild) {
  Write-Host 'Building debug APK...'
  Set-Location (Join-Path $root 'android')
  .\gradlew.bat assembleDebug
  Set-Location $root
}

& (Join-Path $PSScriptRoot 'android-install.ps1') -Launch

$sdk = $env:ANDROID_HOME
if (-not $sdk) { $sdk = "$env:LOCALAPPDATA\Android\Sdk" }
$adb = Join-Path $sdk 'platform-tools\adb.exe'
& $adb reverse tcp:8081 tcp:8081 2>$null | Out-Null
Write-Host 'Done. Start Metro with: npm start'
