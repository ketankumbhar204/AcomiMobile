# CountIn — Occupancy Management UI Integration (Phase 4.3 / 4.3a)

Frontend guide for **walk-in allocate**, **reserve / move-in / cancel reservation**, **transfer**, **vacate**, and **occupancy history**.

**Prerequisites:** [accommodation-ui-integration.md](./accommodation-ui-integration.md), [membership-ui-integration.md](./membership-ui-integration.md)

**Backend contract (4.3a):** [occupancy-phase-4.3a-backend.md](./occupancy-phase-4.3a-backend.md)

**Architecture:** [accommodation-occupancy-phase-4.3a-architecture.md](./accommodation-occupancy-phase-4.3a-architecture.md)

---

## Lifecycle (Phase 4.3a)

No separate reservations table. One `Occupancy` record with status:

| Flow | API | Occupancy status | Bed / room / unit status |
|------|-----|------------------|--------------------------|
| Reserve | `POST /occupancies/reserve` | `RESERVED` | `RESERVED` |
| Move-in | `POST /occupancies/{id}/move-in` | `ACTIVE` | `OCCUPIED` |
| Cancel reservation | `POST /occupancies/{id}/cancel-reservation` | `VACATED` | `AVAILABLE` |
| Walk-in allocate | `POST /occupancies` | `ACTIVE` (today) | `OCCUPIED` |
| Transfer | `POST /occupancies/{id}/transfer` | `ACTIVE` (new record) | updated targets |
| Vacate | `POST /occupancies/{id}/vacate` | `VACATED` | `AVAILABLE` |

**Member rule:** at most one `ACTIVE` or one `RESERVED` occupancy per space — never both.

**Inventory rule:** Reserve and walk-in picker only offers targets with `AccommodationStatus.AVAILABLE`. `MAINTENANCE` / `BLOCKED` are never selectable.

---

## Allocation rules by space type

| Space type | Allowed `targetType` | Target IDs |
|------------|---------------------|------------|
| PG / HOSTEL | `BED` | `bedId` required |
| CO_LIVING | `BED` or `ROOM` | `bedId` or `roomId` |
| RENTAL | `UNIT` | `unitId` required |

---

## Member fields

`MemberDetailsResponse` includes:

- `occupancyStatus`: `ALLOCATED` | `RESERVED` | `VACATED`
- `currentOccupancy`: summary when allocated or reserved (building/floor/unit/room/bed names, `occupancyStatus`, `moveInDate`)

`GET /members/{memberId}/occupancies` returns:

- `currentOccupancy` — active (`ACTIVE`) record
- `reservedOccupancy` — reserved (`RESERVED`) record
- `history` — timeline including `RESERVED`, `MOVE_IN`, `RESERVATION_CANCELLED`

---

## Endpoints

Base: `/api/v1/spaces/{spaceId}`

| Method | Path | Role | Purpose |
|--------|------|------|---------|
| `POST` | `/occupancies/reserve` | OWNER, MANAGER | Create reserved occupancy |
| `POST` | `/occupancies/{id}/move-in` | OWNER, MANAGER | Promote reserved → active |
| `POST` | `/occupancies/{id}/cancel-reservation` | OWNER, MANAGER | Cancel reservation |
| `POST` | `/occupancies` | OWNER, MANAGER | Walk-in allocate (active today) |
| `POST` | `/occupancies/{occupancyId}/transfer` | OWNER, MANAGER | Transfer active occupancy |
| `POST` | `/occupancies/{occupancyId}/vacate` | OWNER, MANAGER | Vacate active occupancy |
| `GET` | `/occupancies/{occupancyId}` | OWNER, MANAGER, STAFF, TENANT (own) | Single record |
| `GET` | `/occupancies?status=&memberId=&buildingId=…` | OWNER, MANAGER, STAFF | List (e.g. `status=RESERVED`) |
| `GET` | `/members/{memberId}/occupancies` | OWNER, MANAGER, STAFF, TENANT (own) | Member history |

---

## Request bodies

### Reserve

```json
{
  "memberId": "uuid",
  "targetType": "BED",
  "bedId": "uuid",
  "moveInDate": "2026-06-15",
  "expectedExitDate": "2026-12-31",
  "memberCategory": "STUDENT",
  "remarks": "Summer intake"
}
```

### Move-in (all optional)

```json
{
  "moveInDate": "2026-06-15",
  "expectedExitDate": "2026-12-31",
  "allowEarlyMoveIn": true,
  "agreementSigned": true,
  "remarks": "Keys handed over"
}
```

`allowEarlyMoveIn` is required when moving in before the scheduled `moveInDate`.

### Cancel reservation

```json
{ "remarks": "Member cancelled" }
```

### Walk-in allocate

```json
{
  "memberId": "uuid",
  "targetType": "BED",
  "bedId": "uuid",
  "expectedExitDate": "2026-12-31",
  "remarks": "Walk-in today"
}
```

### Transfer

```json
{
  "targetType": "BED",
  "bedId": "uuid",
  "remarks": "Moved to corner bed"
}
```

### Vacate

```json
{ "remarks": "Checkout completed" }
```

---

## Response extensions (4.3a)

- `OccupancyResponse`: `reservedAt`, `moveInDate`, `actualMoveInAt`, `expectedExitDate`, `memberCategory`, `agreementSigned`
- `MemberOccupancyListResponse.reservedOccupancy`
- `CurrentOccupancySummaryResponse`: `occupancyId`, `occupancyStatus`, `moveInDate`
- `BedResponse.occupant`: `{ occupancyId, memberId, memberName, occupancyStatus }` — preferred on bed detail
- `BuildingSummaryResponse`: `reservedBeds`, `reservedRooms`, `reservedUnits` (plus aggregate `reserved`)

---

## Frontend modules

| Module | Path | Notes |
|--------|------|-------|
| API | `src/api/occupancyApi.ts` | `reserveOccupancy`, `moveInOccupancy`, `cancelReservation` |
| Types | `src/api/types.ts` | Enums + DTOs above |
| Mutations | `src/hooks/useOccupancyMutations.ts` | reserve / moveIn / cancelReservation |
| Target occupancy | `src/hooks/useTargetOccupancy.ts` | ACTIVE then RESERVED fallback |
| Member section | `src/components/occupancy/MemberAccommodationSection.tsx` | VACATED / RESERVED / ALLOCATED UI |
| Target picker | `src/components/occupancy/OccupancyTargetPickerModal.tsx` | modes: `RESERVE`, `WALK_IN`, `TRANSFER` |
| Move-in modal | `src/components/occupancy/MoveInModal.tsx` | early move-in + agreement |
| Bed occupant | `src/components/occupancy/AccommodationOccupantSection.tsx` | ACTIVE + RESERVED badge |
| Bed detail | `src/screens/accommodation/BedDetailScreen.tsx` | prefers `bed.occupant` |
| Building summary | `src/components/accommodation/BuildingSummaryHeader.tsx` | reserved counts |
| Errors | `src/utils/occupancyErrors.ts` | gender, move-in date, maintenance/blocked |

---

## Member profile UI states

| `occupancyStatus` | Card | Actions (OWNER/MANAGER) |
|-------------------|------|-------------------------|
| `VACATED` | No accommodation | Reserve, Walk-in / Move in today |
| `RESERVED` | Reserved location + dates | Move in, Cancel reservation |
| `ALLOCATED` | Current location + dates | Transfer, Vacate |

Transfer and vacate apply only to **ACTIVE** occupancy. Cancel applies only to **RESERVED**.

---

## Building summary availability

`GET .../buildings/{buildingId}/summary` includes:

- `availableBeds`, `occupiedBeds`, `reservedBeds`
- `availableRooms`, `occupiedRooms`, `reservedRooms`
- `availableUnits`, `occupiedUnits`, `reservedUnits`

Bed/room/unit `AccommodationStatus` is updated automatically on reserve, move-in, cancel, allocate, vacate, and transfer.

---

## Verification checklist (manual QA)

- [ ] Reserve member on available bed → bed `RESERVED`, member `occupancyStatus=RESERVED`
- [ ] Move-in on reserved occupancy → bed `OCCUPIED`, member `ALLOCATED`
- [ ] Cancel reservation → bed `AVAILABLE`, member `VACATED`
- [ ] Walk-in allocate still works (`POST /occupancies`)
- [ ] Transfer + vacate still work on ACTIVE occupancy
- [ ] Bed detail shows occupant for ACTIVE and RESERVED (`bed.occupant` or list fallback)
- [ ] Gender mismatch shows clear error when space policy set
- [ ] Maintenance/Blocked beds not selectable in picker
- [ ] Building summary shows reserved counts
- [ ] Staff can list `GET /occupancies?status=RESERVED`; tenant cannot manage reserve/move-in/cancel

---

## Out of scope (later phases)

- Rent/deposit/food snapshots (Phase 4.3b)
- Amenities, policy rules, space settings (Phase 4.4)
- Invoice/payment/meal modules

---

## Related docs

- [accommodation-lifecycle-ui-integration.md](./accommodation-lifecycle-ui-integration.md)
- [accommodation-lazy-loading-ui-integration.md](./accommodation-lazy-loading-ui-integration.md)
- [accommodation-domain-model.md](./accommodation-domain-model.md) — §2.4 inventory status ≠ occupancy
- [member-management-ui-integration.md](./member-management-ui-integration.md)
