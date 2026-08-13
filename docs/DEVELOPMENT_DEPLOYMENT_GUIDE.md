# ACOMI — Development Deployment Guide

**Document type:** Engineering runbook (Backend + Web develop environment)  
**Version:** 1.0  
**Date:** 2026-08-12  
**Scope:** Recreate and operate the verified ACOMI **development** deployment.  
**Out of scope:** Performing production cutover (planned only; not executed here).

> **Secrets policy:** This document never includes passwords, JWT values, access tokens, OTP codes, smoke-test mobile numbers, or database connection strings with credentials. Configure secrets only in Render / Supabase dashboards or local shell env vars.

> **Product rename note (2026-08-14):** Product identity is **ACOMI** (Accommodation + Meals). Repository code/config uses `com.acomi`, `acomi-*` hosts such as `acomibackend.onrender.com`, and `acomi.*` config keys. Workspace folders and current GitHub remotes may still use *Amico* names until optionally renamed. Older cloud resources created as `amicobackend.onrender.com` / Supabase `amico-dev` are external leftovers — recreate or rename them for the ACOMI fresh deploy.

---

## Table of contents

1. [Purpose and how to use this document](#1-purpose-and-how-to-use-this-document)
2. [Architecture](#2-architecture)
3. [Verified source of truth](#3-verified-source-of-truth)
4. [Development vs production](#4-development-vs-production)
5. [Backend — technology and configuration](#5-backend--technology-and-configuration)
6. [Backend — environment variables](#6-backend--environment-variables)
7. [Backend — profiles, database, Flyway](#7-backend--profiles-database-flyway)
8. [Backend — security, Actuator, Swagger, logging](#8-backend--security-actuator-swagger-logging)
9. [Backend — Docker and Render](#9-backend--docker-and-render)
10. [Backend — deployment procedure](#10-backend--deployment-procedure)
11. [Backend — validation procedure](#11-backend--validation-procedure)
12. [Web — technology and configuration](#12-web--technology-and-configuration)
13. [Web — Render Static Site](#13-web--render-static-site)
14. [Web — deployment procedure](#14-web--deployment-procedure)
15. [CORS](#15-cors)
16. [End-to-end development flow](#16-end-to-end-development-flow)
17. [Common problems encountered](#17-common-problems-encountered)
18. [Future production deployment plan](#18-future-production-deployment-plan)
19. [Security checklist](#19-security-checklist)
20. [Rollback / recovery](#20-rollback--recovery)
21. [Release checklist](#21-release-checklist)
22. [Verified development deployment milestones](#22-verified-development-deployment-milestones)
23. [Current state](#23-current-state)

---

## 1. Purpose and how to use this document

Use this runbook when you need to:

- Recreate the **develop** Backend (Render Web Service + Docker) and Web (Render Static Site).
- Confirm which Git commits, branches, profiles, and env vars the develop stack depends on.
- Diagnose CORS, SPA routing, Flyway, cold-start, or TypeScript build failures.
- Plan production **without** converting the develop services in place.

**Evidence labels used below:**

| Label | Meaning |
|-------|---------|
| **Repository-verified** | Confirmed from local Backend/Web Git repos and config files on 2026-08-12. |
| **Historical deployment record** | Confirmed during the Aug 2026 deployment phases; may need re-check against live dashboards. |
| **Needs verification** | Not independently confirmed in this documentation pass. |

**Action type labels used in procedures:**

| Label | Meaning |
|-------|---------|
| `LOCAL COMMAND` | Run on a developer machine |
| `RENDER DASHBOARD ACTION` | Configure or observe in Render UI |
| `SUPABASE ACTION` | Configure or observe in Supabase UI |
| `GITHUB ACTION` | Push / PR / branch operations on GitHub |

---

## 2. Architecture

### 2.1 High-level flow

```
┌─────────────────┐
│  User Browser   │
└────────┬────────┘
         │ HTTPS
         ▼
┌─────────────────────────────────────────┐
│  ACOMI Web (React / Vite SPA)           │
│  Render Static Site                     │
│  https://acomiwebapp.onrender.com       │
└────────┬────────────────────────────────┘
         │ HTTPS JSON API
         │ Authorization: Bearer <JWT>
         │ Origin: https://acomiwebapp.onrender.com
         ▼
┌─────────────────────────────────────────┐
│  ACOMI Backend (Spring Boot)            │
│  Render Web Service (Docker)            │
│  https://acomibackend.onrender.com      │
│  Profile: SPRING_PROFILES_ACTIVE=dev    │
└────────┬────────────────────────────────┘
         │ JDBC (SSL) via Session Pooler
         ▼
┌─────────────────────────────────────────┐
│  Supabase PostgreSQL                    │
│  Project: acomi-dev                     │
│  Database: postgres                     │
│  Schema: Flyway-managed                 │
└─────────────────────────────────────────┘
```

**Mobile (future / parallel client):** React Native ACOMI Mobile consumes the **same** Backend API (`/api/v1/...`). Develop Mobile should point at the develop Backend URL when remote testing; local Mobile may still use laptop `:8080`. Mobile is not deployed by this Web/Backend runbook.

### 2.2 Component responsibilities

| Component | Responsibility |
|-----------|----------------|
| **React/Vite Web** | Browser SPA: auth UX, dashboards, feature modules. Talks only to Backend HTTP API. Builds static assets into `dist/`. |
| **Spring Boot Backend** | Auth (OTP + JWT), authorization, business APIs, JPA, Flyway migrations, CORS, Actuator health. |
| **Render** | Hosts Backend container and Web static site; injects `PORT` and env vars; builds from GitHub `develop`. |
| **Supabase** | Managed PostgreSQL for develop (`acomi-dev`) and future production (`acomi-prod`). |
| **Flyway** | Versioned schema migrations under `classpath:db/migration` (domain subfolders). Applied on Backend startup. |
| **GitHub** | Source of truth for Backend (`AcomiBackend`) and Web (`AcomiWebApp`) branches and commits. |
| **Environment variables** | Provide secrets and environment-specific URLs/hosts at **runtime** (Backend) or **build time** (Vite `VITE_*`). |

### 2.3 Development vs future production targets

| Layer | DEVELOPMENT (current) | PRODUCTION (future) |
|-------|----------------------|---------------------|
| Web URL | `https://acomiwebapp.onrender.com` | Future production URL — **do not invent**; set when created |
| Backend URL | `https://acomibackend.onrender.com` | Future production URL — **do not invent**; set when created |
| Database | Supabase **acomi-dev** / `postgres` | Supabase **acomi-prod** / `postgres` |
| Git branch (MVP path) | `develop` | Dedicated production branch/tag (repo has `production`) |
| Spring profile | `dev` | `prod` |

---

## 3. Verified source of truth

Inspected on **2026-08-12** from local clones.

### 3.1 Backend

| Item | Value |
|------|-------|
| Local path | `K:\Projects\Amico\Backend\amico-backend` |
| GitHub | `https://github.com/ketankumbhar204/AmicoBackend.git` |
| Branch | `develop` (**Repository-verified**; tracks `origin/develop`) |
| HEAD / `origin/develop` | `ab0b68417e7cf81669c0a59793adbf27d68c36b6` |
| HEAD message | `build: add Docker support for Render deployment` |
| Prior key commit | `1b6ed59` — `refactor: configure backend for multiple environments` (2026-08-11) |
| Other branches | `main`, `production` (present locally and on origin) |

**Local working-tree note (2026-08-12):** Backend clone may show unrelated `hs_err_pid15632.log` deletion and/or CRLF “phantom” modifications on YAML/Java files. Do **not** commit those unless intentionally reviewed. Deployed source of truth is the pushed `develop` commit, not dirty local trees.

### 3.2 Web

| Item | Value |
|------|-------|
| Local path | `K:\AmicoWeb` |
| GitHub | `https://github.com/ketankumbhar204/AmicoWebApp.git` |
| Branch | `develop` (**Repository-verified**; tracks `origin/develop`) |
| HEAD / `origin/develop` | `b0c4f448743f51267bc03d7327b18cad04dbc15d` |
| HEAD message | `fix: resolve web TypeScript build errors` |
| Prior key commit | `a4374b7` — `refactor: rename application from CountIn to Amico` (2026-08-11); later Amico → ACOMI |
| Other branches | `main`, `production` |

### 3.3 Live URLs (spot-check 2026-08-12)

| Check | Result |
|-------|--------|
| Web `/` and `/login` | HTTP **200** (**Repository/live-verified**) |
| Backend `/actuator/health` | Historically **200 / UP** during Phase 4.x; this documentation pass also observed **cold-start timeouts** (HTTP 000 / curl exit 28 after ~180s). Treat Backend as **operational when warm**, with free-tier spin-down risk. |

---

## 4. Development vs production

This is the most important operational rule set.

### 4.1 Comparison table

| Area | Develop | Production |
|------|---------|------------|
| Git branch | `develop` | Dedicated `production` branch/tag (review/release process) |
| Spring profile | `dev` | `prod` |
| Database | `acomi-dev` | `acomi-prod` |
| DB credentials | DEV-only Render env | PROD-only Render env (**never reuse**) |
| JWT secret | DEV-only `JWT_SECRET` | Separate PROD `JWT_SECRET` (**never reuse**) |
| CORS | Exact Web origin `https://acomiwebapp.onrender.com` | Exact future production Web origin(s) only |
| Swagger | Prefer `SWAGGER_ENABLED=false` on Render | Default `false` in `application-prod.yml`; keep disabled unless explicitly approved |
| Logging | Info; SQL warn on `dev` | Info; SQL warn; Flyway warn on `prod` |
| Flyway | Enabled; **clean-disabled: true** on `dev` | Enabled; **clean-disabled: true**; review every migration before release |
| Render Backend | Develop Web Service (Docker) | Separate production Web Service |
| Render Web | Develop Static Site | Separate production Static Site |
| Web URL | `https://acomiwebapp.onrender.com` | Future production URL |
| API URL (Vite) | `https://acomibackend.onrender.com/api/v1` | Future production Backend `/api/v1` |
| Testing | Dev smoke + OTP MVP path | Production smoke with production secrets; no casual OTP user creation |
| Release approval | Push to `develop` + Render auto/manual deploy | Explicit release candidate → production deploy |

### 4.2 Hard DO NOTs

- **DO NOT** point develop Backend at **acomi-prod**.
- **DO NOT** reuse **DEV** `JWT_SECRET` in production.
- **DO NOT** reuse **DEV** `DB_PASSWORD` in production.
- **DO NOT** allow unnecessary `localhost` origins in production CORS.
- **DO NOT** use CORS `*`, especially with `allowCredentials=true`.
- **DO NOT** deploy unreviewed `develop` commits directly as production.
- **DO NOT** bake secrets into Docker images, Git, or `VITE_*` variables.
- **DO NOT** enable Flyway clean against shared/remote databases.

---

## 5. Backend — technology and configuration

**Repository-verified** from `pom.xml`, Docker files, and `application*.yml`.

### 5.1 Technology

| Item | Value |
|------|-------|
| Language | Java **17** (`pom.xml` `<java.version>`) |
| Framework | Spring Boot **3.5.14** |
| Build | Maven + **Maven Wrapper** (`mvnw` / `mvnw.cmd`) |
| Artifact | `com.acomi:acomi-backend:0.0.1-SNAPSHOT` |
| Packaging | JAR |
| JAR name | `acomi-backend-0.0.1-SNAPSHOT.jar` (copied to `app.jar` in Docker runtime) |
| PostgreSQL driver | Runtime dependency |
| Migrations | Flyway Core + `flyway-database-postgresql` |
| Flyway version (BOM) | **11.7.2** via Spring Boot 3.5.14 dependency management (**Repository-verified** from local Maven BOM cache) |
| Security | Spring Security + JJWT **0.12.6** |
| API docs | springdoc-openapi **2.8.9** |
| Health | `spring-boot-starter-actuator` |

### 5.2 Key config files

| File | Role |
|------|------|
| `src/main/resources/application.yml` | Base config: default profile `local`, port `${PORT:8080}`, Flyway defaults, Actuator exposure, JWT expiration, OTP MVP property key, CORS default localhost, Swagger gated by `SWAGGER_ENABLED` |
| `application-local.yml` | Local Postgres (`acomi_db` defaults); local JWT default; Flyway clean **allowed** locally; verbose SQL logging |
| `application-dev.yml` | Render develop + Supabase acomi-dev; **all** DB/JWT/CORS from env; SSL JDBC; Flyway clean **disabled** |
| `application-prod.yml` | Future production + acomi-prod; env-driven; Swagger default **false**; Flyway clean **disabled** |
| `SecurityConfig.java` | Stateless JWT filter chain; public auth + health + swagger paths |
| `CorsConfig.java` / `CorsProperties.java` | Exact-origin CORS from `acomi.cors.allowed-origins` |
| `JwtProperties` / `JwtService` / `JwtAuthenticationFilter` | Bearer JWT |
| `OtpProperties` / `OtpService` | MVP OTP verification; **does not log OTP or full mobile numbers** |

### 5.3 Default profile

```yaml
spring.profiles.active: ${SPRING_PROFILES_ACTIVE:local}
```

- Local laptop default: **`local`**
- Render develop: set **`SPRING_PROFILES_ACTIVE=dev`**

---

## 6. Backend — environment variables

Configure on **Render → Web Service → Environment**.  
Do **not** commit values. Do **not** put them in the Dockerfile.

| Name | Purpose | Required on Render `dev` | Development value / source | Secret? | Where configured | Committed to Git? |
|------|---------|--------------------------|----------------------------|---------|------------------|-------------------|
| `SPRING_PROFILES_ACTIVE` | Activates `local` / `dev` / `prod` | Yes | `dev` | No | Render env | No (name only in docs/yml) |
| `DB_HOST` | Postgres host | Yes | Supabase Session Pooler host (e.g. `aws-0-ap-south-1.pooler.supabase.com`) — **Historical deployment record** | No (semi-sensitive) | Render env | No |
| `DB_PORT` | Postgres port | Optional (default 5432) | `5432` | No | Render env | Default in yml |
| `DB_NAME` | Database name | Optional (default `postgres` on `dev`) | `postgres` | No | Render env | Default in yml |
| `DB_USERNAME` | DB user | Yes | Tenant-scoped pooler form `postgres.<project-ref>` — **Historical deployment record** | Semi-sensitive | Render env | No |
| `DB_PASSWORD` | DB password | Yes | Supabase DB password for **acomi-dev only** | **YES** | Render env / Supabase | **No** |
| `JWT_SECRET` | HS256 signing key | Yes on `dev`/`prod` (no default) | Strong DEV-only secret (≥ 256 bits for HS256) | **YES** | Render env | **No** (local profile has a local-only default in `application-local.yml` — never reuse for Render) |
| `JWT_EXPIRATION_MS` | Token lifetime | Optional | Default `86400000` (24h) in `application.yml` | No | Render env or default | Default in yml |
| `CORS_ALLOWED_ORIGINS` | Comma-separated browser origins | Yes on `dev` | `https://acomiwebapp.onrender.com` | No | Render env | No |
| `PORT` | HTTP listen port | Injected by Render | Render-provided (successful develop runtime historically used **10000**) | No | Render runtime | Bound via `${PORT:8080}` |
| `SWAGGER_ENABLED` | Enable springdoc UI/docs | Recommended set | Prefer `false` on public Render URL | No | Render env | Defaults in yml |

**Additional property (not typically an env var):**

| Property | Notes |
|----------|-------|
| `acomi.otp.mvp-code` | MVP fixed OTP code lives in `application.yml`. Treat as non-production auth shortcut. Do not log it. Replace with a real OTP provider before hardening production auth. |

**Local-only defaults warning:** `application-local.yml` contains local developer defaults for DB password and JWT secret so laptops can boot without exporting env vars. Those defaults must **never** be copied into Render or Supabase production/develop dashboards as “the” secret.

---

## 7. Backend — profiles, database, Flyway

### 7.1 Profiles summary

| Topic | `local` | `dev` (Render develop) | `prod` (future) |
|-------|---------|------------------------|-----------------|
| DB | Local Postgres `acomi_db` defaults | Env + `sslmode=require` → acomi-dev | Env + SSL → acomi-prod |
| Secrets | Local defaults allowed | **Required** from env | **Required** from env |
| Flyway clean | `clean-disabled: false` | `true` | `true` |
| Swagger | Enabled | `${SWAGGER_ENABLED:true}` (override to false on Render) | Default false |
| SQL logging | Debug/trace | Warn | Warn |
| CORS | Default localhost:5173 or env | **Must** set env to Web origin | Exact prod Web origin(s) |

### 7.2 Database (develop)

| Item | Value |
|------|-------|
| Provider | Supabase |
| Project | **acomi-dev** |
| Database name | `postgres` |
| Connectivity used in develop | **Session Pooler** + SSL (`sslmode=require` in JDBC URL) — **Historical deployment record** + **Repository-verified** URL shape in `application-dev.yml` |
| JDBC shape (`dev`) | `jdbc:postgresql://${DB_HOST}:${DB_PORT:5432}/${DB_NAME:postgres}?sslmode=require` |
| Username form | Pooler requires `postgres.<project-ref>`, not bare `postgres` — **Historical deployment record** |
| Separation | Never share credentials or host with **acomi-prod** |

### 7.3 Flyway

| Item | Value |
|------|-------|
| Enabled | `true` (base `application.yml`) |
| Locations | `classpath:db/migration` |
| Layout | Domain subfolders (`user/`, `space/`, `meal/`, `payment/`, …) with `V{n}__*.sql` |
| Naming | `V<version>__<description>.sql` |
| Scripts in Git | **97** files, versions **V1–V97** contiguous (**Repository-verified** 2026-08-12); latest includes `V97__exclude_extras_from_menu_history.sql` |
| `baseline-on-migrate` | `true` |
| `clean-disabled` | `true` on base + `dev` + `prod`; `false` only on `local` |
| Hibernate DDL | `validate` (schema must match migrations) |

**Historical deployment record (acomi-dev first init):**

- Flyway reported schema version **v97**
- **97/97** migrations successful
- Schema up to date
- Approximately **62** public tables including Flyway history

**How to verify (SUPABASE ACTION / LOCAL COMMAND):**

1. After Backend is **Live** and warm, confirm app starts without Flyway errors in Render logs.
2. In Supabase SQL editor (acomi-dev only): inspect `flyway_schema_history` for latest `version` / `success`.
3. Do **not** run `flyway clean` against remote DBs.

**What NOT to do:**

- Do not delete or edit applied migration files that already ran on shared environments.
- Do not point a random branch with divergent migrations at acomi-prod.
- Do not “fix” schema drift by manual DROP in production.

---

## 8. Backend — security, Actuator, Swagger, logging

### 8.1 Authentication model

1. Client calls public `POST /api/v1/auth/send-otp` and `POST /api/v1/auth/verify-otp`.
2. On successful verify, Backend issues a JWT.
3. Subsequent requests send `Authorization: Bearer <token>`.
4. `JwtAuthenticationFilter` validates Bearer tokens; unauthenticated protected routes return **401**.

**Public endpoints** (`SecurityConfig`):

- `/api/v1/auth/send-otp`
- `/api/v1/auth/verify-otp`
- `/actuator/health`, `/actuator/health/**`
- `/v3/api-docs/**`, `/swagger-ui/**`, `/swagger-ui.html`

**Everything else** under the API requires authentication.

### 8.2 Actuator

| Setting | Value |
|---------|-------|
| Exposed | `health` only |
| `show-details` | `never` |
| Probes | enabled |
| Expected | `GET /actuator/health` → HTTP **200**, body includes `"status":"UP"` when service is warm |

### 8.3 Swagger / springdoc

| Profile | Behavior |
|---------|----------|
| Base | `${SWAGGER_ENABLED:true}` |
| `prod` yml default | `false` |
| Render develop recommendation | Set `SWAGGER_ENABLED=false` on the public service |

When disabled, `/swagger-ui.html` / api-docs should not be usefully exposed (still listed in security permit list, but springdoc disabled). Prefer keeping disabled on internet-facing develop too.

### 8.4 Logging restrictions (**Repository-verified**)

`OtpService` intentionally logs only generic messages (“MVP OTP dispatch requested”, “OTP verified successfully”) and **must not** log OTP codes or full mobile numbers.

`dev`/`prod` keep Hibernate SQL at **warn**. `local` may enable SQL debug for development.

### 8.5 Secrets handling

- Never commit `DB_PASSWORD`, `JWT_SECRET`, keystores, or tokens.
- Never put secrets in Docker `ENV`/`ARG` that persist in image layers for runtime secrets.
- Never put secrets in Vite `VITE_*` (they are bundled into public JS).

---

## 9. Backend — Docker and Render

### 9.1 Why Docker?

Render develop Backend uses a **Dockerfile** so the build is reproducible (JDK build + JRE runtime) without relying on Render’s native Maven native environment quirks. Commit **`ab0b684`** added `Dockerfile` + `.dockerignore`.

### 9.2 Dockerfile (summary)

**Build stage** (`eclipse-temurin:17-jdk-jammy`):

1. Copy `mvnw`, `pom.xml`, `.mvn`, `src`
2. `chmod +x mvnw`
3. `./mvnw -B clean package -DskipTests`

**Runtime stage** (`eclipse-temurin:17-jre-jammy`):

1. Create non-root user `acomi`
2. Copy `acomi-backend-0.0.1-SNAPSHOT.jar` → `app.jar`
3. `USER acomi`
4. `EXPOSE 8080` (documentation only; actual bind uses `PORT`)
5. `ENTRYPOINT ["java","-jar","app.jar"]`

**Security notes:**

- No secrets in image.
- Profile/DB/JWT/CORS come from Render runtime env.
- Tests skipped in image build (`-DskipTests`) for MVP deploy speed; run tests locally when practical.

### 9.3 `.dockerignore`

Excludes `.git`, `target`, IDE files, `*.log`, `hs_err_pid*`, etc., to keep build context small and avoid shipping crash dumps.

### 9.4 Render Web Service (develop)

| Item | Value |
|------|-------|
| Service type | **Web Service** |
| Repo | `AcomiBackend` |
| Branch | `develop` |
| Deploy method | **Docker** (Dockerfile at repo root) |
| Health check path | `/actuator/health` (**Historical deployment record**) |
| Public URL | `https://acomibackend.onrender.com` |
| Runtime command | Image ENTRYPOINT `java -jar app.jar` |

### 9.5 Render `PORT` behavior

Render injects **`PORT`**. Spring Boot binds with:

```yaml
server.port: ${PORT:8080}
```

The process **must** listen on Render’s `PORT` or the deploy fails port detection. **Historical deployment record:** successful develop instance used port **10000**. Do not hardcode `8080` as the only listen port in container config.

### 9.6 Cold start / free tier

**Historical deployment record + re-observed 2026-08-12:** free-tier Backend may spin down; first request can take **~120–180+ seconds** or time out. Retry health checks after wake. Web static site remains available even if Backend is asleep.

---

## 10. Backend — deployment procedure

### 10.1 Pre-deploy (LOCAL COMMAND)

```powershell
cd K:\Projects\Amico\Backend\amico-backend
git fetch origin
git switch develop
git status
git rev-parse HEAD
git log -1 --oneline
git diff
```

Checklist:

1. Branch is `develop`.
2. Intended commit is reviewed (or you are about to commit only intentional files).
3. No secrets in diff.
4. Leave unrelated `hs_err_pid*` alone.
5. Confirm `application-dev.yml` still requires env for DB/JWT/CORS.
6. Optional local build:

```powershell
.\mvnw.cmd -B clean package
# or faster parity with Docker:
.\mvnw.cmd -B clean package -DskipTests
```

**Tests note (Historical deployment record):** unit suite previously showed on the order of ~310 tests with some failures/errors. Docker/Render build uses `-DskipTests`. Do not assume green tests without re-running.

### 10.2 Commit / push (only when intentionally releasing)

```powershell
# Stage only intentional files — never hs_err_pid*
git add Dockerfile .dockerignore   # example for Docker commit
git commit -m "build: add Docker support for Render deployment"
git push -u origin develop
```

`GITHUB ACTION`: ensure `origin/develop` matches the commit Render should deploy.

### 10.3 Render configuration (RENDER DASHBOARD ACTION)

1. Create or open Backend Web Service.
2. Connect `ketankumbhar204/AmicoBackend`, branch `develop`.
3. Select Docker runtime / Dockerfile deploy.
4. Set environment variables from [Section 6](#6-backend--environment-variables).
5. Set health check to `/actuator/health`.
6. Deploy and wait until **Live**.
7. Open Render logs; confirm Flyway migrate + Tomcat started on `$PORT`.

### 10.4 Supabase (SUPABASE ACTION)

1. Confirm project is **acomi-dev** (not acomi-prod).
2. Confirm pooler host/user/password match Render env.
3. After first successful boot, verify `flyway_schema_history`.

### 10.5 Post-deploy validation

Follow [Section 11](#11-backend--validation-procedure).

---

## 11. Backend — validation procedure

### 11.1 Health

```powershell
curl.exe -s -w "`nHTTP=%{http_code}`n" --max-time 180 https://acomibackend.onrender.com/actuator/health
```

**Expected (warm service):**

- HTTP **200**
- JSON includes `"status":"UP"`

If timeout/000: wait and retry (cold start).

### 11.2 Unauthenticated protected API

```powershell
curl.exe -s -D - -o - https://acomibackend.onrender.com/api/v1/auth/me
```

**Expected:** HTTP **401** with an authentication-required message.  
This proves security is on — not a failure by itself.

### 11.3 CORS checks

See [Section 15](#15-cors).

### 11.4 Development smoke-user testing (historical)

**Historical deployment record:**

- A dedicated smoke mobile number was authorized for **acomi-dev** OTP testing.
- Successful verify created **one additional user** row in develop DB.
- Purpose: prove JWT issuance and authenticated GET paths against acomi-dev.

**Rules for future smoke tests:**

- Use **acomi-dev only**.
- Do **not** casually repeat on **acomi-prod**.
- Do **not** paste mobile numbers, OTPs, or JWTs into tickets/docs/chat logs.
- Understand that `verify-otp` **creates persistent user data** if the user did not exist (`AuthService` create-on-verify behavior).
- Prefer read-only authenticated GETs after login; avoid creating spaces/members/payments unless approved.
- Clean up smoke users only with an explicit, reviewed procedure.

---

## 12. Web — technology and configuration

**Repository-verified** from `package.json`, Vite/TS config, env helpers, API client.

### 12.1 Technology

| Item | Value |
|------|-------|
| App name | `acomi-web` `0.1.0` |
| UI | React **^19.2.7** |
| Bundler | Vite **^8.1.1** |
| Language | TypeScript **~6.0.2** (strict) |
| Node | README: **Node.js 22+** (no `engines` field in `package.json`) |
| Package manager | **npm** + `package-lock.json` (lockfileVersion 3) |
| Router | `react-router-dom` **^7** (`createBrowserRouter`) — SPA |
| HTTP | Axios |
| Server state | TanStack Query |
| Client auth state | Zustand + `localStorage` |

### 12.2 Environment configuration

| File | Role |
|------|------|
| `.env.example` | Documents `VITE_API_BASE_URL=/api/v1`, timeout, `VITE_APP_ENV=development` |
| `.env` | Local only; **gitignored** |
| `src/shared/config/env.ts` | Reads `import.meta.env`; defaults API to `http://localhost:8080/api/v1` if unset |
| `vite.config.ts` | Dev server port **5173**; proxies `/api` → `http://localhost:8080` |

**Local vs deployed API base URL:**

| Context | `VITE_API_BASE_URL` | Why |
|---------|---------------------|-----|
| Local Vite | `/api/v1` (relative) | Proxy avoids browser CORS during local dev |
| Render Static Site build | `https://acomibackend.onrender.com/api/v1` | Absolute Backend URL baked into JS at **build time** |

**Critical:** Vite embeds `VITE_*` into the client bundle. They are **public**. Never put secrets there.

### 12.3 Auth token storage

| Item | Value |
|------|-------|
| Token key | `acomi.auth.token` (`STORAGE_KEYS.authToken`) |
| User key | `acomi.auth.user` |
| Storage | `localStorage` via `src/shared/utils/storage.ts` |
| Axios | Attaches `Authorization: Bearer …`; on 401 clears token and routes to `/unauthorized` (except send/verify OTP URLs) |

### 12.4 Build

```bash
npm ci
npm run build
```

`npm run build` runs:

1. `tsc -b` — project references typecheck (**must pass**)
2. `vite build` — emit `dist/`

### 12.5 Historical TypeScript build failure

**Historical deployment record** (fixed in `b0c4f44`):

- `npm run build` failed with approximately **62** TypeScript errors under strict settings.
- Categories included: missing imports; MUI v9 prop typing (`PaperProps` / `slotProps` / etc.); nullable/optional mismatches; unused locals/imports; API response typing; Lucide icon typing; theme/`sx` typing; other strictness issues.
- Fix commit: **`b0c4f44`** — `fix: resolve web TypeScript build errors` (35 files).
- Result after fix: TypeScript **PASS**, Vite **PASS**, exit code **0**.
- Do **not** bypass `tsc` to “make Render green.”

---

## 13. Web — Render Static Site

| Item | Value |
|------|-------|
| Service type | **Static Site** |
| Repo | `AcomiWebApp` |
| Branch | `develop` |
| Verified commit | `b0c4f44` |
| Build command | `npm ci && npm run build` |
| Publish directory | `dist` |
| URL | `https://acomiwebapp.onrender.com` |
| `render.yaml` in repo | **Not present** (**Repository-verified**) — configure in Render dashboard |

### 13.1 Build-time env vars (RENDER DASHBOARD ACTION)

| Variable | Develop value | Secret? |
|----------|---------------|---------|
| `VITE_API_BASE_URL` | `https://acomibackend.onrender.com/api/v1` | No (public) |
| `VITE_APP_ENV` | `production` recommended for deployed bundle mode label | No |
| `VITE_API_TIMEOUT_MS` | `30000` optional | No |

After changing `VITE_*`, you must **rebuild** the Static Site (values are compile-time).

### 13.2 SPA rewrite (required)

React Router uses browser paths (`/login`, `/spaces/...`). The static host must serve `index.html` for unknown paths.

| Field | Value |
|-------|-------|
| Source | `/*` |
| Destination | `/index.html` |
| Action | **Rewrite** |

Without this, deep links return **404** from the CDN/static host even though client routes exist.

---

## 14. Web — deployment procedure

### 14.1 Local verify (LOCAL COMMAND)

```powershell
cd K:\AmicoWeb
git fetch origin
git switch develop
git status
git rev-parse HEAD
git log -1 --oneline

npm ci
npm run build
```

Confirm:

- Exit code 0
- `dist/` contains `index.html` and hashed assets under `dist/assets/`

Optional: search built assets for the API base (should contain Backend URL after a production-like build with env set):

```powershell
$env:VITE_API_BASE_URL = "https://acomibackend.onrender.com/api/v1"
$env:VITE_APP_ENV = "production"
npm run build
Select-String -Path dist\assets\*.js -Pattern "acomibackend.onrender.com/api/v1" | Select-Object -First 3
```

### 14.2 Push (GITHUB ACTION)

```powershell
git push origin develop
```

### 14.3 Render Static Site (RENDER DASHBOARD ACTION)

1. Create/update Static Site from `AcomiWebApp` / `develop`.
2. Build: `npm ci && npm run build`
3. Publish: `dist`
4. Set `VITE_API_BASE_URL` (and optional Vite vars).
5. Configure SPA rewrite `/*` → `/index.html` (Rewrite).
6. Deploy; wait until **Live**.

### 14.4 Post-deploy checks

| Check | Method | Expected |
|-------|--------|----------|
| Root | `GET https://acomiwebapp.onrender.com/` | 200 + `#root` |
| Login deep link | `GET /login` | 200 + SPA shell (rewrite works) |
| Other routes | `/unauthorized`, `/dashboard`, etc. | 200 + SPA shell |
| Assets | JS/CSS from index | 200 |
| API URL in bundle | Search `apiRequest-*.js` / index chunk | contains `https://acomibackend.onrender.com/api/v1` |
| CORS | See Section 15 | ACAO exact Web origin |
| Unauth API | `/api/v1/auth/me` from browser network | 401, not CORS error |

---

## 15. CORS

### 15.1 Current develop allowlist

| Item | Value |
|------|-------|
| Web Origin | `https://acomiwebapp.onrender.com` |
| Backend | `https://acomibackend.onrender.com` |
| Backend env | `CORS_ALLOWED_ORIGINS=https://acomiwebapp.onrender.com` |
| Credentials | `allowCredentials=true` in `CorsConfig` |
| Methods | GET, POST, PUT, PATCH, DELETE, OPTIONS |
| Allowed headers | Authorization, Content-Type, Accept |
| Exposed headers | Authorization |
| Max age | 3600 |

**Why not `*`:** Browser CORS forbids `Access-Control-Allow-Origin: *` together with credentialed/cookie-like flows; ACOMI enables credentials and uses Bearer tokens from a browser SPA. Exact origins only.

### 15.2 How it is implemented

1. Render sets `CORS_ALLOWED_ORIGINS`.
2. `application-dev.yml` maps it to `acomi.cors.allowed-origins`.
3. `CorsProperties` binds the string; `CorsConfig` splits on commas and registers `/**`.
4. Spring Security enables CORS via `.cors(Customizer.withDefaults())`.

### 15.3 Test (LOCAL COMMAND — no secrets)

**Preflight:**

```powershell
curl.exe -s -D - -o NUL -X OPTIONS `
  https://acomibackend.onrender.com/api/v1/auth/me `
  -H "Origin: https://acomiwebapp.onrender.com" `
  -H "Access-Control-Request-Method: GET" `
  -H "Access-Control-Request-Headers: authorization,content-type"
```

**Expected:** HTTP 200; `access-control-allow-origin: https://acomiwebapp.onrender.com` (not `*`).

**Actual request:**

```powershell
curl.exe -s -D - -o - -X GET `
  https://acomibackend.onrender.com/api/v1/auth/me `
  -H "Origin: https://acomiwebapp.onrender.com" `
  -H "Accept: application/json"
```

**Expected:** HTTP **401** + same ACAO header.  
401 with ACAO = security OK + CORS OK.  
Browser “CORS error” with missing ACAO = fix Backend env and **redeploy/restart** Backend.

### 15.4 Diagnosing browser CORS errors

1. Confirm request URL host is `acomibackend.onrender.com` (not localhost, not wrong service).
2. Confirm `Origin` is exactly the Web site origin (scheme + host, no path).
3. Confirm Render `CORS_ALLOWED_ORIGINS` matches exactly (no trailing slash).
4. Redeploy Backend after env changes.
5. Distinguish network/cold-start failures from CORS (failed preflight vs 401 JSON).

---

## 16. End-to-end development flow

```
Developer
   │
   │  commit + push develop
   ▼
GitHub (AcomiBackend / AcomiWebApp develop)
   │
   ├──────────────────────────────┐
   ▼                              ▼
Backend Docker build            Web npm ci && npm run build
   │                              │
   ▼                              ▼
Render Web Service              Render Static Site (dist)
   │                              │
   ▼                              │
Supabase acomi-dev ◄── JDBC ─────┤
   │                              │
   ▼                              │
Backend health UP                 │
   │                              │
   ▼                              ▼
CORS allow Web origin ◄──────── Browser loads SPA
   │                              │
   └──────── API /api/v1 ─────────┘
```

**Dependencies:**

1. acomi-dev must exist and accept pooler+SSL before Backend can stay healthy.
2. Backend must be Live before Web can successfully call APIs (Web can still load static shell).
3. `VITE_API_BASE_URL` must match Backend URL **before** Web build.
4. CORS must allow Web origin **before** browser XHR/fetch succeeds.
5. SPA rewrite must exist **before** deep links work.

---

## 17. Common problems encountered

Only issues known from ACOMI deployment history / repo evidence. Each entry states verification level.

### 17.1 Supabase pooler username rejected

| | |
|--|--|
| **Problem** | Backend cannot authenticate to Postgres via pooler. |
| **Cause** | Session pooler expects username `postgres.<project-ref>`, not `postgres`. |
| **Diagnosis** | Render logs show auth/FATAL from Postgres; connection works only after username correction. |
| **Fix** | Set `DB_USERNAME` to tenant-scoped pooler username; keep `DB_PASSWORD` from Supabase. |
| **Prevent** | Document pooler username format in every develop/prod runbook; copy from Supabase connection UI carefully. |
| **Status** | Resolved for develop — **Historical deployment record** |

### 17.2 Missing environment variables after laptop restart / new shell

| | |
|--|--|
| **Problem** | Local Backend fails to start or connects wrong DB after reboot. |
| **Cause** | `dev`/`prod` profiles require env vars; shells do not persist exports. |
| **Diagnosis** | Startup fails resolving `${DB_HOST}` / `${JWT_SECRET}` etc. |
| **Fix** | Re-export vars or use a local secrets manager; for Render, vars live in dashboard. |
| **Prevent** | Prefer Render dashboard for develop; document required env list (this file). |
| **Status** | Process issue — **Historical deployment record** |

### 17.3 Flyway first initialization on empty acomi-dev

| | |
|--|--|
| **Problem** | Empty remote DB must be migrated on first Backend boot. |
| **Cause** | New Supabase project has no ACOMI schema until Flyway runs. |
| **Diagnosis** | Startup logs show migrate V1…V97; `flyway_schema_history` fills. |
| **Fix** | Allow first deploy to complete; confirm v97 success. |
| **Prevent** | Never partially apply migrations; never clean remote DB. |
| **Status** | Completed at v97 — **Historical deployment record**; Git still has 97 scripts — **Repository-verified** |

### 17.4 Render port detection / bind failure

| | |
|--|--|
| **Problem** | Deploy fails “no open port” / health never passes. |
| **Cause** | App listened on 8080 while Render expected `$PORT`. |
| **Diagnosis** | Render events/logs; mismatch between EXPOSE and actual bind. |
| **Fix** | `server.port=${PORT:8080}`; do not override away from `PORT` on Render. |
| **Prevent** | Keep Dockerfile free of hardcoded listen ports; rely on Spring env. |
| **Status** | Fixed in config; successful runtime used port 10000 — **Historical deployment record** |

### 17.5 Render memory / slow startup / OOM risk

| | |
|--|--|
| **Problem** | Free-tier instance slow to become healthy; possible memory pressure during startup. |
| **Cause** | JVM + Flyway + free-tier limits. |
| **Diagnosis** | Long deploy times; health timeouts; Render metrics/logs. |
| **Fix** | Retry; ensure health path is cheap (`/actuator/health`); avoid heavy work before listen. |
| **Prevent** | Keep `-DskipTests` in Docker build; monitor after migration spikes. |
| **Status** | Operational with caveats — **Historical deployment record** / partially re-seen as cold start timeouts |

### 17.6 Docker availability locally

| | |
|--|--|
| **Problem** | Cannot build/run the same image locally. |
| **Cause** | Docker Desktop not installed/running on the Windows laptop. |
| **Diagnosis** | `docker` CLI unavailable. |
| **Fix** | Rely on Render cloud Docker build; or install Docker Desktop when local image parity is needed. |
| **Prevent** | Document that Render build is authoritative for MVP. |
| **Status** | Environment limitation — **Historical deployment record** |

### 17.7 Web TypeScript build failure on Render

| | |
|--|--|
| **Problem** | `npm run build` fails; Static Site deploy blocked. |
| **Cause** | ~62 strict TS errors (MUI props, nullability, unused, etc.). |
| **Diagnosis** | Local `tsc -b` reproduces failures. |
| **Fix** | Commit `b0c4f44` type fixes; keep `tsc -b` in build. |
| **Prevent** | Run `npm run build` before every Web push to `develop`. |
| **Status** | Fixed — **Repository-verified** commit on `develop` |

### 17.8 Missing SPA rewrite (deep link 404)

| | |
|--|--|
| **Problem** | `/login` (and other client routes) return host 404. |
| **Cause** | Static site served files only; no rewrite to `index.html`. |
| **Diagnosis** | Root 200, deep path 404; HTML not SPA shell. |
| **Fix** | Render rewrite `/*` → `/index.html`. |
| **Prevent** | Include rewrite in every Static Site checklist. |
| **Status** | Fixed; `/login` 200 verified — **Historical deployment record** + rechecked 2026-08-12 |

### 17.9 Backend CORS misconfiguration

| | |
|--|--|
| **Problem** | Browser blocks Web → API calls. |
| **Cause** | `CORS_ALLOWED_ORIGINS` missing/wrong; or wildcard with credentials. |
| **Diagnosis** | Preflight lacking ACAO; console CORS errors. |
| **Fix** | Set exact `https://acomiwebapp.onrender.com`; redeploy Backend. |
| **Prevent** | Never use `*`; always pair Web URL changes with CORS updates. |
| **Status** | Validated Phase 4.5 — **Historical deployment record** |

### 17.10 Backend cold start / timeouts

| | |
|--|--|
| **Problem** | First API/health call hangs or fails after idle. |
| **Cause** | Free-tier spin-down. |
| **Diagnosis** | curl exit 28 / HTTP 000; later retry succeeds when warm. |
| **Fix** | Retry with long timeout; keep service warm if SLA requires (paid plan / ping). |
| **Prevent** | Document cold start in smoke tests; don’t fail release on a single cold timeout without retry. |
| **Status** | Ongoing operational characteristic — **Historical deployment record**; re-observed 2026-08-12 |

### 17.11 CRLF / phantom Git changes

| | |
|--|--|
| **Problem** | `git status` shows modified YAML/Java with little/no real content change. |
| **Cause** | Windows CRLF vs LF; Git `LF will be replaced by CRLF` warnings. |
| **Diagnosis** | `git diff` empty or whitespace-only; `.gitattributes` forces LF for `mvnw`. |
| **Fix** | Do not commit noise; review diffs carefully. |
| **Prevent** | Consistent EOL settings; don’t “fix” by mass-rewriting files. |
| **Status** | Recurring local noise — **Repository-verified** on Backend working tree 2026-08-12 |

### 17.12 `hs_err_pid*` HotSpot crash logs

| | |
|--|--|
| **Problem** | JVM crash dumps appear as modified/deleted files in Git status. |
| **Cause** | Local JVM crashes; logs were sometimes tracked historically. |
| **Diagnosis** | Filename `hs_err_pid*.log`; not application source. |
| **Fix** | Never stage/commit; leave untouched unless explicitly cleaning. `.dockerignore` excludes them. |
| **Prevent** | Keep out of commits; prefer delete only with explicit approval. |
| **Status** | Ongoing hygiene — Backend `hs_err_pid15632.log` / Mobile `android/hs_err_pid17620.log` — **Repository-verified** |

### 17.13 Wrong branch / commit mistakes

| | |
|--|--|
| **Problem** | Config work attempted on `main` instead of `develop`. |
| **Cause** | Branch discipline during Phase 3.2. |
| **Diagnosis** | `git branch --show-current` ≠ `develop`. |
| **Fix** | Switch to `develop` before deployment config commits. |
| **Prevent** | Always print branch + HEAD before deploy. |
| **Status** | Process lesson — **Historical deployment record** |

### 17.14 Environment separation / secrets handling

| | |
|--|--|
| **Problem** | Risk of mixing local defaults, develop, and production secrets. |
| **Cause** | Same codebase, multiple profiles. |
| **Diagnosis** | Profile + env audit. |
| **Fix** | `local` / `dev` / `prod` split in `1b6ed59`; Render holds develop secrets only. |
| **Prevent** | Separate Supabase projects; separate JWT secrets; checklists in this doc. |
| **Status** | Configured — **Repository-verified** |

### 17.15 Unit tests not green while Docker skips tests

| | |
|--|--|
| **Problem** | Local `mvn test` may fail even though Render Docker build succeeds. |
| **Cause** | Pre-existing test failures/errors; Docker uses `-DskipTests`. |
| **Diagnosis** | Local test report vs Docker build logs. |
| **Fix** | Track test debt separately; do not silently assume CI green. |
| **Prevent** | Re-enable tests in pipeline when suite is healthy. |
| **Status** | Known debt — **Historical deployment record** |

---

## 18. Future production deployment plan

**Do not perform this section now.** It is the intended future path.

```
Development (current)
        ↓
Testing / hardening
        ↓
Release candidate (tag or production branch commit)
        ↓
Production Backend (new Render Web Service, profile prod)
        ↓
acomi-prod (separate Supabase project)
        ↓
Production Web (new Static Site + prod VITE_API_BASE_URL)
        ↓
Production CORS (exact prod Web origin)
        ↓
Production smoke test
        ↓
Release
```

### 18.1 Resources to create later

- Production Supabase project/database (**acomi-prod**)
- Production Render Backend service (Docker, `SPRING_PROFILES_ACTIVE=prod`)
- Production Render Web Static Site
- Production-only env vars and secrets (DB, JWT, CORS)
- Production CORS allowlist
- Production domain / custom hostname (**Needs verification** when chosen)
- Monitoring/alerts (health, 5xx, Flyway failures)
- Backup / recovery process for acomi-prod

### 18.2 Production rules

- New services — do **not** flip develop service env to prod DB.
- New secrets — never copy develop JWT/DB password.
- Migrations — review forward-only; never clean.
- Swagger — keep disabled unless temporarily needed behind access control.
- Mobile signing credentials — store outside Git; separate from Web/Backend Render env where appropriate.

---

## 19. Security checklist

- [ ] No secrets in Git commits or PR diffs
- [ ] No secrets in Dockerfile / image layers
- [ ] No secrets in `VITE_*` / bundled Web assets
- [ ] Distinct JWT secrets for develop vs production
- [ ] Distinct DB passwords for acomi-dev vs acomi-prod
- [ ] HTTPS only on Render URLs
- [ ] CORS exact allowlist (no `*`)
- [ ] Swagger disabled on public internet-facing services unless approved
- [ ] Actuator limited to `health` with `show-details: never`
- [ ] OTP/mobile numbers never logged
- [ ] Database access limited to needed operators
- [ ] Render env vars reviewed after personnel changes
- [ ] Supabase access reviewed (acomi-dev vs acomi-prod)
- [ ] Future mobile signing keys/certs not in Git
- [ ] `.gitignore` excludes `.env` (Web)
- [ ] `.dockerignore` excludes logs / `hs_err_pid*`
- [ ] Smoke-test users created only on acomi-dev with approval

---

## 20. Rollback / recovery

### 20.1 Backend

1. Identify last known-good commit (develop baseline: **`ab0b684`** unless superseded).
2. `RENDER DASHBOARD ACTION`: redeploy previous successful deploy, **or**
3. `LOCAL COMMAND` / `GITHUB ACTION`: revert/fix-forward on `develop` to known-good commit and push.
4. **Database caution:** Flyway migrations already applied to acomi-dev are **not** undone by app rollback. Rolling back code that expects newer schema can break. Prefer forward fixes; restore DB only from backup with explicit approval.

### 20.2 Web

1. Known-good commit: **`b0c4f44`** (or later verified).
2. Redeploy prior Static Site deploy in Render, or push revert on `develop`.
3. Remember `VITE_*` are build-time — a rollback deploy must rebuild with correct API URL.
4. CDN/browser caches may briefly serve old hashed assets; hashed filenames usually make this safe.

### 20.3 Database

- Prefer backups before risky migrations.
- Never blindly “roll back schema” by deleting `flyway_schema_history` rows.
- Never run clean on shared environments.

### 20.4 Secrets rotation (conceptual)

1. Generate new secret in a password manager.
2. Update Render env (and Supabase password if DB rotation).
3. Redeploy Backend.
4. Invalidate sessions implicitly by JWT secret change (all tokens become invalid) — coordinate downtime/UX.
5. Remove old secret from all dashboards.

---

## 21. Release checklist

### Before Backend Deployment

- [ ] Correct branch (`develop` for develop deploy)
- [ ] Correct commit reviewed
- [ ] Git status clean/expected (no accidental secrets, no `hs_err_pid*`)
- [ ] Tests reviewed (or skip rationale accepted)
- [ ] Secrets absent from Git
- [ ] DB target confirmed (**acomi-dev** for develop)
- [ ] Profile confirmed (`dev`)
- [ ] Flyway migrations reviewed

### Before Web Deployment

- [ ] Correct branch (`develop`)
- [ ] `npm run build` passes locally
- [ ] `VITE_API_BASE_URL` correct for target Backend
- [ ] No secrets in Vite env
- [ ] `dist` generated
- [ ] SPA rewrite configured on Render

### After Deployment

- [ ] Backend Live
- [ ] Health 200 / UP (retry if cold)
- [ ] Flyway up to date (no migrate errors)
- [ ] Web 200
- [ ] SPA routes work (`/login`, etc.)
- [ ] Assets 200
- [ ] CORS works (preflight + ACAO)
- [ ] Auth protection works (401 without JWT)
- [ ] No unexpected 5xx in Render logs
- [ ] **acomi-prod untouched**

---

## 22. Verified development deployment milestones

Chronological **Historical deployment record** unless noted.

| When | Milestone | Commit / evidence | Result |
|------|-----------|-------------------|--------|
| 2026-08-11 | CountIn → Amico rename (Web) | `a4374b7` | Branding rename on Web |
| 2026-08-11 | CountIn → Amico rename (Backend) | `c03dada` | Branding rename on Backend |
| 2026-08-14 | Amico → ACOMI rename (all apps) | working tree | Product identity + packages/hosts |
| 2026-08-11 | Branch structure | `main` / `develop` / `production` on all repos | Develop path available |
| 2026-08-11 | Environment config refactor | `1b6ed59` | `local`/`dev`/`prod` profiles, CORS, Actuator, env-driven secrets |
| 2026-08-11–12 | Supabase acomi-dev connectivity | Dashboard + JDBC pooler | Develop DB reachable with SSL |
| 2026-08-12 | Flyway init on acomi-dev | Runtime logs / history | **v97**, 97/97 success, ~62 public tables |
| 2026-08-12 | Backend API smoke (dev) | Authenticated GETs with smoke user | JWT path works on acomi-dev |
| 2026-08-12 | Docker support | `ab0b684` | Dockerfile + `.dockerignore` on `develop` |
| 2026-08-12 | Render Backend deploy | Service Live | `https://acomibackend.onrender.com` health UP when warm |
| 2026-08-12 | Web TS fixes | `b0c4f44` | `tsc` + Vite build green |
| 2026-08-12 | Render Web deploy | Static Site Live | `https://acomiwebapp.onrender.com` |
| 2026-08-12 | SPA rewrite | Render rewrite rule | Deep routes 200 |
| 2026-08-12 | CORS configuration | `CORS_ALLOWED_ORIGINS` exact Web origin | Preflight + ACAO validated |
| 2026-08-12 | Phase 4.5 / 4.6 smoke | HTTP checks | Web↔Backend connectivity READY (authenticated UI optional) |

---

## 23. Current state

As of documentation verification **2026-08-12**:

| Item | State |
|------|-------|
| Backend URL | `https://acomibackend.onrender.com` |
| Web URL | `https://acomiwebapp.onrender.com` |
| Backend branch | `develop` @ **`ab0b684`** |
| Web branch | `develop` @ **`b0c4f44`** |
| Database | **acomi-dev** (not acomi-prod) |
| Flyway scripts in Git | V1–V97 (97 files) |
| Flyway on acomi-dev | **v97** — **Historical deployment record** (re-confirm in Supabase if unsure) |
| CORS | Exact Web origin allowed |
| SPA | Rewrite configured; `/login` 200 |
| Overall | **Development Web + Backend deployment operational** (Backend subject to free-tier cold starts) |

### Handoff notes

- This file is the baseline runbook for later **production** work.
- Mobile should continue against the develop Backend until production API infrastructure is intentionally created.
- Do not invent production URLs; record them here when they exist.
- Local Backend/Web working trees may be dirty with unrelated files — deploy from GitHub `develop` SHAs above.

---

## Appendix A — Quick command sheet

```powershell
# Backend health (allow cold start)
curl.exe -s -w "`nHTTP=%{http_code}`n" --max-time 180 https://acomibackend.onrender.com/actuator/health

# Web root / login
curl.exe -s -o NUL -w "ROOT=%{http_code}`n" https://acomiwebapp.onrender.com/
curl.exe -s -o NUL -w "LOGIN=%{http_code}`n" https://acomiwebapp.onrender.com/login

# Unauth API
curl.exe -s -w "`nHTTP=%{http_code}`n" https://acomibackend.onrender.com/api/v1/auth/me
```

## Appendix B — Related repositories (not deployed by this guide)

| App | Local path | GitHub |
|-----|------------|--------|
| Mobile | `K:\AmicoMobile` | `https://github.com/ketankumbhar204/AmicoMobile.git` |
| Web | `K:\AmicoWeb` | `https://github.com/ketankumbhar204/AmicoWebApp.git` |
| Backend | `K:\Projects\Amico\Backend\amico-backend` | `https://github.com/ketankumbhar204/AmicoBackend.git` |

---

*End of Development Deployment Guide v1.0*
