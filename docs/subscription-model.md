# Subscription model (Model B — accumulating balance)

## Business rule

A prepaid meal subscription is an **accumulating meal balance**. Every purchase **adds** meals to the member's existing balance. Purchases never replace the balance unless `replaceBalance: true` is sent explicitly (legacy / migration only).

### Example

| Action | Meals | Amount |
|--------|-------|--------|
| Create subscription | 30 | ₹3000 |
| Add meals | +15 | ₹1500 |
| Add meals | +10 | ₹1000 |

**Current balance:** 55 meals  
**Total amount paid:** ₹5500

## API

`POST /spaces/{spaceId}/members/{memberId}/meal-balance/purchases`

- Default behaviour: `balance += amount` (accumulating).
- `replaceBalance: true` — optional legacy flag; sets balance to the purchase amount only.

### Response fields (`MemberMealBalance`)

| Field | Meaning |
|-------|---------|
| `mealsRemaining` / `balance` | Current meal balance |
| `mealsIncluded` | Meals purchased in the **current subscription period** (after the last ENDED event, or all time if never ended) |
| `currentAmountPaid` | Amount collected in the **current subscription period** |
| `mealsUsed` | `mealsIncluded − mealsRemaining` |
| `validTill` | From the most recent purchase |
| `active` | Not manually ended and `validTill ≥ today` |

## Subscription history

`GET .../meal-balance/subscription-history`

Events:

- **CREATED** — first purchase
- **MEALS_ADDED** — subsequent purchases (legacy `UPDATED` / `RENEWED` mapped on the client)
- **ENDED** — manual end

Each event includes `balanceAfter` (running balance after the event).

## Meal consumption

Poll confirmations debit the balance via `syncPollDebit` (ledger `DEBIT` entries). Balance decreases automatically when meals are consumed.

## End subscription

`POST .../meal-balance/end`

Sets balance to zero, records `endedAt` / `endedBy`, writes an `ENDED` ledger entry. History is preserved.

## UI terminology

| Old | New |
|-----|-----|
| Update subscription | **Add meals** |
| Meals included (on add form) | **Meals to add** |
| Subscription price | **Amount received** |
| Amount paid (summary) | **Total amount paid** |

Subscription history lives on the dedicated **History** screen, not on the main Meals tab.
