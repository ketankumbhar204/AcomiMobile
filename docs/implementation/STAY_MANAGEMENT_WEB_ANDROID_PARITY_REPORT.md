# Stay Management — Owner Web ↔ Android Parity Report

**Date:** 2026-11-05
**Reference:** Latest Android Stay Management (Allocate / Reserve / Transfer)
**Web primary surface:** `AcomiWeb/src/modules/accommodation/pages/OccupancyWizardPage.tsx`

## Android reference components inspected

| Area | Path |
|------|------|
| Step sequence | `src/features/occupancy/OccupancyWizard/occupancyWizardSteps.ts` |
| Wizard shell | `OccupancyWizardScreen.tsx` |
| Stay type UI | `ShortStayChoice.tsx` |
| Contract | `ContractTermsForm.tsx`, `ContractTermsStep.tsx` |
| Review | `ReviewStep.tsx` |
| Submit / food mapping | `useOccupancyWizardSubmit.ts`, `utils/occupancyContract.ts` |
| Stay math | `utils/shortStay.ts` |
| Labels | `src/i18n/locales/en.json` (`occupancy.section`, `occupancy.contract`) |

## Web components changed

| File | Changes |
|------|---------|
| `OccupancyWizardPage.tsx` | Food default ON; `foodIncludedInRent` submit mapping; stay-detail banners; catalog helpers after rent+deposit; food bundled hints; Reserve daily rent (not fixed agreed total); Review Charges Summary with daily×nights totals; mode-specific final CTA |
| `src/i18n/locales/en.json` | Review `chargesSummary` / `stayDates`; food/catalog helpers already present |
| `utils/__tests__/shortStayReviewTotals.test.ts` | Guards SHORT total formula + food Yes/No source |

## Differences resolved

1. **Food default** — Web now defaults Include Food Charges **ON** (matches Android `emptyContractTermsFormValues`).
2. **Food API mapping** — Allocate / Reserve / Move-in send `foodEnabled` and `foodIncludedInRent` together when meals apply (bundled when ON; both false when OFF). Amenities do not drive this.
3. **Review food Yes/No** — Driven only by wizard `foodEnabled` (same as Android after recent fix).
4. **SHORT Review totals** — Was incorrectly `daily + deposit`; now `daily × nights + deposit`, with Charges Summary rows matching Android (stay type, daily rent, duration, stay rent, deposit, food, total on allocation).
5. **Pricing field order** — Rent and deposit remain adjacent; catalog / rate helpers and totals render after both inputs.
6. **Stay detail banners** — Daily / No Fixed Move-Out Date / Monthly copy aligned with Android.
7. **Reserve SHORT** — Daily rent (per night) instead of legacy fixed “Agreed total”.
8. **Final CTA** — Allocate / Reserve / Transfer / Move in / Vacate (not generic Confirm).

## Tests executed

| Suite | Result |
|-------|--------|
| Web Vitest `src/modules/accommodation/utils` (incl. new SHORT review totals) | **105 passed / 7 files** |
| Android Jest Review / stay matrix (prior session) | Passed; Android not redesigned in this task |

## Remaining differences (intentional / deferred)

| Item | Reason |
|------|--------|
| Amenities + additional charges UI on Web contract | Android collects amenities/`otherCharges`; Web types allow charges but no amenity picker yet. Deferred to avoid half-wired API without space amenity fetch UX. |
| TRANSFER rent policy chips (APPLY_NEW / KEEP / CUSTOM) | Web still submits `rentPolicy: 'KEEP'`. Changing would alter Transfer pricing behaviour; needs explicit product pass. |
| Create-new-member in wizard | Android MemberPicker supports create; Web is search/select only. |
| Hero banner chrome | Web uses PageHeader + stay Chip + side WidgetCard; Android uses tinted hero. Content hierarchy preserved; desktop layout adapted. |
| MOVE_IN early-move-in toggle | Android-only control; Web Move-in path unchanged. |
| Mess / Vacant Beds → Bed Detail entry | Untouched per scope. |

## Acceptance mapping

| Criterion | Status |
|-----------|--------|
| Same step sequence (ALLOCATE known bed) | Pass |
| Stay labels Monthly / Daily / No Fixed Move-Out Date | Pass |
| Rent + deposit adjacent | Pass |
| Food toggle ↔ Review Yes/No | Pass |
| SHORT pricing summaries | Pass |
| Back/Continue retain state | Pass (same React state) |
| Desktop responsive layout | Pass (cards max-width; grid sidebar) |
