# CountIn Web — Final Report

Blueprint summary from analyzing the React Native mobile app as the source of truth.  
Documentation only — no web application code was generated.

---

## Executive verdict

CountIn Web should be a **desktop-dense presentation layer** over the **same backend, APIs, permissions, validation, workflows, and terminology** as mobile. Rebuild UI/navigation for mouse, keyboard, and multi-panel layouts; **port** `src/api`, permission/validation utils, Zustand stores, i18n, and theme tokens.

---

## Totals

| Metric | Count |
|--------|-------|
| **Total product modules** | **14** (13 live + Reports planned) |
| **Total screen files** | **~85** under `src/screens/` + **1** Occupancy Wizard feature screen |
| **Registered navigable screens** | **~78** |
| **Orphan / unwired screens** | Home, ProfileCompletionGate, Inventory Categories/Suppliers/Transactions |
| **Shared API client modules** | **~20** domain clients in `src/api/` |
| **Shared API methods** | **~95%+ reusable as-is** |
| **Shared models / DTOs** | `types.ts` + `inventoryTypes.ts` (full reuse) |
| **Reusable component logic** | **~300+** TSX components — logic/props reusable; RN UI rebuilt |
| **Design-system primitives (`ui/`)** | **~40** — recreate as web equivalents |
| **Components needing desktop equivalents** | **~25–40** (tables, tree nav, inspectors, split layouts, data grids) |
| **Hooks** | **~90** custom data/UI hooks |
| **Zustand stores** | Auth, space, member, toast, accommodation UI sheets |
| **Roles** | OWNER, MANAGER, STAFF, TENANT, CUSTOMER |
| **Space types** | PG, MESS, HOSTEL, CO_LIVING, RENTAL |

---

## Estimated development complexity

| Area | Complexity | Notes |
|------|------------|-------|
| Foundation + auth + shell | M | High leverage |
| Dashboard | M | Two audiences (owner/customer) |
| Members | L | Table + tabs + import |
| Accommodation | **XL** | Hierarchy, layouts, builder, setup |
| Occupancy wizard | L | Logic ready; UX split-pane |
| Meals | **XL** | Planning, polls, subscriptions |
| Payments | L | Review inspector, day-meal |
| Complaints | S–M | Straightforward |
| Inventory | M | APIs ready; wire missing screens |
| Reports | M | New surface, old APIs |
| **Overall product** | **XL** | Multi-month; phased roadmap |

Rough order of magnitude (experienced team): **4–7 months** to full parity with desktop enhancements, depending on staffing and accommodation/meals depth.

---

## Potential risks

| Risk | Mitigation |
|------|------------|
| Permission drift between clients | Port `*Permissions` utils first; shared package |
| Validation drift | Port validators; parity tests on allocate/pay/member |
| Rebuilding business logic in components | Enforce layering: pages → hooks → utils → API |
| Accommodation illustrated layouts hard on web | Ship table+tree first; enhance plans iteratively |
| Inventory mobile unfinished (unwired screens) | Web can complete IA using existing APIs |
| Treating web as pixel clone of mobile | Follow wireframes — density over clone |
| Web-only backend forks | Forbid; additive endpoints only |
| State/cache rewrite bugs | Zustand + TanStack Query; keep payload identical |
| i18n key divergence | Share locale JSON |
| Deep link / notification parity | Port `notificationDeepLinks` to web routes |

---

## Recommended project structure

```
src/
  app/
  modules/          # auth, onboarding, spaces, dashboard, members,
                    # accommodation, occupancy, meals, payments,
                    # complaints, inventory, notifications, profile, settings
  shared/
    components/
    layouts/
    hooks/
    services/
    api/
    contexts/
    theme/
    types/
    utils/
  store/
  i18n/
  assets/
```

See [web-architecture.md](./web-architecture.md).

---

## Recommended stack

| Concern | Choice |
|---------|--------|
| **UI library** | **MUI (Material UI)** themed to CountIn tokens (Material 3 affinity) |
| **Icons** | Lucide React |
| **State management** | **Zustand** (parity with mobile) + **TanStack Query** for server cache |
| **Routing** | **React Router v7** nested routes (or Next.js if SSR needed later) |
| **HTTP** | Axios (port `apiClient`) |
| **Forms** | React Hook Form + existing imperative validators |
| **i18n** | i18next (same locales) |
| **Tables** | MUI DataGrid or TanStack Table |
| **Bundler** | Vite + React 19 |

---

## Recommended folder organization (modules)

Each module: `pages/`, `components/`, `hooks/`, `workflows/` as needed.  
Shared kernel owns API, types, permissions, theme.  
Do not put occupancy rules inside React components.

---

## Documentation index (`/docs/web`)

| Doc | Purpose |
|-----|---------|
| [web-architecture.md](./web-architecture.md) | Target architecture & RN mapping |
| [module-mapping.md](./module-mapping.md) | Module → pages/APIs/components |
| [navigation-mapping.md](./navigation-mapping.md) | Tabs/stacks/sheets → sidebar/routes/drawers |
| [responsive-strategy.md](./responsive-strategy.md) | Mobile→desktop layout patterns |
| [component-mapping.md](./component-mapping.md) | Component reuse guide |
| [screen-inventory.md](./screen-inventory.md) | Every screen catalog |
| [desktop-improvements.md](./desktop-improvements.md) | Desktop-only enhancements |
| [implementation-roadmap.md](./implementation-roadmap.md) | Build order |
| [api-reuse.md](./api-reuse.md) | API reuse & backend notes |
| [design-system-web.md](./design-system-web.md) | Tokens, chrome, a11y |
| [desktop-wireframes.md](./desktop-wireframes.md) | **Primary build target per module** |
| [authentication.md](./authentication.md) | Auth module architecture (implemented) |

---

## Special analysis (screen layout patterns)

| Pattern | When |
|---------|------|
| Identical | Auth, confirms, short gates |
| Table | Directories, ledgers, tickets, inventory |
| Card grid | Hubs, KPIs, spatial accommodation tiles |
| Master-detail | Members, complaints, payment review, inventory item |
| Wizard | Occupancy, Quick Setup |
| Split pane | Accommodation hierarchy, menu planning, builder |
| Side drawer | Forms, filters, inspectors, former bottom sheets |
| Dashboard widget | Dashboard home |

---

## Implementation order (short)

1. Foundation ✅  
2. Layout foundation + shared desktop component library  
3. Authentication (reuse mobile contracts; desktop layout only)  
4. Dashboard ← first business module  
5. Members  
6. Accommodation  
7. Occupancy  
8. Meals  
9. Payments  
10. Complaints  
11. Inventory  
12. Settings / polish  
13. Reports  

---

## Next steps (when ready to build)

1. Treat **desktop-wireframes.md** + **design-system-web.md** as sprint input.  
2. Extract or copy `api/`, `utils/*Permissions*`, validators, `i18n`, `theme` into the web repo/shared package.  
3. Implement AppShell + auth before any domain UI.  
4. Add parity checklist per critical flow (allocate, payment review, create member).  

**No web UI code is included in this deliverable**, by request.
