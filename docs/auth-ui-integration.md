# Acomi — Authentication UI Integration Guide

Frontend reference for **Login / Registration** in the ACOMI mobile and web apps.

---

## Current production authentication

ACOMI uses **password authentication**. OTP is **not** part of the current user-facing login or registration flow.

| Concept | How it works |
|---------|--------------|
| Registration | Name + mobile + password + confirm password → `POST /api/v1/auth/register` → JWT |
| Login | Mobile + password → `POST /api/v1/auth/login` → JWT |
| Session | Existing JWT Bearer token (default 24 hours) |
| Account deletion (in-app) | Profile → Delete account → `DELETE /api/v1/auth/me` |
| Account deletion (web) | `https://app.acomi.in/delete-account` |

Passwords are hashed on the server. They are never stored or logged in the app. Invalid login always shows a generic credentials error.

OTP screens, hooks, and APIs remain in the repo for **future** OTP authentication. Production login/register must not navigate to them.

---

## Base URL (mobile)

| Build | Host |
|-------|------|
| Release (`__DEV__` false) | `https://api.acomi.in/api/v1` |
| Debug default | Render develop host |
| Local machine (debug flag only) | emulator `10.0.2.2:8080` / localhost |

Release builds never use Render or localhost.

Privacy: `https://app.acomi.in/privacy`  
Delete account (web): `https://app.acomi.in/delete-account`

---

## Current screens

1. **Login** — mobile + password → Sign In → `POST /auth/login`
2. **Register** — name + mobile + password + confirm → Create Account → `POST /auth/register`
3. **Bootstrap** — stored token → `GET /auth/me`

OTP screens stay in the navigator for future use and are not linked from Login or Register.

---

## Request bodies

### Register

```json
{
  "fullName": "Priya Sharma",
  "mobileNumber": "9876543210",
  "password": "********",
  "confirmPassword": "********"
}
```

### Login

```json
{
  "mobileNumber": "9876543210",
  "password": "********"
}
```

Do not send `verificationToken` in the current production register flow.

---

## Status codes

| Call | Success | Typical errors |
|------|---------|----------------|
| Register | `200` JWT | `400` validation, `409` already registered |
| Login | `200` JWT | `401` invalid mobile or password |
| GET /me | `200` user | `401` clear session |
| DELETE /me | `204` | `401` |

---

## Future OTP (reserved)

Backend still implements `POST /auth/send-otp` and `POST /auth/verify-otp`. There is no hardcoded client OTP (`111111` / `123456`). Do not use these in the current production UI.

---

## Related docs

- [ACCOUNT_DELETION.md](./ACCOUNT_DELETION.md)
- Backend `docs/auth-ui-integration.md`
