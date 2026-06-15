# Phase 5 — Participants Next (Handoff)

**Status:** Menu Library ✅ · Menu Planning ✅ · **Participants ⬜ (next)**  
**Last updated:** June 2026  
**Audience:** Backend + UI teams · Cursor implementation sessions

**Related specs:**

- [meals-phase-5-backend.md](./meals-phase-5-backend.md) — server source of truth
- [meals-phase-5-ui-integration.md](./meals-phase-5-ui-integration.md) — React Native integration
- [development-roadmap.md](./development-roadmap.md) — product roadmap

---

## Executive decision

**Stop adding Menu Planning features.** Planning is far enough along for Phase 5.2 MVP.

**Start Participants workflow.** Until members are enrolled, the menu system has no audience (`Eligible participants: 0` on planning screens).

### Approved development order

| Step | Deliverable | Repo |
|------|-------------|------|
| **1** | Meal Plan model finalization | Backend (then align UI types) |
| **2** | Meal Participants MVP | Backend + UI |
| **3** | Eligibility verification (test data + API proof) | Backend + manual QA |
| **4** | Share Preview (plain text, copy/share — no WhatsApp automation) | Backend + UI |
| — | **Phase 5 complete** | — |
| 5+ | Availability Polls → App/WhatsApp responses → Headcount (Phase 6) | Later |

### Explicitly deferred (do not start)

- Weekly menu planning
- Menu history
- Availability polls
- Headcount engine
- Meal credits / subscriptions / billing (Phase 7)
- Forecasting

---

## Why participants are the bottleneck

```
Menu Library → Menu Planning → ??? → Share → Poll (Phase 6)
                              ↑
                    MealParticipation + Eligibility
```

| Layer | State |
|-------|-------|
| Menu Library (5.1) | ✅ Categories, items, combos, Save As Combo |
| Daily Menu Planning (5.2) | ✅ Date hub, B/L/D, draft/publish, multi-combo + items |
| Meal Participation (5.3) | 🔶 APIs partially expected; UI incomplete |
| Eligibility summary (5.4) | 🔶 Wired in UI; returns 0 without enrollments |
| Share preview | 🔶 UI exists; backend endpoint may be missing |
| Occupancy bridge (5.5) | 🔶 Move-in enroll partial; vacate stop deferred |

**Product rule (unchanged):** Participation ≠ payment. No charge, credit, or billing fields in Phase 5.

---

## Step 1 — Meal Plan model finalization (do this first)

Finalize plan types **before** building enrollment UI. Otherwise enrollment will be redesigned when eligibility rules change.

### Canonical plan codes (align backend + UI)

Use **enum codes** below. Display names are separate (i18n).

| Code | Display name (example) | Breakfast | Lunch | Dinner | Eligible slots |
|------|------------------------|:---------:|:-----:|:------:|----------------|
| `NONE` | No meals | — | — | — | None |
| `BREAKFAST` | Breakfast only | ✓ | — | — | BREAKFAST |
| `LUNCH` | Lunch only | — | ✓ | — | LUNCH |
| `DINNER` | Dinner only | — | — | ✓ | DINNER |
| `FULL` | Full meals | ✓ | ✓ | ✓ | All |
| `CUSTOM` | Custom | flags | flags | flags | Per flags |

> **Naming note:** Product may say "Breakfast only" / `BREAKFAST_ONLY` in conversation. **API enum is `BREAKFAST`** (not `BREAKFAST_ONLY`). Same for `LUNCH`, `DINNER`. Do not introduce duplicate codes.

### `MealPlan` entity (space-scoped catalog)

Per [meals-phase-5-backend.md §3.2](./meals-phase-5-backend.md):

- `mealPlanId`, `spaceId`, `code`, `name`
- `breakfastIncluded`, `lunchIncluded`, `dinnerIncluded`
- `isActive`, `sortOrder`

**Preset plans** are seeded per space on first meal setup (migration `V9__seed_default_meal_plans.sql`).

**CUSTOM plans:** operator creates via `POST /meal-plans` with slot flags. Preset codes (`FULL`, `BREAKFAST`, etc.) are not editable — only deactivated.

### `mealPlanCovers(plan, mealType)` — single source of truth

Eligibility engine must use one function:

```
FULL      → all meal types
BREAKFAST → BREAKFAST only
LUNCH     → LUNCH only
DINNER    → DINNER only
CUSTOM    → check breakfastIncluded / lunchIncluded / dinnerIncluded
NONE      → never eligible
```

Used by:

- `GET /meals/eligibility-summary`
- `GET /meals/eligible-participants`
- Phase 6 poll audience (same rules)

### Participation rules (finalize before CRUD)

- One **ACTIVE** participation per `(spaceId, memberId)` at a time
- `Member.status` must be ACTIVE for eligibility
- `PAUSED` → excluded from eligibility counts
- `STOPPED` → terminal; re-enroll creates new participation or reactivates per product rule (recommend: new row + history)
- `effectiveFrom` / `effectiveTo` — date-range filter for eligibility
- `entitlementId` — always `null` in Phase 5

### UI type alignment checklist

Frontend already defines `MealPlanCode` in `src/api/types.ts`. After backend finalization, verify:

- [ ] `GET /meal-plans` returns all 6 preset codes for new spaces
- [ ] `breakfastIncluded` / `lunchIncluded` / `dinnerIncluded` match code semantics
- [ ] `MEAL_PLAN_CODES` in UI includes plans shown at enroll time (currently excludes `NONE` — correct)

---

## Step 2 — Meal Participants MVP

### Backend deliverables (5.3)

Implement or verify per [meals-phase-5-backend.md §8.1–8.2](./meals-phase-5-backend.md):

| Method | Path | Notes |
|--------|------|-------|
| GET | `/meal-plans` | List active plans with slot flags |
| POST | `/meal-plans` | Create CUSTOM plan only |
| GET | `/meal-participations` | Filters: `status`, `mealPlanCode`, `search` |
| POST | `/meal-participations` | Enroll member |
| PUT | `/meal-participations/{id}` | Change plan |
| POST | `/meal-participations/{id}/pause` | → PAUSED |
| POST | `/meal-participations/{id}/resume` | → ACTIVE |
| POST | `/meal-participations/{id}/stop` | → STOPPED |
| GET | `/members/{memberId}` | Extend with `mealParticipation` block |

**History:** append `MealParticipationHistory` on create / plan change / status change.

**Permissions:** `canManageMealParticipation` → OWNER, MANAGER (same as `canManageMeals` for Phase 5).

### UI deliverables (after backend ready)

| Feature | Current | Target |
|---------|---------|--------|
| Enroll participant | 🔶 Create only | Mess CUSTOMER + PG TENANT + STAFF |
| Change meal plan | ⬜ Form ignores `mode: 'edit'` | `PUT /meal-participations/{id}` |
| Pause / Resume / Stop | ✅ Member profile tab | + row actions on participant list |
| Participant list | ✅ List + filters | Inline pause/resume/stop |
| Dashboard CTA | 🔶 Library + Participants only | + Enroll · Plan menu · Today's menu |
| Planning hub empty state | Shows `0` eligible | CTA: "Enroll participants" when count is 0 |
| Occupancy move-in | ✅ Checkbox exists | Verify backend + `sourceOccupancyId` |
| Vacate → stop (5.5) | ⬜ | Defer immediately after MVP if needed |

### Enrollment scenarios to support

| Space | Member role | Typical plan |
|-------|-------------|--------------|
| MESS | CUSTOMER | FULL, LUNCH, DINNER, CUSTOM |
| PG / HOSTEL | TENANT | FULL (move-in bridge) |
| Any | STAFF | FULL or slot plan |

---

## Step 3 — Eligibility verification

After Step 2, create test data and prove the loop.

### Test members

| Member | Space type | Role | Plan | Status |
|--------|------------|------|------|--------|
| Mess Customer A | MESS | CUSTOMER | FULL | ACTIVE |
| Mess Customer B | MESS | CUSTOMER | LUNCH | ACTIVE |
| PG Tenant A | PG | TENANT | FULL | ACTIVE |

Optional edge cases:

- Mess Customer C — `PAUSED` → excluded from all slots
- Mess Customer D — `BREAKFAST` only → breakfast eligible only

### Expected eligibility (example for tomorrow)

Assume all ACTIVE, date in range, member ACTIVE:

| Slot | Expected eligible |
|------|-------------------|
| Breakfast | Customer A + Tenant A (+ D if BREAKFAST) = **2 or 3** |
| Lunch | Customer A + Customer B + Tenant A = **3** |
| Dinner | Customer A + Tenant A = **2** |

### API checks

```bash
GET /api/v1/spaces/{spaceId}/meals/eligibility-summary?date=YYYY-MM-DD
GET /api/v1/spaces/{spaceId}/meals/eligible-participants?date=YYYY-MM-DD&mealType=LUNCH
```

### UI checks

- Menu Planning hub: per-slot `Eligible participants: X` (non-zero)
- Dashboard metric: total eligible participants
- PAUSED member not in eligible-participants list

---

## Step 4 — Share Preview

**Scope:** Plain-text message preview + native share sheet. **No WhatsApp API automation.**

### User flow

```
Today's Menu / Planning Hub
  → Preview share message
  → Copy / Share (OS share sheet)
```

### Backend (add if missing)

Frontend already calls:

```
GET /api/v1/spaces/{spaceId}/meals/share-preview?date={date}&mealType={optional}
```

**Response shape** (match `MealSharePreviewResponse` in UI `types.ts`):

```json
{
  "messageText": "Tomorrow's Menu — Test Mess 1\nTue, Jun 16, 2026\n\nBreakfast\n• Poha\n• Tea\n\nLunch\n• Standard Lunch Thali\n\nDinner\n(not published)",
  "slots": [
    {
      "mealType": "BREAKFAST",
      "lines": [{ "label": "Poha" }, { "label": "Tea" }]
    }
  ]
}
```

**Rules:**

- Include only **PUBLISHED** slots (or mark unpublished slots as "(not published)")
- Flatten combo + item labels from daily menu options
- Space name + formatted date in header
- No participant phone numbers in Phase 5 message (Phase 6 may personalize)

**Fallback:** If backend delayed, UI may generate `messageText` client-side from `GET /daily-menus/{date}` — backend implementation preferred.

### Post-publish CTA (UI, after Step 4)

On planning hub, after slot is published: **"Share menu"** link → Share Preview screen.

---

## Phase 6 readiness (dependencies only — do not implement)

Phase 5 must expose before polls:

1. Published daily menus per slot
2. ACTIVE participations with correct plan coverage
3. Eligible participants list (with contact fields for future WhatsApp)
4. Share message generation

Phase 6 adds: `meal_poll`, `meal_response`, headcount APIs.

---

## Backend implementation prompt

Copy the block below into **Cursor in the backend repository** after placing `docs/meals-phase-5-backend.md` and this file in the backend `docs/` folder.

---

```markdown
# Task: Implement CountIn Phase 5.3–5.4 — Meal Plans, Participation & Eligibility

## Context

CountIn backend. Phases 1–4 complete. Phase 5.1 (Menu Library) and 5.2 (Daily Menu Planning) are implemented and consumed by the React Native app.

**Source of truth:**
- `docs/meals-phase-5-backend.md`
- `docs/meals-phase-5-participants-next.md`

Read both before coding. Do NOT implement Phase 6 polls, Phase 7 billing, menu history, or weekly templates.

## Product rules (critical)

1. **Participation ≠ payment** — no charge amounts, credits, wallet, or invoices in any Phase 5 API.
2. **Member is the person anchor** — MealParticipation links to `memberId` (TENANT, CUSTOMER, STAFF). No separate subscriber entity.
3. **Eligible participants ≠ headcount** — Phase 5 returns subscription/plan-based eligible counts only. Label APIs/docs accordingly. Headcount from poll responses is Phase 6.
4. **Occupancy food fields stay separate** — do not repurpose `foodEnabled` / `foodChargeSnapshot` on occupancy contracts.

## Step 1 — Finalize Meal Plan model (implement first)

### Entity: `meal_plan` (space-scoped)

Fields: id, space_id, code, name, breakfast_included, lunch_included, dinner_included, is_active, sort_order, created_at, updated_at.

### Enum: `MealPlanCode`

```
NONE | BREAKFAST | LUNCH | DINNER | FULL | CUSTOM
```

Do NOT use BREAKFAST_ONLY / LUNCH_ONLY — use BREAKFAST / LUNCH / DINNER.

### Seed preset plans per space

On first meal access or space creation, ensure these rows exist:

| code | breakfast | lunch | dinner |
|------|:---------:|:-----:|:------:|
| NONE | false | false | false |
| BREAKFAST | true | false | false |
| LUNCH | false | true | false |
| DINNER | false | false | true |
| FULL | true | true | true |
| CUSTOM | false | false | false | (template — flags set on POST) |

### `mealPlanCovers(plan, mealType)`

Implement as shared service method used by eligibility:

- FULL → all types
- BREAKFAST / LUNCH / DINNER → that slot only
- CUSTOM → check inclusion flags
- NONE → false

## Step 2 — Meal Participation (5.3)

### Entity: `meal_participation`

Fields per spec §3.3: id, space_id, member_id, meal_plan_id, status (ACTIVE|PAUSED|STOPPED), effective_from, effective_to, source_occupancy_id (nullable), entitlement_id (nullable, always null in Phase 5), stopped_at, timestamps.

### Entity: `meal_participation_history`

Append on: CREATED, PLAN_CHANGED, STATUS_CHANGED, STOPPED.

### Rules

- One ACTIVE participation per (space_id, member_id).
- PAUSED excluded from eligibility.
- Member must be ACTIVE for eligibility.
- Validate meal_plan_id belongs to same space.
- Validate member belongs to space.

### APIs

Base: `/api/v1/spaces/{spaceId}`

| Method | Path | Role |
|--------|------|------|
| GET | `/meal-plans` | canViewMeals |
| POST | `/meal-plans` | canManageMeals (CUSTOM only) |
| PUT | `/meal-plans/{planId}` | canManageMeals (not preset codes) |
| GET | `/meal-participations` | canViewMeals — query: status, mealPlanCode, search |
| GET | `/meal-participations/{id}` | canViewMeals |
| POST | `/meal-participations` | canManageMeals |
| PUT | `/meal-participations/{id}` | canManageMeals |
| POST | `/meal-participations/{id}/pause` | canManageMeals |
| POST | `/meal-participations/{id}/resume` | canManageMeals |
| POST | `/meal-participations/{id}/stop` | canManageMeals |

**Create body:**
```json
{ "memberId": "uuid", "mealPlanId": "uuid", "effectiveFrom": "2026-06-16", "effectiveTo": null }
```

**Update body:**
```json
{ "mealPlanId": "uuid" }
```

Extend `GET /members/{memberId}` with optional `mealParticipation` summary block (null if not enrolled).

### Permissions

Extend `SpacePermissionsResponse` on `GET /spaces/my`:
- canManageMeals, canViewMeals, canManageMealParticipation, canViewOwnMealParticipation

Implement `MealAccessService` per spec §7.

## Step 3 — Eligibility summary (5.4)

### APIs

| Method | Path | Role |
|--------|------|------|
| GET | `/meals/eligibility-summary?date=` | canViewMeals |
| GET | `/meals/eligible-participants?date=&mealType=` | canManageMeals |

**Eligibility logic:** member ACTIVE + participation ACTIVE + date in [effectiveFrom, effectiveTo] + mealPlanCovers(plan, mealType).

**Response example:**
```json
{
  "date": "2026-06-16",
  "slots": [
    { "mealType": "BREAKFAST", "eligibleCount": 2, "published": true, "pausedCount": 0 },
    { "mealType": "LUNCH", "eligibleCount": 3, "published": false },
    { "mealType": "DINNER", "eligibleCount": 2, "published": false }
  ]
}
```

Eligible participants list must return: memberId, memberName, mobileNumber (if available), mealPlanCode, mealPlanName.

## Step 4 — Share preview (Phase 5 adjunct)

Implement endpoint consumed by mobile app:

```
GET /api/v1/spaces/{spaceId}/meals/share-preview?date={date}&mealType={optional}
```

Return:
```json
{
  "messageText": "string — formatted plain text for WhatsApp/SMS copy-paste",
  "slots": [
    { "mealType": "BREAKFAST", "lines": [{ "label": "Poha", "detail": null }] }
  ]
}
```

Rules: include space name + formatted date; list published slot options (combo/item labels); mark unpublished slots as "(not published)"; no billing or poll links.

## Migrations (if not already applied)

```
meal/V7__create_meal_plans.sql
meal/V8__create_meal_participations.sql
meal/V9__seed_default_meal_plans.sql
```

Add nullable `entitlement_id` on participation for Phase 7 forward compatibility.

## Out of scope

- MealEntitlement, credits, ledger, invoices (Phase 7)
- MealPoll, MealResponse, headcount APIs (Phase 6)
- WhatsApp send integration (Phase 6)
- Weekly menu templates, menu history
- Menu library changes (already done in 5.1)
- Daily menu changes (already done in 5.2)

## Verification checklist

Manual test with seed data:

1. **MESS space** — enroll CUSTOMER A (FULL), CUSTOMER B (LUNCH only)
2. **PG space** — enroll TENANT A (FULL)
3. `GET eligibility-summary` returns non-zero counts per slot matching mealPlanCovers rules
4. PAUSED participation excluded from counts and eligible-participants list
5. CUSTOM plan with lunch-only flags → dinner eligibleCount unchanged
6. TENANT can view own participation; cannot manage
7. STAFF can view menus and participant list; cannot manage
8. `GET share-preview` returns readable messageText for a date with published breakfast/lunch
9. No payment/credit fields in any response body

## Deliverables

1. Flyway migrations (if missing)
2. Domain entities + repositories
3. MealPlanService, MealParticipationService, MealEligibilityService, MealAccessService
4. REST controllers with permission checks
5. Member details extension
6. Share preview endpoint
7. Unit/integration tests for mealPlanCovers and eligibility counts
```

---

## UI implementation prompt (after backend verified)

Use this in the **React Native repo** once backend Steps 1–3 pass verification:

```markdown
# Task: Implement CountIn Phase 5.3 UI — Meal Participants MVP

## Prerequisites

Backend Phase 5.3–5.4 APIs verified:
- GET /meal-plans returns seeded plans
- Participation CRUD + pause/resume/stop works
- GET /meals/eligibility-summary returns non-zero with test enrollments

Read: docs/meals-phase-5-ui-integration.md, docs/meals-phase-5-participants-next.md

## Do NOT build

Menu history, weekly planning, polls, headcount, billing, credits.

## Do NOT add Menu Planning features.

## Implement

1. MealParticipationForm — wire `mode: 'edit'` to PUT /meal-participations/{id}
2. MealParticipantList — row actions: pause, resume, stop
3. Dashboard meals sheet — add: Plan menu, Today's menu, Enroll participant
4. MenuPlanningScreen — when eligibleCount === 0, show enroll CTA
5. Verify MemberMealsTab pause/resume/stop against live API
6. CUSTOM plan: show breakfast/lunch/dinner toggles when CUSTOM selected (if POST /meal-plans needed, scope minimal)

## Verify

Enroll Mess Customer A (FULL), Mess Customer B (LUNCH), PG Tenant A (FULL).
Planning hub shows correct eligible counts per slot.
```

---

## Changelog

| Date | Change |
|------|--------|
| 2026-06 | Initial handoff: participants-next order, meal plan finalization, backend + UI prompts |
