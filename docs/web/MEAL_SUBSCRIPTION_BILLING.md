# MEAL_SUBSCRIPTION_BILLING.md — Phase 10

**Status:** Complete (web)  
**Mobile source of truth:** `K:\CountIn`  
**Web:** `K:\CountInWeb\src\modules\meals` (+ payments/members integrations)  
**Backend:** unchanged  

> Desktop UX may improve layout only. Business rules, APIs, DTOs, validation, and permissions match mobile. Meal billing settings remain on Edit Space (Phase 9); not re-implemented here.

---

## 1. Architecture

```
Meals (canManageMeals)
  ├─ /meals/plans              Owner plan catalog + activation queue
  └─ /meals/plans/customer     Customer plan browse + activation request

Payments
  └─ /payments/day-meals       Tenant day-meal list/bulk proof
                               Owner headcount payment approve/reject/remind

Members (existing)
  └─ Subscription panel        Prepaid meal-balance purchase/history/end

Edit Space (Phase 9)
  └─ Meal billing + poll closing settings
```

State: TanStack Query + Axios. No new Zustand stores.

---

## 2. Subscription lifecycle (mobile parity)

| Step | Mobile | Web |
|------|--------|-----|
| Create/update plan | SubscriptionPlansScreen | Plans tab + PlanFormDrawer |
| Deactivate plan | API only (unused in mobile UI) | Owner inspector → deactivate (API supported) |
| Customer request | CustomerSubscriptionPlansScreen | `/meals/plans/customer` |
| Pending queue | SubscriptionActivationRequestsScreen | Plans workspace → Requests tab |
| Approve/reject | Same screens | Inspector + optional owner notes |
| Status | `getMyCustomerStatus` | Same API |

**Not invented:** No bulk approve (backend has no bulk endpoint). No join codes.

---

## 3. Day-meal billing workflow

| Role | Flow |
|------|------|
| Customer | Meal activity month → action needed / under review / history → single or bulk payment proof |
| Customer poll | Poll response may include `PAY_LATER` / `MARK_AS_PAID` + proof when pay-per-meal |
| Owner | Date + meal type headcount → member payment status → approve / reject / remind |

APIs: `submitMealPollPaymentProof`, `submitBulkMealPollPaymentProof`, `approveMealPollPayment`, `rejectMealPollPayment`, `sendMealPollPaymentReminder`, `getMemberMealActivity`.

Remind only when status is `PENDING` or `REJECTED` (mobile `canSendPaymentReminder`).

---

## 4. Meal balance / billing settings

| Feature | Status |
|---------|--------|
| Space meal billing settings | Phase 9 Edit Space — reused |
| Member meal-balance purchase/history | Members panel — enhanced with **End subscription** |
| Catalog plan bind beyond meal packs | Customer activation → owner approve (creates balance via backend) |

---

## 5. API / DTO reuse

| Client | Endpoints |
|--------|-----------|
| `subscriptionPlansApi` | CRUD plans, deactivate, status, pending/create/approve/reject activation |
| `mealsApi` (extended) | Meal activity, payment proof, approve/reject/remind, poll responses with paymentChoice |
| `memberMealBalanceApi` | Existing + end (UI wired) |
| `mealBillingApi` | Unchanged (Phase 9) |

DTOs: `SubscriptionPlanResponse`, activation request types, `CustomerSubscriptionStatusResponse`, `MemberMealActivityMonth/Day`, `BulkMealPollPaymentProofResponse`, `SubmitPaymentProofRequest`.

---

## 6. Permissions

- Plan admin / activation queue: `canManageMeals` (OWNER/MANAGER)
- Customer plans: authenticated member with linked membership
- Day-meal owner review: `canManagePayments` role gate (same as payments workspace)
- Day-meal tenant: non-manager path when `prepaidBilling === false`

---

## 7. Desktop improvements (documented)

1. Master-detail plans + activation inspector  
2. Searchable plan/request tables  
3. Day-meal KPI strip + section filters + selectable bulk proof  
4. Owner review uses headcount (same data as mobile MealHeadcountPanel), denser table  
5. Sticky footers for save / submit / approve  

---

## 8. Responsive / a11y / performance

- Forms and panels stack below `lg`; tables use DataTable card fallback  
- ARIA on month controls, refresh, panels  
- Query keys invalidate after mutations; no duplicate plan components  

---

## 9. Stop condition

Phase 10 complete. **Do not start** Notifications or Application Hardening in this phase.
