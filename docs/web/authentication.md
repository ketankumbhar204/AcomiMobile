# Authentication Architecture (CountIn Web)

> Phase: Authentication foundation  
> Mobile source of truth: `K:\CountIn`  
> Backend: `K:\Projects\CountIn\Backend\countin-backend` (unchanged)

---

## Flow

```
/login  →  POST /auth/send-otp  →  /otp?state.mobileNumber
/otp    →  POST /auth/verify-otp  →  setSession(token, user)  →  /
App boot → bootstrap() → GET /auth/me (if token) → authenticated shell
401 (non-auth endpoints) → clearSession → /unauthorized
Logout → clearSession + queryClient.clear → /login
```

There is **no JWT refresh token** on the backend or mobile.  
`refreshUser()` re-fetches `GET /auth/me` (profile refresh), matching mobile.

---

## API reuse

| Client method | Endpoint | DTO |
|---------------|----------|-----|
| `authApi.sendOtp` | `POST /api/v1/auth/send-otp` | `SendOtpRequest` → `SendOtpResponse` |
| `authApi.verifyOtp` | `POST /api/v1/auth/verify-otp` | `VerifyOtpRequest` → `AuthTokenResponse` |
| `authApi.getMe` | `GET /api/v1/auth/me` | `UserResponse` |
| `authApi.updateMe` | `PATCH /api/v1/auth/me` | `UpdateUserRequest` → `UserResponse` |

Envelope: `ApiResponse<T>` via existing `unwrapApiResponse`.

Validation parity: Indian mobile `^[6-9]\d{9}$`, OTP `^\d{6}$`.

---

## Desktop differences (presentation only)

| Mobile | Web |
|--------|-----|
| Full-screen stack | Split branding panel + centered `AuthCard` (≥1024) |
| Sticky bottom CTA | Primary button inside card |
| Stack back | Link “Change it” → `/login` |
| Root remount Auth↔Main | React Router Guest / Protected routes |

Same copy keys, colors (`#25D366`, `#ECFDF5`, `#128C7E`), OTP UX, and error mapping.

---

## Folder structure

```
src/modules/auth/
  api/authApi.ts
  components/   AuthCard, AuthHero, AuthIllustration, MobileNumberInput, OtpInput, AuthErrorBanner
  hooks/        useSendOtp, useVerifyOtp, useLogout
  pages/        LoginPage, OtpPage, UnauthorizedPage, ForbiddenPage, AuthenticatedHomePage
  schemas/      loginSchema, otpSchema (Zod + same rules as mobile/backend)
  index.ts
src/i18n/       en.json (auth + common.errors keys aligned with mobile)
src/store/authStore.ts   bootstrap, setSession, refreshUser, clearSession
```

---

## Design decisions

1. Vite proxy `/api` → `localhost:8080` so browser auth works without backend CORS changes.  
2. Dev OTP hint shows **111111** (backend `countin.otp.mvp-code`).  
3. Authenticated `/` is a **shell with logout only** — Dashboard is explicitly out of scope.  
4. i18n via `i18next`; no hardcoded user-facing strings in auth pages.

---

## Known limitations

- No refresh-token rotation (backend does not provide one).  
- Profile completion / onboarding / spaces bootstrap not implemented (post-auth product modules).  
- Only English locale shipped in web so far; keys match mobile for future locale ports.  
- Forbidden page is ready for role gates; no role-gated routes yet beyond authentication.

---

## Responsive behavior

| Breakpoint | Behavior |
|------------|----------|
| ≥1024 (`md`) | Branding panel + form column |
| 768–1023 | Centered card, full width padding |
| <768 | Single column, compact OTP cells, touch-friendly targets |

Keyboard: autofocus mobile/OTP, Enter to submit, arrow/backspace in OTP cells, visible focus rings.
