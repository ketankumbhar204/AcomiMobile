# Accommodation & Occupancy — Web (Phase 4)

Desktop Accommodation & Occupancy module for CountIn Web. Mobile remains the business source of truth for APIs, DTOs, permissions, validation, hierarchy rules, and occupancy workflows. Presentation uses a **three-panel operational workspace** instead of stacked mobile screens.

---

## Scope

**In scope**

- Accommodation home as a central workspace (hierarchy tree + room/bed center + inspector)
- Buildings / Floors / Units / Rooms / Beds CRUD (drawers)
- Layout-mode–aware hierarchy (`CORRIDOR_PG`, `APARTMENT_PG`, `CO_LIVING`, `RENTAL`)
- Quick Setup Wizard (preview + idempotent execute)
- Occupancy Wizard: Allocate, Reserve, Move-in, Transfer, Vacate / cancel reservation
- Card / table view modes (persisted)
- Ctrl+K hierarchy search
- Permission gates (`canViewAccommodation`, `canManageAccommodation`, `canManageOccupancy`)
- MESS spaces excluded (not applicable)

**Out of scope**

- Meals, Payments, Complaints, Inventory, Reports
- Floor-plan / builder canvas
- Backend contract changes
- Notifications / Settings modules

---

## Desktop architecture

```
┌─────────────┬──────────────────────────┬─────────────────┐
│ Hierarchy   │ Room / Bed workspace     │ Inspector       │
│ Tree        │ Cards or Table           │ Details +       │
│ Search      │ Quick add child          │ Occupancy       │
│             │                          │ actions         │
└─────────────┴──────────────────────────┴─────────────────┘
```

| Panel | Responsibility |
|-------|----------------|
| **Left — HierarchyTree** | Lazy-loaded expandable tree: Building → Floor/Unit → Room |
| **Center — CenterWorkspace** | Context children (floors/units/rooms/beds) in cards or DataTable |
| **Right — EntityInspector** | Entity details + occupancy quick actions (allocate / reserve / transfer / vacate) |

Entity create/edit uses `EntityFormDrawer` (sticky footer). Occupancy mutations open `OccupancyWizardPage`. Bulk structure creation uses `QuickSetupWizardPage` **and** in-workspace `BulkCreateDialog` (beds under room; rooms under floor/unit) calling the same mobile bulk APIs.

---

## Routes

| Path | Purpose |
|------|---------|
| `/spaces/:spaceId/accommodation` | Three-panel workspace |
| `/spaces/:spaceId/accommodation/quick-setup` | Quick Setup Wizard |
| `/spaces/:spaceId/occupancy/wizard?mode=…` | Occupancy Wizard (`ALLOCATE` \| `RESERVE` \| `MOVE_IN` \| `TRANSFER` \| `VACATE`) |

Guarded by `AccommodationPermissionGate` → `/forbidden` when `!canViewAccommodation`.

Dashboard drill-downs (`/occupancy`, `/bed-inventory`) remain list views from Phase 2; the workspace is the operational hub.

---

## Hierarchy strategy

UI profile from `getAccommodationUiProfile(spaceType, layoutMode)` mirrors mobile:

| Layout | Tree |
|--------|------|
| `CORRIDOR_PG` | Building → Floor → Room → Bed |
| `APARTMENT_PG` | Building → Floor → Unit → Room → Bed |
| `CO_LIVING` | Building → Unit → Room → Bed |
| `RENTAL` | Building → Unit (no rooms/beds in tree) |

Children load on expand (TanStack Query). Rooms are selection leaves in the tree; beds appear in the center pane.

---

## Occupancy flows

Wizard steps follow mobile `occupancyWizardSteps.ts` (skip member/target when prefilled from inspector).

| Mode | Typical steps |
|------|----------------|
| ALLOCATE | target? → member? → contract → review |
| RESERVE | target? → member? → reserve_dates → review |
| MOVE_IN | contract → review |
| TRANSFER | member? → transfer_current → target → contract → review |
| VACATE | member? → vacate_confirm (cancel reservation when status is RESERVED) |

Request builders: `buildAllocateRequest`, `buildReserveRequest`, `buildTransferRequest` + `getAllowedTargetTypes` (BED for PG/HOSTEL, BED|ROOM for CO_LIVING, UNIT for RENTAL).

---

## API reuse

| Area | Endpoints |
|------|-----------|
| Buildings | `GET/POST/PUT .../buildings`, summary, deactivate |
| Floors | list/create/update under building |
| Units | list by building or floor, create, update |
| Rooms | list by floor/unit, create, update |
| Beds | list by room, get, create, update, deactivate/restore, space search |
| Setup | `POST .../accommodation/setup/preview`, `POST .../setup` + `Idempotency-Key` |
| Targets | `GET .../accommodation/allocation-targets` |
| Occupancy | allocate, reserve, move-in, transfer, vacate, cancel-reservation, get/list, member occupancies |

DTOs live in `shared/types/accommodation.ts` — aligned with mobile/backend. **No backend changes.**

---

## Permissions

| Capability | Roles (non-MESS) |
|------------|------------------|
| `canViewAccommodation` | OWNER, MANAGER, STAFF |
| `canManageAccommodation` | OWNER, MANAGER |
| `canDeactivateAccommodation` | OWNER |
| `canManageOccupancy` | OWNER, MANAGER |

---

## Responsive behavior

| Breakpoint | Behavior |
|------------|----------|
| **≥lg** | Three columns: tree + center + inspector |
| **md–lg** | Tree + center; inspector in drawer |
| **&lt;md** | Center only; hierarchy and inspector open as drawers |

No horizontal scroll; inspector becomes drawer on smaller screens.

---

## Accessibility

- Keyboard focus on search via **Ctrl/Cmd+K**
- Toggle buttons labeled for card/table view
- Tree expand/collapse icon buttons with aria labels
- Wizard stepper + sticky footer Cancel / Back / Continue
- Status chips and Lucide icons with text labels (no icon-only primary actions)

---

## Performance

- Hierarchy children fetched only when nodes expand / selection requires them
- Query `staleTime` 10–20s on list endpoints
- Broad invalidation after mutations refreshes buildings/floors/rooms/beds/occupancy keys
- View mode persisted in `localStorage` (`countin.accommodation.viewMode`)

---

## Reusable components created

| Component | Role |
|-----------|------|
| `HierarchyTree` | Expandable property tree |
| `CenterWorkspace` | Context-aware card/table pane |
| `EntityInspector` | Detail + occupancy actions |
| `EntityFormDrawer` | Create/edit entity forms |
| `AccommodationPermissionGate` | Route guard |
| `AccommodationWorkspacePage` | Three-panel shell |
| `QuickSetupWizardPage` | Desktop setup stepper |
| `OccupancyWizardPage` | Desktop occupancy stepper + side summary |

Shared reuse: `PageHeader`, `PageContainer`, `DataTable`, `SidePanel`, `AppDrawer`, `StickyFooter`, `StatusChip`, `EmptyState`, `SearchToolbar` patterns.

---

## Desktop improvements vs mobile

- Fewer clicks: allocate/vacate from inspector without leaving hierarchy context
- Persistent tree selection + breadcrumb context
- Card/table toggle remembered
- Wizard side summary panel (member + accommodation)
- Quick Setup and Occupancy wizards as full-page steppers with sticky footer

---

## Stop condition

Phase 4 ends when Accommodation & Occupancy are production-ready. **Do not start Meals.**
