# Occupancy Phase 4.3a — Backend Summary

Phase 4.3a adds **reservation lifecycle** on the existing `occupancies` table (no separate reservations table). Inventory status on beds/rooms/units remains separate from occupancy status and is synced by `AccommodationStatusSyncService`.

## Database migrations

| Migration | Description |
|-----------|-------------|
| `occupancy/V23__occupancy_lifecycle_phase_4_3a.sql` | Lifecycle columns, `RESERVED` status, unique indexes, history event types |
| `member/V24__member_gender_and_category.sql` | `gender`, `member_category`, `MemberOccupancyStatus.RESERVED` |
| `space/V25__space_gender_policy.sql` | `spaces.gender_policy` |

Backfill: existing `ACTIVE` occupancies get `move_in_date = allocated_at::date`, `actual_move_in_at = allocated_at`; `expected_exit_date` copied from `expected_checkout_date`.

## New / extended enums

- `OccupancyStatus`: `RESERVED`
- `OccupancyHistoryEvent`: `RESERVED`, `MOVE_IN`, `RESERVATION_CANCELLED`
- `MemberOccupancyStatus`: `RESERVED`
- `MemberGender`, `MemberCategory`, `GenderPolicy`

## API endpoints

Base path: `/api/v1/spaces/{spaceId}`

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| `POST` | `/occupancies/reserve` | OWNER, MANAGER | Create `RESERVED` occupancy |
| `POST` | `/occupancies/{id}/move-in` | OWNER, MANAGER | Promote `RESERVED` → `ACTIVE` |
| `POST` | `/occupancies/{id}/cancel-reservation` | OWNER, MANAGER | Cancel reservation (`VACATED` + history) |
| `POST` | `/occupancies` | OWNER, MANAGER | Walk-in allocate (unchanged path; now sets `moveInDate=today`) |
| `GET` | `/occupancies?status=RESERVED` | OWNER, MANAGER, STAFF | Filter reserved occupancies |

### Request bodies

**ReserveOccupancyRequest:** `memberId`, `targetType`, target ids, `moveInDate` (required), optional `expectedExitDate`, `memberCategory`, `remarks`.

**MoveInOccupancyRequest:** optional `moveInDate`, `expectedExitDate`, `allowEarlyMoveIn`, `agreementSigned`, `remarks`.

**CancelReservationRequest:** optional `remarks`.

### Response changes

- `OccupancyResponse`: `reservedAt`, `moveInDate`, `actualMoveInAt`, `expectedExitDate`, `memberCategory`, `agreementSigned` (`expectedCheckoutDate` kept as deprecated alias)
- `MemberOccupancyListResponse`: added `reservedOccupancy`
- `CurrentOccupancySummaryResponse`: `occupancyId`, `occupancyStatus`, `moveInDate`
- `BedResponse`: `occupant` (ACTIVE or RESERVED)
- `AvailabilityCountsResponse`: `reservedBeds`, `reservedRooms`, `reservedUnits`

## Business rules

1. Member may have at most one `ACTIVE` or one `RESERVED` occupancy per space (not both).
2. Target must be `AVAILABLE` to reserve or walk-in allocate; `MAINTENANCE` / `BLOCKED` always rejected.
3. Move-in requires `moveInDate <= today` unless `allowEarlyMoveIn=true`.
4. Cancel reservation sets occupancy to `VACATED` with history event `RESERVATION_CANCELLED`.
5. Gender policy validated when `space.genderPolicy` is set and member has a known gender.
6. Accommodation sync: `RESERVED` occupancy → target `RESERVED`; `ACTIVE` → `OCCUPIED`; neither → `AVAILABLE` (never overwrites operator-set `MAINTENANCE` / `BLOCKED`).

## Deferred (Phase 4.3b)

Financial snapshots (`defaultRent`, `rentSnapshot`, transfer rent policy) are **not** included in this release.

## Verification checklist

- [x] Reserve → bed `RESERVED`, list with `status=RESERVED`
- [x] Move-in → bed `OCCUPIED`, member `ALLOCATED`
- [x] Cancel → bed `AVAILABLE`
- [x] Walk-in `POST /occupancies` still works
- [x] Transfer + vacate sync with RESERVED/ACTIVE
- [x] Bed detail includes occupant for ACTIVE/RESERVED
- [x] Gender validation when configured
- [x] MAINTENANCE/BLOCKED beds reject reserve/allocate
- [x] Building summary includes reserved counts
