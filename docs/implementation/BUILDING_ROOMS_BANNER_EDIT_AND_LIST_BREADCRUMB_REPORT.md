# Building Rooms – Banner Edit, Filter Capsules, List Breadcrumb

**Date:** 2026-11-08
**Scope:** ACOMI Android Building Rooms (`AccommodationBuilderScreen`) UI/navigation only

---

## Changes

### 1. Removed building name link
- Removed `AccommodationContextTrail` under the Building Summary banner (the underlined “Sunrise PG 77” link and its vertical space).
- Remaining header order: Summary banner → status capsules → List/Layout toggle → search → actions → inventory.

### 2. Edit Building on banner pencil
- Banner pencil now opens the existing `BuildingForm` screen (`mode: 'edit'`) — same navigation previously used by the trail / room-menu “Edit building” action.
- Implemented via `InlineEditableName.onEditPress` → `BuildingSummaryHeader.onEditPress` → `openEditBuilding` in `AccommodationBuilderScreen`.
- No second edit flow; inline building rename on this screen was replaced by the full Edit Building form (fields, validation, save API unchanged).
- Pencil remains a dedicated control (banner itself is not made clickable).

### 3. Status filter capsules
- Kept filters: All / Available / Occupied / Reserved (same counts + `InventoryStatusFilter` mapping).
- Visuals aligned with Dashboard Property Operations pastels:
  - All → blue + Layers
  - Available → purple + Bed
  - Occupied → mint/green + Users
  - Reserved → orange + CalendarCheck2
- Selected vs idle: pastel fill + stronger accent border when selected; white when idle.
- Horizontal scroll preserved.

### 4. List view breadcrumb
- List room headers now use the same `roomGroupPathCrumbs` path as Layout: **Building > Floor > Unit > Room**.
- Same link styling and `navigateToRoomGroupEntityEdit` behaviour as Layout when the user can manage.
- Breadcrumb wraps; building name is not duplicated as a separate title.
- Bed rows / occupant details / overflow menu unchanged.

---

## Changed files

| File | Role |
|---|---|
| `src/screens/accommodation/AccommodationBuilderScreen.tsx` | Remove trail; wire banner edit; share path crumbs for List + Layout |
| `src/components/accommodation/BuildingSummaryHeader.tsx` | `onEditPress` passthrough |
| `src/components/ui/InlineEditableName.tsx` | Pencil can open external edit action |
| `src/components/accommodation/InventoryStatusFilterCapsules.tsx` | Ops-aligned colors + icons |
| `src/components/accommodation/BuildingInventoryRoomListSection.tsx` | Layout-parity breadcrumb header |
| `docs/implementation/BUILDING_ROOMS_BANNER_EDIT_AND_LIST_BREADCRUMB_REPORT.md` | This report |

## Reused edit functionality
- `navigation.navigate('BuildingForm', { spaceId, buildingId, mode: 'edit' })` — same route as trail / room menu Edit building.
- Breadcrumb edits: `navigateToRoomGroupEntityEdit`.

## Tests performed
- Static review of wiring (trail removed, pencil → BuildingForm, shared crumbs).
- Lint check on touched files.
- Device UI smoke (filter colors, breadcrumb wrap, edit save) not run in this pass.

## Unresolved / follow-up
- Confirm on device that Edit Building save still refreshes the summary name after returning.
- Optional: remove redundant “Edit building” entry from room overflow menus now that the banner pencil is primary (left in place to avoid behaviour loss).
