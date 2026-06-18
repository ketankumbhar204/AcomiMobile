param(
  [switch]$Launch
)

$ErrorActionPreference = 'Stop'
$root = Split-Path $PSScriptRoot -Parent
$apk = Join-Path $root 'android\app\build\outputs\apk\debug\app-debug.apk'

if (-not (Test-Path $apk)) {
  throw "Debug APK not found. Run: cd android; .\gradlew.bat assembleDebug"
}

& (Join-Path $PSScriptRoot 'android-wait-device.ps1')

$sdk = $env:ANDROID_HOME
if (-not $sdk) { $sdk = "$env:LOCALAPPDATA\Android\Sdk" }
$adb = Join-Path $sdk 'platform-tools\adb.exe'

$remote = '/data/local/tmp/countin-debug.apk'
& $adb push $apk $remote
$result = (& $adb shell pm install -r $remote 2>&1) -join ' '
if ($result -notmatch 'Success') {
  throw "Install failed: $result"
}

Write-Host 'Installed com.countin successfully.'

if ($Launch) {
  & $adb shell am start -n com.countin/.MainActivity | Out-Null
  Write-Host 'Launched com.countin/.MainActivity'
}
