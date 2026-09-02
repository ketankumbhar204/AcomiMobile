# ACOMI product and public-website context

**Purpose:** Give a designer or developer enough product truth to redesign `https://www.acomi.in` correctly. This document describes the **actual ACOMI product**, then the **current public website**. It is not a UI spec and not an implementation plan.

**Date:** 2026-08-22  
**Repo:** `K:\AcomiPublicWebsite` (GitHub `ketankumbhar204/AcomiPublicWebsite`)  
**Evidence:** Current source in AcomiPublicWebsite, AcomiWeb (`app.acomi.in`), AcomiMobile (Android), and acomi-backend. Existing docs were used only when they match source.

**Rules used while writing this file**

- Do not invent customers, features, metrics, legal entity, or unshipped capabilities.
- Mess is a **primary market**, equal to PG. It is **not** another accommodation type.
- Payments are an **operational ledger with proofs**, not a payment gateway.
- Labels below: **VERIFIED** (in current source), **PARTIAL** (exists but incomplete), **PLANNED** (reserved / empty / hidden), **NOT IMPLEMENTED**, **UNKNOWN**, **UNSAFE for marketing** (present on the website but not backed by product data).

**Related surfaces (do not confuse them)**

| Surface | Role | URL |
|---------|------|-----|
| Public marketing site | This repo | Intended: `https://www.acomi.in` |
| Signed-in web app | AcomiWeb | `https://app.acomi.in` |
| API | acomi-backend | `https://api.acomi.in` |
| Android app | AcomiMobile | Package `com.acomi`, display name ACOMI |
| Privacy | Inside the web app | `https://app.acomi.in/privacy` |
| Account deletion | Inside the web app | `https://app.acomi.in/delete-account` |

---

## 1. ACOMI PRODUCT OVERVIEW

### What ACOMI is

**VERIFIED.** ACOMI is **Accommodation + Meals** — operations software for a real-world **space**. A space is one of: PG, Mess, Hostel, Co-living, or Rental.

The product helps an **owner/operator** run daily operations in one place:

- Who lives there or eats there (**Members / Customers**)
- Buildings, rooms, and beds when the space is lodging (**Accommodation / Occupancy**)
- Daily menus, participation, and **meal headcount** (**Meals**)
- Expected, collected, and pending amounts with **payment proofs** (**Payments**)
- Maintenance, food, and service issues (**Complaints**)
- Stock and assets (**Inventory**)
- In-app alerts and a pending-work inbox (**Notifications / Pending Actions**)
- More than one property or mess under the same login (**Multi-space**)

Existing product lines:

- Web README / backend README: “Accommodation + Meals — Manage Your Stay & Meals”
- Play Store feature graphic: “Run occupancy, meals, and dues” · Occupancy · Members · Meals · Payments
- Web login brand panel: “Property and meal operations for PGs, hostels, and messes — the same product you use on mobile.”

The **buyer** is the space owner. Tenants, meal customers, and staff **join by invitation**. Nobody discovers or books a bed on ACOMI.

### What problem it solves

Operators of Indian PGs, messes, hostels, co-living properties, and rentals currently run occupancy, members, meals, and dues across **notebooks, spreadsheets, and WhatsApp**. They cannot reliably answer:

- Which beds are free, reserved, or occupied? *(lodging)*
- How many breakfast / lunch / dinner plates should we cook today? *(mess and food-included lodging)*
- Who has paid, who has sent a proof, who still owes?
- Which complaints are open?
- What is happening across more than one space?

ACOMI puts those operations in one **space-scoped** product with role-based access, owner-controlled onboarding, and the same backend for web and Android.

### Core product positioning

ACOMI is an **operator operations system**, not a consumer marketplace.

Position it as two first-class products that share one platform:

1. **Lodging operations** (PG, Hostel, Co-living, Rental) — people + occupancy + optional meals + dues + issues.
2. **Meal operations** (Mess, and lodging that includes food) — customers + menus + participation + **daily headcount** + meal billing.

Do **not** collapse Mess into “another PG type.”

### What ACOMI is NOT

Do not describe ACOMI as:

- A PG / hostel listing, discovery, or booking website
- A tenant marketplace (“find a PG”)
- A payment gateway, UPI collector, card processor, or autopay product
- A WhatsApp bot or WhatsApp-first automation platform (the product can **share menu text**; it does not send or receive WhatsApp automatically)
- An analytics / BI / reports suite (backend `report` package is empty)
- A hotel PMS or travel product
- A multi-country product (auth is **Indian 10-digit mobile numbers only**)

Retired names **CountIn**, **Residine**, and **Amico** must not appear in public copy.

### Primary value proposition

For an owner: **see and run today’s operations** — occupancy where beds exist, **headcount where meals exist**, members/customers, dues with proofs, and open issues — without leaving notebooks and WhatsApp.

The most accurate existing tagline is still: **Run occupancy, meals, and dues.**

---

## 2. TARGET CUSTOMERS

The public website sells to **owners/operators**. Members are users, not buyers.

Do **not** treat PG as the default customer. **Mess is a primary market** and must appear with equal weight.

### 2.1 PG owners / operators

**What they manage:** A Paying Guest house. People live in rooms/beds. Food may or may not be included in rent (`foodIncludedInRent` on the space / occupancy contract).

**Daily operational problems:** Who occupies which bed; who is moving in or vacating; which beds are vacant or reserved; member records and documents; rent/dues proofs; complaints (maintenance, housekeeping, food if served); optional daily meals if food is included.

**Information they need:** Occupied / vacant / reserved beds; member list; expected vs collected vs pending; open complaints; if food is included — today’s breakfast/lunch/dinner headcount.

**Relevant ACOMI features:** Space creation (type `PG`), Quick Setup / accommodation hierarchy, occupancy lifecycle, members (default role **TENANT**), optional meals, payments, complaints, inventory (asset profile), multi-space.

**What makes the workflow different:** Accommodation is **required** in setup (`PROPERTY_READY`, `RESIDENTS_READY`). Meals are **optional**. Layout defaults to corridor PG (floors → rooms → beds) or apartment PG (floors → units → rooms → beds). Gender/property category copy includes Gents / Ladies / Mixed PG.

### 2.2 Mess owners / operators

**What they manage:** A mess / canteen. People **eat**, they do not occupy a bed in this space. The important objects are **customers, menus, meal participation, and daily headcount**.

**Daily operational problems:** What is on breakfast / lunch / dinner; how many plates to cook; who responded vs who is eligible; extras; delivery / serving locations; pay-per-meal vs prepaid; proofs for meal charges; food-related complaints; food stock.

**Information they need:** Today’s menu status; **meals to prepare vs eligible count** per slot; poll open/closed; no-response list; headcount by serving location; meal dues; customer list.

**Relevant ACOMI features:** Space type `MESS` (accommodation **hidden**), members default role **CUSTOMER** (TENANT is not assignable), menu library, daily planning, share-as-text, polls (Mess supports **multi-quantity**), extras, delivery locations, meal headcount page, meal billing, inventory **FOOD** profile, import customers from other owned spaces.

**What makes the workflow different:** Setup is meal-first: menu library → (optional customers) → today’s menu → share. Serving locations are **delivery** mode, not property rooms. There is no building/floor/room/bed map. Dashboard uses `DashboardMessOperations` (`todaysHeadcount`, `openPollsCount`, `membersReceivingMeals`) instead of bed occupancy.

### 2.3 Hostel operators

**What they manage:** Hostel-style beds and rooms (often denser than a PG). Same lodging domain as PG.

**Daily operational problems:** Same occupancy + member + dues + issues pattern as PG; meals optional.

**Information they need:** Bed inventory, occupancy lifecycle, members, dues, complaints; meals if the hostel serves food.

**Relevant ACOMI features:** Type `HOSTEL`. Accommodation applicable. Layout options same as PG (`CORRIDOR_PG`, `APARTMENT_PG`). Default member role TENANT. Meals optional in setup.

**What makes the workflow different:** Product category / gender copy is Boys / Girls / Mixed Hostel. Operational modules match lodging, not Mess.

### 2.4 Co-living operators

**What they manage:** Shared accommodation organized more like units than a long PG corridor.

**Daily operational problems:** Unit/room/bed occupancy, members, dues, issues; meals optional.

**Information they need:** Same lodging operational picture, with a unit-first layout.

**Relevant ACOMI features:** Type `CO_LIVING`. Layout mode `CO_LIVING` (units → rooms → beds; floors hidden). Meals optional. Serving locations use **property** mode (like PG/Hostel), not Mess delivery.

**What makes the workflow different:** Hierarchy emphasis is units, not corridor floors. Still accommodation-first, not meal-first.

### 2.5 Rental operators

**What they manage:** Flats / rooms as rental units. Occupancy and members without becoming a listing site.

**Daily operational problems:** Which units are occupied; who the tenant is; dues/proofs; issues. Meals are **not** part of rental setup.

**Information they need:** Unit occupancy and member/dues state. No meal planner in the required setup profile.

**Relevant ACOMI features:** Type `RENTAL`. Layout `RENTAL` (units; **no beds** in the UI profile). Setup **omits** `MEALS_READY`. Serving locations **hidden**. Inventory defaults to **FURNITURE**.

**What makes the workflow different:** No bed map and no meal milestone. Do not market meals or headcount as a rental headline.

### Roles inside every space (not separate buyer segments)

| Role | Buyer? | Typical job |
|------|--------|-------------|
| **OWNER** | Yes | Creates the space; full operator; only role that can remove members / deactivate space |
| **MANAGER** | Operator, usually not buyer | Day-to-day members, occupancy, meals, payments, complaints |
| **TENANT** | No | Resident of a lodging space (not used on Mess) |
| **CUSTOMER** | No | Meal subscriber / mess customer |
| **STAFF** | No | Limited operational visibility; inventory view; can be a complaint assignee |

---

## 3. CORE BUSINESS PROBLEMS

| Problem | PG / Hostel / Co-living | Rental | Mess | How ACOMI addresses it today |
|---------|-------------------------|--------|------|------------------------------|
| **Occupancy visibility** | Yes | Yes (units, not beds) | No | Building/floor/room/bed (or unit) map; occupied / vacant / reserved; bed inventory |
| **Member management** | Residents | Tenants | Customers | One member list; add record without the app, or invite a mobile number |
| **Meal planning** | Optional (if food included) | No (setup omits meals) | **Primary** | Menu library + plan Breakfast / Lunch / Dinner for a date |
| **Daily meal headcount** | If meals are run | No | **Primary** | `mealsToPrepare` vs `eligibleCount`; poll responses; no-response list |
| **Breakfast / lunch / dinner participation** | If meals are run | No | **Primary** | Meal plans + enroll / pause / resume / stop; poll accept / skip |
| **Expected vs actual meal counts** | If meals are run | No | **Primary** | UI copy: “Headcount collected / Expected”; `mealsToPrepare / eligibleCount` |
| **Food wastage** | Indirect (if they cook) | No | **Primary operational pain** | **No wastage analytics module.** Headcount exists so the kitchen cooks to response, not guesswork. Do not claim AI wastage forecasts |
| **Meal availability** | If meals are run | No | Yes | Daily menu publish; items can be marked unavailable; poll open/closed |
| **Dues / payment tracking** | Rent + optional meals | Rent / other | Meal charges | Expected / collected / under review / pending; proofs; approve / reject / request update |
| **Complaints / issues** | Yes | Yes | Yes (often food) | Raise, status, comments, photos; web assign |
| **Inventory** | Assets | Furniture | Food stock | Categories, items, stock, suppliers; profile seeded by space type |
| **Managing multiple spaces** | Yes | Yes | Yes | My Spaces, default space, switcher |
| **Information scattered across notebooks, spreadsheets, WhatsApp** | Yes | Yes | Yes | One space-scoped system; menu **share as text** (WhatsApp-style copy, not automation) |

**Especially important for Mess (and food-included PG):** the kitchen question is not “how many beds are full?” It is **“how many plates for breakfast, lunch, and dinner today?”** That is the user-facing value of headcount.

---

## 4. CORE ACOMI WORKFLOWS

Current production auth is **password** (Indian mobile + password). OTP APIs exist but are hidden. There is **no forgot-password**. There is **no public join code**.

### Owner registration

- **Who:** Prospective owner.
- **Goal:** Create an ACOMI account.
- **Data:** Name, 10-digit Indian mobile (first digit 6–9), password (UI validates 8–72 characters).
- **Problem solved:** A login that can own spaces. `POST /api/v1/auth/register` → JWT.

### Login

- **Who:** Returning owner, manager, tenant, customer, staff.
- **Goal:** Open the same product on web or Android.
- **Data:** Mobile + password → JWT (default 24 hours) → `GET /api/v1/auth/me`.
- **Problem solved:** Shared session model across platforms.

### Space creation and type selection

- **Who:** Owner, after “I Am an Owner”.
- **Goal:** Create one operational space.
- **Data:** Name, **type** (`PG` / `MESS` / `HOSTEL` / `CO_LIVING` / `RENTAL`), optional address and contact. **Type cannot be changed later.**
- **Problem solved:** The rest of the product is gated by space type (accommodation vs meal-first).

### PG / Hostel / Co-living setup

- **Who:** Owner / manager.
- **Goal:** Make the property operable.
- **Data / steps:** Space created → **property layout** (Quick Setup or manual) → **residents** → optional menu library.
- **Problem solved:** You cannot allocate a bed or track occupancy until the hierarchy exists.

### Mess setup

- **Who:** Owner / manager.
- **Goal:** Be able to publish today’s menu and collect headcount.
- **Data / steps:** Space created → **menu library** (required) → customers (optional, can skip) → **today’s menu** (required) → **share** (required) → delivery locations (recommended).
- **Problem solved:** A mess is ready when a menu can be shared and responses/headcount can start — not when rooms exist.

### Rental setup

- **Who:** Owner / manager.
- **Goal:** Units + tenants, no meal milestone.
- **Data:** Units (no beds in rental UI profile).
- **Problem solved:** Flat/room occupancy without forcing a PG bed model or a mess menu.

### Building / floor / room / bed setup

- **Who:** Owner / manager on lodging spaces.
- **Goal:** Model the real property.
- **Data:** Buildings, floors, units/rooms, beds; layout mode; bulk create; duplicate building/floor/room.
- **Problem solved:** Occupancy visibility. **Does not apply to Mess.**

### Member / customer creation

- **Who:** Owner / manager.
- **Goal:** Record the people who live or eat in the space.
- **Data:** Name, mobile, role, gender (required on Mess), documents (Aadhaar, PAN, Passport, Other), emergency contact, meal access.
- **Two paths:** (1) **Operational record** — “They do not need the ACOMI app.” (2) **Invitation** to a mobile number.
- **Problem solved:** People no longer live only in WhatsApp/Excel. Mess can **import customers** from other spaces the owner manages.

### Invitations

- **Who:** Owner / manager sends; invitee accepts.
- **Goal:** Give someone an app login for that space and role.
- **Data:** Mobile number + role. Invitee must register/login with **that same mobile**. Accept invitations screen. Cancel pending invite.
- **Problem solved:** Controlled onboarding. **No marketplace, no join code.**

### Occupancy allocation

- **Who:** Owner / manager on lodging spaces.
- **Goal:** Put a member on a bed/unit and later move or free it.
- **Data / actions:** Allocate → Reserve → Move-in → Transfer → Vacate. Contract snapshot (rent, deposit, food terms).
- **Problem solved:** Occupancy visibility and stay history. **Does not apply to Mess.**

### Meal planning

- **Who:** Owner / manager.
- **Goal:** Decide what is served for Breakfast / Lunch / Dinner on a date.
- **Data:** Menu library (categories, items, combos; veg / non-veg / egg); daily menu `DRAFT` / `PUBLISHED` / `MODIFIED`; extras on Mess.
- **Problem solved:** A reusable catalog instead of rewriting the menu in chat every day.

### Meal participation / headcount

- **Who:** Operator plans and reads headcount; tenant/customer responds to the poll.
- **Goal:** Know how many plates to cook, of what, and where.
- **Data:** Poll per meal slot; PG **single-select**; Mess **multi-quantity**; skip / accept; delivery location on Mess; `mealsToPrepare`, `eligibleCount`, option counts, no-response members, location breakdown.
- **Problem solved:** Daily kitchen headcount and expected vs collected responses. Share is **copyable text**, not WhatsApp inbound.

### Payment / dues tracking

- **Who:** Owner/manager reviews; tenant/customer uploads proof.
- **Goal:** See expected / collected / pending and close the loop on proofs.
- **Data:** Payment types `MEAL` / `RENT` / `DEPOSIT` / `MAINTENANCE` / `OTHER`; methods recorded as UPI / bank / cash / cheque / other **as labels**, not processed by ACOMI; statuses PENDING → PROOF_UPLOADED / UNDER_REVIEW → PAID / REJECTED / UPDATE_REQUESTED.
- **Problem solved:** Informal dues tracking. **Not** money movement.

### Complaints

- **Who:** Owner, manager, tenant, customer can raise (by permission). Owner/manager see all and manage.
- **Goal:** Keep issues out of chat.
- **Data:** Category, priority, status, comments, photos, assign (web).
- **Problem solved:** Lost maintenance / food / service issues.

### Inventory

- **Who:** Owner / manager manage; staff can view.
- **Goal:** Track stock or assets next to the same space.
- **Data:** Categories, items, stock movements, suppliers; food vs asset vs furniture defaults.
- **Problem solved:** Stock/assets not living in a separate notebook.

### Multiple spaces

- **Who:** Owner (and users invited into more than one space).
- **Goal:** Switch context without a second login.
- **Data:** My Spaces, default space, space switcher.
- **Problem solved:** One person running a PG **and** a mess, or several properties.

---

## 5. SPACE TYPES

Backend / web / mobile enum **VERIFIED:**

| Code | UI idea | Domain | Accommodation? | Meals in setup | Default new-member role | Inventory default |
|------|---------|--------|----------------|----------------|-------------------------|-------------------|
| `PG` | Paying Guest | Lodging | Yes — floors/rooms/beds | Optional | TENANT | ASSET |
| `MESS` | Mess / Canteen | **Meal-first** | **No — hidden** | **Required** (library, today, share) | **CUSTOMER** (no TENANT) | FOOD |
| `HOSTEL` | Hostel | Lodging | Yes — same layouts as PG | Optional | TENANT | ASSET |
| `CO_LIVING` | Co-living Space | Lodging | Yes — units/rooms/beds | Optional | TENANT | ASSET |
| `RENTAL` | Flats / Rooms | Lodging (units) | Yes — units, **no beds** | **Omitted** | TENANT | FURNITURE |

### Accommodation-based spaces vs meal-first Mess

**Lodging (PG, Hostel, Co-living, Rental)** starts from **place**: a physical layout and people who stay there. Meals, if used, hang off members and (for PG/Hostel/Co-living) optional food-included rent.

**Mess** starts from **food service**: customers + menus + participation + headcount. There is no occupancy map. A mess customer may also be a tenant in a *different* space the same owner runs; that is why customer import exists. Mess is not “PG without rooms.”

`isAccommodationApplicable(spaceType)` is simply `spaceType !== 'MESS'`.

---

## 6. MEAL / HEADCOUNT DOMAIN

This is a first-class product domain, not a side module.

### Concepts **VERIFIED** in code

| Concept | What it is |
|---------|------------|
| **Meal types** | `BREAKFAST`, `LUNCH`, `DINNER` |
| **Meal plans** | `NONE`, `BREAKFAST`, `LUNCH`, `DINNER`, `FULL`, `CUSTOM` — which slots a person is on |
| **Participation** | `ACTIVE` / `PAUSED` / `STOPPED`; enroll / pause / resume / stop |
| **Menu library** | Categories + food items + combos; veg / non-veg / egg; space or global catalog |
| **Daily menu** | Per date; `DRAFT` / `PUBLISHED` / `MODIFIED`; entries COMBO / ITEM / PACKAGE |
| **Extras** | Mess menu-library items marked `isExtra`; priced add-ons on the daily menu |
| **Share** | Generate WhatsApp-**style** text to copy; not inbound WhatsApp |
| **Poll** | Per meal slot; status open/closed; close offsets/times configurable on the space |
| **PG poll** | Single-select option |
| **Mess poll** | Multi-quantity options |
| **Meal availability** | Unpublished / closed poll / item marked not available |
| **Headcount** | `GET .../meals/headcount`; `mealsToPrepare`, `eligibleCount`, option counts, members, no-response, delivery breakdown |
| **Expected meals** | `eligibleCount` — people who should respond / are on a plan |
| **Actual / collected headcount** | `mealsToPrepare` and option `count`s from responses (Mess quantities add up) |
| **Food included** | `foodIncludedInRent`, `defaultFoodCharge` on space / occupancy contract (lodging) |
| **Billing** | `PAY_PER_MEAL` or `PREPAID_BALANCE` (prepaid unit meals or currency) |
| **Serving locations** | Mess = **delivery** locations; PG/Hostel/Co-living = **property** serving; Rental = hidden |
| **Customer meal home** | Tenant/customer views polls, subscriptions, day meal payments |

Web routes include `/spaces/:id/meals`, `meals/library`, `meals/locations`, `meals/participation`, `meals/share`, `meals/poll`, `meals/plans`, `meals/edit`, `/spaces/:id/meal-headcount`, `payments/day-meals`.

Dashboard for Mess includes `todaysHeadcount`, `openPollsCount`, `membersReceivingMeals`, `pollRespondedCount` / `pollEligibleCount`.

### How this works for PG

Meals are **optional**. Typical path: occupancy contract may mark food included in rent; member gets a meal plan; operator publishes a daily menu; residents get a **single-select** poll; operator reads headcount for that house. Kitchen scale is “residents who eat,” not city-wide delivery.

### How this works for Mess

Meals are **the product**. Customers (not tenants) are enrolled; library + extras + quantities matter; poll is **multi-quantity**; delivery locations split headcount; billing is pay-per-meal or prepaid; headcount is the daily operating number.

### User-facing value of meal headcount

**“How many plates do we cook for breakfast, lunch, and dinner today — and of which items — versus how many people we expected?”**

That is what reduces overcooking (wastage) and undercooking (shortage). The website should treat **headcount** as a named product concept, the same way occupancy is named for PG.

**Do not claim:** wastage %, forecast AI, WhatsApp auto-replies, weekly planning (weekly planning is **PLANNED**), special meal requests (**PLANNED**).

---

## 7. OCCUPANCY DOMAIN

### Hierarchy **VERIFIED**

Depends on layout mode:

- **Corridor PG / Hostel:** Building → Floor → Room → Bed
- **Apartment PG / Hostel:** Building → Floor → Unit → Room → Bed
- **Co-living:** Building → Unit → Room → Bed (floors hidden)
- **Rental:** Building → Unit (**beds hidden**)
- **Mess:** **No hierarchy. Occupancy UI is not shown.**

### Lifecycle actions **VERIFIED**

`ALLOCATE`, `RESERVE`, `MOVE_IN`, `TRANSFER`, `VACATE`.

Dashboard lodging ops: `occupiedBeds`, `vacantBeds`, `moveInsThisMonth`. Bed inventory lists vacant / reserved and can allocate, reserve, or move in.

### Where it applies / does not apply

| Applies | Does not apply |
|---------|----------------|
| PG, Hostel, Co-living (beds) | **Mess** |
| Rental (units, no beds) | Meal customers who only eat |
| Owner / manager (write); staff can view | Tenant/customer (they do not browse full bed inventory) |

Do not put a bed map on Mess marketing screens. Do not imply every ACOMI customer has 120 beds.

---

## 8. MEMBERS / CUSTOMERS

People in ACOMI are **memberships on a space**, not a public user directory.

| Term | Meaning |
|------|---------|
| **Owner** | Created the space. Buyer. Full control. |
| **Manager** | Delegated operator. Cannot remove members or deactivate/delete the space. |
| **Tenant** | Accommodation **resident**. Default add-role on PG/Hostel/Co-living/Rental. Not assignable on Mess. Sees stay, meals (if any), own payments, own complaints. |
| **Customer** | **Meal customer**. Default add-role on Mess. Denied accommodation structure. Sees polls, meal payments, complaints. |
| **Staff** | Operational helper. Read-oriented; inventory view; complaint assignee in some flows. |
| **Operational member** | A member **record** created by the owner without that person installing ACOMI. Occupancy, meals, and dues can still be tracked against the record. |

**Accommodation resident vs Mess customer:** a resident is tied to a bed/unit and may also eat. A mess customer is tied to menus and headcount and has no bed in that space. The same human can be a tenant in a PG space and a customer in a Mess space.

---

## 9. PAYMENTS / DUES

**VERIFIED: operational ledger + proof review. NOT a payment gateway.**

ACOMI does **not** collect UPI, cards, or bank transfers. Members pay **outside** the product and upload a **proof** (image + UTR-style reference). Operators **approve, reject, or request an update**.

### What exists today

- Month snapshot: **expected charges**, **collected**, **under review**, **pending** (`DashboardFinancialSummary`)
- Payment types: `MEAL`, `RENT`, `DEPOSIT`, `MAINTENANCE`, `OTHER`
- Methods stored as labels: `UPI`, `BANK_TRANSFER`, `CASH`, `CHEQUE`, `OTHER`
- Statuses: `PENDING`, `PROOF_UPLOADED`, `UNDER_REVIEW`, `PAID`, `REJECTED`, `UPDATE_REQUESTED`
- Human payment IDs (e.g. `PAY-YYYYMMDD-NNNNNN`)
- Meal day payments and prepaid overflow handling
- Member-facing submit proof; operator review queue

### Partial / planned

- **PG rent as a polished first-class flow:** **PARTIAL** (types exist; meal proofs are further along)
- **Deposit as a payment product:** **PLANNED** (deposit fields on member exist)
- **Gateway / UPI collect / autopay / reminders-as-SMS:** **NOT IMPLEMENTED**

Website copy such as “Payments Processed” or “98% On-time Collections” is **not product data**.

---

## 10. COMPLAINTS

**VERIFIED MVP** for keeping issues out of WhatsApp.

- **Who raises:** Owner, manager, tenant, customer (permission-gated).
- **Who manages:** Owner / manager (view all, status, comments). **Assign** exists on **web**.
- **Statuses:** `OPEN` → `IN_PROGRESS` → `RESOLVED` → `CLOSED`, or `CANCELLED`
- **Priority:** `LOW` / `MEDIUM` / `HIGH` / `URGENT`
- **Categories:** `MAINTENANCE`, `HOUSEKEEPING`, `FOOD`, `FOOD_QUALITY`, `FOOD_SERVICE`, `BILLING`, `SAFETY`, `SERVICE`, `OTHER`
- **Attachments / comments / timeline** exist. Food categories can collect extra meal context.

**Use cases:** PG maintenance and housekeeping; Mess food quality/service; billing disputes; safety/service.

**PLANNED:** Notice board. Do not market a community notice board.

---

## 11. INVENTORY

**VERIFIED** module: categories, items, stock (available / reserved / minimum), movements, suppliers, low/out attention.

Profile by space type:

- **Mess → FOOD** (kg, litre, dozen, packet, piece) — kitchen stock next to headcount
- **Rental → FURNITURE**
- **PG / Hostel / Co-living → ASSET**

Web: first-class `/spaces/:id/inventory`. Android: inventory screens exist but are **not** a primary bottom tab (tabs are Dashboard, Members, Accommodation, Meals, Payments, Complaints).

Inventory is real but secondary in marketing. There is **no Play Store screenshot** for it.

---

## 12. MULTI-SPACE OPERATIONS

**Why:** One owner often runs more than one operation — e.g. a PG and a mess for the same residents, or several PGs.

**How ACOMI handles it (VERIFIED):**

- A user can own or join many spaces
- **My Spaces** list, search, default space, switcher
- Permissions and modules are **per space** (a Mess space will not show accommodation)
- Mess can **import customers** from other spaces the operator already manages
- Soft deactivate space; type is immutable

The website should show that one login can run **a PG and a Mess**, not only “scale to 250 properties.”

---

## 13. WEB APP vs ANDROID APP

Same API (`https://api.acomi.in/api/v1`), same space types, same roles, password auth.

### `https://app.acomi.in` (AcomiWeb)

Signed-in operations UI. After login: onboarding / My Spaces / space shell.

Operators can: dashboard, space health, pending actions, notifications, members (add/invite/import/add-customers hub), accommodation + quick setup + occupancy wizard, bed inventory, meals (library, plan, share, poll, participation, plans, editor), **meal headcount**, payments + day-meal payments, complaints (including assign), inventory, profile, complete profile, global attention/activity, privacy, delete account.

Public-without-session pages on the **app** host: `/login`, `/register`, `/privacy`, `/delete-account`.

Auth in the live UI is **password**. OTP routes redirect to register.

### Android app (`com.acomi`)

Same operator/member product: auth, My Spaces, space tabs (Dashboard, Members, Accommodation, Meals, Payments, Complaints), occupancy wizard, meals/polls, payments proofs, complaints, inventory stack screens, invitations, profile, account deletion.

**iOS:** project exists (`com.acomi`). Public store listing **UNKNOWN**. Do not advertise an iOS download.

**Play Store listing live?** **UNKNOWN**. Do not show a fake Play badge or URL.

In-app languages **VERIFIED:** English, Hindi, Marathi, Kannada, Telugu, Tamil. That is product UI language, not a claim of fully QA’d localization.

---

## 14. PUBLIC WEBSITE

Repo: `K:\AcomiPublicWebsite`. Intended host: `https://www.acomi.in`. This is **not** `app.acomi.in`.

There are **two website states**. Do not mix them.

### 14.1 Last committed site (git `8165bf4`)

Commit message: `feat: create ACOMI public website`. Same SHA as `develop` / `origin/develop`.

Homepage sections (committed): Hero → Problems → Modules → Screenshots → Space types → Owner vs member → How it works → Platforms → Trust → Final CTA.

Committed hero: **“Run occupancy, meals, and dues.”** CTAs: Get started → register, Sign in → login. Trust section talks about password sign-in, roles, deletion, privacy — **no fake counters**.

### 14.2 Current working tree (uncommitted redesign — on disk now)

`production` has a large **uncommitted** redesign. Homepage **currently renders**:

1. Hero  
2. TrustMetrics  
3. FeatureGrid  
4. PlatformsSection  
5. StepsSection  
6. ProductShowcase  
7. FinalCta  

`AudienceSection`, `OwnerMemberSection`, and `SecuritySection` **exist as files** but are **not mounted** on the current HomePage.

### Current routes (working tree)

| Path | Page |
|------|------|
| `/` | Home |
| `/features` | Features (occupancy, members, meals, payments, complaints, inventory) |
| `/how-it-works` | Owner steps + member invitation |
| `/who-its-for` | PG, Mess, Hostel, Co-living, Rental |
| `/platforms` | Web + Android |
| `/pricing` | No public price list; “start with one space” |
| `/about` | Short product origin |
| `/404` | Not found |
| `*` | Navigate to `/404` |

### Current navigation

Header: Features, How it works, Who it’s for, Platforms, Pricing, About · **Sign in** → `https://app.acomi.in/login` · **Get started** → `https://app.acomi.in/register`

Footer: same product links · Account (Get started, Sign in) · Legal (Privacy, Delete account on **app.acomi.in**) · `© 2026 ACOMI`

### Current CTA destinations

| Label | Destination | Notes |
|-------|-------------|--------|
| Get started / Get started for free | `https://app.acomi.in/register` | Valid product entry |
| Sign in | `https://app.acomi.in/login` | Valid |
| Open web app | `https://app.acomi.in/` | Valid |
| **Book a demo** | `/how-it-works` | **Misleading** — no demo-booking product |
| Get Android app | `/platforms` | Platforms page has **no Play URL** |
| How it works / Features / Who it’s for | Internal routes | Fine |
| Privacy / Delete account | app.acomi.in | Correct — do not duplicate legal copy here |

### Current SEO / static files

- `index.html` title/description, canonical `https://www.acomi.in/`, OG/Twitter, `og-image.png`, `favicon.png`
- Runtime `applySeo()` updates title/description/canonical/OG per page
- `public/robots.txt` allows all + sitemap
- `public/sitemap.xml` lists `/`, `/features`, `/how-it-works`, `/who-its-for`, `/platforms`, `/pricing`, `/about`
- Font: Plus Jakarta Sans

### Current screenshots / assets

Under `public/`:

- `brand/logo.png`
- `screenshots/`: `dashboard.png`, `spaces.png`, `accommodation.png`, `members.png`, `meals.png`, `payments.png`, `operations.png`
- `favicon.png`, `og-image.png`

These match Play-style phone screenshots (occupancy, members, meals, payments, issues). Inventory has no screenshot. Desktop product UI is represented by **CSS mock previews** (`DashboardPreview`, `HeroDevices`), not real `app.acomi.in` captures.

### Current messaging (working tree)

- Hero H1: **“Run your space. Delight your people.”**
- Hero sub: all-in-one operations for occupancy, meals, dues, complaints
- Hero chip: “For PGs, Hostels, Messes, Co-living & Rentals”
- Feature grid: six generic cards (Occupancy, Members, Meals, Payments, Complaints, Inventory)
- Platforms: “One product. Two platforms.”
- Steps: Create space → Set up rooms/beds/menus → Add members
- Showcase: “Real numbers. Real impact.” + PG bed snapshot
- Final CTA: “Ready to simplify your operations?”

Inner pages (`/features`, `/who-its-for`, `/about`) are still closer to product truth (Mess is meal-first; not a marketplace; not a gateway).

### Current demo data (`src/data/demo.ts`)

Illustrative-only comment exists, but **home TrustMetrics does not treat it that way.**

| Field | Value | Problem |
|-------|--------|---------|
| `spaceName` | Sunrise PG | PG is the only demo space |
| Beds | 120 / 96 occupied / 80% | Lodging-only story |
| Finance | ₹1,28,450 collected / ₹18,320 pending | Fine as fiction if labeled |
| Meals | B 78/86, L 62/86, D 48/86 | Headcount-ish, but secondary to beds |
| Members | Room 204 · Bed A | No mess customer |
| `illustrative` | 250+ spaces, 12,540+ members, ₹4.8 Cr+ processed, 98% on-time | **UNSAFE — invented trust metrics** |

### Currently misleading or incomplete

- “Trusted by 250+ operators across India”
- “Join 250+ operators…”
- “₹4.8 Cr+ Payments Processed” (ACOMI does not process payments)
- “98% On-time Collections”
- “14-day free trial” / “Cancel anytime” (no public subscription product in source)
- “Book a demo” → How it works
- “Get started for free” while no commercial plan is defined
- “Real numbers. Real impact.” above fictional data
- Hero / steps / showcase default to **PG beds**, not a Mess headcount workflow
- `AudienceSection` (the only balanced PG/Mess strip) is unused on Home
- No Play URL, but “Get Android app” looks like a store CTA
- Legal entity, Terms, support email: still **PLACEHOLDER / missing** on the product privacy page — do not invent them here

---

## 15. CURRENT WEBSITE PROBLEMS

Evaluated against the **actual product**, especially the **uncommitted working-tree homepage**. The last **committed** homepage was closer to product truth; the in-progress redesign drifted toward generic SaaS.

### PG vs Mess balance

**Fails on the homepage.** Demo space is Sunrise PG. Steps mock “Type · PG” and “Rooms & beds.” Showcase KPIs are total beds / occupied. Mess is named in a chip and on `/who-its-for`, but a visitor never **sees** customers + menu + headcount as a primary story. Mess looks like a fifth accommodation type.

### Headcount visibility

**Fails.** Headcount is a first-class web route and dashboard concept (`mealsToPrepare / eligibleCount`). The homepage shows a meal **percentage donut**, not “78 breakfast plates to prepare vs 86 expected,” not poll open/closed, not no-response. The word **headcount** is almost absent from home copy (it appears on Features and Who it’s for).

### Meal operations

**Underplayed.** Real workflow is library → plan breakfast/lunch/dinner → share text → poll → headcount → meal dues. Home reduces this to “Plan menu, track participation & headcount” on a generic card. No Mess extras, no delivery locations, no pay-per-meal vs prepaid.

### Product differentiation

**Weakened.** “Delight your people,” “Everything you need, nothing you don’t,” “Trusted by 250+” could be any property SaaS. The committed line **“Run occupancy, meals, and dues”** and “not a listing marketplace” were more accurate. Invitation-only and “not a PG marketplace” still exist on inner pages and one lock line under steps — not in the hero.

### Demo data

**PG-default and, on TrustMetrics, dishonest.** Fictional scale metrics are rendered as social proof. A correct demo would show **two snapshots**: a lodging space (beds + dues) **and** a mess (customers + today’s headcount). File comment says “not ACOMI customer statistics”; TrustMetrics ignores that.

### Screenshots

Phone screenshots on `/features` are real-ish product shots and are useful. Home now prefers **illustrated device chrome** (laptop + phone mocks) with Sunrise PG numbers. No Mess screenshot. Inventory still has no image (Features page admits this).

### Messaging

Lifestyle headline replaces the operational promise. “Payments Processed” contradicts “not a gateway.” “Book a demo” and “14-day free trial” are **not product features**. “Remind dues” on the payments card overstates what exists (ledger + proofs, not an automated reminder product).

### Information hierarchy

Home order: lifestyle hero → fake metrics → six feature cards → platforms → three generic steps → PG snapshot → CTA. Missing from home: Mess as equal market, headcount, owner-vs-invitation, honest trust (password, roles, deletion). Those pieces exist as unused or inner-page content.

### CTA clarity

Primary “Get started” → register is correct. Secondary “Book a demo” is not a demo. Android CTA does not open a store. Pricing page correctly refuses to invent prices, then the same site says “free trial” and “cancel anytime.”

---

## 16. WEBSITE REDESIGN PRINCIPLES

Based **only** on the product above. Do not design screens in this document.

1. **PG and Mess are both first-class markets.** If the hero or demo shows only beds, Mess is mis-sold. If it shows only menus, PG is mis-sold. Prefer dual narrative or an explicit two-sided hero.
2. **Headcount is a visible product concept.** Name it. Show breakfast / lunch / dinner plates to prepare vs expected. That is the Mess (and food-included PG) reason to care.
3. **Show real workflows, not generic feature cards.** Owner: register → create space (type matters) → beds **or** menus → add/invite people → run occupancy **or** headcount + dues + issues.
4. **Use realistic demo data, labeled as illustrative.** A PG example (rooms/beds, tenants, rent proofs) **and** a Mess example (customers, today’s menu, 78/86 breakfast). Never present invented “250+ operators” or “₹4.8 Cr processed” as facts.
5. **Show the relationship between members/customers, meals, and daily operations.** Headcount comes from participation and poll responses, not from bed count.
6. **Do not position ACOMI as a PG-only occupancy system.** Occupancy is for lodging spaces only. Mess has no buildings/rooms/beds.
7. **Sell to owners. Invite members.** Never target “people looking for a PG.”
8. **Do not claim a payment gateway, WhatsApp automation, reports, OTP login, forgot password, iOS/Play listing, free trial, or customer counts** unless they become true in product and are verified.
9. **CTAs should match reality:** Get started → register; Sign in → login; Open web app → app.acomi.in. Do not use “Book a demo” unless a real booking path exists.
10. **Tone:** Direct, Indian operator vocabulary (PG, Mess, dues, occupancy, headcount). Prefer “Run occupancy, meals, and dues” over lifestyle slogans.
11. **Legal honesty:** Link to existing privacy and delete-account pages. Do not invent company name, address, testimonials, or certifications.
12. **Pause UI implementation until this context is agreed.** This file is the brief, not the mock.

---

## 17. CURRENT GIT / DEPLOYMENT SAFETY

Recorded **2026-08-22** from local git. **This documentation pass did not commit, push, deploy, or change AWS/DNS/product branches.**

### Public website repo (`K:\AcomiPublicWebsite`)

| Item | State |
|------|--------|
| **Current local branch** | `production` |
| **HEAD commit** | `8165bf4` — `feat: create ACOMI public website` |
| **`develop` (local)** | Same SHA `8165bf4`, tracks `origin/develop` |
| **`origin/develop`** | `8165bf4` (remote default `HEAD`) |
| **`origin/production`** | **Does not exist.** Production is **local-only**. |
| **Tracking** | `production` has **no upstream** |
| **Working tree** | **Dirty** — large uncommitted redesign (modified pages/components; deleted committed home sections; untracked `src/data/demo.ts`, product mocks, `PricingPage`, etc.) |
| **Anything committed on `production` beyond develop?** | **No.** Local `production` SHA equals `develop`. |
| **Anything pushed from this redesign?** | **No.** Only `origin/develop` exists, at the original commit. Uncommitted work cannot have been pushed. |
| **Anything deployed from this redesign?** | **Not from this repo’s uncommitted tree.** Do not assume `www.acomi.in` serves the working-tree redesign. |

### Other product repos (not modified for this document)

| Repo | Branch observed | Notes |
|------|-----------------|-------|
| AcomiMobile | `develop` @ `d931db0` | Dirty local app work; **do not mix** with website redesign |
| AcomiWeb | `aws-production` | Signed-in app; not this marketing site |
| acomi-backend | `aws-production` | API |

Product `production` branches on Mobile/Web/Backend were **not** checked out or changed for this file.

### Safety constraints (still in force)

- Do not commit or push unless explicitly asked
- Do not deploy the public site
- Do not modify AWS, DNS, CloudFront, S3, or Render
- Do not modify AcomiWeb / AcomiMobile / backend production branches for a website redesign
- Do not merge this local `production` into `develop` automatically

---

## Appendix A — Safe claims vs unsafe claims

**Safe (backed by source):**

- Operations software for PG, Mess, Hostel, Co-living, and Rental owners
- Occupancy (lodging) + members + meals + dues/proofs + complaints + inventory
- Mess is meal-first: customers, menus, participation, headcount — no bed map
- Multi-space; invitation-only; members can be records without the app
- Web app at `app.acomi.in` and Android app `com.acomi`
- Sign-in: Indian mobile + password
- Account deletion at `app.acomi.in/delete-account`

**Unsafe unless separately verified:**

- Customer counts, cities, GMV, collection %
- Free trial, cancel anytime, priced plans
- Book a demo (no product)
- Payment processing / UPI collect
- WhatsApp automation
- Reports / wastage analytics
- Live on Play / App Store
- OTP login, forgot password
- Legal company name and address

## Appendix B — Code pointers (for implementers)

| Topic | Where |
|-------|--------|
| Space types | Backend `SpaceType.java`; web `shared/types/space.ts` |
| Mess hides accommodation | `isAccommodationApplicable` in `spacePermissions.ts` |
| Setup milestones | `spaceLifecycle/profiles.ts` |
| Layout modes | `accommodationProfile.ts` |
| Roles per type | `memberRoles.ts` |
| Meals / headcount types | `shared/types/meals.ts`; `MealHeadcountPage.tsx` |
| Mess dashboard ops | `DashboardMessOperations` in `dashboard.ts` |
| Payments | `shared/types/payments.ts` |
| Complaints | `shared/types/complaints.ts` |
| Inventory profile | `inventoryHelpers.ts` |
| Web routes | AcomiWeb `src/app/router/routes.tsx` |
| Marketing routes | AcomiPublicWebsite `src/App.tsx` |
| Marketing demo | AcomiPublicWebsite `src/data/demo.ts` |
| Deeper W1 notes | `docs/public-website-product-context.md` |
