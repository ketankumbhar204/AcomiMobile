# Desktop Wireframes

Architectural wireframe targets for CountIn Web — one section per module.  
No React code; use these as the visual/IA contract before implementation.

**Legend (ASCII)**

```
[ Sidebar ]  [ Top bar                                      ]
             [ Page title / breadcrumbs / primary actions   ]
             [ Filters ] [ Main content        ] [ Inspector ]
```

---

## 0. App shell (all authenticated space routes)

### Mobile reference
Bottom tabs + stack headers + profile/bell.

### Proposed desktop layout
```
┌──────────┬─────────────────────────────────────────────────────┐
│ CountIn  │  {Space name} ▼     🔍?     🔔     👤               │
│──────────┤─────────────────────────────────────────────────────│
│ Dashboard│  Breadcrumbs                                         │
│ Members  │  Page title                          [Primary CTA]  │
│ Accomm.  │─────────────────────────────────────────────────────│
│ Meals    │                                                     │
│ Payments │              Module content                         │
│ Complaints│                                                    │
│ Inventory│                                                     │
│ Settings │                                                     │
│──────────│                                                     │
│ Space ▼  │                                                     │
└──────────┴─────────────────────────────────────────────────────┘
```

### Navigation changes
Tabs → sidebar; header actions → top bar; FAB → page CTA.

### Component reuse
`SpaceSwitcher`, notification bell, profile menu, permission gating.

### Desktop-only
Collapsed icon sidebar; keyboard `g` shortcuts; pinned nav.

### Responsive
`<1024`: hamburger drawer sidebar; single column content.

---

## 1. Authentication

### Mobile reference
`LoginScreen`, `OtpScreen` — AuthHero + form.

### Proposed desktop layout
```
┌──────────────────┬────────────────────┐
│ Brand / green    │  AuthHero          │
│ wash panel       │  Form / OTP        │
│ (xl only)        │  [Continue]        │
└──────────────────┴────────────────────┘
```

### Navigation changes
Same routes `/login`, `/otp`.

### Component reuse
AuthHero, OtpInput, FormInput, Button.

### Desktop-only
Optional brand panel; Enter-to-submit.

### Responsive
`<md`: single column centered card (identical to mobile composition).

---

## 2. Onboarding & Spaces

### Mobile reference
OnboardingChoice, Join, AcceptInvitations, CompleteProfile, MySpaces, Create/Edit/Details.

### Proposed desktop layouts

**Choice**
```
[ AuthHero ]
[ Create Space card ] [ Join Space card ]
```

**My Spaces** (**Phase 9 shipped**)
```
[ SearchToolbar ]
[ Space cards grid: Name | Type | Role | Default | Open / Details ]
```

**Create / Edit space** (**Phase 9 shipped**)
```
[ Stepper: Basics → Configuration → Review ]  (create)
[ Tabs: General | Meal billing | Poll closing ] + StickyFooter (edit, owner)
```

### Navigation changes
Global routes outside space shell; Open → `/spaces/:id`.

### Component reuse
OnboardingChoiceCard, InvitationCard, ListCard, SpaceTypePicker, amenities.

### Desktop-only
Invitation bulk accept; attention side rail.

### Responsive
Stacked cards on small screens.

---

## 3. Dashboard

### Mobile reference
Vertical sections: hero, setup, pending, accommodation ops, meal ops, financial, health.

### Proposed desktop layout
```
[ OwnerHero / CustomerHero                              ]
┌──────────────┬──────────────┬──────────────┐
│ Occupancy    │ Meals today  │ Financial    │
│ ops widgets  │ widgets      │ KPIs         │
├──────────────┴──────────────┼──────────────┤
│ Setup progress / Health     │ Pending rail │
└─────────────────────────────┴──────────────┘
```

### Navigation changes
Drill-downs → nested routes; pending also full page.

### Component reuse
All dashboard widgets, MetricCard, PendingActionGroupCard, BedInventoryBrowser (adapted).

### Desktop-only
3-column widgets; persistent pending rail; click-through tables.

### Responsive
Widgets stack to 1-col; pending becomes section below.

### Layout decision
**Dashboard widgets** — not a single mobile scroll clone.

---

## 4. Members

### Mobile reference
Members list cards + filter drawer; detail full screen with tabs.

### Proposed desktop layout
```
[ Search ] [ Filters persistent ]              [ Add ] [ Invite ]
┌────────────────────────┬─────────────────────────────────────┐
│ Table: Name Role Status│  Member inspector / detail route    │
│ Occupancy Meal …       │  Tabs: Profile | Meals | Deposit…   │
│                        │  Actions: Edit, Invite, Allocate…   │
└────────────────────────┴─────────────────────────────────────┘
```

### Navigation changes
List stays mounted on xl (master-detail); `/members/:id` shareable.

### Component reuse
Member badges, tabs, filter fields, documents/notes — **not** MemberListCard as primary (table row instead).

### Desktop-only
Multi-select (invite/export later); column chooser; keyboard row open.

### Responsive
`<lg`: full-page detail (mobile-like push).

### Layout decision
**Table + master-detail**.

**Status:** Shipped in Phase 3 — see [MEMBERS.md](./MEMBERS.md). Inspector tabs: Profile, Meals/Subscription, Accommodation, Payments, Occupancy, History. Add/Edit drawer; Invite dialog; bulk invite + export UI prep.

---

## 5. Accommodation

### Mobile reference
Home cards → stack hierarchy → layout views → detail → forms; FAB speed dial.

### Proposed desktop layout
```
[ Quick Setup ▾ ] [ Add ▾ ]
┌──────────┬─────────────────────────────┬──────────────┐
│ Tree     │  Plan / list view           │  Entity      │
│ Building │  (elevation / seat map /    │  inspector   │
│  Floor   │   table)                    │  + occupancy │
│   Room   │                             │  actions     │
│    Bed   │                             │              │
└──────────┴─────────────────────────────┴──────────────┘
```

**Status:** Shipped in Phase 4 — see [ACCOMMODATION.md](./ACCOMMODATION.md). Cards/table center pane; forms in drawer; Quick Setup wizard page. Floor-plan canvas deferred.

**Forms:** right drawer over this shell.  
**Quick Setup:** full-page stepper with preview totals.

### Navigation changes
Hierarchy as tree selection in workspace; fewer full-page pushes.

### Component reuse
HierarchyTree, CenterWorkspace, EntityInspector, EntityFormDrawer, StatusChip, DataTable.

### Desktop-only
Tree nav; inspector occupancy actions; toolbar replaces FAB; Ctrl+K search.

### Responsive
Hide tree/inspector in drawers below lg/md.

### Layout decision
**Three-panel workspace** + **side drawer** forms.

---

## 6. Occupancy wizard

### Mobile reference
Full-screen wizard steps per mode (ALLOCATE / RESERVE / MOVE_IN / TRANSFER / VACATE).

### Proposed desktop layout
```
[ Stepper: Member → Target → Contract → Review ]
┌────────────────────┬──────────────────────────┐
│ Context banner     │  Step body               │
│ Mode, bed, member  │  (picker table / form)   │
└────────────────────┴──────────────────────────┘
```

**Status:** Shipped in Phase 4 — `/spaces/:id/occupancy/wizard?mode=` with sticky footer and side summary. See [ACCOMMODATION.md](./ACCOMMODATION.md).
│ Hierarchy crumbs   │                          │
└────────────────────┴──────────────────────────┘
[ Cancel ]                              [ Continue ]
```

### Navigation changes
Route with query params; can open as large modal from bed detail.

### Component reuse
All wizard steps, ContractTermsForm, pickers, validation utils (**95% logic reuse**).

### Desktop-only
Context column always visible; picker as searchable table.

### Responsive
Collapse to single column stepper (mobile parity).

### Layout decision
**Wizard** (do not flatten).

---

## 7. Meals

### Mobile reference
Hub → planning sheets, library chips, poll sheets, plans cards.

### Proposed desktop layouts

**Planner (shipped)**
```
[ Today B/L/D ] [ Tomorrow B/L/D ] [ Inspector ]
```

**Library**
```
[ Tabs Items | Combos | Extras ]
[ Catalog table + create drawer ]
```

**Status:** Shipped in Phase 5 — see [MEALS.md](./MEALS.md).

---

## 8. Payments

### Mobile reference
Owner sections (members/review/history) + cards; tenant tab; detail stack.

### Proposed desktop layout
```
[ Month nav ] [ KPI cards row ]
[ Section tabs: Members | Review | History ]
┌──────────────────────────┬────────────────────┐
│ Data table / queue       │  Inspector         │
│                          │  Proof image       │
│                          │  Approve / Reject  │
└──────────────────────────┴────────────────────┘
```

### Navigation changes
Sections via query (`tab`, `month`, `queue`, `memberId`); detail inspector; deep link `/payments/:id`.

### Component reuse
Status chips, timeline, proof drawer, receipt preview, shared DataTable/StatCard.

### Desktop-only
Side-by-side proof review; URL-persisted filters; Ctrl+K search; member filter chip.

### Responsive
Inspector becomes drawer below `lg`.

### Layout decision
Ops: **table + inspector** (**shipped Phase 6** — see [PAYMENTS.md](./PAYMENTS.md)). Tenant: table + proof drawer. Day-meal bulk deferred.

**Status:** Shipped in Phase 6.

---

## 9. Complaints

### Mobile reference
List cards → raise form → detail.

### Proposed desktop layout
```
[ Filters: status priority category ]     [ Raise ]
┌──────────────────────┬──────────────────────────┐
│ Tickets table        │  Detail: thread, assign, │
│                      │  status, attachments     │
└──────────────────────┴──────────────────────────┘
```

### Navigation changes
Master-detail; Raise as drawer; deep link `/complaints/:id`.

### Component reuse
Pickers → Selects; badges → StatusChip; timeline/comments in inspector.

### Desktop-only
Assign dropdown; URL filters; Ctrl+K search; KPI status shortcuts.

### Responsive
Inspector becomes drawer below `lg`.

### Layout decision
**Master-detail** + **table** (**shipped Phase 7** — see [COMPLAINTS.md](./COMPLAINTS.md)).

**Status:** Shipped in Phase 7.

---

## 10. Inventory

### Mobile reference
Dashboard KPIs, item cards, detail, form; categories/suppliers/transactions unwired.

### Proposed desktop layout
```
[ KPI widgets: SKUs | Low stock | Value… ]
[ Subnav: Items | Categories | Suppliers | Transactions ]
┌──────────────────────────┬────────────────────┐
│ Items DataGrid           │  Item detail /     │
│ status filters           │  stock move        │
│                          │  recent txns       │
└──────────────────────────┴────────────────────┘
```

### Navigation changes
Promote Inventory to sidebar; wire all sub-routes.

### Component reuse
InventoryItemCard→table row, StatusChip, MetricCard.

### Desktop-only
DataGrid; stock move dialog; ledger table.

### Responsive
Cards acceptable on narrow; grid on md+.

### Layout decision
Dashboard **widgets**; items **table**; detail **split** (**shipped Phase 8** — see [INVENTORY.md](./INVENTORY.md)).

**Status:** Shipped in Phase 8.

---

## 11. Notifications

### Mobile reference
Full-screen list.

### Proposed desktop layout
```
Top bar 🔔 → `/spaces/:spaceId/notifications` (Phase 11 full inbox; mark-read + deep links)
```

### Navigation changes
Popover + page; deep links unchanged semantically.

### Component reuse
Bell button; deep link util.

### Desktop-only
Popover without leaving page.

### Responsive
Popover → full page on small.

---

## 12. Profile & Settings

### Mobile reference
ProfileScreen sections; space settings in EditSpace.

### Proposed desktop layout
```
┌────────────┬────────────────────────────┐
│ Account    │  ProfileHero + fields      │
│ Preferences│  Language                  │
│ Documents  │  Uploads                   │
└────────────┴────────────────────────────┘

Space settings:
┌────────────┬────────────────────────────┐
│ General    │  Edit fields               │
│ Meals      │  Billing / poll closing    │
│ Amenities  │  Amenities checklist       │
└────────────┴────────────────────────────┘
```

### Navigation changes
`/profile` global (Phase 11 language + account); meal billing remains Edit Space (Phase 9). Space Health deferred.

### Component reuse
ProfileHero, SettingsGroupCard, LanguagePicker, billing/poll sections.

### Desktop-only
Settings sub-nav.

### Responsive
Stacked sections.

---

## 13. Reports (future)

### Mobile reference
None dedicated.

### Proposed desktop layout
```
[ Report type tabs ]
[ Date range ] [ Space filters ]
[ Chart / KPI ] [ Export CSV ]
[ Results table ]
```

### Notes
Read-only aggregation of existing APIs; no new workflows.

---

## Cross-module wireframe rules

1. Same CTAs and permission visibility as mobile.  
2. Prefer inspector/drawer over navigation loss.  
3. Wizards keep step order.  
4. Green primary + Plus Jakarta Sans everywhere.  
5. Tables for directories; cards for hubs/KPIs/spatial layouts.

Related: [responsive-strategy.md](./responsive-strategy.md), [navigation-mapping.md](./navigation-mapping.md), [desktop-improvements.md](./desktop-improvements.md).
