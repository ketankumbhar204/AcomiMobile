# ACOMI AWS Deployment Guide

**Document status:** Current production runbook  
**Last updated:** 23 August 2026  
**Last production deploy recorded in this document:** 23 August 2026  

This is the long-term source of truth for deploying ACOMI to **existing** AWS production infrastructure.

It covers three separate production surfaces:

1. **AWS Backend** — Spring Boot API at `https://api.acomi.in`
2. **AWS Web App** — authenticated SPA at `https://app.acomi.in`
3. **AWS Public Website** — marketing site at `https://www.acomi.in`

> **Do not create new AWS resources** (S3 buckets, CloudFront distributions, ECR repositories, EC2 instances, CodePipeline, CodeBuild, EventBridge, DNS records) unless a later change is explicitly approved. Reuse the infrastructure in [Current Infrastructure Snapshot](#0-current-infrastructure-snapshot).

> **Security:** This Git file lists **every non-secret production identifier** so you do not need the AWS console for names, IDs, URLs, or IPs. It does **not** contain live secret *values* (database password, JWT secret, OTP hash secret, AWS access keys, SSH private key material). Those stay on EC2 (`~/acomi-backend.env`) and, if you want a laptop copy, in the gitignored file `docs/ACOMI_AWS_SECRETS.local.md`. Putting production passwords in Git would expose the whole production database and auth system.

> **Legend**
>
> | Label | Meaning |
> |-------|---------|
> | **VERIFIED** | Observed on AWS / Git / live HTTP during the 23 August 2026 deployment (and/or the 16 August 2026 backend inventory). |
> | **TO VERIFY** | Not re-confirmed in the latest session, or source location unknown. Do not guess. |

Related backend inventory (Nginx, security group, certificate, deeper host detail): [`ACOMI_BACKEND_AWS_DEPLOYMENT.md`](./ACOMI_BACKEND_AWS_DEPLOYMENT.md). If the two documents disagree on a value that was re-checked on 23 August 2026, **this guide wins**.

---

## 0. Current Infrastructure Snapshot

**AWS account (VERIFIED 23 Aug 2026):** `484279833542`  
**AWS region (VERIFIED):** `ap-south-1`

| Surface | URL | Git source | AWS deployment branch | Compute / storage | CDN |
|---------|-----|------------|----------------------|-------------------|-----|
| Public website | `https://www.acomi.in/` | **TO VERIFY** (not `K:\AcomiWeb`) | **TO VERIFY** (historically described as `production`) | S3 `acomi-public-website-prod` | CloudFront `EY4G3DEY1DAFT` |
| Web app (SPA) | `https://app.acomi.in/` | `K:\AcomiWeb` | `aws-production` | S3 `acomi-web-prod` | CloudFront `E2VH4TPFBNMP5` |
| Backend API | `https://api.acomi.in` | `K:\Projects\Acomi\Backend\acomi-backend` | `aws-production` | ECR `acomi-backend` → EC2 `acomi-backend-prod` | TLS via host Nginx (**TO VERIFY** still the path; public HTTPS health works) |
| Mobile | n/a | `K:\AcomiMobile` | n/a | **Do not deploy mobile from this guide** | n/a |

### 0.1 Live values recorded 23 August 2026 (VERIFIED)

| Item | Value |
|------|--------|
| Web app Git commit deployed | `3959179` `feat: finalize ACOMI web UI improvements` |
| Web app Vite API | `VITE_API_BASE_URL=https://api.acomi.in/api/v1` |
| Web app S3 | `acomi-web-prod` (`ap-south-1`) |
| Web app CloudFront | `E2VH4TPFBNMP5` — alias `app.acomi.in` — origin `acomi-web-prod.s3.ap-south-1.amazonaws.com` |
| Web app invalidation | `I9PM9MZDA4N8NIY2WJYWLVLR7N` — **Completed** |
| Public website S3 | `acomi-public-website-prod` (`ap-south-1`) |
| Public website CloudFront | `EY4G3DEY1DAFT` — alias `www.acomi.in` — origin `acomi-public-website-prod.s3.ap-south-1.amazonaws.com` |
| Public website | Marketing HTML (~2 KB `index.html`), **not** overwritten by the web-app deploy |
| Backend Git commit deployed | `abc1975` `feat: add BEDS and WARDROBE amenity codes` |
| Backend ECR | `484279833542.dkr.ecr.ap-south-1.amazonaws.com/acomi-backend` |
| Backend tags pushed | `abc1975` and `aws-production` |
| Backend image digest | `sha256:59b375034b5514895a9bc42211000683ab5456d338dfa3fd3741f0c1bf659cb5` |
| Backend EC2 name | `acomi-backend-prod` |
| Backend instance ID | `i-08539ae926e943e2b` |
| Backend public IP (SSH used) | `15.252.148.84` |
| Backend private IP | `172.31.43.43` |
| Backend container | `acomi-backend`, publish `8080:8080`, restart `unless-stopped`, env file `~/acomi-backend.env` |
| Previous backend image (rollback on host) | `aws-production-20260821` digest `sha256:b21e6492653bbcc09e6841bb86dc042ddd7312a70cb92e1278a14e3aaa4e4a7b` tagged `acomi-backend:rollback` |
| Backend health | `https://api.acomi.in/actuator/health` → `{"status":"UP"}` |
| CORS on host (env **name** + public origin) | `CORS_ALLOWED_ORIGINS=https://app.acomi.in` |
| Spring profile on host | `SPRING_PROFILES_ACTIVE=prod` |

### 0.2 Other CloudFront (do not use for ACOMI production)

| ID | Status | Origin | Notes |
|----|--------|--------|-------|
| `E3DEW3Q135TWN0` | **Disabled** | `pgmate-frontend-prod.s3.eu-north-1.amazonaws.com` | Not ACOMI production. Do not attach ACOMI domains or deploy here. |

### 0.3 Operator catalog (no AWS Console required)

Copy from here during a deploy. Values below are **identifiers**, not credentials.

#### AWS account

| Item | Value |
|------|--------|
| Account ID | `484279833542` |
| Region | `ap-south-1` |
| Availability Zone (16 Aug inventory) | `ap-south-1a` |

#### Public URLs

| Item | Value |
|------|--------|
| Public website | `https://www.acomi.in/` |
| Web app | `https://app.acomi.in/` |
| API | `https://api.acomi.in` |
| API health | `https://api.acomi.in/actuator/health` |
| Web app login | `https://app.acomi.in/login` |
| Web app register | `https://app.acomi.in/register` |
| Web app privacy / delete-account (mobile config) | `https://app.acomi.in/privacy` , `https://app.acomi.in/delete-account` |
| Vite production API | `https://api.acomi.in/api/v1` |

#### S3 + CloudFront

| Item | Value |
|------|--------|
| Web app bucket | `acomi-web-prod` |
| Web app bucket region | `ap-south-1` |
| Web app origin DNS | `acomi-web-prod.s3.ap-south-1.amazonaws.com` |
| Web app CloudFront ID | `E2VH4TPFBNMP5` |
| Web app CloudFront alias | `app.acomi.in` |
| Public website bucket | `acomi-public-website-prod` |
| Public website origin DNS | `acomi-public-website-prod.s3.ap-south-1.amazonaws.com` |
| Public website CloudFront ID | `EY4G3DEY1DAFT` |
| Public website CloudFront alias | `www.acomi.in` |
| Public website CloudFront domain name (16 Aug / earlier dump) | `djcdjkor1s89t.cloudfront.net` **TO VERIFY** if still attached |
| Disabled unused distribution | `E3DEW3Q135TWN0` |

#### Backend compute

| Item | Value |
|------|--------|
| EC2 name | `acomi-backend-prod` |
| Instance ID (23 Aug 2026) | `i-08539ae926e943e2b` |
| Instance type (16 Aug) | `t3.small` |
| AMI (16 Aug) | `ami-006f82a1d5a27da54` |
| OS (16 Aug) | Ubuntu 24.04 |
| Public IP / SSH target (23 Aug) | `15.252.148.84` |
| Private IP (23 Aug) | `172.31.43.43` |
| VPC (16 Aug) | `vpc-028b88b7c358ae05d` |
| Subnet (16 Aug) | `subnet-0236a445d5e23a00e` |
| Security group name | `acomi-backend-sg` |
| Security group ID (16 Aug) | `sg-08fdbe44ccfe88fee` |
| Elastic IP (16 Aug inventory; **TO VERIFY** vs 23 Aug public IP) | `15.252.148.84` |
| EIP allocation ID (16 Aug) | `eipalloc-088e04ad18cd289e2` |
| EIP association ID (16 Aug) | `eipassoc-0f524554ce5967bf1` |
| IAM instance profile | `acomi-backend-ec2-role` |
| Instance profile ARN | `arn:aws:iam::484279833542:instance-profile/acomi-backend-ec2-role` |
| Attached IAM policy | `arn:aws:iam::aws:policy/AmazonEC2ContainerRegistryReadOnly` |
| SSH user | `ubuntu` |
| SSH key pair name | `acomi-backend-prod-key` |
| Local PEM path (this PC) | `K:\Projects\Deployment\AWS\acomi-backend-prod-key.pem` |
| SSH inbound (16 Aug) | port 22 from `103.221.73.60/32` only — **TO VERIFY** if your IP changed |
| Public HTTP/HTTPS SG | 80 and 443 from `0.0.0.0/0` |
| Direct 8080 SG | 8080 from `0.0.0.0/0` — **SECURITY RISK**, do not widen further |

#### ECR + Docker

| Item | Value |
|------|--------|
| Repository | `acomi-backend` |
| URI | `484279833542.dkr.ecr.ap-south-1.amazonaws.com/acomi-backend` |
| Tag mutability | MUTABLE |
| Production tag | `aws-production` |
| Image currently intended | `abc1975` / digest `sha256:59b375034b5514895a9bc42211000683ab5456d338dfa3fd3741f0c1bf659cb5` |
| Container name | `acomi-backend` |
| Publish | `0.0.0.0:8080->8080/tcp` |
| Restart | `unless-stopped` |
| Env file on host | `/home/ubuntu/acomi-backend.env` (also `~/acomi-backend.env`) |
| Host release log | `~/acomi-releases.log` |
| Use `sudo docker` | yes (`ubuntu` not in `docker` group, 16 Aug) |

#### Nginx / TLS (16 Aug inventory — TO VERIFY unchanged)

| Item | Value |
|------|--------|
| Site file | `/etc/nginx/sites-available/acomi-backend` |
| Upstream | `http://127.0.0.1:8080` |
| Certificate | Certbot for `api.acomi.in` |

#### Database (non-secret)

| Item | Value |
|------|--------|
| Engine | PostgreSQL via Supabase Session Pooler — **not** AWS RDS |
| Host | `aws-0-ap-south-1.pooler.supabase.com` |
| Port | `5432` |
| Database name | `postgres` |
| JDBC SSL | `sslmode=require` |
| Username form | `postgres.<supabase-project-ref>` (ref is sensitive — keep in secrets file, not Git) |

#### Git remotes

| Repo | Local | Remote observed |
|------|-------|-----------------|
| Web app | `K:\AcomiWeb` | `https://github.com/ketankumbhar204/AmicoWebApp.git` (redirects to AcomiWebApp) |
| Backend | `K:\Projects\Acomi\Backend\acomi-backend` | `https://github.com/ketankumbhar204/AmicoBackend.git` |
| Mobile | `K:\AcomiMobile` | `https://github.com/ketankumbhar204/AmicoMobile.git` |

### 0.4 Secrets — names, locations, and why values are not in Git

**Where live production secrets actually are (VERIFIED):**

| Secret | Where it lives |
|--------|----------------|
| Database password | EC2 `/home/ubuntu/acomi-backend.env` → `DB_PASSWORD` |
| JWT signing key | same file → `JWT_SECRET` |
| OTP hash secret | same file → `OTP_HASH_SECRET` (23 Aug host keys) |
| 2Factor SMS API key | same file → `TWOFACTOR_API_KEY` (set on EC2; never Git) |
| SSH private key | local PEM only, never Git |
| AWS login session | AWS CLI profile / `aws login` on the operator PC — not stored in this repo |
| Android release keystore passwords | `K:\AcomiMobile\android\keystore.properties` (gitignored) — mobile only |

**Host env keys observed 23 Aug 2026 (values redacted except public CORS):**

```text
SPRING_PROFILES_ACTIVE=prod
DB_HOST=<secret/semi>
DB_PORT=5432
DB_NAME=postgres
DB_USERNAME=<semi-secret>
DB_PASSWORD=<SECRET — not in Git>
JWT_SECRET=<SECRET — not in Git>
CORS_ALLOWED_ORIGINS=https://app.acomi.in
PORT=8080
OTP_HASH_SECRET=<SECRET — not in Git>
```

`TWOFACTOR_API_KEY` was **not** on the 23 Aug host file. Add it to `~/acomi-backend.env` **before** deploying a backend image with `acomi.otp.sender: twofactor`. Missing it fails startup (`Could not resolve placeholder 'TWOFACTOR_API_KEY'`). Do not put the value in Git.

16 Aug inventory listed `CORS_ALLOWED_ORIGINS` and `SPRING_PROFILES_ACTIVE`. 23 Aug host keys were `CORS_ALLOWED_ORIGINS` and `SPRING_PROFILES_ACTIVE`. If the live file differs, **trust `~/acomi-backend.env`**, do not invent a second file.

**Laptop copy (optional, gitignored):**

1. Copy `docs/ACOMI_AWS_SECRETS.local.example.md` → `docs/ACOMI_AWS_SECRETS.local.md`
2. Fill values **from the EC2 env file** (SSH, `sudo cat` only on your machine). Never commit `.local.md`.
3. `.gitignore` already excludes `docs/ACOMI_AWS_SECRETS.local.md` and `docs/**/*.local.md`.

Do not paste those values into `ACOMI_AWS_DEPLOYMENT_GUIDE.md`.

---


## 1. Repositories and branch strategy

### 1.1 Web app

| | |
|--|--|
| Local | `K:\AcomiWeb` |
| Git remote observed | `https://github.com/ketankumbhar204/AmicoWebApp.git` (**VERIFIED**; GitHub redirects to `AcomiWebApp`) |
| Canonical GitHub name | `https://github.com/ketankumbhar204/AcomiWebApp.git` |
| Development | `develop` |
| Production Git branches | `production`, `aws-production` |
| **AWS deploy source** | `aws-production` |

### 1.2 Backend

| | |
|--|--|
| Local | `K:\Projects\Acomi\Backend\acomi-backend` |
| Git remote observed | `https://github.com/ketankumbhar204/AmicoBackend.git` (**VERIFIED**) |
| Development | `develop` |
| Production Git branches | `production`, `aws-production` |
| **AWS deploy source** | `aws-production` |

### 1.3 Public website

| | |
|--|--|
| Live site | `https://www.acomi.in/` |
| S3 / CloudFront | `acomi-public-website-prod` / `EY4G3DEY1DAFT` (**VERIFIED**) |
| Source Git repository | **TO VERIFY** — this is **not** the `K:\AcomiWeb` SPA. Do not sync `AcomiWeb/dist` to the public-website bucket. |
| Git branch | **TO VERIFY** (older notes say `production`) |

### 1.4 Mobile

`K:\AcomiMobile` is out of scope. Do not deploy mobile as part of AWS web/backend releases.

### 1.5 Branch rules

```text
develop        = development application code + development configuration
production     = production-ready application code + production configuration
aws-production = AWS production deployment source (same application code as
                 production intent, with AWS production configuration)
```

**Never:**

- force-push
- rewrite or discard published history
- merge production secrets or production-only env files into `develop`
- put local/dev API URLs (`localhost`, Render) into `aws-production` / production builds
- deploy `develop` straight to AWS production

Application **code** may be synchronized across branches. **Environment configuration must stay environment-specific.**

---

## 2. AWS authentication (before every deploy)

```powershell
aws sts get-caller-identity
```

Expect account `484279833542`. If the session expired:

```powershell
aws login
```

(`aws login` is the session command used in this environment. If your IAM setup uses a different login tool, use that — **TO VERIFY** for other operators.)

Never store AWS credentials in Git, Docker images, or this file.

---

## 3. AWS Backend deployment

### 3.1 What this deploys

Spring Boot API:

- Public: `https://api.acomi.in`
- Health: `https://api.acomi.in/actuator/health`
- Expected: HTTP 200 and `"status":"UP"` (**VERIFIED**)

There is **no** CodePipeline / CodeBuild / EventBridge for this service (**VERIFIED** 16 Aug 2026; still the operating model on 23 Aug 2026).

Flow:

```text
Git (aws-production)
    → Docker build on operator workstation
    → ECR (immutable SHA tag + mutable aws-production)
    → EC2 acomi-backend-prod (docker pull by digest, replace container)
    → Nginx TLS :443 → container :8080
    → https://api.acomi.in
```

### 3.2 ECR

```text
484279833542.dkr.ecr.ap-south-1.amazonaws.com/acomi-backend
```

| Tag | Mutability | Use |
|-----|------------|-----|
| `<git-sha>` e.g. `abc1975` | Treat as immutable | **Preferred run target** |
| `aws-production` | **Mutable** | Convenience pointer; do not use as the only rollback handle |

Always record the **image digest** after push.

### 3.3 EC2 host

| | **VERIFIED 23 Aug 2026** |
|--|--------------------------|
| Name tag | `acomi-backend-prod` |
| Instance ID | `i-08539ae926e943e2b` |
| SSH | `ubuntu@15.252.148.84` |
| Key pair name | `acomi-backend-prod-key` (**16 Aug inventory**) |
| Local key path (this workstation) | `K:\Projects\Deployment\AWS\acomi-backend-prod-key.pem` — **do not commit** |
| Container name | `acomi-backend` |
| Publish | `-p 8080:8080` |
| Restart | `--restart unless-stopped` |
| Env file | `~/acomi-backend.env` (also referenced as `/home/ubuntu/acomi-backend.env`) |

**TO VERIFY on another operator machine:** SSH key path and whether SSH is still IP-restricted (16 Aug: inbound 22 limited to a specific `/32`).

### 3.4 Environment and CORS

Secrets live **only** on the EC2 env file. Do not replace that file from the laptop.

Env **names** observed on the host (values redacted except public origin):

| Variable | Notes |
|----------|--------|
| `SPRING_PROFILES_ACTIVE` | `prod` |
| `DB_HOST` / `DB_PORT` / `DB_NAME` / `DB_USERNAME` / `DB_PASSWORD` | Database — never commit |
| `JWT_SECRET` | Never commit |
| `OTP_HASH_SECRET` | Never commit |
| `TWOFACTOR_API_KEY` | 2Factor SMS. Required for production OTP. Never commit. No default in `application-prod.yml`. |
| `TWOFACTOR_OTP_TEMPLATE` | Optional. Defaults to `OTP1`. |
| `PORT` | Container listen port |
| `CORS_ALLOWED_ORIGINS` | **VERIFIED** `https://app.acomi.in` |

**Before deploying 2Factor production OTP:** append `TWOFACTOR_API_KEY=...` to `/home/ubuntu/acomi-backend.env` on EC2 (value never in Git). Recreate the container with the same `--env-file` so the process picks it up. Optional: `TWOFACTOR_OTP_TEMPLATE` if 2Factor issued a template other than `OTP1`.

Spring config binds CORS from environment (`CORS_ALLOWED_ORIGINS` in YAML). **Do not** set production CORS to `*`. **Do not** add Render development URLs.

`www.acomi.in` is **not** in production CORS. Browser calls from the marketing site to the API are expected to fail CORS; the SPA on `app.acomi.in` is the allowed origin.

### 3.5 Flyway

The backend uses Flyway at application startup. **Do not** run SQL by hand.

Known migrations in the tree around the 23 Aug 2026 work:

- `V98` / `V99` / `V100` — password hashing, account deletion, OTP

Before restart, compare the **running image digest** with the image you are about to start. If production was already on a 21 Aug 2026 image that included those migrations, they may already be applied.

On 23 Aug 2026, startup reached `Started AcomiBackendApplication` with **no Flyway failure**. Logs did not show V98–V100 as newly applied (likely already present). Still inspect logs on every future deploy.

### 3.6 Exact backend sequence

Work from `K:\Projects\Acomi\Backend\acomi-backend`.

**A. Git**

```powershell
git checkout aws-production
git status
git branch --show-current
git log -1 --oneline
```

Confirm the intended SHA (example: `abc1975`).

**B. AWS + ECR login**

```powershell
aws sts get-caller-identity
aws ecr describe-repositories --repository-names acomi-backend --region ap-south-1
aws ecr get-login-password --region ap-south-1 | docker login --username AWS --password-stdin 484279833542.dkr.ecr.ap-south-1.amazonaws.com
```

**C. Record current production image (workstation)**

```powershell
aws ecr describe-images --region ap-south-1 --repository-name acomi-backend
```

Note the digest currently tagged `aws-production` **and** any dated tags such as `aws-production-20260821`. The **running** container may not match the mutable `aws-production` tag (on 23 Aug it was running `aws-production-20260821`, not the older `aws-production` tag).

**D. Build and push**

```powershell
docker build -t acomi-backend:<GIT_SHA> .
docker tag acomi-backend:<GIT_SHA> 484279833542.dkr.ecr.ap-south-1.amazonaws.com/acomi-backend:<GIT_SHA>
docker tag acomi-backend:<GIT_SHA> 484279833542.dkr.ecr.ap-south-1.amazonaws.com/acomi-backend:aws-production
docker push 484279833542.dkr.ecr.ap-south-1.amazonaws.com/acomi-backend:<GIT_SHA>
docker push 484279833542.dkr.ecr.ap-south-1.amazonaws.com/acomi-backend:aws-production
```

Record the digest from the push output.

**E. On EC2 — rollback alias, then pull by digest**

```bash
sudo docker inspect acomi-backend --format '{{.Image}} {{.State.Status}} {{.State.StartedAt}}'
sudo docker tag "$(sudo docker inspect acomi-backend --format '{{.Image}}')" acomi-backend:rollback
aws ecr get-login-password --region ap-south-1 | sudo docker login --username AWS --password-stdin 484279833542.dkr.ecr.ap-south-1.amazonaws.com
sudo docker pull 484279833542.dkr.ecr.ap-south-1.amazonaws.com/acomi-backend@sha256:<NEW_DIGEST>
```

Do **not** `docker stop` until pull succeeds and rollback exists.

**F. Replace container (downtime)**

Use the **same** env file, ports, name, and restart policy. Do **not** invent a new env file.

```bash
sudo docker stop acomi-backend
sudo docker rm acomi-backend
sudo docker run -d \
  --name acomi-backend \
  --restart unless-stopped \
  --env-file /home/ubuntu/acomi-backend.env \
  -p 8080:8080 \
  484279833542.dkr.ecr.ap-south-1.amazonaws.com/acomi-backend@sha256:<NEW_DIGEST>
```

Append a no-secret line to `~/acomi-releases.log`, for example:

```text
<ISO-UTC> git=<GIT_SHA> ecr_digest=sha256:<NEW_DIGEST> action=deploy
```

**G. Verify**

```bash
sudo docker ps
sudo docker logs --tail 200 acomi-backend
curl -sS http://127.0.0.1:8080/actuator/health
curl -sS https://api.acomi.in/actuator/health
```

Expect `Started AcomiBackendApplication`, no Flyway/Hibernate fatal errors, public health `UP`.

CORS smoke (from operator workstation):

```powershell
Invoke-WebRequest -Uri 'https://api.acomi.in/api/v1/auth/login' -Method OPTIONS -Headers @{ Origin='https://app.acomi.in'; 'Access-Control-Request-Method'='POST' }
```

Expect allow-origin `https://app.acomi.in`.

### 3.7 Backend rollback

```bash
sudo docker stop acomi-backend
sudo docker rm acomi-backend
sudo docker run -d \
  --name acomi-backend \
  --restart unless-stopped \
  --env-file /home/ubuntu/acomi-backend.env \
  -p 8080:8080 \
  acomi-backend:rollback
```

Or pull a **recorded previous digest** from ECR. Do not assume `aws-production` still points at the previous image.

### 3.8 Backend troubleshooting

| Symptom | What to check |
|---------|----------------|
| AWS CLI `session has expired` | `aws login`, then `aws sts get-caller-identity` |
| Docker engine not running on Windows | Start Docker Desktop; wait for `docker info` |
| ECR login fails | Region `ap-south-1`, account `484279833542` |
| `docker pull` fails on index/attestations | Confirm digest pull; if the daemon cannot read an OCI index, **STOP** and do not guess a new registry |
| SSH timeout | Security group SSH `/32` may not match your IP (**TO VERIFY** current rule) |
| Local `:8080` UP but `https://api.acomi.in` 502 | Nginx/Certbot on host — do not rewrite Nginx from this guide unless that is the confirmed fault |
| Flyway error on boot | Read logs; roll back image; **do not** hand-edit production schema |
| CORS 403 from `www.acomi.in` | Expected with current `CORS_ALLOWED_ORIGINS` |
| CORS 403 from `app.acomi.in` | Env file may have been changed — restore previous env; do not set `*` |

---

## 4. AWS Web App deployment

This is the **authenticated SPA** (`K:\AcomiWeb`), **not** the marketing homepage.

### 4.1 Targets (VERIFIED — do not substitute)

| | |
|--|--|
| URL | `https://app.acomi.in/` |
| S3 | `acomi-web-prod` |
| CloudFront | `E2VH4TPFBNMP5` |
| Origin | `acomi-web-prod.s3.ap-south-1.amazonaws.com` |
| Git branch | `aws-production` |
| Production API in build | `VITE_API_BASE_URL=https://api.acomi.in/api/v1` |

**Do not** `aws s3 sync` this `dist/` to `acomi-public-website-prod`. That bucket is the marketing site (`www.acomi.in`). Doing so with `--delete` would replace the public website with the dashboard app, and the app would fail CORS on `www`.

### 4.2 Configuration

Tracked production file (public URL, no secrets):

```text
.env.production
VITE_API_BASE_URL=https://api.acomi.in/api/v1
```

Local/dev `.env` (gitignored) uses the Vite proxy (`/api/v1`) and must **not** be used for `npm run build`.

The production bundle may still contain a **dead** `localhost:8080` fallback string in source defaults. Runtime must use the baked `VITE_API_BASE_URL`. Confirm `MODE: production` and `https://api.acomi.in/api/v1` in `dist` before upload.

### 4.3 Exact web-app sequence

From `K:\AcomiWeb`:

```powershell
git checkout aws-production
git status
git branch --show-current
git log -1 --oneline
```

Confirm SHA (example: `3959179`). Confirm `.env.production`.

```powershell
aws s3api head-bucket --bucket acomi-web-prod
aws cloudfront get-distribution --id E2VH4TPFBNMP5
```

Build:

```powershell
npm ci
npm run build
```

If Windows `npm ci` fails with EPERM on a locked Rolldown/native binary (known on this workstation):

```powershell
npm install
npm run build
```

Inspect `dist/index.html` and JS:

- Title/branding: **ACOMI**
- Must **not** ship user-facing CountIn / Residine / Amico branding
- Must **not** call `onrender.com`
- Must call `https://api.acomi.in/api/v1`

Deploy:

```powershell
aws s3 sync dist/ s3://acomi-web-prod --delete
aws cloudfront create-invalidation --distribution-id E2VH4TPFBNMP5 --paths "/*"
```

Wait until invalidation `Status` is `Completed`.

```powershell
aws cloudfront get-invalidation --distribution-id E2VH4TPFBNMP5 --id <INVALIDATION_ID>
```

### 4.4 Web-app verification

```text
https://app.acomi.in/
https://app.acomi.in/login
https://app.acomi.in/register
```

Confirm the live `index.html` length/asset hash matches the new `dist` (bypass cache after invalidation).

API from the app origin must remain `https://api.acomi.in/api/v1`.

### 4.5 Web-app rollback

Redeploy `dist/` from the previous known-good Git commit on `aws-production` (or a recorded SHA) using the same S3 bucket and CloudFront invalidation.

S3 versioning for `acomi-web-prod`: **TO VERIFY**. Do not assume object versions exist until checked.

### 4.6 Web-app troubleshooting

| Symptom | What to check |
|---------|----------------|
| Build uses localhost API | Wrong mode; confirm `.env.production` and `vite` production mode |
| `npm ci` EPERM on Windows | `npm install` then `npm run build` |
| Site looks old | Invalidation not complete; confirm CloudFront ID is `E2VH4TPFBNMP5` not the www distribution |
| Login CORS errors | Backend `CORS_ALLOWED_ORIGINS` must include `https://app.acomi.in` |
| Accidentally synced to public-website bucket | Restore marketing objects; never `--delete` onto `acomi-public-website-prod` from this repo |

---

## 5. AWS Public Website deployment

### 5.1 Targets (VERIFIED)

| | |
|--|--|
| URL | `https://www.acomi.in/` |
| S3 | `acomi-public-website-prod` |
| CloudFront | `EY4G3DEY1DAFT` |
| Origin | `acomi-public-website-prod.s3.ap-south-1.amazonaws.com` |
| Role | Marketing / product pages |

Live content observed 23 Aug 2026: small `index.html`, hashed marketing JS/CSS, `screenshots/`, `sitemap.xml`, `robots.txt`, `brand/logo.png`. Title: *ACOMI - Know who's staying, who's eating, what's due*.

CTAs (verify after a **website** deploy, not after a web-app deploy):

- Get started → `https://app.acomi.in/register`
- Sign in → `https://app.acomi.in/login`

Public routes to check:

```text
/
/features
/how-it-works
/who-its-for
/platforms
/pricing
/about
```

(These currently return the marketing SPA `index.html` with HTTP 200.)

### 5.2 Source and build — TO VERIFY

The Git repository and exact `package.json` scripts for the marketing site were **not** identified in the 23 August 2026 session.

Until the source repo is confirmed:

1. Do **not** deploy `K:\AcomiWeb` to this bucket.
2. Confirm repo, branch, and build command with the owner.
3. Then follow the same pattern: production build → inspect `dist/` → `aws s3 sync dist/ s3://acomi-public-website-prod --delete` → invalidate `EY4G3DEY1DAFT` `/*`.

Older notes suggested branch `production` and `npm ci` / `npm run build`. Treat that as **TO VERIFY**.

### 5.3 Public website sequence (once source is confirmed)

```powershell
aws s3api head-bucket --bucket acomi-public-website-prod
aws cloudfront get-distribution --id EY4G3DEY1DAFT
```

After a verified production `dist/`:

```powershell
aws s3 sync dist/ s3://acomi-public-website-prod --delete
aws cloudfront create-invalidation --distribution-id EY4G3DEY1DAFT --paths "/*"
```

Verify `https://www.acomi.in/` still looks like the **marketing** site (not the operator dashboard).

### 5.4 Public website rollback

Redeploy the previous marketing `dist/` and invalidate `EY4G3DEY1DAFT`. S3 versioning on this bucket: **TO VERIFY**.

---

## 6. Web app vs public website (mandatory)

| | Public website | Web app |
|--|----------------|---------|
| URL | `https://www.acomi.in/` | `https://app.acomi.in/` |
| S3 | `acomi-public-website-prod` | `acomi-web-prod` |
| CloudFront | `EY4G3DEY1DAFT` | `E2VH4TPFBNMP5` |
| Git | **TO VERIFY** | `K:\AcomiWeb` `aws-production` |
| API CORS | Not an allowed origin today | `https://app.acomi.in` |
| Purpose | Marketing | Authenticated operations UI |

**23 August 2026:** backend + **web app** were released. The **public website was left unchanged** on purpose.

---

## 7. End-to-end production sequence (typical release)

1. Confirm AWS identity (`484279833542`, `ap-south-1`).
2. Confirm Git SHAs on `aws-production` (web and backend). Do not re-sync branches unless the working tree is wrong.
3. **Backend:** build → push SHA + `aws-production` → EC2 pull **digest** → replace container → health `UP`.
4. **Web app:** production Vite build → inspect API URL → sync `acomi-web-prod` → invalidate `E2VH4TPFBNMP5`.
5. **Public website:** only if marketing source changed — sync `acomi-public-website-prod` → invalidate `EY4G3DEY1DAFT`.
6. Verify `app.acomi.in` login/register, `api.acomi.in` health, CORS, and that `www.acomi.in` is still marketing.
7. Do not deploy mobile.

---

## 8. Production safety rules

Never:

- force-push or delete production branches
- create a second production S3 bucket, CloudFront distribution, ECR repo, or EC2 instance
- create CodePipeline / CodeBuild / EventBridge for this stack unless explicitly approved
- change DNS from this runbook
- set production CORS to `*`
- point production frontend at localhost or Render
- commit secrets or the EC2 env file
- `aws s3 rm --recursive` on production buckets
- overwrite `acomi-public-website-prod` with the web-app SPA
- run Flyway by hand
- `docker image prune` immediately after a failed deploy (preserves rollback layers)

---

## 9. Deployment checklist

Copy per release. Fill SHAs/digests as you go.

### 9.1 Pre-flight

- [ ] `aws sts get-caller-identity` → account `484279833542`
- [ ] Web `aws-production` SHA: ________
- [ ] Backend `aws-production` SHA: ________
- [ ] Web `.env.production` is `https://api.acomi.in/api/v1`
- [ ] `head-bucket acomi-web-prod`
- [ ] `get-distribution E2VH4TPFBNMP5`
- [ ] `head-bucket acomi-public-website-prod` (if touching www)
- [ ] `get-distribution EY4G3DEY1DAFT` (if touching www)
- [ ] `ecr describe-repositories acomi-backend`
- [ ] EC2 `acomi-backend-prod` running
- [ ] Current backend digest recorded: ________

### 9.2 Backend

- [ ] Docker build succeeded
- [ ] Pushed `<GIT_SHA>` and `aws-production`
- [ ] New digest: ________
- [ ] Host `acomi-backend:rollback` tagged
- [ ] Pull by digest succeeded **before** stop
- [ ] Recreated container with existing `--env-file` and `-p 8080:8080`
- [ ] Local and public `/actuator/health` UP
- [ ] Logs: started; Flyway OK or already applied
- [ ] CORS from `https://app.acomi.in` OK

### 9.3 Web app

- [ ] `npm run build` succeeded
- [ ] Bundle has `https://api.acomi.in/api/v1`, ACOMI branding, no Render
- [ ] Synced to **`acomi-web-prod` only**
- [ ] Invalidated **`E2VH4TPFBNMP5`** `/*` — ID: ________ Status: ________
- [ ] `https://app.acomi.in/` `/login` `/register` 200, new asset hash

### 9.4 Public website (only if releasing marketing)

- [ ] Source repo/branch **verified** (not AcomiWeb SPA)
- [ ] Synced to `acomi-public-website-prod`
- [ ] Invalidated `EY4G3DEY1DAFT`
- [ ] `https://www.acomi.in/` still marketing; CTAs to `app.acomi.in`

### 9.5 Final

- [ ] `www.acomi.in` not replaced by dashboard
- [ ] Mobile not deployed
- [ ] No secrets in Git

---

## 10. Useful AWS commands

```powershell
aws sts get-caller-identity

aws s3api head-bucket --bucket acomi-web-prod
aws s3api head-bucket --bucket acomi-public-website-prod
aws s3 ls s3://acomi-web-prod
aws s3 ls s3://acomi-public-website-prod

aws cloudfront get-distribution --id E2VH4TPFBNMP5
aws cloudfront get-distribution --id EY4G3DEY1DAFT
aws cloudfront list-invalidations --distribution-id E2VH4TPFBNMP5
aws cloudfront list-invalidations --distribution-id EY4G3DEY1DAFT

aws ecr describe-repositories --repository-names acomi-backend --region ap-south-1
aws ecr describe-images --repository-name acomi-backend --region ap-south-1

aws ec2 describe-instances --region ap-south-1 --filters "Name=tag:Name,Values=acomi-backend-prod" --query "Reservations[].Instances[].{Id:InstanceId,State:State.Name,PublicIp:PublicIpAddress,PrivateIp:PrivateIpAddress}"
```

SSH (this workstation):

```powershell
ssh -i "K:\Projects\Deployment\AWS\acomi-backend-prod-key.pem" ubuntu@15.252.148.84
```

---

## 11. Deployment principle

```text
Correct production branch
        ↓
Verify configuration (API URL, CORS env, no secrets in Git)
        ↓
Build
        ↓
Verify build / image
        ↓
Deploy to EXISTING matching AWS resources
        ↓
Verify health and the correct public URL
```

**Code can move across Git branches. Environment configuration must not.**

**Web app (`app.acomi.in`) and public website (`www.acomi.in`) are different products on different S3/CloudFront pairs. Never cross-deploy them.**
