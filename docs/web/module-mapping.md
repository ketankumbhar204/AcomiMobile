# Module Mapping — Mobile → Web

For every CountIn product module: mobile screens → web pages → shared APIs → shared components → new desktop components.

---

## Legend

| Term | Meaning |
|------|---------|
| Shared APIs | Existing `src/api/*` clients — reuse as-is |
| Shared components | Logic/props portable; visual rebuild on web |
| New desktop components | Only make sense on large screens |

---

## 1. Authentication

| Layer | Mapping |
|-------|---------|
| **Mobile screens** | `LoginScreen`, `OtpScreen` |
| **Web pages** | `/login`, `/otp` |
| **Shared APIs** | `authApi.sendOtp`, `verifyOtp`, `getMe` |
| **Shared components** | `AuthHero`, `OtpInput`, `FormInput`, `Button` |
| **New desktop** | Centered auth card in branded full-bleed layout; optional QR/deeplink panel later |
| **Desktop pattern** | Keep identical (single-column form) |

---

## 2. Onboarding

| Layer | Mapping |
|-------|---------|
| **Mobile screens** | `OnboardingChoiceScreen`, `JoinSpaceScreen`, `AcceptInvitationsScreen`, `CompleteProfileScreen`, `ProfileCompletionGateScreen` |
| **Web pages** | `/onboarding`, `/join-space`, `/accept-invitations`, `/complete-profile` (**Phase 9**) |
| **Shared APIs** | `authApi.completeProfile/updateMe`, `memberApi` invitations, `spaceApi` |
| **Shared components** | `AuthHero`, `OnboardingChoiceCard`, `InvitationCard`, profile fields |
| **New desktop** | Two-column choice (Create \| Join) side-by-side; invitation table with bulk accept |
| **Desktop pattern** | Card grid for choice; table for invitations |

---

## 3. Spaces (global)

| Layer | Mapping |
|-------|---------|
| **Mobile screens** | `MySpacesScreen`, `CreateSpaceScreen`, `SpaceDetailsScreen`, `EditSpaceScreen`, `GlobalAttentionListScreen`, `GlobalActivityListScreen`, `HomeScreen` (legacy) |
| **Web pages** | `/my-spaces`, `/create-space`, `/spaces/:id/details` (+ **deactivate** P12), `/spaces/:id/edit` (**Phase 9**); `/global/attention`, `/global/activity` (**Phase 11**) |
| **Shared APIs** | `mySpacesApi`, `spaceApi`, `dashboardApi.getGlobalDashboard`, `notificationsApi` |
| **Shared components** | `ListCard`, `GlobalAttentionCard`, `RecentActivityCard`, `SpaceAmenitiesField`, `SpaceTypePicker`, `SpaceStatusChip` |
| **New desktop** | My Spaces cards + global attention/activity pages |
| **Desktop pattern** | Summary cards → full lists; deep-link into space pending actions / modules |

---

## 4. Profile & Settings ✅ Phase 11 (profile/language)

| Layer | Mapping |
|-------|---------|
| **Mobile screens** | `ProfileScreen` (+ language, docs); space meal settings live in `EditSpaceScreen` |
| **Web pages** | `/profile`; edit via `/complete-profile?mode=edit`; meal settings on Edit Space (Phase 9) |
| **Shared APIs** | `authApi` complete/refresh |
| **Shared components** | `LanguagePicker`, profile cards |
| **Skipped** | Dedicated Preferences hub / Help-About (not productized on mobile); Space Health deferred |
| **Theme** | Existing header theme toggle |
| **Desktop pattern** | Two-column profile cards |
---

## 5. Dashboard

| Layer | Mapping |
|-------|---------|
| **Mobile screens** | `DashboardScreen`, `DashboardPendingActionsScreen`, `DashboardSpaceHealthScreen`, `DashboardOccupancyListScreen`, `DashboardBedInventoryScreen` |
| **Web pages** | `/spaces/:spaceId/dashboard`, `/pending-actions`, `/occupancy`, `/bed-inventory` (**Phase 2 shipped**; `/health` deferred) |
| **Shared APIs** | `dashboardApi`, `notificationsApi.getPendingActions`, occupancy + beds list APIs |
| **Shared components** | KPI/stat cards, meal/accommodation ops widgets, pending panel, `DataTable` drill-downs |
| **New desktop** | Multi-column dashboard widgets; pending actions side panel; bed inventory filterable table |
| **Desktop pattern** | **Dashboard widget grid** (2–3 columns); drill-downs → **table** |
| **Docs** | [DASHBOARD.md](./DASHBOARD.md) |

---

## 6. Members

| Layer | Mapping |
|-------|---------|
| **Mobile screens** | `MembersScreen`, `AddMemberScreen`, `EditMemberScreen`, `InviteMemberScreen`, `MemberDetailsScreen`, subscription / payments / occupancy history |
| **Web pages** | `/spaces/:spaceId/members` + `/members/:memberId` master-detail (**Phase 3 shipped**); Add/Edit drawer; Invite dialog |
| **Shared APIs** | `memberApi`, meal-balance, occupancy, payments `?memberId=` |
| **Shared components** | Badges → `StatusChip`; tabs → inspector tabs; list → `DataTable` |
| **New desktop** | **Members workspace** (table + inspector); bulk invite; persistent filters |
| **Desktop pattern** | **Table + master-detail** |
| **Docs** | [MEMBERS.md](./MEMBERS.md) |

---

## 7. Accommodation

| Layer | Mapping |
|-------|---------|
| **Mobile screens** | Home, Builder, QuickSetup, Floors, Units, FloorApartments, Rooms, Beds, Building/Floor/Unit/Room/Bed Detail + Form (18 screens) |
| **Web pages** | `/spaces/:spaceId/accommodation` three-panel workspace (**Phase 4 shipped**); Quick Setup at `/accommodation/quick-setup`; forms as drawers |
| **Shared APIs** | `accommodationApi` (buildings/floors/units/rooms/beds/setup/allocation-targets) |
| **Shared components** | Hierarchy tree, center workspace, entity inspector, entity form drawer |
| **New desktop** | Hierarchy **tree** + room/bed pane + inspector; card/table toggle; Ctrl+K search |
| **Desktop pattern** | **Three-panel workspace**; forms → **side drawer**; builder canvas deferred |

See [ACCOMMODATION.md](./ACCOMMODATION.md).

---

## 8. Occupancy

| Layer | Mapping |
|-------|---------|
| **Mobile screens** | `OccupancyWizardScreen` (+ steps); entry from bed/room/unit actions |
| **Web pages** | `/spaces/:spaceId/occupancy/wizard?mode=…` (**Phase 4 shipped** with Accommodation) |
| **Shared APIs** | `occupancyApi` (allocate, reserve, moveIn, transfer, vacate, cancel) |
| **Shared components** | Desktop stepper + side summary; member/target pickers; contract fields |
| **New desktop** | Multi-pane wizard (stepper \| form \| context summary); entry from inspector |
| **Desktop pattern** | **Wizard** (same steps as mobile); sticky footer |

---

## 9. Meals

| Layer | Mapping |
|-------|---------|
| **Mobile screens** | Home, DailyMenu*, SelectMenuHub, ComboForm, MenuLibrary, MenuPlanning, DeliveryLocations, SharePreview, PollResponse, SubscriptionPlans, CustomerSubscriptionPlans, ActivationRequests (14) |
| **Web pages** | `/spaces/:spaceId/meals` planner (**Phase 5**); `/meals/library`, `/locations`, `/participation`, `/share`, `/poll`; `/meals/plans`, `/meals/plans/customer`, `/payments/day-meals` (**Phase 10**) |
| **Shared APIs** | `mealsApi` (menus, library, polls, participation, delivery, share, headcount) |
| **Shared components** | MealSlotCard, SlotEditorDrawer, DataTable library/locations/participation |
| **New desktop** | Today+tomorrow planner; inspector headcount; library table; share preview page |
| **Desktop pattern** | Planning → **multi-column workspace**; library → **table**; poll → page |

See [MEALS.md](./MEALS.md).

---

## 10. Payments

| Layer | Mapping |
|-------|---------|
| **Mobile screens** | `PaymentsScreen`, `TenantPaymentsTabScreen`, `MemberPaymentsScreen`, `PaymentDetailScreen`, `PaymentReviewScreen`, `PaymentHistoryScreen`, `DayMealPaymentDetailScreen`, `DayMealBulkPayScreen` |
| **Web pages** | `/spaces/:spaceId/payments` workspace (**Phase 6 shipped**); deep link `…/payments/:paymentId`; tenant branch inside same route |
| **Shared APIs** | `paymentsApi` (list/get, proof, review, timeline, summary, members, review, history, sync) |
| **Shared components** | PaymentInspector, ReceiptPreview, ProofSubmitDrawer, DataTable, StatCard |
| **New desktop** | KPI strip + Members/Review/History tabs + inspector; member `?memberId=` filter |
| **Desktop pattern** | Owner: **table + inspector** (reference for Complaints/Inventory); tenant: table + proof drawer |

See [PAYMENTS.md](./PAYMENTS.md). Day-meal bulk pay + review: **Phase 10** (`/payments/day-meals`). See [MEAL_SUBSCRIPTION_BILLING.md](./MEAL_SUBSCRIPTION_BILLING.md).

---

## 11. Complaints

| Layer | Mapping |
|-------|---------|
| **Mobile screens** | `ComplaintsListScreen`, `RaiseComplaintScreen`, `ComplaintDetailScreen` |
| **Web pages** | `/spaces/:spaceId/complaints` workspace (**Phase 7 shipped**); deep link `…/complaints/:complaintId` |
| **Shared APIs** | `complaintsApi` (list/get/create/status/comments/attachments/reopen/assign/resolution) |
| **Shared components** | ComplaintInspector, RaiseComplaintDrawer, DataTable, StatCard |
| **New desktop** | KPI strip + filters + assign dropdown; raise drawer |
| **Desktop pattern** | **Master-detail** (Payments reference); raise → drawer |

See [COMPLAINTS.md](./COMPLAINTS.md).

---

## 12. Inventory

| Layer | Mapping |
|-------|---------|
| **Mobile screens** | `InventoryDashboardScreen`, `InventoryItemDetailsScreen`, `InventoryItemFormScreen` (categories/suppliers/txns unwired) |
| **Web pages** | `/spaces/:spaceId/inventory` workspace (**Phase 8 shipped**); deep link `…/inventory/items/:itemId` |
| **Shared APIs** | `inventoryApi` (dashboard, items CRUD, stock-moves, transactions, categories, suppliers) |
| **Shared components** | ItemInspector, ItemFormDrawer, StockMoveDrawer, DataTable, StatCard |
| **New desktop** | Categories / suppliers / transactions tabs; adjust stock; KPI strip |
| **Desktop pattern** | **Catalog-first** table + inspector (Payments reference) |

See [INVENTORY.md](./INVENTORY.md).

---

## 13. Notifications ✅ Phase 11

| Layer | Mapping |
|-------|---------|
| **Mobile screens** | `SpaceNotificationsScreen` |
| **Web pages** | `/spaces/:spaceId/notifications` + header `NotificationBellButton` |
| **Shared APIs** | `notificationsApi.listNotifications` / `markRead` / `getPendingActions` |
| **Shared components** | `NotificationBellButton`, inbox list (SearchToolbar + filters) |
| **Desktop pattern** | Full page inbox; deep-link to existing module routes (no resolve UI — unused on mobile) |

See [NOTIFICATIONS_GLOBAL_WORKSPACE.md](./NOTIFICATIONS_GLOBAL_WORKSPACE.md).

---

## 14. Reports (emerging)

Mobile has no dedicated Reports module. Closest:

| Mobile | Web opportunity |
|--------|-----------------|
| Dashboard financial snapshot | Exportable month reports |
| Global activity / attention | Cross-space ops report |
| Meal headcount | Daily ops report |
| Payment history / ledger | Finance export |

| Layer | Mapping |
|-------|---------|
| **Mobile screens** | Implicit via Dashboard + GlobalActivity + Payments |
| **Web pages** | `/reports` (phase 2+) — occupancy, meals, payments, inventory |
| **Shared APIs** | Existing dashboard/payments/meals APIs; prefer additive export endpoints later |
| **Shared components** | KPI cards, timelines |
| **New desktop** | Report builder, date ranges, CSV/PDF export |
| **Desktop pattern** | **Dashboard widgets** + tables — **do not change business workflows** |

---

## 15. Supporting systems (not user modules)

| System | Mobile | Web |
|--------|--------|-----|
| Coachmarks | `coachmarks/` | Optional product tour |
| Progressive workflow footers | `progressive/` | Sticky page footers / wizard chrome |
| Space lifecycle health | `spaceLifecycle/` | Dashboard health widgets |
| Query caches | `utils/*QueryCache*` | Prefer TanStack Query keys |

---

## Module count summary

| # | Module | Mobile screens (approx) | Web priority |
|---|--------|-------------------------|--------------|
| 1 | Authentication | 2 | P0 |
| 2 | Onboarding | 5 | P0 |
| 3 | Spaces | 7–8 | P0 |
| 4 | Profile/Settings | 1–2 | P0 |
| 5 | Dashboard | 5 | P0 |
| 6 | Members | 10 | P1 |
| 7 | Accommodation | 18 | P1 |
| 8 | Occupancy | 1 wizard | P1 |
| 9 | Meals | 14 | P2 |
| 10 | Payments | 8 | P2 |
| 11 | Complaints | 3 | P2 |
| 12 | Inventory | 7 | P3 |
| 13 | Notifications | 1 | P1 (shell) |
| 14 | Reports | 0 dedicated | P4 |

**Total product modules: 14** (13 live + Reports planned)  
**Total screen files: ~85** (+ Occupancy Wizard feature screen)

See [screen-inventory.md](./screen-inventory.md) for the full screen table.
