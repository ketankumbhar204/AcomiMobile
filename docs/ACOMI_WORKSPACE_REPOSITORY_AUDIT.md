# ACOMI — Phase 5.9 Workspace + Git Repository Reference Audit

**Document type:** Read-only workspace audit  
**Date:** 2026-08-14  
**Scope:** Verify final local paths, Git remotes, GitHub repository names, leftover Amico/CountIn/Residine references, ACOMI identity, deployment docs, CI/CD, builds, and Git safety after the folder + GitHub rename.  
**Out of scope:** Production infrastructure, Render/Supabase changes, commits, pushes, branch changes, database work.

**Evidence labels used below:**

| Label | Meaning |
|-------|---------|
| **VERIFIED** | Confirmed from local Git, GitHub API, or source files on 2026-08-14 |
| **REQUIRES FIX** | Stale current-state documentation or operator instructions |
| **REQUIRES USER ACTION** | Local Git/tooling action; not done in this audit |
| **HISTORICAL** | Intentional rename/deployment history; do not erase |
| **FALSE POSITIVE** | Ordinary English or unrelated token |
| **EXTERNAL** | Cloud/dashboard state not fully inspectable from Git |

---

## 1. Final local workspace structure

| App | Expected path | Observed `git rev-parse --show-toplevel` | Status |
|-----|---------------|------------------------------------------|--------|
| Mobile | `K:\AcomiMobile` | `K:/AcomiMobile` | **VERIFIED** |
| Web | `K:\AcomiWeb` | `K:/AcomiWeb` | **VERIFIED** |
| Backend | `K:\Projects\Acomi\Backend\acomi-backend` | `K:/Projects/Acomi/Backend/acomi-backend` | **VERIFIED** |

Old folders (`K:\AmicoMobile`, `K:\AmicoWeb`, `K:\Projects\Amico`, `K:\Projects\Amico\Backend\amico-backend`) were not used as working copies in this audit. Local clones opened at the final ACOMI paths.

---

## 2. GitHub repository mapping

GitHub repository **names** were verified via the GitHub REST API. Querying the old Amico URLs returns the renamed ACOMI repositories (GitHub rename redirect). Canonical `clone_url` values:

| App | Canonical GitHub name | Canonical HTTPS clone URL | Visibility |
|-----|----------------------|---------------------------|------------|
| Mobile | `ketankumbhar204/AcomiMobile` | `https://github.com/ketankumbhar204/AcomiMobile.git` | public |
| Web | `ketankumbhar204/AcomiWebApp` | `https://github.com/ketankumbhar204/AcomiWebApp.git` | public |
| Backend | `ketankumbhar204/AcomiBackend` | `https://github.com/ketankumbhar204/AcomiBackend.git` | public |

Notes:

- Web GitHub name is **`AcomiWebApp`**, not `AcomiWeb`. Local folder is `K:\AcomiWeb`. Both are correct; they are different names.
- `https://github.com/ketankumbhar204/AcomiWeb` returns 404 (that name was never the repo).
- Same GitHub `id` for old and new names confirms these are **renames**, not new empty repositories.

---

## 3. Git remote verification

Source of truth: `git remote -v` (not invented).

| App | Local `origin` (fetch/push) | Points at new ACOMI GitHub name in the local config? | Remote still works? |
|-----|-----------------------------|------------------------------------------------------|---------------------|
| Mobile | `https://github.com/ketankumbhar204/AmicoMobile.git` | **No** — still the old name | **Yes** — GitHub redirect; `git ls-remote` succeeded |
| Web | `https://github.com/ketankumbhar204/AmicoWebApp.git` | **No** — still the old name | **Yes** — redirect; `git ls-remote` succeeded |
| Backend | `https://github.com/ketankumbhar204/AmicoBackend.git` | **No** — still the old name | **Yes** — redirect; `git ls-remote` succeeded |

**REQUIRES USER ACTION:** Update local remotes to the canonical clone URLs in section 2 (`git remote set-url origin <new-url>`). Do **not** recreate repositories. GitHub redirects currently keep fetch/push working, but the recorded origin strings are still Amico names.

`gh` CLI is not installed on this machine; GitHub API + `git ls-remote` were used instead.

---

## 4. Branch mapping

All three repositories: current branch **`develop`**, tracking **`origin/develop`**, not ahead/behind.

| App | Current branch | HEAD (short) | HEAD subject | Local `main` | Local `production` | Tracking |
|-----|----------------|--------------|--------------|--------------|--------------------|----------|
| Mobile | `develop` | `d931db0` | `refactor: rename application from Amico to ACOMI` | `e02095c` → `origin/main` | `e02095c` → `origin/production` | **VERIFIED** |
| Web | `develop` | `6801e46` | `refactor: rename application from Amico to ACOMI` | `a4374b7` → `origin/main` | `a4374b7` → `origin/production` | **VERIFIED** |
| Backend | `develop` | `e4ac146` | `refactor: rename application from Amico to ACOMI` | `c03dada` → `origin/main` | `c03dada` → `origin/production` | **VERIFIED** |

Remote heads from `git ls-remote --heads origin` match the local tracking SHAs above.

**Important for later production work (not changed in this audit):**

- ACOMI rename commits exist on **`develop` only**.
- `main` and `production` still point at the earlier **CountIn → Amico** rename commits.
- Mobile `origin/HEAD` → `origin/main`. Backend `origin/HEAD` → `origin/main`. Web has no `origin/HEAD` advertised in `git branch -a` (all three remote branches exist).

**HISTORICAL:** Do not recreate, reset, or force-push the ACOMI rename commits (`d931db0` / `6801e46` / `e4ac146`).

---

## 5. Old path reference audit

Searched tracked source, docs, scripts, and config for:

`K:\AmicoMobile`, `K:\AmicoWeb`, `K:\Projects\Amico`, `amico-backend`  
and the `/` slash variants.

### 5.1 Application source

No matches in Mobile `src/`, Web `src/`, Backend `src/` (excluding the historical Flyway function name in section 6), Android/iOS project identity files, Maven, or Gradle **source**.

**VERIFIED** — runtime code does not depend on the old disk paths.

### 5.2 Operator / current-state documentation — REQUIRES FIX

These present old paths or old GitHub URLs as **current** workspace facts:

| Location | What is stale |
|----------|----------------|
| `K:\AcomiMobile\docs\DEVELOPMENT_DEPLOYMENT_GUIDE.md` §3.1, §3.2, Appendix B, and some `cd` examples | Local paths `K:\AmicoMobile`, `K:\AmicoWeb`, `K:\Projects\Amico\Backend\amico-backend`; GitHub URLs `AmicoMobile.git` / `AmicoWebApp.git` / `AmicoBackend.git`; Render connect instruction `ketankumbhar204/AmicoBackend` |
| `K:\AcomiMobile\docs\DEVELOPMENT_DEPLOYMENT_GUIDE.md` product-rename note (line 11) | Says workspace folders and GitHub remotes **may still** use Amico names. Folders and GitHub **names** are now ACOMI; only **local `origin` URL strings** still use Amico. |
| `K:\AcomiWeb\README.md` | `cd K:\AmicoWeb`; pointers `K:\AmicoMobile\docs\...` |

Backend path in several Mobile/Web docs was already updated to `K:\Projects\Acomi\Backend\acomi-backend` during the ACOMI rename. **ALREADY VALID** for those backend-path lines.

### 5.3 Dated parity / audit snapshots — HISTORICAL

Old `K:\AmicoMobile` / `K:\AmicoWeb` headers remain in dated web-parity documents (Mobile `docs/web/*` and Web `docs/*` / `docs/web/*`). They record the workspace at the time those audits were written. They are not used by builds.

Examples: `GAP_ANALYSIS.md`, `FINAL_PARITY_REPORT.md`, `FINAL_IMPLEMENTATION_AUDIT.md`, `ACCOUNT_ONBOARDING.md`, `PHASE_12_FINAL_PARITY.md`, Web `MASTER_SCREEN_IMPLEMENTATION_GUIDE.md`, `WEB_PARITY_IMPLEMENTATION_GUIDE.md`, and similar.

Do not rewrite those solely to erase history. Optionally add a one-line current-path pointer later if operators still follow them.

### 5.4 Rename helper script — HISTORICAL

`K:\AcomiMobile\scripts\rename-project-folders.ps1` still contains `From = K:\Amico*` paths. That is the script’s input list. Folders are already renamed; running it now should `SKIP missing`. The header comment (“workspace folders intentionally remain Amico*”) is stale (**REQUIRES FIX** if the script is kept as current guidance).

### 5.5 Local generated Android cache — REQUIRES USER ACTION

Untracked/generated Android build outputs still contain `K:\AmicoMobile` (see §10). Not committed source.

### 5.6 Backend tracked files

No `K:\Amico*` / `amico-backend` path matches in Backend tracked docs/config.

---

## 6. Old product-name reference audit

Searched `CountIn`, `countin`, `Residine`, `residine`, `Amico`, `amico`.

### CountIn / countin

| Hit | Classification |
|-----|----------------|
| `DEVELOPMENT_DEPLOYMENT_GUIDE.md` timeline and prior-commit rows (`a4374b7`, `c03dada`) | **HISTORICAL** |
| Git commit subjects on `main` / `production` (`refactor: rename application from CountIn to Amico`) | **HISTORICAL** |
| Web `docs/INVENTORY.md` “accounting” | **FALSE POSITIVE** |

No CountIn product identity in application source.

### Residine / residine

**VERIFIED** — zero matches in Mobile, Web, and Backend.

### Amico / amico

| Hit | Classification |
|-----|----------------|
| Git commit subjects and deployment-guide rename timeline (CountIn → Amico → ACOMI) | **HISTORICAL** |
| Local `origin` URLs `AmicoMobile.git` / `AmicoWebApp.git` / `AmicoBackend.git` | **REQUIRES USER ACTION** (local remote strings) |
| Deployment guide / Web README current-path tables using Amico folder or GitHub names | **REQUIRES FIX** |
| Dated parity docs `K:\AmicoMobile` / `K:\AmicoWeb` | **HISTORICAL** |
| `scripts/rename-project-folders.ps1` `From` paths | **HISTORICAL** |
| Backend Flyway `V55__normalize_mobiles_and_backfill_member_invitations.sql` function `amico_normalize_mobile` (created and dropped in the same migration) | **HISTORICAL** — must not be rewritten; Flyway history is immutable |
| `android/hs_err_pid17620.log` JVM crash dump (`K:\Amico\...` and `K:\AmicoMobile` in PATH/cache threads) | Generated noise; **do not treat as product identity** |
| Ordinary words such as “accounting” | **FALSE POSITIVE** |

**VERIFIED:** No `com.amico`, `@amico/`, or `amico.` storage/config prefixes in Mobile/Web/Backend application source.

---

## 7. ACOMI identity verification

| Identity | Expected | Observed | Status |
|----------|----------|----------|--------|
| Product name | ACOMI | `app.json` `displayName` **ACOMI**; Android `app_name` **ACOMI**; iOS `CFBundleDisplayName` **ACOMI** | **VERIFIED** |
| Android applicationId / namespace | `com.acomi` | `android/app/build.gradle` | **VERIFIED** |
| Android package | `com.acomi` | `MainActivity.kt`, `MainApplication.kt` | **VERIFIED** |
| iOS bundle id | `com.acomi` | `ios/Acomi.xcodeproj` `PRODUCT_BUNDLE_IDENTIFIER` | **VERIFIED** |
| iOS product / project | Acomi | `PRODUCT_NAME = Acomi`; `ios/Acomi.xcodeproj` | **VERIFIED** |
| RN module / app.json name | Acomi | `app.json` `"name": "Acomi"`; `AppRegistry` uses that name | **VERIFIED** |
| npm package (mobile) | acomi | `package.json` `"name": "acomi"` | **VERIFIED** |
| Gradle root project | Acomi | `android/settings.gradle` `rootProject.name = 'Acomi'` | **VERIFIED** |
| Web npm name | acomi-web | `package.json` `"name": "acomi-web"` | **VERIFIED** |
| Web storage | `acomi.*` | `acomi.auth.token`, `acomi.auth.user`, `acomi.space.selectedId`, `acomi.ui.*` | **VERIFIED** |
| Mobile storage | `@acomi/*` | `@acomi/access_token`, `@acomi/user`, `@acomi/current_space`, `@acomi/language`, `@acomi/coachmarks/...`, `@acomi/inventory/...`, etc. | **VERIFIED** |
| Maven | `com.acomi:acomi-backend` | `pom.xml` | **VERIFIED** |
| Backend package | `com.acomi.acomi_backend` | Java sources + tests | **VERIFIED** |
| Backend main class | `AcomiBackendApplication` | `com.acomi.acomi_backend.AcomiBackendApplication` | **VERIFIED** |
| Spring application name | acomi-backend | `application.yml` | **VERIFIED** |
| Config prefix | `acomi.*` | `application.yml` / profile files (`acomi.jwt`, `acomi.otp`, `acomi.cors`) | **VERIFIED** |
| Dockerfile | ACOMI-named | `acomi` user; `acomi-backend-0.0.1-SNAPSHOT.jar` | **VERIFIED** |
| Development API | configured DEV Render host | Mobile `src/config/env.ts`: `https://acomibackend.onrender.com` when `__DEV__` | **VERIFIED** |
| Staging API | `https://staging-api.acomi.app` | `env.ts` `API_HOSTS.staging` | **VERIFIED** (planned host; not live-probed) |
| Production API | `https://api.acomi.app` | `env.ts` `API_HOSTS.production` (release / non-`__DEV__`) | **VERIFIED** as **planned/placeholder** until a real production backend exists |

Debug vs release API model **VERIFIED** in source:

- `__DEV__` → development → `https://acomibackend.onrender.com/api/v1` (`USE_LOCAL_DEV_BACKEND = false`)
- Release → production → `https://api.acomi.app/api/v1`

Web local `.env` uses `VITE_API_BASE_URL=/api/v1` (Vite proxy). Render develop Web is documented to bake `https://acomibackend.onrender.com/api/v1` at **build time**. That Render env was **not** modified or re-read from the Render dashboard in this audit (**EXTERNAL**).

---

## 8. Deployment documentation verification

Primary runbook: `K:\AcomiMobile\docs\DEVELOPMENT_DEPLOYMENT_GUIDE.md`.

| Check | Result |
|-------|--------|
| Product branding in title/architecture | **ACOMI** — **VERIFIED** |
| DEV Render URLs | `https://acomibackend.onrender.com`, `https://acomiwebapp.onrender.com` — **VERIFIED** as documented; consistent with Mobile `env.ts` |
| Production URLs | Documented as **future / do not invent**; `api.acomi.app` is used in Mobile source as the planned production host — **VERIFIED** as planned, not as a live production service |
| Secrets in the guide | Policy forbids printing secrets; no passwords/JWTs/connection strings observed in the guide — **VERIFIED** |
| Local paths in “current” tables | Still Amico paths — **REQUIRES FIX** |
| GitHub names in “current” tables | Still Amico repo URLs — **REQUIRES FIX** |
| Current HEAD SHAs in §23 | Still `ab0b684` / `b0c4f44` (pre-ACOMI-rename). Actual develop HEADs are `e4ac146` / `6801e46` / `d931db0` — **REQUIRES FIX** (stale snapshot, not secret) |
| Historical CountIn/Amico timeline | **HISTORICAL** — keep |
| Note that GitHub remotes “may still use Amico” | Partially outdated — **REQUIRES FIX** |

Other deployment-related Markdown: no GitHub Actions runbooks; Web `docs/web/RELEASE_CHECKLIST.md` is a product-release checklist, not a Render/GitHub-name map. No secrets spotted in those files during this pass.

Treat the development guide as historical deployment knowledge **plus** a current-state section that must be refreshed after this folder/GitHub rename.

---

## 9. CI/CD reference verification

| Area | Finding |
|------|---------|
| GitHub Actions (`.github/workflows`) | **None** in Mobile, Web, or Backend |
| `render.yaml` / `render.yml` | **None** — Render is dashboard-connected (**EXTERNAL**) |
| `buildspec*`, Jenkins, GitLab CI | **None** |
| Backend Docker | `Dockerfile` present; ACOMI-named; no Amico paths — **VERIFIED** |
| Web `package.json` scripts | `dev` / `build` / `preview` / lint/format — no Amico — **VERIFIED** |
| Mobile `package.json` scripts | RN android/ios/start/test — no Amico — **VERIFIED** |
| Gradle / Maven coordinates | ACOMI — **VERIFIED** |

**EXTERNAL / REQUIRES USER ACTION:** Confirm in the Render dashboard that Backend and Web services still track the **renamed** GitHub repos (`AcomiBackend`, `AcomiWebApp`) and branch `develop`. GitHub redirects usually keep existing Render Git connections working; this was not opened in Render in this audit.

No committed CI/CD file still points at Amico GitHub URLs except the **deployment guide text** (documentation, not a pipeline).

---

## 10. Build validation

Performed 2026-08-14. No source changes for these builds. No deploy commands.

| App | Command | Result |
|-----|---------|--------|
| Backend | `mvnw.cmd -DskipTests compile` | **PASS** (`com.acomi:acomi-backend`, BUILD SUCCESS) |
| Web | `npm run build` (`tsc -b && vite build`) | **PASS** (Vite 8.1.5, built `dist/`) |
| Mobile Android | `android\gradlew.bat compileDebugKotlin` | **FAIL** |

### Mobile failure — not an ACOMI source-identity bug

Gradle error:

```
Configuring project ':react-native-safe-area-context' without an existing directory is not allowed.
The configured projectDirectory 'K:\AmicoMobile\node_modules\react-native-safe-area-context\android' does not exist
```

The package **does** exist at `K:\AcomiMobile\node_modules\react-native-safe-area-context\android`.

Cause: leftover **generated** Android/autolinking/Gradle outputs from before the folder rename. `android/build/generated/autolinking/autolinking.json` still has `"root": "K:\\AmicoMobile"`. Many files under `android/app/build` and `android/app/.cxx` also embed the old path.

This is **REQUIRES USER ACTION** (local cache refresh), not a committed source defect. This audit did **not** delete `android/build`, `android/app/build`, `android/.gradle`, or `.cxx` (no deletes in this phase).

Suggested later local recovery (do not run until approved): stop Gradle daemons, remove those generated directories, then `compileDebugKotlin` again from `K:\AcomiMobile`.

Web `dist/` is gitignored. Backend `target/` is a local compile output.

---

## 11. Git safety status

### 11.1 Staged changes

**None** on Mobile, Web, or Backend.

### 11.2 Web / Backend working trees

**Clean** (`git status` empty).

### 11.3 Mobile working tree (dirty, expected)

On `develop`, unstaged/untracked:

| Path | Classification | Action |
|------|----------------|--------|
| `.gitignore` | Phase 5.4 — ignore `*.jks` and `android/keystore.properties` | Keep; do not mix into unrelated commits |
| `android/app/build.gradle` | Phase 5.4 — release signing, no debug fallback | Keep |
| `android/gradle.properties` | Phase 5.4 — `reactNativeArchitectures=arm64-v8a,x86_64` | Keep |
| `android/keystore.properties.example` (untracked) | Phase 5.4 template; placeholders only | Keep |
| `.tmp-openapi.json` | Generated/noise (already tracked; 1-line churn) | Do **not** commit |
| `android/hs_err_pid17620.log` | JVM crash log (already tracked; further churn) | Do **not** commit; later untrack |

No files were staged. No accidental ACOMI-rename source edits were made in this audit except **this report file**.

### 11.4 Secrets / keystores / env

| Item | Status |
|------|--------|
| `android/keystore.properties` | **Not present** |
| Upload/release `.jks` / non-debug `.keystore` | **Not present** |
| `android/app/debug.keystore` | Standard debug keystore (expected) |
| Mobile `.env` | **Not present** |
| Web `.env` | Gitignored; contains only public `VITE_*` (no secrets printed here) |
| Backend `application-local.yml` | Committed **local-only** DB/JWT defaults (already documented in the development guide). Not printed in this report. Must never be copied to Render/prod. |
| This audit report | No secret values |

### 11.5 This audit’s only new file

`docs/ACOMI_WORKSPACE_REPOSITORY_AUDIT.md` (this file). Uncommitted after write. Not a product-behavior change.

---

## 12. Remaining issues

### REQUIRES USER ACTION

1. Set local `origin` URLs to the canonical ACOMI clone URLs (section 2).
2. Confirm Render Git connections still resolve to `AcomiBackend` / `AcomiWebApp` after the GitHub rename (**EXTERNAL**).
3. Refresh local Android generated folders so Gradle stops using `K:\AmicoMobile`.
4. Keep Phase 5.4 Mobile signing/ABI work **uncommitted** until a dedicated commit is requested. Exclude crash log and `.tmp-openapi.json`.
5. Before any production deploy: merge/promote ACOMI `develop` onto `main` (today `main`/`production` are still CountIn→Amico).

### REQUIRES FIX (documentation; not done in this audit)

1. Refresh `DEVELOPMENT_DEPLOYMENT_GUIDE.md` current-state paths, GitHub URLs, and develop SHAs.
2. Refresh `K:\AcomiWeb\README.md` `cd` / Mobile doc paths to `K:\AcomiWeb` and `K:\AcomiMobile`.
3. Optionally correct the stale comment in `scripts/rename-project-folders.ps1`.

### HISTORICAL (leave)

- CountIn → Amico → ACOMI commit messages and guide timeline.
- Flyway `amico_normalize_mobile` in V55.
- Dated parity docs with old `K:\Amico*` headers.
- Rename-script `From` paths.

### FALSE POSITIVE

- “accounting” in inventory docs.
- Crash-log filesystem strings.

---

## 13. Final verdict

**READY FOR PHASE 6.0**

The final local folders exist. GitHub repositories are renamed to ACOMI names. Application identity in source is ACOMI. CountIn and Residine are gone from product identity. Remaining Amico strings are history, local remote-URL leftovers (redirects still work), stale current-state docs, a historical Flyway function name, or local Android cache.

Phase 6.0 may proceed as a **production infrastructure inventory and migration plan** only. Do not create production resources until that plan is reviewed.

Do **not** treat this as production-ready: `main`/`production` still lack the ACOMI rename; `https://api.acomi.app` is still a planned endpoint; Android local compile needs a cache refresh after the folder rename.

---

## Safety confirmation

| Item | Status |
|------|--------|
| Source changes | **NONE** except this audit report |
| Database | **NOT TOUCHED** |
| Supabase | **NOT TOUCHED** |
| Render | **NOT TOUCHED** |
| Git commits | **NONE** |
| Git pushes | **NONE** |
| Branches | **NOT CHANGED** |
| Secrets | **NOT PRINTED** |
| Deletes / resets / force-push | **NONE** |

**Do not proceed to production infrastructure in this phase.**
