# Stay-Type-Aware Rent / Deposit / Payment Display — Audit & Fix Report

**Date:** 2026-11-05
**Trigger:** Member Details → Deposit showed “Monthly rent ₹400” / “Monthly total ₹400” for a Daily (SHORT) stay at ₹400/night.

## 1. Audit summary (affected surfaces)

### P0 — Member contract snapshot (fixed)
| Surface | Platform | Issue |
|---------|----------|-------|
| `OccupancyContractSnapshotCard` | Android | Always Monthly rent / Monthly total; ignored `stayKind` / `agreedTotal` |
| Member Profile stay + Deposit tab | Android | Embeds P0 card |
| Accommodation occupant / Transfer / Vacate | Android | Embeds P0 card |
| `MemberCurrentStayCard` + `StayRecord` | Web | Dropped `stayKind`/`agreedTotal`; always Monthly labels |
| `EntityInspector` unit occupant rent | Web | Had `stayKind`, labeled Monthly |

### P1 — Inventory occupancy faces (partially fixed)
| Surface | Platform | Status |
|---------|----------|--------|
| `BedPricingDisplay` + move-in bed cards | Android | Optional `stayKind`; wired from move-ins list |
| Catalog vacant bed/unit pricing | Both | Remains “Monthly rent” / default monthly — catalog is monthly by design |
| Occupied payment face (period charges) | Both | Generic “Rent due” for billing month — not contract monthly label |

### P2 — Dashboard / payments (deferred with reasons)
| Surface | Status |
|---------|--------|
| Dashboard financial Expected/Collected | Month-scoped revenue from payment APIs — do not relabel as stay contract rent |
| `computeOccupancyMonthlyTotalForMonth` fallback | Still uses `rentSnapshot` proration; SHORT expected rent in offline fallback may be imperfect — payment APIs remain source of truth |
| Payment history / receipts | Category-driven; no blind rename of transaction types |

### P3 — Already stay-aware or catalog-only
Stay Management wizard Contract/Review (Android + Web), Extend renew gated for SHORT, setup “Default monthly rent (prefill)”.

## 2. Shared presentation rule

**Source of truth:** Occupancy snapshot (`stayKind`, `pricingBasis`, `rentSnapshot`, `agreedTotal`, deposit, food, dates) — not catalog rent.

| Stay kind | Display |
|-----------|---------|
| MONTHLY | Monthly rent, Food, Deposit, Monthly total |
| SHORT (Daily) | Daily rent /night, Duration, Total stay rent, Food, Deposit, Total payable |
| OPEN_ENDED | Daily rent /day, Food, Deposit (no invented stay total; billing cadence unchanged) |

Helpers:
- Android: `src/utils/stayFinancialDisplay.ts`
- Web: `src/modules/accommodation/utils/stayFinancialDisplay.ts`

## 3. Files changed

### Android
- `src/utils/stayFinancialDisplay.ts` (new)
- `src/utils/__tests__/stayFinancialDisplay.test.ts` (new)
- `src/components/occupancy/OccupancyContractSnapshotCard.tsx`
- `src/utils/occupancyContract.ts` (`hasContractSnapshot` includes `agreedTotal`)
- `src/components/accommodation/BedPricingDisplay.tsx`
- `src/components/dashboard/bedInventoryFace.tsx`
- `src/screens/dashboard/DashboardBedInventoryScreen.tsx`
- `src/components/accommodation/BuildingInventoryBedCard.tsx`
- `src/i18n/locales/en.json` (`occupancy.section.duration`)

### Owner Web
- `src/modules/accommodation/utils/stayFinancialDisplay.ts` (new)
- `src/modules/accommodation/utils/__tests__/stayFinancialDisplay.test.ts` (new)
- `src/modules/members/utils/memberStayDisplay.ts`
- `src/modules/members/components/MemberCurrentStayCard.tsx`
- `src/modules/accommodation/components/EntityInspector.tsx`

### Backend / API
**None.** `OccupancyResponse` already exposes `stayKind`, `agreedTotal`, `pricingBasis`, snapshots.

## 4. Tests

| Suite | Result |
|-------|--------|
| Android Jest `stayFinancialDisplay` | **4 passed** |
| Web Vitest stay financial + short review totals | **4 passed** |

## 5. Manual visual QA

1. Member Details → Profile / Deposit for MONTHLY, Daily, No Fixed Move-Out Date
2. Bed Detail occupant contract for Daily
3. Vacant beds move-ins focus card for Daily
4. Web Member current stay card (same members)
5. Web EntityInspector occupied unit rent line

## 6. Remaining gaps

1. Occupied bed **payment-period** faces still say “Rent due” (ledger month) — not the same as contract Monthly rent; optional stay annotation later.
2. Offline dashboard expected-rent fallback may still prorate `rentSnapshot` for SHORT — live dashboards use payment APIs.
3. ExtendStay “New monthly rent” copy for OPEN_ENDED renew — product copy pass.
4. Marketplace / listing `monthlyPrice` — out of occupancy contract scope.
5. Full payment receipt stay-context subtitles — deferred (do not reinterpret transaction categories).

**No blind global replace of “Monthly rent” → “Daily rent”.** Catalog and MONTHLY stays retain monthly wording.
