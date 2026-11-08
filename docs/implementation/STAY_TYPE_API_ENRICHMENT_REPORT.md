# Stay Type API Enrichment Report

**Date:** 2026-11-06
**Backend:** `K:\Projects\Acomi\Backend\acomi-backend`
**Scope:** Expose persisted `stayKind` on payment and individual-stay summary DTOs used by Web/Android.
**Constraints:** No endpoint renames/removals; no billing/payment-status logic changes; no Mess/Tiffin accommodation Stay Type; no `MONTHLY` default for null/legacy; no N+1 introductions.

## Labels (unchanged)

| Backend `stayKind` | Owner-facing UI |
|---|---|
| `MONTHLY` | Monthly |
| `SHORT` | Daily |
| `OPEN_ENDED` | No Fixed Move-Out Date |

## 1. Entity relationship (inspected)

- Persisted on `OccupancyEntity.stayKind` (`occupancies.stay_kind`, nullable; migration `V156__occupancy_stay_kind.sql`).
- Payments link via `SpacePaymentEntity.occupancy` (`occupancy_id` optional `@ManyToOne`).
- Member occupancy lists return full `OccupancyResponse` rows (each historical occupancy keeps its own `stayKind`).
- `OccupancyHistoryEntity` is an event log only — **no** `stayKind` column; Stay Type for history UIs comes from the related `OccupancyResponse` in `occupancies[]`, not from event rows.

## 2. APIs / DTOs audited

| Surface | DTO | Pre-change `stayKind` | Action |
|---|---|---|---|
| Occupancy get/list/allocate/… | `OccupancyResponse` | **Present** (`from(entity)`) | None |
| Member occupancies | `MemberOccupancyListResponse.occupancies` / current / reserved | **Present** via `OccupancyResponse` | None (verified by test) |
| Member occupancy event log | `OccupancyHistoryEntryResponse` | Absent | **Excluded** — not stored on history entity |
| Space payments / owner month payments | `SpacePaymentResponse` | Absent (`occupancyId` only) | **Added** |
| Member details current stay | `CurrentOccupancySummaryResponse` | Absent | **Added** |
| Bed detail occupant | `BedOccupantSummaryResponse` | Absent | **Added** |
| Overdue reminder rows | `OverduePaymentResponse` | Absent; graph fetch has **no** occupancy JOIN | **Excluded** (would risk N+1 / query change) |
| Member payment ledger rows | `MemberPaymentLedgerRowResponse` | Aggregate per member | **Excluded** (not an individual stay) |
| Dashboard financial summary | `DashboardFinancialSummaryResponse` | Aggregate totals | **Excluded** (no single Stay Type) |
| Mess / Tiffin meal payments | Meal payment paths | N/A | Untouched |

Dashboard “occupancy list” used by clients is `GET …/occupancies` → `PagedResponse<OccupancyResponse>`, which already included `stayKind`. There is no separate `OccupancyListItem` DTO in the backend.

## 3. APIs / DTOs modified

### `SpacePaymentResponse`

- New optional field: `StayKind stayKind`
- Source: `entity.getOccupancy() != null ? entity.getOccupancy().getStayKind() : null`
- Copied through `withTargetLabel(...)` (also restores `description` on copy so label updates do not drop fields)
- List/detail payment queries already `LEFT JOIN FETCH p.occupancy` — **no extra query**

### `CurrentOccupancySummaryResponse`

- New optional field: `StayKind stayKind`
- Source: `OccupancyService.toSummary(occupancy)` → `occupancy.getStayKind()`
- Used by member details (`MemberDetailsResponse.currentOccupancy`)

### `BedOccupantSummaryResponse`

- New optional field: `StayKind stayKind`
- Source: `OccupancyService.findBedOccupant` → `occupancy.getStayKind()`
- Used by bed inventory/detail occupant payload

## 4. Null / legacy handling

- Legacy `occupancies.stay_kind = NULL` → API returns `null` (JSON omit/null per Jackson defaults).
- Payment with no occupancy link → `stayKind = null`.
- **Never** defaulted to `MONTHLY` in responses.
- Clients continue to treat null as “unknown / —” via `stayTypeDisplay` helpers.

## 5. Query / performance

| Path | Consideration |
|---|---|
| Payment list/search/detail | Occupancy already JOIN FETCHed → scalar read only |
| Member summary / bed occupant | Occupancy already loaded for the summary → scalar read only |
| Overdue list | Intentionally **not** enriched (member+space fetch only) |
| Member occupancy list | Existing per-row `toResponse` cost unchanged; `stayKind` already on entity |

## 6. Tests executed

| Suite | Result |
|---|---|
| `SpacePaymentResponseStayKindTest` | **6 passed** (MONTHLY / SHORT / OPEN_ENDED + null occupancy + legacy null + `withTargetLabel` preserve) |
| `OccupancyServiceTest#findCurrentOccupancySummary_exposesPersistedStayKind` | **PASS** |
| `OccupancyServiceTest#findCurrentOccupancySummary_nullStayKindForLegacyOccupancy` | **PASS** |
| `OccupancyServiceTest#findBedOccupant_exposesPersistedStayKind` | **PASS** |
| `OccupancyServiceTest#getMemberOccupancies_preservesHistoricalStayKindsPerOccupancy` | **PASS** (current MONTHLY + prior SHORT) |

Command (backend repo):

```text
.\mvnw.cmd "-Dtest=SpacePaymentResponseStayKindTest" test
.\mvnw.cmd "-Dtest=OccupancyServiceTest#findCurrentOccupancySummary_exposesPersistedStayKind+findCurrentOccupancySummary_nullStayKindForLegacyOccupancy+findBedOccupant_exposesPersistedStayKind+getMemberOccupancies_preservesHistoricalStayKindsPerOccupancy" test
```

## 7. Frontend API contract updates (additive)

Optional `stayKind` typed on clients so payments / member summary can consume the new field without inventing values:

| Client | File | Change |
|---|---|---|
| Web | `src/shared/types/payments.ts` | `SpacePaymentResponse.stayKind?` |
| Web | `src/shared/types/member.ts` | `CurrentOccupancySummary.stayKind?` |
| Web | `src/shared/types/accommodation.ts` | `BedOccupantSummary.stayKind?` |
| Android | `src/api/types.ts` | `SpacePaymentResponse.stayKind?`, `CurrentOccupancySummaryResponse.stayKind?`, `BedOccupantSummaryResponse.stayKind?` |

`OccupancyResponse.stayKind` was already typed on both clients.
Wiring payment UI display to the new field is a follow-up (display helpers already exist); this deliverable stops at API + types.

## 8. Confirmations

- Payment generation, due status, reminders, OPEN_ENDED billing: **unchanged**
- StayKind business rules (`MONTHLY` / `SHORT` / `OPEN_ENDED`): **unchanged**
- Mess/Tiffin: **untouched**
- No DB migration; no duplicate denormalized payment column
- Aggregated dashboard/ledger totals: **no** Stay Type field added
- Historical stays: Stay Type taken from **that** occupancy row, not the member’s current stay

## 9. Backend files touched

- `payment/api/dto/response/SpacePaymentResponse.java`
- `occupancy/api/dto/response/CurrentOccupancySummaryResponse.java`
- `occupancy/api/dto/response/BedOccupantSummaryResponse.java`
- `occupancy/application/service/OccupancyService.java`
- `payment/api/dto/response/SpacePaymentResponseStayKindTest.java` (new)
- `occupancy/application/service/OccupancyServiceTest.java` (new cases)
