# Phase 7 — Unified Dashboard & Payments Ledger

**Status:** 🔶 Partial (MVP delivered)  
**Last updated:** June 2026  
**Audience:** Backend, React Native, Product, QA  
**Related:** [development-roadmap.md](./development-roadmap.md) · [api-reference.md](./api-reference.md) · [permissions-backend-spec.md](./permissions-backend-spec.md) · [meals-phase-6-handoff.md](./meals-phase-6-handoff.md)

---

## 1. Goal

One operational dashboard and one payments tab for **all space types**, using generic financial labels:

| Card | Meaning |
|------|---------|
| **Expected Charges** | What members owe this month |
| **Collected** | Amount received |
| **Pending** | `Expected − Collected` (when collected is unknown, pending = full expected) |

Never derive expected charges from **published menus alone** — only from confirmed meal activity and/or occupancy contracts.

---

## 2. Backend module

Package: `com.countin.countin_backend.dashboard`

| Component | Role |
|-----------|------|
| `SpaceDashboardController` | `GET /spaces/{id}/dashboard-summary` |
| `PaymentController` | `GET /spaces/{id}/payments/ledger` |
| `SpaceDashboardSummaryService` | Composes financial + ops + attention |
| `SpaceBillingService` | Per-member ledger rows and space rollup |
| `DashboardAttentionService` | Tomorrow menu + payments overdue cards |
| `DashboardAccessService` | Role gates |
| `OccupancyBillingCalculator` | Rent + food monthly expected from occupancy snapshot |

### Access control

| Endpoint | Roles |
|----------|-------|
| Dashboard summary | `OWNER`, `MANAGER`, `STAFF` |
| Payment ledger | `OWNER`, `MANAGER` |

---

## 3. Financial scenarios

| Scenario | Expected source | Collected source | `financial.source` |
|----------|-----------------|------------------|--------------------|
| Mess (pay per meal) | `MemberMealActivityService` monthly `amountGenerated` | Meal poll `paidAmount` | `MEAL_ACTIVITY` |
| PG / Hostel / Co-living / Rental | Active occupancy `rentSnapshot` (+ food if enabled) | Not implemented | `OCCUPANCY` |
| PG + meal participation | Sum of meal + occupancy per member | Meal payments only | `HYBRID` |
| Mess subscription / credits | Not implemented | — | — |

### Occupancy expected formula

Matches frontend `computeOccupancyMonthlyTotal()`:

- No rent snapshot → `null`
- `foodIncludedInRent` → rent only
- `foodEnabled = false` → rent only
- Else → rent + (`foodChargeSnapshot` ?? 0)

---

## 4. Dashboard summary response

`GET /api/v1/spaces/{spaceId}/dashboard-summary?month=YYYY-MM`

| Block | When present |
|-------|--------------|
| `financial` | Always |
| `messOperations` | `spaceType = MESS` |
| `accommodationOperations` | PG / HOSTEL / CO_LIVING / RENTAL |
| `attention` | Mess: menu/poll + payments; PG: payments only |

### Mess operations

- `membersReceivingMeals` — eligibility distinct count (tomorrow)
- `menusPublishedThisMonth` — published daily menus in selected month
- `openPollsCount` — open polls for tomorrow
- `todaysHeadcount` — sum of `mealsToPrepare` for today (null if zero)
- `pollRespondedCount` / `pollEligibleCount` — open poll response stats

### Accommodation operations

- `occupiedBeds` / `vacantBeds` — summed across active buildings
- `moveInsThisMonth` — active occupancies with `moveInDate` in month
- `pendingPaymentsCount` — ledger rows with status `PENDING` or `PARTIAL`

### Attention kinds

| `kind` | Meaning |
|--------|---------|
| `not_planned` | No tomorrow menus planned |
| `partial_planned` | Some meal slots missing |
| `ready_to_share` | All planned, not all published |
| `poll_open` | Open poll, responses incomplete |
| `payments_overdue` | Members with pending/partial balances |

---

## 5. Payment ledger

`GET /api/v1/spaces/{spaceId}/payments/ledger?month=YYYY-MM`

Returns space summary + per-member rows:

```json
{
  "memberId": "uuid",
  "memberName": "Rahul Kumar",
  "expectedCharges": 8000,
  "collected": null,
  "pending": 8000,
  "currencyCode": "INR",
  "status": "PENDING"
}
```

**Member inclusion:** active meal participations (Mess or hybrid) and/or active occupancies.

**Sort:** pending descending, then name (case-insensitive).

---

## 6. Frontend integration (React Native)

| Area | Files |
|------|-------|
| API | `src/api/dashboardApi.ts` |
| Dashboard hook | `src/hooks/useSpaceDashboard.ts` |
| Payments hook | `src/hooks/usePaymentsLedger.ts` |
| Dashboard UI | `src/screens/dashboard/DashboardScreen.tsx`, `src/components/dashboard/*` |
| Payments UI | `src/screens/payments/PaymentsScreen.tsx`, `src/components/payments/*` |
| Fallback aggregation | `src/utils/dashboardSummaryFallback.ts` |
| Financial math | `src/utils/dashboardFinancial.ts` |
| Response normalization | `src/utils/normalizeDashboardSummary.ts` |

### Client fallback

When dashboard or ledger API returns **404** or **network error**, the app aggregates from existing meal/occupancy/member APIs. Other errors (403, 400) propagate to the UI.

### Permissions (UI)

- Operational dashboard: `canViewOperationalDashboard()` — manage members/meals/occupancy or `canViewSpaceOccupancies`
- Payments tab: `canManagePayments()` — `OWNER` or `MANAGER` only

---

## 7. Verification checklist

- [ ] Mess space: expected from meal activity, collected from poll payments
- [ ] PG space: expected from occupancy contracts, collected null, pending = expected
- [ ] Hybrid PG+food: hybrid source, rent + meal expected on same member row
- [ ] Month navigation changes ledger and summary
- [ ] STAFF sees dashboard; STAFF blocked from payments tab
- [ ] TENANT/CUSTOMER see customer meals section, not operator dashboard
- [ ] Attention shows menu issues (Mess) and payments overdue when applicable
- [ ] Backend restart required after deploy for new endpoints

---

## 8. Not in scope (v1)

- Recording PG rent payments (collected stays empty for occupancy)
- Mess subscription / credits invoice models
- Payment reminders and full payment history
- WhatsApp payment links / UPI

---

## 9. Tests

| Suite | Location |
|-------|----------|
| `OccupancyBillingCalculatorTest` | Backend `dashboard/application/support` |
| `dashboardFinancial.test.ts` | Frontend `src/utils/__tests__` |
| `normalizeDashboardSummary.test.ts` | Frontend `src/utils/__tests__` |
