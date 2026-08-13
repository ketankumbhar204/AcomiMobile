# Component Mapping — Mobile → Web

Reusable Acomi mobile components: purpose, props pattern, reuse guidance.

**Legend**

| Can reuse? | Meaning |
|------------|---------|
| **Logic** | Port TypeScript props/helpers; rebuild JSX for web |
| **Pattern** | Recreate equivalent with same API/naming |
| **Desktop new** | Web-only component; no mobile counterpart |
| **Skip / replace** | Mobile-only chrome (tabs, FAB, RN sheets) |

---

## 1. Design-system primitives (`components/ui/`)

| Component | Purpose | Key props | Usage | Reuse? | Web equivalent |
|-----------|---------|-----------|-------|--------|----------------|
| **Button** | Primary CTA | `label`, `variant`, `loading`, `disabled`, `icon` | Forms, dialogs | Pattern | MUI Button themed |
| **FormInput** | Labeled input | `label`, `error`, `hint`, + input attrs | All forms | Pattern | TextField |
| **Card** | Surface | `children`, `padded` | Layouts | Pattern | Paper |
| **Badge** | Chip label | `label`, `showDot` | Lists | Pattern | Chip |
| **EmptyState** | No-data | `title`, `description`, `icon` | Lists | Pattern | Same |
| **Skeleton / SkeletonCard** | Loading | size variants | Async views | Pattern | Skeleton |
| **ConfirmDialog** | Destructive confirm | Provider + `useConfirmDialog()` | Deletes | Pattern | Dialog host |
| **FAB** | Floating add | `onPress`, `inline` | Accommodation | **Replace** | Toolbar button |
| **ListSearchBar** | Search | `value`, `onChangeText` | Lists | Pattern | SearchField |
| **ListSearchFilterBar** | Search + filter | search + `onFilterPress`, count | Lists | Pattern | Toolbar |
| **ListFilterChips** | Single-select chips | `options`, `value`, `onChange` | Filters | Pattern | ChipGroup |
| **ListFilterToggleChips** | Multi-select | `selected: Set` | Filters | Pattern | Same |
| **ListFilterDrawer** | Filter sheet | `visible`, apply/reset | Lists | **Adapt** | FilterPanel / Drawer |
| **ListCard** | Generic row | title, subtitle, status, onPress | Spaces etc. | Pattern | List row / table row |
| **MetricCard** | KPI tile | `label`, `value`, `hint` | Dashboards | Pattern | Same |
| **MonthlySummaryCards / Header** | Month KPIs | month nav + cards | Payments | Pattern | Same |
| **MonthPickerModal** | Month pick | `visible`, `value`, `onSelect` | Payments/meals | Pattern | Popover |
| **OtpInput** | OTP digits | `value`, `onChange` | Auth | Pattern | Same |
| **SegmentedTabs** | Segment control | `items`, `value`, `onChange` | Details | Pattern | Tabs |
| **Timeline** | Event groups | `groups` | History | Pattern | Same |
| **Toast** | Feedback | store-driven | Global | Pattern | Snackbar |
| **Screen** | Page chrome | scroll/refresh | Screens | **Replace** | PageLayout |
| **PermissionDeniedScreen** | Access gate | i18n keys, `spaceId` | Gated routes | Pattern | Same page |
| **RolePicker / GenderPicker / SpaceTypePicker** | Enum pickers | value/onChange | Forms | Pattern | Select |
| **FoodTypeIcon / FoodTypePicker** | Veg indicator | foodType | Meals | Pattern | Same |
| **InlineEditableName** | Tap rename | `value`, `onSave` | Accommodation | Pattern | Inline edit |
| **ModuleActionCard** | Hub shortcut | title, icon, badge | Hubs | Pattern | ActionTile |
| **HeaderBackButton / SpaceTab\*** | Nav chrome | — | Headers | **Skip** | Router + layout |
| **SpaceSwitcher / SpaceHeaderMenu / ProfileHeaderButton** | Space chrome | `spaceId` | Headers | Pattern | TopBar pieces |
| **QuickActionSheet\*** | Action sheet | options | Accommodation | **Adapt** | Menu / ContextMenu |
| **HeaderOverflowMenu** | Overflow | provider | Headers | Pattern | IconMenu |
| **StackTitleWithSubtitle** | Titles | title, subtitle | Headers | Pattern | PageHeader |

---

## 2. Auth (`components/auth/`)

| Component | Purpose | Key props | Reuse? | Web |
|-----------|---------|-----------|--------|-----|
| **AuthHero** | Auth heading block | `icon`, `eyebrow`, `heading`, `subheading` | Pattern | Same |
| **OnboardingChoiceCard** | Create/join card | icon, title, benefits, onPress | Pattern | **Phase 9** MUI CardActionArea pair |
| **InvitationCard** | Pending invite | spaceName, role, onAccept | Pattern | **Phase 9** invitation cards (accept-only) |

---

## 3. Dashboard (`components/dashboard/`)

| Component | Purpose | Key props | Reuse? | Web |
|-----------|---------|-----------|--------|-----|
| **DashboardOwnerHero / CustomerHero** | Welcome | spaceName, health | Pattern | Same |
| **DashboardStatCard / SectionHeader / SectionTitle** | Structure | label/value/icon | Pattern | Same |
| **DashboardFinancialSnapshot** | Money KPIs | financial, handlers | Pattern | Widget |
| **DashboardAccommodationOperations** | Occupancy tiles | operations | Pattern | Widget |
| **DashboardMealOperations** | Meal ops | spaceId | Pattern | Widget |
| **DashboardSetupProgressCard** | Setup stepper | progress, milestones | Pattern | Widget |
| **DashboardSpaceHealthCard / HealthScoreRing** | Health | score | Pattern | Widget |
| **PendingActionGroupCard / PendingActionsList** | Todos | groups | Pattern | Rail + table |
| **BusinessProgressStepper** | Milestones | steps | Pattern | Same |
| **DashboardGuidedCards** | Empty guidance | choice/tip variants | Pattern | Same |
| **DashboardPersonCard** | Import candidate | name, mobile, onAdd | Pattern | Same |
| **BedInventoryBrowser + filters/rows/sections** | Bed browse | spaceId, filters, allocate | Logic | **Table + plan** desktop variant |
| **DashboardOwnerLoadingSkeleton** | Loading | flags | Pattern | Same |
| **FilterDropdownField** | Overlay select | options | Pattern | Select |

**Desktop new:** `DashboardWidgetGrid`, `PendingActionsRail`, `KpiSparklines` (optional).

**Phase 2 web (shipped):** `WidgetCard`, `ActionCard`, `SectionHeader`, `FinancialSummaryWidget`, `AccommodationOpsWidget`, `MealOpsWidget`, `PendingActionsPanel`, `DashboardQuickActions` — see [DASHBOARD.md](./DASHBOARD.md).

---

## 4. Members (`components/member/`)

| Component | Purpose | Key props | Reuse? | Web |
|-----------|---------|-----------|--------|-----|
| **MemberListCard** | List row | title, chips, onPress | Pattern | Prefer **table row** |
| **MemberCompactHeader** | Detail header | member | Pattern | Detail header |
| **MemberDetailTabBar** | Tabs | activeTab | Pattern | Tabs |
| **MemberProfileTab / HistoryTab / DepositTab** | Tab bodies | member, flags | Logic | Same |
| **MemberDocumentsSection / NotesSection** | Subsections | memberId | Pattern | Same |
| **MemberSubscription\*** | Sub UI | ids/fields | Pattern | Drawer/page |
| **MembersFilterDrawer** | Filters | applied, onApply | Adapt | FilterPanel |
| **Status/Role/Verification/Occupancy badges** | Chips | enums | Pattern | StatusChip family |
| **DocumentTypePicker / StatusPicker** | Pickers | value/onChange | Pattern | Select |
| **MemberMealBilling\*** | Billing override | selection | Pattern | Panel |
| **MemberListMealAccessRow** | Meal badge | receiving | Pattern | Column in table |

**Desktop new:** `MembersDataTable`, `MemberInspector`.

**Phase 3 web (shipped):** `MembersWorkspacePage`, `MemberInspector`, `MemberFormDrawer`, `InviteMemberDialog`, inspector panels (Profile / Subscription / Occupancy / Payments / Activity) — see [MEMBERS.md](./MEMBERS.md).

---

## 5. Accommodation (`components/accommodation/`)

| Component | Purpose | Reuse? | Web |
|-----------|---------|--------|-----|
| **AccommodationEntityHero / FormHero / BedDetailHero** | Heroes | Pattern | Same |
| **AccommodationEntityRow / BuildingListCard** | List rows | Pattern | Tree nodes / table |
| **BuildingSummaryHeader / ParentSummaryCard / MetadataCard** | Summaries | Pattern | Same |
| **AccommodationSearchBar / ViewModeToggle / ContextTrail** | Chrome | Pattern | Toolbar + breadcrumbs |
| **StatusBadge / InactiveBadge / StatusPicker / RoomTypePicker** | Status | Pattern | Same |
| **LifecycleActions / BuilderRowLifecycleMenu / ActionSheet** | Lifecycle | Logic | Menus |
| **Bulk\*Modal / Duplicate\*Modal** | Bulk ops | Pattern | Wider modals |
| **Layout\* (elevation, corridor, seat map, cards)** | Visual plans | Logic | Keep visual; denser canvas |
| **SetupStructureEditor / SetupPreview\*** | Quick setup | Logic | Split editor |
| **HomeSpeedDial** | FAB dial | **Replace** | Split button |
| **BedsFilterDrawer** | Filters | Adapt | FilterPanel |
| **PricingAfterCreateHint** | Hint | Pattern | Same |

**Desktop new (shipped):** `HierarchyTree`, `CenterWorkspace`, `EntityInspector`, `EntityFormDrawer`. Floor-plan canvas deferred.

**Phase 4 web:** see [ACCOMMODATION.md](./ACCOMMODATION.md).

---

## 6. Occupancy (`components/occupancy/`)

| Component | Purpose | Reuse? | Web |
|-----------|---------|--------|-----|
| **AccommodationOccupancyActions / QuickActions / FlowModals** | Entry points | Logic | Toolbar + menus |
| **AccommodationOccupantSection / MemberAccommodationSection** | Occupant display | Pattern | Same |
| **ContractTermsForm / ContractSnapshotCard** | Contract | Logic | Same |
| **OccupancyAmenitiesSection** | Amenities | Pattern | Same |
| **\*PickerModal** (member, target, building, hierarchy) | Pickers | Adapt | Drawer + table search |
| **MoveInModal** | Confirm | Pattern | Dialog |
| **WizardTopBar / StepHeader / BreadcrumbCard** | Wizard chrome | Pattern | WizardLayout |
| **BedInventoryListRow** | Bed + actions | Pattern | Table row |

**Desktop new:** `OccupancyWizardSplitLayout`, `TargetPickerTable`.

---

## 7. Meals (`components/meals/`)

| Component | Purpose | Reuse? | Web |
|-----------|---------|--------|-----|
| **MealFormHero / MealStatusBadge / MealTypeVisual / MealBadges** | Visuals | Pattern | Same |
| **DailyMenuSlotCard / MealOperationSlotCard** | Slots | Pattern | Same |
| **MenuPlanning\* / MenuSelection\* / Planning\*** | Planning | Logic | Split editor |
| **\*BottomSheet / \*Sheet** (many) | Sheets | **Adapt** | Drawer/Modal |
| **MealPoll\* / Headcount\*** | Polls | Logic | Modal/panel |
| **SubscriptionPlanCard / FormBottomSheet / History\*** | Plans | Pattern | **Phase 10** table + PlanFormDrawer |
| **MemberMealsTab / MemberMealActivity\*** | Member meals | Logic | Tabs/panels |
| **Library chips / ItemChipGrid / TabBar** | Catalog | Pattern | Catalog table optional |
| **QuantityStepper / PaymentProofUploadField** | Inputs | Pattern | Same |
| **FoodCategoryPicker / FoodItemMultiPicker / Combo\*** | Editors | Pattern | Same |
| **ShareMealSlotCheckbox / ProgressiveMealPlanningFooter** | Share flow | Pattern | Sticky footer |

**Desktop new (shipped):** `MealSlotCard`, `SlotEditorDrawer`, planner workspace. See [MEALS.md](./MEALS.md).

---

## 8. Payments (`components/payments/` → `modules/payments/`)

| Component | Purpose | Reuse? | Web |
|-----------|---------|--------|-----|
| **UniversalPaymentCard** | Payment row | Pattern | DataTable row |
| **PaymentApprovalCard** | Review | Pattern | `PaymentInspector` footer |
| **PaymentsReviewList** | Queue | Pattern | Review/History DataTable |
| **PaymentStatusBadge / StatusCardFrame** | Status | Pattern | `StatusChip` |
| **PaymentHistoryTimeline** | Timeline | Pattern | Inspector timeline |
| **PaymentProof\* / UniversalPaymentProofModal** | Proof | Adapt | Inspector image + `ProofSubmitDrawer` |
| **PaymentNeedsUpdatePanel / RequestUpdateModal** | Update flow | Pattern | Inspector + drawer |
| **MemberPaymentRow** | Ledger | Pattern | Members DataTable |
| **PaymentsFilter\* / SectionTabBar / SummaryFilters** | Filters | Adapt | Tabs + queue Select + search |
| **DayMealPaymentCard / Panel / BulkFooter** | Day-meal | Pattern | **Phase 10** DataTable + bulk proof drawer |
| **PaymentReferenceLabel** | Source label | Pattern | Detail rows |

**Desktop shipped (Phase 6):** `PaymentsWorkspacePage`, `TenantPaymentsPage`, `PaymentInspector`, `ReceiptPreview`, `ProofSubmitDrawer`, `PaymentsPermissionGate`.

**Reference pattern:** KPI strip + DataTable + inspector (reuse for Complaints / Inventory).

---

## 9. Complaints (`components/complaints/` → `modules/complaints/`)

| Component | Purpose | Reuse? | Web |
|-----------|---------|--------|-----|
| **ComplaintListCard** | Row | Pattern | DataTable row |
| **ComplaintStatusBadge** (+ priority/category) | Chips | Pattern | `StatusChip` |
| **ComplaintCategoryPicker / PriorityPicker** | Pickers | Pattern | Raise drawer Selects |
| **ComplaintSelectionSummary** | Raise summary | Optional | Form fields |

**Desktop shipped (Phase 7):** `ComplaintsWorkspacePage`, `ComplaintInspector`, `RaiseComplaintDrawer`, `ComplaintsPermissionGate`.

---

## 10. Inventory (`components/inventory/` → `modules/inventory/`)

| Component | Purpose | Reuse? | Web |
|-----------|---------|--------|-----|
| **InventoryItemCard** | Item row | Pattern | DataTable row |
| **InventoryStatusChip** | Stock status | Pattern | `StatusChip` |

**Desktop shipped (Phase 8):** `InventoryWorkspacePage`, `ItemInspector`, `ItemFormDrawer`, `StockMoveDrawer`, `InventoryPermissionGate`.

---

## 11. Profile / Settings / Spaces / Notifications

| Component | Purpose | Reuse? | Web |
|-----------|---------|--------|-----|
| **ProfileHero** | Profile header | Pattern | Same |
| **UserProfileFields** | Read-only fields | Pattern | Same |
| **SettingsGroupCard** | Settings section | Pattern | Same |
| **ProfileDocuments\* / AssetUploadRow / CorrectionSection** | Docs | Pattern | Same + drag-drop |
| **LanguagePicker** | Locale | ✅ Phase 11 | `/profile` Select + `changeAppLanguage` |
| **MealBillingSettingsSection / PollClosingDefaultsSection** | Space settings | ✅ Phase 9 | Edit Space |
| **GlobalAttention\* / RecentActivityCard / SpaceStatus\*** | Global home | ✅ Phase 11 | My Spaces cards + `/global/*` |
| **SpaceAmenitiesField / PropertyCategoryPicker** | Space form | Pattern | Same |
| **NotificationBellButton** | Bell | ✅ Phase 11 | Space header + inbox route |
| **AccommodationLifecycleActions** | Deactivate/restore/delete | ✅ Phase 12 | Inspector footer |
| **ImportExistingPeople** | Cross-space import | ✅ Phase 12 | `/members/import` |

---

## 12. Progressive / Coachmarks

| Component | Purpose | Reuse? | Web |
|-----------|---------|--------|-----|
| **ProgressiveWorkflowFooter / StickyFormActions** | Sticky CTAs | Pattern | Sticky page footer |
| **CoachmarkAnchor / Card / Overlay / Sequence** | Tours | Optional | Product tour lib |

---

## 13. Cross-cutting StatusChip family

Treat as one design-system family on web:

- AccommodationStatusBadge  
- ComplaintStatusBadge  
- PaymentStatusBadge  
- InventoryStatusChip  
- MealStatusBadge  
- Member status/role badges  
- SpaceStatusChip  

**Web:** `StatusChip` with `domain` + `tone` tokens from existing `*Visuals.ts` utils.

---

## 14. Summary counts

| Category | Approx mobile components | Web action |
|----------|--------------------------|------------|
| UI primitives | ~40 | Recreate themed equivalents |
| Domain components | ~250+ | Logic reuse; visual rebuild |
| Mobile-only chrome | ~15 | Replace with layouts |
| New desktop-only | ~25–40 recommended | Build during module phases |

**Reusable at logic/API level:** ~90% of domain components.  
**Reusable as RN UI:** 0% (presentation rewrite).  
**Components requiring desktop equivalents (density):** tables, tree nav, inspectors, split layouts, data grids — see modules above.

Related: [design-system-web.md](./design-system-web.md), [desktop-improvements.md](./desktop-improvements.md).
