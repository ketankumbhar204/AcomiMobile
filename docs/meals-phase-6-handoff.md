# Phase 6 Handoff — Meal Polls & Availability Responses

Phase 5 delivers the menu library, daily menus, meal participation, and **eligible participant counts**. Phase 6 adds availability-driven headcount: operators publish a menu, members respond, and the kitchen sees real attendance — not subscription counts.

This document describes entities and APIs planned for Phase 6. **Nothing here is exposed in Phase 5.**

---

## Relationship to Phase 5

| Phase 5 | Phase 6 |
|---------|---------|
| `DailyMenu` (DRAFT / PUBLISHED) | Poll opened against a published menu slot |
| `MealParticipation` (ACTIVE / PAUSED / STOPPED) | Who may receive poll notifications |
| Eligible participant count | Actual headcount from poll responses |
| No billing | Still no billing (Phase 7) |

---

## Planned entities (not implemented)

### `meal_poll`

| Column | Notes |
|--------|-------|
| id | UUID PK |
| space_id | FK |
| daily_menu_id | FK — poll targets one published menu |
| meal_type | BREAKFAST / LUNCH / DINNER |
| poll_date | Local date |
| status | DRAFT, OPEN, CLOSED |
| opens_at, closes_at | Response window |
| created_at, updated_at | |

One active poll per `(space_id, poll_date, meal_type)` recommended.

### `meal_response`

| Column | Notes |
|--------|-------|
| id | UUID PK |
| poll_id | FK |
| member_id | FK — person anchor via Member |
| response | ATTENDING, NOT_ATTENDING, MAYBE (TBD) |
| responded_at | |
| source | APP, WHATSAPP (future) |

Unique: `(poll_id, member_id)`.

---

## Planned APIs (stub)

Base: `/api/v1/spaces/{spaceId}`

| Method | Path | Role |
|--------|------|------|
| POST | `/meal-polls/{date}/{mealType}/open` | canManageMeals |
| POST | `/meal-polls/{date}/{mealType}/close` | canManageMeals |
| GET | `/meal-polls/{date}/{mealType}` | canViewMeals |
| POST | `/meal-polls/{pollId}/responses` | member (own) |
| GET | `/meals/headcount-summary?date=` | canViewMeals |
| GET | `/meals/headcount?date=&mealType=` | canManageMeals |

**Headcount summary** replaces eligible counts for kitchen prep once polls exist. Until Phase 6, clients must use:

- `GET /meals/eligibility-summary?date=` — subscription-based eligible participants
- Label: **eligible participants**, never headcount

---

## Integration points from Phase 5

1. **Daily menu must be PUBLISHED** before opening a poll.
2. **MealEligibilityEngine** logic for who is eligible to respond mirrors Phase 5 eligibility (ACTIVE member + ACTIVE participation + plan covers meal type + date in range; PAUSED excluded).
3. **MealParticipation** remains the enrollment anchor — no separate subscriber entity.
4. **Notifications** (WhatsApp / push) are out of scope until a later phase; poll open can be manual in v1.

---

## Out of scope for Phase 6 (Phase 7+)

- MealEntitlement, credits, wallet, invoices
- Changing occupancy `foodChargeSnapshot` / `foodEnabled` semantics
- Weekly menu templates, menu history archive

---

## Success criteria (Phase 6)

After implementation:

1. Operator publishes daily menu → opens poll → members respond.
2. Kitchen view shows **headcount** from responses, not eligible participant count.
3. Phase 5 eligibility APIs remain available for spaces without active polls.
