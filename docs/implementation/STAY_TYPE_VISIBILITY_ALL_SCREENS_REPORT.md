# Stay Type Visibility — All Screens Report (Owner Web)

**Date:** 2026-11-06
**Scope:** ACOMI Web — consistent Stay Type display wherever individual stay/occupancy context exists.
**Constraint:** No backend enum/DB changes; no billing calculation changes; Mess/Tiffin unchanged.

## Labels (owner-facing)

| Backend | Display |
|---------|---------|
| `MONTHLY` | Monthly |
| `SHORT` | Daily |
| `OPEN_ENDED` | No Fixed Move-Out Date |

## Shared utility

**`src/shared/utils/stayTypeDisplay.ts`**

- Reuses `stayChoiceLabelKey` / `stayChoiceDefaultLabel` and `resolveOccupancyStayKind` / `buildStayFinancialPresentation`
- Adds `buildStayTypeChipModel`, `stayTypeSupportingText`, `resolveStayTypeForDisplay`, `hasExplicitStayKind`
- Tests: `src/shared/utils/__tests__/stayTypeDisplay.test.ts`

## Inventory checklist

| Surface | Status | Notes |
|---------|--------|-------|
| Member current stay / profile (`MemberCurrentStayCard`) | **PASS** | Already showed Stay type + pricing rows |
| Occupancy wizard (allocate/reserve/transfer/move-in) | **PASS** | Stay type selection + review; success dialog now includes Stay type |
| Occupied bed stay section (`OccupiedBedStaySection`) | **PASS** | Added Stay type + pricing support line (was missing — screenshot gap) |
| Occupied bed payment face (`OccupiedBedPaymentFace`) | **PASS** | Compact Stay type · pricing above payment status |
| Bed EntityInspector details | **PASS** | Stay type row when occupancy loaded |
| Unit EntityInspector occupied block | **PASS** | Stay type line + existing rent caption |
| Extend / renew dialog | **PASS** | Shows Stay type under title when known |
| Occupancy success dialog | **PASS** | Optional `stayTypeLabel` from wizard |
| Member occupancy history table | **PASS** | Stay type column; shows `—` when API omits `stayKind` |
| Payments workspace / payment cards | **NOT APPLICABLE / API GAP** | Payment DTO has no `stayKind`; location trail only — do not invent |
| Dashboard occupancy list / status board | **API GAP** | `OccupancyListItem` has no `stayKind` |
| Member list contact meta | **NOT APPLICABLE** | Location trail only; no stay record |
| Mess / Tiffin | **NOT APPLICABLE** | No accommodation stayKind model |
| Aggregate financial widgets | **NOT APPLICABLE** | No individual stay context |

## Files changed

| File | Change |
|------|--------|
| `src/shared/utils/stayTypeDisplay.ts` | New shared utility |
| `src/shared/utils/__tests__/stayTypeDisplay.test.ts` | New tests |
| `src/modules/accommodation/components/OccupiedBedStaySection.tsx` | Stay type + pricing rows |
| `src/modules/accommodation/components/OccupiedBedPaymentFace.tsx` | Compact stay type line |
| `src/modules/accommodation/components/EntityInspector.tsx` | Bed + unit Stay type |
| `src/modules/accommodation/components/ExtendStayDialog.tsx` | Stay type context |
| `src/modules/accommodation/components/OccupancySuccessDialog.tsx` | Optional stay type |
| `src/modules/accommodation/pages/OccupancyWizardPage.tsx` | Pass stay type into success payload |
| `src/modules/members/components/panels/MemberOccupancyPanel.tsx` | History Stay type column |
| `src/shared/types/member.ts` | Optional `stayKind` on occupancy list rows |

## API fields reused

- Occupancy: `stayKind`, `pricingBasis`, `rentSnapshot`, `agreedTotal`, dates
- Member occupancy list: optional `stayKind` when backend includes it

## Backend API gaps (documented, not invented)

1. **Payment responses** — no `stayKind` / pricing basis for the linked occupancy.
2. **Dashboard drilldown occupancy list** — no `stayKind`.
3. **Member occupancy history rows** — column ready; shows `—` until API sends `stayKind`.

## Space-type handling

- PG / Hostel / Co-living / Rental / Corporate Stay: display actual `stayKind` when present.
- Mess / Tiffin: not applicable; untouched.

## Tests executed

| Suite | Result |
|-------|--------|
| `stayTypeDisplay.test.ts` | PASS |
| `stayChoiceLabels.test.ts` | PASS |
| `stayFinancialDisplay.test.ts` | PASS |
| Combined | **10 passed / 3 files** |

Responsive desktop/mobile browser visual QA: **not performed** in this pass.

## Confirmations

- Allocation entry path Vacant Beds → Bed Detail → Allocate: **preserved**
- Payment generation / end-of-period OPEN_ENDED billing rules: **unchanged**
- Reservation / transfer / checkout workflows: **unchanged** (display only)
- Mess/Tiffin: **untouched**
- No backend enum or migration changes
