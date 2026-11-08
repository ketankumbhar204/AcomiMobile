# Rooms — Property Operations Filter Cards Report

**Date:** 2026-11-07
**Scope:** Rooms (`AccommodationHomeScreen`) Property Operations filter-card UI only.
**Constraint:** No changes to Quick Actions, Buildings list, FAB, bottom tabs, or other sections below Property Operations.

---

## Summary

Property Operations on Rooms now matches the reference:

| Control | Visual | Behaviour |
|---------|--------|-----------|
| Occupied | Green pastel KPI | Existing `toggleOpsFocus('OCCUPIED')` |
| Available | Purple pastel KPI | Existing `toggleOpsFocus('VACANT')` |
| Reserved | Orange pastel KPI | Existing `toggleOpsFocus('RESERVED')` → reserved inventory only |
| Pending payments | Full-width pink banner | Existing `toggleOpsFocus('PENDING_PAYMENTS')` |

Filter handlers were **not** replaced with visual-only cards. Click wiring remains on `AccommodationHomeScreen`.

---

## Files changed

| File | Change |
|------|--------|
| `src/screens/accommodation/AccommodationHomeScreen.tsx` | Subtitle copy; keeps Occupied/Available/Reserved/Pending handlers |
| `src/components/dashboard/DashboardAccommodationOperations.tsx` | Compact 3-card Occupied / Available / Reserved row (no corner chevrons) |
| `src/components/dashboard/DashboardPendingPaymentsBanner.tsx` | Spacing under the KPI row |
| `src/components/dashboard/shared/DashboardStatCard.tsx` | Optional `showChevron` (Rooms filter cards hide chevron) |
| `src/components/accommodation/AccommodationOpsFocusInventory.tsx` | `RESERVED` focus filter (from prior pass; preserved) |
| `src/utils/accommodationOpsFocusScroll.ts` | Inline scroll includes `RESERVED` |
| `src/hooks/useDashboardAccommodationOperationsQuick.ts` | Reserved bed count via `status: 'RESERVED'` |
| `src/i18n/locales/en.json` | Short labels + “Current bed status…” subtitle |
| This report | New |

Sections **below** Property Operations (Quick Actions, Buildings, search, building cards, FAB, tabs) were not redesigned.

---

## Existing filter handlers preserved

From `AccommodationHomeScreen`:

```ts
handleOccupiedBedsPress  → toggleOpsFocus('OCCUPIED')
handleVacantBedsPress    → toggleOpsFocus('VACANT')
handleReservedBedsPress  → toggleOpsFocus('RESERVED')
handlePendingPaymentsPress → toggleOpsFocus('PENDING_PAYMENTS')
```

`DashboardAccommodationOperations` / `DashboardPendingPaymentsBanner` only invoke the callbacks passed from the screen. Selected state still uses `selectedOpsMetricId` (`occupied` | `vacant` | `reserved` | `pendingPay`).

Inline results still render via `AccommodationOpsFocusInventory` / `UnitOpsFocusList` with the same scroll behaviour (`isInlineOpsResultsFocus` includes `RESERVED`).

---

## Reserved filter implementation and data source

| Layer | Detail |
|-------|--------|
| Count (summary) | `DashboardAccommodationOperations.reservedBeds` from `dashboard-summary` when present |
| Count (fallback) | `useDashboardAccommodationOperationsQuick` → `accommodationApi.searchBeds({ status: 'RESERVED', size: 1 }).totalElements` |
| Unit-level spaces | `useUnitLevelOccupancyCounts` → `applyUnitOccupancyCounts` maps `reserved` → `reservedBeds` |
| Filter list | `AccommodationOpsFocusInventory` loads/filters beds with `status === 'RESERVED'` |
| Unit filter list | `UnitOpsFocusList` with `status: 'RESERVED'` |

Reserved inventory is **not** counted as Available or Occupied. Cancelled/expired reservations that no longer leave a `RESERVED` bed/unit status are excluded by using inventory status, not a separate guess.

---

## Count calculation source

| Metric | Source field | Filter shown |
|--------|--------------|--------------|
| Occupied | `operations.occupiedBeds` | `OCCUPIED` beds/units |
| Available | `operations.vacantBeds` | `AVAILABLE` beds/units |
| Reserved | `operations.reservedBeds` | `RESERVED` beds/units |
| Pending payments | `operations.pendingPaymentsCount` | Existing pending-payments focus |

Authoritative path prefers cached dashboard accommodation operations; quick bed/unit counts fill gaps. Pull-to-refresh reloads buildings + quick ops + unit occupancy.

---

## Visual notes (reference match)

- Three equal-width pastel cards in one row; short labels Occupied / Available / Reserved.
- No chevrons on the three KPI cards (reference).
- Pending payments banner full width below with rupee icon, subtitle, count, chevron.
- Section subtitle: “Current bed status across all buildings” (units wording for Rental/Corporate).

---

## Tests executed and results

| Check | Result |
|-------|--------|
| `propertyOpsFocus` reserved mapping (prior unit tests) | Pass |
| Handler wiring Occupied → `OCCUPIED` | Preserved (code review) |
| Handler wiring Available → `VACANT` | Preserved (code review) |
| Handler wiring Reserved → `RESERVED` + inventory filter | Preserved (code review) |
| Handler wiring Pending → `PENDING_PAYMENTS` | Preserved (code review) |
| Lower Rooms sections unmodified | Verified by diff scope (Quick Actions / Buildings / FAB untouched in this pass) |

Device matrix (PG / Hostel / Co-living / Rental / Corporate, cancel/expire/move-in) recommended on a Metro reload; not fully automated in this pass.

---

## Screenshots

- **After (target):** Attached Rooms reference (Occupied 3 / Available 92 / Reserved 1 / Pending 4).
- **Before:** Prior Rooms Property Operations used Occupied / Vacant / Move-ins (+ optional Pending KPI tile) without a dedicated Reserved card or pink pending banner.

Capture an on-device “after” shot after reload for QA attachment.

---

## Unresolved backend / API gaps

1. Reserved accuracy depends on inventory `RESERVED` status remaining correct after cancel, expiry, and move-in. If the API ever leaves stale `RESERVED` beds, the UI will reflect that — no client-side reservation-lifecycle recompute was added.
2. Dashboard-summary `reservedBeds` must stay aligned with bed-search totals; when summary is missing, the client falls back to bed search `totalElements` for `RESERVED` only.
3. No separate “rejected reservation” client filter exists beyond inventory status.

---

## Acceptance

- [x] Property Operations UI matches the three-card + pending banner reference
- [x] Occupied / Available / Pending keep existing touch behaviour
- [x] Reserved added as a working inventory filter
- [x] Sections below Property Operations unchanged
- [x] No Property Overview / Payment Summary added to Rooms

*End of report.*
