# Navigation Mapping — Mobile → Web

Convert Amico React Navigation into desktop information architecture.

---

## 1. High-level conversion

| Mobile pattern | Web pattern | Why |
|----------------|-------------|-----|
| **Bottom tabs** | **Left sidebar** | Persistent primary nav; better for mouse density |
| **Native stack pushes** | **Nested routes** | Shareable URLs; browser back |
| **Detail screens** | **Route** or **right panel / drawer** | Density: stay in context when possible |
| **Dialogs / Alert** | **Modal dialog** | Same modality |
| **Bottom sheets** | **Side drawer** (preferred) or **modal** | Sheets are thumb-oriented; drawers fit desktop |
| **FAB / Speed dial** | **Toolbar / page header primary button** | Discoverable; keyboard accessible |
| **Header overflow menu** | **Top-bar kebab / overflow** | Same actions |
| **Tab header actions** (bell, profile) | **App top bar** | Global chrome |
| **Space switcher** | **Sidebar space switcher** or top-bar select | Always visible |
| **Pull to refresh** | **Refetch control** / focus refetch | No gesture on desktop |

---

## 2. Navigator hierarchy → route tree

### Mobile

```
RootNavigator
├── AuthNavigator
│   ├── Login
│   └── OtpVerification
└── MainNavigator (stack)
    ├── MySpaces, Onboarding*, Profile, Create/Edit Space…
    └── SpaceTabs (bottom tabs)
        ├── Dashboard
        ├── Members?          (canManageMembers)
        ├── Accommodation?    (canViewAccommodation)
        ├── Meals
        ├── Payments
        └── Complaints
    └── [~70 stack screens pushed above tabs]
```

### Web

```
/login, /otp
/onboarding                    # Owner vs member choice
/create-space
/join-space
/accept-invitations
/complete-profile
/my-spaces                      # My Spaces picker (+ global attention/activity cards for operators)
/global/attention
/global/activity
/profile                        # Profile & language (Phase 11)
/spaces/:spaceId/details
/spaces/:spaceId/edit
/spaces/:spaceId                # Space AppShell (sidebar)
│   ├── /                       # Dashboard
│   ├── /members/*
│   │   ├── /members/import     # Phase 12 Import existing people
│   │   └── /members/add-hub    # Final audit — Add Customers hub (MESS)
│   ├── /accommodation/*        # + lifecycle deactivate/restore/delete (P12)
│   ├── /accommodation/*
│   ├── /meals/*
│   │   ├── /plans (+ ?tab=requests)
│   │   └── /plans/customer
│   ├── /payments/day-meals
│   ├── /payments/*
│   ├── /complaints/*
│   ├── /inventory/*
│   ├── /notifications          # Phase 11 inbox
│   ├── /pending-actions
│   └── /occupancy/wizard
```

---

## 3. Bottom tabs → Left sidebar

| Tab | Permission gate | Sidebar item | Badge |
|-----|-----------------|--------------|-------|
| Dashboard | Always | Dashboard | — |
| Members | `canManageMembers` | Members | — |
| Accommodation | `canViewAccommodation` | Accommodation | — |
| Meals | `canViewMeals` (deny screen if false) | Meals | — |
| Payments | Always (screen branches by role) | Payments | Under-review count (ops) |
| Complaints | Always | Complaints | Open count (optional) |
| — | `canViewInventory` | **Inventory** (promote from stack-only) | Low-stock (optional) |
| — | — | Settings | — |

**Notes**

- Mobile inventory is stack-only today; web should surface it in the sidebar when `canViewInventory`.
- Tenant/Customer: hide Members/Accommodation/Inventory per same permission helpers.
- Payments still branches: ops → `PaymentsScreen` equivalent; tenant → tenant payments page.

---

## 4. Stack screens → Nested routes / panels

### Always full route (bookmarkable / deep)

- Member details, payment details, complaint details, inventory item details
- Accommodation hierarchy levels (building → floor → unit → room → bed)
- Meal planning day, menu library, subscription plans
- Occupancy wizard (mode + ids in query)

### Prefer drawer / inspector (desktop enhancement)

| Mobile push | Web preference |
|-------------|----------------|
| Small forms (BedForm, quick edit) | Right **drawer** |
| Filter drawers (already sheets) | Left/right **filter panel** (persistent on xl) |
| Payment proof preview | Right **inspector** |
| Raise complaint (short) | **Modal** or drawer |
| Invite member | **Modal** |
| Bulk beds/rooms/units | **Modal** |
| Notification list | Header **popover** + optional full page |

### Keep as modal

- Confirm deactivate/delete
- OTP is a page (not modal) — keep page for refresh safety
- Month picker, poll close picker — **popover/dialog**

---

## 5. Bottom sheets → Side drawer / modal

| Mobile sheet | Web mapping |
|--------------|-------------|
| `QuickActionSheetModal` | Context menu or action menu |
| `MenuPlanningBottomSheet` | Right drawer / split editor |
| `MealPollResponseBottomSheet` | Modal (wide) or drawer |
| `MealHeadcountBottomSheet` | Right drawer |
| `MemberSubscriptionBottomSheet` | Drawer |
| `MemberMealActivityDaySheet` | Drawer / popover |
| `ListFilterDrawer` | Collapsible filter sidebar |
| Accommodation bulk/duplicate modals | Keep **modal** |
| Occupancy pickers (member/target/hierarchy) | **Drawer** with search table |

---

## 6. FAB → Toolbar button

| Mobile | Web |
|--------|-----|
| Accommodation home FAB / speed dial (Quick Setup, Add manually) | Page header: **Quick Setup** + **Add** split button |
| Implicit “add” via headers | Primary CTA in toolbar; secondary in overflow |
| Coachmark targets on FAB | Target toolbar button instead |

---

## 7. Headers & global chrome

| Mobile | Web |
|--------|-----|
| Stack back button | Browser back + in-app breadcrumb |
| `SpaceTabHeaderActions` (profile + menu) | Top bar: space name, bell, profile avatar, overflow |
| `NotificationBellButton` | Top-bar bell with dropdown |
| `SpaceSwitcher` | Sidebar footer or top-bar select |
| `StackTitleWithSubtitle` | Page title block under top bar |
| Breadcrumbs (`AccommodationContextTrail`, hierarchy) | Persistent breadcrumb under title |

---

## 8. Deep linking & params

Preserve mobile param contracts as URL search/path params:

| Mobile params | Web |
|---------------|-----|
| `spaceId` | Path `/spaces/:spaceId/...` |
| `memberId`, `paymentId`, `complaintId`, `itemId` | Path segments |
| OccupancyWizard `mode`, bed/room/member ids | Query string |
| Payments `initialFilter`, `initialSection` | Query string |
| Menu `menuDate`, `mealType` | Query string |
| Inventory `stockFilter` | Query string |

Notification deep links (`utils/notificationDeepLinks.ts`) must resolve to the same web routes.

---

## 9. Role-based navigation matrix

| Role | Sidebar |
|------|---------|
| OWNER / MANAGER | Full ops (per space type; Accommodation hidden for MESS) |
| STAFF | View-heavy: accommodation view, inventory view, limited manage |
| TENANT | Dashboard, Meals, Payments (tenant), Complaints; no Members/Accommodation manage |
| CUSTOMER | Dashboard (customer), Meals, Payments, Complaints |

Use `deriveSpacePermissions` / API `permissions` — never hardcode role lists in layout components beyond calling shared utils.

---

## 10. Mapping examples (concrete)

### Example A — Open member from list

```
Mobile: Members tab → tap card → push MemberDetails
Web:    /members → click row → /members/:id  (or split pane keeps list visible)
```

### Example B — Allocate bed

```
Mobile: BedDetail → action sheet → OccupancyWizard stack
Web:    Bed detail pane → Allocate → /occupancy/wizard?mode=ALLOCATE&bedId=…
        OR open wizard in full-width modal over accommodation
```

### Example C — Filter members

```
Mobile: Filter icon → ListFilterDrawer bottom sheet
Web:    Persistent left filter column (≥1280px) or drawer (<1280px)
```

### Example D — Payment review

```
Mobile: Payments → Review section → PaymentDetail stack
Web:    /payments?section=review → row select → right inspector with proof + Approve/Reject
```

---

## 11. Browser concerns (web-only, same workflows)

- Respect browser Back as stack pop.
- Warn on unload during dirty forms / mid-wizard (same validations).
- Open details in new tab when middle-click (bonus; same routes).
- Do not invent parallel nav trees for mobile web vs desktop — responsive shell only.

See [responsive-strategy.md](./responsive-strategy.md) and [desktop-wireframes.md](./desktop-wireframes.md).
