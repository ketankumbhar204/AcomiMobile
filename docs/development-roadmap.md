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
> **Remaining polish (4.5):** real dashboard metrics, availability browse screen, permission tab gating, structure list filters

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

Accommodation not applicable (Members, Meals, Availability, Billing)

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
* 🔶 Dashboard occupancy metric — placeholder value; not yet wired to summary API

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

Rent, billing, payments, deposits, meals, availability polls, complaints, maintenance tickets

---

## Phase 5 - Meal Management (Next)

> **Architecture:** [meals-phase-5-backend.md](./meals-phase-5-backend.md) (backend repo handoff) · [meals-phase-5-ui-integration.md](./meals-phase-5-ui-integration.md) (UI repo + Cursor prompt)

### Menu Master

* Breakfast Menu
* Lunch Menu
* Dinner Menu

### Menu Planning

* Daily Menu Planning
* Weekly Menu Planning

### Meal Tracking

* Meal Consumption
* Special Meal Requests

### Menu History

* Daily History
* Weekly History

> Dashboard **Meals** module card is stubbed (Coming soon) pending Phase 5.

---

## Phase 6 - Availability Management (USP)

### Meal Availability Polls

* Breakfast Poll
* Lunch Poll
* Dinner Poll

### Response Collection

* App Responses
* WhatsApp Responses

### Headcount Engine

* Expected Breakfast Count
* Expected Lunch Count
* Expected Dinner Count

### Forecasting

* Daily Forecast
* Weekly Forecast

### Reports

* Food Wastage Report
* Attendance Report
* Consumption Trends

---

## Phase 7 - Payment Management

* Rent Collection
* Subscription Collection
* Deposit Management
* Payment History
* Payment Reminders

---

## Phase 8 - Complaints & Notices

* Complaint Management
* Notice Board
* Notifications

---

## Phase 9 - Reports & Dashboard

* Occupancy Reports
* Payment Reports
* Meal Reports
* Business Dashboard

---

## Future Enhancements

* Multi-language Support
* WhatsApp Automation
* AI Demand Prediction
* QR Meal Check-In
* UPI Integration
* Advanced Analytics
