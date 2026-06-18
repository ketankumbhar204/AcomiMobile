param(
  [string]$AvdName = 'Pixel_8'
)

$ErrorActionPreference = 'Stop'
$sdk = $env:ANDROID_HOME
if (-not $sdk) { $sdk = "$env:LOCALAPPDATA\Android\Sdk" }

$adb = Join-Path $sdk 'platform-tools\adb.exe'
$emulator = Join-Path $sdk 'emulator\emulator.exe'

Write-Host "Stopping emulator and ADB..."
& $adb kill-server 2>$null | Out-Null
Get-Process emulator,qemu-system* -ErrorAction SilentlyContinue | Stop-Process -Force -ErrorAction SilentlyContinue
Start-Sleep -Seconds 3
& $adb start-server | Out-Null

Write-Host "Starting $AvdName with wiped data..."
Start-Process -FilePath $emulator -ArgumentList @('-avd', $AvdName, '-wipe-data', '-no-snapshot-save') -WindowStyle Normal

& (Join-Path $PSScriptRoot 'android-wait-device.ps1')
Write-Host "Emulator $AvdName is ready."
