# CountIn — Post-Lifecycle Stabilization & Next Steps

**Status:** Active working roadmap  
**Created:** 2026-07-25  
**Audience:** Product, engineering  
**Prerequisite:** Progressive Guided Workflow (Phases 3–5), Lifecycle Coachmarks (Phase 4), and Space Health Score (Phase 5) are **complete**.

**Related**

- `Space-Onboarding-And-Lifecycle-Design.md`
- `Progressive-Guided-Workflow-UX-Audit.md`
- `docs/development-roadmap.md`

---

## Purpose

This document is the **single execution plan** after the Lifecycle / Progressive Guided Workflow initiatives.

It is intentionally ordered to:

1. Confirm the new architecture is stable.
2. Close localization gaps before UI expands further.
3. Remove technical debt introduced over recent phases.
4. Finish remaining low-risk product polish (empty states, Replay Tips).
5. Defer enterprise portfolio until it has its own design phase.
6. Freeze v1 architecture so future features stay aligned.

**Rule:** Complete each priority before starting the next, unless a blocker forces a temporary skip (document why).

---

## Status legend

| Mark | Meaning |
|------|---------|
| ⬜ | Not started |
| 🟡 | In progress |
| ✅ | Done |
| ⏸ | Deferred on purpose |
| ❌ | Blocked (note reason) |

Update this document as you finish each checklist item.

---

## Current baseline (what just shipped)

| Initiative | Status | Primary code |
|------------|--------|--------------|
| Progressive Guided Workflow (Phases 3–5) | ✅ Complete | `src/components/progressive/*`, hooks, sticky forms |
| Lifecycle Engine + Dashboard | ✅ Complete | `src/spaceLifecycle/*`, `DashboardScreen` |
| Coachmarks (Lifecycle Phase 4) | ✅ Complete | `src/coachmarks/*`, `src/components/coachmarks/*` |
| Health Score (Lifecycle Phase 5) | ✅ Complete | `src/spaceLifecycle/health/*`, `DashboardSpaceHealthCard` |
| Contextual empty states (Lifecycle Phase 3) | 🟡 Partial | Mess hints done; module empties remain |
| Enterprise portfolio | ⏸ Deferred | — |
| Replay Tips | ⬜ Not started | Storage/forceReplay already exist |

**Primary guidance (do not replace):**

1. Next Recommended Step  
2. Business Milestones / Progress Stepper  
3. Pending Actions  

**Secondary insight:** Space Health Score  

**Orientation only:** Coachmarks (≤3 steps, once per space/tour)

---

## Suggested execution order (summary)

| Order | Priority | Goal | Risk |
|-------|----------|------|------|
| 1 | Stabilization | Prove no hidden regressions | Highest value now |
| 2 | Localization | Keys present in all locales | Medium |
| 3 | Cleanup / tech debt | Remove debug noise & dead code | Low–medium |
| 4 | Empty-state expansion | Finish Lifecycle Phase 3 | Low |
| 5 | Replay Tips | Settings entry for coachmarks | Low |
| 6 | Architecture Freeze | Lock v1 design for future work | Docs only |
| 7 | Enterprise Portfolio | Own design phase later | High — **postpone** |

Then: start the **next major product initiative** (billing, reporting, automation, or enterprise portfolio) with a dedicated design doc.

---

# Priority 1 — Stabilization

**Goal:** Confirm the new architecture has not introduced hidden issues.  
**Status:** ⬜ Not started  
**Do this now.** Do not start localization or cleanup until this priority is closed (or explicitly waived with notes).

## 1.1 Full TypeScript check

**Command**

```bash
npx tsc --noEmit -p .
```

**Acceptance**

- [ ] Command completes.
- [ ] **New** errors from coachmarks / health / progressive files are fixed.
- [ ] Pre-existing errors (if any) are listed in §1.8 Known issues — not ignored silently.
- [ ] Decision recorded: *block ship* vs *track separately*.

**Known hotspots from recent scans (verify; do not assume fixed)**

- `StyleSheet.absoluteFillObject` vs `absoluteFill` in older files  
- `AccommodationMetadataCard` missing `View` import  
- Occupancy / payments / meals type noise unrelated to Lifecycle  

**Record results**

| Date | Result | Notes |
|------|--------|-------|
| | Pass / Fail | |

## 1.2 Unit tests

**Commands**

```bash
# Focused (Lifecycle + Progressive + Coachmarks + Health)
npx jest src/spaceLifecycle src/coachmarks src/utils/__tests__/coachmarkStorage.test.ts src/utils/__tests__/progressivePhase.test.ts src/utils/__tests__/stickyBarStyles.test.ts --no-coverage

# Full suite
npm test -- --no-coverage
```

**Acceptance**

- [ ] Focused Lifecycle/Progressive/Coachmark/Health suites pass.
- [ ] Full suite pass rate recorded (pass / fail / skip counts).
- [ ] Any new failures attributed to recent work are fixed before Priority 2.

**Record results**

| Suite | Pass | Fail | Notes |
|-------|------|------|-------|
| Focused lifecycle set | | | |
| Full `npm test` | | | |

## 1.3 Regression checklist (product areas)

Walk each area on device or emulator. Mark pass/fail. Failures need a bug note before Priority 2.

| Area | Check | Result |
|------|-------|--------|
| Lifecycle Engine | NEW → SETUP → READY → ACTIVE / NEEDS_ATTENTION still derive correctly | ⬜ |
| Recommendation Engine | Next Step title/CTA/navigation match milestones | ⬜ |
| Dashboard composition | Hero, setup card, ops widgets, quick actions, pending elevation | ⬜ |
| Business Progress Stepper | Steps, tap-to-jump, Mess labels | ⬜ |
| Progressive Guided Workflow | Menu Edit, Share Preview, Create Space, Complaints, Members, Occupancy, Subscription, Complete Profile | ⬜ |
| Sticky footers | Safe area, keyboard, loading/disabled | ⬜ |
| Coachmarks | See §1.5 | ⬜ |
| Health Score | See §1.6 | ⬜ |
| Accommodation | Home, Quick Setup, hierarchy forms, pricing hint | ⬜ |
| Members | List, add/edit, permissions | ⬜ |
| Meals | Library, planning, share, subscription request | ⬜ |
| Payments | List, detail sticky actions | ⬜ |
| Complaints | Raise + detail sticky actions | ⬜ |
| Navigation | Tabs, stack pushes, auto-open Accommodation once | ⬜ |
| Permissions | Owner vs staff vs tenant/customer views | ⬜ |

## 1.4 Manual device testing — lifecycle transitions

| Scenario | Space type | Expected | Result |
|----------|------------|----------|--------|
| Fresh create | PG / Hostel / Co-living / Rental | NEW or SETUP; Next Step visible | ⬜ |
| Add structure | Lodging | SETUP_IN_PROGRESS; readiness updates | ⬜ |
| Required milestones done | Any | READY; setup chrome hides | ⬜ |
| Operational signal | Lodging / Mess | Soft ACTIVE when applicable | ⬜ |
| Pending actions > 0 | READY/ACTIVE | NEEDS_ATTENTION; pending elevated | ⬜ |
| Mess path | Mess | Menu library → customers → menu → share | ⬜ |

## 1.5 Verify coachmark persistence

| Case | Expected | Result |
|------|----------|--------|
| Mess NEW/SETUP, first Dashboard visit | ≤3 steps; Skip/Next/Got it/outside/Back dismiss | ⬜ |
| After dismiss + app restart | Tour does **not** reappear for that `spaceId` + tour id | ⬜ |
| Second space (new Mess) | Tour can appear again for the new space | ⬜ |
| PG empty Accommodation, owner | `setup.accommodation.v1` ≤3 steps | ⬜ |
| READY / ACTIVE / NEEDS_ATTENTION | No auto coachmark | ⬜ |
| `ENABLE_SETUP_COACHMARKS = false` | No coachmarks; Next Step still works | ⬜ |
| Storage key | `@countin/coachmarks/{spaceId}/{tourId}` written | ⬜ |

## 1.6 Verify Health Score updates

| Case | Expected | Result |
|------|----------|--------|
| Brand-new space | Empty copy — **not** `0%` | ⬜ |
| Setup in progress | Score available; capped while required incomplete | ⬜ |
| Pending actions increase | Attention category drops; factor explains why | ⬜ |
| Pending cleared | Score recovers | ⬜ |
| Tap widget | Breakdown: Setup / Operations / Attention + suggestions | ⬜ |
| Suggestion source | Uses Recommendation Engine / Pending Actions — no parallel advice | ⬜ |
| Primary chrome | Next Step + Pending Actions still primary; Health secondary | ⬜ |

## 1.7 Verify no dashboard regressions

| Check | Result |
|-------|--------|
| Owner dashboard layout unchanged aside from Health card + coachmark overlay | ⬜ |
| Financial / Accommodation / Meal ops visibility by lifecycle still correct | ⬜ |
| Auto-open Accommodation still once-only (`spaceSetupStorage`) | ⬜ |
| Tenant / customer dashboards unaffected | ⬜ |
| No duplicate Business Progress Steppers | ⬜ |

## 1.8 Known issues log (fill during Priority 1)

| ID | Severity | Area | Description | Decision |
|----|----------|------|-------------|----------|
| | P0/P1/P2 | | | Fix now / Track / Won’t fix |

## 1.9 Priority 1 exit criteria

- [ ] Typecheck reviewed; new regressions fixed.
- [ ] Focused unit tests green; full suite status recorded.
- [ ] Regression table complete (or failures triaged in §1.8).
- [ ] Coachmark persistence verified.
- [ ] Health Score updates verified.
- [ ] Dashboard smoke pass.

**When exit criteria met → set Priority 1 status to ✅ and start Priority 2.**

---

# Priority 2 — Localization

**Goal:** Every supported locale has keys for new Lifecycle UI so users never hit unexpected English-only fallbacks for missing trees.  
**Status:** ✅ Complete (2026-07-25 — English placeholders; translator pass remains optional)  
**Locales:** `en`, `hi`, `ta`, `te`, `mr`, `kn` under `src/i18n/locales/`

## 2.1 Scope (minimum)

| Namespace | Source of truth | Required in all locales |
|-----------|-----------------|-------------------------|
| `coachmarks.*` | `en.json` | ✅ Explicit tree in all locales |
| `dashboard.health.*` | `en.json` | ✅ Explicit tree in all locales |
| `lifecycle.*` | Lifecycle copy is canonical under `dashboard.setup.*` + recommendation keys | ✅ Audit: no top-level runtime references |
| `health.*` | Health copy is canonical under `dashboard.health.*` | ✅ Audit: no top-level runtime references |
| Progressive keys | `progressiveWorkflow.*` | ✅ Explicit tree in all locales |

**Placeholder policy:** Structure and interpolation tokens must match `en.json`. New Lifecycle / Progressive values in non-English locales temporarily use explicit English placeholders until a translator pass. This avoids missing keys and makes untranslated copy auditable without relying on implicit fallback.

## 2.2 Process

1. Diff `en.json` trees: `coachmarks`, `dashboard.health`, `progressiveWorkflow`, any new `dashboard.setup` keys from Phases 3–5.
2. For each locale file, deep-merge missing keys (placeholders OK).
3. Prefer a small script or careful JSON merge over hand-editing huge trees blindly.
4. Smoke-test app language switch for Mess coachmark + Health widget.

## 2.3 Checklist

| Locale | `coachmarks.*` | `dashboard.health.*` | `progressiveWorkflow.*` | Automated matrix |
|--------|----------------|----------------------|-------------------------|-------|
| `en` | ✅ Source | ✅ Source | ✅ Source | ✅ |
| `hi` | ✅ Placeholder | ✅ Placeholder | ✅ Placeholder | ✅ |
| `ta` | ✅ Placeholder | ✅ Placeholder | ✅ Placeholder | ✅ |
| `te` | ✅ Placeholder | ✅ Placeholder | ✅ Placeholder | ✅ |
| `mr` | ✅ Placeholder | ✅ Placeholder | ✅ Placeholder | ✅ |
| `kn` | ✅ Placeholder | ✅ Placeholder | ✅ Placeholder | ✅ |

**Automated guard:** `src/i18n/localeMatrix.test.ts` verifies leaf-key parity and `{{interpolation}}` token parity for all three namespaces across every supported locale.

**Verification (2026-07-25):** `npx jest src/i18n/localeMatrix.test.ts --no-coverage` → 6/6 tests passed.

## 2.4 Acceptance

- [x] No missing keys for coachmark / health / progressive flows in non-English locales.
- [x] Placeholder policy documented: *explicit English text until translator pass*.
- [x] No redesign of copy in `en` during this priority.
- [x] Interpolation placeholders match `en` in every supported locale.

**Exit → Priority 3.**

---

# Priority 3 — Cleanup / technical debt

**Goal:** Remove noise and dead code introduced across recent phases before the next feature set.  
**Status:** ⬜ Not started  
**Constraint:** No behavior changes unless fixing a clear defect. Prefer small, reviewable PRs.

## 3.1 Debug telemetry (remove)

Known agent-log / localhost ingest patterns:

| Location | Pattern |
|----------|---------|
| `AccommodationHomeScreen.tsx` | `#region agent log` + `127.0.0.1:7467` |
| `UnitLayoutCard.tsx` | same |
| `useOccupancyWizardSubmit.ts` | same |

**Checklist**

- [ ] Grep for `127.0.0.1:7467` → zero hits in `src/`.
- [ ] Grep for `#region agent log` → zero hits in `src/`.
- [ ] Decide on verbose `console.log` in `authStore`, `api/client`, `memberStore`, `useBuildings` (strip or gate behind `__DEV__` — pick one policy and apply consistently).

## 3.2 Dead / duplicate code audit

| Item | Action |
|------|--------|
| Duplicate sticky footer implementations | Confirm all use `StickyFormActions` / `ProgressiveWorkflowFooter` |
| Duplicate scroll-review hooks | Confirm only `useProgressiveSectionReview` |
| Second Business Progress Stepper | Confirm none |
| Unused coachmark / health exports | Remove or keep if part of public API |
| Commented-out blocks from Phases 3–5 | Delete |
| Unused imports | ESLint / IDE cleanup on touched files |

## 3.3 Progressive utilities

| Check | Result |
|-------|--------|
| No obsolete local phase resolvers left after `resolveProgressivePhase` | ⬜ |
| No screen-local sticky chrome styles duplicating `stickyBarStyles` | ⬜ |
| Meal planning still uses shared progressive footer wrapper | ⬜ |

## 3.4 Dashboard components

| Check | Result |
|-------|--------|
| Single Health card component (`DashboardSpaceHealthCard`) | ⬜ |
| Setup card not duplicated | ⬜ |
| No abandoned experimental health/coachmark components | ⬜ |

## 3.5 Acceptance

- [ ] Debug ingest URLs gone.
- [ ] Logging policy agreed and applied on hot paths.
- [ ] No intentional behavior change in Lifecycle / Progressive / Health / Coachmarks.
- [ ] Focused unit tests still green after cleanup.

**Exit → Priority 4.**

---

# Priority 4 — Empty-state expansion

**Goal:** Finish Lifecycle design **Phase 3 — Contextual empty states** so every major module answers *why* + *what next*, with CTAs aligned to the Recommendation Engine.  
**Status:** ⬜ Not started (design: 🟡 Partial)  
**Risk:** Low — copy/CTA only; no business-logic change.

## 4.1 Principles

- First-time empty ≠ filtered empty.
- One clear CTA when the user can act; no manage CTAs for view-only roles.
- Coachmarks orient; empty states guide ongoing work — **do not duplicate coachmark copy**.
- Mess vs lodging wording must not mix (no beds on Rental empties; meals not mandatory on lodging).

## 4.2 Module matrix

| Module | Screen(s) | First-time empty | Filtered empty | CTA gated by | Result |
|--------|-----------|------------------|----------------|--------------|--------|
| Accommodation | `AccommodationHomeScreen` | Welcome + layout next step | Search no match | `canManageAccommodation` | ⬜ |
| Members | Members list | Add / Invite residents or customers | Search/filter none | `canManageMembers` | ⬜ |
| Meals — Library | Menu library | Configure library | — | `canManageMeals` | ⬜ |
| Meals — Planning | Planning / day | Plan menu (Mess) | — | permissions | ⬜ |
| Payments | Owner payments | Soft “no collections yet” | Filter none | payments manage | ⬜ |
| Complaints | List | Raise complaint path | Filter none | existing | ⬜ |
| Financial (Mess) | Dashboard hint | Already partial | — | — | ⬜ verify |

## 4.3 Reference (design doc)

See `Space-Onboarding-And-Lifecycle-Design.md` § Phase 3 — Contextual empty states for acceptance criteria and regression list.

## 4.4 Acceptance

- [ ] No generic “No data” / “No items” on first-time module hubs (where in scope).
- [ ] CTAs map to existing navigation targets (same as Next Step where applicable).
- [ ] Permission gates verified.
- [ ] Design doc Phase 3 empty-states status updated to ✅ when done.

**Exit → Priority 5.**

---

# Priority 5 — Replay Tips

**Goal:** Let owners replay setup coachmarks from Space Settings without building a new tour system.  
**Status:** ⬜ Not started  
**Risk:** Low — storage + `forceReplay` already exist.

## 5.1 Existing infrastructure (reuse only)

| Piece | Path |
|-------|------|
| Storage clear | `clearCoachmarkRecord` in `src/utils/coachmarkStorage.ts` |
| Force start | `maybeStart({ forceReplay: true })` / `canStartCoachmark({ forceReplay: true })` |
| Framework | `CoachmarkProvider`, sequences, anchors |
| Kill switch | `ENABLE_SETUP_COACHMARKS` |

## 5.2 Product rules

- Entry: Space Settings (or Space header menu) — **Replay setup tips**.
- Clears completion for the current space’s tour id (`setup.mess.v1` or `setup.accommodation.v1`).
- Starts tour on the correct landing screen (Mess → Dashboard; lodging → Accommodation).
- Does **not** auto-navigate if the user is elsewhere beyond a single explicit “Show tips” confirmation that opens the landing tab.
- Experienced users who never opt in remain uninterrupted.
- Still max 3 steps; Skip still persists as skipped.

## 5.3 Implementation checklist

- [ ] Settings / menu item + i18n (`coachmarks.replay.*`).
- [ ] Clear storage for active space + correct tour id.
- [ ] Navigate or focus landing screen, then `forceReplay`.
- [ ] Unit test: clear → not finished → can start with forceReplay even if READY (product decision: allow replay regardless of lifecycle **or** only when NEW/SETUP — **decide and document before coding**).
- [ ] Manual: replay twice; skip; complete; different spaces.

**Recommended product decision (default):** Replay allowed in any lifecycle when user explicitly requests it (`forceReplay: true`). Auto-start rules remain lifecycle-gated.

## 5.4 Acceptance

- [ ] Explicit replay works.
- [ ] Auto-start rules unchanged for users who never open Replay.
- [ ] Docs updated (Coachmark Strategy + this roadmap).

**Exit → Priority 6 (Architecture Freeze), then major initiatives.**

---

# Priority 6 — Architecture Freeze (v1)

**Goal:** Document and lock the architecture established by Lifecycle + Progressive work **before** the next major feature.  
**Status:** ⬜ Not started  
**Output:** One freeze document (suggested path below). Behavior must not change.

## 6.1 Deliverable

Create: **`docs/CountIn-v1-Architecture-Freeze.md`**

## 6.2 Required sections

1. **Lifecycle Engine** — profiles, milestones, predicates, evaluate, lifecycle states, hooks.  
2. **Recommendation Engine** — single Next Action; navigation mapping.  
3. **Progressive Guided Workflow** — footer, section review, phase resolve, sticky actions; when to use vs wizard.  
4. **Coachmark framework** — provider, sequence, storage, eligibility, kill switch.  
5. **Health Score** — weights, bands, availability, secondary role vs Pending Actions.  
6. **Dashboard composition** — visibility table, setup chrome, ops widgets, Health placement.  
7. **Shared UI primitives** — Dashboard Design A tokens, cards, steppers, EmptyState, progressive components.  
8. **Folder structure** — `src/spaceLifecycle`, `src/coachmarks`, `src/components/progressive`, `src/components/coachmarks`, `src/components/dashboard`.  
9. **Extension guidelines** — “How to add a new module” (empty state + optional progressive sticky + lifecycle milestone only if justified).  
10. **Non-goals** — no Joyride, no Health as primary nav, no duplicate attention SoT, no portfolio without design.

## 6.3 Acceptance

- [ ] Freeze doc merged / checked in.
- [ ] Linked from `Space-Onboarding-And-Lifecycle-Design.md` and this roadmap.
- [ ] Team agrees: new features must cite freeze rules or explicitly request an exception.

---

# Priority 7 — Enterprise Portfolio (POSTPONE)

**Status:** ⏸ Intentionally deferred  

This is **not** the next incremental task. It introduces a new product surface:

- Cross-space aggregation  
- Portfolio-level lifecycle / health  
- Portfolio filters and hierarchy  
- Performance at scale  
- Possible future backend summary endpoints  

**Before any coding:** write a dedicated design doc (scope, data sources, offline/cache strategy, permission model, non-goals). Do not bolt portfolio onto Health Score or Dashboard without that design.

---

# After Priorities 1–6 — next major initiatives

Only after stabilization, localization, cleanup, empty states, Replay Tips, and Architecture Freeze:

| Candidate | Notes |
|-----------|--------|
| Billing / subscriptions expansion | Product-led |
| Reporting / analytics | Needs analytics foundation first |
| Automation | Depends on clear event catalog |
| Enterprise portfolio | Only after its own design phase |

Pick **one** major initiative; open a design doc; then implement in phases.

---

# Working cadence (how to use this doc)

1. Set the active priority status to 🟡.  
2. Work only that priority’s checklists.  
3. Record command outputs / device results in the tables.  
4. On exit criteria → ✅, then open the next priority.  
5. If blocked → ❌ + note in Known issues; do not silently jump to Priority 7.

### Suggested PR slicing

| Priority | Suggested PR(s) |
|----------|-----------------|
| 1 | Fixes only (no features) |
| 2 | `i18n/locales/*` only |
| 3 | Cleanup commits; no product copy changes |
| 4 | Empty-state copy + CTA per module (can split by module) |
| 5 | Replay Tips feature |
| 6 | Docs-only Architecture Freeze |

---

# Quick command reference

```bash
# Typecheck
npx tsc --noEmit -p .

# Focused tests
npx jest src/spaceLifecycle src/coachmarks src/utils/__tests__/coachmarkStorage.test.ts src/utils/__tests__/progressivePhase.test.ts src/utils/__tests__/stickyBarStyles.test.ts --no-coverage

# Full tests
npm test -- --no-coverage

# Debug residue
rg "127\.0\.0\.1:7467|#region agent log" src
```

---

# Progress tracker (update as you go)

| Priority | Status | Owner | Started | Finished |
|----------|--------|-------|---------|----------|
| 1 Stabilization | ⬜ | | | |
| 2 Localization | ✅ | | 2026-07-25 | 2026-07-25 |
| 3 Cleanup | ⬜ | | | |
| 4 Empty states | ⬜ | | | |
| 5 Replay Tips | ⬜ | | | |
| 6 Architecture Freeze | ⬜ | | | |
| 7 Enterprise Portfolio | ⏸ | — | — | — |

---

**End of roadmap.** Complete Priority 1 first; use this file as the checklist for every subsequent step.
