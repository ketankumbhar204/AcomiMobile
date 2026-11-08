# Stay Management UX Implementation Report

**Date:** 2026-11-05
**Scope:** Approved Stay Management visual UX for Allocate / Reserve / Transfer on Owner Web + Android (all three stay types; accommodation space types via existing wizard).

## 1. Web files changed (`K:\AcomiWeb`)

| File | Change |
|------|--------|
| `src/modules/accommodation/pages/OccupancyWizardPage.tsx` | Stay-type selectable cards + hints; stay-detail info alerts (Monthly / Short / Until I Leave); field-level errors + `scrollIntoView` on Continue; Short review stay-type + allocation total; open-ended billing note; reserve_dates / contract / stay_details field refs |
| `src/i18n/locales/en.json` | Stay-type hints, checkout/agreed-total errors, payment summary / daily rent copy |

Unchanged by design: bed inventory / vacant beds entry redirects (`allocateNeedsVacantBedPick`), Mess flows.

## 2. Android files changed (`K:\AcomiMobile`)

| File | Change |
|------|--------|
| `src/components/occupancy/OccupancyWizardStepHeader.tsx` | Named step progress with completed checkmarks / current highlight / upcoming muted |
| `src/features/occupancy/OccupancyWizard/ShortStayChoice.tsx` | Card stay-type selector with descriptions; stay-detail info banners; field error props |
| `src/features/occupancy/OccupancyWizard/OccupancyWizardScreen.tsx` | Passes `stepLabels`; row sticky footer; field anchors + scroll-to-invalid; progress on Review; catalog rent banner wiring |
| `src/features/occupancy/OccupancyWizard/steps/ReviewStep.tsx` | Short stay stay-type line; display-only Short payment summary (agreed + deposit = total on allocation) |
| `src/i18n/locales/en.json` | Matching copy / validation keys |
| `src/features/occupancy/OccupancyWizard/__tests__/ShortStayChoice.test.tsx` | New |
| `src/features/occupancy/OccupancyWizard/__tests__/ReviewStep.shortStaySummary.test.tsx` | New |

## 3. Backend files changed

None. Existing occupancy / stayKind / agreedTotal / daily rent contracts reused.

## 4. Screens vs mock designs

| Screen | Status |
|--------|--------|
| Choose stay type | Implemented as full-width selectable cards (not chips); labels Monthly / Short stay / Until I Leave with short descriptions |
| Select member | Existing UI retained (already matched approved tabs) |
| Stay details | Move-in + type-specific fields/banners; Short duration nights |
| Contract terms | Existing stay-type field gating retained; Short agreed total + Until I Leave daily rent |
| Review | Short agreed+deposit allocation total (compatible with payment model); Monthly / Until I Leave summaries unchanged in rules |
| Success | Existing `AllocationSuccessModal` / web success dialog |

### Mock vs approved business rules (not shipped as mock)

| Mock element | Decision |
|--------------|----------|
| “Daily rent (Short stay)” + ₹/day × nights | **Rejected** — Short uses owner `agreedTotal` / `FIXED_TOTAL` |
| Vacant-bed card **Allocate** button | **Not added** — Vacant Beds → Bed Detail → Allocate preserved |
| “Total to pay now” as invented billing | Short review shows **Total on allocation** = agreed + deposit only when those values exist; RESERVE does not show charge total |

## 5. Allocate / Reserve / Transfer

Same wizard + stay-type UX on both platforms:

- **Allocate / Move In:**  stay_type → member → stay_details → contract → review
- **Reserve:** stay_type → member → reserve_dates → contract → review (no charge generation on reserve)
- **Transfer:** transfer_current → target → stay_type → stay_details → contract → review

Step sequences unchanged; presentation shared.

## 6. Stay-type and space-type coverage

- Stay types: Monthly, Short, Until I Leave — selectable per operation; not gated by `short_stay_enabled`.
- Space types: existing `stayTypesAvailableForSpace` + target/inventory model (PG/Hostel beds, rental units, etc.) unchanged.
- Mess / Tiffin: not modified.

## 7. API contracts

Reused: allocate / reserve / transfer / move-in payloads via existing `applyStayChoice` / `useOccupancyWizardSubmit`. No DTO or migration changes.

## 8. Validation / error handling

- Field-level red borders / helper text for move-in, checkout, agreed total, rent.
- Continue scrolls to first invalid field (Android `measureLayout` / Web `scrollIntoView` + focus).
- Stay-type switch clears incompatible pricing + field errors (existing `pricingDefaultsForStayChoice`).

## 9. Tests and results

| Suite | Result |
|-------|--------|
| Android `occupancyWizardSteps.test.ts` | PASS |
| Android `ReviewStep.shortStaySummary.test.tsx` | PASS |
| Android `ShortStayChoice.test.tsx` | PASS |
| Web `occupancyWizardSteps.test.ts` (Vitest) | PASS (7) |

Full-matrix / payment persistence suites from prior work were not re-run in this UX pass.

## 10. Unresolved limitations

- Android scroll-to-invalid uses `measureLayout` against the ScrollView; if measurement fails it falls back to scroll-to-top.
- Web member step still uses snackbar-only for “member required” (no form fields to highlight).
- Device / emulator visual walkthrough **not** performed (per task: no browser automation / device walkthrough unless requested).

## 11. Vacant Beds / Bed Detail

**Preserved.** This UX pass did not redesign Vacant Beds or Bed Detail. Entry remains Vacant Beds → Bed Detail → Allocate (wizard with preselected bed). No Allocate button added to vacant-bed cards.

## 12. Mess / Tiffin

**Untouched.**

## 13. Visual / device verification not performed

Manual visual QA on Android device / emulator and Owner Web browser was not run in this session. Automated unit/step tests only.
