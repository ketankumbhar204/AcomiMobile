# OPEN_ENDED End-of-Period Billing — Implementation Report

**Date:** 2026-11-05
**Policy:** Rent = Daily rate × Actual billable occupied days. Generate RENT/MONTHLY only after the billing period closes (or on vacate). MONTHLY and fixed-duration SHORT unchanged. Do not rewrite historical ledger rows.

---

## 1. Billing lifecycle (Backend)

| Path | Behaviour |
|------|-----------|
| Allocate / move-in (`createActivationPayments`) | OPEN_ENDED `DAILY_RATE`: deposit only. No open-month RENT row. |
| Month sync (`syncExpectedPayments`) | OPEN_ENDED `DAILY_RATE`: rent only when `shouldGeneratePayableRent` is true (closed month or vacated). |
| Month-close job (`OpenEndedRentMonthCloseScheduler`) | Cron `0 40 0 1 * *` (configurable). Calls `syncExpectedPaymentsInternal` for previous calendar month — no owner-membership dependency. |
| Vacate (`settleOpenEndedRentOnVacate`) | Closes the member period immediately; generates final rent through checkout date (inclusive). |
| Idempotency | Existing upsert by space+member+month+type+category; vacate / retry safe. |
| Deposit / meals | Unchanged and independent of the rent gate. |

### Gate

`OccupancyBillingCalculator.shouldGeneratePayableRent`:

- Non–OPEN_ENDED-daily → generate as before.
- OPEN_ENDED daily + month before `asOf` month → generate.
- OPEN_ENDED daily + vacated with vacate date in that month → generate.
- Otherwise (open current month, still active) → accrue only; no payable row.

### Formula

`Rent = Daily rate (rent_snapshot / configuredMonthlyAmount snapshot) × Inclusive billable days` via existing `BillingAmountCalculator` / `OccupancyBillingCalculator.computeBilling`.

---

## 2. Changed files

### Backend (`K:\Projects\Acomi\Backend\acomi-backend`)

| File | Change |
|------|--------|
| `OccupancyBillingCalculator.java` | `isOpenEndedDailyRate`, `shouldGeneratePayableRent` |
| `SpacePaymentGenerationService.java` | Gate activation/sync; `settleOpenEndedRentOnVacate`; `syncExpectedPaymentsInternal` for system jobs |
| `OpenEndedRentMonthCloseScheduler.java` | New month-close cron |
| `OccupancyService.java` | Vacate → settle + snapshot refresh |
| `SpacePaymentRepository.java` | `findOpenEndedDailyRateMonthlyRentPayments` |
| `OpenEndedPrematureRentReconciliationService.java` | Read-only premature-bill report (no mutations) |
| Tests | Stay matrix (activation deposit-only + vacate settle), calculator gate, reconciliation heuristics |

### Android (`K:\AcomiMobile`)

| Area | Change |
|------|--------|
| `occupancyContract.ts` | Daily rate never treated as monthly; `computeOpenEndedAccruedRentForMonth` for labeled accrued only |
| Dashboard offline fallback | OPEN_ENDED daily excluded from expected/pending (null totals) |
| Payments / occupied bed | “Not yet billed”; accrued row separate from outstanding |
| Extend / renew | OPEN_ENDED → daily / open-ended wording |
| `UniversalPaymentCard` | Billable-days subtitle from persisted row fields |

### Owner Web (`K:\AcomiWeb`)

| Area | Change |
|------|--------|
| `memberStayDisplay` / dues | Daily not monthly; unbilled cue |
| `MemberPaymentsPanel` | “Not yet billed” when no RENT row |
| Occupied bed faces | NO_RECORD → “Not yet billed” for OPEN_ENDED |
| `ExtendStayDialog` | “New daily rent” when OPEN_ENDED |
| `PaymentInspector` | Partial-period amount basis (billable days) |
| Financial KPIs | Still API billed ledger only |

---

## 3. Reconciliation (historical ₹26,000-class rows)

**Do not auto-delete, reverse, suppress, or rewrite.**

Tooling: `OpenEndedPrematureRentReconciliationService.findPrematureOpenEndedRentRows()`.

Premature heuristic:

- OPEN_ENDED `DAILY_RATE` RENT/MONTHLY row
- `createdAt` date ≤ `billingPeriodEnd`
- Excludes vacate settles (vacate date = period end, or remarks contain “vacate”)
- Month-close rows created after period end are excluded

Before production cutover:

1. Run the report against production (or a replica).
2. Capture status, paid/outstanding, reminders/collections.
3. Obtain explicit approval for any historical treatment.
4. Apply the new generation rule only to future periods after an agreed effective date.

---

## 4. Acceptance mapping

| Criterion | Status |
|-----------|--------|
| No OPEN_ENDED future-day payable on activation | Done (gate + tests) |
| Open periods do not generate payable rent | Done |
| Closed periods → one actual rent charge | Done (month-close + sync gate) |
| Checkout → final actual days only | Done (`settleOpenEndedRentOnVacate`) |
| Reminders only for generated bills | Unchanged path (row-based); no new accrual reminders |
| Accrued ≠ billed outstanding (Android/Web) | Done |
| Ledger history preserved | Done (no auto rewrite) |
| MONTHLY / SHORT regression | Stay matrix + calculator tests retained |

---

## 5. Test results (this pass)

- Android: `occupancyMonthBilling`, `memberDues` — **20 passed**.
- Backend: `OccupancyBillingCalculatorTest`, `SpacePaymentGenerationStayMatrixTest`, `OpenEndedPrematureRentReconciliationServiceTest` — **passed** (`mvn -Dtest=... test`, exit 0).
- Web: members/accommodation utils vitest — **111 passed** (implementer run).

Isolated test data only; production ledger not modified.

---

## 6. Follow-ups

1. Obtain approval and apply agreed treatment for premature historical rows (report first).
2. Optional admin/API endpoint wrapping `findPrematureOpenEndedRentRows` for ops.
3. Confirm due-date policy remains correct when bills are created on the 1st after month close (existing `billingDueDay` — no new policy invented).
4. E2E device/web walkthrough of Nov 5 move-in → mid-month accrued → Dec 1 bill / mid-month vacate.
