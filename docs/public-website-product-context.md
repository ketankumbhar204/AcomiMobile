# ACOMI Public Website — Phase W1 Product & Project Context

**Document type:** Read-only product analysis for a future public marketing website  
**Date:** 2026-08-22  
**Phase:** W1 — analysis only  
**Intended public site:** `https://www.acomi.in`  
**Out of scope for this phase:** website implementation, source changes, Mobile/Web/Backend edits, AWS/DNS/CloudFront/S3 changes, commits, pushes, deletes, renames

Evidence labels:

| Label | Meaning |
|-------|---------|
| **VERIFIED** | Confirmed from current repository source, assets, or config |
| **DOCUMENTED** | Stated in project docs; may be older than current source |
| **HISTORICAL / STALE** | Older docs that conflict with current source — do not market as current |
| **PLANNED** | Explicitly deferred or reserved in source/docs |
| **UNKNOWN** | Not verifiable from the repositories |
| **PLACEHOLDER** | Marked `[TO BE PROVIDED]` or otherwise incomplete |

This document is the source of truth for later website copy. It must not be used to invent customers, legal entity, certifications, or unshipped features.

---

## 1. Executive summary

ACOMI is an **operations product** for Indian PGs, hostels, co-living spaces, rental properties, and messes. It is **not** a listing marketplace, booking engine, or payment gateway.

The product name is used as **ACOMI**. Internal expansion in deployment docs: **Accommodation + Meals**. The most marketing-ready existing tagline, from the Play Store feature graphic, is **“Run occupancy, meals, and dues.”**

Primary buyer is the **space owner/operator**. Members (tenants, meal customers, staff) join by **invitation**. They cannot discover or book a space on ACOMI.

Current production split, as documented in source:

| Surface | Role | URL |
|---------|------|-----|
| Public marketing site | To be created | `https://www.acomi.in` |
| Product web app | Signed-in operations UI | `https://app.acomi.in` |
| Backend API | Application API | `https://api.acomi.in` |
| Privacy | Public legal page inside the web app | `https://app.acomi.in/privacy` |
| Account deletion | Public Play Store deletion page inside the web app | `https://app.acomi.in/delete-account` |

**Current authentication is password authentication** (Indian mobile + password). OTP APIs exist for future use and are hidden from the active login/register UI. Do not market OTP login.

Product maturity: **usable operator product** for core PG and Mess flows, with a production API and production web app. Android is packaged as `com.acomi` version `1.0` / versionCode `1`. Several public-launch blockers remain: incomplete legal entity/contact details, no Terms of Service, no forgot-password flow, rent-collection polish still partial, reports not built, WhatsApp automation not built, and Play Store listing status **UNKNOWN**.

Old names **CountIn**, **Residine**, and **Amico** must not appear on the public website. They remain in history/docs/remotes. One **user-visible** branding defect exists on the web login/register chrome: a letter **“C”** mark instead of the Play Store **“A”** mark.

---

## 2. Product definition

### What ACOMI is

**VERIFIED** from domain model, space types, UI copy, and Play Store assets:

ACOMI is software for running a **space** — a real-world PG, mess, hostel, co-living property, or rental — including:

- who lives there or eats there (**Members**)
- beds/rooms/units (**Accommodation / Occupancy**)
- daily meals and meal billing (**Meals**)
- collections and payment proofs (**Payments**)
- maintenance/food/service issues (**Complaints**)
- in-app alerts and pending work (**Notifications / Pending Actions**)
- stock/assets (**Inventory**)

Web README and backend README share the product line:

> Accommodation + Meals — Manage Your Stay & Meals

Web login brand panel:

> Property and meal operations for PGs, hostels, and messes — the same product you use on mobile.

Play Store feature graphic:

> Run occupancy, meals, and dues  
> Occupancy · Members · Meals · Payments

### What ACOMI is not

Do not describe ACOMI as:

- a PG/hostel listing or discovery website
- a tenant marketplace or booking platform
- a payment gateway, UPI app, or card processor
- a WhatsApp bot / WhatsApp-first automation platform (**PLANNED** only; current product shares menu text, it does not automate WhatsApp)
- an analytics/BI suite (**Reports** package is empty)
- a multi-country product (auth is **Indian mobile numbers only**)

`docs/backend-context.md` still says “WhatsApp-first operations management” and “operational reporting.” That is **HISTORICAL / STALE** product vision. Current source does not implement WhatsApp delivery or reports. Do not use that document for public claims.

### Problem it solves

Operators of PGs, hostels, messes, co-living, and rentals currently juggle occupancy, members, meals, and dues across notebooks, WhatsApp chats, and spreadsheets. ACOMI puts those operations in one space-scoped product, with role-based access, owner-controlled onboarding, and a shared web + mobile client against one API.

### Current product maturity

| Area | Assessment |
|------|------------|
| Core operator flows (spaces, members, accommodation, meals, dashboard) | **IMPLEMENTED** and usable |
| Meal payments + proof review | **IMPLEMENTED** |
| PG rent collection as a first-class flow | **PARTIALLY IMPLEMENTED** |
| Complaints | **IMPLEMENTED** as MVP (web also has assign) |
| Inventory | **IMPLEMENTED** (not a primary Play Store screenshot) |
| In-app notifications | **IMPLEMENTED**; email/push/SMS/WhatsApp channels **PLANNED** |
| Reports / analytics | **PLANNED** (backend `report` package empty) |
| Password auth | **IMPLEMENTED** (current production model) |
| OTP auth | **PLANNED / hidden** (APIs exist; UI not linked) |
| Forgot password | **NOT IMPLEMENTED** |
| Production API + web app | **DOCUMENTED** as live (`api.acomi.in`, `app.acomi.in`) |
| Public marketing site | **NOT CREATED** (`www.acomi.in` is the intended future site) |
| Android store identity | `com.acomi`, display name ACOMI, version `1.0` |
| Play Store listing live? | **UNKNOWN** (assets and Data safety draft exist; listing not verified) |
| iOS | Project exists (`com.acomi`); App Store listing **UNKNOWN** |

---

## 3. Target users

Audiences below are taken from actual roles and space types in code (`SpaceType`, `MembershipRole`, onboarding copy). Do not add audiences the product does not serve.

### 3.1 Space owner — primary buyer and operator

**Who:** Person who creates a Space. Role `OWNER`. Onboarding card: “I Am an Owner” / “PG · Mess · Hostel · Co-living · Rental”.

**Problem:** Running occupancy, members, meals, and dues without a dedicated operations system.

**How ACOMI helps:** Create spaces, set up layout, add/invite people, plan meals, record proofs, track complaints, switch among multiple spaces.

**Buyer / operator / user:** **Buyer and operator.** This is the person the public website should sell to.

### 3.2 Manager — operator, not necessarily buyer

**Who:** Role `MANAGER`. Delegated admin for day-to-day operations.

**Problem:** Needs operational control without full ownership powers (cannot deactivate/delete space or remove members).

**How ACOMI helps:** Members, occupancy, meals, payments, complaints, according to the permission matrix.

**Buyer / operator / user:** Operator / user. Not the commercial buyer unless they are also the owner.

### 3.3 PG / hostel / co-living / rental operator — same owner, different space type

Supported space types **VERIFIED** in backend enum and mobile/web UI:

| Code | UI label | UI description |
|------|----------|----------------|
| `PG` | PG | Paying Guest |
| `MESS` | Mess | Mess / Canteen |
| `HOSTEL` | Hostel | Hostel |
| `CO_LIVING` | Co-living | Co-living Space |
| `RENTAL` | Rental | Flats / Rooms |

Property category copy also uses Gents/Ladies/Mixed PG, Boys/Girls/Mixed Hostel, Male/Female Co-living.

Accommodation (buildings → floors → rooms/units → beds) applies to `PG`, `HOSTEL`, `CO_LIVING`, `RENTAL`. **MESS spaces hide Accommodation.** Mess is meal-first.

### 3.4 Mess operator

**Who:** Owner of a `MESS` space.

**Problem:** Daily menu planning, headcount, meal billing (pay-per-meal or prepaid subscription), customers who may never occupy a bed.

**How ACOMI helps:** Menu library, daily planning, polls, headcount, serving locations, meal payments, customer import from other spaces.

**Buyer / operator / user:** Buyer and operator. First-class audience, not a side feature.

### 3.5 Tenant — secondary user, not buyer

**Who:** Role `TENANT`. Resident of PG / hostel / co-living / rental.

**Problem:** Needs stay, meals, payments, and complaints for *their* space, not a full operator console.

**How ACOMI helps:** Invitation → join → profile completion → tenant dashboard (stay, meal poll, payments). Cannot browse full bed inventory.

**Buyer / operator / user:** User. They do not purchase ACOMI; an owner invites them.

### 3.6 Customer — secondary user (mess / meals)

**Who:** Role `CUSTOMER`. Meal subscriber. Onboarding lists “Tenant · Customer · Staff”.

**Problem:** Needs meal selection, payment proof, and related notices without accommodation access.

**How ACOMI helps:** Meal polls, prepaid/pay-per-meal, customer dashboard. **Denied accommodation structure access.**

**Buyer / operator / user:** User.

### 3.7 Staff — secondary operator/user

**Who:** Role `STAFF`. Operational staff.

**Problem:** Needs to see operations (structure/occupancy reads; complaint assignment in some flows) without admin writes.

**How ACOMI helps:** Read-oriented permissions; can be a complaint assignee.

**Buyer / operator / user:** User / limited operator. Not the buyer.

### 3.8 Member without an app login

**VERIFIED** UI copy: “Create a business record directly. They do not need the ACOMI app.”

Owners can add a Member as an operational profile (name, mobile, occupancy, meals, dues) without that person registering. Invitation is a separate path that creates an app login membership.

**Buyer / operator / user:** The owner is the operator; the offline member is a record, not a website visitor.

### Audiences not supported as buyers

Nothing in the product targets general consumers searching for a PG, travel guests, hotel chains, or international numbers. Do not market to “anyone looking for a PG.”

---

## 4. Problems solved

| Problem | Who feels it | What ACOMI does today |
|---------|----------------|------------------------|
| Occupancy is unclear (who is in which bed) | PG / hostel / co-living / rental operators | Building/floor/room/bed structure; allocate, reserve, move-in, transfer, vacate; vacant-bed browser |
| Members live in WhatsApp/Excel | Owners / managers | Member list, search, documents, emergency contact, occupancy history, invitations |
| Daily meals and headcount are manual | Mess operators; PG with food included | Menu library, plan breakfast/lunch/dinner, share text, polls, headcount |
| Dues and proofs are informal | Owners; tenants/customers | Operational ledger, expected/collected/pending, proof upload, approve/reject/request update |
| Issues get lost | Owners, staff, members | Complaints: raise, status, comments, photos; web assign |
| One person runs several properties | Owners | Multi-space: My Spaces, default space, switcher |
| App vs desktop | Operators | Same API: Android app + `app.acomi.in` |

What it does **not** yet solve (do not claim): automated WhatsApp replies, rent autopay, UPI collection, occupancy/payment/meal **reports**, notice board, forgot password, KYC review product.

---

## 5. Core workflows

Business-oriented. Current production auth is **password**, not OTP. Older onboarding docs that start with “Auth (OTP)” are **STALE**.

### 5.1 New user registration

1. Open web `https://app.acomi.in/register` or mobile Register.
2. Enter **name**, **10-digit Indian mobile**, **password**, **confirm password**.
3. `POST /api/v1/auth/register` → JWT.
4. Land in bootstrap (onboarding / invitations / spaces).

No email identifier. No OTP in this flow.

### 5.2 Login

1. Open `https://app.acomi.in/login` or mobile Sign In.
2. Mobile + password → `POST /api/v1/auth/login` → JWT (default **24 hours**).
3. Session restored via `GET /api/v1/auth/me`.

No forgot-password. Invalid login shows a generic credentials error.

### 5.3 Owner onboarding

1. After auth, if the user has no spaces and no invitations: **“How will you use ACOMI?”**
2. Choose **I Am an Owner**.
3. Create a Space (name, type, optional address/contact). Type cannot be changed later.
4. Guided setup / Space Health (layout → residents → meals, varying by type).
5. Mess setup emphasizes customers and menu; PG/hostel/co-living/rental emphasize property layout then occupancy.

### 5.4 Member onboarding

1. Owner/manager sends an **invitation to a mobile number** with a role.
2. There is **no join code**. The invitee must use that mobile on ACOMI.
3. Invitee registers/logs in, opens invitations, **accepts**.
4. Tenants/customers may be gated to **Complete Profile** before space services.
5. Alternate path: owner **adds a member record** without the person installing the app.

### 5.5 Space creation

Create Space → choose type (PG / Mess / Hostel / Co-living / Rental) → name (placeholders like “Sunrise PG”, “Baner Mess”) → optional address and contact → save. Owner membership is created automatically. Users may own or join **multiple spaces**.

### 5.6 Accommodation management

For non-Mess spaces: Quick Setup wizard or manual builder; buildings, floors, units/rooms, beds; layout modes corridor / apartment / rental; occupancy lifecycle Allocate → Reserve → Move-in → Transfer → Vacate; contract snapshot (rent, deposit, food terms); vacant bed inventory.

### 5.7 Member management

List/search/filter; add vs invite; roles; documents (Aadhaar, PAN, Passport, Other); emergency contact; meal access; occupancy history; pending invitations. Mess can import customers from other managed spaces.

### 5.8 Meal management

Menu library (items/combos) → plan Breakfast/Lunch/Dinner for a date → share (WhatsApp-**style text**, not inbound WhatsApp) → poll / responses → headcount. Billing: **Pay per meal** or **Subscription** (prepaid accumulating balance). PG food-included via occupancy contract.

### 5.9 Payment management

Month view: Expected / Collected / Under Review / Pending. Members submit **payment proofs** (images + UTR-style reference). Operators approve, reject, or request update. Human payment IDs like `PAY-YYYYMMDD-NNNNNN`. **Not** card/UPI gateway processing.

### 5.10 Complaint / operations management

Raise complaint (maintenance, food, service, etc.) → Open → In progress → Resolved → Closed (or Cancel). Comments, photos, timeline. Web supports **assign**. Notice Board is **PLANNED**.

### 5.11 Account deletion

- In app: Profile → Delete account → `DELETE /api/v1/auth/me`.
- Web (Play requirement): `https://app.acomi.in/delete-account` — mobile + password + confirmation, no app install required.
- Personal login/profile data is deleted or anonymized. Space/occupancy/meal/payment/complaint **business records are retained**. Same mobile can register again. Spaces the user owned are **not** deleted.

---

## 6. Feature inventory

Classification is against **current product behaviour**, not early vision docs.

| Feature | Status | Notes for marketing |
|---------|--------|---------------------|
| **Authentication** | | |
| Register / login with mobile + password | **IMPLEMENTED** | Current production model |
| Password hashing (server) | **IMPLEMENTED** | Delegating `PasswordEncoder`; plaintext never stored |
| JWT session | **IMPLEMENTED** | Default 24h |
| OTP send/verify APIs | **PLANNED** (reserved) | Hidden from active UI; prod OTP sender configured `none` |
| Forgot password | **NOT IMPLEMENTED** | Do not claim |
| Indian mobile validation | **IMPLEMENTED** | 10 digits, first digit 6–9 |
| Logout | **IMPLEMENTED** | |
| **Space management** | | |
| Create / edit / view space | **IMPLEMENTED** | Type immutable after create |
| Space types PG, Mess, Hostel, Co-living, Rental | **IMPLEMENTED** | Domain-model doc still omits Rental — **STALE** |
| My Spaces, search, switch, default | **IMPLEMENTED** | |
| Soft deactivate space | **IMPLEMENTED** | Hard delete optional/limited |
| Amenities | **IMPLEMENTED** | |
| Gender / property category policy | **IMPLEMENTED** | House-rules documents **PLANNED** |
| Multi-space per user | **IMPLEMENTED** | |
| **Accommodation** | | |
| Building / floor / unit / room / bed | **IMPLEMENTED** | Hidden for Mess |
| Quick Setup + manual builder | **IMPLEMENTED** | |
| Occupancy allocate/reserve/move-in/transfer/vacate | **IMPLEMENTED** | |
| Vacant bed inventory | **IMPLEMENTED** | |
| Contract snapshots | **IMPLEMENTED** | |
| Space Health / guided setup | **IMPLEMENTED** | Mobile + web `space-health` |
| **Member management** | | |
| Add / edit / list / search members | **IMPLEMENTED** | Offline members allowed |
| Invitations (create/accept/cancel) | **IMPLEMENTED** | No join codes; accept-only for invitee |
| Documents + emergency contact | **IMPLEMENTED** | |
| Profile completion gate | **IMPLEMENTED** | Tenants/customers |
| Dedicated KYC review product | **PLANNED** | Status fields exist |
| **Meals** | | |
| Menu library | **IMPLEMENTED** | |
| Daily menu planning | **IMPLEMENTED** | Weekly planning **PLANNED** |
| Share menu as text | **IMPLEMENTED** | Not WhatsApp inbound |
| Polls + headcount | **IMPLEMENTED** | |
| Serving / delivery locations | **IMPLEMENTED** | |
| Participation enroll/pause/resume/stop | **IMPLEMENTED** | |
| Pay per meal + prepaid subscription | **IMPLEMENTED** | |
| Special meal requests | **PLANNED** | |
| WhatsApp inbound poll replies | **PLANNED** | Empty `whatsapp` package |
| **Payments** | | |
| Meal payment ledger + proofs | **IMPLEMENTED** | |
| Approve / reject / request update | **IMPLEMENTED** | |
| Expected / collected / pending snapshot | **IMPLEMENTED** | |
| Payment reference IDs | **IMPLEMENTED** | |
| Rent recording as first-class UX | **PARTIALLY IMPLEMENTED** | Types exist; polish remaining |
| Deposit as payment product | **PLANNED** | Deposit fields on member exist |
| Payment gateway / UPI collect | **NOT IMPLEMENTED** | |
| **Complaints** | | |
| Raise / list / detail / comments / status | **IMPLEMENTED** | MVP |
| Assign (web) | **IMPLEMENTED** | Mobile assign UI was behind web |
| Notice board | **PLANNED** | |
| **Notifications** | | |
| In-app list, badge, mark read | **IMPLEMENTED** | |
| Pending Actions | **IMPLEMENTED** | |
| Email / push / SMS / WhatsApp send | **PLANNED** | Channel enum reserved; runtime in-app only |
| **Inventory** | | |
| Categories, items, stock, suppliers | **IMPLEMENTED** | Seeded by space type (food vs assets) |
| **Dashboard / reporting** | | |
| Role-aware dashboard | **IMPLEMENTED** | |
| Occupancy / meal / payment widgets | **IMPLEMENTED** | |
| Advanced reports | **PLANNED** | Empty `report` package |
| **Profile / account** | | |
| Profile, language, documents | **IMPLEMENTED** | |
| Unified Settings hub | **PARTIALLY IMPLEMENTED** | |
| Account deletion (app + web) | **IMPLEMENTED** | |
| Privacy policy page | **IMPLEMENTED** | Content has **PLACEHOLDER** legal fields |
| Terms of Service | **NOT IMPLEMENTED** | |
| **Platforms** | | |
| Android app | **IMPLEMENTED** | `com.acomi` |
| Web app | **IMPLEMENTED** | `app.acomi.in` |
| iOS project | **IMPLEMENTED** as codebase | Store availability **UNKNOWN** |
| Public marketing site | **NOT IMPLEMENTED** | This phase |
| **Localization** | | |
| English, Hindi, Marathi, Kannada, Telugu, Tamil | **IMPLEMENTED** | In-app language, not a marketing claim of “full localization QA” |

---

## 7. Current authentication

**Current intended production model: PASSWORD AUTHENTICATION.** **VERIFIED** in:

- Mobile `LoginScreen` / `RegisterScreen` (no OTP navigation)
- Web `/login`, `/register`; OTP routes redirect to `/register`
- Backend `POST /api/v1/auth/register`, `POST /api/v1/auth/login`
- `docs/auth-ui-integration.md` (mobile and backend copies)

| Item | Current production |
|------|-------------------|
| Identifier | 10-digit Indian mobile |
| Secret | Password (8–72 characters in UI validation) |
| Storage | Password **hash** only |
| Session | Bearer JWT, default `86400000` ms (24 hours) |
| Account deletion (logged in) | `DELETE /api/v1/auth/me` |
| Account deletion (public web) | `POST /api/v1/auth/account-deletion/password` |

**OTP:** `POST /auth/send-otp` and `POST /auth/verify-otp` remain. Production profile sets `acomi.otp.sender: none`. OTP screens/hooks remain in the repo **for future use**. Do **not** recommend or market OTP as the current login method.

Older `docs/domain-model.md` still says “Authentication is mobile-number and OTP based. No password is stored.” That sentence is **STALE**. Ignore it for the website.

There is **no Forgot Password** flow. Future OTP is documented as a possible reset mechanism — **PLANNED**, not current.

---

## 8. Current production architecture

Documented from repository config and existing AWS/web deployment files. This phase did **not** change DNS, AWS, or production, and did **not** live-probe hosts.

```
www.acomi.in     →  future public marketing site (not built in this phase)
app.acomi.in     →  existing signed-in web application (S3 + CloudFront in web repo config)
api.acomi.in     →  existing Spring Boot API (AWS EC2 + Nginx + Docker in backend AWS doc)
```

### Intended separation

| Host | Audience | Content | Auth |
|------|----------|---------|------|
| **www.acomi.in** | Prospective owners; press; Play Store visitors | Marketing, product explanation, CTAs | None |
| **app.acomi.in** | Registered users | Full product: login, spaces, operations, privacy, delete-account | Password session |
| **api.acomi.in** | Clients only (web + mobile) | `/api/v1/*` | JWT after login; public auth + deletion endpoints as designed |

The marketing site must **link into** the app, not clone the app. Privacy and account deletion already live under **app.acomi.in** and should be linked, not rewritten, until legal copy is completed.

### Known production pieces (from docs/config)

**API (`api.acomi.in`)** — `docs/ACOMI_BACKEND_AWS_DEPLOYMENT.md` (verified 16 Aug 2026): HTTPS → Elastic IP → EC2 `acomi-backend-prod` → Nginx → Docker Spring Boot → Supabase PostgreSQL. CORS origin documented as `https://app.acomi.in`.

**Web app (`app.acomi.in`)** — `K:\AcomiWeb`:

- `.env.production`: `VITE_API_BASE_URL=https://api.acomi.in/api/v1`
- CloudFront/S3 JSON: bucket `acomi-web-prod` (ap-south-1), alias `app.acomi.in`

**Mobile release API** — `src/config/env.ts`: production host `https://api.acomi.in`. Privacy `https://app.acomi.in/privacy`. Deletion `https://app.acomi.in/delete-account`. Staging host `https://staging-api.acomi.app` is unused by the `__DEV__` switch.

**Develop (not production):** Render `acomibackend.onrender.com` / `acomiwebapp.onrender.com` still used for debug mobile and historical DEV.

**Do not put on the marketing site:** EC2 IDs, IPs, AWS account numbers, bucket internals, or “hosted on AWS” as a trust badge unless explicitly approved.

Older docs that say production is Render-only or that mobile release still calls `api.acomi.app` are **STALE** relative to current `env.ts` and the Aug 2026 AWS backend doc.

---

## 9. Branding

### Product name

Use **ACOMI** (all caps) in UI and marketing. Code module name `Acomi`. Android `app_name` ACOMI. iOS `CFBundleDisplayName` ACOMI. Web `APP_NAME = 'ACOMI'`.

Do not use CountIn, Residine, or Amico in any public-facing copy.

### Logo / mark

| Source | Mark | Use on www? |
|--------|------|-------------|
| Play Store icon / feature graphic | White geometric **“A”** on teal | **Yes — preferred public mark** |
| Web `AuthCard` / `AuthIllustration` | Letter **“C”** on `primaryDark` tile | **No** — user-visible leftover; likely CountIn. Do not copy onto the marketing site |

There is no separate wordmark SVG in the repos inspected. Play Store assets are the cleanest logo source.

### Colors

Shared token files (mobile `src/theme/colors.ts`, web `src/shared/theme/colors.ts`):

| Token | Hex | Typical use |
|-------|-----|-------------|
| `primary` | `#25D366` | In-app CTAs, active nav (WhatsApp-like green) |
| `primaryHover` | `#20BD5A` | Hover |
| `primaryDark` | `#128C7E` | Eyebrows, Play-style teal, logo tile |
| `background` | `#F3FAF6` | App canvas (Android `app_background` `#ECFDF5` is a close sibling) |
| `surface` | `#FFFFFF` | Cards |
| `textPrimary` | `#0F172A` | Headings |
| `textSecondary` | `#64748B` | Body |
| `success` | `#059669` | Positive |
| `danger` | `#DC2626` | Errors |
| `warning` | `#D97706` | Warnings |

Play Store feature graphic and icon use **teal (`primaryDark` family)** more than in-app CTA green. Public website should treat **teal “A” + ACOMI wordmark** as the brand lockup, and **green** as the action color — matching the apps — unless design later unifies them.

Design-system note: “Stay WhatsApp-green Acomi.” Avoid purple gradients, cream/serif “AI” looks, or dark-mode-first marketing.

### Typography

**Plus Jakarta Sans**, weights 400 / 500 / 600 / 700. Uppercase small eyebrows. Sentence-case buttons (`textTransform: none`).

### Visual / UI style

Card-based, light green canvas, white cards, rounded 12–16px, Lucide line icons, role-colored chips, empty states with illustrations. Operator UI is dense and operational, not consumer-lifestyle photography.

### Tone of voice (from existing copy)

Direct, operator-facing, Indian property vocabulary (PG, Mess, dues, occupancy). Examples:

- “Run occupancy, meals, and dues”
- “How will you use ACOMI?”
- “They do not need the ACOMI app.”
- “Sign in with your mobile number and password.”

Avoid hype, invented metrics, and startup clichés.

### Iconography

Lucide icons in product UI. Play Store mark is the letter A, not an illustrated house. Accommodation uses custom bed/room/building PNGs (product UI, optional supporting art).

### Old-name occurrences (do not modify in this phase)

| Name | User-visible product UI (`src/`) | Docs / history | Source / repo / remotes |
|------|----------------------------------|----------------|-------------------------|
| **CountIn** | No string in Mobile/Web `src` | Rename timeline; Git `main` subjects | Web login **letter “C”** mark is user-visible and should be treated as a CountIn leftover |
| **Residine** | None found | Audit notes only | None found in product source |
| **Amico** | None found in Mobile/Web `src` | Dated parity docs (`K:\AmicoMobile`), README `cd` paths, commit subjects, Flyway historical function `amico_normalize_mobile` | Local `origin` URLs still `Amico*.git` (GitHub redirects to Acomi names) |

---

## 10. Existing assets

Do not generate new assets in this phase. Dimensions from local PNG files (2026-08-22).

### 10.1 Play Store — suitable for public marketing

| Path | Size | Purpose | Marketing suitability |
|------|------|---------|------------------------|
| `docs/play-store-assets/icon/acomi-play-store-512.png` | 512×512 | Store / brand mark (white A on teal) | **Yes** — primary logo |
| `docs/play-store-assets/icon/acomi-round-512.png` | 512×512 | Round variant | **Yes** |
| `docs/play-store-assets/icon/acomi-launcher-foreground.png` | 1080×1080 | Adaptive icon foreground | Optional; logo extraction better from 512 icon |
| `docs/play-store-assets/icon/acomi-launcher-background.png` | 1080×1080 | Adaptive icon background (teal) | Optional |
| `docs/play-store-assets/feature-graphic/acomi-feature-graphic.png` | 1024×500 | Play feature graphic; tagline + Occupancy/Members/Meals/Payments | **Yes** — hero/banner (small file; may need a higher-res recreation later) |
| `docs/play-store-assets/screenshots/final/02-dashboard.png` | 1080×1920 | “See your space at a glance” | **Yes** — framed phone shot |
| `docs/play-store-assets/screenshots/final/03-spaces.png` | 1080×1920 | “Manage your spaces” / owner vs member | **Yes** |
| `docs/play-store-assets/screenshots/final/04-accommodation.png` | 1080×1920 | “Know your occupancy” | **Yes** |
| `docs/play-store-assets/screenshots/final/05-members.png` | 1080×1920 | “Manage members” | **Yes** |
| `docs/play-store-assets/screenshots/final/06-meals.png` | 1080×1920 | “Plan meals” | **Yes** |
| `docs/play-store-assets/screenshots/final/07-payments.png` | 1080×1920 | “Track payments” | **Yes** — note empty-state / ₹ placeholders |
| `docs/play-store-assets/screenshots/final/08-operations.png` | 1080×1920 | “Track issues” / complaints | **Yes** — empty-state sample data |

Matching `screenshots/raw/` files exist (same scenes without marketing chrome). Prefer **final** for the website.

Screenshot captions already in the assets (safe to reuse as section labels):

- See your space at a glance — Occupancy, meals, and dues
- Manage your spaces — PG, mess, hostel, co-living, rental
- Know your occupancy — Buildings, rooms, and beds
- Manage members — Residents and customers in one list
- Plan meals — Breakfast, lunch, and dinner
- Track payments — Expected, collected, and pending
- Track issues — Complaints and resolution progress

### 10.2 Informal captures — use with caution

Repo-root `acomi-ui.png`, `acomi-ui2.png`, … `acomi-ui11.png`, `acomi-final.png` (1080×2400). Unframed device captures. Suitable only after review for PII, debug chrome, and empty states. Not Play-packaged.

### 10.3 Product illustrations — supporting, not logo

Under `src/assets/accommodation/illustrations/` (beds, rooms, buildings, floors, units). Useful for feature sections if cropped; they are functional UI art, not brand photography.

### 10.4 Missing / weak for a marketing site

- No official wordmark SVG
- No desktop web app screenshots in the Play pack (phone-only)
- No lifestyle photography
- Android `res/` in this tree has no tracked launcher mipmaps (icons live under `docs/play-store-assets`)
- Feature graphic is 1024×500 and ~18 KB — acceptable for Play; a public hero may need a sharper export later (do not generate in W1)

---

## 11. Legal / trust status

### Already available

| Item | Location | Status |
|------|----------|--------|
| Privacy Policy page | `https://app.acomi.in/privacy` (`PrivacyPolicyPage` + `en.json` `legal.privacy`) | Page **exists**; several fields **PLACEHOLDER** |
| Account deletion page | `https://app.acomi.in/delete-account` | **IMPLEMENTED** (password verify) |
| In-app deletion | Profile → Delete account | **IMPLEMENTED** |
| Data-safety draft | `docs/google-play-data-safety.md` | Internal draft; “do not paste until deletion/privacy deployed” |
| Account deletion behaviour doc | `docs/ACCOUNT_DELETION.md` | Accurate vs current password flow |

Privacy policy states (safe to repeat at a high level): Indian mobile + password; hash stored not password; no precise location/contacts/SMS; no third-party analytics/crash SDKs found; not a payment gateway; people in a space see operational data by role; account deletion anonymizes personal data and keeps business records.

### Placeholders that block a polished public launch

From `en.json` privacy copy (last updated 16 August 2026):

- Operator **legal name**: `[TO BE PROVIDED]`
- **Registered address**: `[TO BE PROVIDED]`
- **Privacy contact email**: `[TO BE PROVIDED]`
- **Subprocessors**: `[TO BE PROVIDED]`
- Numeric **retention period**: `[TO BE PROVIDED]`

### Missing

| Item | Status |
|------|--------|
| Terms of Service / Terms of Use | **Not present** in web routes or i18n |
| Public contact page / support email / phone | Only generic “contact support” strings — **no real address** |
| Company CIN / GST / Grievance officer | **Not found** |
| Cookie policy | **Not found** (marketing site may need one if it sets cookies) |
| Play Store live URL | **UNKNOWN** |
| Security / ISO / SOC certifications | **Not found** — do not invent |

**Do not invent** legal entity, address, contact, customer counts, revenue, testimonials, or certifications on www.acomi.in.

Until placeholders are filled, the website should **link** to `app.acomi.in/privacy` and `app.acomi.in/delete-account` rather than claiming a complete legal pack.

---

## 12. Safe marketing claims

Statements clearly supported by the current product:

1. ACOMI helps owners run **PGs, hostels, co-living spaces, rentals, and messes**.
2. ACOMI is for **occupancy, members, meals, and dues** (payments/proofs).
3. One person can **manage multiple spaces**.
4. Owners **invite** members; people do not publicly list or book a bed on ACOMI.
5. Members can be **added as records without installing the app**.
6. Tenants, meal customers, and staff can use ACOMI **after invitation**.
7. Accommodation covers **buildings, rooms, and beds** (not for Mess spaces).
8. Mess operators can **plan breakfast, lunch, and dinner**, share a menu, and track headcount.
9. Payments are **operational collections with proofs**, not a card gateway.
10. Operators can **track complaints** (maintenance, food, service).
11. ACOMI is available as a **web app** at `app.acomi.in` and an **Android** app named ACOMI (`com.acomi`).
12. Sign-in uses an **Indian mobile number and password**.
13. Users can **delete their account** in the app or at `app.acomi.in/delete-account`.
14. The product UI is available in **English, Hindi, Marathi, Kannada, Telugu, and Tamil**.
15. In-app notifications and a **pending-actions** inbox exist.

---

## 13. Unsafe / unverified claims

Do **not** publish unless separately verified and explicitly approved:

| Claim | Why unsafe |
|-------|------------|
| OTP / passwordless login | OTP is hidden; not the current flow |
| WhatsApp-first / WhatsApp automation | Share-text only; inbound WhatsApp **PLANNED** |
| Payment gateway, UPI collect, autopay | Ledger + proofs only |
| Advanced reports, analytics, wastage forecasts | Empty reports package |
| Notice board | **PLANNED** |
| Forgot password / email login | Not implemented; email optional on profile |
| “Used by N PGs / N cities / N users” | No counts in repos |
| Testimonials, case studies, logos of customers | None found |
| ISO / SOC / “bank-grade security” | Not found |
| “Live on Google Play / App Store” | Store live status **UNKNOWN** |
| iOS app you can download today | Codebase exists; listing **UNKNOWN** |
| www.acomi.in already exists as a marketing site | This phase is to plan it |
| Global / any-country phone numbers | Indian 10-digit mobiles only |
| Marketplace, booking, “find a PG” | Inverse of the product |
| CountIn / Residine / Amico | Retired names |
| Real SMS OTP delivery | Prod sender `none` |
| Dedicated KYC product | Fields exist; workflow **PLANNED** |
| Full rent + deposit collection product | **PARTIAL** |
| Push notifications | **PLANNED** |
| 24/7 support, SLA, phone number | No contact details |
| Legal company name and address | `[TO BE PROVIDED]` |

Stale docs (`backend-context.md`, early domain-model auth, Jul 2026 roadmap OTP-first auth) must not override current source.

---

## 14. Recommended website structure

Appropriate for ACOMI as an **owner-sold operations product**, not a consumer travel brand.

| Path (proposed) | Purpose |
|-----------------|--------|
| `/` | Homepage — problem, space types, modules, CTAs |
| `/features` | Module detail: Spaces, Occupancy, Members, Meals, Payments, Complaints (Inventory optional, lower) |
| `/how-it-works` | Owner setup vs member invitation |
| `/who-its-for` | PG, Mess, Hostel, Co-living, Rental — only these |
| `/platforms` | Web app + Android; iOS only if listing is confirmed |
| `/about` | Short product origin (Accommodation + Meals). **No invented company bio** |
| `/contact` | Only after a real email exists; otherwise omit or “coming soon” without fake details |
| Header: **Sign in** | External → `https://app.acomi.in/login` |
| Header: **Get started** | External → `https://app.acomi.in/register` |
| Footer: Privacy | External → `https://app.acomi.in/privacy` |
| Footer: Delete account | External → `https://app.acomi.in/delete-account` |
| Footer: Terms | Omit until written |

Do **not** add Pricing until a commercial plan exists in product. Do **not** add Blog/Careers/Investors without content. Do **not** duplicate the logged-in app.

“Who It’s For” should **not** list “tenants looking for PGs.” Members are a secondary audience (invitation), not a demand-gen segment.

---

## 15. Homepage content blueprint

Not final copy — section intent only.

### 15.1 Hero

- **Purpose:** Say what ACOMI is in one breath; send owners to register.
- **Suggested heading:** Run occupancy, meals, and dues
- **Description:** Operations for PGs, hostels, co-living, rentals, and messes — on web and Android.
- **Features:** Multi-space, owner-controlled onboarding.
- **CTA:** Get started → register; Sign in → login.

### 15.2 Space types

- **Purpose:** Show the five real types.
- **Suggested heading:** Built for how Indian shared living actually runs
- **Description:** Short line per type (Paying Guest, Mess/Canteen, Hostel, Co-living, Flats/Rooms). Note Mess is meal-first (no bed map).
- **CTA:** See how it works / Get started.

### 15.3 Module strip

- **Purpose:** Occupancy, Members, Meals, Payments (+ Complaints).
- **Suggested heading:** One space. The operations that matter.
- **Use Play Store captions.** Screenshots from `docs/play-store-assets/screenshots/final/`.
- **CTA:** Explore features.

### 15.4 Owner vs member

- **Purpose:** Prevent marketplace misunderstanding.
- **Suggested heading:** Owners run the space. Members join by invitation.
- **Description:** Owner creates space and invites a mobile number — or adds a member who never installs the app.
- **CTA:** Get started (owners).

### 15.5 How it works (3 steps)

1. Create your space  
2. Set up beds or menus  
3. Add members and track dues  

**CTA:** Create an account.

### 15.6 Platforms

- **Purpose:** Web for desk work, Android for on-site.
- **Suggested heading:** Same ACOMI on web and mobile
- **Do not** claim Play/App Store badges until listings are verified.
- **CTA:** Open web app / Get started.

### 15.7 Trust / legal (minimal)

- **Purpose:** Honesty, not fake badges.
- **Suggested heading:** Your account, your data
- **Description:** Password sign-in; account deletion available; privacy policy on the app site. No certification logos.
- **CTA:** Privacy policy; Delete account.

### 15.8 Final CTA

- **Suggested heading:** Start with one space
- **CTA:** Get started; Sign in.

**Do not include:** testimonials, counters, pricing, “AI-powered,” competitor comparisons, WhatsApp bot, OTP.

---

## 16. CTA strategy

| CTA | Destination | When to use |
|-----|-------------|-------------|
| **Get started** (primary) | `https://app.acomi.in/register` | Hero, final band, owner path |
| **Sign in** (secondary) | `https://app.acomi.in/login` | Header, returning operators |
| **Open ACOMI** / **Open the web app** | `https://app.acomi.in/` | After auth exists; unauthenticated users hit login |
| Privacy | `https://app.acomi.in/privacy` | Footer |
| Delete account | `https://app.acomi.in/delete-account` | Footer / Play compliance |

**Appropriate:** Get Started, Sign In, Explore ACOMI (in-page scroll to features).

**Use carefully:** “Start Managing” — owner-only; do not put on a member-facing block.

**Avoid until true:** Download on Google Play, Download on App Store, Book a demo (no sales motion in product), Start free trial (no billing product found), Login with OTP.

Primary conversion is **owner registration** on the existing app, not a new website signup form.

---

## 17. Technical recommendations

For a **lightweight public marketing site** (not the operations app):

| Concern | Recommendation |
|---------|----------------|
| Stack | **Vite + React + TypeScript** — matches AcomiWeb skills without importing the app |
| Rendering | Prefer **static pages** (prerender or simple multi-page) for SEO; avoid a login-walled SPA |
| Styling | Reuse brand tokens (`#128C7E`, `#25D366`, Plus Jakarta Sans, light green canvas) |
| Responsive | Mobile-first; Play screenshots are 9:16 — don’t force them as desktop heroes |
| SEO | Unique titles/descriptions; `www.acomi.in` canonical; sitemap; Open Graph using feature graphic / icon |
| Accessibility | Semantic HTML, contrast on teal/white, skip link pattern already used in the web app |
| Performance | Static assets, compressed images; do not ship the full operations bundle |
| i18n | English first for www; in-app already has 6 locales — don’t promise a localized marketing site until copy exists |
| Legal | Footer links out to app privacy/deletion; do not fork placeholder legal text |
| Separation | New repo or `public-website/` project — **do not** fold marketing into `AcomiWeb` app routes |

AcomiWeb is the **product**. www should stay a small static site so CloudFront/S3 invalidations stay cheap and the app’s SPA rewrites (`403/404 → index.html`) are not confused with marketing URLs.

---

## 18. Future AWS hosting architecture

**Intended (do not create in this phase):**

```
https://www.acomi.in
        ↓
   CloudFront (HTTPS, redirect HTTP→HTTPS)
        ↓
   S3 bucket (static website objects)
        ↓
   Built ACOMI marketing site (HTML/CSS/JS/assets)
```

Eventually required (inventory only):

1. S3 bucket for www static files (separate from `acomi-web-prod` / `app.acomi.in`)
2. CloudFront distribution with alias `www.acomi.in` (and likely apex `acomi.in` → www)
3. ACM certificate in `us-east-1` for CloudFront
4. DNS records at the registrar for `www.acomi.in` (and apex redirect)
5. HTTPS-only viewer policy; gzip/brotli
6. Cache invalidation on deploy
7. Optional: `acomi.in` (apex) redirect to `www.acomi.in` so both work
8. Do **not** point www at the app bucket; do **not** point www at `api.acomi.in`

Existing app already follows S3 + CloudFront (`acomi-web-prod`, alias `app.acomi.in`). www should be a **second**, isolated static stack.

No AWS, DNS, CloudFront, or S3 changes were made for this document.

---

## 19. Open questions / missing information

1. **Legal entity, address, privacy email** — required before presenting www as a finished company site.
2. **Terms of Service** — missing.
3. **Google Play / App Store live URLs** — assets exist; publication **UNKNOWN**.
4. **Whether iOS should be mentioned** on www.
5. **Commercial model** (free MVP vs paid) — no public pricing in product.
6. **Support channel** for Contact.
7. **Apex domain** `acomi.in` vs `www.acomi.in` only.
8. **Unify brand mark:** Play Store “A” vs web auth “C” (fix belongs in AcomiWeb later, not W1).
9. **Feature graphic resolution** — may be too light for a large desktop hero.
10. **Customer proof** — none; launch without social proof or wait for approved quotes.
11. **www already resolving?** — not verified in this phase; treat the marketing site as not yet built.
12. **Staging hostname** `staging-api.acomi.app` vs production `*.acomi.in` — leftover `.app` naming; irrelevant to www copy.

---

## 20. Recommended next phase

**Phase W2 — Content, legal gates, and visual spec (still no production DNS/AWS unless separately approved)**

1. Fill privacy placeholders (legal name, address, contact) in the **existing** app privacy page — or explicitly launch www with “legal details on app.acomi.in” only.
2. Decide Play/App Store badges (verify live listings).
3. Replace/avoid the web “C” mark in any www design; use the Play Store **A**.
4. Write short homepage copy from this blueprint (still no invented stats).
5. Produce a www visual spec (hero, type, screenshot layout) from existing tokens/assets.
6. Only then **Phase W3**: implement the static site locally.
7. Only then **Phase W4**: S3 + CloudFront + DNS for `www.acomi.in`.

Do not start W3 until W2 copy is reviewed, so the site cannot over-claim OTP, WhatsApp, payments-as-gateway, or customer counts.

---

## Appendix A — Product terminology (use these words)

| Use | Avoid |
|-----|--------|
| Space | Property-as-entity (UI also says “property”; entity name is Space) |
| Owner, Manager, Tenant, Customer, Staff | Admin, guest, subscriber (except meal “Subscription” billing type) |
| Member | User (User = login; Member = operational profile) |
| Occupancy, move-in, vacate, reserve | Check-in (hotel language) unless already in UI |
| Mess | Cafeteria (UI says Mess / Canteen) |
| PG / Paying Guest | Homestay marketplace |
| Dues, payment proof, expected/collected/pending | Checkout, Stripe, autopay |
| Invitation | Join code, public listing |
| ACOMI | CountIn, Residine, Amico |

## Appendix B — Repositories and files inspected

See the concise report at the end of the W1 delivery. No other files were modified.
