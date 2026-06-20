# Phase 6 Handoff — Menu Option Polls & Member Responses

Phase 5 delivers menus, participation, and share preview. Phase 6 adds **numbered menu options** that members pick (one per meal) — not simple YES/NO attendance.

---

## Share message format (6A)

WhatsApp / copy text uses numbered options per meal:

```
Breakfast
1. Combo 1
Roti, Tomato Rice, Plain Daal
2. Combo 2
Dal Fry, Plain Rice
3. Not available for Breakfast

Lunch
...
```

Implemented in `MealSharePreviewService.buildMessageText()` and shown on `MenuSharePreviewScreen`.

---

## Response model (6B–6C)

Members pick **one radio option per open poll**:

- Each menu entry from the published `daily_menu` → `meal_poll_option` (`MENU_ENTRY`)
- Synthetic last option → `NOT_AVAILABLE` (“Not available for Breakfast/Lunch/Dinner”)

`meal_response.selected_option_id` stores the choice (not ATTENDING/NOT_ATTENDING).

---

## Entities (V48)

### `meal_poll`

| Column | Notes |
|--------|-------|
| id | UUID PK |
| space_id | FK |
| daily_menu_id | FK |
| meal_type | BREAKFAST / LUNCH / DINNER |
| poll_date | Local date |
| status | OPEN, CLOSED |
| opened_at, closed_at | |

Unique: `(space_id, poll_date, meal_type)`.

### `meal_poll_option`

| Column | Notes |
|--------|-------|
| id | UUID PK |
| poll_id | FK |
| option_type | MENU_ENTRY, NOT_AVAILABLE |
| daily_menu_entry_id | FK nullable |
| sort_order | Matches share message numbering |
| label, detail | Snapshot at poll open |

### `meal_poll_response`

| Column | Notes |
|--------|-------|
| id | UUID PK |
| poll_id | FK |
| member_id | FK |
| selected_option_id | FK → meal_poll_option |
| responded_at | |
| source | APP, WHATSAPP (future) |

Unique: `(poll_id, member_id)`.

---

## APIs

Base: `/api/v1/spaces/{spaceId}/meal-polls`

| Method | Path | Role |
|--------|------|------|
| GET | `?date=` | List polls for date |
| GET | `/{date}/{mealType}` | Single poll with options |
| POST | `/{date}/{mealType}/open` | canManageMeals — snapshots menu options |
| POST | `/{date}/{mealType}/close` | canManageMeals |
| POST | `/{date}/responses` | TENANT/CUSTOMER — batch `{ selections: [{ mealType, selectedOptionId }] }` |

---

## App flows

### Operator

1. Publish daily menu
2. **Share menu** — numbered WhatsApp text **and auto-opens in-app polls** for selected meals
3. Optional: **Close poll** on Menu Planning when cutoff time passes
4. Headcount dashboard — per option breakdown ✅ (`GET /meals/headcount?date=`)

### Member (TENANT / CUSTOMER)

1. Dashboard → **Choose tomorrow's meals**
2. `MealPollResponseScreen` — radio groups per open poll
3. Save → `POST /meal-polls/{date}/responses`

---

## Headcount (6D) ✅

Kitchen view shows per option:

- Combo 1: 12
- Combo 2: 5
- Not available: 3

`GET /api/v1/spaces/{spaceId}/meals/headcount?date=` — implemented. Used on menu planning and Mess dashboard (`todaysHeadcount`).

Phase 5 **eligible participants** APIs remain for spaces without open polls.

---

## Billing signals (Phase 6 → 7)

Member meal activity amounts feed the Phase 7 dashboard and payments ledger. See [payments-phase-7-dashboard.md](./payments-phase-7-dashboard.md).

---

## Out of scope

- Rent collection recording, subscription/credits invoices (Phase 7 — partial; see [payments-phase-7-dashboard.md](./payments-phase-7-dashboard.md))
- Automated WhatsApp poll delivery (manual share in v1)
- WhatsApp inbound response parsing

---

## Success criteria

1. Share text shows numbered options + “Not available for [Meal]”.
2. Operator opens poll after publish.
3. Member picks one option per meal in app.
4. Responses stored per `member_id` + `selected_option_id`.
