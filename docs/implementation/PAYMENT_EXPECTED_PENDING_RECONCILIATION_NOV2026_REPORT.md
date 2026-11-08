# Payment Expected vs Pending Reconciliation — Sunrise PG 77 (Nov 2026)

**Date:** 2026-11-08
**Owner mobile:** `7777777777`
**Space:** Sunrise PG 77 (`859f3e66-453a-4a5b-ab25-56df12cdabf2`)
**Month:** `2026-11`

---

## Screenshot KPIs (before fix)

| KPI | Amount |
|---|---|
| Expected | ₹25,266.67 |
| Collected | — / ₹0 |
| Under Review | — / ₹0 |
| Pending | ₹19,666.67 |
| **Gap** | **₹5,600.00** |

---

## Exact payment IDs (Nov 2026)

### Active unpaid (sum = Pending ₹19,666.67)

| Payment ID | Member | Type | Amount | Status | Notes |
|---|---|---|---|---|---|
| `4f162d82-9608-438d-b20a-4b11c7c59714` | Member One | RENT/MONTHLY | ₹6,666.67 | PENDING | Prorated 25/30 of ₹8,000 (6–30 Nov) |
| `1dbf3c02-140b-4c02-8ca1-8d0861e4c7b4` | Member One | DEPOSIT/SECURITY | ₹5,000.00 | PENDING | Single deposit for occupancy `2d322690-…` |
| `25eff553-c7ec-4bc5-b8d7-c0cc7baa88a2` | Member Two | RENT/MONTHLY | ₹5,000.00 | PENDING | Prorated 25/30 of ₹6,000 (6–30 Nov) |
| `3ab07445-aa06-4fef-961a-b89ef99a3a0a` | Member Three | DEPOSIT/SECURITY | ₹3,000.00 | PENDING | Reservation deposit (no occupancy_id on row) |

**Unpaid total:** 6666.67 + 5000 + 5000 + 3000 = **19666.67** (= Pending)

### Cancelled (excluded from Expected extras / Pending)

| Payment ID | Member | Type | Amount | Status |
|---|---|---|---|---|
| `f595b1f3-c3d4-40bd-b095-192d5992a82d` | Member Four | RENT/ADVANCE | ₹2,000.00 | CANCELLED |
| `04583833-f733-4dcf-811c-7470d89e22aa` | Member Four | RENT/MONTHLY | ₹4,000.00 | CANCELLED |
| `71ddc194-bc7c-4b1d-a664-fd383a4dd61a` | Member Four | DEPOSIT/SECURITY | ₹3,000.00 | CANCELLED |
| `769e1d07-16f6-4dc9-92ae-d66218aa110e` | Member Two | DEPOSIT/SECURITY | ₹3,000.00 | CANCELLED |

Cancelled rows are correctly excluded from `sumUnpaidObligationAmount` and `sumNonRecurringObligationAmount`.

---

## ₹5,600 gap — root cause

Per-member snapshot before fix:

| Member | Expected | Pending |
|---|---|---|
| Member One | 11,666.67 | 11,666.67 |
| Member Two | 5,000.00 | 5,000.00 |
| Member Three | 3,000.00 | 3,000.00 |
| **Member Four** | **5,600.00** | **(null)** |
| **Space total** | **25,266.67** | **19,666.67** |

**Member Four occupancy driving the ghost Expected:**

| Field | Value |
|---|---|
| Occupancy ID | `9145622b-aa15-4a60-896a-ff551818760b` |
| Status | `ACTIVE` |
| Stay | `OPEN_ENDED` / `DAILY_RATE` |
| Daily rent | ₹400 |
| Move-in | 2026-11-07 (`actual_move_in_at` set) |

Open-ended daily-rate rules intentionally **do not** create a payable `RENT/MONTHLY` row while the calendar month is still open (`shouldGeneratePayableRent` = false).
`SpaceBillingService` still added occupancy contract rent into **Expected**, so Expected rose by Member Four’s accrual (**₹5,600** in the stored snapshot) with **no** matching Pending payment.

**Pending used unpaid SoT** (`min(unpaid, residual)`), so Pending stayed at ₹19,666.67 while Expected showed ₹25,266.67.

> Note: Live formula for ₹400/day from 7–30 Nov is ₹9,600 (400×24). The stored member-month Expected was ₹5,600 at investigation time (stale/intermediate snapshot). The reconciliation bug is the open-month accrual entering Expected without a payable row; the gap amount equals Member Four’s Expected line exactly.

### Other investigation answers

1. **Member One “two deposits”** — Not a duplicate. ₹5,000 is Member One; ₹3,000 overdue deposit is **Member Three** (`3ab07445-…`).
2. **Cancelled booking advance / deposit / remaining** — Correctly excluded from Pending and non-recurring Expected extras.
3. **Member One rent ₹6,666.67** — Correct: `configured_monthly_amount=8000`, `billable_days=25`, `days_in_month=30`, period 6–30 Nov, `is_prorated=true`.
4. **Overdue day counts** — Match due dates vs 8 Nov (due 6 → 2 days; due 1 → 7 days).
5. **Android UI** — Displays ledger/snapshot KPIs; no client-side Expected/Pending invention.

---

## Fix

**Backend only** (no UI / API contract change):

1. `OccupancyBillingCalculator.contributesToExpectedCharges(...)`
   - Monthly / legacy stays: billable ⇒ contributes.
   - `OPEN_ENDED` + `DAILY_RATE`: contributes only when `shouldGeneratePayableRent` is true (month closed or vacated).

2. `SpaceBillingService.buildRow`
   - Adds occupancy rent to Expected only when `contributesToExpectedCharges` is true.

After month close / vacate, payable rent is generated and Expected includes it again — aligned with Pending/Collected.

Nov 2026 snapshot rows for this space were cleared so the next Payments load rebuilds KPIs under the new rule (Expected should become **₹19,666.67** = Pending while Member Four’s open-ended stay has no payable rent yet).

---

## Tests

| Test | Intent |
|---|---|
| `openEndedDailyRate_openMonthDoesNotContributeToExpectedUntilPayable` | Accrual may compute, but Expected gate is false mid-month; true after month close |
| `cancelledReservationWithoutMoveIn_doesNotContributeToExpected` | VACATED without `actualMoveInAt` not billable |
| `cancelledBookingAdvanceDepositAndRemainingDoNotAffectPendingOrExtras` | Cancelled Member Four-style rows excluded |
| `sunrisePg77VisibleOverdueObligationsReconcilePendingAt19666_67` | Unpaid SoT = 19666.67; inflated Expected cannot raise Pending |

Run:

```text
cd K:\Projects\Acomi\Backend\acomi-backend
.\mvnw.cmd "-Dtest=OccupancyBillingCalculatorTest,SpacePaymentLedgerSupportTest" test
```

---

## Changed files

| File | Change |
|---|---|
| `…/OccupancyBillingCalculator.java` | `contributesToExpectedCharges` |
| `…/SpaceBillingService.java` | Gate occupancy Expected on that helper |
| `…/OccupancyBillingCalculatorTest.java` | Regression tests |
| `…/SpacePaymentLedgerSupportTest.java` | Cancelled + Pending reconciliation tests |
| `docs/implementation/PAYMENT_EXPECTED_PENDING_RECONCILIATION_NOV2026_REPORT.md` | This report |

---

## Unresolved / follow-up

- Restart / redeploy backend, open Payments for Nov 2026, confirm Expected = Pending = ₹19,666.67.
- Optional: audit why the stored Member Four Expected was ₹5,600 vs live ₹9,600 accrual (snapshot timing); does not change the fix.
- Refunds / retained amounts: existing ledger rules unchanged; covered by prior `SpacePaymentLedgerSupportTest` refund cases.
