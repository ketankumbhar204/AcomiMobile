# Unit/Bed Card Rendering Fix & Detail Overview Standardization

**Date:** 2026-11-06
**Scope:** Android UI — fix overlapping `InventoryListingCard` grid; compact Property Overview on unit/bed/room detail.
**Out of scope:** Mess/Tiffin, API/backend, KPI/horizontal carousels, hierarchy floor/room list rows.

## 1. Root cause — overlapping / collapsed cards

**Cause:** `InventoryListingCard` used `flex: 1` on the card container.

That is correct for **horizontal** share inside a row cell, but in React Native it also participates in the **vertical** flex axis of ancestors. Combined with:

1. `DashboardBedInventoryScreen` wrapping the Available Units list in a **non-scrolling** `Screen` whose `contentStyle` had `flex: 1`, and
2. Rooms/home paths placing the same grid inside a `ScrollView`,

cards were forced to share (or collapse into) a fixed vertical budget. Intrinsic content height was lost → stacks overlapped; status chips / `%` / View details collided.

**Fix:**

| Change | Why |
|---|---|
| Remove `flex: 1` from card; use `width: '100%'` + `alignSelf: 'stretch'` | Intrinsic height; stretch only to match sibling height in a row |
| Explicit `cardBody` wrapper with `gap` | Pressable no longer collapses body spacing |
| Grid row `alignItems: 'stretch'` | Equal-height columns without vertical flex growth |
| Available Units (`DashboardBedInventoryScreen` unit path): `scrollable` + drop `flex: 1` on content | List can grow and scroll; KPI strip unchanged |

Shared component remains the Units Overview visual language (icon, title, status, %, View details).

## 2. Components / screens modified

### Listing cards
- `src/components/accommodation/InventoryListingCard.tsx` — measurement fix
- `src/screens/dashboard/DashboardBedInventoryScreen.tsx` — scrollable unit list
- Consumers unchanged in API: `UnitOpsFocusList`, `RentalUnitsOverview`, `UnitsScreen`, floor apartments, builder unit grid, `BedInventoryListRow` / Beds list

### Detail overview
- **New** `AccommodationInventoryOverview` — compact 2×2 + pricing basis + Key Dates
- **New** `AccommodationStayTypeCard` — Stay Type only when occupancy/`stayKind` is known
- `UnitDetailScreen` — uses overview + stay card; dropped tall name/number duplicate list
- `BedDetailScreen` — same; catalog rent/deposit moved into overview (removed duplicate pricing strip)
- `RoomDetailScreen` — overview + compact room type/capacity meta; stay card when occupied
- `components/accommodation/index.ts` — exports

## 3. Unit Detail overview standardization

Hero still shows name, property, status, unit number once.

**Property Overview** (no duplicate name/number):
- Unit/Bed/Room ID (`referenceCode`)
- Status badge
- Rent (label **Rent**, not “Monthly rent”) → `Not configured` when null
- Security Deposit → `Not configured` when null
- Pricing Basis row (units/beds): `Not set` when inventory has no basis field (not invented)

**Key Dates:** Created / Updated side-by-side.

**Stay Details:** Shown only for occupied/reserved targets when `stayKind` or `pricingBasis` is present (`MONTHLY` / `SHORT` / `OPEN_ENDED` via shared label helpers). Vacant units: no fabricated Stay Type.

## 4. Space types

| Space type | Listings | Detail |
|---|---|---|
| Rental / Serviced / Corporate | Unit cards (shared grid) | Unit overview + stay |
| PG / Hostel | Bed cards (`BedInventoryListRow` → same card) | Bed overview + stay |
| Co-living | Room/unit/bed per existing hierarchy | Room/unit/bed overview |
| Mess / Tiffin | Untouched | Untouched |

Inventory hierarchy unchanged (apartments are not beds).

## 5. Preserved behaviour

- Property Operations / KPI horizontal cards
- Horizontal bed carousels
- Floor/room hierarchy rows
- Search, filters, pagination, navigation, View details callbacks
- Occupancy % / status calculations
- Allocation / reserve / transfer / checkout / payments

## 6. Tests / checks

| Check | Result |
|---|---|
| IDE lints on touched files | Clean |
| Static layout review vs Available Units screenshot failure mode | Addressed (`flex:1` + non-scroll parent) |
| Device visual QA (1 / 2 / 7 / 10+ units, long names, all space types) | **Manual — recommended on device** |

Recommended device checklist:
1. Available Units with 7+ cards — no overlap, scroll works
2. Occupied + available mix; long unit names
3. Unit Detail occupied vs available — compact overview; Stay Type only when API provides it
4. Bed Detail PG/Hostel — same overview pattern
5. KPI strip and bed carousels still scroll horizontally

## 7. API / data limitations

- Unit/bed catalog DTOs have **no** `pricingBasis`; overview shows Pricing Basis as **Not set** (units/beds) rather than inventing values.
- Stay Type requires occupancy `stayKind` and/or `pricingBasis` (or bed occupant `stayKind` after API enrichment). Legacy null → card omitted / no fabricated Monthly.
- Room type & capacity remain room-specific meta (not forced into the 2×2 rent/deposit grid).

## 8. Acceptance

| Criterion | Status |
|---|---|
| Independent, properly spaced unit/bed cards | Fixed |
| Shared listing card design preserved | Yes |
| Compact Property Overview on applicable details | Yes |
| Horizontal KPI / carousels unchanged | Yes |
| No business/API regression intended | Yes |
