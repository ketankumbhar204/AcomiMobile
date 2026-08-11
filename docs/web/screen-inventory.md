# Screen Inventory

Complete inventory of Amico mobile screens for web planning.

**Columns**

| Column | Meaning |
|--------|---------|
| Desktop complexity | S / M / L / XL |
| Reuse % | Shared logic (API/hooks/utils) estimable reuse — UI always rebuilt |
| Layout | Recommended desktop pattern |

Complexity: **S** form/list simple · **M** multi-section · **L** filters+actions · **XL** hierarchy/wizard/dense ops

---

## Authentication

| Screen | Purpose | Nav path | Backend APIs | Permissions | Complexity | Reuse % | Layout | Notes |
|--------|---------|----------|--------------|-------------|------------|---------|--------|-------|
| LoginScreen | Send OTP | Auth / Login | `sendOtp` | Public | S | 90 | Identical | |
| OtpScreen | Verify OTP | Auth / OtpVerification | `verifyOtp`, `getMe` | Public | S | 90 | Identical | |

---

## Onboarding

| Screen | Purpose | Nav path | Backend APIs | Permissions | Complexity | Reuse % | Layout | Notes |
|--------|---------|----------|--------------|-------------|------------|---------|--------|-------|
| OnboardingChoiceScreen | Create vs join | Main / OnboardingChoice | — | Authenticated | S | 85 | Card grid 2-col | |
| JoinSpaceScreen | Join via code/invite | Main / JoinSpace | invitations | Auth | M | 85 | Form 2-col | |
| AcceptInvitationsScreen | Accept pending | Main / AcceptInvitations | `getMyInvitations`, `acceptInvitation` | Auth | M | 85 | Table | Bulk accept on web |
| CompleteProfileScreen | Profile gate/edit | Main / CompleteProfile | `completeProfile`, `updateMe` | Auth | M | 90 | Form 2-col | |
| ProfileCompletionGateScreen | Gate UI | Typed; unwired | profile helpers | Auth | S | 80 | — | Orphan on mobile |

---

## Spaces & global

| Screen | Purpose | Nav path | Backend APIs | Permissions | Complexity | Reuse % | Layout | Notes |
|--------|---------|----------|--------------|-------------|------------|---------|--------|-------|
| MySpacesScreen | Space list | Main / MySpaces | `getMySpaces`, default space | Auth | M | 90 | Table/cards | Startup hub |
| CreateSpaceScreen | Create space | Main / CreateSpace | `createSpace` | Auth | M | 90 | Form 2-col | |
| SpaceDetailsScreen | Space summary | Main / SpaceDetails | `getSpaceById` | Member | M | 85 | 2-col | |
| EditSpaceScreen | Edit + meal settings | Main / EditSpace | `updateSpace`, billing/poll APIs | Manage space | L | 85 | Settings split | |
| GlobalAttentionListScreen | Cross-space todos | Main / GlobalAttentionList | global dashboard / pending | Ops | M | 80 | Table | |
| GlobalActivityListScreen | Cross-space activity | Main / GlobalActivityList | global dashboard | Ops | M | 80 | Table | |
| HomeScreen | Legacy home | Unwired | — | — | S | — | Skip | Legacy |

---

## Profile

| Screen | Purpose | Nav path | Backend APIs | Permissions | Complexity | Reuse % | Layout | Notes |
|--------|---------|----------|--------------|-------------|------------|---------|--------|-------|
| ProfileScreen | User profile/settings | Main / Profile | `getMe`, `updateMe`, docs | Auth | M | 85 | Settings split | Language picker |

---

## Dashboard

| Screen | Purpose | Nav path | Backend APIs | Permissions | Complexity | Reuse % | Layout | Notes |
|--------|---------|----------|--------------|-------------|------------|---------|--------|-------|
| DashboardScreen | Space home | `/spaces/:id/dashboard` | `getDashboardSummary`, pending | Space member | L | 85 | Widget grid | **Web shipped (Phase 2)** — operator vs tenant |
| DashboardPendingActionsScreen | Pending queue | `/spaces/:id/pending-actions` | `getPendingActions` | Ops / member | M | 85 | Table | **Web shipped** |
| DashboardSpaceHealthScreen | Health detail | — | lifecycle + summary | Ops | M | 80 | Widget | Deferred (lifecycle engine) |
| DashboardOccupancyListScreen | Occupancy list | `/spaces/:id/occupancy` | `listOccupancies` | View occupancy | M | 85 | Table | **Web shipped** — mode query |
| DashboardBedInventoryScreen | Beds by status | `/spaces/:id/bed-inventory` | `listBeds` | View accommodation | L | 80 | Table | **Web shipped** — floor plan later |

---

## Members

| Screen | Purpose | Nav path | Backend APIs | Permissions | Complexity | Reuse % | Layout | Notes |
|--------|---------|----------|--------------|-------------|------------|---------|--------|-------|
| MembersScreen | Member directory | `/spaces/:id/members` | `getMembers` | `canManageMembers` | L | 90 | Table + detail | **Web shipped (Phase 3)** |
| AddMemberScreen | Create member | Drawer on workspace | `createMember` | Manage members | M | 90 | Form/drawer | **Web shipped** |
| AddCustomersHubScreen | Add customers hub | — | members/meals | Manage | M | 80 | Card hub | Deferred |
| ImportExistingPeopleScreen | Cross-space import | API ready | `searchImportCandidates`, `importMember` | Manage | L | 85 | Table | Deferred |
| InviteMemberScreen | Invite | Dialog on workspace | `createInvitation` | Invite | M | 90 | Modal | **Web shipped** |
| MemberDetailsScreen | Member profile hub | `/members/:memberId` inspector | `getMember`, notes/meals | Manage | L | 85 | Master-detail | **Web shipped** — tabs in panel |
| EditMemberScreen | Edit member | Drawer | `updateMember` | Manage | M | 90 | Form/drawer | **Web shipped** |
| MemberOccupancyHistoryScreen | Occupancy history | Inspector tab | `getMemberOccupancies` | View | M | 85 | Table | **Web shipped** |
| MemberSubscriptionScreen | Create/edit/renew sub | Inspector Meals tab | meal balance | Manage | M | 85 | Form | **Web shipped** |
| MemberSubscriptionHistoryScreen | Sub history | Inspector Meals tab | `getSubscriptionHistory` | Manage | M | 85 | Table | **Web shipped** |
| MemberPaymentsScreen | Per-member payments | Inspector Payments tab | `listPayments?memberId=` | Manage | M | 85 | Table | **Web shipped** (month view) |

---

## Accommodation

| Screen | Purpose | Nav path | Backend APIs | Permissions | Complexity | Reuse % | Layout | Notes |
|--------|---------|----------|--------------|-------------|------------|---------|--------|-------|
| AccommodationHomeScreen | Buildings hub | `/spaces/:id/accommodation` | buildings, summary | View accommodation | L | 85 | Three-panel | **Web shipped** — tree+center+inspector |
| AccommodationBuilderScreen | Structure builder | — | hierarchy CRUD | Manage | XL | 75 | Split canvas | Deferred |
| QuickSetupWizardScreen | Guided setup | `/accommodation/quick-setup` | `previewSetup`, `executeSetup` | Manage | XL | 85 | Wizard | **Web shipped** |
| FloorsScreen | Floors list | Workspace center | floors APIs | View | M | 85 | Cards/table | **In workspace** |
| UnitsScreen | Units list | Workspace center | units APIs | View | M | 85 | Cards/table | **In workspace** |
| AccommodationFloorApartmentsScreen | Units on floor | Workspace center | units-by-floor | View | M | 85 | Cards | **In workspace** |
| AccommodationRoomsScreen | Rooms list | Workspace center | rooms APIs | View | M | 85 | Cards/table | **In workspace** |
| AccommodationBedsScreen | Beds list | Workspace center | beds APIs | View | L | 85 | Cards/table | **In workspace** |
| BuildingDetailScreen | Building detail | Inspector | building + summary | View | M | 85 | Inspector | **In workspace** |
| FloorDetailScreen | Floor detail | Inspector | floor | View | M | 85 | Inspector | **In workspace** |
| UnitDetailScreen | Unit detail | Inspector | unit | View | M | 85 | Inspector | **In workspace** |
| RoomDetailScreen | Room detail | Inspector | room | View | M | 85 | Inspector | **In workspace** |
| BedDetailScreen | Bed + occupancy | Inspector | bed + occupancy | View/manage occ. | L | 85 | Inspector | **Web shipped** + wizard links |
| BuildingFormScreen | Create/edit building | Drawer | building CRUD | Manage | M | 90 | Drawer | **Web shipped** |
| FloorFormScreen | Create/edit floor | Drawer | floor CRUD | Manage | M | 90 | Drawer | **Web shipped** |
| UnitFormScreen | Create/edit unit | Drawer | unit CRUD | Manage | M | 90 | Drawer | **Web shipped** |
| RoomFormScreen | Create/edit room | Drawer | room CRUD | Manage | M | 90 | Drawer | **Web shipped** |
| BedFormScreen | Create/edit bed | Drawer | bed CRUD | Manage | M | 90 | Drawer | **Web shipped** |

---

## Occupancy

| Screen | Purpose | Nav path | Backend APIs | Permissions | Complexity | Reuse % | Layout | Notes |
|--------|---------|----------|--------------|-------------|------------|---------|--------|-------|
| OccupancyWizardScreen | Allocate/Reserve/MoveIn/Transfer/Vacate | `/occupancy/wizard?mode=` | `occupancyApi` + rules | `canManageOccupancy` | XL | 95 | Wizard | **Web shipped** — see ACCOMMODATION.md |

---

## Meals

| Screen | Purpose | Nav path | Backend APIs | Permissions | Complexity | Reuse % | Layout | Notes |
|--------|---------|----------|--------------|-------------|------------|---------|--------|-------|
| MealsHomeScreen | Meals hub | `/spaces/:id/meals` | various | `canViewMeals` | M | 85 | Planner | **Web shipped** — planner workspace |
| DailyMenuTodayScreen | Today’s menu | Planner today column | daily menus | View/manage | M | 85 | Slot cards | **In planner** |
| DailyMenuEditScreen | Edit day slot | SlotEditorDrawer | menus | Manage meals | L | 85 | Drawer | **Web shipped** |
| DailyMenuSelectComboScreen | Select combo | SlotEditorDrawer | combos | Manage | M | 85 | Drawer tabs | **In editor** |
| SelectMenuHubScreen | Menu selection hub | SlotEditorDrawer | catalog | Manage | M | 85 | Drawer | **In editor** |
| MealComboFormScreen | Combo CRUD | `/meals/library` drawer | combos | Manage | M | 90 | Drawer | **Web shipped** (create) |
| MenuLibraryScreen | Items/combos/extras | `/meals/library` | food catalog | Manage | L | 85 | Table | **Web shipped** |
| MenuPlanningScreen | Plan day | `/meals` | menus, share | Manage | XL | 80 | Multi-column | **Web shipped** |
| MealDeliveryLocationsScreen | Delivery locations | `/meals/locations` | delivery CRUD | Manage | M | 90 | Table | **Web shipped** |
| MenuSharePreviewScreen | Share preview | `/meals/share` | share | Manage | M | 85 | Preview | **Web shipped** |
| MealPollResponseScreen | Customer poll | `/meals/poll` | polls | View + own | L | 85 | Page | **Web shipped** (response; payment proof deferred to Payments) |
| SubscriptionPlansScreen | Admin plans | — | `subscriptionPlansApi` | Manage | M | 85 | Table | Deferred (Members balance covers core) |
| CustomerSubscriptionPlansScreen | Customer plans | — | plans + status | Customer | M | 85 | Cards | Deferred |
| SubscriptionActivationRequestsScreen | Approve requests | — | activation APIs | Manage | M | 90 | Table | Deferred |

---

## Payments

| Screen | Purpose | Nav path | Backend APIs | Permissions | Complexity | Reuse % | Layout | Notes |
|--------|---------|----------|--------------|-------------|------------|---------|--------|-------|
| PaymentsScreen | Owner payments hub | Tabs / Payments | owner month, summary, review | Manage payments | XL | 85 | Table + KPI | |
| TenantPaymentsTabScreen | Tenant payments | Tabs / Payments (branch) | tenant month | Tenant/customer | M | 85 | Cards/table | |
| MemberPaymentsScreen | Member ledger | Stack / MemberPayments | ledger | Manage | L | 85 | Table | |
| PaymentDetailScreen | Payment detail | Stack / PaymentDetail | get/review/proof | Role-based | M | 90 | Inspector | |
| PaymentReviewScreen | Review shim | Stack / PaymentReview | review list | Manage | S | 70 | Redirect | Shim |
| PaymentHistoryScreen | Payment timeline | Stack / PaymentHistory | timeline | Role-based | M | 90 | Timeline | |
| DayMealPaymentDetailScreen | Day-meal payment | Stack / DayMealPaymentDetail | day-meal APIs | Role-based | M | 85 | Detail | |
| DayMealBulkPayScreen | Bulk day-meal pay | Stack / DayMealBulkPay | bulk submit | Role-based | L | 85 | Table + bar | |

---

## Complaints

| Screen | Purpose | Nav path | Backend APIs | Permissions | Complexity | Reuse % | Layout | Notes |
|--------|---------|----------|--------------|-------------|------------|---------|--------|-------|
| ComplaintsListScreen | Ticket list | Tabs / Complaints | `complaintsApi.list` | Raise/manage | M | 90 | Table + detail | |
| RaiseComplaintScreen | Create ticket | Stack / RaiseComplaint | `create` | canRaise | M | 90 | Modal/form | |
| ComplaintDetailScreen | Ticket detail | Stack / ComplaintDetail | get/status/comment/assign | Role-based | L | 90 | Master-detail | |

---

## Inventory

| Screen | Purpose | Nav path | Backend APIs | Permissions | Complexity | Reuse % | Layout | Notes |
|--------|---------|----------|--------------|-------------|------------|---------|--------|-------|
| InventoryDashboardScreen | Inventory KPIs | Stack / InventoryDashboard | `getDashboard`, `getStore` | View inventory | M | 85 | Widgets | |
| InventoryItemsScreen | Item list | Stack / InventoryItems | `listItems` | View | L | 90 | DataGrid | stockFilter |
| InventoryItemDetailsScreen | Item detail | Stack / InventoryItemDetails | `getItem`, txns | View | M | 85 | Split | |
| InventoryItemFormScreen | Create/edit item | Stack / InventoryItemForm | create/update | Manage | M | 90 | Drawer | |
| InventoryCategoriesScreen | Categories | Unwired | categories API | Manage | M | 90 | Table | Wire on web |
| InventorySuppliersScreen | Suppliers | Unwired | suppliers API | Manage | M | 90 | Table | Wire on web |
| InventoryTransactionsScreen | Stock ledger | Unwired | `listTransactions` | View | L | 90 | Table | Wire on web |

---

## Notifications

| Screen | Purpose | Nav path | Backend APIs | Permissions | Complexity | Reuse % | Layout | Notes |
|--------|---------|----------|--------------|-------------|------------|---------|--------|-------|
| SpaceNotificationsScreen | Notification center | Stack / SpaceNotifications | list/markRead/resolve | Space member | M | 90 | Popover + page | |

---

## Special analysis — layout decision (all screens)

| Layout | Screens |
|--------|---------|
| **Identical** | Login, OTP, Permission denied, short confirms |
| **Table** | Members, Payments ops, Complaints, Inventory items/txns/suppliers/categories, Invitations, Occupancy list, Activation requests, Global lists |
| **Card grid** | Onboarding choice, Meals hub, My Spaces (optional), Dashboard KPIs |
| **Master-detail** | Member details, Complaint detail, Payment review, Inventory item |
| **Wizard** | OccupancyWizard, QuickSetup |
| **Split pane** | Accommodation hierarchy/builder/planning, Menu planning, xl Member detail |
| **Side drawer** | Most entity forms, filters (sm), proof, headcount, sheets |
| **Dashboard widget** | DashboardScreen, health, financial/meal ops |
| **Modal** | Bulk/duplicate, invite, poll (optional), month pickers |

---

## Totals

| Metric | Count |
|--------|-------|
| Screen files under `src/screens/` | **85** |
| Feature screens (Occupancy Wizard) | **1** |
| Registered in MainNavigator / tabs | ~**78** |
| Orphan / unwired | Home, ProfileCompletionGate, Inventory Categories/Suppliers/Transactions |
| Modules with screens | **13** live (+ Reports planned) |

See [module-mapping.md](./module-mapping.md) and [desktop-wireframes.md](./desktop-wireframes.md).
