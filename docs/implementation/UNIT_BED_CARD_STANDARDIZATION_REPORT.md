# Unit / Bed Card Standardization Report

**Date:** 2026-11-06
**Scope:** Android UI-only — standardize individual unit/bed listing presentation to the approved Rental Units Overview card.
**Out of scope:** Mess/Tiffin, APIs, occupancy math, KPI/summary cards, horizontal bed carousels, hierarchy navigation rows (floors/rooms as containers).

## 1. Approved reference

Rental property **Units Overview** individual cards under **Units (N)**:

- White card, rounded corners, subtle border + shadow
- Unit/bed icon · name · three-dot menu (when actions exist)
- Status badge · occupancy % (when available)
- Green outlined **View details** button
- Two-column grid where the listing is a flat unit/bed inventory list

Reusable implementation: `InventoryListingCard` + `InventoryListingCardGrid`
(`src/components/accommodation/InventoryListingCard.tsx`)

## 2. Screens audited

| Screen / surface | Role | Finding | Action |
|---|---|---|---|
| `RentalUnitsOverview` | Reference Units Overview grid | Already used approved cards | Kept as reference |
| `UnitOpsFocusList` | Dashboard / Rooms tab Available·Occupied units; `DashboardBedInventoryScreen` unit-level | Was simple full-width rows | → `InventoryListingCardGrid` |
| `DashboardBedInventoryScreen` | Available / Occupied units (rental) or beds (PG/Hostel) | Unit path via `UnitOpsFocusList`; bed path via horizontal room sections | Unit path standardized; bed path unchanged (horizontal) |
| `AccommodationHomeScreen` | Rooms tab ops-focus unit list | Via `UnitOpsFocusList` | Standardized |
| `AccommodationOpsFocusInventory` | PG/Hostel ops-focus beds | `BuildingInventoryRoomSection` + horizontal `BuildingInventoryBedCard` | Unchanged (preserve horizontal scroll) |
| `BedInventoryBrowser` + room/unit section cards | Drilldown vacant/occupied beds | Horizontal bed carousel per room | Unchanged |
| `UnitsScreen` | Building units list | Flat unit inventory | → 2-col `InventoryListingCard` |
| `AccommodationFloorApartmentsScreen` | Units on a floor (list mode) | Flat unit inventory | → 2-col `InventoryListingCard`; layout mode still floor plan |
| `AccommodationBuilderScreen` | Building list: floors / units / room inventory | Unit-centric list used hierarchy rows | → `InventoryListingCard` + 2-col when unit-centric; floors stay `AccommodationEntityRow`; inventory rooms keep horizontal beds |
| `AccommodationBedsScreen` | Beds in a room (list mode) | Bed rows | → 2-col via `BedInventoryListRow` → `InventoryListingCard`; layout mode unchanged |
| `AccommodationRoomsScreen` | Rooms under floor/unit | Hierarchy container rows + occupancy footer | Excluded (not individual unit/bed cards) |
| `FloorsScreen` | Floors under building | Hierarchy rows | Excluded |
| `BuildingInventoryBedCard` / `HorizontalBedCarousel` | In-building inventory | Horizontal scroll cards | Explicitly preserved |
| Occupancy wizard target picker | Bed/unit selection | Flow-specific rows/actions | Excluded (selection UI, not inventory listing) |
| Layout visuals (`UnitLayoutCard`, elevation, floor plan) | Illustrated layout mode | Different visual language | Excluded |
| Mess / Tiffin | Meals | Out of product scope | Excluded |

## 3. Screens changed

| File | Change |
|---|---|
| `src/components/accommodation/InventoryListingCard.tsx` | **Created** — shared approved card + 2-col grid helper |
| `src/components/accommodation/index.ts` | Export card + types |
| `src/components/accommodation/layout/RentalUnitsOverview.tsx` | Uses `InventoryListingCard` / `InventoryListingCardGrid` |
| `src/components/accommodation/UnitOpsFocusList.tsx` | Replaced simple rows with approved 2-col cards |
| `src/components/occupancy/BedInventoryListRow.tsx` | Renders `InventoryListingCard` (kind=`bed`) + pricing under card |
| `src/screens/accommodation/UnitsScreen.tsx` | 2-col `InventoryListingCard` |
| `src/screens/accommodation/AccommodationFloorApartmentsScreen.tsx` | 2-col `InventoryListingCard` in list mode |
| `src/screens/accommodation/AccommodationBedsScreen.tsx` | List mode `numColumns={2}` + `BedInventoryListRow` |
| `src/screens/accommodation/AccommodationBuilderScreen.tsx` | Unit list items → `InventoryListingCard`; 2-col when unit-centric (`showUnits` && !`showFloors`) |

Indirect coverage (no local row markup change):

- `AccommodationHomeScreen` / `DashboardBedInventoryScreen` via `UnitOpsFocusList`

## 4. Space types

| Space type | Inventory listing entity | Card kind | Verified approach |
|---|---|---|---|
| Rental / Apartment | Units | `unit` | Units Overview, Available Units, dashboard ops list, builder unit grid |
| Serviced / Corporate Apartment | Units (same unit-level occupancy profile) | `unit` | Same unit listing paths as rental |
| PG | Beds (and room sections) | `bed` on bed lists; horizontal cards in room inventory | Beds list + browser carousels |
| Hostel | Beds | `bed` | Same as PG |
| Co-living | Rooms/beds per existing profile | `bed` / unit cards where unit-centric | Same shared components; hierarchy rooms unchanged |
| Mess / Tiffin | N/A | — | Out of scope |

Terminology and hierarchy are unchanged: unit-level spaces keep unit cards; bed-level spaces keep bed cards. Apartment units are not forced into PG bed behaviour.

## 5. Reusable components

| Component | Status |
|---|---|
| `InventoryListingCard` | **Created** — single visual standard for unit/bed inventory listings |
| `InventoryListingCardGrid` | **Created** — two-column rows matching Units Overview |
| `BedInventoryListRow` | **Updated** — wraps `InventoryListingCard` while keeping lifecycle/occupancy menus + pricing |
| `BuildingInventoryBedCard` | **Reused as-is** — horizontal inventory (not replaced) |
| `AccommodationEntityRow` | **Retained** for floors/rooms hierarchy navigation only |

Props use live status, occupancy %, menus, and navigation callbacks — no hardcoded listing data.

## 6. Horizontal scrolling / KPI confirmation

- **Unchanged:** Property Operations / occupancy KPI cards (`DashboardAccommodationOperations`, dashboard summary strip).
- **Unchanged:** Horizontal bed carousels (`HorizontalBedCarousel` + `BuildingInventoryBedCard`) in builder inventory and dashboard bed browser.
- **Unchanged:** Dashboard payment summary and Space Health cards.
- **Changed only:** Flat individual unit/bed inventory listings that were simple full-width rows.

## 7. Functionality preserved

- No API / backend / billing / occupancy calculation changes
- Search, filters, pagination / load-more kept on host screens
- Three-dot menus still pass through existing lifecycle / occupancy option builders
- View details / card press use existing navigation targets (`UnitDetail`, unit rooms, `BedDetail`, allocate callbacks)
- Create/edit/bulk flows untouched

## 8. Tests executed and results

| Check | Result |
|---|---|
| Code audit of all accommodation + dashboard unit/bed listing call sites | Complete (table in §2) |
| Static review: Available Units / dashboard unit list → `UnitOpsFocusList` → cards | Pass |
| Static review: Beds list 2-col + `InventoryListingCard` | Pass |
| Static review: horizontal `BuildingInventoryRoomSection` still uses carousel | Pass |
| Static review: KPI / Property Operations components not modified for this task | Pass |
| Device UI pass on every space type (PG, Hostel, Co-living, Rental, Serviced) | **Not run in this session** — requires installed builds per space; recommended manual checklist below |

### Recommended manual checklist

1. Rental: Units Overview cards match reference; Available Units and Rooms-tab unit focus show 2-col cards.
2. Rental: Property Operations KPI row still scrolls/taps as before.
3. PG/Hostel: Available beds drilldown still shows horizontal bed cards per room; Beds screen list mode shows 2-col approved cards.
4. Statuses: Available / Occupied / Reserved / Maintenance / Blocked / Inactive badges + %.
5. Three-dot actions and View details navigation.
6. Search/filter still filters the same data set.
7. No clipped View details buttons or uneven card heights in 2-col layout.

## 9. Exclusions (with reasons)

| Exclusion | Reason |
|---|---|
| Mess / Tiffin screens | Explicitly out of scope |
| Floor / room hierarchy rows (`AccommodationEntityRow`) | Container navigation + rename / occupancy footers — not individual unit/bed inventory cards |
| Horizontal `BuildingInventoryBedCard` carousel | Must preserve existing horizontal scrolling behaviour |
| Dashboard / Property Operations KPI cards | Explicitly must not change |
| Layout / elevation / floor-plan illustrated tiles | Different visual mode; list mode uses approved cards |
| Occupancy wizard target picker rows | Allocation selection UI, not inventory listing standardization |
| `DashboardBedInventoryBedRow` | Unused by current browser (carousel path); left in place for type export / legacy |

## 10. Acceptance criteria

| # | Criterion | Status |
|---|---|---|
| 1 | Units Overview individual card is the standard | Met (`InventoryListingCard`) |
| 2 | Available Units + dashboard unit listings no longer simple rows | Met (`UnitOpsFocusList`) |
| 3 | Supported space types use consistent unit/bed cards | Met via shared component + profile-appropriate kind |
| 4 | Horizontal scrolling sections unchanged | Met |
| 5 | Dashboard summary/KPI cards unchanged | Met |
| 6 | Actions, navigation, APIs, business logic preserved | Met (UI wiring only) |
