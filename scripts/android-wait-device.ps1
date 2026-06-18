param(
  [int]$TimeoutSeconds = 900
)

$ErrorActionPreference = 'Continue'
$sdk = $env:ANDROID_HOME
if (-not $sdk) {
  $sdk = $env:ANDROID_SDK_ROOT
}
if (-not $sdk) {
  $sdk = "$env:LOCALAPPDATA\Android\Sdk"
}

$adb = Join-Path $sdk 'platform-tools\adb.exe'
if (-not (Test-Path $adb)) {
  throw "adb not found at $adb"
}

$deadline = (Get-Date).AddSeconds($TimeoutSeconds)
$deviceSeen = $false

while ((Get-Date) -lt $deadline) {
  $devices = & $adb devices 2>&1
  if ($devices -match 'emulator-\d+\s+device') {
    $deviceSeen = $true
    break
  }
  Write-Host 'Waiting for emulator device...'
  Start-Sleep -Seconds 5
}

if (-not $deviceSeen) {
  throw "No emulator device found after $TimeoutSeconds seconds."
}

while ((Get-Date) -lt $deadline) {
  $boot = (& $adb shell getprop sys.boot_completed 2>$null)
  if ($boot) {
    $boot = $boot.Trim()
  }

  if ($boot -eq '1') {
    $packageProbe = (& $adb shell cmd package list packages 2>&1 | Select-Object -First 1)
    if ($packageProbe -and ($packageProbe -notmatch 'error|Can.t find service')) {
      Write-Host 'Android device ready (boot_completed=1).'
      exit 0
    }
  }

  Write-Host "Waiting for Android boot... boot_completed=$boot"
  Start-Sleep -Seconds 5
}

throw "Timed out waiting for Android device after $TimeoutSeconds seconds."
