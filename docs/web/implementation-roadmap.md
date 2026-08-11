# Implementation Roadmap



Recommended build order for Amico Web. Preserves mobile business logic; ships **reusable desktop patterns** before business modules.



> Updated: Layout foundation and shared component library come **before** Authentication.  

> Auth already exists on mobile + backend — starting there does not validate desktop architecture.  

> Dashboard is the first business module because it exercises the design system end-to-end.



---



## Guiding criteria



1. **Prove desktop chrome first** — AppLayout, sidebar, header, page template, shared components.  

2. **Then validate the data stack** — Auth (Axios, Zustand, Query, guards, backend connectivity).  

3. **First business module = Dashboard** — KPIs, cards, navigation, responsive layout, APIs.  

4. **Deep domains next** — Members → Accommodation → Occupancy → Meals → Payments…  

5. **Reuse shared components** — modules must not invent their own PageHeader / DataTable / EmptyState.  

6. Port **utils + API contracts** from mobile — do not reinvent validation or permissions.



---



## Phase 0 — Project foundation ✅



Scaffold complete in `K:\AmicoWeb`:



- Vite / React 19 / TypeScript / MUI theme tokens  

- Axios client, TanStack Query, Zustand session shell  

- Routing infrastructure, ErrorBoundary, NotFound  

- Empty `modules/` directory  



---



## Phase 1 — Layout foundation + shared desktop library



**Deliver (no business pages)**



### Layout chrome



- `AppLayout` with left sidebar + top header + content area  

- Breadcrumb slot  

- Page container / content layout  

- Responsive sidebar (collapse / temporary drawer)  

- Theme switching control  



### Shared desktop components (`shared/components`)



PageHeader, PageSection, StatCard, SearchToolbar, FilterBar, DataTable, EmptyState, LoadingState, ErrorState, ConfirmDialog, AppDrawer, SidePanel, PageContainer, ContentCard, ActionToolbar, StatusChip, AvatarStack, InfoRow, FormSection, StickyFooter, TableToolbar, Pagination, DateRangePicker, Breadcrumbs  



### Page template (standard module structure)



```

Breadcrumb

Page Title + Page Actions

────────────────────────────────

Summary Cards (optional)

────────────────────────────────

Search + Filters

────────────────────────────────

Table / Cards

────────────────────────────────

Pagination

```



**Why first:** Every later module reuses these patterns. Fixes architecture before product UI.



**Exit criteria:** Empty authenticated shell renders with sidebar/header; components compile and export from `@/shared/components`.



---



## Phase 2 — Authentication



**Order:** Login → OTP → Session hydrate → route guards → (then onboarding/spaces as needed)



**Reuse from mobile (do not redesign):**



- Validation rules / messages  

- API contracts & DTOs (`sendOtp`, `verifyOtp`, `getMe`)  

- Error handling  

- OTP flow  



**Only adapt:** desktop AuthLayout presentation.



**Why now (not first):** Validates Axios, ProtectedRoute, Zustand, React Query, and real backend connectivity — after the shell exists.



**Exit criteria:** OTP login → token stored → protected routes work → 401 clears session.



---



## Phase 3 — Dashboard



**First business module.**



**Order:** Owner + customer dashboard variants → pending actions → health / occupancy / bed inventory drill-downs (can be thinner initially) → notifications shell



**Why:** Exercises cards, KPIs, tables, navigation, responsive layout, and API integration. Proves the design system.



---



## Phase 4 — Members



Members table → detail (tabs) → Add/Edit → Invite → Import → history surfaces  



**Status:** Core Members workspace **shipped in Phase 3** (master-detail). Import hub deferred. See [MEMBERS.md](./MEMBERS.md).



**Why:** Central entity for occupancy, meals, payments, complaints. High DataTable ROI.



---



## Phase 5 — Accommodation + Occupancy



Home three-panel workspace → form drawers → Quick Setup → Occupancy Wizard (all modes)  



**Status:** **Shipped in Phase 4** (web phase numbering: Accommodation & Occupancy). Floor-plan canvas / builder deferred. See [ACCOMMODATION.md](./ACCOMMODATION.md).



---



## Phase 6 — Occupancy (merged)



Ported with Phase 5 / web Phase 4 — wizard steps + `occupancyRules` parity. Standalone phase complete.



---



## Phase 7 — Meals



Hub → library → daily menu / planning → share/poll/headcount → locations → participation  



**Status:** **Shipped in Phase 5** (web phase numbering). Planner workspace with today+tomorrow slots. Subscription plan admin UI deferred (balance already on Members). See [MEALS.md](./MEALS.md).



---



## Phase 8 — Payments



Owner hub → tenant → detail/inspector → review → history → day-meal  



**Status:** Core Payments workspace **shipped in Phase 6** (web phase numbering: Payments & Billing). KPI + table + inspector; day-meal bulk pay deferred. See [PAYMENTS.md](./PAYMENTS.md). 



---



## Phase 9 — Complaints



List → raise → detail (status/comment/assign)  



**Status:** Core Complaints workspace **shipped in Phase 7** (web phase numbering). KPI + table + inspector; assign wired. See [COMPLAINTS.md](./COMPLAINTS.md).



---



## Phase 10 — Inventory



Dashboard → items grid → detail + stock move → categories / suppliers / transactions  



**Status:** Core Inventory workspace **shipped in Phase 8** (web phase numbering). Catalog-first KPI + table + inspector; categories/suppliers/transactions tabs. See [INVENTORY.md](./INVENTORY.md).



---



## Phase 11 — Notifications, Global Workspace & System Preferences ✅



Shipped — see [NOTIFICATIONS_GLOBAL_WORKSPACE.md](./NOTIFICATIONS_GLOBAL_WORKSPACE.md).



- Notification inbox + mark read + deep links + header bell (role-split badge)

- Profile page + language picker (multi-locale stubs) + theme (existing toggle)

- Global Attention / Activity lists + My Spaces summary cards

- **Skipped (mobile unused / unwired / deferred):** resolve UI, notification detail, Help/About, command palette, Space Health lifecycle port



## Phase 12 — Final Parity, Quality & Production Readiness ✅



Shipped — see [PHASE_12_FINAL_PARITY.md](./PHASE_12_FINAL_PARITY.md) and [FINAL_PARITY_REPORT.md](./FINAL_PARITY_REPORT.md).



- Import existing people + Members entry

- Consumer My Spaces attention badges

- Accommodation lifecycle actions (deactivate / restore / delete)

- Owner space deactivate

- Route-level lazy loading + header i18n a11y

- Recalculated GAP_ANALYSIS (~94–96% mobile-wired parity)

- **Still deferred:** Space Health, Builder, Help, resolve UI, command palette, Reports



## Phase 13+ — Optional post-launch



Space Health port, Builder, expanded i18n, CSV export when productized — **no new business modules without mobile parity**.

---



## Recommended sequence (summary)



```

Foundation (done)

  → Layout foundation + shared desktop component library

  → Authentication (reuse mobile contracts; desktop layout only)

  → Dashboard          ← first business module

  → Members

  → Accommodation

  → Occupancy

  → Meals

  → Payments

  → Complaints

  → Inventory

  → Settings / Profile

  → Reports

```



---



## Why this order is best



| Decision | Rationale |

|----------|-----------|

| Layout before Auth | Auth already proven on mobile/backend; shell proves **web** architecture |

| Shared components before modules | Prevents per-module UI drift |

| Auth before Dashboard | Dashboard needs session + API connectivity |

| Dashboard as first business module | Broadest exercise of the design system |

| Members before accommodation/meals/payments | Shared domain dependency |

| Accommodation before occupancy | Targets must exist |

| Meals before day-meal payment polish | Day-meal depends on meal activity |

| Reports last | Additive; no mobile parity pressure |



---



## Parallelization (after Dashboard)



| Track A | Track B |

|---------|---------|

| Members | DataTable polish / column prefs |

| Accommodation layouts | Occupancy wizard logic port |

| Meals library | Payments table shell |

| Complaints | Inventory |



---



## Risk checkpoints



After **Auth**, **Dashboard**, **Occupancy**, and **Payments**, run a **parity review**: same permissions, validation keys, and API payloads as mobile.



**Status (2026-07-28):** Phases 1–12 complete. Final implementation audit closed remaining mobile-wired gaps (Add Customers hub, bulk beds/rooms). See [FINAL_IMPLEMENTATION_AUDIT.md](./FINAL_IMPLEMENTATION_AUDIT.md) and [GAP_ANALYSIS.md](./GAP_ANALYSIS.md) (~96–97% parity). Remaining work is intentional deferrals only.



Related: [web-architecture.md](./web-architecture.md), [api-reuse.md](./api-reuse.md), [final-report.md](./final-report.md), [design-system-web.md](./design-system-web.md).

