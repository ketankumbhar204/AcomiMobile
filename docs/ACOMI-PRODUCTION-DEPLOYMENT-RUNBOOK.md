# ACOMI Production Deployment Runbook

**Status:** Permanent operational reference  
**Audience:** Human developers and future Cursor deployment agents  
**Last verified from production deployments:** 18 September 2026  
**Scope:** Backend, Web App, Public Website, Mobile / Google Play  

> **SECURITY:** This document must never contain actual secret values (AWS keys, R2 keys, JWT secrets, DB passwords, Firebase JSON, SSH private key contents, Play Console passwords, tokens). Document **names**, **locations**, and **how to access** only.

---

## Instructions for a Future Cursor Deployment Agent

Read this document completely before doing anything.

1. Do **not** ask the user to rediscover AWS resources already documented here.
2. Do **not** ask the user to paste secrets that are already available through documented local/server configuration.
3. **Never** print secret values in terminal output, logs, or chat.
4. Verify git state before every deployment.
5. **Never** force push.
6. **Never** modify the production database manually during normal deployment.
7. **Never** run Flyway `clean`.
8. **Never** use destructive database commands (`DROP`, `TRUNCATE`, blind `DELETE`/`UPDATE`).
9. Deploy **one component at a time**.
10. Verify each component before moving to the next.
11. **Stop** on migration failure, application startup failure, or health-check failure.
12. **Stop** if the deployment target is ambiguous.
13. **Never** deploy Mobile automatically with AWS deployments.
14. **Never** bump Android `versionCode` unless explicitly preparing a new Play release.
15. **Never** upload an unverified AAB.
16. Preserve production-specific branch history.
17. Report exact commit, image digest (backend), deployment result, and verification result.

---

## Part 1 — ACOMI System Overview

### High-level architecture

```text
User
  ├─ Public Website  (https://www.acomi.in/)   → marketing + discovery + enquire
  ├─ Web App         (https://app.acomi.in/)    → operator / member application
  └─ Mobile App      (com.acomi on Google Play) → Android client
           │
           ▼
     ACOMI Backend   (https://api.acomi.in)
           │
           ├─ PostgreSQL (managed DB; credentials on EC2 env file)
           ├─ Cloudflare R2 (private bucket acomi-prod-files; signed URLs)
           ├─ Firebase / FCM (service-account file mount on EC2)
           └─ SMS / mail / other integrations via env-configured providers
```

### Independently deployed components

| Component | How it is released | Coupled to |
|-----------|--------------------|------------|
| **Backend** | Docker image → ECR → EC2 container | DB migrations (Flyway on startup) |
| **Web App** | Static Vite build → S3 + CloudFront | Backend API URL baked at build time |
| **Public Website** | Static Vite build → S3 + CloudFront | Backend API URL baked at build time |
| **Mobile** | Android App Bundle (AAB) → **manual** Google Play Console | Backend API; Play policy / signing |

These four pipelines are **separate**. Backend must be healthy before clients that depend on new APIs/migrations are released.

---

## Part 2 — Production Inventory

| Item | Verified value |
|------|----------------|
| AWS account | `484279833542` |
| AWS region | `ap-south-1` |
| EC2 instance name | `acomi-backend-prod` |
| EC2 public IP | `15.252.148.84` |
| SSH user | `ubuntu` |
| SSH private key path | `K:\Projects\Deployment\AWS\acomi-backend-prod-key.pem` |
| SSH private key contents | **NEVER DOCUMENT** |
| ECR repository / image | `484279833542.dkr.ecr.ap-south-1.amazonaws.com/acomi-backend` |
| Backend container name | `acomi-backend` |
| Container / host port | `8080:8080` |
| Restart policy | `unless-stopped` |
| Backend API | `https://api.acomi.in` |
| Backend health | `https://api.acomi.in/actuator/health` |
| Web App URL | `https://app.acomi.in/` |
| Public Website URL | `https://www.acomi.in/` |
| Web S3 bucket | `acomi-web-prod` |
| Web CloudFront distribution | `E2VH4TPFBNMP5` |
| Public Website S3 bucket | `acomi-public-website-prod` |
| Public Website CloudFront | `EY4G3DEY1DAFT` |
| R2 bucket | `acomi-prod-files` |
| R2 logical provider | `r2` |
| R2 provider mode | `s3compatible` |
| R2 endpoint | Set in `ACOMI_STORAGE_ENDPOINT` on EC2 env file. Format: Cloudflare R2 S3-compatible URL. **Value: NOT STORED IN THIS DOCUMENT** |
| Firebase host path | `/home/ubuntu/acomi/firebase/firebase-service-account.json` |
| Firebase container mount | `/home/ubuntu/acomi/firebase/firebase-service-account.json` → `/app/firebase-service-account.json` (`:ro`) |
| Backend env file | `/home/ubuntu/acomi-backend.env` |
| AWS CLI auth (operator machine) | Existing local AWS CLI / SSO session for account `484279833542`. **Credentials: NOT STORED IN THIS DOCUMENT** |

### Secrets inventory (names and locations only)

| Secret / config | Where stored | Consumed by | Commit? |
|-----------------|--------------|-------------|---------|
| AWS CLI credentials / SSO | Operator machine AWS config | `aws` CLI, ECR login | Never |
| SSH key `.pem` | `K:\Projects\Deployment\AWS\acomi-backend-prod-key.pem` | SSH to EC2 | Never |
| `DB_*`, `JWT_SECRET`, `OTP_HASH_SECRET`, `TWOFACTOR_API_KEY`, `CORS_ALLOWED_ORIGINS`, `ACOMI_STORAGE_*`, `FIREBASE_CREDENTIALS_PATH`, `ACOMI_PUSH_ENABLED`, `SPRING_PROFILES_ACTIVE`, `PORT` | `/home/ubuntu/acomi-backend.env` | Docker `--env-file` | Never |
| R2 access/secret | `ACOMI_STORAGE_ACCESS_KEY` / `ACOMI_STORAGE_SECRET_KEY` in env file | Backend only | Never |
| Firebase service account JSON | `/home/ubuntu/acomi/firebase/firebase-service-account.json` | Backend FCM | Never |
| Web `.env.production` | Local (gitignored on Public Website; tracked public values on Web App) | Vite build inline | No secrets |
| Android keystore / Play credentials | Local Play / keystore config outside git | AAB signing / Play Console | Never |

---

## Part 3 — Repositories and Branches

| Product | Local path | GitHub repository | Branches |
|---------|------------|-------------------|----------|
| Backend | `K:\Projects\Acomi\Backend\acomi-backend` | `AcomiBackend` | `main`, `develop`, `production`, `aws-production` |
| Mobile | `K:\AcomiMobile` | `AcomiMobile` | `main`, `develop`, `production`, `aws-production` |
| Web App | `K:\AcomiWeb` | `AcomiWebApp` | `main`, `develop`, `production`, `aws-production` |
| Public Website | `K:\AcomiPublicWebsite` | `AcomiPublicWebsite` | `main`, `develop`, `production` (**no** `aws-production`) |

### Branch synchronization policy

- Keep finalized release commits synchronized across the listed branches for each repo.
- Prefer **fast-forward** when branches share history.
- Use a normal merge only if required; do **not** rewrite history.
- **No force pushes.**
- **No destructive resets** of production branches.
- Deploy only from a branch that contains the finalized commit.
- Before deploy, compare local vs `origin`.

### Git verification commands (verified / standard)

```bash
git status
git branch --show-current
git branch -a
git branch -vv
git log -5 --oneline
git log --oneline --decorate --graph --all -20
git ls-remote origin
git ls-remote origin refs/heads/main refs/heads/develop refs/heads/production refs/heads/aws-production
```

**WHAT:** Shows working tree, current branch, remotes, and history.  
**WHY:** Prevent deploying the wrong commit or dirty tree.  
**WHEN:** Before every deploy / sync.  
**SUCCESS:** Expected commit present; no unexpected tracked changes; remotes match after push.

---

## Part 4 — Backend Deployment Runbook

**Deploy from:** `K:\Projects\Acomi\Backend\acomi-backend`  
**Successful release reference:** commit `9a1d242`, image tag `9a1d242`, digest `sha256:60922ae03d740621ea18514559e47fb8915a8be76ab8e9b6679d50a040610149`

### Preconditions

- AWS CLI authenticated to account `484279833542` / region `ap-south-1`.
- Docker Desktop (or local Docker) available for image build.
- SSH key present at the documented path.
- Do **not** rotate secrets or change DNS / security groups / CloudFront during a normal backend deploy.

### Procedure

1. **Checkout / verify source**
   ```powershell
   cd K:\Projects\Acomi\Backend\acomi-backend
   git status
   git branch --show-current
   git log -1 --oneline
   ```
   Confirm expected commit (example: `9a1d242`). Stop if missing or unexpected tracked changes.

2. **Verify migrations in source**  
   Confirm Flyway files `V127`–`V133` exist under `src/main/resources/db/migration/` (including nested folders). Especially confirm `V133__stored_files_inquiry_payment_qr_purpose.sql` includes `INQUIRY_PAYMENT_QR`.  
   **Do not modify migrations at deploy time.**

3. **Authenticate Docker to ECR (verified)**
   ```powershell
   aws ecr get-login-password --region ap-south-1 | docker login --username AWS --password-stdin 484279833542.dkr.ecr.ap-south-1.amazonaws.com
   ```
   **SUCCESS:** `Login Succeeded`

4. **Build production image (verified)**
   ```powershell
   docker build -t 484279833542.dkr.ecr.ap-south-1.amazonaws.com/acomi-backend:9a1d242 .
   ```
   Tag with the git short SHA (or equivalent unambiguous release tag). Multi-stage Dockerfile builds the Spring Boot JAR with Temurin 17.

5. **Push image and record digest (verified)**
   ```powershell
   docker push 484279833542.dkr.ecr.ap-south-1.amazonaws.com/acomi-backend:9a1d242
   aws ecr describe-images --repository-name acomi-backend --region ap-south-1 --image-ids imageTag=9a1d242 --query "imageDetails[0].imageDigest" --output text
   ```
   **SUCCESS:** Push completes; digest recorded (example for 2026-09-18: `sha256:60922ae03d740621ea18514559e47fb8915a8be76ab8e9b6679d50a040610149`). Prefer deploying by **digest**.

6. **SSH to EC2 (verified)**
   ```powershell
   ssh -i "K:\Projects\Deployment\AWS\acomi-backend-prod-key.pem" ubuntu@15.252.148.84
   ```
   Prefer uploading small bash scripts via `scp` when PowerShell quoting breaks remote heredocs.

7. **Inspect current container before change (verified pattern)**  
   On EC2 (use `sudo docker`):
   ```bash
   sudo docker ps -a --filter name=acomi-backend
   sudo docker inspect acomi-backend --format 'Image={{.Config.Image}} Restart={{.HostConfig.RestartPolicy.Name}} Status={{.State.Status}}'
   sudo docker inspect acomi-backend --format '{{range .Mounts}}{{.Source}} -> {{.Destination}} RO={{not .RW}}{{println}}{{end}}'
   sudo docker inspect acomi-backend --format '{{range .Config.Env}}{{println .}}{{end}}' | sed -E 's/=.*/=<redacted>/' | sort
   df -h
   sudo docker info >/dev/null && echo DOCKER_OK
   ```
   **Never print secret values.**

8. **Backup container configuration (verified location)**  
   Successful 2026-09-18 backup directory:
   `/home/ubuntu/deploy-backups/pre-deploy-20260918T141308Z`  
   Contents included (names only): `inspect.json`, `summary.txt`, redacted `env-keys.txt`, copy of `acomi-backend.env` (mode `600`).  
   **Do not delete backups.**

9. **Verify env file keys without values (verified)**  
   Required non-empty keys on `/home/ubuntu/acomi-backend.env` include storage keys listed in Part 6, plus DB/JWT/Firebase/CORS/etc.  
   Check presence with `grep -E '^[A-Z0-9_]+='` and strip values (`sed 's/=.*/=<redacted>/'`).

10. **Pull new image on EC2 (verified)**
    ```bash
    aws ecr get-login-password --region ap-south-1 | sudo docker login --username AWS --password-stdin 484279833542.dkr.ecr.ap-south-1.amazonaws.com
    sudo docker pull 484279833542.dkr.ecr.ap-south-1.amazonaws.com/acomi-backend@sha256:<DIGEST>
    ```

11. **Replace container only (verified)**
    ```bash
    sudo docker stop acomi-backend || true
    sudo docker rm acomi-backend || true
    sudo docker run -d \
      --name acomi-backend \
      --restart unless-stopped \
      -p 8080:8080 \
      --env-file /home/ubuntu/acomi-backend.env \
      -v /home/ubuntu/acomi/firebase/firebase-service-account.json:/app/firebase-service-account.json:ro \
      484279833542.dkr.ecr.ap-south-1.amazonaws.com/acomi-backend@sha256:<DIGEST>
    ```
    **CRITICAL:** Use `--env-file /home/ubuntu/acomi-backend.env` so R2 and all production vars are injected. A previous live container was found missing `ACOMI_STORAGE_*` until redeployed with the env file.

12. **Monitor startup logs (verified)**
    ```bash
    sudo docker logs -f --since 2m acomi-backend
    ```
    Look for:
    - Hikari pool start
    - Flyway success (prod logging may be `warn` → few Flyway INFO lines)
    - Hibernate EntityManagerFactory init (`ddl-auto=validate`)
    - `storage_provider_selected adapter=s3compatible logicalName=r2 bucketConfigured=true`
    - `Firebase Admin SDK initialized for FCM` (after readable credentials)
    - `Started AcomiBackendApplication`

13. **Health check (verified)**
    ```powershell
    curl.exe -sS https://api.acomi.in/actuator/health
    ```
    **SUCCESS:** HTTP 200 and `"status":"UP"`.

14. **Stability (verified)**
    ```bash
    sudo docker inspect acomi-backend --format 'RestartCount={{.RestartCount}} Status={{.State.Status}} OOM={{.State.OOMKilled}}'
    ```
    **SUCCESS:** `running`, `RestartCount=0`, `OOM=false` after several minutes; no restart loop.

15. **Safe smoke checks (verified)**
    - `GET https://api.acomi.in/actuator/health` → 200 UP
    - `GET https://api.acomi.in/api/v1/spaces/discover` → 200
    - Invalid login → 401 (not 500)

**STOP** on Flyway failure, Hibernate validation failure, missing Firebase mount, missing R2 env, restart loop, or health failure. Do not “fix” production DB manually.

---

## Part 5 — Flyway / Database Safety

### Policy

| Setting | Value |
|---------|-------|
| `spring.flyway.enabled` | `true` |
| `spring.jpa.hibernate.ddl-auto` | `validate` |
| `spring.flyway.clean-disabled` | `true` (also in prod profile) |
| Who applies migrations | Backend process on startup |
| Manual SQL during deploy | **Forbidden** for normal releases |

**Never:** `flyway clean`, `DROP DATABASE`, `DROP TABLE`, `TRUNCATE`, blind `DELETE`/`UPDATE`, destructive recovery.

### Release migrations V127–V133 (high level)

| Version | File (folder) | Purpose |
|---------|---------------|---------|
| V127 | `storage/V127__entity_photo_file_id.sql` | Entity photo `*_file_id` columns; expands `stored_files.purpose` CHECK for photo purposes |
| V128 | `enquiry/V128__inquiry_credits_and_payment.sql` | Inquiry credit packages, ledger, payment config, purchase requests |
| V129 | `enquiry/V129__inquiry_purchase_pending_unique.sql` | Unique pending purchase per user+package |
| V130 | `enquiry/V130__space_enquiries_client_channel.sql` | `client_channel` WEB/ANDROID + email-sent timestamp |
| V131 | `notification/V131__space_notifications_nullable_space_id.sql` | Nullable `space_id` for platform notifications |
| V132 | `enquiry/V132__space_enquiry_deliveries.sql` | Channel-specific enquiry delivery tracking |
| V133 | `storage/V133__stored_files_inquiry_payment_qr_purpose.sql` | Adds `INQUIRY_PAYMENT_QR` to `stored_files.purpose` CHECK |

**Why V133:** Hibernate/`FilePurpose` includes `INQUIRY_PAYMENT_QR` for inquiry payment QR uploads. Without the CHECK expansion, inserts/validation fail against production DB.

### Safe Flyway history verification (verified read-only approach)

One-off Postgres client container on EC2 using host networking and `--env-file` (does not print secrets):

```bash
sudo docker run --rm --network host --env-file /home/ubuntu/acomi-backend.env postgres:16-alpine \
  sh -c 'PGPASSWORD="$DB_PASSWORD" psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USERNAME" -d "$DB_NAME" -c \
  "SELECT version, description, success, installed_on FROM flyway_schema_history WHERE version IN ('\''127'\'','\''128'\'','\''129'\'','\''130'\'','\''131'\'','\''132'\'','\''133'\'') ORDER BY installed_rank;"'
```

**SUCCESS:** All seven rows `success = t`.  
**Note:** Prod Flyway logger is often `warn`, so application logs may not show `Migrating schema...` INFO lines even when migrations applied.

---

## Part 6 — Backend R2 Storage

### Architecture

- Private bucket `acomi-prod-files` on Cloudflare R2 (S3-compatible).
- Backend issues **signed upload/download URLs**.
- Clients never receive R2 credentials.
- Authorization is application-controlled.

### Required env vars (names only; values NOT STORED)

On `/home/ubuntu/acomi-backend.env`:

- `ACOMI_STORAGE_ENABLED`
- `ACOMI_STORAGE_PROVIDER` (production: `s3compatible`)
- `ACOMI_STORAGE_LOGICAL_NAME` (production: `r2`)
- `ACOMI_STORAGE_BUCKET` (production: `acomi-prod-files`)
- `ACOMI_STORAGE_ENDPOINT`
- `ACOMI_STORAGE_REGION` (production: `auto`)
- `ACOMI_STORAGE_PATH_STYLE` (production: `true`)
- `ACOMI_STORAGE_ACCESS_KEY`
- `ACOMI_STORAGE_SECRET_KEY`
- `ACOMI_STORAGE_UPLOAD_TTL`
- `ACOMI_STORAGE_DOWNLOAD_TTL`
- `ACOMI_STORAGE_PENDING_TTL`
- `ACOMI_STORAGE_UNASSOCIATED_GRACE_DAYS`
- `ACOMI_STORAGE_PURGE_DAYS`
- `ACOMI_STORAGE_MAX_SESSIONS_PER_HOUR`
- `ACOMI_STORAGE_CLEANUP_JOB_MS`

### Verify without printing secrets (verified)

- Key presence / non-empty on env file.
- Container env key names present after `docker run --env-file ...`.
- Startup log: `storage_provider_selected adapter=s3compatible logicalName=r2 bucketConfigured=true`.

### R2 CORS

**Not verified during the 2026-09-18 backend deploy.**  
**VERIFY BEFORE USE** in Cloudflare R2 dashboard / wrangler: allowed origins should include production browser origins that upload via signed URLs (typically `https://app.acomi.in` and `https://www.acomi.in`), methods such as `PUT`/`GET`/`HEAD`/`POST` as required by the upload flow. Do not expose account IDs unnecessarily in chat if treated as sensitive.

---

## Part 7 — Firebase / FCM

| Item | Detail |
|------|--------|
| Credentials file (host) | `/home/ubuntu/acomi/firebase/firebase-service-account.json` |
| Mount | bind, read-only → `/app/firebase-service-account.json` |
| Env | `FIREBASE_CREDENTIALS_PATH` (points at container path), `ACOMI_PUSH_ENABLED` |
| Service-account JSON contents | **NOT STORED IN THIS DOCUMENT** |

### Permission requirement (verified incident + fix)

- Container runs as non-root user `acomi` (uid `999` in image).
- Host file owned by `ubuntu` with mode `600` is **not** readable inside the container → FCM init fails (`FCM initialization failed; push delivery disabled`).
- Verified fix: make the **file** world-readable for the numeric UID mismatch while keeping the parent directory owner-restricted, e.g. `chmod 644` on the service-account file (directory stayed `700`).
- Success log: `Firebase Admin SDK initialized for FCM`.
- Confirm inside container: `test -r /app/firebase-service-account.json && echo READABLE_YES`.

Do **not** remove or rotate Firebase credentials during normal deploys.

---

## Part 8 — Web App Deployment

**Repo:** `K:\AcomiWeb` (`AcomiWebApp`)  
**Successful release reference:** commit `0b7f959`  
**Hosting:** S3 `acomi-web-prod` + CloudFront `E2VH4TPFBNMP5` → `https://app.acomi.in/`

### Production API config (verified)

Tracked `.env.production`:

```properties
VITE_API_BASE_URL=https://api.acomi.in/api/v1
VITE_API_TIMEOUT_MS=30000
VITE_APP_ENV=production
```

These are public build-time values (not secrets).

### Procedure (verified)

1. Verify git / commit (`0b7f959` or newer finalized SHA). Do not commit QA scripts under `scripts/`.
2. Ensure TypeScript build passes:
   ```powershell
   cd K:\AcomiWeb
   npm run build
   ```
   (`tsc -b && vite build`). **STOP** if TypeScript errors remain.
3. Confirm dist embeds `https://api.acomi.in/api/v1`.
4. Upload (verified command — **no** `--delete` on the successful Web deploy of 2026-09-18):
   ```powershell
   aws s3 sync "K:\AcomiWeb\dist" s3://acomi-web-prod --region ap-south-1
   ```
5. Invalidate CloudFront (verified):
   ```powershell
   aws cloudfront create-invalidation --distribution-id E2VH4TPFBNMP5 --paths "/*"
   ```
6. Verify:
   - `https://app.acomi.in/` HTTP 200
   - hashed `/assets/...` HTTP 200
   - live bundle contains `VITE_API_BASE_URL: https://api.acomi.in/api/v1`

**Note:** Web and Public Website use **different** buckets and CloudFront IDs. Do not mix them.

---

## Part 9 — Public Website Deployment

**Repo:** `K:\AcomiPublicWebsite` (`AcomiPublicWebsite`)  
**Successful release reference:** commit `519543f`  
**Hosting:** S3 `acomi-public-website-prod` + CloudFront `EY4G3DEY1DAFT` → `https://www.acomi.in/`  
**Deploy branch:** `production` (also keep `main` / `develop` synchronized when releasing)

### Local gitignored `.env.production` (verified requirement)

Public Website `.gitignore` ignores `.env.*` (except `.env.example`).  
Without `.env.production`, Vite may bake **`http://localhost:8080/api/v1`** into the production bundle (observed on a prior live site).

Create/update **local** gitignored file before build (public values only):

```properties
VITE_API_BASE_URL=https://api.acomi.in/api/v1
VITE_APP_ORIGIN=https://app.acomi.in
```

**Do not commit secrets.** Do not commit this file if it remains gitignored.

### Procedure (verified)

1. Checkout `production`, verify commit `519543f` (or newer finalized).
2. Ensure `.env.production` as above.
3. Build:
   ```powershell
   cd K:\AcomiPublicWebsite
   npm run build
   ```
4. Verify dist contains `https://api.acomi.in/api/v1`, enquiry copy (`Unlimited enquiries`, `Only 5 enquiries per day`, `Free on Android`), `deliveryChannel`, `intent://`, `location.assign`, and **no** `window.open(` for the app CTA helper.
5. Sync with **delete** (verified for Public Website only):
   ```powershell
   aws s3 sync dist/ s3://acomi-public-website-prod --delete --region ap-south-1
   ```
   **WARNING:** `--delete` removes S3 objects not present in `dist/`. Use **only** against `acomi-public-website-prod`.
6. Invalidate:
   ```powershell
   aws cloudfront create-invalidation --distribution-id EY4G3DEY1DAFT --paths "/*"
   ```
7. Verify `https://www.acomi.in/` HTTP 200 and assets; confirm live JS API target.

### Deep-link behavior (source / bundle verified)

- After successful WEB enquiry, CTA uses `openAcomiAndroidApp` → `window.location.assign` / Android `intent://` with Play Store fallback.
- Same browsing context; not `target=_blank` / `window.open` for the ACOMI app CTA.

---

## Part 10 — Mobile Release

**Repo:** `K:\AcomiMobile` (`AcomiMobile`)  
**Package:** `com.acomi`  
**Version source of truth:** `android/version.properties`

### Current verified Play-oriented version

```properties
VERSION_CODE=4
VERSION_NAME=1.0.1
```

### Rules

- `android/app/build.gradle` reads `version.properties` for every build.
- `bundleRelease` does **not** auto-increment `VERSION_CODE`.
- Never bump for ordinary local testing.
- Bump only when creating a new Google Play upload.

### Commands (documented in `version.properties` / Gradle)

```powershell
cd K:\AcomiMobile\android
.\gradlew.bat printVersion
.\gradlew.bat bumpVersionCode
.\gradlew.bat bumpVersionCode -PversionName=1.0.2
.\gradlew.bat bundleRelease
```

### Creating v5+ (recommended)

1. Ensure release code is finalized and synchronized.
2. `printVersion` → confirm current.
3. `bumpVersionCode` (and optional `-PversionName=...`).
4. `printVersion` → confirm new values.
5. `bundleRelease`.
6. Verify AAB package/version/permissions before Play upload.

**Artifact path (verified convention):**  
`K:\AcomiMobile\android\app\build\outputs\bundle\release\app-release.aab`

---

## Part 11 — Mobile Play Policy (Photo Picker)

### Required permission state for current policy posture

**Must be ABSENT from the release AAB:**

- `READ_MEDIA_IMAGES`
- `READ_MEDIA_VIDEO`
- `READ_MEDIA_VISUAL_USER_SELECTED`
- `READ_EXTERNAL_STORAGE`
- `WRITE_EXTERNAL_STORAGE`
- `MANAGE_EXTERNAL_STORAGE`

**May be PRESENT:**

- `CAMERA` (take photo)
- `POST_NOTIFICATIONS`

Manifest explicitly removes broad media permissions via `tools:node="remove"`.

### Libraries / config (verified in repo)

- `react-native-image-picker`: `^8.2.1` in `package.json`
- AndroidX Activity: `androidx.activity:activity:1.9.3` for Photo Picker / `PickVisualMedia` backport
- Gallery uses system Photo Picker; camera uses `CAMERA`

### Verify AAB before upload

**VERIFY BEFORE USE** (tooling may vary):

```powershell
# Example pattern — confirm local bundletool / aapt2 availability first
bundletool dump manifest --bundle app-release.aab
```

Confirm `applicationId` `com.acomi`, expected `versionCode` / `versionName`, and absence of forbidden permissions.

---

## Part 12 — Google Play Manual Release

Google Play publishing is **manual** and separate from Git/AWS.

1. Build AAB (`bundleRelease`).
2. Verify package `com.acomi`.
3. Verify `versionCode` / `versionName`.
4. Verify permissions (Part 11).
5. Open Google Play Console (credentials **not** stored here).
6. Select ACOMI.
7. Create production release.
8. Upload AAB.
9. Confirm Play shows expected `versionCode`.
10. Review policy warnings.
11. Add release notes.
12. Submit / roll out.
13. Monitor release status / crashes.

Do not store Play Console passwords in this document.

---

## Part 13 — Deployment Order

1. **Backend** (image + container)
2. Backend health + Flyway / Hibernate verification
3. **Web App**
4. Web verification
5. **Public Website**
6. Public Website verification
7. **Mobile AAB** (local build)
8. **Google Play** (manual)

**Why backend first:** Clients may depend on new APIs and Flyway schema (`ddl-auto=validate`). Shipping Web/Public/Mobile against an unmigrated or failing API causes production outages.

---

## Part 14 — Rollback Procedures

### Backend (pattern verified conceptually; commands marked)

1. Identify previous working ECR digest (example previous before 2026-09-18 deploy: `sha256:095295084eb8bc7dd12069292958557f57804f6d915da177554d5b63a48d4035` — confirm in ECR / backup `summary.txt` before use).
2. Pull that digest on EC2.
3. Stop/rm `acomi-backend`.
4. `docker run` with **same** `--env-file`, port mapping, restart policy, Firebase mount.
5. Verify health / logs.

**VERIFY BEFORE USE** any older digest against current migration state — rolling back app code after newer Flyway versions applied may fail Hibernate validation.

### Web / Public Website

1. Rebuild from last known-good commit **or** restore a previously saved `dist` snapshot if one exists.
2. `aws s3 sync` to the correct bucket (Public Website historically used `--delete`).
3. CloudFront invalidate `/*` on the correct distribution ID.
4. Verify URL + API target in live JS.

Exact automated artifact versioning beyond git commits was **not** standardized in the 2026-09-18 deploys — prefer redeploy from git SHA.

### Mobile

Rollback / staged rollout is managed in **Google Play Console**, not AWS.

---

## Part 15 — Troubleshooting

### Backend

| Symptom | Likely cause | Action |
|---------|--------------|--------|
| Container exits | Bad env, Flyway fail, OOM | `docker logs`; do not clean DB |
| Flyway failure | Bad migration / checksum | **STOP**; fix migration in source; never `clean` |
| Hibernate validation fail | Schema ≠ entities | Ensure pending migrations applied; STOP if not |
| DB connection fail | `DB_*` / network / SSL | Check env key presence (not values); security groups **VERIFY BEFORE USE** |
| R2 not configured | Missing `--env-file` or empty keys | Redeploy with env file; check startup `storage_provider_selected` |
| FCM init failed | File not readable by uid 999 | Fix host file mode; remount; confirm `READABLE_YES` |
| SSH fail | Wrong key/IP | Confirm key path and `15.252.148.84` |
| Port 8080 conflict | Another process/container | Inspect `docker ps` / listeners |

### Web

| Symptom | Action |
|---------|--------|
| `tsc` errors | Fix types before deploy (see 2026-09-18 MUI v9 `sx` / `slotProps` fixes) |
| Wrong API URL | Check `.env.production` and rebuilt dist |
| Old UI after deploy | CloudFront invalidation `E2VH4TPFBNMP5` `/*` |
| S3 wrong bucket | Must be `acomi-web-prod` only |
| CORS errors | Backend `CORS_ALLOWED_ORIGINS` must allow `https://app.acomi.in` (**VERIFY** exact list on server) |

### Public Website

| Symptom | Action |
|---------|--------|
| `localhost:8080` in live JS | Missing `.env.production` at build; rebuild + redeploy |
| Wrong CloudFront | Must be `EY4G3DEY1DAFT`, not Web’s ID |
| Accidental `--delete` on wrong bucket | **Critical** — only `acomi-public-website-prod` |
| Enquiry / deep-link issues | Confirm bundle markers; do not redesign during deploy |

### Mobile

| Symptom | Action |
|---------|--------|
| `versionCode` conflict on Play | Bump intentionally via `bumpVersionCode` |
| Broad media permissions | Ensure manifest removals + Photo Picker path; do not re-add |
| Signing failure | Local keystore config (**not** in this doc) |
| Policy rejection | Re-check Part 11 |

---

## Part 16 — Pre-Deployment Checklist

### Shared

- [ ] Correct repository / local path
- [ ] Correct branch
- [ ] Correct finalized commit present
- [ ] `git status` reviewed (no secrets staged)
- [ ] No force push planned
- [ ] Component order respected (Backend → Web → Public → Mobile/Play)

### Backend

- [ ] Migrations reviewed (`V127`–`V133` or newer as applicable)
- [ ] Production DB will **not** be modified manually
- [ ] Docker image built & pushed
- [ ] Image digest recorded
- [ ] EC2 backup created
- [ ] Env file keys present (values not printed)
- [ ] R2 keys present
- [ ] Firebase mount present & readable by container user
- [ ] Container replaced with env-file + mount + `8080` + `unless-stopped`
- [ ] Health UP
- [ ] No restart loop

### Web

- [ ] `.env.production` → `https://api.acomi.in/api/v1`
- [ ] `npm run build` PASS
- [ ] Synced to `acomi-web-prod`
- [ ] CloudFront `E2VH4TPFBNMP5` invalidated
- [ ] `https://app.acomi.in/` verified

### Public Website

- [ ] Local gitignored `.env.production` set
- [ ] Build does **not** embed localhost API
- [ ] Synced to `acomi-public-website-prod` (with `--delete` only if intentional)
- [ ] CloudFront `EY4G3DEY1DAFT` invalidated
- [ ] `https://www.acomi.in/` verified

### Mobile / Play

- [ ] `printVersion` expected
- [ ] AAB built
- [ ] Permissions verified
- [ ] Play upload only after explicit approval
- [ ] versionCode bumped only for new Play release

---

## Part 17 — Current Release History (as of 2026-09-18)

| Component | Identifier |
|-----------|------------|
| Backend git | `9a1d242` |
| Backend Docker tag | `9a1d242` |
| Backend image digest | `sha256:60922ae03d740621ea18514559e47fb8915a8be76ab8e9b6679d50a040610149` |
| Web git | `0b7f959` |
| Public Website git | `519543f` |
| Mobile versionCode | `4` |
| Mobile versionName | `1.0.1` |

Mobile git HEAD at documentation time may be newer than the Play store binary; Play release is defined by AAB `versionCode`/`versionName`, not solely by git SHA.

---

## Part 18 — Infrastructure Backups

| Backup | Purpose |
|--------|---------|
| `/home/ubuntu/deploy-backups/pre-deploy-20260918T141308Z` | Pre-replace snapshot of `acomi-backend` inspect JSON, summary (image/ports/mounts), redacted env key list, env-file copy (`600`) |
| `/home/ubuntu/acomi-backend.env.backup-*` | Historical env-file copies on EC2 (do not print) |
| `/home/ubuntu/acomi-backend-container-env.backup` | Older container env backup name observed on host |

Do not delete backups during routine deploys. Do not dump secret contents into chat or this document.

---

## Part 19 — Command Reference

### Git (verified / standard)

```powershell
git status
git branch -vv
git log -1 --oneline
git fetch origin
git push origin main develop production aws-production   # only when intentionally syncing; Public Website omits aws-production
```

### AWS (verified)

```powershell
aws sts get-caller-identity
aws ecr get-login-password --region ap-south-1 | docker login --username AWS --password-stdin 484279833542.dkr.ecr.ap-south-1.amazonaws.com
aws ecr describe-images --repository-name acomi-backend --region ap-south-1 --image-ids imageTag=<TAG>
aws s3 sync <local-dist> s3://acomi-web-prod --region ap-south-1
aws s3 sync dist/ s3://acomi-public-website-prod --delete --region ap-south-1
aws cloudfront create-invalidation --distribution-id E2VH4TPFBNMP5 --paths "/*"
aws cloudfront create-invalidation --distribution-id EY4G3DEY1DAFT --paths "/*"
```

### Docker / SSH (verified)

```powershell
ssh -i "K:\Projects\Deployment\AWS\acomi-backend-prod-key.pem" ubuntu@15.252.148.84
# on EC2:
sudo docker ps -a --filter name=acomi-backend
sudo docker logs --since 5m acomi-backend
sudo docker inspect acomi-backend
```

### Backend build (verified)

```powershell
cd K:\Projects\Acomi\Backend\acomi-backend
docker build -t 484279833542.dkr.ecr.ap-south-1.amazonaws.com/acomi-backend:<TAG> .
docker push 484279833542.dkr.ecr.ap-south-1.amazonaws.com/acomi-backend:<TAG>
```

### Web / Public build (verified)

```powershell
cd K:\AcomiWeb
npm run build

cd K:\AcomiPublicWebsite
npm run build
```

### Mobile (documented in project)

```powershell
cd K:\AcomiMobile\android
.\gradlew.bat printVersion
.\gradlew.bat bumpVersionCode
.\gradlew.bat bundleRelease
```

### Unverified / incomplete automation

- Full Nginx TLS reverse-proxy reconfiguration on EC2: **VERIFY BEFORE USE** (not changed during 2026-09-18 backend container replace).
- R2 CORS CLI export: **VERIFY BEFORE USE**.
- Exact `CORS_ALLOWED_ORIGINS` string on production: **VERIFY BEFORE USE** (read on server; do not paste secrets; origins themselves are not credentials).

---

## Part 20 — Future Cursor Agent Instructions

See the boxed section at the top of this document (“Instructions for a Future Cursor Deployment Agent”). That section is normative for automated deploys.

Additional reminders:

- Prefer digest-pinned backend deploys.
- Always use `--env-file /home/ubuntu/acomi-backend.env` for production container runs.
- Preserve Firebase RO mount.
- Web sync historically **without** `--delete`; Public Website sync historically **with** `--delete` — do not swap these casually.
- Stop after each major component and report before continuing to Mobile/Play unless the user explicitly requests the next step.

---

## Document maintenance

When a future production deploy changes digests, CloudFront IDs, IPs, or version codes, update **Part 2** and **Part 17** in the same PR/commit as the operational change documentation — still **without** embedding secrets.

**End of runbook.**
