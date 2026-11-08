# Move In / Allocate — Screen-by-Screen Visual Specification (Android)

**Date:** 2026-11-05
**Source of truth:** Current frontend implementation + `MOVE_IN_ALLOCATE_CURRENT_FLOW_AUDIT.md`
**Purpose:** Concise visual reference for generating UI images of each screen.
**Rules:** No redesign. Vacant beds and Bed Detail remain as implemented. Unconfirmed items marked **NOT VERIFIED**.

**Primary path for wizard images:** Vacant beds metric → Bed Detail → Allocate → wizard with preselected bed (5 steps).
**Alternate entry:** Dashboard quick action “Move In” (`intent: 'allocate'`) → vacant list with Allocate footer → same wizard.

---

## Shared wizard chrome (screens 3–7)

**Screen:** `OccupancyWizardScreen`
`src/features/occupancy/OccupancyWizard/OccupancyWizardScreen.tsx`

| Element | Spec |
|---------|------|
| Nav title | **Move In today** (`occupancyWizard.title.allocate`) |
| Header left | Custom back → same as footer Back |
| Top hero | Soft decorative blobs; small mode icon; large heading repeats **Move In today** |
| After member selected | Context strip: label **Tenant** + `{fullName} · {mobile}` |
| Step header | `OccupancyWizardStepHeader`: caption **Step N of 5**; green progress bar; hierarchy card; step icon + step title |
| Hierarchy card | Label/value rows when present: Space, Type, Building, Floor, Unit, Room, Bed (`HierarchyBreadcrumbCard`) |
| Body | Scrollable form content |
| Footer | `StickyFormActions`: primary **Continue** (review: **Allocate**); secondary **Back** |
| Errors | Red/error banner text above footer when `formError` set |

Progress titles: Choose stay type → Select member → Enter stay details → Contract terms → Review & confirm.

---

## 1. Vacant beds screen

**Do not change for redesign of wizard.**

| Item | Spec |
|------|------|
| Files | `DashboardBedInventoryScreen.tsx`, `BedInventoryBrowser.tsx`, `DashboardAccommodationOperations.tsx`, `DashboardBedRoomSectionCard.tsx`, `BuildingInventoryRoomSection.tsx`, `BuildingInventoryBedCard.tsx` |
| Nav title | **Vacant beds** |
| Top metric cards | Occupied beds / Vacant beds / Move-ins (counts from dashboard ops); Vacant selected |
| Filters | Building / Floor / Unit dropdown triggers (`DashboardBedInventoryFiltersBar`) — exact level set depends on space type profile |
| Search | Search field; placeholder from `dashboard.drilldown.searchBeds` |
| Summary card | Optional “showing available beds” style summary when `showSummary` true (**NOT VERIFIED** exact string on vacant path vs browser defaults) |
| List | Room (or unit) section cards: path title (building · floor · room…), availability pill, horizontal bed carousel |
| Bed card | Bed illustration; bed label; status pill (**Available**); catalog **Rent / Deposit** stack via `BedPricingDisplay`; optional edit chevron if can manage structure |
| Allocate on card (metric path) | **Not shown** |
| Allocate on card (`intent: 'allocate'`) | Primary button **Allocate** under card |
| Tap bed (metric path) | → Bed Detail |
| Empty | Empty vacant / filtered empty copy |

**Stay types:** N/A.

---

## 2. Bed Detail screen

**Do not change for redesign of wizard.**

| Item | Spec |
|------|------|
| Files | `BedDetailScreen.tsx`, `BedPricingDisplay`, `AccommodationOccupancyActions` (stack layout) |
| Content | Bed name/number, reference code, status, room/unit/floor/building rows, property overview section |
| Pricing card | Default rent + deposit for the bed |
| Occupancy actions (AVAILABLE) | Section title from `occupancy.accommodationActions.title`; primary button **Allocate** (UserPlus); secondary **Reserve** |
| Tile layout (if used elsewhere) | Title **Allocate Bed** + hint **Assign a member to this bed** — Bed Detail uses **stack** buttons, not tiles |
| Tap Allocate | Opens wizard `mode: 'ALLOCATE'` with bed/room/unit/building ids; nav title becomes Move In today |

**Stay types:** N/A.

---

## 3. Choose stay type (Step 1 of 5)

| Item | Spec |
|------|------|
| Files | `OccupancyWizardScreen` + `ShortStayChoice` `section="type"` |
| Step title | **Choose stay type** |
| Hierarchy | Preselected bed path (Space, Type, Building, Floor, Unit, Room, Bed) |
| Controls | Three **chips** in a wrapping row (not radio list with subtitles): **Monthly** \| **Short stay** \| **Until I leave** |
| Default | **Monthly** selected (primary fill, white label) |
| Monthly selected | No extra banner in type section |
| Short stay selected | No extra banner in type section |
| Until I leave selected | Banner: *Stay without a fixed checkout date. Uses daily rent, not monthly catalog rent.* |
| Fields | None beyond chips |
| Continue | Always enabled → member |
| Back | Leaves wizard |
| Stay-type change | Resets pricing defaults (`pricingDefaultsForStayChoice`); SHORT/OPEN_ENDED clear expected exit |

**Note:** Chip UI has **no per-option subtitle** under Monthly/Short in code (unlike some screenshots). Do not invent subtitles for image generation unless copying unverified mockups.

---

## 4. Select member (Step 2 of 5)

| Item | Spec |
|------|------|
| Files | `MemberPickerStep.tsx` |
| Step title | **Select member** (header; in-step title often hidden via `hideTitle`) |
| Mode tabs | **Select Existing Resident** \| **Create New Resident** |
| Existing | Search placeholder **Search by name or mobile**; resident cards: name, mobile, availability/status lines; selected card shows check treatment |
| Create new | Full name + mobile inputs; hint that tenant is created on continue; field-level errors on invalid name/mobile |
| Primary | Search mode: **Continue hidden** — selecting a resident **auto-advances**; Create mode: **Continue** creates then advances |
| Back | → stay type (selection retained) |
| Validation | Continue without member (create path): `occupancyWizard.errors.memberRequired`; create field errors via `validateNewMemberFields` |

**Stay types:** Same UI for all three.

---

## 5. Stay details (Step 3 of 5)

| Item | Spec |
|------|------|
| Files | `DateField` + `ShortStayChoice` `section="details"` `showCheckout` |
| Step title | **Enter stay details** |
| Always | **Move-in date** date field — default today; past dates allowed |

### By stay type

| | Monthly | Short stay | Until I leave |
|--|---------|------------|---------------|
| Extra | Optional **Expected move-out** date field | **Checkout** date field; if both dates set: **Stay duration: N nights** | Banner: *Until I leave: no fixed checkout date. Daily rent is billed until the resident vacates.* |
| Checkout required | No | Yes to Continue | No |

| Action | Behaviour |
|--------|-----------|
| Continue | Requires move-in; Short requires checkout text; then → contract |
| Back | → member; dates retained |
| Errors | Move-in: choose move-in date; Short missing checkout: expected-move-out / checkout required message |

**Pricing:** None on this step (agreed total is on contract for Short).

---

## 6. Contract terms (Step 4 of 5)

| Item | Spec |
|------|------|
| Files | `ContractTermsStep.tsx`, `ContractTermsForm.tsx`, `OccupancyAmenitiesSection.tsx`; Short also `ShortStayChoice` `section="contract"` |
| In-step title | **Contract terms** (in addition to step header) |
| Form title/hint | Contract title + hint (“agreed monthly rent…” style copy from `occupancy.contract.*`) |

### By stay type

| Element | Monthly | Short stay | Until I leave |
|---------|---------|------------|---------------|
| Agreed total | — | **Agreed total** input + help: one fixed total for the stay | — |
| Rent | **Monthly rent (required)**; placeholder Enter amount; hint **Catalog default: ₹{n}** if catalog rent known | Hidden | **Daily rent (required)**; hint *Owner-entered ₹/day. Not derived from monthly catalog rent.* |
| Deposit | **Deposit (optional)**; catalog deposit hint or “Defaults to 0 if left empty” | Same | Same |
| Food | Toggle **Include food charges** (hidden for Rental); on → bundled monthly food hint; off → turn-off hint; separate food amount only if space food policy has separate charge | Same toggle; short bundled food hint when on | Same toggle; daily bundled food hint when on |
| Monthly total preview | Shown when computable (rent ± food) | Not for monthly rent path | Not monthly total |
| Other charges | Add charge list (code/label/amount), max 10 | Same | Same |
| Amenities | Section **Amenities** + checkboxes from space catalog when configured | Same | Same |

ALLOCATE does **not** show MOVE_IN-only switches (early move-in / agreement signed) or TRANSFER rent policy.

| Action | Behaviour |
|--------|-----------|
| Continue | Short: agreed total required; else `validateContractTerms` (rent required, deposit/food/charge validity) |
| Back | → stay details; values retained |
| Field errors | `rentError` on rent; form banner for toast-style validation keys (rent required, deposit invalid, food charge invalid, too many charges, charge label/amount) |

**Defaults:** Catalog rent/deposit prefilled for Monthly; Short/OPEN_ENDED clear rent on stay-type switch; `foodEnabled` defaults **true** in empty form.

---

## 7. Review and Allocate (Step 5 of 5)

| Item | Spec |
|------|------|
| Files | `ReviewStep.tsx` |
| Step title | **Review & confirm** |
| Primary CTA | **Allocate** |
| Accommodation card | Hierarchy breadcrumb; Edit control present in UI but **not wired** on ALLOCATE |
| Member card | Name + mobile; Edit not wired |

### By stay type (contract + payment)

| Block | Monthly | Short stay | Until I leave |
|-------|---------|------------|---------------|
| Stay type line | Monthly | *(shown via agreed-total contract card; stay kind implied)* | Until I leave |
| Money lines | Monthly rent; Deposit; Food yes/no; optional monthly total | Agreed total; Deposit; Food yes/no | Daily rent as `₹… / day`; Deposit; Food yes/no |
| Payment summary | Card: rent(+food) + security deposit + **total this month** | **No** `PaymentSummaryCard` — only contract lines | Daily rent + optional one-time deposit + note that daily rent accumulates into one monthly rent charge |
| Dates | Move-in; expected exit if set | Move-in; checkout if set | Move-in; exit if set |

| Action | Behaviour |
|--------|-----------|
| Allocate | Re-validates (non-short); refreshes bed selectable; `POST /spaces/{spaceId}/occupancies`; success modal |
| Back | → contract; state retained |
| Errors | Banner / toast via `getOccupancyErrorMessage`; may jump back to contract for rent errors |

**Success modal** (after Allocate): `AllocationSuccessModal` — member name, location label; **View details** / **Done**.

---

## Continue / Back / stay-type change (wizard summary)

| Control | Behaviour |
|---------|-----------|
| Continue | Validates current step only; advances `stepIndex` |
| Back (footer or header) | Previous step; step 1 exits wizard |
| Stay-type change (any step exposing chips) | Clears incompatible rent/agreed; resets deposit from catalog; SHORT/OPEN_ENDED clears expected exit |

---

## Validation message keys (for image callouts)

| Situation | Typical copy source |
|-----------|---------------------|
| No member | `occupancyWizard.errors.memberRequired` |
| No move-in | Choose a move-in date |
| Short no checkout / no agreed total | Checkout / Agreed total required |
| Short same-day / cross-month | Client messages from `applyStayChoice` error keys |
| Monthly/daily rent missing | Monthly rent is required when activating / rent required |
| Deposit / food / charges invalid | `occupancy.contract.errors.*` |
| Target unavailable on submit | Target unavailable / occupancy error mapping |

Exact rendered English for every key: prefer `en.json`; where only `defaultValue` exists in code, use that string.

---

## Component / file index

| Screen | Primary files |
|--------|----------------|
| 1 Vacant beds | `DashboardBedInventoryScreen.tsx`, `BedInventoryBrowser.tsx`, `DashboardAccommodationOperations.tsx`, `BuildingInventoryBedCard.tsx` |
| 2 Bed Detail | `BedDetailScreen.tsx`, `AccommodationOccupancyActions.tsx` |
| 3–7 Wizard | `OccupancyWizardScreen.tsx`, `occupancyWizardSteps.ts`, `OccupancyWizardStepHeader.tsx`, `ShortStayChoice.tsx`, `MemberPickerStep.tsx`, `ContractTermsStep.tsx`, `ContractTermsForm.tsx`, `ReviewStep.tsx`, `StickyFormActions` |
| Copy | `src/i18n/locales/en.json` (`occupancyWizard.*`, `occupancy.actions.*`, `occupancy.contract.*`, `dashboard.drilldown.*`) |

---

## NOT VERIFIED (do not invent in reference images)

- Exact filter trigger labels per space type beyond “Building / Floor / Unit” pattern.
- Pixel-perfect spacing vs device screenshots that show radio subtitles or Short-stay “Total to pay now” grand totals (current Short review has **no** payment total card).
- “Catalog default: ₹X/day” for Until I leave (code does **not** prefill daily from monthly catalog).
- Whether Vacant beds summary subtitle card is visible on the metric path (`showSubtitle={false}`; summary depends on `showSummary` default).
- Live payment amounts after Allocate (review figures are preview-only).

---

*End of visual specification.*
