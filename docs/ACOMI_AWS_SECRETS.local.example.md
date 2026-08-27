# ACOMI AWS secrets — LOCAL COPY ONLY

Copy this file to `ACOMI_AWS_SECRETS.local.md` and fill values from EC2:

```bash
# On acomi-backend-prod — do not paste the output into Git
grep -E '^[A-Za-z_][A-Za-z0-9_]*=' ~/acomi-backend.env
```

`ACOMI_AWS_SECRETS.local.md` is gitignored. Never rename it to a tracked filename.

---

## Backend (`~/acomi-backend.env`)

```text
SPRING_PROFILES_ACTIVE=prod
DB_HOST=aws-0-ap-south-1.pooler.supabase.com
DB_PORT=5432
DB_NAME=postgres
DB_USERNAME=FILL_FROM_EC2
DB_PASSWORD=FILL_FROM_EC2
JWT_SECRET=FILL_FROM_EC2
CORS_ALLOWED_ORIGINS=https://app.acomi.in
PORT=8080
OTP_HASH_SECRET=FILL_FROM_EC2
```

## SSH

```text
Host: ubuntu@15.252.148.84
Key file: K:\Projects\Deployment\AWS\acomi-backend-prod-key.pem
```

Do not paste PEM contents into this file unless you keep it gitignored and offline-backed.

## AWS CLI

```text
Account: 484279833542
Region: ap-south-1
Login: aws login   (session; not a long-lived access key in Git)
```

Do not put `AWS_ACCESS_KEY_ID` / `AWS_SECRET_ACCESS_KEY` here if you use `aws login`.

## Android (mobile — not AWS)

See gitignored `android/keystore.properties` on `K:\AcomiMobile`. Not used for AWS deploys.
