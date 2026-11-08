# Rooms Screen — Status Filter Capsules + List / Layout Report

**Date:** 2026-11-07
**Screen:** Building Rooms (`AccommodationBuilderScreen`)
**References:** Current Layout screenshot (ss1) + List mock (ss2)

---

## Summary

Added inventory **status filter capsules** (All / Available / Occupied / Reserved) above the existing List / Layout toggle, and implemented a **compact List view** with room sections and vertical bed rows. Layout view keeps the existing horizontal bed carousel. Both views share the same bed search results, status filter, and counts.

---

## Files changed

| File | Change |
|------|--------|
| `src/screens/accommodation/AccommodationBuilderScreen.tsx` | Capsules, shared filter state, List vs Layout render |
| `src/components/accommodation/InventoryStatusFilterCapsules.tsx` | *(new)* Horizontal status pills |
| `src/components/accommodation/BuildingInventoryRoomListSection.tsx` | *(new)* Compact List room + bed rows |
| `src/utils/inventoryStatusFilter.ts` | *(new)* Counts + filter helpers |
| `src/utils/__tests__/inventoryStatusFilter.test.ts` | *(new)* Unit tests |
| `src/components/accommodation/index.ts` | Exports |
| `src/i18n/locales/en.json` | Filter + list copy |
| This report | Documentation |

Unchanged by design: property summary card, breadcrumb, search, Duplicate Building, FAB, bottom navigation, Layout carousel behaviour.

---

## Status filter behaviour

| Capsule | Filter | Data |
|---------|--------|------|
| All | No status filter | All beds in building (+ search) |
| Available | `status === AVAILABLE` | Available beds only |
| Occupied | `status === OCCUPIED` | Occupied beds only |
| Reserved | `status === RESERVED` | Reserved beds only |

- Counts come from `countBedsByInventoryStatus(bedsHook.items)` (same search/building scope as the list).
- Selecting a capsule filters beds, regroups by room, and **hides rooms with zero matching beds**.
- Filter is preserved when switching List ↔ Layout (`statusFilter` React state).
- Search (`useSpaceBedSearch` query) combines with the status filter.
- Reserved is never counted as Available or Occupied.

---

## List vs Layout

| Mode | Component | Bed presentation |
|------|-----------|------------------|
| Layout | `BuildingInventoryRoomSection` | Horizontal bed cards + carousel (existing) |
| List | `BuildingInventoryRoomListSection` | Vertical bed rows with status chip + occupant line |

List room header: purple door icon, room name, `Unit · Floor` meta, occupancy summary (`N / M Occupied`), overflow menu.
List bed row: status-tinted bed icon, status pill, occupant label via `useBedOccupantLabel` (fetches occupancy member name for OCCUPIED/RESERVED).

---

## API / data notes

- Inventory status uses bed `AccommodationStatus` from bed search (authoritative inventory linkage).
- Cancelled/expired reservations that no longer leave `RESERVED` beds are excluded automatically.
- **Gap:** `BedSpaceListItemResponse` does not include move-in date or reserved member snapshot. List secondary text uses occupancy fetch for **member name** only; exact “Since dd MMM yyyy” requires an API field or batched occupancy payload (not fabricated).

---

## Tests

| Test | Result |
|------|--------|
| `inventoryStatusFilter.test.ts` | Counts, exclusive reserved filtering, empty-room hiding |

Manual device check recommended: toggle capsules in List and Layout, search + filter, reserved cancel/move-in refresh.

---

## Acceptance

- [x] Capsules above List/Layout toggle
- [x] Live counts All / Available / Occupied / Reserved
- [x] Shared filter across List and Layout
- [x] Layout carousel preserved
- [x] Compact List bed rows
- [x] Property summary / search / Duplicate / FAB preserved

*End of report.*
