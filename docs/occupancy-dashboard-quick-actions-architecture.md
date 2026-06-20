# Occupancy Dashboard Quick Actions — Architecture

**Status:** Approved — backend P0 in progress  
**Audience:** Product, Backend, React Native, QA  
**Prerequisites:** Phase 4.3a occupancy lifecycle, Phase 4.3b contract snapshots  
**Related:** [occupancy-phase-4.3b-backend.md](./occupancy-phase-4.3b-backend.md), [accommodation-lazy-loading-ui-integration.md](./accommodation-lazy-loading-ui-integration.md), [accommodation-flow-redesign.md](./accommodation-flow-redesign.md)

---

## 1. Executive summary

Operators think in **tasks** (“Rahul arrived”, “assign a bed”, “vacate room 204”), not hierarchy navigation. Dashboard **Quick Actions** provide a task-first entry point while **Member-first** and **Accommodation-first** flows remain available.

This document specifies:

- Dashboard quick action UX (mobile)
- Unified **allocation-target search** (not room-only search)
- Shared occupancy wizard reused by all entry points
- Backend APIs (new search + extended member list)

**No new occupancy write APIs** — existing allocate / reserve / move-in / transfer / vacate endpoints are reused.

---

## 2. Three coexisting entry points

| Entry | Flow | When to use |
|-------|------|-------------|
| **Dashboard Quick Actions** | Task wizard: member ↔ accommodation search | Daily operations, bulk admissions |
| **Member-first** | Member detail → Reserve / Move In | Already viewing member |
| **Accommodation-first** | Bed card ⋮ → Reserve / Move In | Already at inventory |

All three call the same **`OccupancyWizard`** module and the same POST endpoints.

---

## 3. Dashboard quick actions

### 3.1 Actions (v1)

| Action | Backend | Charges step |
|--------|---------|--------------|
| **Move In** | `POST /occupancies` (allocate today) | Yes (4.3b contract) |
| **Reserve** | `POST /occupancies/reserve` | No |
| **Transfer** | `POST /occupancies/{id}/transfer` | Yes (rent policy + contract) |
| **Vacate** | `POST /occupancies/{id}/vacate` | No |

Future (out of scope): Meal Planning, Availability Poll.

### 3.2 Move-in wizard (recommended steps)

1. **Select member** — search by name / mobile; show `occupancyStatus` badge  
2. **Select accommodation** — allocation-target search + filters  
3. **Contract terms** — rent, deposit, food (per space food policy); skip on Reserve  
4. **Review & confirm**

Target: **5–6 taps + typing** vs 10+ hierarchy navigations today.

### 3.3 Vacate / Transfer

- **Vacate:** Member search → show current occupancy (path + snapshot summary) → confirm  
- **Transfer:** Member → current path → search new target → rent policy + charges → confirm  

---

## 4. Allocation-target search (not room search)

### 4.1 Problem

Room numbers repeat across buildings/floors. Showing **“Room 101”** alone is ambiguous.

Search must return **full accommodation paths** as selectable allocation targets.

### 4.2 API

```
GET /api/v1/spaces/{spaceId}/accommodation/allocation-targets
```

**Auth:** Any active space member may search (same as accommodation lazy lists).  
**Write operations** remain OWNER/MANAGER only.

#### Query parameters

| Param | Type | Description |
|-------|------|-------------|
| `query` | string | Text search across building, floor, unit, room, bed names/numbers |
| `targetType` | enum | `BED` (default PG/HOSTEL/CO_LIVING), `UNIT` (RENTAL default), optional override |
| `buildingId` | UUID | Filter by building |
| `floorId` | UUID | Filter by floor (PG/HOSTEL) |
| `unitId` | UUID | Filter by unit (CO_LIVING / RENTAL) |
| `status` | enum | `AccommodationStatus` filter |
| `selectableOnly` | boolean | When `true`, only targets eligible for new allocation (`AVAILABLE`) |
| `page`, `size` | int | Pagination (default size 20) |

#### Response item (`AllocationTargetSearchResponse`)

```json
{
  "targetType": "BED",
  "targetId": "uuid",
  "buildingId": "uuid",
  "buildingName": "Building A",
  "floorId": "uuid",
  "floorName": "Floor 1",
  "unitId": null,
  "unitName": null,
  "roomId": "uuid",
  "roomName": "Room 101",
  "roomNumber": "101",
  "bedId": "uuid",
  "bedName": "Bed A",
  "bedNumber": "A",
  "displayPath": "Building A · Floor 1 · Room 101 · Bed A",
  "displayPathShort": "A · F1 · 101 · A",
  "status": "AVAILABLE",
  "defaultRent": 8000,
  "defaultDeposit": 10000,
  "selectable": true,
  "notSelectableReason": null
}
```

**Rules:**

- Every row includes **full path** — never room-only labels for bed-level PG flows  
- `targetId` = `bedId` for `BED`, `unitId` for `UNIT`  
- `selectable: false` with `notSelectableReason` for OCCUPIED, RESERVED, MAINTENANCE, BLOCKED (still visible when `selectableOnly=false`)  
- Catalog defaults included for contract prefill  

#### Space-type defaults

| Space type | Default `targetType` | Search scope |
|------------|---------------------|--------------|
| PG, HOSTEL | `BED` | Beds with floor → room path |
| CO_LIVING | `BED` | Beds with unit → room path |
| RENTAL | `UNIT` | Units only (no beds) |

---

## 5. Display path strategy

Server-composed paths (client must not stitch hierarchy):

| Format | Usage |
|--------|--------|
| `displayPath` | Primary label in search results and review step |
| `displayPathShort` | Compact mobile list rows |

Separator: ` · ` (middle dot).  
Compose from entity `name` fields per [accommodation-flow-redesign.md §9](./accommodation-flow-redesign.md).

---

## 6. Member search (dashboard picker)

### Extended API

```
GET /api/v1/spaces/{spaceId}/members?search={text}&occupancyStatus={enum}
```

| Param | Description |
|-------|-------------|
| `search` | Case-insensitive match on `fullName` or `mobileNumber` |
| `occupancyStatus` | Optional filter: `VACATED`, `RESERVED`, `ALLOCATED` |

### Response extension

`MemberResponse` includes `occupancyStatus` for picker badges without an extra detail call.

---

## 7. Shared frontend module (React Native)

```
OccupancyWizard
├── mode: ALLOCATE | RESERVE | MOVE_IN | TRANSFER | VACATE
├── MemberPickerStep      → GET /members?search=
├── TargetPickerStep      → GET /allocation-targets
├── ContractTermsStep     → GET /spaces/{id} + catalog from target row
├── ReviewConfirmStep
└── submit → existing POST endpoints
```

| Entry | Pre-filled | Skipped steps |
|-------|------------|---------------|
| Dashboard → Move In | — | — |
| Member → Move In | `memberId` | Member picker |
| Bed → Move In | target IDs | Target picker |
| Reserve (any) | — | Contract terms |

---

## 8. Existing APIs reused (unchanged writes)

| Operation | Endpoint |
|-----------|----------|
| Allocate today | `POST /occupancies` |
| Reserve | `POST /occupancies/reserve` |
| Move-in | `POST /occupancies/{id}/move-in` |
| Transfer | `POST /occupancies/{id}/transfer` |
| Vacate | `POST /occupancies/{id}/vacate` |
| Cancel reservation | `POST /occupancies/{id}/cancel-reservation` |
| Space food policy | `GET /spaces/{id}` |
| Member occupancies | `GET /members/{id}/occupancies` |
| Filter occupancies | `GET /occupancies?status=&memberId=` |

---

## 9. Implementation phases

| Phase | Deliverable |
|-------|-------------|
| **P0 (backend)** | `allocation-targets` search API |
| **P1 (backend)** | Member list `search` + `occupancyStatus`; `MemberResponse.occupancyStatus` |
| **P1 (mobile)** | `OccupancyWizard` + Dashboard quick action shell |
| **P2 (mobile)** | Wire member-first / bed-first to wizard |
| **P2 (backend)** | Dashboard operational summary counts ✅ (`dashboard-summary` API — Phase 7) |

---

## 10. Verification checklist

- [ ] Search `"101"` returns multiple rows with distinct full paths  
- [ ] `selectableOnly=true` returns only `AVAILABLE` targets  
- [ ] RENTAL space returns units, not beds  
- [ ] PG space returns beds with floor + room in path  
- [ ] Reserve wizard never sends financial fields  
- [ ] Move In pre-fills rent/deposit from search result catalog fields  
- [ ] Member search filters by name and mobile  
- [ ] All three entry points produce identical API payloads for same inputs  

---

## 11. Error codes (occupancy writes — unchanged)

| Code | When |
|------|------|
| `RENT_SNAPSHOT_REQUIRED` | Activate without resolvable rent |
| `FOOD_CHARGE_REQUIRED` | Separate food enabled, no charge/default |
| `FOOD_CHARGE_NOT_ALLOWED` | Bundled-food space sent food charge |

---

## 12. Related backend files

| Area | Files |
|------|-------|
| Allocation search | `AllocationTargetSearchService`, `AllocationTargetSearchRepository`, `AllocationTargetSearchController` |
| Display paths | `AccommodationDisplayPathBuilder` |
| Member search | `MemberRepository`, `MemberMasterService`, `MemberController` |
| Occupancy writes | `OccupancyService`, `OccupancyController` (unchanged) |
