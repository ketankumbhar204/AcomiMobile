# ACOMI Backend — AWS Deployment Document

**Document status:** CURRENT VERIFIED STATE (16 August 2026) plus labeled recommendations  
**Last verified:** 16 August 2026  
**Application:** ACOMI Java / Spring Boot Backend  
**Primary production API:** `https://api.acomi.in`

**How to read this document**

| Label | Meaning |
|-------|---------|
| **CURRENT VERIFIED STATE** | Observed on 16 August 2026 (AWS CLI, SSH, Docker, Nginx, Certbot, DNS, public health). Do not treat as “already fixed” if a later section recommends a change. |
| **RECOMMENDED FUTURE IMPROVEMENT** | Not implemented. Do not claim it is live. |
| **BLOCKER** | Must be resolved before the named milestone (for example public consumer auth or Play AAB). |
| **SECURITY RISK** | Current exposure or process risk. Do not change AWS/Docker/Nginx from this document alone. |

**Re-verify before production use.** Instance IDs, EIP, DNS, container digest, certificate expiry, and health can change. Before any update or incident response, re-run the verification commands in [§16](#16-production-api-verification) and [§22](#22-production-verification-checklist). This session did not re-probe AWS.

> **Security:** Do not commit production credentials, JWT secrets, database passwords, private keys, ECR passwords, or the contents of `/home/ubuntu/acomi-backend.env`. This document lists **variable names** and non-secret infrastructure facts only.

---

## 1. Purpose

This document records the **actual ACOMI production Java backend on AWS** and the operational procedures to update, verify, and roll back that deployment.

It is based on direct verification of AWS CLI, EC2, ECR, Docker, EC2 shell history, Nginx, Certbot, DNS, and public health checks (16 August 2026).

It does **not** claim CloudWatch, SSM Parameter Store, GitHub Actions, CodePipeline, automated backups, or automated deployment. Those were **not** found.

---

## 2. Production architecture

### 2.1 CURRENT VERIFIED STATE — request path

```text
                           Internet
                              |
                              | HTTPS :443
                              v
                       api.acomi.in
                              |
                              v
                    Elastic IP 15.252.148.84
                              |
                              v
                    EC2: acomi-backend-prod
                              |
                    +---------+---------+
                    |                   |
                    | Nginx :443        | Docker :8080
                    |                   | (also published
                    | proxy_pass        |  on 0.0.0.0:8080)
                    | 127.0.0.1:8080    |
                    |                   |
                    +---------+---------+
                              |
                              v
                    Docker container
                       acomi-backend
                              |
                              v
                  Spring Boot / Java 17
                    java -jar app.jar
                              |
                              v
                    PostgreSQL / Supabase
                    (Session Pooler)
```

**SECURITY RISK (HIGH):** Port 8080 is published on all interfaces and allowed from `0.0.0.0/0`. The intended public route is HTTPS on `api.acomi.in` only. See [§6.2](#62-security-observation--port-8080) and [§28](#28-security-considerations).

### 2.2 CURRENT VERIFIED STATE — image path

```text
ACOMI Backend Git (build performed outside this host)
     |
     | Docker image
     v
Amazon ECR
  acomi-backend:aws-production     ← MUTABLE tag
     |
     | docker pull
     v
EC2: acomi-backend-prod
     |
     v
Docker container acomi-backend
     |
     v
Spring Boot :8080
```

---

## 3. AWS account and region

**CURRENT VERIFIED STATE**

| Property | Verified value |
|----------|----------------|
| AWS Account | `484279833542` |
| AWS Region | `ap-south-1` |
| Availability Zone | `ap-south-1a` |

```powershell
aws sts get-caller-identity
aws configure get region
```

Use `--region ap-south-1` on EC2/ECR commands even if the default region is set.

---

## 4. EC2 production server

### 4.1 Instance

**CURRENT VERIFIED STATE**

| Property | Value |
|----------|--------|
| Instance name | `acomi-backend-prod` |
| Instance ID | `i-08539ae926e943e2b` |
| Instance type | `t3.small` (2 vCPU, 2 GiB RAM) |
| State (16 Aug 2026) | `running` |
| AMI | `ami-006f82a1d5a27da54` |
| OS | Ubuntu 24.04 (Canonical, amd64 noble) |
| Architecture | `x86_64` |
| Private IP | `172.31.43.43` |
| Public IP / Elastic IP | `15.252.148.84` |
| VPC | `vpc-028b88b7c358ae05d` |
| Subnet | `subnet-0236a445d5e23a00e` |
| Availability Zone | `ap-south-1a` |

`t3.small` (2 GiB) is larger than the Render Free instance that previously exited **137** during Hibernate startup. That history is context only; do not assume AWS cannot OOM.

### 4.2 SSH access

**CURRENT VERIFIED STATE**

| Item | Value |
|------|--------|
| Key pair name | `acomi-backend-prod-key` |
| Local private key path | `K:\Projects\Deployment\AWS\acomi-backend-prod-key.pem` |
| OS user | `ubuntu` |

```powershell
ssh -i "K:\Projects\Deployment\AWS\acomi-backend-prod-key.pem" ubuntu@15.252.148.84
```

Keep the `.pem` file private. Do not commit it to Git or upload it to GitHub.

SSH inbound is restricted to `103.221.73.60/32` ([§6](#6-ec2-security-group)). If that client IP changes, SSH will fail. **RECOMMENDED FUTURE IMPROVEMENT:** document an out-of-band break-glass process. Do **not** open port 22 to `0.0.0.0/0` from this runbook.

---

## 5. Elastic IP

**CURRENT VERIFIED STATE**

| Property | Value |
|----------|--------|
| Elastic IP | `15.252.148.84` |
| Allocation ID | `eipalloc-088e04ad18cd289e2` |
| Association ID | `eipassoc-0f524554ce5967bf1` |
| Associated instance | `i-08539ae926e943e2b` |

```powershell
aws ec2 describe-addresses `
  --region ap-south-1 `
  --query "Addresses[?InstanceId=='i-08539ae926e943e2b'].{PublicIP:PublicIp,AllocationId:AllocationId,AssociationId:AssociationId,InstanceId:InstanceId}" `
  --output table
```

---

## 6. EC2 security group

**CURRENT VERIFIED STATE**

| Property | Value |
|----------|--------|
| Name | `acomi-backend-sg` |
| ID | `sg-08fdbe44ccfe88fee` |
| VPC | `vpc-028b88b7c358ae05d` |
| Description | Security group for ACOMI production backend |

### 6.1 Inbound rules (current)

| Port | Protocol | Source | Purpose |
|------|----------|--------|---------|
| 80 | TCP | `0.0.0.0/0` | HTTP / redirect to HTTPS |
| 443 | TCP | `0.0.0.0/0` | Public HTTPS API |
| 8080 | TCP | `0.0.0.0/0` | Direct backend (see risk) |
| 22 | TCP | `103.221.73.60/32` | SSH |

Outbound: all protocols / all ports → `0.0.0.0/0`.

### 6.2 Security observation — port 8080

**CURRENT VERIFIED STATE:** Port 8080 is publicly allowed on the security group **and** published by Docker:

```text
0.0.0.0:8080 -> container:8080
```

**SECURITY RISK (HIGH):** Anyone on the internet can reach Spring Boot on HTTP :8080, bypassing Nginx and TLS.

**RECOMMENDED FUTURE IMPROVEMENT (not done):**

1. Change the container publish to `127.0.0.1:8080:8080` so only Nginx on the instance can reach Spring.
2. Remove inbound **8080** from `acomi-backend-sg`.

Do **not** change the security group or Docker publish from this document. Validate health and Nginx first, then apply in a controlled change window.

---

## 7. IAM

**CURRENT VERIFIED STATE**

| Property | Value |
|----------|--------|
| Instance profile | `acomi-backend-ec2-role` |
| Instance profile ARN | `arn:aws:iam::484279833542:instance-profile/acomi-backend-ec2-role` |
| Instance profile ID | `AIPAXBQKT2PDIEQLQIT7P` |
| Attached managed policy | `AmazonEC2ContainerRegistryReadOnly` |
| Policy ARN | `arn:aws:iam::aws:policy/AmazonEC2ContainerRegistryReadOnly` |
| Inline policies | None |

This matches ECR pull on the instance. SSM, CloudWatch agent, and deploy roles were **not** verified and are **not** claimed.

```powershell
aws iam list-attached-role-policies --role-name acomi-backend-ec2-role --output table
aws iam list-role-policies --role-name acomi-backend-ec2-role --output table
```

---

## 8. Amazon ECR

### 8.1 Repository

**CURRENT VERIFIED STATE**

| Property | Value |
|----------|--------|
| Repository | `acomi-backend` |
| Region | `ap-south-1` |
| URI | `484279833542.dkr.ecr.ap-south-1.amazonaws.com/acomi-backend` |
| Tag mutability | **MUTABLE** |
| Repository created | 15 Aug 2026 |

**The production tag `aws-production` is MUTABLE.** Pushing a new image with the same tag moves the tag. A later `docker pull ...:aws-production` may not be the image that is running now.

```powershell
aws ecr describe-repositories `
  --region ap-south-1 `
  --query "repositories[].{Name:repositoryName,URI:repositoryUri,Created:createdAt,TagMutability:imageTagMutability}" `
  --output table
```

### 8.2 Production image (verified 16 Aug 2026)

| Property | Value |
|----------|--------|
| Tag | `aws-production` (mutable) |
| Digest | `sha256:67e92266ac3a95821432b4e93d1f9c94627eb1587e63aed78a4258ac39f43161` |
| Pushed | 2026-08-15 17:20:11 +05:30 |
| Size | 155182544 bytes (~155 MB) |

Re-query before every update (tag may have moved):

```powershell
aws ecr describe-images `
  --region ap-south-1 `
  --repository-name acomi-backend `
  --query "imageDetails[].{Tags:imageTags,Pushed:imagePushedAt,Size:imageSizeInBytes,Digest:imageDigest}" `
  --output table
```

### 8.3 Git SHA → ECR digest tracking

**CURRENT VERIFIED STATE:** No release log that maps Git commit → ECR digest was found on the server or in Backend Git.

**RECOMMENDED FUTURE IMPROVEMENT:** Before each production pull, append one line (no secrets) to `~/acomi-releases.log` on EC2 and keep a copy off-box:

```text
<ISO-date> git=<SHA> ecr_tag=aws-production ecr_digest=sha256:<digest> action=deploy|rollback
```

Also tag images immutably at push time, for example:

```text
484279833542.dkr.ecr.ap-south-1.amazonaws.com/acomi-backend:<git-sha>
```

in addition to moving `aws-production`.

---

## 9. Dockerfile and image facts (Backend repository)

**CURRENT VERIFIED STATE** (Backend repo `Dockerfile`, not an AWS setting):

| Item | Repository fact |
|------|-----------------|
| Build stage | `eclipse-temurin:17-jdk-jammy` |
| Runtime stage | `eclipse-temurin:17-jre-jammy` |
| Workdir | `/app` |
| Build | `./mvnw -B clean package -DskipTests` |
| JAR | `acomi-backend-0.0.1-SNAPSHOT.jar` copied to `app.jar` |
| User | non-root `acomi` |
| ENTRYPOINT | `["java", "-jar", "app.jar"]` |
| EXPOSE | `8080` |
| HEALTHCHECK | **None** in Dockerfile |
| JVM flags in image | **None** (`JAVA_TOOL_OPTIONS` is not set in the Dockerfile) |
| Secrets in image | None; runtime env only |
| Comment in Dockerfile | Still says “Render Docker Web Service” — **HISTORICAL** comment; the image is a generic JVM container |

`.dockerignore` excludes `.git`, `target`, IDE files, logs, `HELP.md`. It does not copy `docs/`.

Running container Java (16 Aug 2026): `JAVA_VERSION=jdk-17.0.19+10`, `JAVA_HOME=/opt/java/openjdk`.

---

## 10. Docker runtime

**CURRENT VERIFIED STATE**

| Item | Value |
|------|--------|
| Docker version | 29.1.3 |
| Service | `docker.service` active (running), enabled at boot |
| `ubuntu` in `docker` group | **No** — use `sudo docker` |
| Groups | `ubuntu adm cdrom sudo dip lxd` |
| `docker` group | `docker:x:113:` |

```bash
docker --version
sudo systemctl status docker --no-pager
```

Do not change group membership unless required operationally.

---

## 11. Production Docker container

**CURRENT VERIFIED STATE** (16 Aug 2026)

| Item | Value |
|------|--------|
| Name | `acomi-backend` |
| Container ID (observed) | `a30af72a5b45` |
| Image | `484279833542.dkr.ecr.ap-south-1.amazonaws.com/acomi-backend:aws-production` |
| Command | `java -jar app.jar` |
| Status | running |
| Restart policy | `unless-stopped` |
| Ports | `0.0.0.0:8080->8080/tcp` and `[::]:8080->8080/tcp` |
| Volumes | None |
| Created | 15 Aug 2026 12:02:19 UTC |

```bash
sudo docker ps --format "table {{.Names}}\t{{.Image}}\t{{.Status}}\t{{.Ports}}"
sudo docker inspect acomi-backend --format 'Created={{.Created}} RestartPolicy={{json .HostConfig.RestartPolicy}}'
sudo docker inspect acomi-backend --format '{{json .Mounts}}'
```

Do **not** run `sudo docker inspect acomi-backend` without `--format` if you will paste the output — the full inspect includes environment values.

Record image identity (read-only):

```bash
sudo docker inspect acomi-backend --format '{{.Image}} {{json .RepoDigests}}'
sudo docker inspect acomi-backend --format '{{.State.Status}} {{.State.StartedAt}}'
```

---

## 12. Production environment configuration

**CURRENT VERIFIED STATE**

Env file on EC2: `/home/ubuntu/acomi-backend.env`  
Permissions: `-rw-------` (`ubuntu:ubuntu`).

### 12.1 Variables

| Variable | Used by | Required in production | Secret? | Notes |
|----------|---------|------------------------|---------|--------|
| `SPRING_PROFILES_ACTIVE` | `application.yml` | Yes — must be `prod` | No | Verified `prod` |
| `DB_HOST` | `application-prod.yml` JDBC URL | Yes | Semi | Session Pooler host verified |
| `DB_PORT` | JDBC URL (default 5432) | Default OK | No | Verified `5432` |
| `DB_NAME` | JDBC URL (default `postgres`) | Default OK | No | Verified `postgres` |
| `DB_USERNAME` | JDBC | Yes | Semi | Pooler form `postgres.<project-ref>` (value not repeated here) |
| `DB_PASSWORD` | JDBC | Yes | **Yes** | Not documented |
| `JWT_SECRET` | `application-prod.yml` | Yes | **Yes** | Not documented |
| `CORS_ALLOWED_ORIGINS` | `acomi.cors.allowed-origins` | Yes | No | Verified `https://app.acomi.in` |
| `PORT` | `server.port` | Yes | No | Verified `8080` |
| `SWAGGER_ENABLED` | springdoc | Should be `false` | No | **Gap:** prod YAML default is `false` if unset. Set explicitly in the env file. **Not verified** as present in the live file. |
| `JWT_EXPIRATION_MS` | JWT TTL | No | No | Repo default `86400000`. Optional. |

Do not print or commit `DB_PASSWORD` or `JWT_SECRET`.

List **names only** on the server:

```bash
grep -E '^[A-Za-z_][A-Za-z0-9_]*=' ~/acomi-backend.env | sed -E 's/=.*/=<REDACTED>/'
```

### 12.2 Repository production behavior (not AWS-specific)

**CURRENT VERIFIED STATE** (Backend Git):

| Topic | Repository |
|-------|------------|
| JDBC | `jdbc:postgresql://${DB_HOST}:${DB_PORT:5432}/${DB_NAME:postgres}?sslmode=require` |
| Flyway | `enabled: true`, `locations: classpath:db/migration`, `baseline-on-migrate: true`, `clean-disabled: true` on `prod` |
| Hibernate | `ddl-auto: validate` (schema must already match migrations) |
| Swagger | `SWAGGER_ENABLED` default **false** on `prod` profile |
| Actuator | Only `health` exposed; `show-details: never` |
| OTP | `acomi.otp.mvp-code` is `"111111"` in `application.yml` for **all** profiles |

**BLOCKER for public consumer authentication:** OTP is not sent via SMS. Any client that knows the MVP code can verify. Do not treat AWS HTTPS as “real OTP.”

---

## 13. Database

**CURRENT VERIFIED STATE**

| Item | Value |
|------|--------|
| Engine | PostgreSQL via Supabase Session Pooler |
| Host | `aws-0-ap-south-1.pooler.supabase.com` |
| Port | `5432` |
| Database name | `postgres` |
| Username form | `postgres.<project-ref>` |
| Password | Not documented |
| SSL | `sslmode=require` in `application-prod.yml` |
| Profile | `SPRING_PROFILES_ACTIVE=prod` |

AWS RDS is **not** used. Do not create RDS for this architecture.

---

## 14. Nginx reverse proxy

**CURRENT VERIFIED STATE**

Site file: `/etc/nginx/sites-available/acomi-backend`  
`api.acomi.in` → `http://127.0.0.1:8080`  
Listens on 80 (HTTP→HTTPS) and 443 (TLS).

Core HTTPS location (verified excerpt):

```nginx
server {
    server_name api.acomi.in;

    location / {
        proxy_pass http://127.0.0.1:8080;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    listen [::]:443 ssl ipv6only=on;
    listen 443 ssl;
    ssl_certificate /etc/letsencrypt/live/api.acomi.in/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/api.acomi.in/privkey.pem;
    include /etc/letsencrypt/options-ssl-nginx.conf;
    ssl_dhparam /etc/letsencrypt/ssl-dhparams.pem;
}
```

WebSockets are **not** required for this REST API.

### 14.1 Nginx operations

```bash
sudo nginx -t
sudo systemctl status nginx --no-pager
ls -l /etc/nginx/sites-enabled/
sudo systemctl reload nginx
```

Reload only after `nginx -t` succeeds. Do not use `restart` unless reload is insufficient.

Logs (Ubuntu defaults; confirm on the host if paths differ):

```bash
sudo tail -n 50 /var/log/nginx/error.log
sudo tail -n 50 /var/log/nginx/access.log
```

**RECOMMENDED FUTURE IMPROVEMENT:** If Spring startup is slow, raise `proxy_read_timeout` / `proxy_connect_timeout` so Nginx does not 502 during a cold start. **Not verified** as currently set.

---

## 15. HTTPS / Let's Encrypt

**CURRENT VERIFIED STATE** (16 Aug 2026)

| Item | Value |
|------|--------|
| Name | `api.acomi.in` |
| Type | ECDSA |
| Full chain | `/etc/letsencrypt/live/api.acomi.in/fullchain.pem` |
| Private key | `/etc/letsencrypt/live/api.acomi.in/privkey.pem` |
| Expiry | 13 Nov 2026 |
| Install command used (historical) | `sudo certbot --nginx -d api.acomi.in` |

```bash
sudo certbot certificates
```

Do not manually edit certificate files.

**Do not re-run `certbot --nginx` as a routine update** — it can rewrite the site file. That command is **historical install only**.

### 15.1 Renewal verification

**CURRENT VERIFIED STATE:** End-to-end renewal was **not** proven. Listed as a gap in [§27](#27-known-limitations--recovery-gaps).

Check timer and dry-run (**does not renew** if dry-run only):

```bash
sudo systemctl list-timers | grep -i certbot
sudo certbot renew --dry-run
```

If dry-run fails, fix before expiry (13 Nov 2026 as of last verify). Do not ignore renewal failures.

---

## 16. Production API verification

**Re-verify before production use.**

### 16.1 Health

```powershell
curl.exe -sS -D - --max-time 30 https://api.acomi.in/actuator/health
```

**CURRENT VERIFIED STATE (16 Aug 2026):** HTTP 200, `Server: nginx/1.24.0 (Ubuntu)`, `Content-Type: application/vnd.spring-boot.actuator.v3+json`.

Repository: `show-details: never`. Expect a small JSON body such as `{"status":"UP",...}` — not datasource details.

On the instance:

```bash
curl -sS -i http://127.0.0.1:8080/actuator/health
```

### 16.2 Unauthenticated API

```powershell
curl.exe -sS -D - --max-time 30 https://api.acomi.in/api/v1/auth/me
```

Expect **HTTP 401** (JWT required), not 403 CORS and not connection failure.

A 401 on `https://api.acomi.in/` (no path) was observed on 16 Aug 2026. That means the request reached Spring Security. It does **not** prove `/` is an application controller.

### 16.3 CORS (Web origin)

```powershell
curl.exe -sS -D - -o NUL --max-time 30 -X OPTIONS "https://api.acomi.in/api/v1/auth/me" `
  -H "Origin: https://app.acomi.in" `
  -H "Access-Control-Request-Method: GET" `
  -H "Access-Control-Request-Headers: Authorization, Content-Type"
```

Expect HTTP 200 and:

```text
Access-Control-Allow-Origin: https://app.acomi.in
Access-Control-Allow-Credentials: true
```

Do **not** POST `/auth/send-otp` for infrastructure checks.

### 16.4 DNS

```powershell
nslookup api.acomi.in
```

**CURRENT VERIFIED STATE (16 Aug 2026):** `api.acomi.in` → `15.252.148.84`.

---

## 17. Mobile integration — AAB BLOCKER

**CURRENT VERIFIED STATE**

| Client | API base | Source |
|--------|----------|--------|
| This Backend (public) | `https://api.acomi.in` (`/api/v1/...`) | This deployment |
| ACOMI Web production build | `https://api.acomi.in/api/v1` | Web `VITE_API_BASE_URL` |
| ACOMI Android **release** (`__DEV__` false) | `https://api.acomi.app/api/v1` | Mobile `src/config/env.ts` |

**BLOCKER for production Android AAB:** Release Mobile does **not** call `https://api.acomi.in`. `api.acomi.app` must not be assumed to reach this Backend unless independently verified (it was NXDOMAIN on 2026-08-14).

Do not change Mobile from this Backend document. Align Mobile (or DNS) in a separate, approved change before Play upload.

---

## 18. Initial deployment procedure (BOOTSTRAP ONLY)

The following reconstructs the **first** bring-up from EC2 shell history (15 Aug 2026).

**Do not use §18.6 `docker run` while a container named `acomi-backend` already exists.** That is bootstrap only. For updates use [§19](#19-backend-update--redeployment-procedure).

### 18.1 Install Docker

```bash
sudo apt install -y docker.io
sudo systemctl enable --now docker
sudo systemctl status docker --no-pager
```

### 18.2 Install AWS CLI

```bash
curl "https://awscli.amazonaws.com/awscli-exe-linux-x86_64.zip" -o "awscliv2.zip"
unzip -q awscliv2.zip
sudo ./aws/install
aws --version
rm -rf aws awscliv2.zip
```

### 18.3 Authenticate Docker to ECR

```bash
aws ecr get-login-password --region ap-south-1 |
sudo docker login --username AWS --password-stdin \
484279833542.dkr.ecr.ap-south-1.amazonaws.com
```

Expected: `Login Succeeded`. Credentials may be stored in `/root/.docker/config.json`.

### 18.4 Pull image

```bash
sudo docker pull \
484279833542.dkr.ecr.ap-south-1.amazonaws.com/acomi-backend:aws-production
```

### 18.5 Environment file

Create `/home/ubuntu/acomi-backend.env` with the variables in [§12](#12-production-environment-configuration). Then:

```bash
chmod 600 ~/acomi-backend.env
```

### 18.6 Start container (bootstrap only)

```bash
sudo docker run -d \
  --name acomi-backend \
  --restart unless-stopped \
  --env-file ~/acomi-backend.env \
  -p 8080:8080 \
  484279833542.dkr.ecr.ap-south-1.amazonaws.com/acomi-backend:aws-production
```

If the name is already in use:

```text
Conflict. The container name "/acomi-backend" is already in use
```

Do **not** `docker rm` to “make run work.” Use §19.

### 18.7 Historical Nginx / Certbot (do not repeat casually)

Nginx site and `sudo certbot --nginx -d api.acomi.in` were used during first setup. Repeating Certbot `--nginx` can rewrite the site. Prefer [§15.1](#151-renewal-verification) for certificates.

---

## 19. Backend update / redeployment procedure

**CURRENT VERIFIED STATE:** Manual `Build → ECR → EC2 → Docker`. No Compose, no ACOMI systemd unit, no cron deploy, no GitHub Actions.

`aws-production` is **MUTABLE**. Always record the **running digest** before pull/stop.

### 19.1 Build and push (operator workstation)

Exact CI is **not** in the Backend repo. Typical local sequence (adjust only if your process differs):

```bash
# From Backend repo, intended branch aws-production
git rev-parse HEAD
docker build -t acomi-backend:local .
docker tag acomi-backend:local \
  484279833542.dkr.ecr.ap-south-1.amazonaws.com/acomi-backend:aws-production
docker tag acomi-backend:local \
  484279833542.dkr.ecr.ap-south-1.amazonaws.com/acomi-backend:<git-sha>
aws ecr get-login-password --region ap-south-1 |
docker login --username AWS --password-stdin \
  484279833542.dkr.ecr.ap-south-1.amazonaws.com
docker push 484279833542.dkr.ecr.ap-south-1.amazonaws.com/acomi-backend:<git-sha>
docker push 484279833542.dkr.ecr.ap-south-1.amazonaws.com/acomi-backend:aws-production
```

Record `git rev-parse HEAD` and the pushed digest from `aws ecr describe-images --region ap-south-1 ...`.

### 19.2 On EC2 — authenticate

```bash
aws ecr get-login-password --region ap-south-1 |
sudo docker login --username AWS --password-stdin \
484279833542.dkr.ecr.ap-south-1.amazonaws.com
```

### 19.3 Record the current production image (required before stop/rm)

```bash
sudo docker inspect acomi-backend --format '{{.Image}}'
sudo docker inspect acomi-backend --format '{{json .RepoDigests}}'
sudo docker inspect acomi-backend --format '{{.State.Status}} {{.State.StartedAt}}'
```

Tag a local rollback alias **before** pulling a new tag (so the old layers stay named after the mutable tag moves):

```bash
sudo docker tag \
  484279833542.dkr.ecr.ap-south-1.amazonaws.com/acomi-backend:aws-production \
  acomi-backend:rollback
```

Also record ECR’s view of the tag **before** pull:

```powershell
aws ecr describe-images `
  --region ap-south-1 `
  --repository-name acomi-backend `
  --query "imageDetails[?contains(imageTags, 'aws-production')].{Tags:imageTags,Digest:imageDigest,Pushed:imagePushedAt}" `
  --output table
```

Write SHA + digest + date to `~/acomi-releases.log` (no secrets).

**Do not proceed to stop/rm until** the old digest is written down and `acomi-backend:rollback` exists locally (or the digest is pullable from ECR).

### 19.4 Pull the new image

```bash
sudo docker pull \
484279833542.dkr.ecr.ap-south-1.amazonaws.com/acomi-backend:aws-production
```

Confirm the new `RepoDigests` value is the intended digest (not the one you just saved as rollback).

**RECOMMENDED FUTURE IMPROVEMENT:** pull and run by digest:

```bash
sudo docker pull \
484279833542.dkr.ecr.ap-south-1.amazonaws.com/acomi-backend@sha256:<NEW_DIGEST>
```

### 19.5 Replace the container (destructive — production downtime)

These two commands **stop production**:

```bash
sudo docker stop acomi-backend
sudo docker rm acomi-backend
```

Only run them after §19.3–19.4. Then start (CURRENT publish is still `8080:8080`):

```bash
sudo docker run -d \
  --name acomi-backend \
  --restart unless-stopped \
  --env-file ~/acomi-backend.env \
  -p 8080:8080 \
  484279833542.dkr.ecr.ap-south-1.amazonaws.com/acomi-backend@sha256:<NEW_DIGEST>
```

If you must use the mutable tag, understand it may not match `<NEW_DIGEST>` later.

**RECOMMENDED FUTURE IMPROVEMENT (not current):** `-p 127.0.0.1:8080:8080`.

### 19.6 Verify after replace

```bash
sudo docker ps
sudo docker logs --tail 200 acomi-backend
curl -sS -i http://127.0.0.1:8080/actuator/health
curl -sS -i https://api.acomi.in/actuator/health
```

Expect HTTP 200 and `status` UP. Watch logs for Flyway/Hibernate errors or exit 137. Startup may take minutes.

Then CORS ([§16.3](#163-cors-web-origin)).

### 19.7 If startup fails

1. Do **not** `docker image prune` or delete `acomi-backend:rollback`.
2. Collect `sudo docker logs --tail 300 acomi-backend` and `sudo docker ps -a`.
3. Go to [§20](#20-rollback-procedure).
4. Leave Nginx/Certbot/DNS unchanged unless they are the failure (local :8080 vs public 502).

---

## 20. Rollback procedure

**CURRENT VERIFIED PROCESS:** Operators can start a container from a known image reference and the same `~/acomi-backend.env`. The tag `aws-production` **must not** be assumed to be the previous image.

**RECOMMENDED / required for a safe rollback:** use a **digest** or the local `acomi-backend:rollback` tag created in §19.3.

```bash
sudo docker stop acomi-backend
sudo docker rm acomi-backend

sudo docker run -d \
  --name acomi-backend \
  --restart unless-stopped \
  --env-file ~/acomi-backend.env \
  -p 8080:8080 \
  acomi-backend:rollback
```

Or from ECR (replace with the digest recorded **before** the failed deploy):

```bash
sudo docker pull \
484279833542.dkr.ecr.ap-south-1.amazonaws.com/acomi-backend@sha256:<RECORDED_PREVIOUS_DIGEST>

sudo docker run -d \
  --name acomi-backend \
  --restart unless-stopped \
  --env-file ~/acomi-backend.env \
  -p 8080:8080 \
  484279833542.dkr.ecr.ap-south-1.amazonaws.com/acomi-backend@sha256:<RECORDED_PREVIOUS_DIGEST>
```

Verify:

```bash
sudo docker ps
curl -sS -i http://127.0.0.1:8080/actuator/health
curl -sS -i https://api.acomi.in/actuator/health
```

If ECR no longer has the old digest (lifecycle/delete) and local `rollback` was pruned, rollback is **not** possible from images alone. That is a [§27](#27-known-limitations--recovery-gaps) gap.

---

## 21. Troubleshooting

### 21.1 Docker permission denied

`ubuntu` is not in `docker`. Use `sudo docker`. Do not change groups unless required.

### 21.2 Container name conflict

```bash
sudo docker ps -a --filter "name=acomi-backend"
```

If it is production, do not remove it to retry bootstrap `docker run`.

### 21.3 Container not running / exit 137

```bash
sudo docker ps -a
sudo docker logs --tail 200 acomi-backend
free -h
df -h
```

Exit **137** is SIGKILL (often cgroup OOM). Hibernate startup is a known spike. Check memory before assuming a bad image.

### 21.4 ECR authentication

```bash
aws sts get-caller-identity
aws ecr get-login-password --region ap-south-1 |
sudo docker login --username AWS --password-stdin \
484279833542.dkr.ecr.ap-south-1.amazonaws.com
```

### 21.5 502 Bad Gateway

```bash
sudo nginx -t
sudo docker ps
sudo ss -lntp | grep -E ':80 |:443 |:8080 '
curl -sS -i http://127.0.0.1:8080/actuator/health
sudo tail -n 50 /var/log/nginx/error.log
```

If :8080 fails, fix the container. If :8080 works and public fails, inspect Nginx.

### 21.6 HTTP 401

401 on authenticated routes or `/` is not automatically a failed deploy. Use `/actuator/health` for infrastructure.

### 21.7 CORS 403 `Invalid CORS request`

Origin must be exactly `https://app.acomi.in` (no trailing slash). Confirm `CORS_ALLOWED_ORIGINS` **names only** via the redacted grep. Do not print the env file.

### 21.8 Certificate

```bash
sudo certbot certificates
sudo certbot renew --dry-run
sudo nginx -t
```

### 21.9 DNS

```powershell
nslookup api.acomi.in
```

Expected (last verified): `15.252.148.84`.

### 21.10 CPU / disk / memory

```bash
free -h
df -h
uptime
sudo docker stats --no-stream
```

CloudWatch metrics/alarms: **not verified / not claimed**.

---

## 22. Production verification checklist

Use after every backend change. Re-verify; do not tick from memory.

### AWS

- [ ] Account `484279833542`, region `ap-south-1`
- [ ] EC2 `acomi-backend-prod` / `i-08539ae926e943e2b` running
- [ ] EIP `15.252.148.84` attached
- [ ] Security group still as documented (including 8080 risk)
- [ ] Docker service running

### ECR

- [ ] Intended digest recorded (not only tag `aws-production`)
- [ ] Git SHA recorded if known
- [ ] EC2 can pull

### Docker

- [ ] `acomi-backend` running
- [ ] `RepoDigests` matches intended digest
- [ ] Restart `unless-stopped`
- [ ] Env file still `600` (do not cat it)

### Application

- [ ] Profile `prod`
- [ ] Local health 200
- [ ] Public `https://api.acomi.in/actuator/health` 200
- [ ] CORS OPTIONS for `https://app.acomi.in`
- [ ] `/api/v1/auth/me` 401 (not 403)

### Nginx / TLS

- [ ] `nginx -t` ok
- [ ] Certificate not near expiry
- [ ] `certbot renew --dry-run` if approaching expiry

### Mobile / auth (not AWS)

- [ ] **BLOCKER:** Android release API still `api.acomi.app` — do not ship AAB until aligned
- [ ] **BLOCKER:** MVP OTP still in the image — do not treat as public consumer auth

---

## 23. Useful operational commands

Prefer `--format` inspect. Do not dump full inspect into tickets.

```bash
sudo systemctl status docker --no-pager
sudo docker ps
sudo docker images
sudo docker logs --tail 100 acomi-backend
sudo docker inspect acomi-backend --format '{{.Image}} {{json .RepoDigests}}'
sudo ss -lntp | grep -E ':80 |:443 |:8080 '
sudo nginx -t
sudo systemctl status nginx --no-pager
sudo systemctl reload nginx
sudo certbot certificates
curl -sS -i http://127.0.0.1:8080/actuator/health
curl -sS -i https://api.acomi.in/actuator/health
free -h
df -h
```

---

## 24. Deployment history (verified observations)

### 15 Aug 2026

- EC2 running; Docker and AWS CLI installed
- ECR login; `acomi-backend:aws-production` pulled
- `~/acomi-backend.env` created; container started
- Nginx + Certbot for `api.acomi.in`
- Public health tested

ECR image pushed: 15 Aug 2026 17:20:11 +05:30  
Container created: 15 Aug 2026 12:02:19 UTC

### 16 Aug 2026

- This document’s infrastructure IDs and health verified (see original verification pass)

---

## 25. Current verified production state

```text
Status: PRODUCTION / VERIFIED 16 Aug 2026 — re-verify before changes
```

| Area | State |
|------|--------|
| App | Spring Boot, Java 17, profile `prod` |
| Compute | EC2 t3.small, Ubuntu 24.04, `ap-south-1a` |
| Container | Docker `acomi-backend`, `unless-stopped`, port 8080 published on all interfaces |
| Image | ECR `acomi-backend:aws-production` (**mutable**); digest recorded in §8.2 as of verify date |
| Proxy | Nginx → `127.0.0.1:8080` |
| TLS | Let's Encrypt / Certbot, expiry 13 Nov 2026 |
| Domain | `api.acomi.in` → `15.252.148.84` |
| Database | Supabase PostgreSQL (pooler), `sslmode=require` |
| Health | `https://api.acomi.in/actuator/health` HTTP 200 (on verify date) |
| CI/CD | None |
| CloudWatch / SSM | Not verified, not claimed |

---

## 26. Known limitations / recovery gaps

**Not found / not verified** (do not invent):

- GitHub Actions, CodePipeline, CodeBuild, Docker Compose, ACOMI systemd deploy unit, cron deploy
- CloudWatch application logs or alarms
- ECR lifecycle / retention policy
- Automated EC2 AMI/EBS snapshot schedule
- Documented Supabase backup/restore runbook
- DNS registrar UI (GoDaddy or other) — only resolution was checked
- Certbot renewal **tested** end-to-end
- Formal monitoring/alerting

### Recovery gaps

| Gap | Current | Risk |
|-----|---------|------|
| EC2 / EBS | No verified AMI/snapshot procedure | Instance loss requires rebuild from this doc + env file + ECR |
| Environment file | Lives only on the instance (`600`) | Lost disk ⇒ lost secrets unless an **offline** copy exists (do not put it in Git) |
| ECR retention | Mutability + no verified lifecycle | Old digests may disappear; keep `rollback` tag and recorded digests |
| Database | Supabase; no restore steps in this repo | DB recovery is a **Supabase** console procedure, not AWS RDS |

**RECOMMENDED FUTURE IMPROVEMENT:** offline sealed copy of env **names+values** (not in Git), ECR immutable tags, snapshot policy. None of these are claimed as done.

---

## 27. Security considerations

| Item | Classification | Notes |
|------|----------------|-------|
| Public SG 8080 + Docker `0.0.0.0:8080` | **SECURITY RISK (HIGH)** | Bypasses HTTPS. Future: bind `127.0.0.1:8080:8080` and remove SG 8080 — **not done** |
| MVP OTP `111111` in application.yml | **BLOCKER** (public consumer auth) | No SMS provider |
| Mobile release `api.acomi.app` | **BLOCKER** (Play AAB) | Backend is `api.acomi.in` |
| Mutable `aws-production` tag | **SECURITY RISK / operational** | Rollback must use digest |
| `~/acomi-backend.env` | CURRENT: mode `600` | Never commit; never paste |
| JWT / DB password | Secrets | Never document values |
| `.pem` path | CURRENT | Never commit |
| `/root/.docker/config.json` | CURRENT | ECR login cache |
| SSH `/32` | CURRENT | Lockout if IP changes |
| HTTPS public API | CURRENT | Intended client path |
| Actuator | CURRENT | `health` only, no details |

---

## 28. Source of truth

16 August 2026 verification: AWS CLI, SSH, EC2/IAM/ECR, Docker, shell history, Nginx, Certbot, DNS, public HTTPS.

Backend repository facts (Dockerfile, Flyway, CORS, OTP, actuator) are from Git, not from inventing AWS features.

Where something was not verified, it is labeled **not verified** or listed in [§26](#26-known-limitations--recovery-gaps).
