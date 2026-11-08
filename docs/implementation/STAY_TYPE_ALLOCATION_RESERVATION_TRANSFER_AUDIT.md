# Stay Type × Allocation / Reservation / Transfer Audit (Android)

**Date:** 2026-11-08
**Scope:** Daily (SHORT) reservation wizard defect fix + cross-workflow stay-type audit.
**Constraint:** Fix confirmed SHORT reservation UI/state defects only; do not change MONTHLY/OPEN_ENDED behaviour, billing, booking-advance rules, or APIs.

---

## 1. Confirmed defects and fixes (SHORT reservation)

### Defects (from device screenshots + code)

| # | Defect | Root cause |
|---|--------|------------|
| D1 | Step 3 showed **Daily Rent (Per Night)** | `OccupancyWizardScreen` rendered `ShortStayChoice section="contract"` on `reserve_dates` |
| D2 | Two checkout fields: **Expected Move-Out** + **Expected Exit Date (Optional)** | Same `expectedExitDate` state bound twice: `ShortStayChoice` + `ReserveDatesStep` |
| D3 | Banner error **“Checkout date must be set for short stay.”** after a date was selected | `onExpectedExitDateChange` on reserve `ShortStayChoice` cleared `expectedExitError` but **not** `formError` |
| D4 | Step 3 validated daily rent before Contract Terms | `handlePrimary` required `contractValues.rentSnapshot` on `reserve_dates` for SHORT |

### Fixes applied

1. **SHORT `reserve_dates` only:** single move-in → one mandatory checkout (`ShortStayChoice` details) → remarks. No rent input. No second exit field.
2. **`ReserveDatesStep`:** `showExpectedExit={false}`, `showTitle={false}`, `afterMoveIn` slot for SHORT checkout.
3. **MONTHLY / OPEN_ENDED reserve path** left on the prior layout (banner + `ReserveDatesStep` with optional exit).
4. Selecting checkout clears both `expectedExitError` and `formError`.
5. Continue validates missing checkout and checkout ≤ move-in; **daily rent validated only on Contract Terms**.
6. Canonical field remains wizard state `expectedExitDate` → submit `withStay` / `buildReserveRequest` → API `expectedExitDate` (+ `expectedCheckoutDate` for SHORT via `applyStayChoice`).

### Files changed (fix)

- `src/features/occupancy/OccupancyWizard/OccupancyWizardScreen.tsx`
- `src/features/occupancy/OccupancyWizard/steps/ReserveDatesStep.tsx`

---

## 2. Canonical checkout-date field

| Layer | Field |
|-------|--------|
| Wizard UI state | `expectedExitDate` (`OccupancyWizardScreen`) |
| SHORT duration | `shortStayNightCount(moveInDate, expectedExitDate)` |
| Contract Terms | `shortStayNights` prop from the same pair |
| Review | `expectedExitDate` prop |
| API mapping | `applyStayChoice` → `expectedExitDate` / `expectedCheckoutDate` |
| Persist | Occupancy response `expectedExitDate` (fallback `expectedCheckoutDate` on hydrate) |

No second independent exit-date state remains for SHORT reservation Step 3.

---

## 3. Existing behaviour left unchanged

- MONTHLY reservation / allocation / transfer step sequence and pricing.
- OPEN_ENDED (no mandatory checkout; daily-rate contract copy).
- ALLOCATE / MOVE_IN / TRANSFER `stay_details` layout (not modified in this pass).
- Booking advance enablement / split / collected toggle.
- Deposit, food, amenities, payment generation, billing formulas.
- `shortStayNightCount` half-open `[checkIn, checkout)` night counting.

---

## 4. Cross-workflow matrix (code audit)

Legend: **PASS** = code path matches expected rules and no defect found in this pass.
**FIXED** = defect confirmed and patched.
**CODE-AUDIT** = inspected in source; not exercised end-to-end on device in this session.
**MANUAL PENDING** = needs on-device confirmation.

| Stay Type | Workflow | Fields / dates | Pricing | Validation / payload | Result |
|-----------|----------|----------------|---------|----------------------|--------|
| MONTHLY | Allocation | stay_type → member → stay_details (optional expected move-out) → contract → review | Monthly rent + deposit | `stayKind: MONTHLY`; no SHORT checkout required | PASS (CODE-AUDIT) |
| MONTHLY | Reservation | stay_type → member → reserve_dates (move-in + optional exit + remarks) → contract → review | Monthly rent; booking advance on RESERVE | `buildReserveRequest` + `stayKind: MONTHLY` | PASS (CODE-AUDIT) |
| MONTHLY | Transfer | transfer_current → target → stay_type → stay_details → contract → review | Rent policy KEEP/CUSTOM/APPLY_NEW | Destination `stayKind` = wizard choice; MONTHLY clears agreedTotal in `applyStayChoice` | PASS (CODE-AUDIT) |
| SHORT | Allocation | stay_details: move-in + mandatory checkout; rent on contract | Daily rent × nights | Checkout required; same-day rejected | PASS (CODE-AUDIT) / MANUAL PENDING |
| SHORT | Reservation | **Fixed:** dates only on Step 3; rent on Step 4 | Daily rent + booking advance on contract | `expectedExitDate` retained; rent not required until contract | **FIXED** / MANUAL PENDING |
| SHORT | Transfer | stay_details checkout + contract daily rent | Daily rent; no booking advance | `withStay` uses wizard `expectedExitDate` / daily rent | PASS (CODE-AUDIT) / MANUAL PENDING |
| OPEN_ENDED | Allocation | No mandatory checkout; contract daily rent | Daily rate; closed-period billing elsewhere | `stayKind: OPEN_ENDED`; no SHORT checkout gate | PASS (CODE-AUDIT) |
| OPEN_ENDED | Reservation | Optional exit still on `ReserveDatesStep`; contract daily rent + booking advance | Daily rent | No SHORT checkout required on continue | PASS (CODE-AUDIT) |
| OPEN_ENDED | Transfer | Stay type selectable; no forced checkout | Daily rate via contract | Destination OPEN_ENDED without inventing end date | PASS (CODE-AUDIT) |

### Transfer-specific notes (code)

- Destination stay type is the wizard `stayChoice`, not silently copied without a stay-type step (`useOccupancyWizardSubmit`: “Destination stay type is always the wizard choice”).
- SHORT still requires checkout via `applyStayChoice`.
- OPEN_ENDED does not require checkout in `applyStayChoice`.
- MONTHLY explicitly sets `stayKind: 'MONTHLY'` and clears `agreedTotal`.
- Booking advance remains reservation-only (`showBookingAdvance={mode === 'RESERVE'}`).

---

## 5. Backend / API gaps

None identified for this fix. Existing reserve/allocate/transfer payloads already accept `expectedExitDate` and SHORT daily `rentSnapshot`. No new fields or migrations required.

---

## 6. Tests executed

| Suite | Result |
|-------|--------|
| `src/features/occupancy/OccupancyWizard/__tests__/ShortStayChoice.test.tsx` | **PASS** |
| `src/features/occupancy/OccupancyWizard/__tests__/checkoutErrorClearing.test.ts` | **PASS** |
| `src/features/occupancy/OccupancyWizard/__tests__/occupancyWizardSteps.test.ts` | **PASS** |
| `src/features/occupancy/OccupancyWizard/__tests__/ReviewStep.shortStaySummary.test.tsx` | **PASS** |
| `src/utils/__tests__/shortStay.test.ts` | **PASS** |
| Aggregate | **5 suites / 31 tests PASS** |
| Full on-device Daily reservation (10-step checklist) | **MANUAL PENDING** |
| On-device MONTHLY / OPEN_ENDED / Transfer regressions | **MANUAL PENDING** |

---

## 7. Manual device testing still pending

1. SHORT reservation: set checkout on Step 3 → Continue → duration on Contract Terms; Back/Continue retains dates and rent.
2. SHORT reservation: missing checkout, same-day checkout, cleared checkout.
3. SHORT reservation: booking advance collected / not collected; review + network payload `expectedExitDate` / `rentSnapshot`.
4. MONTHLY and OPEN_ENDED reservation smoke (optional exit / no mandatory checkout).
5. SHORT allocate + transfer smoke for checkout retention.
6. Timezone / date-boundary: pick local calendar dates and confirm YYYY-MM-DD does not shift.
