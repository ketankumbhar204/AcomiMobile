# ACOMI — Mobile & Backend Deployment Inventory

**Document type:** Engineering handoff (audit / information-gathering)  
**Date:** 2026-08-16  
**Scope:** Android production publishing, Mobile → production Backend integration, and facts needed for a later AWS Backend deployment document  
**Method:** Repository, Git, and existing documentation only. No source, Gradle, keystore, AWS, Render, DNS, or Git mutations were made while producing this file.

**Classification labels**

| Label | Meaning |
|-------|---------|
| **VERIFIED** | Confirmed from files, Git, or this workspace inspection |
| **NOT VERIFIED** | Not present or not inspectable from this environment |
| **REQUIRED ACTION** | Must be done before the named milestone |
| **WARNING** | Risk or mismatch; do not ignore |
| **BLOCKER** | Prevents Android AAB / public auth / safe production use |
| **HISTORICAL** | Past name, path, or host; not current product identity |
| **RECOMMENDATION** | Suggested next step; not an implemented fact |

---

## 0. Executive summary

ACOMI Mobile is a React Native 0.85.3 app (`applicationId` `com.acomi`, version `1.0` / `1`). Release API in **source** is compile-time via `__DEV__` and is **`https://api.acomi.app/api/v1`**. Debug API is **`https://acomibackend.onrender.com/api/v1`**.

The Backend is Spring Boot 3.5.14 / Java 17, Dockerized, env-driven `prod` profile, PostgreSQL + Flyway. **No AWS compute, IAM, or networking is defined in the Backend repository.** Current production compute documented and previously HTTP-tested is **Render** (`https://api.acomi.in`, `https://acomi.onrender.com`). Web production builds (including `aws-production` commit `3feecf7`) use **`https://api.acomi.in/api/v1`**.

**Critical mismatch (WARNING / BLOCKER for store release):** Android **release** will call `https://api.acomi.app/api/v1`. Web and the live custom domain use `https://api.acomi.in`. `api.acomi.app` was previously NXDOMAIN in HTTP/DNS checks (2026-08-14). Do not ship an AAB until release API matches the actually deployed Backend.

**Android signing BLOCKER:** Release signing is wired in Gradle (uncommitted `android/app/build.gradle`) but `android/keystore.properties` and a release keystore file are **absent**. `assembleRelease` / `bundleRelease` are designed to fail without them. No keystore was created in this audit.

---

## Part 1 — Mobile project inventory

### 1.1 Application identity

| Item | Value | Class |
|------|--------|--------|
| Display name | `ACOMI` (`app.json` `displayName`; Android `strings.xml`; iOS `CFBundleDisplayName`) | VERIFIED |
| npm package name | `acomi` (`package.json`) | VERIFIED |
| RN project name | `Acomi` (`app.json` `name`; `settings.gradle` `rootProject.name`) | VERIFIED |
| Android `applicationId` | `com.acomi` | VERIFIED |
| Android `namespace` | `com.acomi` | VERIFIED |
| iOS bundle ID | `com.acomi` (`PRODUCT_BUNDLE_IDENTIFIER`) | VERIFIED |
| Android `versionName` | `1.0` | VERIFIED |
| Android `versionCode` | `1` | VERIFIED |
| iOS `MARKETING_VERSION` | `1.0` | VERIFIED |
| iOS `CURRENT_PROJECT_VERSION` | `1` | VERIFIED |
| React Native | `0.85.3` | VERIFIED |
| React | `19.2.3` | VERIFIED |
| TypeScript | `^5.8.3` | VERIFIED |
| Node | `>= 22.11.0` (`package.json` `engines`) | VERIFIED |
| Package manager | npm (`package-lock.json` present; no `yarn.lock`) | VERIFIED |
| Java/JDK | Not pinned in repo. RN 0.85 typically requires JDK 17. A local crash log references Adoptium 17.0.18 — **machine evidence only**, not a project contract | NOT VERIFIED (project pin) / HISTORICAL (crash log) |
| Android Gradle Plugin | Not version-pinned in `android/build.gradle` (`classpath("com.android.tools.build:gradle")`). Version comes from the React Native Gradle Plugin | NOT VERIFIED (exact AGP number) |
| Gradle wrapper | `9.3.1` (`gradle-wrapper.properties`) | VERIFIED |
| `compileSdk` | 36 | VERIFIED |
| `targetSdk` | 36 | VERIFIED |
| `minSdk` | 24 | VERIFIED |
| `buildTools` | 36.0.0 | VERIFIED |
| NDK | 27.1.12297006 | VERIFIED |
| Kotlin | 2.1.20 | VERIFIED |
| Hermes | `hermesEnabled=true` | VERIFIED |
| New Architecture | `newArchEnabled=true` | VERIFIED |

### 1.2 Git (Mobile `K:\AcomiMobile`)

Inspected 2026-08-16. **No checkout, commit, or stash.**

| Item | Value | Class |
|------|--------|--------|
| Current branch | `develop` | VERIFIED |
| HEAD | `d931db0d9614d7440ad52e4bd687a2ffacaa1120` — `refactor: rename application from Amico to ACOMI` | VERIFIED |
| `origin` | `https://github.com/ketankumbhar204/AmicoMobile.git` (GitHub redirects to `AcomiMobile`) | VERIFIED / HISTORICAL remote name |
| `origin/develop` | `d931db0` | VERIFIED |
| `origin/production` | `d931db0` | VERIFIED |
| `origin/aws-production` | `d931db0` | VERIFIED |
| `origin/main` | `e02095c` — CountIn→Amico rename (**HISTORICAL**, not the release branch) | VERIFIED |
| Working tree | Dirty (see below) | VERIFIED |
| Staged files | None | VERIFIED |

**Uncommitted (preserve; do not discard):**

| Path | Status |
|------|--------|
| `.gitignore` | Modified |
| `.tmp-openapi.json` | Modified (noise; do not treat as release artifact) |
| `android/app/build.gradle` | Modified (release signing, no debug fallback) |
| `android/gradle.properties` | Modified (`reactNativeArchitectures=arm64-v8a,x86_64`) |
| `android/hs_err_pid17620.log` | Modified (crash log; **HISTORICAL**) |
| `docs/DEVELOPMENT_DEPLOYMENT_GUIDE.md` | Modified |
| `android/keystore.properties.example` | Untracked |
| `docs/ACOMI_WORKSPACE_REPOSITORY_AUDIT.md` | Untracked |
| `docs/PRODUCTION_INFRASTRUCTURE_PLAN.md` | Untracked |
| `docs/ACOMI_MOBILE_BACKEND_DEPLOYMENT_INVENTORY.md` | This file (created by this audit) |

**Recent commits relevant to identity/release:**

1. `d931db0` — ACOMI rename (current `develop` / `production` / `aws-production`)  
2. `e02095c` — CountIn→Amico (**HISTORICAL** `main`)

### 1.3 Production API configuration (Mobile)

**Source of truth:** `src/config/env.ts`. Axios `baseURL` is `env.apiBaseUrl` in `src/api/client.ts`.

| Build | Host selection | Full API base | Class |
|-------|----------------|---------------|--------|
| Debug (`__DEV__ === true`) | `USE_LOCAL_DEV_BACKEND` is `false` → `RENDER_DEV_API_HOST` | `https://acomibackend.onrender.com/api/v1` | VERIFIED |
| Release (`__DEV__ === false`) | `API_HOSTS.production` | `https://api.acomi.app/api/v1` | VERIFIED |
| Staging map (not selected by `__DEV__`) | `API_HOSTS.staging` | `https://staging-api.acomi.app/api/v1` | VERIFIED (unused by current `__DEV__` switch) |

| Question | Answer | Class |
|----------|--------|--------|
| Compile-time vs runtime? | Compile-time. Metro/`__DEV__` bakes the host. No `.env` API override in Mobile | VERIFIED |
| `__DEV__` controls selection? | Yes: debug → development host; release → production host | VERIFIED |
| `localhost` in source? | Yes, only when `USE_LOCAL_DEV_BACKEND=true` (currently `false`) | VERIFIED |
| `10.0.2.2` in source? | Yes, emulator path under the same unused local-dev flag | VERIFIED |
| DEV Render URL? | `https://acomibackend.onrender.com` | VERIFIED |
| Production AWS API URL in Mobile source? | **No** | VERIFIED |
| `api.acomi.app` in source? | **Yes** — this **is** the release host | VERIFIED |
| `api.acomi.in` in Mobile source? | **No** | VERIFIED |
| Amico/CountIn/Residine API hosts in `env.ts`? | No current product hosts; folder rename leftovers exist in a crash log | VERIFIED / HISTORICAL |

**Release API URL to report (do not substitute):**  
`https://api.acomi.app/api/v1`

No Mobile `.env` files were found that override this.

### 1.4 Android release configuration

Inspected: `android/app/build.gradle` (working tree), `android/build.gradle`, `android/gradle.properties` (working tree), `AndroidManifest.xml`, `settings.gradle`, `gradle-wrapper.properties`, `proguard-rules.pro`, `keystore.properties.example`.

| Item | Value | Class |
|------|--------|--------|
| Release signing block | Present; loads `android/keystore.properties` | VERIFIED (working tree) |
| Debug fallback for release | **Removed** — missing properties → GradleException on `assembleRelease`/`bundleRelease` | VERIFIED (working tree) |
| `keystore.properties` | **Absent** | VERIFIED |
| Release keystore file | **Absent** (no `.jks`/`.keystore` except possibly debug; scan found none) | VERIFIED |
| `keystore.properties.example` | Present, untracked; example `storeFile=app/acomi-upload.keystore` | VERIFIED |
| Debug signing | `debug.keystore` / `android` / `androiddebugkey` (standard RN) | VERIFIED (config) |
| `minifyEnabled` (release) | `false` (`enableProguardInReleaseBuilds = false`) | VERIFIED |
| `shrinkResources` | Not set | VERIFIED |
| ProGuard files | Default + empty `proguard-rules.pro` (unused while minify is false) | VERIFIED |
| `reactNativeArchitectures` | `arm64-v8a,x86_64` | VERIFIED (working tree) |
| armeabi-v7a | Omitted (comment: first Play release 64-bit) | VERIFIED |
| Release AAB ABIs | **Would include `arm64-v8a` and `x86_64`** unless overridden with `-PreactNativeArchitectures=arm64-v8a` | VERIFIED (property) / NOT VERIFIED (no AAB built) |
| Play suitability | Identity and 64-bit ABI are OK; **signing missing**; `versionCode` still `1` | WARNING / BLOCKER (signing) |
| `INTERNET` permission | Yes | VERIFIED |
| Media/storage permissions | `READ_MEDIA_IMAGES`; `READ_EXTERNAL_STORAGE` maxSdk 32 | VERIFIED |
| Deep links / custom URL schemes | Launcher intent only; no app-link / custom scheme | VERIFIED |
| `usesCleartextTraffic` | `${usesCleartextTraffic}` (RN placeholder; typically debug-only cleartext) | NOT VERIFIED (resolved value per variant) |
| `allowBackup` | `false` | VERIFIED |

**Google Play readiness:** configuration is **not** complete. Missing upload keystore + `keystore.properties` is a **BLOCKER**. No Play Console listing was inspected (**NOT VERIFIED**).

### 1.5 Generated / cache problems (Amico folder rename)

Search of tracked Android Gradle/XML/TS for `K:\AmicoMobile` / `K:\AmicoWeb` / `K:\Projects\Amico`: **no matches**.

`android/hs_err_pid17620.log` (**HISTORICAL**, uncommitted) contains Gradle cache workers and `PATH` entries under **`K:\Amico\...`** (not `K:\AmicoMobile`). That is leftover JVM crash output from the pre-rename folder.

| Item | Class |
|------|--------|
| Stale `K:\Amico` paths in a crash log | HISTORICAL / WARNING |
| Whether a clean Gradle/autolinking rebuild is required | NOT VERIFIED in this audit (no build executed). Prior sessions reported generated autolinking still pointing at the old path — treat as **WARNING** before the first release compile |

**RECOMMENDATION:** After an approved keystore exists, run a clean Android compile from `K:\AcomiMobile` and confirm no `Amico` path remains in build output. Do not auto-delete caches unless the user approves.

### 1.6 Android / RN dependencies

From `package.json` (no Firebase / Google Services / Maps packages):

| Area | Present? | Class |
|------|----------|--------|
| Firebase / `google-services.json` | **No** | VERIFIED |
| Push notifications | **No** dedicated FCM/APNs library | VERIFIED |
| Maps | **No** | VERIFIED |
| Auth | App-level OTP via Backend JWT (Axios); no Google/Apple Sign-In libs | VERIFIED |
| Native modules | async-storage, blur, gesture-handler, image-picker, localize, reanimated, screens, safe-area, svg, worklets | VERIFIED |
| Release-specific native config | Image picker + storage permissions only | VERIFIED |

### 1.7 Build commands

**VERIFIED** scripts in `package.json` / `scripts/`:

| Purpose | Command |
|---------|---------|
| Install | `npm ci` or `npm install` (lockfile present) |
| Metro | `npm start` |
| Debug Android (RN CLI) | `npm run android` |
| Debug wait + assembleDebug + install | `npm run android:run` → `scripts/android-run.ps1` → `android\gradlew.bat assembleDebug` |
| Install existing debug APK | `npm run android:install` |
| Reset emulator | `npm run android:reset-emulator` |
| iOS | `npm run ios` |
| Tests | `npm test` (Jest) |
| Lint | `npm run lint` |

**Release (no npm script):**

```text
cd K:\AcomiMobile\android
.\gradlew.bat verifyReleaseSigningConfigured
.\gradlew.bat bundleRelease
.\gradlew.bat assembleRelease
```

These task names are **VERIFIED** in `android/app/build.gradle`. Successful execution is **NOT VERIFIED** (not run; signing files missing).

Optional ABI override (comment in `gradle.properties`):

```text
.\gradlew.bat bundleRelease -PreactNativeArchitectures=arm64-v8a
```

---

## Part 2 — Mobile production readiness checklist

| Item | Status |
|------|--------|
| Production API verified against a live host that exists | **FAIL / BLOCKER** — source is `https://api.acomi.app/api/v1`; DNS for `api.acomi.app` was NXDOMAIN (2026-08-14 HTTP/DNS). Live custom API is `https://api.acomi.in` (prior HTTP phases). |
| No localhost / `10.0.2.2` in release | **PASS** if `__DEV__` is false and `USE_LOCAL_DEV_BACKEND` stays false — those hosts are not on the production map |
| Release `applicationId` verified | **PASS** — `com.acomi` |
| `versionCode` verified | **PASS** (value `1`) — increment is **REQUIRED ACTION** for any later store update |
| `versionName` verified | **PASS** — `1.0` |
| arm64-v8a verified | **PASS** (property includes it). AAB contents **NOT VERIFIED** |
| Signing configuration in Gradle | **PASS** (working-tree design) |
| Release keystore created | **BLOCKER** — not present; creation requires explicit user approval |
| `keystore.properties` present | **BLOCKER** |
| Release build succeeds | **NOT VERIFIED** / effectively **BLOCKER** until signing exists |
| AAB generated | **NOT VERIFIED** |
| AAB tested on real arm64 device | **NOT VERIFIED** |
| Production authentication tested (release binary) | **NOT VERIFIED** |
| API requests verified against production from release | **NOT VERIFIED** |
| No debug-only config in release | **WARNING** — debug API host must not leak (`__DEV__` false). Cleartext flag resolution **NOT VERIFIED**. MVP OTP is a Backend issue, not a Mobile leak |

---

## Part 3 — Backend project inventory

Workspace: `K:\Projects\Acomi\Backend\acomi-backend`

### 3.1 Application

| Item | Value | Class |
|------|--------|--------|
| Spring Boot | 3.5.14 | VERIFIED |
| Java | 17 | VERIFIED |
| Maven | Wrapper `mvnw` / `mvnw.cmd` | VERIFIED |
| `groupId` | `com.acomi` | VERIFIED |
| `artifactId` | `acomi-backend` | VERIFIED |
| Version | `0.0.1-SNAPSHOT` | VERIFIED |
| JAR name (Docker) | `acomi-backend-0.0.1-SNAPSHOT.jar` → `app.jar` | VERIFIED |
| `spring.application.name` | `acomi-backend` | VERIFIED |
| Port | `${PORT:8080}` | VERIFIED |
| Profiles | `local` (default), `dev`, `prod` | VERIFIED |

### 3.2 Git (Backend)

| Item | Value | Class |
|------|--------|--------|
| Current branch | `aws-production` | VERIFIED |
| HEAD | `e4ac14664d9455d4fb38cdf4305f7a9a84f18e7c` — ACOMI rename | VERIFIED |
| `origin` | `https://github.com/ketankumbhar204/AmicoBackend.git` → GitHub `AcomiBackend` | VERIFIED / HISTORICAL remote name |
| `origin/develop` / `origin/production` / `origin/aws-production` | All `e4ac146` (`0 0`) | VERIFIED |
| `origin/main` | `c03dada` CountIn→Amico | HISTORICAL |
| Working tree | Clean | VERIFIED |

Recent deployment-related commits: `e4ac146` rename; `ab0b684` Docker for Render; `1b6ed59` multi-environment config.

### 3.3 Build / Docker

| Item | Value | Class |
|------|--------|--------|
| Package | `./mvnw -B clean package -DskipTests` (Dockerfile) | VERIFIED |
| Tests | `./mvnw test` (standard; not scripted separately) | VERIFIED (Maven default) |
| Docker build | Multi-stage Dockerfile at repo root | VERIFIED |
| Runtime image | `eclipse-temurin:17-jre-jammy` | VERIFIED |
| Entrypoint | `java -jar app.jar` | VERIFIED |
| `EXPOSE` | 8080 | VERIFIED |
| Health | `GET /actuator/health` (details never; probes enabled) | VERIFIED |
| JVM flags in Git | None (`JAVA_TOOL_OPTIONS` is host-injected) | VERIFIED |
| `.github` workflows | **None** | VERIFIED |
| `render.yaml` | **None** | VERIFIED |

### 3.4 Spring profiles — environment variables

Do **not** print secret values. Local profile contains hardcoded local defaults in Git; those must never be copied to production.

| Variable / property | Purpose | DEV source | PROD source | Secret? | Required on prod? |
|---------------------|---------|------------|-------------|---------|-------------------|
| `SPRING_PROFILES_ACTIVE` | Profile | Env (`dev`) | Env (`prod`) | No | Yes |
| `PORT` | Listen port | Host / Render | Host | No | Yes (or default 8080) |
| `DB_HOST` | Postgres host | Env (pooler) | Env (pooler) | Semi | Yes |
| `DB_PORT` | Port | Env / default 5432 | Same | No | Default OK |
| `DB_NAME` | Database | Env / default `postgres` | Same | No | Default OK |
| `DB_USERNAME` | User | Env `postgres.<ref>` | Env | Semi | Yes |
| `DB_PASSWORD` | Password | Env | Env | **Yes** | Yes |
| `JWT_SECRET` | HS256 key | Env | Env | **Yes** | Yes |
| `JWT_EXPIRATION_MS` | Token TTL | Optional; default 86400000 | Same | No | No |
| `CORS_ALLOWED_ORIGINS` | Exact browser origins, comma-separated | Env | Env (no default in `prod`) | No | Yes |
| `SWAGGER_ENABLED` | springdoc | Default true on `dev` | Default **false** on `prod` | No | Should be false |
| JDBC SSL | `sslmode=require` in `dev`/`prod` YAML | YAML | YAML | No | Yes |
| Hikari | max 10, min idle 2 | YAML | YAML | No | — |
| Flyway | enabled; `classpath:db/migration`; `clean-disabled: true` on prod | YAML | YAML | No | — |
| Hibernate `ddl-auto` | `validate` | Base YAML | Inherited | No | — |
| `acomi.otp.mvp-code` | Fixed OTP | `application.yml` `"111111"` **all profiles** | Same | **Yes (weak)** | **BLOCKER** for real users |

No AWS, SMS, email, or object-storage environment variables exist in Backend YAML/Java (**VERIFIED** absence).

### 3.5 Database

| Item | Value | Class |
|------|--------|--------|
| Engine | PostgreSQL (`org.postgresql.Driver`, Hibernate dialect) | VERIFIED |
| External/managed | `dev`/`prod` YAML comments: Supabase projects `acomi-dev` / `acomi-prod` | VERIFIED (repo comments) |
| Live project ref / region | Not in Git | NOT VERIFIED |
| AWS RDS referenced? | **No** | VERIFIED |
| Flyway files | 97, latest V97 | VERIFIED (prior repo count; still the layout) |
| Startup | Flyway migrate on start; then Hibernate validate | VERIFIED |
| Pool | Hikari `AcomiHikariPool` | VERIFIED |

### 3.6 Security

| Item | Value | Class |
|------|--------|--------|
| Auth | JWT after OTP verify; `/api/v1/auth/me` etc. require JWT | VERIFIED |
| CORS | `CorsConfig` + `CorsProperties`; exact origins; credentials true; not `*` | VERIFIED |
| Production CORS value | **Not in Git** — Render/AWS env | NOT VERIFIED (live value) |
| Swagger on `prod` | Default disabled | VERIFIED (config) |
| Actuator | Only `health` exposed | VERIFIED |
| OTP | `OtpService` does **not** send SMS; verifies `acomi.otp.mvp-code` | VERIFIED |
| Real SMS provider | **None** | VERIFIED |
| Public-launch auth | **BLOCKER** — hardcoded MVP OTP on all profiles | VERIFIED |

---

## Part 4 — AWS information in repositories

### 4.1 Backend repository

Search of Backend source, Docker, YAML, scripts, and docs for AWS compute/network/IAM product names: **no AWS deployment configuration**.

`docs/PRODUCTION_INFRASTRUCTURE_PLAN.md` (Mobile docs, uncommitted) describes **future** AWS as a compute move keeping the same Supabase PROD. That is a **RECOMMENDATION**, not a deployed architecture.

**AWS runtime architecture cannot be fully verified from the Backend repository.**

### 4.2 Web workspace (adjacent; not Backend Git)

Web `K:\AcomiWeb` is on `aws-production` at `3feecf7` (`chore: configure production API for AWS`), which commits `.env.production` with `VITE_API_BASE_URL=https://api.acomi.in/api/v1`.

**Untracked** local JSON (not committed) describes Web static hosting. Treat as **local workspace evidence**, not Backend Git:

| AWS service | Purpose | Identifiers found | Region | Status | Source |
|-------------|---------|-------------------|--------|--------|--------|
| S3 | Static Web origin | Bucket `acomi-web-prod`; host `acomi-web-prod.s3.ap-south-1.amazonaws.com` | `ap-south-1` | Local JSON only | Untracked `cloudfront-*.json`, `acomi-web-bucket-policy.json` |
| CloudFront | CDN + SPA 403/404 → `/index.html` | Distribution `E2VH4TPFBNMP5`; OAC `E1UNWXNXYEZ9ZN` | Account `484279833542` | Local JSON only | Same |
| ACM | HTTPS cert (us-east-1, CloudFront) | Certificate ARN in `cloudfront-update.json` | `us-east-1` | Local JSON only | Untracked `cloudfront-update.json` |

No access keys or DB passwords appear in those files. **Do not treat this as a verified live AWS Backend.**

### 4.3 Mobile repository

No AWS SDK, Amplify, or AWS host in Mobile application source. Planning docs mention AWS as future compute only.

---

## Part 5 — AWS Backend deployment architecture

**AWS runtime architecture cannot be fully verified from the repository.**

What **is** verified for compute today (docs + prior HTTP phases, not AWS Console):

```
Git production / aws-production (same SHA e4ac146)
    ↓
Docker (Temurin 17, java -jar app.jar)
    ↓
Render Web Service  https://acomi.onrender.com
    ↓
Custom domain       https://api.acomi.in   (CNAME → acomi.onrender.com, 2026-08-14 DNS)
    ↓
JDBC sslmode=require
    ↓
PostgreSQL (documented as Supabase acomi-prod — project identity NOT VERIFIED from Git)
```

Obtain from AWS Console before writing an “AWS Backend is live” document: account, region, compute service, instance/service ID, env values (names only), security groups, public URL, health, CloudWatch.

---

## Part 6 — AWS IAM

**NOT VERIFIED — AWS Console required.**

No IAM roles, OIDC providers, or deploy policies exist in Backend or Mobile Git. Untracked Web bucket policy grants CloudFront `s3:GetObject` on `acomi-web-prod` only (Web static, not Backend).

**RECOMMENDATION** (not implemented): GitHub Actions OIDC → deploy role; no root keys. Do not create in this audit.

---

## Part 7 — AWS networking

**NOT VERIFIED** for Backend (no VPC/SG/ALB/NAT/Route 53 in Git).

From untracked Web JSON only: S3 in `ap-south-1`; CloudFront; ACM in `us-east-1`. Ingress/egress/security groups: **NOT VERIFIED**.

DNS (prior HTTP/DNS audit, 2026-08-14): `api.acomi.in` → `acomi.onrender.com`; `app.acomi.in` → `acomiwebapp.onrender.com`. That is **Render**, not AWS. Current DNS **NOT RE-VERIFIED** on 2026-08-16.

---

## Part 8 — Production API comparison

| Client | Configured API base | Class |
|--------|---------------------|--------|
| Mobile **release** | `https://api.acomi.app/api/v1` | VERIFIED (source) |
| Mobile **debug** | `https://acomibackend.onrender.com/api/v1` | VERIFIED (source) |
| Web production build | `https://api.acomi.in/api/v1` | VERIFIED (`K:\AcomiWeb\.env.production` / commit `3feecf7`) |
| Backend public custom domain (prior DNS/HTTP) | `https://api.acomi.in` | HISTORICAL verification 2026-08-14; **NOT RE-VERIFIED** this audit |
| Backend Render hostname | `https://acomi.onrender.com` | Same |

**Mismatch:** Mobile release host **`api.acomi.app`** ≠ Web / intended custom domain **`api.acomi.in`**.  
`api.acomi.app` was **NXDOMAIN** on 2026-08-14. Shipping the current release binary would not reliably reach the deployed Backend.

This is a **BLOCKER** for Play release until source or DNS is aligned **and** HTTP-verified. This audit does not change Mobile source.

---

## Part 9 — Deployment procedure

### VERIFIED ACTUAL PROCEDURE (Backend / Render — from Dockerfile + docs)

1. Source on Git `production` (currently same SHA as `develop` / `aws-production`: `e4ac146`).  
2. Render Docker Web Service builds the repo Dockerfile (`./mvnw -B clean package -DskipTests`).  
3. Runtime: `java -jar app.jar` with env: `SPRING_PROFILES_ACTIVE=prod`, `DB_*`, `JWT_SECRET`, `CORS_ALLOWED_ORIGINS`, `SWAGGER_ENABLED=false`, `PORT`.  
4. Health: `GET /actuator/health`.  
5. No GitHub Actions in repo.  
6. Rollback: Render previous deploy (documented **RECOMMENDATION**); not executed here.

### VERIFIED ACTUAL PROCEDURE (Mobile debug)

`npm install` → `npm start` → `npm run android` or `scripts/android-run.ps1` (`assembleDebug`).

### NOT A VERIFIED ACTUAL PROCEDURE

- Successful `bundleRelease` / Play upload  
- AWS ECR push / EC2 or App Runner deploy  
- GitHub Actions OIDC  

### RECOMMENDED FUTURE PROCEDURE (not implemented)

1. Align Mobile release API with the live Backend host (`api.acomi.in` or a working `api.acomi.app`).  
2. Create upload keystore (user-approved); fill gitignored `keystore.properties`.  
3. `bundleRelease` (optionally arm64-only); test on a physical arm64 device against production.  
4. Keep Render `production` until AWS Backend is health+CORS verified on a **non-cutover** URL.  
5. Deploy AWS **only** from `aws-production`.  
6. DNS cutover with rollback to Render.  
7. Do not merge `aws-production` into `production` automatically.

---

## Part 10 — Troubleshooting history (verified / documented)

| Error | Root cause | Resolution | Class |
|-------|------------|------------|--------|
| Android compile after folder rename | Generated autolinking/cache still referenced old `Amico` path | User forbade auto-deleting caches; crash log still shows `K:\Amico` | HISTORICAL / WARNING |
| Gradle JVM crash `hs_err_pid17620.log` | Local Gradle OOM / native crash during Android build | Log only; not a store artifact | HISTORICAL |
| Render PROD exit **137** | SIGKILL / container OOM during Hibernate start; `-Xmx384m` on small instance; same Git SHA as a successful first deploy | Overlapping redeploy and/or 512 MB peak; not a new commit | HISTORICAL (2026-08-14/15) |
| CORS 403 for `https://app.acomi.in` | Running process still allowed `https://acomiwebapp.onrender.com` only | Env must be loaded by a **new** JVM; not a Git CORS bug | HISTORICAL |
| SPA `/login` 404 | Missing static rewrite | Rewrite `/*` → `/index.html` | HISTORICAL (later HTTP 200) |
| DEV Backend `acomibackend.onrender.com` | `x-render-routing: no-server` (2026-08-14) | Host had no server; Mobile debug still points here | HISTORICAL / WARNING |

---

## Part 11 — Current state

| Area | Status | Evidence | Action |
|------|--------|----------|--------|
| Mobile source | ACOMI on `develop` `d931db0` + dirty Phase 5.4/docs | Git | Preserve dirty tree; do not reset |
| Mobile production API | `https://api.acomi.app/api/v1` | `env.ts` | Align with live Backend before AAB |
| Android package | `com.acomi` | Gradle | Keep |
| Android signing | Gradle ready; files missing | Working tree | **BLOCKER** — create keystore when approved |
| ARM64 | Enabled in properties | `gradle.properties` | Confirm AAB contents after first bundle |
| Release build | Not run | — | After signing |
| AAB | Not produced | — | After signing |
| Backend source | `e4ac146` on `aws-production` = `production` | Git | Docker-ready |
| Backend build | Dockerfile + mvnw | Repo | Use for any host |
| Backend AWS deployment | **Not in Backend Git** | Search | Console / later phase |
| Production API (live custom) | `api.acomi.in` (prior) | DNS/HTTP 2026-08-14 | Re-verify before store |
| Database | Postgres + Flyway; Supabase named in YAML comments | Repo | Confirm acomi-prod in dashboard |
| IAM | None in Git | — | Console |
| Networking (AWS) | None in Backend Git | — | Console |
| CI/CD | No GitHub Actions | Repos | Optional later; Render dashboard today |
| Monitoring | Actuator health only | YAML | Optional CloudWatch later |
| Authentication | JWT + MVP OTP | `OtpService` | **BLOCKER** for real users |
| Real OTP/SMS | Not implemented | `OtpService` | Required before public login |

---

## Part 12 — Information Cursor cannot verify locally

Requires AWS Console / dashboards (Backend compute):

- AWS account ID in use for **Backend** (Web untracked JSON shows `484279833542` — **not** proof Backend uses it)
- Region for Backend compute
- Whether any EC2/ECR/ECS/App Runner/Beanstalk exists
- Resource IDs, instance types, public IPs
- IAM roles, OIDC, instance profiles
- VPC, subnets, security groups, NACL
- ALB / target groups / listeners
- Env vars actually set on a compute service (names/values except secrets)
- CloudWatch log groups / alarms
- Deploy history and current running task
- ACM for **API** hostname
- Whether `api.acomi.in` has been moved off Render

Requires other dashboards:

- Google Play Console (app listing, signing by Play, testers)
- Render: current Live/137 state, `CORS_ALLOWED_ORIGINS`, instance size
- Supabase: acomi-prod ref, region, pooler, plan
- Live DNS for `api.acomi.app`, `api.acomi.in`, `app.acomi.in` (not re-probed this audit)
- Physical device test of a signed AAB

---

## Part 13 — Related workspace Git (context only)

| Repo | Branch | HEAD | Notes |
|------|--------|------|--------|
| Web `K:\AcomiWeb` | `aws-production` | `3feecf7` | Production API `https://api.acomi.in/api/v1`. Untracked CloudFront/S3 JSON. `origin/production` still `6801e46` |
| Backend | `aws-production` | `e4ac146` | Same as `production` |
| Mobile | `develop` | `d931db0` | Dirty; `aws-production` pointer same SHA |

Render `production` must stay isolated from AWS experiments on `aws-production`.

---

## Safety statement

This inventory file is documentation only. No application source, Gradle, Maven, keystore, AWS, Render, Supabase, DNS, commit, or push was performed as part of gathering facts (creating this markdown file is the requested deliverable). No secrets were copied into this document.
