# Acomi Modern UI Migration Tracker



Source of truth for Modern UI Design System adoption. Status is based on actual screen implementation (theme tokens alone do not qualify a screen as Modern).



Last audited: 2026-07-27 (Inventory Module introduced — space-scoped shared stock/asset inventory)



---



## ✅ Modern UI Complete



DashboardScreen



MenuPlanningScreen



CreateSpaceScreen



PaymentsScreen



MySpacesScreen



GlobalAttentionListScreen



MembersScreen



MemberDetailsScreen



AddMemberScreen



EditMemberScreen



InviteMemberScreen



MemberSubscriptionScreen



MemberSubscriptionHistoryScreen



MemberPaymentsScreen



MemberOccupancyHistoryScreen



AccommodationHomeScreen



AccommodationBuilderScreen



AccommodationFloorApartmentsScreen



AccommodationRoomsScreen



AccommodationBedsScreen



FloorsScreen



UnitsScreen



BuildingDetailScreen



FloorDetailScreen



RoomDetailScreen



UnitDetailScreen



BedDetailScreen



BuildingFormScreen



FloorFormScreen



RoomFormScreen



UnitFormScreen



BedFormScreen



QuickSetupWizardScreen



OccupancyWizardScreen



MealsHomeScreen



MenuLibraryScreen



DailyMenuTodayScreen



DailyMenuEditScreen



DailyMenuSelectComboScreen



MealComboFormScreen



MealDeliveryLocationsScreen



MealPollResponseScreen



MenuSharePreviewScreen



SelectMenuHubScreen



ComplaintsListScreen



RaiseComplaintScreen



ComplaintDetailScreen



LoginScreen



OtpScreen



OnboardingChoiceScreen



CompleteProfileScreen



ProfileCompletionGateScreen



AcceptInvitationsScreen



JoinSpaceScreen



SpaceDetailsScreen



EditSpaceScreen



SpaceNotificationsScreen



SubscriptionPlansScreen



CustomerSubscriptionPlansScreen



SubscriptionActivationRequestsScreen



PaymentDetailScreen



PaymentHistoryScreen



DayMealBulkPayScreen



DayMealPaymentDetailScreen



TenantPaymentsTabScreen



DashboardPendingActionsScreen



DashboardBedInventoryScreen



DashboardOccupancyListScreen



GlobalActivityListScreen



ProfileScreen



HomeScreen



InventoryDashboardScreen



InventoryItemDetailsScreen



InventoryItemFormScreen



---



## 🟡 Partially Updated



Screens that use theme tokens and/or some shared modern components, but still need Design A polish (Lucide, heroes, icon-led inputs, premium list rows, consistent shadows).



*(All product modules are Modern — see Latest Migration. PaymentReviewScreen remains a redirect shim under Pending.)*



*(None)*



---



## ⏳ Pending Migration



Screens that still use largely legacy / sparse UI. Priority per screen.



### Authentication



*(Authentication & Onboarding module screens are Modern — see Latest Migration.)*



---



### Onboarding / Spaces



*(JoinSpaceScreen / OnboardingChoice / AcceptInvitations / CompleteProfile / Gate are Modern — see Latest Migration.)*

*(SpaceDetailsScreen / EditSpaceScreen are Modern — see Latest Migration.)*



---



### Members



*(Members module screens are Modern — see Latest Migration.)*



---



### Dashboard



*(DashboardScreen + supporting drill-downs are Modern — see Latest Migration.)*



---



### Accommodation



*(Accommodation module screens are Modern — see Latest Migration.)*



---



### Meals



*(Meals module screens are Modern — see Latest Migration. MenuPlanningScreen was already Modern.)*

*(SubscriptionPlans / CustomerSubscriptionPlans / SubscriptionActivationRequests are Modern — see Latest Migration.)*



---



### Payments



*(TenantPaymentsTab / PaymentDetail / PaymentHistory / DayMealBulkPay / DayMealPaymentDetail are Modern — see Latest Migration.)*



PaymentReviewScreen



P3



Redirect shim (`return null`); no UI to migrate



---



### Complaints



*(Complaints module screens are Modern — see Latest Migration.)*



---



### Notifications



*(SpaceNotificationsScreen is Modern — see Latest Migration.)*



---



### Profile / Other



*(ProfileScreen + HomeScreen are Modern — see Latest Migration.)*



---



## Shared Component Dependencies



### Theme



✅ colors



✅ spacing (4 / 8 / 12 / 16 / 20 / 24)



✅ typography



✅ radius



✅ shadows



---



### Core UI



✅ FormInput (+ leadingIcon)



✅ SpaceTypePicker



✅ Card / ListCard



✅ ListFilterChips / ListFilterToggleChips / ListSearchFilterBar / ListSearchBar



✅ ModuleActionCard / MetricCard



✅ EmptyState / SkeletonCard / Screen / Button / Timeline



✅ MonthlySummaryHeader / MonthlySummaryCards



✅ FAB / Badge / GenderPicker / RolePicker / FoodTypePicker



---



### Dashboard



✅ DashboardOwnerHero / DashboardCustomerHero



✅ DashboardStatCard



✅ DashboardSectionHeader / DashboardSectionTitle



✅ DashboardActionRow



✅ DashboardSetupProgressCard / DashboardPersonCard



✅ PendingActionGroupCard



✅ Financial / meal / accommodation ops cards



✅ Bed inventory browser / rows



✅ InventoryItemCard / InventoryStatusChip (stock/asset Inventory Module)



---



### Spaces



✅ GlobalAttentionCard / GlobalAttentionSpaceCard



✅ RecentActivityCard



✅ SpaceAmenitiesField / SpacePropertyCategoryPicker



✅ SpaceStatusBadge / SpaceAttentionCardStatus



---



### Payments



✅ UniversalPaymentCard / PaymentStatusCardFrame



✅ MemberPaymentRow



✅ PaymentsSectionTabBar



✅ Review / history / timeline panels



✅ Day-meal payment cards



---



### Meals



✅ DailyMenuSlotCard / ComboPickerCard / MealTypeVisual



✅ MealFormHero (CreateSpace-style meal heroes)



✅ MenuLibraryTabBar → SegmentedTabs + Lucide



✅ ShareMealSlotCheckbox (MealTypeVisual + premium rows)



✅ SubscriptionPlanCard



✅ Menu planning day overview



✅ Library chip rails / poll UI / ProgressiveMealPlanningFooter



---



### Accommodation / Occupancy



✅ BuildingListCard (Lucide Building2, hierarchy accent, premium chips)



✅ BedDetailHero (illustrations preserved; 18dp chrome)



✅ AccommodationEntityHero (detail heroes by hierarchy level)



✅ AccommodationFormHero (form heroes by hierarchy level)



✅ AccommodationEntityRow (hierarchy Lucide icons + ChevronRight)



✅ AccommodationSearchBar (Search + clear + focus)



✅ AccommodationViewModeToggle (SegmentedTabs + Lucide)



✅ PropertyLayoutModePicker



✅ Occupancy wizard step header / top bar (Lucide + progress chrome)



---



### Members



✅ MemberListCard (Lucide chevron, DashboardAvatar, premium rows)



✅ MemberCompactHeader (avatar + meal affordance)



✅ MemberProfileTab actions (DashboardActionRow)



✅ MembersFilterDrawer



✅ Member detail tabs (functional; Design A chrome on header/actions)



---



### Complaints / Profile



✅ ComplaintStatusBadge / PriorityBadge / CategoryBadge (Lucide tonal chips)



✅ ComplaintListCard



✅ complaintVisuals (status / priority / category / timeline icons)



🟡 Profile field / document sections (legacy chrome)



---



### Authentication



✅ AuthHero



✅ OnboardingChoiceCard



✅ InvitationCard



✅ OtpInput (focus + filled states)



---



## Next Recommended Order



### Phase 1 — Reference Modern surfaces ✅



DashboardScreen ✅



MenuPlanningScreen ✅



CreateSpaceScreen ✅



PaymentsScreen ✅



MySpacesScreen ✅



GlobalAttentionListScreen ✅



---



### Phase 2 — Core daily hubs (P0 Partial + Pending)



✅ Members module (complete — see Latest Migration)



✅ Accommodation module (complete — see Latest Migration)



✅ Meals module (complete — see Latest Migration)



✅ Complaints module (complete — see Latest Migration)



✅ Authentication & Onboarding module (complete — see Latest Migration)



✅ Space Management module (complete — see Latest Migration)



✅ Subscription & Billing module (complete — see Latest Migration)



---



### Phase 3 — High-traffic entity + meals surfaces (P1)



*(SpaceDetailsScreen is Modern — see Latest Migration.)*



---



### Phase 4 — Forms, history, secondary (P2)



*(Subscription & Billing + Dashboard Supporting + Profile & Settings are Modern — see Latest Migration.)*



---



### Phase 5 — Rare / N/A (P3)



PaymentReviewScreen



---



### Phase 6 — New product modules



✅ Inventory Module (complete — see Latest Migration)



---



## Coverage Summary



| Status | Count |

|--------|------:|

| Modern | 78 |

| Partial | 0 |

| Pending | 1 |

| **Total screens** | **79** |



No duplicates. Every listed product screen is categorized above. The only Pending item is `PaymentReviewScreen` (redirect shim — no UI).



---



## Latest Migration



------------------------------------------------

Latest Migration

------------------------------------------------



**Date:** 2026-07-27



**Completed Module:** Inventory (new feature — Smart Inventory)



**Architecture decision:**



- **Space-scoped shared module** (not global, not nested under Meals/Accommodation)

- One codebase with **SpaceType profiles** (`MESS` → Food, `PG`/`HOSTEL`/`CO_LIVING` → Assets, `RENTAL` → Furniture & Appliances)

- Entry via **Dashboard quick action** (no 7th bottom tab — tab bar already dense)

- Distinct from **bed/property inventory** (`DashboardBedInventory*`)

- **Backend is source of truth** (same pattern as Meal Library): space create → `InventorySeedService.seedDefaults` → DB → REST → mobile. AsyncStorage is offline cache only.



**Product philosophy (WhatsApp-style):** answer only *What do I have? / How much is left? / What do I need to buy?* — open, complete task, close. Not an ERP.



**Screen set (operational core — 4 screens):**



| Screen | Role |

|--------|------|

| InventoryDashboardScreen | **Home = catalog** — summary, attention banner, search, filters, list, FAB |

| InventoryItemDetailsScreen | Current / Min + Stock In/Out/Edit |

| InventoryItemFormScreen | Fast add: Name, Category, Unit, Current, Minimum |



**Removed from product UI (not ERP):**



- Separate Browse Catalog / Stock In launcher actions

- InventoryItems as a second destination (aliased to dashboard)

- InventoryTransactionsScreen / Purchase History

- InventorySuppliersScreen (supplier stays optional on item when present)

- InventoryCategoriesScreen (defaults seeded; category pick on add only)

- Inventory value KPI, charts, purchase recording, activity timelines



**Completed Screens:**



- InventoryDashboardScreen (catalog home)

- InventoryItemDetailsScreen

- InventoryItemFormScreen



**Components reused:**



- `MealFormHero`, `DashboardActionRow`

- `EmptyState`, `Skeleton`/`SkeletonCard`, `ListSearchBar`, `ListFilterChips`, `FAB`

- `StickyFormActions`, `FormInput`, `Button`, `Screen`, `HeaderBackButton`

- `PermissionDeniedScreen`



**Components / utilities created:**



- `inventoryApi` — REST client (`/spaces/{id}/inventory/*`) with optional offline cache

- `inventoryTypes` — domain contracts (richer fields retained for later; UI ignores them)

- `inventoryCatalog` — InventoryProfile config (UI capabilities + default catalog mirror; does not seed)

- `inventoryVisuals` — stock status derivation + tonal chips

- `inventoryPermissions` — `canViewInventory` / `canManageInventory`

- `InventoryItemCard`, `InventoryStatusChip`

- `useInventory*` hooks



**Backend (`Acomi-backend`):**



- Flyway `inventory/V92__create_inventory_tables.sql`

- `InventorySeedService` on space create + lazy ensure on GET

- REST: categories, items, stock-moves, transactions, suppliers, dashboard



**Design decisions:**



- Defaults seeded **once per space on the backend** (not by the mobile app)

- Catalog is the heart of the module; dashboard is a launcher only

- Stock In / Stock Out are bottom sheets (qty + optional reason)

- Add item targets &lt;15 seconds

- Permissions mirror Complaints operators (OWNER/MANAGER write; STAFF read)



**Deferred until customers ask:**



- Suppliers module, purchase history, reports, expiry/warranty/assignment UX, barcode



**Ideal flows:** Catalog → item → Stock In → Save (≈4 taps) · Dashboard → Add → Save (≈3 taps)



**Stop condition:** Inventory Module simplified to operational core (not ERP).



------------------------------------------------

Previous Migration — Profile & Settings

------------------------------------------------



**Date:** 2026-07-26



**Completed Module:** Profile & Settings (final modernization phase)



**Completed Screens:**



- ProfileScreen

- HomeScreen



**Stop condition (at time):** Profile & Settings complete; Modern UI migration finished.



------------------------------------------------

Previous Migration — Dashboard Supporting

------------------------------------------------



**Date:** 2026-07-26



**Completed Module:** Dashboard Supporting



**Completed Screens:**



- DashboardPendingActionsScreen

- DashboardBedInventoryScreen

- DashboardOccupancyListScreen

- GlobalActivityListScreen



**Stop condition (at time):** Dashboard Supporting complete; Profile & Settings followed.



------------------------------------------------

Previous Migration — Subscription & Billing

------------------------------------------------



**Date:** 2026-07-26



**Completed Module:** Subscription & Billing



**Completed Screens:**



- SubscriptionPlansScreen

- CustomerSubscriptionPlansScreen

- SubscriptionActivationRequestsScreen

- PaymentDetailScreen

- PaymentHistoryScreen

- DayMealBulkPayScreen

- DayMealPaymentDetailScreen

- TenantPaymentsTabScreen



**Intentionally unchanged:**



- PaymentReviewScreen — legacy redirect shim (`return null` → Payments tab); no UI to migrate



**New reusable components introduced:**



- `billingVisuals` util — Lucide maps for payment status variants + subscription plan icon



**Existing reusable components improved:**



- `PaymentStatusBadge` — Lucide icon replaces status dot (same theme colors / props API)

- `PaymentHistoryTimeline` — Lucide markers + premium 18dp event cards (same `events` props API)

- `SubscriptionPlanCard` — Package icon well, meta chips, tonal active/inactive chip, SquarePen edit (same plan/select/edit API)



**Existing reusable components reused:**



- `MealFormHero` (compact) — all billing/subscription page headers

- `EmptyState` (Lucide `Icon`) — empty / unavailable / no-match states

- `Skeleton` — list/detail loading (no layout jumps)

- `StickyFormActions` — Day meal Pay Now; PaymentDetail owner/customer CTAs unchanged

- `ProgressiveWorkflowFooter` — CustomerSubscriptionPlans step flow unchanged

- `DashboardActionRow` — owner “View activation requests” entry

- `ListFilterChips` / `PaymentsSectionTabBar` / `UniversalPaymentCard` — TenantPayments hub

- `useConfirmDialog` — Activation approve/reject (same confirm → API path; replaces Alert chrome only)



**Design decisions:**



- Financial accent stays brand green + existing `PAYMENT_STATUS_THEME` (amber/blue/green/red) — no new palette invented

- Strict UI-only: approve/reject/pay/bulk-pay/proof validation, progressive phases, and pay-per-meal branching untouched



**Known follow-up items (at time of migration):**



- Dashboard Supporting Screens (completed in Latest Migration above)

- ProfileScreen still Partial



------------------------------------------------

Previous Migration — Space Management

------------------------------------------------



**Date:** 2026-07-26



**Completed Module:** Space Management



**Completed Screens:**



- SpaceDetailsScreen

- EditSpaceScreen

- SpaceNotificationsScreen



**New reusable components introduced:**



- `SpaceStatusChip` — Material tonal status chip (active / inactive / neutral / premium) with Lucide icon

- `spaceVisuals` util — space-type Lucide icons + accents, notification icon/category color maps, notification quick-filter matcher



**Existing reusable components reused (no duplication):**



- `MealFormHero` (compact) — Edit Space + Notifications headers

- `DashboardStatCard` — Space Details KPI strip (occupancy / meals / collections)

- `Timeline` — Space Details "Activity" (created / updated, real data only)

- `ListSearchBar` + `ListFilterChips` — Notifications search + quick filters

- `EmptyState` (Lucide `Icon`) — Notifications empty + no-match states

- `Skeleton` — Details hero/KPI + Notifications list skeletons (no layout jumps)

- `FormInput` `leadingIcon` — Edit Space fields (Building2 / MapPin / Phone)

- `StickyFormActions` — Edit Space sticky Save / Cancel (unchanged behavior)



**Design decisions:**



- Per-space-type accent (PG green, MESS orange, Hostel violet, Co-living blue, Rental teal) drives hero + KPIs + section icons while staying on-brand

- Space Details is composed: hero (icon well, type, tonal status chip, address) → quick actions (Edit / Notifications / Share) → KPI strip → grouped icon-led sections (General, Amenities, Contact, Billing, Activity)

- KPIs read from `peekDashboardSummary` cache only — no new fetch, no new state/API; strip hides when cache is cold

- Share uses RN core `Share` (no navigation/route added); "View Layout"/"Open Dashboard" intentionally omitted to avoid `switchSpace`/permission side effects

- Notifications grouped Today / Yesterday / Earlier with unread dot, category-colored icon well, action pill; search + filters are client-side only

- Edit Space keeps every handler, tab, validation, and billing/poll save path — only render/chrome changed (grouped section cards, Lucide, danger-styled deactivate)



**Known follow-up items:**



- Optional advanced filter bottom sheet for Notifications (priority/type) if product wants multi-select

- Space Details "Recent Activity" is metadata-only (created/updated); a real activity feed needs a backend endpoint



**Stop condition (at the time):** Space Management complete; Subscription & Billing next after approval.



------------------------------------------------

Previous Migration — Authentication & Onboarding

------------------------------------------------



**Date:** 2026-07-26



**Completed Module:** Authentication & Onboarding



**Completed Screens:**



- LoginScreen

- OtpScreen

- OnboardingChoiceScreen

- CompleteProfileScreen

- ProfileCompletionGateScreen

- AcceptInvitationsScreen

- JoinSpaceScreen



**New reusable components introduced:**



- `AuthHero` — soft-green CreateSpace-style hero for auth/onboarding

- `OnboardingChoiceCard` — large Lucide choice cards with benefits + arrow

- `InvitationCard` — premium invitation rows (avatar, role chip, pending chip, accept)



**Existing reusable components improved:**



- `OtpInput` — focus ring + filled tonal state (paste/autofocus behavior unchanged)

- Login / OTP — StickyFormActions, soft error banners, Lucide field chrome

- Complete Profile — AuthHero, progress track, section card, FormInput leading icons

- Profile gate — progress bar + benefit rows (gate logic unchanged)



**Design decisions:**



- Soft Acomi green for trust on first-run surfaces; Join uses blue accent to distinguish “member” path

- JoinSpace remains invitation-refresh only — no fake join-code/QR flows invented (API does not support them)

- OnboardingChoice maps existing CreateSpace / JoinSpace routes with richer cards

- Strict UI-only pass — OTP send/verify, profile completion, and invitation accept logic unchanged



**Known follow-up items:**



- Space Management next (EditSpaceScreen, SpaceDetailsScreen) pending review approval

- TenantPaymentsTabScreen and remaining Partial payment/subscription surfaces

- ProfileScreen still Partial



**Stop condition:** Authentication & Onboarding module complete. Do not start Space Management until review approval.



------------------------------------------------

Previous Migration — Complaints

------------------------------------------------



**Date:** 2026-07-26



**Completed Module:** Complaints



**Completed Screens:** ComplaintsListScreen, RaiseComplaintScreen, ComplaintDetailScreen



**Components:** ComplaintListCard, complaintVisuals; badge/ListSearchBar improvements



**Stop condition (at the time):** Complaints complete; Authentication & Onboarding next after approval.



------------------------------------------------

Previous Migration — Meals

------------------------------------------------



**Date:** 2026-07-26



**Completed Module:** Meals



**Completed Screens:** MealsHomeScreen, MenuLibraryScreen, DailyMenuTodayScreen, DailyMenuEditScreen, DailyMenuSelectComboScreen, MealComboFormScreen, MealDeliveryLocationsScreen, MealPollResponseScreen, MenuSharePreviewScreen, SelectMenuHubScreen



**Components:** MealFormHero; MenuLibraryTabBar / ShareMealSlotCheckbox improvements



**Stop condition (at the time):** Meals complete; Complaints next after approval.



------------------------------------------------

Previous Migration — Accommodation

------------------------------------------------



**Date:** 2026-07-26



**Completed Module:** Accommodation



**Completed Screens:** AccommodationHomeScreen, AccommodationBuilderScreen, AccommodationFloorApartmentsScreen, AccommodationRoomsScreen, AccommodationBedsScreen, FloorsScreen, UnitsScreen, BuildingDetailScreen, FloorDetailScreen, RoomDetailScreen, UnitDetailScreen, BedDetailScreen, BuildingFormScreen, FloorFormScreen, RoomFormScreen, UnitFormScreen, BedFormScreen, QuickSetupWizardScreen, OccupancyWizardScreen



**Components:** accommodationHierarchy, AccommodationEntityHero, AccommodationFormHero; BuildingListCard / EntityRow / SearchBar / ViewModeToggle improvements



**Stop condition (at the time):** Accommodation complete; Meals next after approval.



------------------------------------------------

Previous Migration — Members

------------------------------------------------



**Date:** 2026-07-26



**Completed Module:** Members



**Completed Screens:** MembersScreen, MemberDetailsScreen, AddMemberScreen, EditMemberScreen, InviteMemberScreen, MemberSubscriptionScreen, MemberSubscriptionHistoryScreen, MemberPaymentsScreen, MemberOccupancyHistoryScreen



**Components:** SegmentedTabs, Timeline; MemberListCard / CompactHeader / DetailTabBar / ProfileTab improvements



**Stop condition (at the time):** Members complete; Accommodation next after approval.

