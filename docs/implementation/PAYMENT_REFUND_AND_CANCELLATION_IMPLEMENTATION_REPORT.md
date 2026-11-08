# Payment Refund and Cancellation — Implementation Report

**Date:** 2026-11-07
**Production-ready:** **No**
**Decision:** Authoritative financial recalculation after cancel/refund/retain is corrected at the backend ledger/snapshot layer. UI filters/status/settlement UX are aligned. **Do not ship** until live API smoke + Web/Android device verification of Expected/Collected/Pending/Under Review after each settlement scenario.

## Explicit production-readiness decision

| Gate | Status |
|---|---|
| Backend cancel / refund / retain / REFUNDED accounting | Code + unit tests **pass** |
| Authoritative Expected / Collected / Pending / Under Review formulas | **Corrected** this pass |
| Snapshot rebuild after settle/cancel (+ log on failure) | **Hardened** |
| Web/Android consume snapshot APIs (no client total invention) | **Verified** — invalidate/refetch only |
| Refund badge / title / auto-retain settlement UX | **Closed** |
| API smoke (live settle/cancel/reservation matrices) | **Not run** |
| Device testing of dashboards / reminders / Mess-Tiffin | **Not run** |
| **Production-ready?** | **No** |

---

## Root causes of incorrect Expected / Collected / Pending

1. **Pending used residual math** `expected − collected − underReview`. After a refund, Collected fell while Expected stayed (correct), so Pending **reopened** even though the obligation was still `PAID`/`REFUNDED` with outstanding 0.
2. **Occupancy-contract Expected ignored cancelled rent rows** when occupancy billing won over payment SoT — cancelling unpaid rent left Expected unchanged.
3. **Cancelled reservations closed as `VACATED` without move-in** remained billable, so `ensureMonth` could reinflate Expected after settlement refresh.
4. **Snapshot refresh failures after settle/cancel were swallowed silently**.
5. **Refunded filter** previously matched only `paymentStatus=REFUNDED`, so partial refunds (still `PAID` + retained) appeared only under Paid.

---

## Authoritative financial formulas (single SoT)

**Services:** `SpaceBillingService` → `SpacePaymentLedgerSupport` → `PaymentMonthSnapshotService` → Payments summary + Dashboard financial APIs.

| KPI | Formula |
|---|---|
| **Expected** | Meal expected (if separate) + occupancy rent (if billable) − cancelled `RENT/MONTHLY` amounts + non-recurring obligations excluding `CANCELLED` and `REFUND`. Refunds do **not** reduce Expected. |
| **Collected (net)** | Σ non-`REFUND` rows in `{PAID, REFUNDED}` − Σ `REFUND` category rows in `{PAID, REFUNDED}`. Retained cash stays inside the parent amount (not subtracted). |
| **Under Review** | Σ amounts in `{UNDER_REVIEW, PROOF_UPLOADED}`. Never counted as collected. |
| **Pending** | Unpaid obligation SoT: Σ amounts in `{PENDING, REJECTED, UPDATE_REQUESTED}`, excluding `REFUND` / `CANCELLED` / collected statuses; clamped by residual so Mess stale PENDING + under-review coverage does not inflate Pending. Refund/retain with no unpaid rows ⇒ Pending **0**. |

### Quick reference (user table)

| Operation | Expected | Collected (net) | Pending |
|---|---|---|---|
| Create ₹5,500 obligation | ₹5,500 | ₹0 | ₹5,500 |
| Collect ₹5,500 | ₹5,500 | ₹5,500 | ₹0 |
| Refund ₹1,200 (+ retain rest) | ₹5,500 | ₹4,300 | ₹0 |
| Cancel unpaid ₹2,000 | −₹2,000 | unchanged | −₹2,000 |

---

## Status mapping (display vs storage)

| Business display | Storage / detection |
|---|---|
| Pending / Overdue | `PENDING` (+ overdue flags); not cancelled |
| Under Review | `UNDER_REVIEW` / `PROOF_UPLOADED` |
| Paid | `PAID` with no refund activity |
| Partially Refunded | `PAID` + `partiallyRefunded` / `refundedAmount > 0` |
| Refunded | `REFUNDED` **or** `paymentCategory=REFUND` child row |
| Cancelled | `CANCELLED` (unpaid only) |
| Rejected / Needs update | `REJECTED` / `UPDATE_REQUESTED` |

REFUND child rows may be stored as `PAID` completed cash-outs — UI always shows **Refunded**.

---

## Backend changes (this financial pass)

| File | Change |
|---|---|
| `SpacePaymentLedgerSupport.java` | `sumUnpaidObligationAmount`, `sumCancelledRecurringRentAmount`; Pending SoT; Collected unchanged (net via REFUND rows); advance excludes CANCELLED |
| `SpaceBillingService.java` | Subtract cancelled rent from occupancy Expected; Pending from unpaid SoT |
| `OccupancyBillingCalculator.java` | `VACATED` without `actualMoveInAt` is not billable (cancelled reservation) |
| `PaymentSettlementService.java` | Log snapshot refresh failures; `refreshMonthSnapshot` after occupancy close |
| `OccupancyService.java` | Refresh month snapshot **after** reservation close |
| `PaymentMonthSnapshotService.java` | Trust stored Pending from rebuild (no residual reopen on read) |
| `SpacePaymentRepository.java` | Refund-related / pure-paid history queues + counts |
| `MonthlyRentEligibility.java` / `SpacePaymentGenerationService.java` | Compile fixes (`Evaluation.allow()`, public freeze helper) |

---

## Web / Android (consume SoT — no invented totals)

| Area | Behaviour |
|---|---|
| Settle / cancel success | Invalidate payments + dashboard queries; refetch summary from API |
| Android | `publishPaymentUpdated` → `invalidatePaymentsMonthCaches` + `invalidateDashboardQueries` |
| Web | `usePaymentMutations` invalidate `payment*` + `dashboard-summary` |
| Filters | Refunded includes partial + REFUND children; Paid excludes them |
| Settlement UX | Auto retained = remaining − refund (read-only) |
| Timeline / Recent activity | Amount shown per event |

Clients must **not** patch Expected/Collected/Pending locally after settlement.

---

## Test results

```text
cd K:\Projects\Acomi\Backend\acomi-backend
.\mvnw.cmd -q "-Dtest=SpacePaymentLedgerSupportTest,OccupancyBillingCalculatorTest" test
# PASS (exit 0) — 2026-11-07

# Includes:
# - refund does not reopen Pending
# - unpaid obligation Pending SoT
# - cancelled rent sum for Expected adjustment
# - cancelled reservation without move-in not billable
```

Android/Web unit tests for refund display/filters/timeline amounts: **pass** (earlier this day).

API/device smoke of dashboard cards after cancel/refund/retain: **not run**.

---

## Remaining gaps (block production-ready = Yes)

1. Live API smoke: create → collect → partial refund+retain → full refund → cancel unpaid; assert summary KPIs.
2. Device: Payments summary cards + Dashboard financial widget after each mutation; navigate away/back.
3. Reservation cancel matrices with advance/deposit.
4. Reminder eligibility after cancel.
5. Mess/Tiffin + MONTHLY/SHORT/OPEN_ENDED regression.
6. Optional API enrichment: `relatedPaymentId` / original `paymentReference` on REFUND child DTOs.
7. Timeline still derives amount from remarks / payment amount (no dedicated `amount` column).

---

## Filter behaviour

| Filter | Includes |
|---|---|
| Paid | Pure `PAID` with no refund activity; excludes REFUND children |
| Refunded | `REFUNDED` + partial (`PAID`+refunded) + REFUND children |
| Cancelled | `CANCELLED` only |
| Under Review | `UNDER_REVIEW` / `PROOF_UPLOADED` |
| Pending | Unpaid customer-action statuses |

Counts for history queues use the same definitions on the backend card APIs.
