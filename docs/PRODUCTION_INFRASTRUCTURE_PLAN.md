# ACOMI — Production Infrastructure Inventory & Migration Plan

**Document type:** Read-only inventory + production blueprint (Phase 6.0)  
**Date:** 2026-08-14  
**Status:** Planning only — no production infrastructure created  
**Companion docs:** `docs/DEVELOPMENT_DEPLOYMENT_GUIDE.md` (DEV runbook; some current-state rows are stale), `docs/ACOMI_WORKSPACE_REPOSITORY_AUDIT.md` (Phase 5.9)

**Evidence labels:**

| Label | Meaning |
|-------|---------|
| **VERIFIED FACT** | Confirmed from Git, repository files, or DNS lookup on 2026-08-14 |
| **DOCUMENTED HISTORICAL** | Recorded in the development guide or prior phases; not re-proven live in this phase |
| **STALE DOCUMENTATION** | Conflicts with current Git/repo state |
| **RECOMMENDATION** | Proposed production approach |
| **REQUIRES USER ACTION** | Human/dashboard/registrar action; not done here |
| **REQUIRES USER DECISION** | Choice the owner must make |
| **NOT VERIFIED** | Not inspectable from Git (Render/Supabase dashboards, live schema, registrar) |
| **BLOCKER** | Must be resolved before real users / store release |
| **WARNING** | Should be resolved before or during production hardening |
| **PASS** | Acceptable for the stated production design |

---

## 1. Executive Summary

ACOMI already has a working **development** stack: Git `develop` → Render Docker Backend → Supabase DEV PostgreSQL, plus a Render Static Site for Web, and Mobile debug builds that call the develop Backend.

There is **no production environment yet**.

| Item | State |
|------|--------|
| Production Supabase | **Not created** (**NOT VERIFIED** as absent from Git; none is configured in repo) |
| Production Render Backend | **Not created** |
| Production Render Web | **Not created** |
| `api.acomi.app` / `app.acomi.app` / `acomi.app` | DNS **does not exist** (**VERIFIED FACT**, 2026-08-14 lookup) |
| Git `production` | Fast-forwarded to ACOMI `develop` HEAD on 2026-08-14 (**VERIFIED FACT**). Permanent production release branch. No PROD Render/Supabase connected yet. |
| Git `main` | Still CountIn→Amico; **not** the production release branch |
| Git `develop` | ACOMI rename + Docker + Web TS fix; remains the development branch (**VERIFIED FACT**) |

**Target architecture:** a second, isolated copy of the validated DEV pattern, fed from Git **`production`**, using a **new** Supabase project and **new** Render services. Do not convert DEV into PROD. Future AWS compute must keep the **same** Supabase PROD.

**Git `production` preparation:** completed 2026-08-14 by fast-forward only (existing `production` was an ancestor of `develop`; no force-push). `production` SHA == `develop` SHA in all three repos.

**Final verdict of the planning pass:** **READY FOR PHASE 6.1 — SUPABASE PROD SETUP** (after this branch-prep phase).

Prerequisites before the first production *push*: update local `origin` URLs to the canonical ACOMI GitHub names (**REQUIRES USER ACTION**). MVP OTP and unsigned Android release are **later-phase blockers**, not 6.1 blockers.

---

## 2. Current DEV Architecture

### 2.1 Logical flow (**RECOMMENDATION** of how DEV is supposed to run; URLs **VERIFIED** in source)

```
Git develop
    ↓
Render Web Service (Docker)  https://acomibackend.onrender.com
    ↓  JDBC sslmode=require, SPRING_PROFILES_ACTIVE=dev
Supabase PostgreSQL (documented as acomi-dev)
    ↑
Render Static Site           https://acomiwebapp.onrender.com
    (VITE_API_BASE_URL baked at build time)

Mobile debug (__DEV__)  →  https://acomibackend.onrender.com/api/v1
```

### 2.2 What is verified vs documented vs stale

| Topic | Value | Classification |
|-------|-------|----------------|
| DEV Backend host in Mobile source | `https://acomibackend.onrender.com` (`src/config/env.ts`) | **VERIFIED FACT** |
| DEV Web / Backend hosts in deployment guide | same Render hostnames | **DOCUMENTED HISTORICAL** (guide) + DNS for both hostnames **resolves** to Render/Cloudflare (**VERIFIED FACT**) |
| Live health HTTP 200 on this date | not re-probed in Phase 6.0 | **NOT VERIFIED** this phase (cold-start risk is **DOCUMENTED HISTORICAL**) |
| Spring profile on Render DEV | `dev` | **DOCUMENTED HISTORICAL**; matches `application-dev.yml` |
| Render service types | Backend = Docker Web Service; Web = Static Site | **DOCUMENTED HISTORICAL**; no `render.yaml` in repos (**VERIFIED FACT**) |
| Git branch Render should track | `develop` | **DOCUMENTED HISTORICAL** |
| GitHub repos Render should use | `AcomiBackend`, `AcomiWebApp` after rename | **VERIFIED FACT** (GitHub API in Phase 5.9). Dashboard still showing Amico names: **NOT VERIFIED** |
| Dockerfile | repo root, Temurin 17, non-root `acomi`, `java -jar app.jar` | **VERIFIED FACT** |
| Web build | `npm ci && npm run build`; publish `dist` | **DOCUMENTED HISTORICAL**; `package.json` build script **VERIFIED FACT** |
| SPA rewrite | `/*` → `/index.html` Rewrite | **DOCUMENTED HISTORICAL** |
| CORS on DEV | exact `https://acomiwebapp.onrender.com` | **DOCUMENTED HISTORICAL**; code reads `CORS_ALLOWED_ORIGINS` (**VERIFIED FACT**) |
| Flyway on DEV | 97 migrations, schema v97 | **DOCUMENTED HISTORICAL**; Git still has **97** files V1–V97 (**VERIFIED FACT**) |
| Guide local paths / GitHub URLs / SHAs | Amico paths; SHAs `ab0b684` / `b0c4f44` as “current” | **STALE DOCUMENTATION** (Phase 5.9) |

**Conflict:** `DEVELOPMENT_DEPLOYMENT_GUIDE.md` §3 and §23 still describe Amico folder paths, Amico GitHub URLs, and pre-rename HEADs. Current develop HEADs are `e4ac146` (Backend), `6801e46` (Web), `d931db0` (Mobile). **Do not use the guide’s “current HEAD” rows for production promotion.**

---

## 3. Current Git State

Local remotes still use old Amico URLs; GitHub canonical names are ACOMI. Redirects work (**VERIFIED FACT**, Phase 5.9). **REQUIRES USER ACTION:** `git remote set-url` before Phase 6.1 push. Do not update remotes in this phase.

### 3.1 Inventory (2026-08-14)

| | Mobile | Web | Backend |
|--|--------|-----|---------|
| Root | `K:\AcomiMobile` | `K:\AcomiWeb` | `K:\Projects\Acomi\Backend\acomi-backend` |
| Current branch | `develop` | `develop` | `develop` |
| Tracking | `origin/develop` | `origin/develop` | `origin/develop` |
| Local origin | `…/AmicoMobile.git` | `…/AmicoWebApp.git` | `…/AmicoBackend.git` |
| Canonical origin | `…/AcomiMobile.git` | `…/AcomiWebApp.git` | `…/AcomiBackend.git` |
| `develop` HEAD | `d931db0` ACOMI rename | `6801e46` ACOMI rename | `e4ac146` ACOMI rename |
| `main` HEAD | `e02095c` CountIn→Amico | `a4374b7` CountIn→Amico | `c03dada` CountIn→Amico |
| `production` HEAD | same as `main` | same as `main` | same as `main` |
| `main` vs `develop` | `0` unique on main, `1` on develop | `0` / `2` | `0` / `3` |
| Fast-forward `main`←`develop`? | **Yes** (`main` is ancestor) | **Yes** | **Yes** |
| Working tree | Dirty (Phase 5.4 + audit docs + noise) | Clean | Clean |

### 3.2 Commits required to bring `main` to ACOMI production-ready *source*

**Mobile** (`main..develop`):

1. `d931db0` — `refactor: rename application from Amico to ACOMI`

**Web** (`main..develop`):

1. `b0c4f44` — `fix: resolve web TypeScript build errors`
2. `6801e46` — `refactor: rename application from Amico to ACOMI`

**Backend** (`main..develop`) — **all three are required** (Docker + env profiles live only on develop):

1. `1b6ed59` — `refactor: configure backend for multiple environments`
2. `ab0b684` — `build: add Docker support for Render deployment`
3. `e4ac146` — `refactor: rename application from Amico to ACOMI`

**RECOMMENDATION:** `git merge --ff-only develop` on `main` (and optionally on `production`) after remotes are updated. No rebase, no force-push, no squash.

**Do not** include uncommitted Mobile Phase 5.4 files or this planning document in that promotion unless they are first committed on `develop` in a separate, reviewed commit.

**REQUIRES USER DECISION:** keep Git branch `production` as a mirror of `main`, or stop using it (it currently duplicates `main` and is easy to confuse with Spring profile `prod`).

---

## 4. Current Supabase State

| Topic | Finding | Classification |
|-------|---------|----------------|
| Role of Supabase in this app | Managed **PostgreSQL** for Flyway/JPA. No Supabase Auth, Storage SDK, or service-role usage in Backend Java | **VERIFIED FACT** |
| DEV project name | `acomi-dev` | **DOCUMENTED HISTORICAL** |
| JDBC shape (`dev`/`prod` yml) | `jdbc:postgresql://${DB_HOST}:${DB_PORT:5432}/${DB_NAME:postgres}?sslmode=require` | **VERIFIED FACT** |
| Username pattern | Pooler form `postgres.<project-ref>` | **DOCUMENTED HISTORICAL** |
| Flyway | enabled; `classpath:db/migration`; `baseline-on-migrate: true`; `clean-disabled: true` on `dev`/`prod` | **VERIFIED FACT** |
| Migration count | **97** files, latest `V97__exclude_extras_from_menu_history.sql` | **VERIFIED FACT** |
| Applied schema version on DEV | v97, 97/97 success | **DOCUMENTED HISTORICAL** (not re-queried) |
| Schema | Application tables in `public` (typical Flyway default); no `CREATE SCHEMA` in sampled V1 | **VERIFIED FACT** for V1; live DEV schemas **NOT VERIFIED** |
| Extensions | No `CREATE EXTENSION` in migrations | **VERIFIED FACT** |
| Triggers | None found in migration grep | **VERIFIED FACT** (Git); live DB **NOT VERIFIED** |
| RLS | No `ENABLE ROW LEVEL SECURITY` / `CREATE POLICY` in migrations | **VERIFIED FACT** |
| Storage buckets | Not used. Photos/attachments stored as **URL strings** in Postgres | **VERIFIED FACT** |
| Auth | Application OTP + JWT (`users` table), not Supabase Auth | **VERIFIED FACT** |
| Seed / reference | Global food catalog seeded in Flyway (`V40`, repaired in `V43`/`V51`). Space-scoped backfills no-op if no spaces exist | **VERIFIED FACT** |

**Do not** print or copy DEV credentials into PROD. Live Supabase dashboard settings were **not** opened (**NOT VERIFIED**).

---

## 5. Current Render State

| Service | Type | Public hostname | Git | Branch | Build | Classification |
|---------|------|-----------------|-----|--------|-------|----------------|
| DEV Backend | Web Service (Docker) | `acomibackend.onrender.com` | should be `AcomiBackend` | `develop` | Dockerfile | hostname DNS **VERIFIED FACT**; dashboard fields **DOCUMENTED HISTORICAL** |
| DEV Web | Static Site | `acomiwebapp.onrender.com` | should be `AcomiWebApp` | `develop` | `npm ci && npm run build` → `dist` | same |

No `render.yaml` in any repo (**VERIFIED FACT**). Env vars live only in the Render dashboard (**NOT VERIFIED** this phase).

**REQUIRES USER ACTION (later, not now):** confirm Render Git connections survived the GitHub rename.

**RECOMMENDATION:** leave DEV services running until the DEV retirement checklist in §18 is complete. Do not delete or retarget them to PROD.

---

## 6. Target PROD Architecture

```
                    ACOMI PRODUCTION

                         Git production
                            │
              ┌─────────────┴─────────────┐
              │                           │
     Render PROD Backend           Render PROD Web
     Docker / Spring `prod`        Static Site / dist
     custom domain                 custom domain
     https://api.acomi.app         https://app.acomi.app
              │                           │
              │                    VITE_API_BASE_URL=
              │                    https://api.acomi.app/api/v1
              ▼
        Supabase PROD (new project)
        PostgreSQL + Flyway
              │
              └──────── real users (Web + Android + iOS)
```

**Hard isolation rules (RECOMMENDATION):**

- Separate Supabase **project** (not a “production branch” of DEV, not a Git branch).
- Separate Render **services** (not the same service with swapped env).
- Separate JWT, DB password, CORS origin.
- Mobile **release** → `https://api.acomi.app/api/v1` only after that host is real.
- DEV Web origin must **not** appear in PROD CORS.

Supabase preview/dev branches, if used later, are **not** a substitute for the PROD project.

---

## 7. Supabase PROD Plan

**Do not create the project in this phase.**

### 7.1 What to create later (**REQUIRES USER ACTION**)

1. New Supabase project, suggested name **`acomi-prod`**, in the same org as DEV but **not** the same project.
2. Region: prefer the same region as DEV for latency (**NOT VERIFIED** which region DEV uses; historically pooler host suggested `ap-south-1`).
3. Generate a **new** database password. Never reuse DEV.
4. Use **Session pooler** + SSL, same JDBC shape as `application-prod.yml`.
5. Record `DB_HOST`, `DB_PORT`, `DB_NAME=postgres`, `DB_USERNAME=postgres.<prod-project-ref>`, `DB_PASSWORD` only in Render PROD env.
6. Enable automated backups (paid plan if required) **before** real users.
7. Leave Supabase Auth/Storage unused unless a later design adds them. Application auth is JWT.
8. Do **not** enable Flyway clean. Do **not** point DEV Render at this database.

### 7.2 What this is not

| Concept | Use for ACOMI PROD? |
|---------|---------------------|
| Separate Supabase **project** | **Yes** — this is the production database |
| Supabase “production branch” / preview branch | **No** as a replacement for the base PROD project |
| Git `production` | Application production source, not the database |
| Spring profile `prod` | Application runtime, not the database |

---

## 8. Render Backend PROD Plan

**Do not create the service in this phase.**

| Setting | Planned value | Notes |
|---------|---------------|-------|
| Service type | Web Service | Mirror DEV |
| Repository | `ketankumbhar204/AcomiBackend` | Canonical name |
| Branch | **`production`** | Not `develop` |
| Runtime | Docker, repo-root `Dockerfile` | Java 17 build + JRE run |
| Health check | `/actuator/health` | Same as DEV |
| Port | Render `PORT` env (do not hardcode 8080) | `server.port=${PORT:8080}` |
| Auto deploy | On for `production` **or** manual until first smoke passes | **REQUIRES USER DECISION**
| Spring profile | `SPRING_PROFILES_ACTIVE=prod` | Loads `application-prod.yml` |
| CORS | `https://app.acomi.app` only (after domain exists) | See §11 |
| Database | PROD pooler env vars | Never DEV |
| Flyway | On at startup, forward-only | First boot applies V1–V97 |
| Swagger | `SWAGGER_ENABLED=false` (already default in `prod` yml) | Keep false |
| Logging | info; SQL warn; Flyway warn | From `application-prod.yml` |
| Rollback | Redeploy previous Render deploy / previous `production` SHA | Does **not** undo Flyway |

**RECOMMENDATION:** use a **paid** Render instance for PROD so the API does not spin down. Free-tier cold starts are unsuitable for real mobile users. **REQUIRES USER DECISION** on plan/size.

---

## 9. Render Web PROD Plan

**Do not create the service in this phase.**

| Setting | Planned value |
|---------|---------------|
| Service type | Static Site |
| Repository | `ketankumbhar204/AcomiWebApp` |
| Branch | **`production`** |
| Build command | `npm ci && npm run build` |
| Publish directory | `dist` |
| SPA rewrite | `/*` → `/index.html` **Rewrite** (required) |
| `VITE_API_BASE_URL` | `https://api.acomi.app/api/v1` (public, build-time) |
| `VITE_APP_ENV` | `production` |
| `VITE_API_TIMEOUT_MS` | `30000` (optional) |
| Auto deploy | Same decision as Backend |
| Rollback | Redeploy previous static deploy; must rebuild if API URL changes |

Until custom domains exist, a temporary `*.onrender.com` PROD Web URL may be used for internal smoke tests; CORS must then allow **that** origin, then be tightened to `https://app.acomi.app`. **WARNING:** do not leave the DEV Web origin on PROD CORS.

---

## 10. Domains / DNS

**Target (given):**

| Role | Hostname | Planned target |
|------|----------|----------------|
| Backend | `api.acomi.app` | Render PROD Backend |
| Web | `app.acomi.app` | Render PROD Web |

**DNS today (2026-08-14):** `api.acomi.app`, `app.acomi.app`, `acomi.app`, `www.acomi.app`, `staging-api.acomi.app` — **name does not exist**. **VERIFIED FACT.** Do not claim the domain is live.

Mobile already hardcodes `https://api.acomi.app` for release and `https://staging-api.acomi.app` for staging (**VERIFIED FACT**). Web onboarding copy links to `https://acomi.app/help` and `mailto:support@acomi.app` (**VERIFIED FACT**) — those are product URLs, not the app SPA.

### Future DNS plan (**REQUIRES USER ACTION**)

1. Register / confirm ownership of `acomi.app` at a registrar (not verified here).
2. In Render, add custom domains to PROD Backend and PROD Web; create the CNAME/ALIAS records Render shows.
3. Wait for TLS certificates.
4. Point `api.acomi.app` → PROD Backend, `app.acomi.app` → PROD Web.
5. Staging host `staging-api.acomi.app` is unused until a staging Backend exists; not required for first PROD.

### Apex / www — **REQUIRES USER DECISION**

Do **not** decide silently.

| Option | Meaning |
|--------|---------|
| **A. `app.acomi.app` is the product SPA** (recommended default) | Marketing/help can live on `acomi.app` later; `www.acomi.app` redirects to `app.acomi.app` or to a marketing page |
| **B. `acomi.app` is the SPA** | Then CORS and `VITE` origins change; Mobile API still `api.acomi.app` |
| **C. `www.acomi.app` is the SPA** | Same CORS impact; apex redirect to www |

This plan assumes **Option A** for CORS and Web custom domain until you choose otherwise. Changing it later is a CORS + rebuild + docs change, not a database change.

---

## 11. CORS

**Code (VERIFIED FACT):** `CorsConfig` + `CorsProperties` (`acomi.cors.allowed-origins`). Comma-separated exact origins, credentials allowed, methods GET/POST/PUT/PATCH/DELETE/OPTIONS. **Not** `*`.

**PROD target (RECOMMENDATION):**

```
CORS_ALLOWED_ORIGINS=https://app.acomi.app
```

If a temporary Render Web URL is used first, include **only** that URL, then replace it.

**Must not include:** `*`, `http://localhost:5173`, `https://acomiwebapp.onrender.com`.

**Native Android/iOS:** browser CORS does not apply. Mobile apps call the API with `Authorization` headers; they are not origins. CORS is for the **Web** SPA only.

---

## 12. Environment Variable Matrix

Never commit secret **values**. Names below are safe to document.

| Variable | Purpose | DEV Backend | PROD Backend | DEV Web | PROD Web | Mobile Debug | Mobile Release | Required | Secret | Source | Safe to commit |
|----------|---------|-------------|--------------|---------|----------|--------------|----------------|----------|--------|--------|----------------|
| `SPRING_PROFILES_ACTIVE` | Spring profile | `dev` | `prod` | — | — | — | — | Yes (Render) | No | Render env | Name only |
| `PORT` | Listen port | Render-injected | Render-injected | — | — | — | — | Injected | No | Render | No |
| `DB_HOST` | Postgres/pooler host | DEV pooler | **PROD** pooler | — | — | — | — | Yes | Semi | Render | No |
| `DB_PORT` | Postgres port | `5432` typical | `5432` typical | — | — | — | — | Optional | No | Render / default | Default in yml |
| `DB_NAME` | Database name | `postgres` | `postgres` | — | — | — | — | Optional | No | Render / default | Default in yml |
| `DB_USERNAME` | DB user | `postgres.<dev-ref>` | `postgres.<prod-ref>` | — | — | — | — | Yes | Semi | Render | No |
| `DB_PASSWORD` | DB password | DEV only | **new** PROD | — | — | — | — | Yes | **YES** | Render / Supabase | **No** |
| `JWT_SECRET` | HS256 key | DEV only | **new** PROD, ≥256 bits | — | — | — | — | Yes on `dev`/`prod` | **YES** | Render | **No** |
| `JWT_EXPIRATION_MS` | Token TTL | default 86400000 | same or shorter | — | — | — | — | Optional | No | Render / yml | Default in yml |
| `CORS_ALLOWED_ORIGINS` | Browser origins | DEV Web URL | `https://app.acomi.app` | — | — | — | — | Yes | No | Render | No |
| `SWAGGER_ENABLED` | springdoc | prefer `false` on public DEV | `false` (yml default) | — | — | — | — | Recommended | No | Render / yml | Default in yml |
| `VITE_API_BASE_URL` | Web API root incl. `/api/v1` | `https://acomibackend.onrender.com/api/v1` | `https://api.acomi.app/api/v1` | baked at build | baked at build | — | — | Yes (deployed Web) | No (public) | Render build env | Example only |
| `VITE_APP_ENV` | Web env label | `production` or `development` | `production` | optional | recommended | — | — | Optional | No | Render build env | Example only |
| `VITE_API_TIMEOUT_MS` | Web HTTP timeout | `30000` | `30000` | optional | optional | — | — | Optional | No | Render / default | Example only |
| Mobile API host | compiled in `env.ts` | `acomibackend.onrender.com` when `__DEV__` | — | — | — | DEV Render | `https://api.acomi.app` | Yes | No | Source | Yes (hosts) |
| `acomi.otp.mvp-code` | Fixed MVP OTP | in `application.yml` (all profiles) | same unless overridden | — | — | uses Backend | uses Backend | Present today | Treat as **auth bypass** | Git yml | **BLOCKER** for real users |

**No other `DB_*` / SMS / email / S3 env vars** were found in Backend yml (**VERIFIED FACT**). OTP is not dispatched to an SMS provider.

Local-only defaults exist in `application-local.yml` (DB password + JWT). **Do not copy them to Render.** Values are not printed here.

---

## 13. Mobile PROD Plan

**Source model (VERIFIED FACT, `src/config/env.ts`):**

| Build | `__DEV__` | API |
|-------|-----------|-----|
| Debug | true | `https://acomibackend.onrender.com/api/v1` |
| Release | false | `https://api.acomi.app/api/v1` |

`USE_LOCAL_DEV_BACKEND = false`. Staging host exists in the map but is not selected by `__DEV__` vs release.

**Do not change `env.ts` in this phase.** After PROD API exists and DNS works, **no mobile source change is required** for the production host unless the API URL changes.

### Before store/release (**RECOMMENDATION**)

1. PROD Backend live on `https://api.acomi.app` (or confirm the hardcoded host).
2. Health + unauth 401 + authenticated smoke (without leaking OTP/PII).
3. Release binary actually uses `api.acomi.app` (log/network confirm; not DEV, not localhost, not `10.0.2.2`).
4. Commit Phase 5.4 signing/ABI work on `develop`, then promote (today it is **uncommitted**).
5. Create release keystore **only with explicit approval** (not done; `keystore.properties` absent).
6. `arm64-v8a` is already in the **uncommitted** `gradle.properties`; committed develop is still `x86_64` only (**WARNING** until Phase 5.4 is committed).
7. Generate AAB; smoke on a real arm64 device.
8. iOS: bundle `com.acomi`, ATS already disallows arbitrary loads; still need Apple signing, capabilities, store listing.
9. After folder rename: clean Android Gradle/autolinking cache (`K:\AmicoMobile` leftovers). **REQUIRES USER ACTION** before the next local compile (Phase 5.9).

Play Console / Apple Developer: **NOT VERIFIED** (account existence unknown).

---

## 14. Security

Read-only. Nothing was fixed.

| Area | Result | Notes |
|------|--------|-------|
| Secrets in Git (Render/Supabase prod) | **PASS** with **WARNING** | No Render secrets in Git. Local profile has local-only DB/JWT defaults. `hs_err_pid17620.log` is tracked noise. |
| JWT | **PASS** (design) | `dev`/`prod` require `JWT_SECRET`. Separate PROD secret is mandatory. |
| DB credentials | **PASS** (design) | Env-only on `dev`/`prod`. |
| CORS | **PASS** (code) | Exact origins, credentials, no `*`. PROD env must not include DEV/localhost. |
| Swagger | **WARNING** | `prod` defaults false. `dev`/base default true. Public DEV should keep `SWAGGER_ENABLED=false`. Security still *permits* swagger paths; disable via springdoc. |
| Actuator | **PASS** | Only `health`; `show-details: never`. |
| Debug endpoints | **PASS** | No extra actuator exposure found. |
| Logging / OTP | **PASS** | `OtpService` logs generic messages only. |
| Auth errors | **PASS** | Invalid OTP → business exception, not stack traces in the service. |
| Default / MVP OTP | **BLOCKER** (real users) | Fixed MVP code in `application.yml` for **all profiles**. `sendOtp` does not send SMS. Anyone who knows the code can verify any mobile and **create a user**. |
| Hardcoded hosts | **WARNING** | Mobile release host `api.acomi.app` is planned; DNS missing. Debug host is DEV Render. |
| DEV URLs in release | **PASS** (intended) | Release uses production map, not DEV. |
| localhost / cleartext | **WARNING** | Debug-only localhost/`10.0.2.2` behind a flag currently false. Android `usesCleartextTraffic` is a manifest placeholder (plugin-supplied; release value **NOT VERIFIED** this pass). iOS `NSAllowsArbitraryLoads=false`, `NSAllowsLocalNetworking=true` **VERIFIED FACT**. |
| Docker | **PASS** | No secrets in image; non-root user. |
| GitHub Actions | **PASS** | None present. |
| Render config in Git | **PASS** | Dashboard-only. |
| Supabase service-role | **PASS** | Not used. |
| Storage / RLS | **WARNING** (awareness) | No RLS; app enforces auth in Spring. Acceptable for current design; DB credentials are the trust boundary. |
| GitHub repo visibility | **WARNING** | Repos are public (**VERIFIED FACT**, Phase 5.9). Source and MVP OTP behavior are visible. |
| Android backup | **PASS** | `android:allowBackup="false"`. |
| Verify-OTP creates users | **WARNING** | `AuthService.verifyOtp` create-on-verify. Protect with real OTP before public launch. |

---

## 15. Database Initialization

**RECOMMENDATION: Option A + catalog seeds already in Flyway (not a DEV clone).**

```
NEW empty acomi-prod Postgres
        ↓
First PROD Backend boot (profile prod)
        ↓
Flyway V1–V97
        ↓
Global food catalog (V40/V43/V51) exists
        ↓
No DEV users / spaces / members / payments
        ↓
READY for first real owner signup
```

| Option | Verdict |
|--------|---------|
| A. Empty + Flyway | **Preferred** |
| B. Copy of DEV | **Rejected** — copies test users, tenants, payments, PII |
| C. Migrations + extra manual master data | Only if something required is **not** in Flyway. Global catalog **is** in Flyway |

Space-scoped “sample combo” / history backfills operate on existing spaces; on an empty DB they do not create tenants.

**Do not** run Flyway from a laptop against PROD in this phase. First apply should be the PROD Backend process.

---

## 16. Backup / Rollback

**Application rollback ≠ database rollback.**

| Layer | Mechanism | Limitation |
|-------|-----------|------------|
| App (Backend/Web) | Git `main` SHA + Render previous deploy | Instant; does not un-apply SQL |
| DB | Supabase PITR/daily backups (configure before users) | Restore is a **project** event; coordinate downtime |
| Flyway | Forward migrations only | Do **not** `flyway clean`; do **not** edit applied checksums; do **not** “downgrade” V97→V96 on a live DB |

**Before real users (REQUIRES USER ACTION):**

1. Confirm Supabase PROD backups are on and tested (restore drill on a throwaway clone if possible).
2. Record how to redeploy the last good Render Backend and Web.
3. Treat every new `Vxx` migration as irreversible on PROD once applied.
4. If a bad migration ships: fix-forward with `V(n+1)`, or restore DB from backup + redeploy matching app SHA (explicit approval).

---

## 17. Monitoring

| Capability | Status |
|------------|--------|
| Spring logs (`info`) | **REQUIRED** — already in `prod` yml |
| Render logs | **REQUIRED** — use dashboard; no extra install |
| `GET /actuator/health` | **REQUIRED** — already exposed |
| Render health check on that path | **REQUIRED** — configure on PROD service |
| Flyway failure visibility | **REQUIRED** — startup logs; service will fail if migrate fails |
| Supabase disk/CPU/connections | **REQUIRED** — dashboard; paid alerts **OPTIONAL** |
| APM / Datadog / Sentry | **OPTIONAL** — not present |
| Uptime robot / external ping | **OPTIONAL** |
| Error tracking in clients | **NOT PRESENT** |
| Metrics beyond health | **NOT PRESENT** |

Do not install APM in this phase. Minimum for launch: Render health + logs + Supabase backups/alerts.

---

## 18. DEV Retirement

**Do not delete DEV now.**

Delete DEV Render (and only later, if ever, DEV Supabase) after **all** of:

- [ ] PROD Supabase created
- [ ] PROD schema initialized (Flyway v97+)
- [ ] PROD Backend live (`SPRING_PROFILES_ACTIVE=prod`)
- [ ] PROD Backend health verified
- [ ] PROD Web live
- [ ] SPA routing verified
- [ ] PROD Web → PROD Backend verified
- [ ] PROD CORS verified (no DEV origin)
- [ ] Authentication verified (ideally **real OTP**, not MVP code)
- [ ] Mobile release API verified against PROD
- [ ] Android release tested
- [ ] iOS release tested
- [ ] backups confirmed
- [ ] rollback documented
- [ ] monitoring available
- [ ] no production dependency on DEV remains (including Mobile debug, if debug should move to PROD or a new staging)

**Then** what can go:

1. Render DEV Web Static Site
2. Render DEV Backend Web Service
3. DEV custom domains if any (none verified)
4. DEV Supabase **only if** no one still develops against it — **RECOMMENDATION:** keep `acomi-dev` as the engineering database even after Render DEV is removed, or replace Render DEV with a cheaper always-on staging. Deleting DEV DB is optional and high-risk.

Mobile **debug** currently depends on `acomibackend.onrender.com`. Deleting DEV Backend without changing `env.ts` **breaks local debug**. Plan a staging API or keep DEV Backend for developers.

---

## 19. Server Portability

| Stays if Render → AWS (or any Docker host) | Changes |
|--------------------------------------------|---------|
| Spring Boot 3.5 / Java 17 | Render Web Service |
| Dockerfile / image | Render env UI → AWS secrets (SSM/Secrets Manager) |
| PostgreSQL + Flyway (Supabase can stay) | Render custom domain mapping → ALB/CloudFront + ACM |
| REST `/api/v1` | Render auto-deploy from Git → GitHub Actions/CodePipeline |
| JWT/CORS/app auth | Render health check field → ALB/ECS health |
| Web `dist/` SPA | Render Static Site → S3+CloudFront or similar; keep rewrite to `index.html` |
| Mobile API contract | Only if the public hostname changes |

**RECOMMENDATION:** keep Supabase as the logical PROD database when moving compute, so Flyway history and data stay put. Compute is disposable; the database is not.

---

## 20. Git / Release Strategy

```
develop  →  development work → Render DEV → Supabase DEV

production  →  production releases only → Render PROD (later AWS PROD) → Supabase PROD
```

Git `production` was fast-forwarded to the ACOMI `develop` HEAD on 2026-08-14. Do not merge `production` back into `develop` automatically. Do not delete `develop`. `main` is historical and is not the production release branch.

- Feature work stays on `develop`.
- Production hotfixes: branch from `production`, PR into `production`, tag, deploy; cherry-pick or merge back to `develop` only when needed so DEV does not drift.
- Tags: `backend-vX.Y.Z`, `web-vX.Y.Z`, mobile `versionName`/`versionCode` (today `1.0` / `1`).
- Mobile store releases are signed artifacts that must target the PROD API already deployed from Git `production`.

**Rollback:** Render previous deploy and/or `git revert` on `production`. Never force-push `production`. Never Flyway down.

---

## 21. Cost / Resources

**REQUIRED (later):**

- Supabase PROD project (backups/PITR typically paid)
- Render PROD Backend (recommend paid, always-on)
- Render PROD Web Static Site (usually cheap)
- Domain `acomi.app` + DNS
- Distinct production secrets (JWT, DB)

**MOBILE STORE:**

- Google Play Console
- Apple Developer Program

**OPTIONAL:**

- Monitoring/APM
- Real SMS OTP provider (required before public auth; cost later)
- Email / WhatsApp
- Analytics
- Staging Render + `staging-api.acomi.app`

Do not purchase in this phase.

---

## 22. Production Readiness Matrix

| Gate | Status |
|------|--------|
| ACOMI source on `production` | **Ready** (SHA == `develop` as of 2026-08-14) |
| ACOMI source on `main` | Historical; **not** used for PROD deploy |
| Local remotes use ACOMI URLs | **Not ready** — user action |
| Isolated PROD database | **Not ready** — Phase 6.2 |
| PROD Backend | **Not ready** — Phase 6.3 |
| PROD Web | **Not ready** — Phase 6.4 |
| DNS `api` / `app` | **Not ready** — names do not exist |
| CORS locked to PROD Web | **Not ready** — Phase 6.5 |
| Real OTP / SMS | **BLOCKER** for public users |
| Android release signing | **Not ready** — Phase 5.4 uncommitted; no keystore |
| Android arm64 in **committed** tree | **Not ready** until Phase 5.4 commit |
| AAB / IPA | **Not created** |
| Backups | **Not configured** (no PROD project) |
| DEV retirement | **Forbidden until checklist** |

---

## 23. Exact Next Phases

Git `production` is prepared. Next is isolated Supabase PROD. Do not connect Render PROD until that database exists.

| Phase | Purpose | Creates infra? |
|-------|---------|----------------|
| **6.1** | Create/configure isolated Supabase **PROD** (not DEV, not a branch of DEV); record pooler env; enable backups | Yes (DB) |
| **6.2** | Create Render PROD Backend from Git `production` + Docker + `prod` profile + PROD DB | Yes |
| **6.3** | Create Render PROD Web from Git `production` + `VITE_API_BASE_URL` pointing at PROD API | Yes |
| **6.4** | Custom domains `api.acomi.app` / `app.acomi.app` (after user DNS decision) + CORS | Yes (DNS) |
| **6.5** | Internal E2E: health, SPA, CORS, 401, **controlled** auth smoke | No (validate) |
| **6.5b** | Replace MVP OTP with a real provider (or disable public signup) — **BLOCKER** for real users | Source + vendor |
| **6.6** | Confirm Mobile release API; only change `env.ts` if the hostname is not `api.acomi.app` | Maybe source |
| **6.7** | Commit Phase 5.4; create keystore with approval; arm64 AAB; cache clean after folder rename | Signing + artifact |
| **6.8** | iOS release signing, ATS confirm, TestFlight | Artifact |
| **6.9** | Store listings, privacy, content rating | Store |

**Do not** start 6.1 automatically. Wait for approval. DEV Render/Supabase stay up.

---

## Safety confirmation (Phase 6.0)

| Item | Status |
|------|--------|
| Source changes | **Only this planning document** |
| Render | **NOT TOUCHED** |
| Supabase | **NOT TOUCHED** |
| Database | **NOT TOUCHED** |
| Git branches | **`production` fast-forwarded to `develop` HEAD in all three repos; `develop` still checked out** |
| Commits / pushes | **No new commits.** Fast-forward push of existing `develop` SHAs to `origin/production` only |
| Secrets | **NOT PRINTED** |
| OTP / users / app data | **NOT USED / NOT MODIFIED** |
| Mobile Phase 5.4 dirty tree | **LEFT AS-IS** |

**Final verdict: READY FOR PHASE 6.1**
