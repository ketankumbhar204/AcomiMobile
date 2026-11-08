# Move In / Allocate — Current Flow Audit (Android)

**Date:** 2026-11-05
**Scope:** Read-only inspection of the Android (React Native) **Move In / Allocate** journey starting from **Vacant beds**.
**Constraint:** No code, UI, navigation, API, test, or business-logic changes in this pass.

**Primary path audited:** PG-style bed inventory (`DashboardBedInventory` → bed → `OccupancyWizard` `mode: 'ALLOCATE'`).
Unit-level spaces (Rental / Corporate Stay) use a parallel vacant-units list; step sequence inside the wizard is the same once a target is known.

**Two dashboard entries into vacant inventory:**
| Entry | Route params | Allocate on bed card? |
|-------|--------------|------------------------|
| Vacant beds metric | `status: 'AVAILABLE'`, `focus: 'vacant'` (no `intent`) | **No** — tap bed → `BedDetail` → Allocate |
| Quick action “Move In” | `status: 'AVAILABLE'`, `intent: 'allocate'` (`DashboardScreen` ~614–619) | **Yes** — section footer **Allocate** opens wizard directly |

---

## Exact numbered flow sequence (Vacant bed → Allocate)

### A. From Vacant beds metric (no `intent`)

1. **Dashboard** → vacant-beds metric → `DashboardBedInventory` (`status: 'AVAILABLE'`, `focus: 'vacant'`).
2. **Vacant beds** screen — browse filters / search / room groups / bed cards.
3. **Tap a vacant bed card** → `BedDetail` (no Allocate footer on the list card).
4. **Bed detail** → occupancy action **Allocate** / allocate tile (`AccommodationOccupancyActions` → `startWalkIn`) → `OccupancyWizard` with `mode: 'ALLOCATE'` and `bedId` (plus room/unit/building ids when present).
5. **Wizard Step 1 — Choose stay type** (`stay_type`).
6. **Wizard Step 2 — Select member** (`member`) — existing resident or create new.
7. **Wizard Step 3 — Enter stay details** (`stay_details`) — move-in date + stay-type-specific dates.
8. **Wizard Step 4 — Contract terms** (`contract`) — rent / agreed total / daily rent, deposit, food, amenities.
9. **Wizard Step 5 — Review & confirm** (`review`) → primary **Allocate**.
10. **Success modal** (`AllocationSuccessModal`) → View member details or Done (returns to previous screen).

### B. From Quick action “Move In” (`intent: 'allocate'`)

1. Dashboard quick action → vacant inventory with `intent: 'allocate'`.
2. Available bed footer **Allocate** (or press available bed) → wizard with preselected `bedId` (skips Bed Detail).
3. Same wizard steps 5–10 as above.

**Conditional wizard steps (ALLOCATE):**

| Step | Shown when |
|------|------------|
| `target` | No concrete target yet (no `bedId` / allowed `roomId` for CO_LIVING / `unitId`). **Skipped** when Vacant beds / Bed Detail already passed `bedId`. |
| `stay_type` | Always for ALLOCATE when space is an accommodation stay type (not MESS). |
| `member` | Always unless `memberId` was pre-supplied in route params. |
| `stay_details` | Always for ALLOCATE. |
| `contract` | Always for ALLOCATE. |
| `review` | Always for ALLOCATE. |

Step order helper: `getWizardSteps` in `src/features/occupancy/OccupancyWizard/occupancyWizardSteps.ts`.
With a preselected bed (Vacant beds path):
`['stay_type', 'member', 'stay_details', 'contract', 'review']` → **Step X of 5**.

---

## 1. Entry — Vacant beds screen

### Route / title
- Screen: `DashboardBedInventoryScreen`
  `src/screens/dashboard/DashboardBedInventoryScreen.tsx`
- Params: `spaceId`, `status: 'AVAILABLE' | 'OCCUPIED'`, optional `focus`, optional `intent: 'allocate' | 'reserve'`
- Title (vacant): `dashboard.drilldown.vacantBedsTitle` → **"Vacant beds"**
- Opened from dashboard: `handleVacantBedsPress` → `DashboardBedInventory` with `status: 'AVAILABLE'`, `focus: 'vacant'`
  (`src/screens/dashboard/DashboardScreen.tsx`)

### Occupied / vacant counts
- Header accessory: `DashboardAccommodationOperations`
  (`src/components/dashboard/DashboardAccommodationOperations.tsx`)
- Shows metric cards: Occupied beds, Vacant beds, Move-ins (values from space dashboard `accommodationOperations`).
- Selecting a metric updates route `status` / `focus` via `switchFocus` (does not leave the inventory screen).

### Filters / search / list
- Browser: `BedInventoryBrowser`
  (`src/components/dashboard/BedInventoryBrowser.tsx`)
- Data: `useSpaceBedSearch` with `status` (AVAILABLE for vacant), optional building/floor/unit filters, search query, `loadAll: true`.
- UI: `DashboardBedInventoryFiltersBar` + dropdown overlay; beds grouped by room/unit (`groupBedsForInventoryBrowse`).
- Room section: `DashboardBedRoomSectionCard` → `BuildingInventoryRoomSection` + horizontal bed carousel (`BuildingInventoryBedCard`).
- Empty copy: `dashboard.drilldown.emptyVacantBeds` / filtered empty via `list.emptyFiltered`.
- Subtitle key exists (`vacantBedsSubtitle`: “Available beds you can allocate or reserve”) but Vacant beds screen sets `showSubtitle={false}`.

### Bed card contents (Vacant beds)
- Label, reference code, status badge (`AVAILABLE`).
- **Dashboard vacant path:** card press → `BedDetail`. Footer Allocate/Reserve from `onAllocate`/`onReserve` are **not** rendered: `DashboardBedRoomSectionCard` intentionally ignores `onAllocate` / `onReserve` (`_onAllocate` / `_onReserve`).
- **`intent: 'allocate'` path:** footer button label from `occupancy.actions.allocate` (**Allocate**); press → `handleAllocateBed` → wizard.

### Permissions
- Allocate / wizard open requires `canManageOccupancy`.
- Bed must pass `bedIsSelectableForMoveIn(bed.status)` (AVAILABLE).

### What happens on Allocate (after Bed Detail or intent footer)
```ts
navigation.navigate('OccupancyWizard', {
  spaceId, mode: 'ALLOCATE' | 'RESERVE',
  bedId, roomId, unitId?, buildingId,
});
```
(`handleAllocateBed` / `useAccommodationOccupancyFlow.startWalkIn` → `openOccupancyWizardFromRef`)

From Bed Detail, button label for allocate is **`occupancy.actions.allocate` → "Allocate"** (stack layout), with quick-action tile title default **"Allocate Bed"**. Wizard screen title becomes **"Move In today"** (`occupancyWizard.title.allocate`).

---

## 2–3. Wizard screens (ALLOCATE with preselected bed)

Shared chrome: `OccupancyWizardScreen`
`src/features/occupancy/OccupancyWizard/OccupancyWizardScreen.tsx`

- Nav title: **Move In today**
- Progress: `OccupancyWizardStepHeader` — “Step {{current}} of {{total}}” + step title + hierarchy breadcrumb (building / floor / unit / room / bed) when target resolved.
- Footer: `StickyFormActions` — primary **Continue** (or **Allocate** on review); secondary **Back**.
- Header back uses same `goBack` (previous step, or leave wizard on first step).

Bootstrap (on mount with `bedId`):
- Loads food policy + space amenities (`fetchSpaceOccupancyContext`).
- Prefills target + catalog `defaultRent` / `defaultDeposit` (`fetchPrefilledAllocationTarget`).
- Seeds contract form via `emptyContractTermsFormValues` (rent/deposit from catalog; `foodEnabled` defaults **true**).

---

### Step 1 — Choose stay type (`stay_type`)

| Item | Detail |
|------|--------|
| Title | `occupancyWizard.steps.stayType` → **Choose stay type** |
| Component | `ShortStayChoice` `section="type"` |
| Controls | Chips: **Monthly**, **Short stay**, **Until I leave** (`MONTHLY` / `SHORT` / `OPEN_ENDED`) |
| Default | `MONTHLY` |
| Mandatory | A choice is always selected (defaults to Monthly); Continue always allowed |
| Hints | Until I leave selected shows banner: daily rent, not monthly catalog rent |
| Continue | Advances to member |
| Back | Exits wizard (step index 0) |
| API | None |

Stay-type change (`handleStayChoiceChange`):
- Runs `pricingDefaultsForStayChoice`:
  - **MONTHLY:** prefill `rentSnapshot` from catalog rent (if &gt; 0); keep/set deposit from catalog; clear agreed total; do **not** clear expected exit.
  - **SHORT / OPEN_ENDED:** clear rent snapshot and agreed total; deposit from catalog (or `"0"`); **clear expected exit date**.
- Does **not** invent daily rent from monthly÷30.

---

### Step 2 — Select member (`member`)

| Item | Detail |
|------|--------|
| Title | **Select member** |
| Component | `MemberPickerStep` |
| Modes | **Select Existing Resident** (search) / **Create New Resident** |
| Existing | Search by name/mobile; list of reusable residents; status e.g. available for move-in |
| New | Name + mobile; field errors via `validateNewMemberFields` |
| Mandatory | Member must be selected (or created) |
| Continue | Shown for **Create New**; **hidden** for search mode — selecting a row **auto-advances** (`autoAdvanceStep`) |
| Validation | `occupancyWizard.errors.memberRequired` if Continue pressed without member in new mode path; create errors via membership helpers |
| API | Search via `useResidentImportSearch` / member search hooks; create via `memberApi` when adding new |
| Context banner | After selection, later steps show “Tenant {name} · {mobile}” |

---

### Step 3 — Enter stay details (`stay_details`)

| Item | Detail |
|------|--------|
| Title | **Enter stay details** |
| Always | `DateField` **Move-in date** — default **today** (`formatTodayIsoDate`), `allowPastDates` |
| Stay-specific | `ShortStayChoice` `section="details"` |

**By stay type:**

| Stay type | Extra fields | Notes |
|-----------|--------------|-------|
| Monthly | Optional **Expected move-out** | Banner: monthly recurring billing until vacate |
| Short stay | **Checkout date (required)**; nights banner (`shortStayNightCount`) | Copy: one fixed agreed total for entire stay |
| Until I leave | No checkout field required | Banner: no fixed checkout; daily rent until vacate |

**Continue validation:**
- Move-in required → `occupancy.errors.moveInDateRequired`
- Short stay → checkout required (else expected-move-out / checkout message)

**API:** None on this step.

---

### Step 4 — Contract terms (`contract`)

| Item | Detail |
|------|--------|
| Title | **Contract terms** |
| Components | `ContractTermsStep` → `ContractTermsForm`; Short stay also mounts `ShortStayChoice` `section="contract"` for **Agreed total** |

**Fields (ALLOCATE):**

| Field | Monthly | Short stay | Until I leave |
|-------|---------|------------|---------------|
| Monthly rent | Required; catalog prefill | Hidden (`hideMonthlyRent`) | Hidden as monthly; **Daily rent (required)** (`dailyRentMode`) |
| Agreed total | N/A | Required (&gt; 0) | N/A |
| Security deposit | Optional; catalog default or `0` | Same | Same |
| Include food charges | Toggle (`showFoodToggle` if meals applicable; **off for RENTAL**) | Same | Same; bundled hint says food in daily rent — no separate daily food line |
| Food charge amount | When separate food policy | Bundled into agreed total messaging when enabled | Bundled messaging for daily |
| Amenities | Checkboxes from space catalog (e.g. WiFi, Food) when space supports amenities | Same | Same |
| Agreement signed / early move-in | Present on contract step for ALLOCATE when applicable in `ContractTermsStep` | Same | Same |

**Continue validation:**
- Short: agreed total parseable / non-null
- Else: `validateContractTerms` (rent required for non-short; food charge rules; charge limits)

**API:** None until confirm.

---

### Step 5 — Review & confirm (`review`)

| Item | Detail |
|------|--------|
| Title | **Review & confirm** |
| Component | `ReviewStep` |
| Primary button | **`occupancy.actions.allocate` → "Allocate"** |
| Back | Returns to contract (state retained) |

**Displayed blocks (ALLOCATE):**
- Accommodation hierarchy (breadcrumb)
- Stay / contract summary (stay type; rent or agreed total or daily rent; deposit; food yes/no; amenities if in contract values)
- Move-in / expected exit when set
- Member name + mobile
- Payment summary (stay-dependent — see §4)

Edit pencils exist on some section headers (`onEdit*`) but **ALLOCATE path does not pass** `onEditAccommodation` / `onEditContract` / `onEditMember` from `OccupancyWizardScreen` — edit affordances are effectively inactive on this path.

---

## 4. Stay-type behaviour comparison

| Topic | Monthly | Short stay | Until I leave |
|-------|---------|------------|---------------|
| Stay kind persisted | `MONTHLY` | `SHORT` | `OPEN_ENDED` |
| Pricing basis (backend) | null (monthly snapshot) | `FIXED_TOTAL` | `DAILY_RATE` |
| Dates | Move-in required; expected exit optional | Move-in + checkout required; checkout &gt; check-in; same calendar month (client `applyStayChoice`) | Move-in required; checkout optional / cleared on switch |
| Money input | Monthly rent ₹/month | Agreed total (not monthly rent) | Daily rent ₹/day (owner-entered; not monthly÷30) |
| Catalog default rent | Prefills monthly rent | Not applied to agreed total | Not prefilled into daily rent |
| Deposit | Catalog / editable / 0 | Same | Same |
| Food | Monthly include/exclude per space policy | Include toggle; no separate short-stay food price invented | Include toggle; no daily food charge invented |
| Review payment UI | `PaymentSummaryCard`: rent(+food) + deposit = **total this month** | Contract lines for agreed total + deposit (**no** dedicated `PaymentSummaryCard` total row in current `ReviewStep`) | Daily rent line + one-time deposit + billing note (daily accumulates to one monthly rent charge); **no** “total to pay now” sum row in code |
| Client submit | `rentSnapshot` + deposit + food… | Clears `rentSnapshot`; sends `agreedTotal` + exit dates | Sends daily amount in `rentSnapshot` + `stayKind` OPEN_ENDED |

Client helpers: `src/utils/shortStay.ts`, `src/utils/occupancyContract.ts`, `src/features/occupancy/OccupancyWizard/useOccupancyWizardSubmit.ts`.

---

## 5. Final confirmation — Allocate tap

### Client sequence
1. Re-validate contract (unless Short stay skips monthly rent check).
2. Ensure target still selectable (`fetchPrefilledAllocationTarget` / selectable check).
3. `buildAllocateRequest` + `applyStayChoice` + optional `createMealParticipation`.
4. `useOccupancyMutations.allocate` → `occupancyApi.allocate`.

### API
- **POST** `/spaces/{spaceId}/occupancies`
  (`src/api/occupancyApi.ts`)
- Body includes: `memberId`, `targetType`/`bedId`/`roomId`/`unitId`, `moveInDate`, planned end fields when set, contract snapshots, `stayKind`, `agreedTotal` (short), amenities, optional `createMealParticipation`.

### Persisted backend behaviour (from prior / service code traceability — not re-executed here)
- Creates **ACTIVE** occupancy; contract snapshot locked.
- Calls payment generation on activation:
  - Monthly / daily-rate open-ended: rent (+ deposit if &gt; 0)
  - Short: EXTRA rent = agreed total (+ deposit if &gt; 0)
- **NOT VERIFIED in this audit run:** live DB rows, exact payment IDs, or network payloads from a device session.

### Success UI
- `AllocationSuccessModal` — operation ALLOCATE; member name; location label.
- View details → `MemberDetails`; Done → `navigation.goBack()`.

---

## 6. Navigation and state retention

| Action | Behaviour |
|--------|-----------|
| Selected bed | Held in route params + `targetSelection` after prefills; hierarchy banner uses it across steps |
| Selected member | React state `member`; shown in context banner after step 2 |
| Stay type change | Resets incompatible pricing via `pricingDefaultsForStayChoice`; may clear expected exit |
| Back within wizard | Decrements `stepIndex`; **does not** clear member/dates/contract (except as above when stay type changes) |
| Back on step 1 | Leaves wizard (`navigation.goBack`) |
| Edit earlier step via review pencils | **Not wired** on ALLOCATE (`onEdit*` undefined) — user must use Back |
| Re-open Allocate after success | Fresh wizard instance; prior form state not preserved |

---

## Validation & calculation rules (client)

| Rule | Where |
|------|--------|
| Move-in required | `stay_details` / submit |
| Short checkout required, after check-in, not cross-month | `applyStayChoice` + step Continue |
| Monthly/daily rent required (non-short) | `validateContractTerms` / `rejectInvalidContract` |
| Agreed total &gt; 0 for short | `applyStayChoice` / Continue on contract |
| Food charge required when separate food enabled | `validateContractTerms` |
| Max other charges | `MAX_OTHER_CHARGES` (10) |
| Monthly pay-now total | `computeMoveInTotalToPayThisMonth` = monthly rent(+food) + deposit |
| Short night count | Half-open `[checkIn, checkout)` via `shortStayNightCount` |
| API errors | `getOccupancyErrorMessage` → toast / form banner |

---

## API / backend traceability (ALLOCATE)

| Layer | Path |
|-------|------|
| UI submit | `useOccupancyWizardSubmit` → `allocate(stayedBody)` |
| Mutations | `src/hooks/useOccupancyMutations.ts` |
| HTTP | `POST /spaces/{spaceId}/occupancies` |
| Server (reference) | `OccupancyService.allocate` → contract snapshot → `createActivationPayments` |

Reserve / Transfer are out of this document’s primary sequence but share the same wizard shell.

---

## Existing UX issues / inconsistencies (observed in code)

1. **Vacant beds cards do not show Allocate/Reserve** on the metric/`focus: vacant` path; Allocate is on **Bed Detail**. The quick-action path with `intent: 'allocate'` shows a single **Allocate** footer via room/unit section cards.
2. **`DashboardBedInventoryBedRow` is unused in the live list:** dual Allocate/Reserve UI exists on that component, but production grouping uses `DashboardBedRoomSectionCard` / `DashboardBedUnitSectionCard`, which discard `onAllocate`/`onReserve` (`_onAllocate` / `_onReserve`). Call sites import the row’s `BedInventoryFlowAction` type only.
3. **Naming mix:** dashboard quick action **“Move In”** (`dashboard.quickActions.allocate`) vs wizard title **“Move In today”** vs sticky CTA **“Allocate”** vs bed tile **“Allocate Bed”**.
4. **Short stay review** shows agreed total + deposit lines but **no** `PaymentSummaryCard` “total to pay now” row (Monthly has that card; device screenshots that show a Short-stay grand total may differ from current `ReviewStep` code). Payment figures on review are **display-only**; authoritative dues come from payment APIs after allocate.
5. **Until I leave review** shows deposit + daily billing note; **no** explicit “Total to pay now” sum in code.
6. **Review Edit** pencils are rendered by `ReviewStep` but ALLOCATE does not pass `onEdit*` handlers.
7. **`remarks` state** is submitted on ALLOCATE but there is **no ALLOCATE form field** to edit remarks (unlike RESERVE/VACATE).
8. **Duplicate titles / hints:** `OccupancyWizardStepHeader` plus in-step titles on contract/review; Until I leave banners can appear in both stay_type and stay_details sections of `ShortStayChoice`.
9. **Food default ON** in `emptyContractTermsFormValues` — whether that matches every space policy **NOT VERIFIED**.
10. **Catalog daily rent:** OPEN_ENDED never prefills from monthly catalog (`pricingDefaultsForStayChoice`). Screenshots claiming “Catalog default: ₹X/day” are **NOT VERIFIED**.
11. **Shared wizard still contains a MOVE_IN bootstrap `#region agent log`** in `OccupancyWizardScreen` (debug instrumentation; not ALLOCATE-specific).

---

## Code map (supporting files)

| Area | Files |
|------|--------|
| Vacant beds screen | `src/screens/dashboard/DashboardBedInventoryScreen.tsx` |
| Inventory browser / filters | `src/components/dashboard/BedInventoryBrowser.tsx`, `DashboardBedInventoryFiltersBar.tsx`, `DashboardBedRoomSectionCard.tsx` |
| Bed detail allocate | `src/screens/accommodation/BedDetailScreen.tsx`, `src/components/occupancy/AccommodationOccupancyActions.tsx`, `src/hooks/useAccommodationOccupancyFlow.ts` |
| Wizard shell / steps | `src/features/occupancy/OccupancyWizard/OccupancyWizardScreen.tsx`, `occupancyWizardSteps.ts`, `ShortStayChoice.tsx`, `steps/*` |
| Contract / review math | `src/utils/occupancyContract.ts`, `src/components/occupancy/ContractTermsForm.tsx`, `steps/ReviewStep.tsx` |
| Stay choice / defaults | `src/utils/shortStay.ts`, `src/utils/accommodationStaySupport.ts` |
| Submit / API | `useOccupancyWizardSubmit.ts`, `src/utils/occupancyRules.ts`, `src/api/occupancyApi.ts` |
| Success | `src/components/occupancy/AllocationSuccessModal.tsx` |
| Copy | `src/i18n/locales/en.json` (`occupancyWizard.*`, `occupancy.actions.*`, `dashboard.drilldown.*`) |

---

## Explicit NOT VERIFIED

- Live device/browser walkthrough of Vacant beds → Allocate for this audit date.
- Exact dashboard KPI numbers / filter chip labels vs design comps.
- Network capture of allocate payload and resulting `space_payments` rows.
- Whether any unreleased UI branch shows Allocate on Vacant beds cards without `intent=allocate`.
- Visual match of every screenshot pixel (esp. Short/Until I leave “Total to pay now” rows) to the current `ReviewStep` implementation.

---

*End of audit. No redesign recommendations applied; document is for subsequent redesign planning without changing the established ALLOCATE step order.*
