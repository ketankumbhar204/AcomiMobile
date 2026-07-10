# CountIn Development Roadmap

**Last updated:** 10 July 2026  
**Document type:** Living development record (statuses reflect actual FE + BE implementation)

**Status legend**

| Mark | Meaning |
|------|---------|
| ✅ Completed | Shipped end-to-end (API + UI) unless noted |
| 🚧 In Progress | Partially shipped; remaining work listed |
| ⏳ Planned | Not started / deferred |
| ❌ Out of scope | Explicitly deferred or not applicable |

**Repositories**

| Layer | Path | Maturity (Jul 2026) |
|-------|------|---------------------|
| Frontend | `K:/CountIn` (React Native / Expo) | High for ops modules; Complaints stub only |
| Backend | `K:/Projects/CountIn/Backend/countin-backend` | High for core domains; empty `complaint` / `report` / `whatsapp` packages |

---

# Development journey (chronological)

This section preserves the historical phase order while updating statuses to match what is actually in the codebase today.

---

## Phase 1 — Foundation ✅ Completed

### Authentication ✅

* ✅ Send OTP (`AuthController` / `authApi.sendOtp`)
* ✅ Verify OTP + JWT issue
* ✅ Session / token management
* ✅ Logout
* ✅ Current user (`GET /me`)
* 🚧 Real SMS / WhatsApp OTP delivery — MVP still uses fixed/dev OTP logging (`OtpService`)

### User onboarding ✅

* ✅ Bootstrap / first-run routing
* ✅ Create space vs join space choice
* ✅ Create Space flow
* ✅ Join Space flow

### Invitation flow ✅

* ✅ Create invitation
* ✅ Accept invitation
* ✅ Cancel invitation
* ✅ My invitations list

### Profile completion ✅

* ✅ Profile completion gate (`useProfileCompletionGate`, `CompleteProfileScreen`)
* ✅ `PATCH /me` / profile fields (V72)
* 🚧 Full KYC workflow product (status enum exists; no dedicated KYC pipeline)

### Role & permission system ✅

* ✅ Roles: OWNER · MANAGER · TENANT · CUSTOMER · STAFF
* ✅ Server `SpacePermissionsResponse` + FE `useSpacePermissions`
* ✅ Tab / screen gating (Members, Accommodation, Meals, Payments)
* ✅ Spec: [permissions-backend-spec.md](./permissions-backend-spec.md)

---

## Phase 2 — Space Management ✅ Completed (core)

### Space creation & lifecycle ✅

* ✅ Create / edit / view space
* ✅ My Spaces list, search, switcher, default space
* ✅ Single-space auto-open dashboard
* ✅ Soft deactivate space (API + UI)
* ⏳ Hard delete space (optional)

### Space types ✅

* ✅ PG · Mess · Hostel · Co-Living · Rental

### Amenities ✅

* ✅ Space amenities (codes + custom)
* ✅ Occupancy / contract amenity assignments

### Rules & policies 🚧

* ✅ Gender policy on space
* ⏳ House rules / policy documents module (no dedicated entity/API/UI)

### Delivery locations ✅ (meal module)

* ✅ CRUD + reorder (`MealDeliveryLocationsScreen`)
* ✅ Used in polls, headcount, member activity
* 🚧 Address/landmark field polish; first-class dashboard quick-action entry

### Structure management ✅

* ✅ Building · Floor · Unit · Room · Bed hierarchy
* ✅ Quick Setup wizard + Manual Builder
* ✅ Bulk create + duplicate (building / floor / room)
* ✅ Soft deactivate at each level
* ✅ Layout modes: corridor / apartment / rental illustrated + list views
* ✅ Structure search on list screens
* 🚧 Global structure filter UI (hierarchy + wizard filters only today)

---

## Phase 3 — Members Module ✅ Completed

### Member management ✅

* ✅ Add / edit / list / search / filter members
* ✅ View member profile (consolidated tabs)

### Tenant onboarding ✅

* ✅ Invite → accept → membership linking
* 🚧 App-user linking edge cases (partial UX polish)

### Member profile ✅

* ✅ Status, emergency contact, category, role
* ✅ Documents (Aadhaar, PAN, Passport, Other) + verification status
* ✅ Internal notes / remarks

### Accommodation details ✅

* ✅ Current Stay section (hierarchy, status, contract, amenities)
* ✅ Occupancy history screen

### Deposit ✅

* ✅ Amount / paid / refunded / balance on member profile
* ⏳ Space-level deposit *collection* as payment product (see Payments)

### Meal access ✅

* ✅ Participation enroll / pause / resume / stop
* ✅ Meal access toggle + billing type override
* ✅ Member meal activity calendar & day sheet

### History ✅

* ✅ Status / deposit / profile change history

### KYC / profile completion 🚧

* ✅ Profile completion gate for app users
* ✅ Document upload + verification fields on members
* 🚧 Dedicated KYC review workflow / owner checklist product

---

## Phase 4 — Accommodation & Occupancy ✅ Completed

> Mess spaces correctly hide Accommodation. PG / Hostel / Co-Living / Rental use full structure + occupancy.

### Allocation & lifecycle ✅

* ✅ Allocate (bed / room / unit by space type)
* ✅ Reserve · Move-in · Transfer · Vacate · Cancel reservation
* ✅ OccupancyWizard (dashboard, member profile, structure context)
* ✅ Contract snapshots (rent, deposit, food terms)
* ✅ Occupancy history events

### Resident management ✅

* ✅ Dashboard Residents quick actions (Move in · Reserve · Transfer · Vacate)
* ✅ Occupancy list drilldowns

### Availability browser ✅

* ✅ Building summary availability counts
* ✅ **Vacant / bed inventory browser** (`DashboardBedInventoryScreen`, filters, hierarchy grouping)
* ✅ Occupied / vacant / move-ins cards on dashboard + accommodation home

### Dashboard integration ✅

* ✅ `dashboard-summary` accommodation operations
* ✅ Space-level bed status aggregates (no N× building-summary storm on dashboard paint)
* ✅ Focus-gated building summaries on Accommodation tab

### Permissions ✅

* ✅ OWNER / MANAGER / STAFF / TENANT / CUSTOMER matrix enforced server + UI

---

## Phase 5–6 — Meals (library → polls → headcount) ✅ Core completed

> Architecture docs: [meals-phase-5-backend.md](./meals-phase-5-backend.md) · [meals-phase-5.2-menu-planning.md](./meals-phase-5.2-menu-planning.md) · [meals-phase-6-handoff.md](./meals-phase-6-handoff.md)

### Menu library ✅

* ✅ Categories · Items · Combos
* ✅ Veg / non-veg / eggless · deactivate
* ✅ Menu library screen (Items / Combos)

### Daily menu planning ✅

* ✅ Date hub · draft / publish per slot
* ✅ Combo / item / package options · copy from date
* ✅ Share preview (WhatsApp-style text)
* ✅ Today's menu (read-only)
* ⏳ Weekly planning & bulk week copy
* ⏳ Special meal requests

### Meal polls & selection ✅

* ✅ Open / close poll · numbered options · Not available
* ✅ In-app response (`MealPollResponseScreen`, customer dashboard card)
* ✅ Delivery location on response
* ✅ Multi-quantity (Mess)
* ⏳ WhatsApp inbound response parsing

### Headcount ✅

* ✅ Day summary + per-meal detail
* ✅ Options / no-response / delivery breakdown
* ✅ Dashboard + planning bottom sheets

### Serving / delivery locations ✅

* ✅ CRUD + usage in polls / headcount
* 🚧 Serving-location naming policy polish by space type

### Meal participation ✅

* ✅ Plans · enroll / pause / resume / stop
* ✅ Eligibility summary
* ✅ Food-included via occupancy contract (PG)

### PG vs Mess behaviour ✅ / 🚧

* ✅ Mess-first Meals tab + operator planning
* ✅ PG food-in-rent / participation hooks + dashboard meal ops for managers
* 🚧 Further PG-specific meal UX differentiation as needed

### Meal pricing ✅

* ✅ Combo / item / package prices
* ✅ Space + per-member meal billing settings (`PAY_PER_MEAL` · `PREPAID_BALANCE`)
* ✅ Member meal balance wallet

### Meal payment logic ✅ / 🚧

* ✅ Pay now / pay later · proof · approve / reject / request update
* ✅ Prepaid debit + pay-per-meal overflow path
* 🚧 Overflow UX polish · reminder cadence productization

### Performance (meals / dashboard) ✅ recent

* ✅ In-flight dedupe for hot meal GETs
* ✅ Coordinated dashboard meal-day load
* ✅ Backend batch menu entries / package items; eligibility & headcount query reductions
* ✅ Dashboard cache invalidation vs cache-update listener split

---

## Phase 7 — Payments 🚧 In Progress (meal-first MVP shipped)

> Architecture: [payments-phase-7-dashboard.md](./payments-phase-7-dashboard.md)

### Rent collection 🚧

* ✅ Payment types include `RENT` · generation / ledger plumbing
* ⏳ Dedicated rent recording UX (amount, date, mode, remarks) as first-class operator flow
* ⏳ Occupancy “collected” amounts fully populated on all PG ledgers

### Meal payments ✅

* ✅ Day / space payment entities · proof · review
* ✅ Owner Payments tab + tenant payments tab

### Proof submission ✅

* ✅ Universal proof modal · image upload

### Approval workflow ✅

* ✅ Approve · Reject · **Request Update**
* ✅ Review list / filters (Submitted / Paid, etc.)

### Payment history & timeline ✅

* ✅ History screens · timeline API (`GET .../timeline`)
* ✅ Status badges / themed cards

### Payment review ✅

* ✅ `PaymentReviewScreen` · approval cards · proof preview

### Dashboard / Pending Actions / Notifications ✅

* ✅ Financial snapshot cards
* ✅ Pending payment items in Pending Actions
* ✅ In-app payment notifications + deep links

### Remaining (Phase 7)

* ⏳ PG rent collection polish
* ⏳ Deposit collection as payment product
* ⏳ Advanced payment reports (Phase 9)
* 🚧 Payment reminder productization

---

## Phase 8 — Notifications ✅ In-app MVP · Complaints ⏳ next

### Notification architecture ✅

* ✅ `space_notifications` (V75)
* ✅ List / mark read / resolve
* ✅ Channel enum reserved: IN_APP · EMAIL · WHATSAPP · PUSH · SMS (runtime **IN_APP only**)

### In-app notifications ✅

* ✅ Bell badge · `SpaceNotificationsScreen`
* ✅ Operator badge from dashboard pending cache (no duplicate heavy sync)

### Pending Actions integration ✅

* ✅ Sync from payments + meal attention
* ✅ Dashboard card · Pending Actions screen
* ✅ Owner vs tenant filtering

### Backend notification service ✅

* ✅ `NotificationService` · `PendingActionService` · payment sync

### Future channels ⏳

* ⏳ Email · WhatsApp · Push · SMS delivery adapters

### Complaints & Notices (historical Phase 8 item)

* ⏳ **Moved to active next milestone** — see [NEXT DEVELOPMENT PHASE](#next-development-phase)
* ⏳ Notice Board still planned after Complaints MVP

---

## Phase 9 — Dashboard & Reports 🚧 / ⏳

### Owner Dashboard ✅

* ✅ Financial snapshot · property ops · meal ops · quick actions · pending
* ✅ Role-aware operational dashboard

### Tenant / Customer Dashboard ✅

* ✅ My stay · customer meal poll card · tenant payments

### Property / Meal operations ✅

* ✅ Occupied / vacant / move-ins
* ✅ Meal day status · polls · headcount sheet

### Quick Actions · Pending Actions · Stats ✅

* ✅ Residents · Meals · Payments shortcuts
* ✅ Pending Actions count + screen
* ✅ Summary statistics via `dashboard-summary`

### Vacant Beds browser ✅

* ✅ Bed inventory with filters / hierarchy

### Reports ⏳

* ⏳ Occupancy reports
* ⏳ Payment reports
* ⏳ Meal / wastage / forecast reports
* ⏳ Advanced business analytics dashboard  
  *(Backend `report` package empty — `.gitkeep` only)*

---

## Settings 🚧 Partial (no dedicated Settings product)

* ✅ Profile screen (language, documents, logout)
* ✅ Edit Space (general + meal billing for Mess)
* ⏳ Unified Settings hub
* ⏳ Notification preferences
* ⏳ Space archive UX polish beyond deactivate


---

# Module status matrix (Jul 2026)

| Module | Frontend | Backend | Overall |
|--------|----------|---------|---------|
| Auth & onboarding | ✅ | ✅ (OTP channel stub) | ✅ |
| Spaces & structure | ✅ | ✅ | ✅ |
| Members | ✅ | ✅ | ✅ |
| Accommodation / occupancy | ✅ | ✅ | ✅ |
| Meals (Mess + PG hooks) | ✅ | ✅ | ✅ |
| Payments (meal-first) | ✅ | ✅ | 🚧 (rent polish left) |
| Dashboard | ✅ | ✅ | ✅ |
| Notifications (in-app) | ✅ | ✅ | ✅ |
| Complaints | ✅ MVP list/raise/detail | ✅ package + V76 API | 🚧 assign UI / staff queue |
| Reports | ⏳ | ⏳ empty package | ⏳ |
| Settings hub | 🚧 | 🚧 scattered | 🚧 |
| WhatsApp automation | ⏳ share text only | ⏳ empty package | ⏳ |

---

# Architecture & engineering status

### Current architecture status

* Modular backend packages: `auth`, `user`, `member`, `space`, `accommodation`, `occupancy`, `meal`, `payment`, `dashboard`, `notification`, `complaint`
* FE feature folders + shared hooks/utils; React Navigation tabs + stack
* Hexagonal-ish BE layout (`api` / `application` / `domain` / `infrastructure`)
* Placeholder packages ready: `complaint`, `report`, `whatsapp`, `room`

### Backend maturity

* **Strong:** Meals, accommodation/occupancy, spaces, members, dashboard summary, in-app notifications
* **Solid / polishing:** Payments (review, timeline, request update), billing models
* **Empty stubs:** reports, WhatsApp send/receive
* **Complaints:** MVP API + FE shipped (assign UI / staff queue deferred)
* **~505** main Java sources · **75** Flyway migrations (V1–V75) · **~48** unit tests

### Frontend maturity

* **Strong:** Auth, spaces, members, accommodation, meals ops, dashboard, payments UI, notifications bell/list
* **Stub:** Complaints tab (`ScreenPlaceholder`)
* **Debt:** Agent debug ingest regions in some accommodation/occupancy files; verbose API `console.log`

### API completion status

| Domain | Status |
|--------|--------|
| Auth / users / invitations | ✅ |
| Spaces / amenities / permissions | ✅ |
| Accommodation structure + duplicate | ✅ |
| Occupancy lifecycle | ✅ |
| Members / documents / deposit / history | ✅ |
| Meals catalog → polls → headcount → billing | ✅ |
| Payments ledger / proof / review / timeline | ✅ |
| Dashboard summary / pending-actions / notifications | ✅ |
| Complaints | ✅ MVP |
| Reports | ⏳ |
| Multi-channel notification send | ⏳ |

### Database maturity

* Flyway modular folders; version uniqueness test
* Latest domains: payments (V71–V74), notifications (V75), complaints (V76)
* Report / whatsapp migration folders remain placeholders

### Production readiness checklist

| Item | Status |
|------|--------|
| Core PG + Mess operator flows | ✅ Usable |
| Real OTP SMS/WhatsApp | ⏳ |
| Payment gateway / UPI | ⏳ |
| Push notifications | ⏳ |
| Complaints module | ⏳ |
| Reports | ⏳ |
| E2E / integration test suite | ⏳ thin |
| Remove debug agent ingest logs | 🚧 |
| Connection-pool / dashboard load hardening | ✅ recent work |
| Secrets / env separation | 🚧 verify per deploy |
| Observability (APM, structured audit) | ⏳ |

---

# Known technical debt

1. **Agent debug ingest** — `#region agent log` / `127.0.0.1:7467` calls in accommodation / occupancy UI; remove before release.
2. **Verbose client logging** — widespread `console.log` in API modules.
3. **OTP** — fixed/dev OTP path; not production messaging.
4. **House rules** — gender policy only; no rules document module.
5. **Dashboard meal deferral** — must keep `useEffect` on `enabled` (focus-only load regressed empty meal ops once).
6. **Payment collected amounts** — some PG ledger paths still expected-heavy.
7. **Empty BE packages** — `complaint`, `report`, `whatsapp` need first migrations + controllers.
8. **Legacy `ScreenPlaceholder` Dashboard branch** — dead path; safe to delete when touching nav.
9. **Test pyramid** — unit-heavy utils/services; few screen/controller/integration tests.

---

# Performance optimization backlog

| Priority | Item | Status |
|----------|------|--------|
| P0 | Dashboard summary single-flight + cache listeners split | ✅ Done |
| P0 | Stop network-error N× building-summary fallback | ✅ Done |
| P0 | Accommodation building summaries focus-gated | ✅ Done |
| P0 | Meal day GET in-flight dedupe + coordinated dashboard load | ✅ Done |
| P0 | Backend menu entry/package batching; eligibility/headcount query cuts | ✅ Done |
| P1 | Further headcount aggregate SQL (sum by poll) | ⏳ |
| P1 | Dashboard attention `hasAvailableOptions` batch | ⏳ |
| P2 | Image/proof CDN caching & compression | ⏳ |
| P2 | List virtualization audit on large member/bed lists | ⏳ |

---

# UI/UX polish backlog

* Delivery locations: address field, reorder affordances, dashboard entry
* PG rent “Record payment” operator flow
* Meal prepaid overflow messaging clarity
* Remove agent debug noise from accommodation flows
* Complaints tab → MVP list / raise / detail (assign UI next)
* Unified Settings hub
* Notice board (after Complaints)

---

# Testing backlog

* Expand payment / notification / dashboard controller tests
* FE component tests for Payments review & Dashboard meal ops
* Integration tests for occupancy + meal poll payment paths
* E2E smoke: login → dashboard → plan menu → poll → payment review
* Complaints: TDD from API contract once Phase starts

---

# Security backlog

* Production OTP provider + rate limits audit
* Proof image access control / signed URLs
* Role matrix regression tests for new Complaints permissions
* Audit log for complaint status changes & payment reviews
* Dependency / secret scanning in CI

---

# NEXT DEVELOPMENT PHASE

## Complaints Module 🚧 MVP shipped (core) · polish deferred

**Goal:** First-class complaint lifecycle for PG/Hostel tenants, Mess customers, and owner/vendor operators — with notification hooks and future SLA/escalation readiness.

**Backend:** `com.countin.countin_backend.complaint` + Flyway `V76__create_space_complaints.sql`.  
**Frontend:** Complaints tab list + `RaiseComplaint` / `ComplaintDetail` stack screens + `complaintsApi.ts`.  
**Reuse:** `NotificationType.COMPLAINT_*`; Pending Actions sync via `ComplaintNotificationSyncService`.

---

### Owner / Vendor

| Feature | Status | Notes |
|---------|--------|-------|
| Complaint Dashboard | ✅ | List + status filters + counts |
| Complaint assignment | 🚧 | API `POST …/assign` ready; FE assign picker deferred |
| Status management | ✅ | OPEN → IN_PROGRESS → RESOLVED → CLOSED (+ CANCELLED) |
| Priority | ✅ | LOW / MEDIUM / HIGH / URGENT on create |
| Category | ✅ | Space-type aware categories |
| Internal notes | ✅ | Operator toggle on detail |
| Timeline | ✅ | Status, comments, attachments, reopen |
| Attachments | ✅ | Photos (base64, payment-proof style) |
| Reopen complaint | ✅ | 7-day window from RESOLVED |
| Resolution tracking | ✅ | Resolution summary + resolve action |
| Complaint analytics | ⏳ | Counts by category/SLA breach (after MVP) |

### Tenant (PG / Hostel / Co-Living / Rental)

| Feature | Status | Notes |
|---------|--------|-------|
| Raise complaint | ✅ | Category, priority, description, photos |
| Attach photos | ✅ | Multi-image (max 5) |
| Track status | ✅ | List + detail |
| Timeline | ✅ | Public events (internal notes hidden) |
| Add comments | ✅ | Tenant ↔ operator thread |
| Receive notifications | ✅ | In-app; deep link to detail |
| Reopen (if allowed) | ✅ | Within policy window |

### Customer (Mess)

| Feature | Status | Notes |
|---------|--------|-------|
| Raise complaint | ✅ | Mess categories |
| Food-related complaints | ✅ | Optional meal date / slot |
| Service complaints | ✅ | SERVICE / FOOD_SERVICE categories |
| Track resolution | ✅ | |
| Notifications | ✅ | In-app |

### Staff (future)

| Feature | Status | Notes |
|---------|--------|-------|
| Assigned complaints queue | ⏳ | Role STAFF — API scoped; UI deferred |
| Work updates | ⏳ | Progress comments |
| Completion notes | ⏳ | Feeds resolution |

### Future-ready placeholders (design for, implement later)

* ⏳ SLA management (targets per priority/category)
* ⏳ Complaint escalation (breach → OWNER / MANAGER)
* ⏳ Auto assignment rules
* ⏳ Vendor assignment
* ⏳ WhatsApp / Email / Push notifications
* ⏳ Complaint reports (Phase 9)
* ⏳ Staff assigned queue UI
* ⏳ FE assign-to-staff picker

### Suggested Complaints MVP sequence

1. ✅ **Data model + migrations**
2. ✅ **API** — create / list / get / update status / comment / attach / reopen / assign / resolution
3. ✅ **Permissions** — tenant/customer create+own; owner/manager all; staff assigned (API)
4. ✅ **FE tenant/customer** — raise + track on Complaints tab
5. ✅ **FE owner** — list + detail + status + notes + resolve
6. ✅ **Notifications + Pending Actions** — create / status / reopen / comments
7. **Staff queue** (v1.1)
8. **SLA / escalation / reports** (v1.2+)

---

# Immediate next tasks

> Complaints **MVP core is shipped**. Remaining: staff queue UI, assign picker polish, SLA/escalation, Notice Board.

| # | Task | Track | Priority |
|---|------|-------|----------|
| 1 | Complaints — FE assign picker + staff queue | Complaints | P1 |
| 2 | Notice Board (after Complaints polish) | Notices | P1 |
| 3 | Remove agent debug ingest logs from accommodation/occupancy | Tech debt | P1 |
| 4 | PG rent “Record payment” operator flow | Payments | P1 |
| 7 | Delivery locations polish (address / reorder / quick action) | Meals | P2 |
| 8 | Weekly menu planning | Meals | P2 |
| 9 | Notice Board | Ops | P2 |
| 10 | Reports module kickoff | Reports | P3 |

### Parallel polish (does not block Complaints)

* Meal payment reminder cadence
* Prepaid overflow UX
* Backend headcount/attention query micro-optimizations
* Expand automated tests around payments & dashboard

---

# Future enhancements (unchanged vision)

* Multi-language Support (UI language exists; deeper i18n)
* WhatsApp Automation (outbound + inbound)
* AI Demand Prediction
* QR Meal Check-In
* UPI / payment gateway Integration
* Advanced Analytics
* SLA-driven operations across complaints & payments

---

# Related docs

* [permissions-backend-spec.md](./permissions-backend-spec.md)
* [meals-phase-5-backend.md](./meals-phase-5-backend.md)
* [meals-phase-5-ui-integration.md](./meals-phase-5-ui-integration.md)
* [meals-phase-5.2-menu-planning.md](./meals-phase-5.2-menu-planning.md)
* [meals-phase-5-menu-library-architecture.md](./meals-phase-5-menu-library-architecture.md)
* [meals-phase-6-handoff.md](./meals-phase-6-handoff.md)
* [payments-phase-7-dashboard.md](./payments-phase-7-dashboard.md)

---

*This roadmap is the source of truth for implementation status. Update statuses when a feature ships in both FE and BE (or document intentional FE/BE skew).*
