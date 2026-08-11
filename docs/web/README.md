# Amico Web Blueprint

Documentation set for building the Amico **web application** from the React Native **mobile reference implementation**.

**Rule:** same backend, APIs, business logic, permissions, workflows, validation, and terminology. Presentation layer differs for desktop.

## Documents

1. [final-report.md](./final-report.md) — Executive summary & recommendations  
2. [web-architecture.md](./web-architecture.md) — Architecture & folder structure  
3. [module-mapping.md](./module-mapping.md) — Mobile modules → web pages  
4. [navigation-mapping.md](./navigation-mapping.md) — Tabs/stacks → sidebar/routes  
5. [responsive-strategy.md](./responsive-strategy.md) — Mobile → desktop layouts  
6. [component-mapping.md](./component-mapping.md) — Component reuse guide  
7. [screen-inventory.md](./screen-inventory.md) — Full screen catalog  
8. [desktop-improvements.md](./desktop-improvements.md) — Desktop-only enhancements  
9. [implementation-roadmap.md](./implementation-roadmap.md) — Build order  
10. [api-reuse.md](./api-reuse.md) — API reuse verification  
11. [design-system-web.md](./design-system-web.md) — Design tokens for web  
12. [desktop-wireframes.md](./desktop-wireframes.md) — **Primary module wireframe targets**

Start with **final-report.md**, then **desktop-wireframes.md** before implementation.

Implemented modules:

- [authentication.md](./authentication.md) — Auth foundation (Login, OTP, session, guards)
- [DASHBOARD.md](./DASHBOARD.md) — Phase 2 Dashboard (widgets, pending actions, drill-downs)
- [MEMBERS.md](./MEMBERS.md) — Phase 3 Members (master-detail workspace)
- [ACCOMMODATION.md](./ACCOMMODATION.md) — Phase 4 Accommodation & Occupancy (three-panel workspace + wizards)
- [MEALS.md](./MEALS.md) — Phase 5 Meals (planner workspace + library + polls)
- [PAYMENTS.md](./PAYMENTS.md) — Phase 6 Payments & Billing (KPI + table + inspector)
- [COMPLAINTS.md](./COMPLAINTS.md) — Phase 7 Complaints & Service Requests (master-detail workspace)
- [INVENTORY.md](./INVENTORY.md) — Phase 8 Inventory (catalog-first workspace)

Cross-cutting:

- [GAP_ANALYSIS.md](./GAP_ANALYSIS.md) — **Mobile vs Web gap analysis** (final audit ≈ **96–97%**)
- [ACCOUNT_ONBOARDING.md](./ACCOUNT_ONBOARDING.md) — **Phase 9** Account, onboarding & space lifecycle
- [MEAL_SUBSCRIPTION_BILLING.md](./MEAL_SUBSCRIPTION_BILLING.md) — **Phase 10** Meal subscription & day-meal billing
- [NOTIFICATIONS_GLOBAL_WORKSPACE.md](./NOTIFICATIONS_GLOBAL_WORKSPACE.md) — **Phase 11** Notifications, profile, global lists
- [PHASE_12_FINAL_PARITY.md](./PHASE_12_FINAL_PARITY.md) — **Phase 12** Final parity & production readiness
- [FINAL_PARITY_REPORT.md](./FINAL_PARITY_REPORT.md) — Final parity report & deployment recommendation
- [FINAL_IMPLEMENTATION_AUDIT.md](./FINAL_IMPLEMENTATION_AUDIT.md) — **Independent Phases 1–12 audit** (source compare + gap closure)


