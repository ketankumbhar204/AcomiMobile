# Android `walkDebug` variant (stay walkthrough)

## Purpose

Device walkthroughs A-00–A-20 must hit the **local walk backend** (`acomi_stay_walk_*` on port 8080), not production (`https://api.acomi.in`).

| Variant | Application id | JS loading | API host |
|---|---|---|---|
| `standardDebug` | `com.acomi` | Metro (unchanged) | `__DEV__` → local / Render develop |
| `walkDebug` | `com.acomi` (versionName `*-walk`) | **Embedded bundle** (no Metro) | BuildConfig local host (default `http://10.0.2.2:8080`) |
| `standardRelease` | `com.acomi` | Embedded | **Production** `https://api.acomi.in` |

`walkDebug` keeps `applicationId com.acomi` so `google-services.json` matches. Uninstall any prior install before switching variants (`adb uninstall com.acomi`).

`walkDebug` is omitted from `react.debuggableVariants` so Gradle embeds the JS bundle. That avoids Metro ANRs on constrained hosts while keeping release production hosts unchanged.

## Build and install (emulator)

```powershell
$env:GRADLE_USER_HOME = 'K:\ACOMI-Work\gradle-home'
$env:JAVA_HOME = 'C:\Program Files\Android\Android Studio\jbr'
cd K:\AcomiMobile\android
.\gradlew.bat assembleWalkDebug -PreactNativeArchitectures=x86_64
adb install -r app\build\outputs\apk\walk\debug\app-walk-debug.apk
adb shell am start -n com.acomi.walk/com.acomi.MainActivity
```

## Physical device

Do **not** hardcode a developer LAN IP in source. Pass Gradle properties:

```powershell
.\gradlew.bat assembleWalkDebug `
  -PacomiLocalApiHost=192.168.1.10 `
  -PacomiLocalApiPort=8080
```

Ensure the backend listens on `0.0.0.0:8080` and the device can reach that host.

## Safety

- Release / Play uploads continue to use `assembleStandardRelease` / `bundleStandardRelease` (or the historical `assembleRelease` task name if aliased — prefer explicit `StandardRelease`).
- Cleartext HTTP is enabled only for the `walk` flavor (and `standardDebug` for Metro local).
- Do not upload `walk*` artifacts to Play.
