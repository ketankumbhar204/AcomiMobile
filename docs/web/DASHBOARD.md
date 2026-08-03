# Dashboard — Web (Phase 2)

Desktop equivalent of the React Native space Dashboard. Mobile remains the source of truth for APIs, DTOs, permissions, role handling, and terminology. This document covers only the Dashboard module.

---

## Scope

**In scope**

- Space-scoped Dashboard home
- Operator vs member/tenant branching (same as mobile `canManageNotifications`)
- KPI widgets: payments, accommodation ops, meals ops (when present)
- Quick Actions (desktop cards; unimplemented destinations show “coming soon”)
- Pending Actions panel + full Pending Actions page (`DataTable`)
- Drill-downs: Occupancy list, Bed inventory
- Space shell (sidebar + header + space switcher)
- Space bootstrap via `GET /spaces/my`

**Out of scope (later phases)**

- Members, Accommodation builder, Occupancy wizard, Meals, Payments, Complaints, Inventory modules
- Space Health / Setup lifecycle engines (mobile-only for now; not ported)
- Global multi-space attention home
- Backend contract changes

---

## Routes

| Path | Page |
|------|------|
| `/` | Redirect to selected space dashboard or `/no-spaces` |
| `/no-spaces` | Empty state when `GET /spaces/my` is empty |
| `/spaces/:spaceId/dashboard` | Dashboard home |
| `/spaces/:spaceId/pending-actions` | Pending Actions |
| `/spaces/:spaceId/occupancy?mode=active\|moveInsThisMonth` | Occupancy list |
| `/spaces/:spaceId/bed-inventory?status=` | Bed inventory |

---

## Desktop layout

```
Sidebar (Dashboard, Pending Actions) | Header (space name, switcher, logout)
--------------------------------------------------------------------------------
Breadcrumb · Page title · Refresh
--------------------------------------------------------------------------------
KPI / summary widgets (Payment · Property · Meals)
--------------------------------------------------------------------------------
Quick Actions (7-col)          | Pending Actions preview (5-col)
--------------------------------------------------------------------------------
```

Breakpoints follow `responsive-strategy.md` (1920 → 768). KPI and quick-action grids reflow from 4 → 2 → 1 columns.

---

## Architecture

```
modules/dashboard/
  api/          dashboardApi, notificationsApi, dashboardDrilldownApi
  hooks/        useSpaceDashboard, usePendingActions, useSpaceOccupancyList, useSpaceBedInventory
  components/   widgets + quick actions + pending panel
  pages/        Dashboard, Pending, Occupancy, Beds, NoSpaces
  layouts/      SpaceBootstrapOutlet, SpaceShellLayout
store/spaceStore.ts
shared/utils/   spacePermissions, spaceOperator, dashboardFinancial
shared/types/   space, dashboard
```

State: TanStack Query for server data; Zustand for auth + selected space.

---

## API reuse (unchanged backend)

| Endpoint | Usage |
|----------|--------|
| `GET /spaces/my` | Space list + permissions + role |
| `GET /spaces/{id}/dashboard-summary?month=YYYY-MM` | Owner/operator KPIs + embedded pending summary |
| `GET /spaces/{id}/pending-actions?month=YYYY-MM` | Pending actions list / badge |
| `GET /spaces/{id}/occupancies?status=ACTIVE` | Occupancy drill-down |
| `GET /spaces/{id}/beds?status=` | Bed inventory drill-down |

DTOs align with mobile `DashboardSummaryResponse`, `PendingActionsSummary`, `OccupancyResponse`, `BedSpaceListItemResponse`.

Permissions: same derivation as mobile (`resolveSpacePermissions` / `canManageNotifications`). Operator dashboard requires operational permissions (not raw OWNER).

---

## Design decisions

1. **No stretched mobile UI** — widget grid + sidebar chrome; cards for interaction.
2. **Quick Actions to future modules** — snackbar `common.comingSoon` instead of stub routes.
3. **Mess operations** — backend currently returns `messOperations: null`; widget shows empty state (same as mobile fallback path).
4. **Space Health / Setup Progress** — deferred; depends on lifecycle engines outside Phase 2.
5. **i18n** — keys mirrored from mobile `dashboard.*` where applicable.

---

## Reusable components (future modules)

| Component | Role |
|-----------|------|
| `PageHeader` / `PageContainer` / `PageSection` | Page chrome |
| `StatCard` / `WidgetCard` / `ActionCard` | Dashboard / KPI patterns |
| `DataTable` | Pending, occupancy, beds (sorting, search, empty, responsive cards) |
| `SectionHeader` | Section titles inside grids |
| `EmptyState` / `LoadingState` / `ErrorState` | Async UX |

---

## Accessibility

- Landmark main content via `AppLayout`
- Breadcrumb `aria-label`
- Action cards keyboard focus ring
- Stat cards clickable only when drill-down permitted
- Space switcher labeled
- Loading regions use `role="status"`

---

## Performance

- Query `staleTime: 30s` for dashboard / pending / lists
- Dashboard summary timeout 120s (matches mobile)
- Occupancy / beds fetched once (size 500) then filtered client-side (same as mobile hooks)
- Space list loaded once per session bootstrap

---

## Future reuse

Space shell, permission hooks, and widget cards are the foundation for Members and later modules. Do not reimplement tables or page chrome per module.
