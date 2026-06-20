# CountIn Development Roadmap

**Last updated:** June 2026

**Status legend:** ✅ Complete · 🔶 Partial · ⬜ Not started / deferred

---

## Phase 1 - Foundation ✅

✅ Authentication

* Send OTP
* Verify OTP
* JWT Authentication
* Session Management
* Logout
* Current User

---

## Phase 2 - Spaces Module ✅

### Space Management

* ✅ Create Space
* ✅ Edit Space
* ✅ View Space Details
* ⬜ Delete Space (Optional)

### My Spaces

* ✅ List Spaces
* ✅ Search Spaces
* ✅ Space Switcher
* ✅ Default Space Selection
* ✅ Single-space startup (auto-open dashboard)

### Membership Management

* ✅ Invite Members
* ✅ Accept Invitation
* ✅ Cancel Invitation
* ✅ View Members
* ✅ Role Management

### Space Types

* ✅ PG
* ✅ Mess
* ✅ Hostel
* ✅ Co-Living
* ✅ Rental

### Space Settings

* 🔶 General Information
* ⬜ Notifications
* ✅ Language Settings
* ⬜ Space Archive / Deactivate

---

## Phase 3 - Members Module ✅

### Member Management

* ✅ Add Member
* ✅ Edit Member
* ✅ View Member Profile

### Member Profile

* ✅ Member Status
* ✅ Emergency Contact
* 🔶 App User Linking

### Document Management

* ✅ Aadhaar
* ✅ PAN
* ✅ Passport
* ✅ Other Documents
* ✅ Verification Status

### Deposit Management

* ✅ Deposit Amount
* ✅ Deposit Paid
* ✅ Deposit Refunded
* ✅ Deposit Balance

### Member Notes

* ✅ Internal Notes
* ✅ Remarks

### Member History

* ✅ Status History
* ✅ Deposit History
* ✅ Profile Change History

---

## Phase 4 - Accommodation Management ✅ Core complete

> **Delivered:** 4.1 Structure CRUD · 4.2 Quick Setup & Builder · 4.3 Occupancy lifecycle · 4.3b Contract snapshots · Dashboard Residents module card
>
> **Remaining polish (4.5):** availability browse screen, structure list filters (dashboard occupancy metrics ✅ via Phase 7 dashboard-summary)

### Goal

Manage physical accommodation structure and occupancy across:

* PG
* Hostel
* Co-Living
* Rental

Mess spaces do not use Accommodation Management.

### Structure UI ✅

* ✅ Inline name edit on list rows (building, floor, unit, room, bed)
* ✅ Full edit screens for other fields
* ✅ Quick Setup wizard
* ✅ Manual Builder with lifecycle menus
* ✅ Bulk create (rooms, units, beds) and duplicate

### Property Structure ✅

#### Buildings

* ✅ Create Building
* ✅ Edit Building
* ✅ View Building
* ✅ Deactivate Building

#### Floors

* ✅ Create Floor
* ✅ Edit Floor
* ✅ View Floor
* ✅ Deactivate Floor

#### Units

* ✅ Create Unit
* ✅ Edit Unit
* ✅ View Unit
* ✅ Deactivate Unit

#### Rooms

* ✅ Create Room
* ✅ Edit Room
* ✅ View Room
* ✅ Deactivate Room

#### Beds

* ✅ Create Bed
* ✅ Edit Bed
* ✅ View Bed
* ✅ Deactivate Bed

### Space Type Rules ✅

#### PG / Hostel

Building → Floor → Room → Bed · Member → Bed

#### Co-Living

Building → Unit → Room → Bed · Member → Bed or Room

#### Rental

Building → Unit (optional Room) · Member → Unit

#### Mess

Members ✅ · Meals 🔶 (Phase 5–6 MVP) · Polls & headcount 🔶 · Billing 🔶 (Phase 7 — meal ledger + dashboard API)

### Occupancy Management ✅

* ✅ Allocate Member (Bed / Room / Unit by space type)
* ✅ Reserve Member (future move-in)
* ✅ Move In (reserved → active)
* ✅ Transfer Member
* ✅ Vacate Member
* ✅ Cancel Reservation
* ✅ Occupancy history
* ✅ OccupancyWizard (shared flow from dashboard, member profile, bed/room context)
* ✅ Contract snapshots — rent, deposit, food terms (4.3b)
* ✅ Dashboard **Residents** module card → bottom sheet (Move In · Reserve · Transfer · Vacate)

### Accommodation Status ✅

Available · Occupied · Reserved · Maintenance · Blocked

* ✅ Status on unit, room, bed forms and lists
* ✅ Status filter chips in occupancy wizard target picker
* ✅ MAINTENANCE / BLOCKED excluded from allocation picker

### Availability Management 🔶

* 🔶 Available / Occupied beds & rooms — counts in building summary header
* 🔶 Vacant units — aggregated in summary API
* ⬜ Dedicated availability / vacancy browse screen

### Capacity, Dashboard & Search 🔶

* ✅ Room & bed capacity (forms, quick setup)
* ✅ Structure metrics — building summary on accommodation home
* ✅ Text search on structure list screens
* ✅ Allocation-target search in occupancy wizard
* 🔶 Filter by building, floor, unit, room, status — hierarchy navigation + wizard filters only; no global structure filter UI
* ✅ Dashboard occupancy metrics — occupied/vacant beds, move-ins, pending payments (dashboard-summary API)

### Permissions ✅ (Phase 4.5)

Implementation: `spacePermissions.ts`, `useSpacePermissions`, `permissions-backend-spec.md`

| Role | Intended access | Status |
|------|-----------------|--------|
| **OWNER** | Full access | ✅ Server + UI |
| **MANAGER** | Operate, no structure delete | ✅ Server + UI |
| **TENANT** | Own allocation read-only | ✅ Tab hidden; My stay on dashboard |
| **CUSTOMER** | No accommodation/occupancy | ✅ Tab hidden; section hidden |
| **STAFF** | Structure read + occupancy list | ✅ Read-only FABs |

- `GET /spaces/my` `permissions` block preferred over local role matrix
- Accommodation tab gated by `canViewAccommodation`
- Stack screens wrapped in `RequireAccommodationAccess`
- 403 errors mapped via `permissionErrors.ts`

> **Backend spec:** [permissions-backend-spec.md](./permissions-backend-spec.md)

### Out of Scope (Phase 4)

Rent, billing, payments, deposits, complaints, maintenance tickets — handled in Phases 7–8. Meals & polls are Phase 5–6 (Mess).

---

## Phase 5 - Meal Management 🔶 Mess MVP in progress

> **Architecture:** [meals-phase-5-backend.md](./meals-phase-5-backend.md) · [meals-phase-5-ui-integration.md](./meals-phase-5-ui-integration.md) · [meals-phase-5.2-menu-planning.md](./meals-phase-5.2-menu-planning.md) · [meals-phase-5-menu-library-architecture.md](./meals-phase-5-menu-library-architecture.md) · [payments-phase-7-dashboard.md](./payments-phase-7-dashboard.md)
>
> **Scope:** Mess spaces only. PG/hostel food-in-rent uses participation hooks; full meal tab is Mess-first.

### Menu library (master data) ✅

* ✅ Food categories & food items (veg / non-veg / eggless)
* ✅ Meal combos (library CRUD, pricing, item composition)
* ✅ Menu library screen (Items · Combos tabs, inline chip editors)
* ✅ Combo / item deactivate

### Meal participation ✅

* ✅ Meal plans (FULL, breakfast-only, etc.)
* ✅ Enroll / pause / resume / stop participation
* ✅ Member meal access toggle (Mess customers & profile)
* ✅ Eligibility summary per date & meal slot
* 🔶 Tenant food-included via occupancy contract (backend wired; UI on move-in flows)

### Daily menu planning ✅

* ✅ Menu planning hub (date nav, per-slot cards: Breakfast / Lunch / Dinner)
* ✅ Plan meal screen — select combos, kitchen notes, copy yesterday
* ✅ Draft / publish per slot
* ✅ Inline combo price edit (library price updates on blur / save)
* ✅ Share menu preview (numbered WhatsApp-style message)
* ✅ Today's menu (read-only)
* ✅ Meals tab quick entry (planning as tab root for managers)
* ⬜ Weekly menu planning & bulk week copy

### Operator dashboard (Mess) 🔶

* ✅ Attention required (tomorrow menu not planned / partial / ready to share / open poll)
* ✅ Financial snapshot (Expected Charges / Collected / Pending — backend API + client fallback)
* ✅ Meal operations (members receiving meals, menus published, open polls, today's headcount)
* ✅ Quick actions (Meals · Members · Payments shortcuts)
* ✅ Unified PG accommodation operations on non-Mess spaces

### Member profile — Meals tab ✅

* ✅ Meal activity calendar & history (accepted / pending / amounts / payment status)
* ✅ Day detail bottom sheet (selections, delivery, payment review)
* ✅ Profile consolidates Documents & Notes (no separate top-level tabs)

> ~~Dashboard **Meals** module card is stubbed~~ — **Done for Mess:** operational dashboard + quick actions. PG spaces still use Residents card only.

### Not started / deferred (Phase 5)

* ⬜ Weekly menu planning
* ⬜ Menu history reports (beyond per-member activity)
* ⬜ Special meal requests
* ⬜ Dedicated meal consumption analytics

---

## Phase 6 - Availability & Polls 🔶 Core delivered

> **Handoff:** [meals-phase-6-handoff.md](./meals-phase-6-handoff.md)

### Meal availability polls ✅

* ✅ Open / close poll per meal slot (auto-open on share)
* ✅ Numbered menu options + “Not available” synthetic option
* ✅ Multi-quantity polls (when enabled on space)

### Response collection 🔶

* ✅ In-app member responses (`MealPollResponseScreen`, dashboard poll card)
* ✅ Delivery location per response
* 🔶 Payment choice (pay now / pay later) + proof upload + owner approve/reject
* ⬜ WhatsApp response ingestion (share text only; no inbound parsing)

### Headcount engine ✅

* ✅ Day summary (`GET /meals/headcount?date=`)
* ✅ Per-meal breakdown (options, no-response members, delivery by location)
* ✅ Headcount bottom sheet (menu planning + dashboard)
* ✅ Owner dashboard — tomorrow headcount chips & remind members

### Member meal activity & billing signals 🔶

* ✅ Monthly activity API (accepted / pending / generated / paid / pending amounts)
* ✅ Per-day detail with slot amounts and payment status
* ✅ Space-wide billing rollup (`GET /spaces/{id}/dashboard-summary`, `GET /spaces/{id}/payments/ledger`)

### Forecasting & reports ⬜

* ⬜ Daily / weekly forecast
* ⬜ Food wastage report
* ⬜ Attendance / consumption trend reports

---

## Phase 7 - Payment Management 🔶

* ✅ Payments tab (member ledger, filters, month nav — OWNER/MANAGER)
* ✅ Unified financial cards (Expected Charges / Collected / Pending) on dashboard + payments
* ✅ Backend ledger + dashboard-summary APIs (Mess meal activity, PG occupancy, hybrid)
* 🔶 Client fallback when API unavailable (404/network)
* ⬜ Rent collection recording (PG — expected from occupancy; collected stays empty)
* ⬜ Mess subscription / monthly billing
* ⬜ Deposit management (member profile ✅; space-level collections ⬜)
* ⬜ Payment history & reminders
* 🔶 Meal poll day payments (member choice + proof + owner review — Phase 6)

---

## Phase 8 - Complaints & Notices ⬜

* ⬜ Complaint Management
* ⬜ Notice Board
* ⬜ Notifications

---

## Phase 9 - Reports & Dashboard 🔶

* 🔶 Unified space dashboard (Mess ops + PG accommodation ops + financial snapshot)
* 🔶 Accommodation dashboard metrics (occupied/vacant beds, move-ins, pending payments count)
* ⬜ Occupancy reports (PG)
* ⬜ Payment reports
* ⬜ Meal reports & advanced business dashboard

---

## What’s next (recommended order)

### Mess operators (current focus)

1. **Phase 7 polish** — rent collection API, subscription/credits billing models
2. **Phase 6 polish** — payment workflow hardening, reminders
3. **Phase 5** — weekly menu planning, menu history
4. **Phase 6** — wastage / consumption reports

### PG / Hostel (when switching focus)

1. **Phase 4.5** — availability browse screen, structure filters
2. **Phase 7** — rent collection recording API

---

## Future Enhancements

* Multi-language Support
* WhatsApp Automation
* AI Demand Prediction
* QR Meal Check-In
* UPI Integration
* Advanced Analytics
