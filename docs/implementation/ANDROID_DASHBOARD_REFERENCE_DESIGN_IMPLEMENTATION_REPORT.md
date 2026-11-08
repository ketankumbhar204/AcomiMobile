# Android Dashboard — Reference Design Implementation Report

**Date:** 2026-11-07
**Reference:** Owner Dashboard screenshot (Sunrise PG 77)
**Scope:** Android (React Native) owner dashboard UI alignment to the reference, using live APIs. No backend financial rule changes.

---

## Summary

The Owner Dashboard was updated to match the reference layout:

1. Existing space header (home icon, property switcher, notification bell, overflow menu) retained.
2. New **Property Overview** card (image, name + edit, type, floors/rooms/beds, Active badge, availability %).
3. **Payment Summary** retitled layout: month controls on the header row; four tiles in a 2×2 grid.
4. **Property Operations** KPIs: Occupied / Available / Reserved (Reserved replaces Move-ins on this row).
5. **Pending payments** pink banner (record count → Payments pending filter).
6. **Recent Activity** rows for move-ins, reservations, and move-outs (with documented API gap for move-outs).
7. **Quick Actions**: Start Setup + Add Building horizontal pair for accommodation owners.
8. Bottom tabs unchanged (Dashboard / Members / Rooms / Meals / Payments).

Mess owner path keeps the previous greeting/health hero and Mess quick-action stack.

---

## Files changed

| Area | Path |
|------|------|
| Owner dashboard screen | `src/screens/dashboard/DashboardScreen.tsx` |
| Rooms home (ops parity) | `src/screens/accommodation/AccommodationHomeScreen.tsx` |
| Bed inventory drilldown | `src/screens/dashboard/DashboardBedInventoryScreen.tsx` |
| Ops inventory filter | `src/components/accommodation/AccommodationOpsFocusInventory.tsx` |
| Property overview | `src/components/dashboard/DashboardPropertyOverviewCard.tsx` *(new)* |
| Pending payments banner | `src/components/dashboard/DashboardPendingPaymentsBanner.tsx` *(new)* |
| Recent activity | `src/components/dashboard/DashboardRecentActivity.tsx` *(new)* |
| Setup quick actions | `src/components/dashboard/DashboardSetupQuickActions.tsx` *(new)* |
| Property ops KPIs | `src/components/dashboard/DashboardAccommodationOperations.tsx` |
| Payment summary | `src/components/dashboard/DashboardFinancialSnapshot.tsx` |
| Stat card grid | `src/components/dashboard/shared/DashboardStatCard.tsx` |
| Dashboard exports | `src/components/dashboard/index.ts` |
| Availability math | `src/utils/dashboardAvailability.ts` *(new)* |
| Ops focus helpers | `src/utils/propertyOpsFocus.ts`, `src/utils/accommodationOpsFocusScroll.ts` |
| Quick bed counts | `src/hooks/useDashboardAccommodationOperationsQuick.ts` |
| Navigation types | `src/navigation/types.ts` |
| i18n | `src/i18n/locales/en.json` |
| Tests | `src/utils/__tests__/dashboardAvailability.test.ts`, `propertyOpsFocus.test.ts` |

---

## Components reused or created

**Created**

- `DashboardPropertyOverviewCard` — property image (`EntityPhoto` + representative fallback), edit pencil, structure metrics, Active pill, availability ring (`HealthScoreRing`).
- `DashboardPendingPaymentsBanner` — light red banner with pending **count**.
- `DashboardRecentActivity` — three activity rows + View all.
- `DashboardSetupQuickActions` — Start Setup / Add Building.

**Reused**

- `SpaceDashboardHeader` / `SpaceSwitcher` / notification + overflow (header).
- `DashboardFinancialSnapshot` (layout updated; same ledger APIs).
- `DashboardStatCard`, `HealthScoreRing`, `EntityPhoto`, Lucide icons.
- Existing setup / building / payments / inventory navigation targets.

---

## APIs and data sources

| UI block | Source |
|----------|--------|
| Header name / address | `useSpaceStore` + `SpaceSwitcher` |
| Structure floors/rooms/beds/units | `useSpaceLifecycleSignals` → building summaries → `aggregateBuildingStructure` |
| Occupied / Available / Reserved | `dashboard-summary.accommodationOperations` (fallback: bed search counts including `RESERVED`) |
| Unit-level spaces | `useUnitLevelOccupancyCounts` + `applyUnitOccupancyCounts` |
| Payment Expected/Collected/Under Review/Pending | `useSpaceDashboard` / `useDashboardMonthFinancial` (authoritative ledger snapshot; UI does not recompute) |
| Pending payments **count** | `accommodationOperations.pendingPaymentsCount` |
| Move-ins this month | `accommodationOperations.moveInsThisMonth` |
| Reservation count | `accommodationOperations.reservedBeds` (active reserved inventory) |
| Space photo | `MySpaceResponse.photoFileId` / `selectedSpace.photoFileId` |
| Active flag | `selectedSpace.isActive` (defaults true when unknown) |

Availability % = `available ÷ total × 100` (`dashboardAvailability.ts`). Occupancy % is never used as availability.

---

## Icon assets used

Lucide (`lucide-react-native`): Home (header), Bell, MoreVertical (existing), Building2 / Layers / DoorOpen / BedDouble, Users, Bed, CalendarCheck2, Wallet, Inbox, Clock, IndianRupee, UserPlus, LogOut, Sparkles, Wrench, Pencil, Check, ChevronLeft/Right.

Representative pack images via `resolveListingCover` when no space photo exists.

---

## Navigation actions

| Control | Destination |
|---------|-------------|
| Property overview tap | `SpaceDetails` |
| Edit pencil | `EditSpace` |
| Occupied / Available / Reserved KPIs | `DashboardBedInventory` with matching status/focus (Rooms tab toggles inline focus) |
| Pending payments banner | Payments tab `initialFilter: 'pending'` |
| Recent Activity move-ins | Inventory focus `moveIns` |
| Recent Activity reservations | Inventory focus `reserved` |
| View all | `GlobalActivityList` |
| Start Setup | `QuickSetupWizard` |
| Add Building | `BuildingForm` create |
| Payment summary tiles | Payments filters (all / collected / underReview / pending) |
| Bottom tabs | Unchanged |

---

## Tests executed and results

| Test | Result |
|------|--------|
| `dashboardAvailability.test.ts` | Targeted run (see CI / local Jest) |
| `propertyOpsFocus.test.ts` | Updated for `RESERVED` mapping |

Manual device matrix (PG / Hostel / Co-living / Rental / Corporate / Mess, empty inventory, mixed reserved, refunds) is **recommended** before release; not fully executed in this agent pass.

---

## Screenshots

Reference screenshot used as the design target (attached to the implementation request). Capture of the updated dashboard on-device should be attached by QA after a Metro reload on an owner PG space with mixed occupancy.

---

## Unresolved API gaps / limitations

1. **Move-outs this month** — `DashboardAccommodationOperations` has no `moveOutsThisMonth` / `lastMoveOutDate`. Recent Activity shows the row with “Count unavailable from API” and does **not** invent counts or dates.
2. **Last move-in / next reservation dates** — not on the dashboard summary. Subtitles fall back to “This calendar month” / “Active reservations”.
3. **Space `isActive` on My Spaces list** — overview uses `selectedSpace.isActive` when details are loaded; otherwise defaults to Active.
4. **Quick Actions** for READY accommodation owners now match the reference (Setup + Add Building). Legacy Residents / Meals / Payments dashboard rows are no longer the primary quick-action stack on that path (those destinations remain available via bottom tabs and other entry points).
5. Financial totals continue to come only from dashboard/ledger APIs; refund/cancel/retain behaviour is unchanged in this UI task.

---

## Acceptance checklist (implementation)

- [x] Header behaviour preserved
- [x] Property overview uses live structure + inventory counts
- [x] Availability % = available / total
- [x] Payment Summary month nav + four API-backed cards
- [x] Occupied / Available / Reserved KPIs with reserved ≠ available/occupied
- [x] Pending payments count banner
- [x] Recent Activity without fabricated move-out totals
- [x] Start Setup / Add Building wired to existing flows
- [x] Bottom navigation unchanged
- [x] No backend financial rule changes

*End of report.*
