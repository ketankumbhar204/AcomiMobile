# Responsive Strategy — Mobile Screens → Desktop

How every Acomi mobile screen should adapt to desktop density **without changing business workflows**.

---

## 1. Breakpoints (recommended)

| Token | Width | Shell behavior |
|-------|-------|----------------|
| `xs` | < 640px | Mobile-like: bottom nav or collapsed hamburger; single column |
| `sm` | 640–1023px | Compact sidebar (icons); single column content |
| `md` | 1024–1279px | Expanded sidebar; 2-column where useful |
| `lg` | 1280–1535px | 2–3 column; persistent filters |
| `xl` | ≥ 1536px | Master-detail + inspector; max content ~1440–1600px |

Acomi Web primary target: **md+** (operator desktop). `xs/sm` remain usable for tablet.

---

## 2. Layout patterns (decision guide)

| Pattern | Use when | Examples |
|---------|----------|----------|
| **Identical single column** | Short forms, auth, confirmations | Login, OTP, Vacate confirm |
| **2-column** | Form + help/summary | Create space, Invite, Raise complaint |
| **3-column** | Nav + list + detail | Members, Complaints, Payments review |
| **Split pane (master-detail)** | Frequent list↔detail | Members, Inventory items, Tickets |
| **Table** | Dense comparable rows | Members, Payments ledger, Inventory, Transactions |
| **Card grid** | Visual/spatial browsing | Accommodation layout tiles, My Spaces, Dashboard KPIs |
| **Dashboard widgets** | Multi-signal ops home | Dashboard |
| **Wizard** | Multi-step irreversible flows | Occupancy, Quick Setup |
| **Side drawer** | Secondary forms / filters / inspectors | Entity forms, filters, proof preview |
| **Modal** | Focused short tasks | Bulk create, duplicate, confirm |
| **Calendar + editor** | Day-based planning | Menu planning |

---

## 3. Global chrome by breakpoint

```
Mobile:  [Screen content]
         [Bottom tabs]

Desktop: [Sidebar | Top bar ........................]
         [Sidebar | Page title / breadcrumbs / actions]
         [Sidebar | Filters? | Main .............. | Inspector?]
```

| Element | Mobile | Desktop |
|---------|--------|---------|
| Primary nav | Bottom tabs | Left sidebar |
| Filters | Bottom sheet | Persistent left column (≥lg) or drawer |
| Details | Full screen push | Split pane or right drawer |
| Actions | FAB / header | Toolbar buttons |
| Search | Top of list | Sticky toolbar search |

---

## 4. Module-by-module responsive mapping

### Authentication / Onboarding

| Screen | Mobile | Desktop |
|--------|--------|---------|
| Login / OTP | Single column | Centered card (max ~420px); brand panel optional on xl |
| Onboarding choice | Stacked cards | **2-column** card pair |
| Invitations | Card list | **Table** + Accept actions |
| Complete profile | Single column form | **2-column** (form \| photo/preview) |

**Can remain identical?** Auth: yes. Choice/profile: denser layout only.

---

### Spaces / Profile

| Screen | Mobile | Desktop |
|--------|--------|---------|
| My Spaces | Card list | **Table** or card grid + attention **side panel** |
| Create / Edit space | Single column | **2-column** form |
| Space details | Sections | **2-column** (summary \| settings links) |
| Global attention/activity | Vertical lists | **Table** grouped by space |
| Profile | Sections | Settings **split** (nav \| content) |

---

### Dashboard

| Screen | Mobile | Desktop |
|--------|--------|---------|
| Dashboard | Vertical scroll sections | **3-column widget grid** (ops \| meals/finance \| setup/health) |
| Pending actions | Grouped list | Right **rail** on dashboard + full page table |
| Space health | Card | Large widget + detail page |
| Occupancy list | List | **Table** |
| Bed inventory | Hierarchical cards | **Table** + optional floor-plan pane |

**Why widgets?** Operators scan multiple domains; desktop width supports parallel KPIs without changing metrics.

---

### Members

| Screen | Mobile | Desktop |
|--------|--------|---------|
| Members list | Cards + filter sheet | **Table** + sticky filters; optional **master-detail** |
| Member details | Tabs full screen | Detail pane with tabs; list remains visible on xl |
| Add / Edit / Invite | Forms | Drawer or **2-column** page |
| Import hub | Cards | Card grid / table of candidates |
| Occupancy / subscription history | Lists | **Timeline + table** |

**Cards remain cards?** Import person cards yes. Main member list → table.

---

### Accommodation

| Screen | Mobile | Desktop |
|--------|--------|---------|
| Home | Building cards + FAB | Tree sidebar + building summary; toolbar CTAs |
| Hierarchy lists | Entity rows / layout tiles | **Split**: tree \| list/plan |
| Layout views (elevation, seat map) | Full width visual | Keep **visual pane**; add metrics column |
| Detail screens | Hero + sections | Detail pane; actions in toolbar |
| Forms | Full screen | **Side drawer** |
| Quick setup / Builder | Wizard / editor | **Split** preview \| editor; larger canvas |
| Bulk / duplicate | Modals | Keep modals (wider) |

**Why split pane?** Hierarchy depth is painful as full-screen pushes on desktop; tree preserves context.

---

### Occupancy wizard

| Step | Mobile | Desktop |
|------|--------|---------|
| Member / target pickers | Full steps / modals | **Split**: picker table \| selection summary |
| Contract / reserve / vacate | Forms | Centered form column + context banner |
| Review | Full | Same steps; **2-column** review summary |

**Keep as wizard** — do not flatten into one page (validation & mode steps matter).

---

### Meals

| Screen | Mobile | Desktop |
|--------|--------|---------|
| Meals home | Action cards | Hub tiles **2–3 col** |
| Daily menu today | Slot cards | Slot cards in **row** |
| Menu planning | Sheets + day strip | **Calendar \| editor split** |
| Menu library | Chip rails / sheets | Catalog **table/grid** + side editor |
| Poll response | Bottom sheet | Wide **modal** |
| Headcount | Sheet | **Drawer / panel** |
| Subscription plans | Cards | **Table** (admin); cards OK for customer |
| Activation requests | List | **Table** with approve/reject |

---

### Payments

| Screen | Mobile | Desktop |
|--------|--------|---------|
| Owner payments | Sections + cards | KPI strip + **DataTable**; section tabs |
| Tenant payments | Cards | Cards or compact table |
| Member payments | List | Table |
| Payment detail | Full | **Inspector** beside list when from review |
| History | Timeline | Timeline (keep) — good on both |
| Day-meal bulk pay | List + footer | Table + sticky bulk bar |

**When tables?** Comparable money rows. **When cards?** Tenant-facing simplicity, approval cards with proof.

---

### Complaints

| Screen | Mobile | Desktop |
|--------|--------|---------|
| List | Cards | **Table** + status filters |
| Raise | Form | Modal or **2-column** |
| Detail | Full | **Master-detail** drawer/page |

---

### Inventory

| Screen | Mobile | Desktop |
|--------|--------|---------|
| Dashboard | KPI cards | Widget row + low-stock table |
| Items | Cards | **DataGrid** (sku, qty, status) |
| Item details | Full | **Split** (detail \| recent transactions) |
| Form | Full | Drawer |
| Categories / suppliers | Lists | Tables |
| Transactions | List | Ledger **table** |

---

### Notifications

| Screen | Mobile | Desktop |
|--------|--------|---------|
| List | Full screen | Header popover (partial) + full page |

---

## 5. Special analysis — layout decision per screen type

Answer for every screen class:

### Remain identical (presentation tweaks only)

- Login, OTP, confirm dialogs, short permission-denied, vacate confirm step  
- **Why:** Cognitive load is intentional; density doesn’t help.

### Become table

- Members list, payments ledger/history lists, complaints list, inventory items/transactions/suppliers, occupancy list, activation requests, invitations  
- **Why:** Sort/filter/compare; keyboard row nav; bulk select later.

### Remain / become card grid

- My Spaces (optional), accommodation layout tiles, dashboard KPI cards, meals hub actions, onboarding choice  
- **Why:** Spatial or marketing-style selection, not dense data.

### Master-detail

- Members, complaints, payments review, inventory items  
- **Why:** Operators bounce list↔detail constantly.

### Wizard

- Occupancy (all modes), Quick Setup  
- **Why:** Multi-step validation and mode-specific steps must stay sequential.

### Split pane

- Accommodation hierarchy, menu planning, member detail on xl, inventory detail + txns  
- **Why:** Context retention on large screens.

### Side drawer

- Filters (sm/md), entity forms, proof preview, headcount, subscription sheets  
- **Why:** Avoid full navigation loss.

### Dashboard widget

- Dashboard home, financial snapshot, meal ops, health, setup progress  
- **Why:** Parallel monitoring.

---

## 6. Filters, search, and toolbars

| Mobile | Desktop |
|--------|---------|
| Search at top of scroll | Sticky page toolbar |
| Filter chip row | Toolbar chips + advanced panel |
| Filter drawer (apply/reset) | Persistent filter column (≥lg) |
| Sort via menu | Column headers (tables) |

---

## 7. Dialogs vs side panels — rule of thumb

| Content | Prefer |
|---------|--------|
| < 5 fields, confirm | Modal |
| Long form, reference needed | Side drawer |
| View + act on selected row | Right inspector |
| Multi-step | Wizard route/modal — **not** drawer |

---

## 8. Responsive behavior notes (shared)

- Do **not** change step order, required fields, or permission checks by breakpoint.
- Hide density features (bulk, multi-select) below `md` rather than inventing mobile-only workflows.
- Print/export are desktop-only enhancements (see [desktop-improvements.md](./desktop-improvements.md)).

Related: [desktop-wireframes.md](./desktop-wireframes.md), [navigation-mapping.md](./navigation-mapping.md).
