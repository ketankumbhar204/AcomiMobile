# Meals — Web (Phase 5)

Desktop Meals Management module for CountIn Web. Mobile remains the business source of truth for APIs, DTOs, permissions, validation, poll/menu lifecycle, and terminology. Presentation uses a **planner workspace** (today + tomorrow, Breakfast/Lunch/Dinner together) instead of stacked mobile screens.

---

## Scope

**In scope**

- Meals planner hub (today / tomorrow / date navigation)
- Slot edit drawer (combos + items → upsert + publish)
- Publish / open / close poll from slot cards
- Share preview (publish selected slots + open polls + copy message)
- Menu library (items / combos / extras for MESS)
- Delivery locations table (MESS-oriented manage API)
- Meal participation list (pause / resume / stop)
- Member poll response page
- Permission gate `canViewMeals` / manage flags

**Out of scope**

- Payments module (day-meal bulk pay / proof approval queues)
- Complaints, Inventory, Reports, Settings, Profile
- Full subscription-plan admin UI (meal-balance already on Members; plans deferred as secondary)
- Backend contract changes
- Drag-and-drop planning

---

## Desktop architecture

```
┌──────────────────────────────────────────────────────────────┐
│ Breadcrumb · Meals planner · Date · Library / Share actions  │
├─────────────────────┬─────────────────────┬──────────────────┤
│ Today B/L/D slots   │ Tomorrow B/L/D      │ Day inspector    │
│ Edit · Publish      │ Edit · Share        │ Headcount        │
│ Poll open/close     │                     │ Share shortcut   │
└─────────────────────┴─────────────────────┴──────────────────┘
```

Nested routes keep library, locations, participation, share, and poll response one click away without losing planner context via breadcrumbs.

---

## Routes

| Path | Purpose |
|------|---------|
| `/spaces/:spaceId/meals` | Planner workspace (`?date=`) |
| `/spaces/:spaceId/meals/library` | Menu library |
| `/spaces/:spaceId/meals/locations` | Delivery locations |
| `/spaces/:spaceId/meals/participation` | Participation roster |
| `/spaces/:spaceId/meals/share` | Share / publish |
| `/spaces/:spaceId/meals/poll` | Member poll response |

Guarded by `MealsPermissionGate` (`canViewMeals`). Manage-only pages check `canManageMeals` / `canManageMealParticipation`.

---

## API reuse

| Area | Endpoints |
|------|-----------|
| Daily menus | today/by-date/range/get, upsert, publish, delete, copy-from |
| Library | food-categories, food-items (+ price/extra/deactivate), meal-combos |
| Polls | list by date, open, close, submit responses |
| Ops | eligibility-summary, share-preview, headcount |
| Participation | list/create/update/pause/resume/stop |
| Delivery | active + manage list, create, update, reorder |

DTOs in `shared/types/meals.ts` aligned with mobile/backend. **No backend changes.**

---

## Permissions

| Flag | Who |
|------|-----|
| `canViewMeals` | Any membership role |
| `canManageMeals` | OWNER, MANAGER |
| `canManageMealParticipation` | OWNER, MANAGER |
| `canViewOwnMealParticipation` | OWNER, MANAGER, TENANT, CUSTOMER |

MESS shows extras tab and meal prices (`usesSeparateMealBilling`). Delivery manage APIs are Mess-oriented on the backend.

---

## Responsive behavior

| Breakpoint | Behavior |
|------------|----------|
| **xl** | Today + tomorrow + inspector |
| **md–lg** | Today / tomorrow stacked; inspector below or omitted |
| **&lt;md** | Single column; slot cards full width; drawers for editors |

No horizontal scroll. Ctrl/Cmd+K focuses library search.

---

## Accessibility

- Date controls and slot actions keyboard reachable
- Poll radios with labels
- Sticky footers for save/publish/submit
- Status chips with text (not color alone)

---

## Performance

- Per-date Query keys for menus/polls/headcount
- Library lists staleTime 20–30s
- Mutation invalidation scoped to meal query prefixes
- Slot editor loads combos/items only when open

---

## Reusable components

| Component | Role |
|-----------|------|
| `MealSlotCard` | Compact B/L/D card with status + actions |
| `SlotEditorDrawer` | Dual-tab combo/item picker + save/publish |
| `MealsPermissionGate` | Route guard |
| `MealsPlannerPage` | Three-column planner |
| Library / Locations / Participation / Share / Poll pages | Nested ops |

Shared: `PageHeader`, `DataTable`, `StatCard`, `SidePanel`, `AppDrawer`, `StickyFooter`, `StatusChip`.

---

## Desktop improvements vs mobile

- Today and tomorrow visible together (no screen hop)
- Inspector headcount beside planner
- Library as DataTable with filters
- Share as dedicated page with live preview
- Fewer clicks from dashboard Quick Action → planner

---

## Stop condition

Phase 5 ends when Meals is production-ready. **Do not start Payments.**
