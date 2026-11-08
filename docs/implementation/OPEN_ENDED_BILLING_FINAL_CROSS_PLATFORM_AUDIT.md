# OPEN_ENDED Billing — Final Cross-Platform Verification & Production Readiness Audit

**Date:** 2026-11-06
**Nature:** Verification and controlled defect-fixing (not a new billing implementation)
**Sources reviewed:**
- `OPEN_ENDED_BILLING_PAYMENT_IMPACT_AUDIT.md`
- `OPEN_ENDED_END_OF_PERIOD_BILLING_IMPLEMENTATION_REPORT.md`
- `OPEN_ENDED_WEB_BILLING_VERIFICATION_REPORT.md`
**Method:** Code + unit tests inspected across Backend, Android (`AcomiMobile`), Owner Web (`AcomiWeb`). Reports treated as references, not proof.

**Classification key**

| Tag | Meaning |
|-----|---------|
| **PASS** | Verified in code and/or automated tests |
| **FAIL** | Defect found (fixed in this pass if listed under §9) |
| **NOT VERIFIED** | Needs replica/env/device/manual validation |
| **REQUIRES APPROVAL** | Business or historical-data decision |

---

## 1. Approved rule confirmation

| Rule | Status |
|------|--------|
| OPEN_ENDED + `DAILY_RATE`: daily rate is pricing basis | **PASS** |
| No fixed checkout required | **PASS** |
| Only actual occupied (inclusive) days chargeable | **PASS** — `BillingAmountCalculator.resolvePeriod` |
| No future days charged in advance | **PASS** — gate blocks open-month payable rows |
| No payable RENT while period open and member active | **PASS** — `shouldGeneratePayableRent` |
| One `RENT / MONTHLY` after calendar month closes | **PASS** — month-close + sync gate |
| Checkout before month-end → final rent through vacate (inclusive) | **PASS** — `settleOpenEndedRentOnVacate` |
| Formula: Daily × Actual Billable Days | **PASS** — daily×daysInMonth then inclusive proration |
| Deposit separate | **PASS** |
| MONTHLY / SHORT / Mess untouched | **PASS** (code paths + stay-matrix tests) |

---

## 2. Backend verification

| Check | Status | Evidence |
|-------|--------|----------|
| `shouldGeneratePayableRent` / `isOpenEndedDailyRate` | **PASS** | `OccupancyBillingCalculator`; test `openEndedDailyRate_payableRentOnlyAfterPeriodClosesOrVacate` |
| Activation = deposit only for OPEN_ENDED daily | **PASS** | `createActivationPayments` + `untilILeaveDailyRate_activationCreatesDepositOnly_noOpenMonthRent` |
| Open current month does not create rent | **PASS** | Gate returns false while active in current month |
| Month-close processes previous calendar month | **PASS** | `OpenEndedRentMonthCloseScheduler` → `YearMonth.now().minusMonths(1)` |
| Scheduler without owner membership | **PASS** | `syncExpectedPaymentsInternal` (no membership) |
| Repeated scheduler / sync idempotent | **PASS** | Upsert by space+member+month+type+category; frozen/paid skipped |
| Vacate settles actual days only | **PASS** | `OccupancyService.vacate` → `settleOpenEndedRentOnVacate`; stay-matrix vacate test (e.g. Nov 5–12 → 8 days) |
| Vacate does not rewrite prior months | **PASS** | Settles vacate month only; prior closed months via month-close/sync |
| Reminders only for persisted payments | **PASS** | `OverduePaymentService` / repository candidates on `SpacePaymentEntity` |
| MONTHLY / SHORT unchanged | **PASS** | Stay matrix + calculator SHORT not billable monthly |
| Reconciliation service read-only | **PASS** | `OpenEndedPrematureRentReconciliationService` — no writes |
| Snapshot “missing rent” heal for open OPEN_ENDED month | **PASS** (fixed) | Was repeatedly healing open months; now gated by `shouldGeneratePayableRent` |

### Scheduler / retry

| Topic | Finding | Status |
|-------|---------|--------|
| Cron | Default `0 40 0 1 * *`; `acomi.billing.open-ended-month-close.enabled` / `.cron` | **PASS** |
| Timezone | JVM/server default; **no** `zone=` on `@Scheduled`; aligns with `YearMonth.now()` | **PASS** (document ops requirement: keep prod JVM TZ consistent, typically IST) |
| Failure logging | Per-space `error` + finish counts | **PASS** |
| Missed month-close recovery | Past `YearMonth` via `syncExpectedPayments` / internal sync / snapshot heal (now correctly gated) | **PASS** |
| Prod cron execution observed | — | **NOT VERIFIED** |

---

## 3. Historical reconciliation — READ ONLY

| Item | Status |
|------|--------|
| Tooling present | **PASS** — `findPrematureOpenEndedRentRows()` |
| Heuristic | Created on/before `billingPeriodEnd`, excluding vacate settles | **PASS** (code) |
| Auto mutate ledger | Does **not** delete/reverse/suppress | **PASS** |
| Report run against production replica | — | **NOT VERIFIED** |
| Treatment of premature rows (e.g. ₹26,000 Nov) | — | **REQUIRES APPROVAL** |

**Required before cutover:** run report on approved replica; capture status, paid/outstanding, reminders; obtain explicit approval; apply new generation rule only after agreed effective date.

---

## 4. Due-date policy findings

**Existing behaviour (unchanged — no new policy invented):**

`BillingAmountCalculator.resolveDueDate(period, billingDueDay)`:

- `billingDueDay` clamped to 1–28 (else space default / 1).
- If period is prorated **and** period start day > 1 → due date = **period start**.
- Else → due date = **billing month** calendar day `billingDueDay`.

| Scenario | Due date | Status |
|----------|----------|--------|
| Nov bill generated on 1 Dec (full/closed month, join day 1) | Due in **November** (e.g. Nov 1 or configured due day) — often already past due on generation day | **PASS** (documented as current behaviour) |
| Mid-month join / vacate (start day > 1) | Due = period start (e.g. join day) | **PASS** |
| Vacate settle after join day 1 of month | May use month billing due day (not vacate day) when start day = 1 | **PASS** (existing rule) |
| Whether past-due on month-close is acceptable | Product decision | **REQUIRES APPROVAL** if a post-close due-date shift is desired |

Reminders use persisted `dueDate` on payment rows — **PASS**.

---

## 5. Android verification

| Surface | Status | Notes |
|---------|--------|-------|
| Member Payments / dues | **PASS** | `notBilled` cue; no RENT → Not yet billed |
| MemberPaymentsScreen empty gating | **PASS** (fixed) | Now “no RENT row”, not `payments.length === 0` |
| OccupiedBedPaymentFace | **PASS** (fixed) | Deposit paid + no rent → Not yet billed (not “Paid”) |
| OccupiedBedStaySection | **PASS** | Not yet billed + labeled Accrued (not billed) |
| Stay / contract summary | **PASS** | No Fixed Move-Out Date; daily `/ day` |
| Move-out “Not fixed” copy | **NOT VERIFIED** | Stay type OK; dedicated move-out string thinner than Web |
| Deposit | **PASS** | Separate |
| Payment details / cards | **PASS** | API amounts; prorated days subtitle when fields exist |
| Daily × days = amount formula on card | Partial vs Web | **PASS** for amounts; richer formula optional (API gap without stayKind) |
| Offline dashboard expected | **PASS** | OPEN_ENDED daily monthly total = `null` |
| Extend / Renew | **PASS** | New daily rent / open-ended renewal |
| Reminders | **PASS** | Persisted payment amounts only |
| Device E2E | — | **NOT VERIFIED** |

Tests re-run: `occupancyMonthBilling` + `memberDues` — **20 passed**.

---

## 6. Web verification

| Surface | Status | Notes |
|---------|--------|-------|
| MemberPaymentsPanel | **PASS** | Not yet billed cue + empty state |
| MemberCurrentStayCard | **PASS** | Stay type, Pricing basis Daily, move-out Not fixed |
| CompactPaymentCard / PaymentInspector | **PASS** | Title without duplicate month; breakdown for prorated/partial from API |
| OccupiedBed faces | **PASS** (fixed) | Deposit paid + unbilled rent → Not yet billed |
| ExtendStayDialog | **PASS** | New daily rent |
| FinancialSummaryWidget / KPIs | **PASS** | API ledger only |
| `stayMonthlyTotal` | **PASS** | `null` for OPEN_ENDED / DAILY_RATE |
| Historical rows | **PASS** | Not filtered out |
| Full-month daily×days breakdown | Limited | Omits when indistinguishable from MONTHLY without `stayKind` on payment DTO — **PASS** (safe); enrich API = future gap |
| Live UI E2E | — | **NOT VERIFIED** |

Tests re-run: `paymentDisplay` + `openEndedBilling` — **12 passed**.

---

## 7. Cross-platform parity

| Topic | Status |
|-------|--------|
| Same backend amount/status for same member/month | **PASS** (both platforms display API rows) |
| Not yet billed semantics | **PASS** after bed-face fix on both |
| Daily vs monthly labels | **PASS** |
| Accrued ≠ outstanding | **PASS** (Android may show labeled accrued; Web primarily Not yet billed) |
| Detector: Android AND vs Web OR for some helpers | Minor | **PASS** for intended OPEN_ENDED+DAILY; Web OR is conservative for monthly-total nulling |
| Side-by-side device/browser for one member | — | **NOT VERIFIED** |

---

## 8. End-to-end scenarios

Isolated automated coverage vs required matrix:

| Scenario | Result | Status |
|----------|--------|--------|
| Move-in 5 Nov ₹1,000/day → deposit only, no Nov RENT | Covered by activation stay-matrix | **PASS** (unit) |
| 12 / 25 Nov still active → no payable RENT | Gate + unit | **PASS** (unit) |
| Nov close → ₹26,000 for 26 days | Formula + calculator mid-month tests; month-close path | **PASS** (unit / code); live cron **NOT VERIFIED** |
| Repeat month-close → no duplicate | Upsert idempotency | **PASS** (code) |
| Checkout 20 Nov after 5 Nov → ₹16,000 / 16 days | Inclusive formula; vacate settle path (similar 5–12 → 8 tested) | **PASS** (code); exact 16-day case **NOT VERIFIED** as dedicated test |
| Checkout retry → no duplicate | Upsert | **PASS** (code) |
| Dec active → bill only after Dec closes | Gate | **PASS** (code) |
| Deposit without rent → separate + Not yet billed | Clients fixed | **PASS** (unit/code) |
| Historical premature row unchanged | No auto rewrite | **PASS** (code); replica report **NOT VERIFIED** |
| MONTHLY / SHORT unchanged | Stay matrix | **PASS** (unit) |
| Partial / paid / overdue / reminder on generated bills | Reminder path row-based | **PASS** (code); device **NOT VERIFIED** |

---

## 9. Files changed for verified defects (this audit pass)

| Repo | File | Defect |
|------|------|--------|
| Backend | `PaymentMonthSnapshotService.java` | Open-month OPEN_ENDED “missing rent” heal → gate with `shouldGeneratePayableRent` |
| Android | `OccupiedBedPaymentFace.tsx` | Deposit-paid face showed Paid while rent unbilled |
| Android | `MemberPaymentsScreen.tsx` | Unbilled detection ignored deposit-only lists |
| Web | `OccupiedBedPaymentFace.tsx` | Same deposit-paid vs Not yet billed |
| Web | `paymentDisplay.ts` + test | Align breakdown with backend `configuredMonthlyAmount = daily × daysInMonth`; avoid false MONTHLY daily labeling |

No historical payment data modified.

---

## 10. Outstanding risks & production rollout prerequisites

1. **REQUIRES APPROVAL** — Run premature-rent reconciliation on production replica; decide treatment of existing advance OPEN_ENDED RENT rows; do not auto-rewrite.
2. **REQUIRES APPROVAL** — Confirm whether month-close bills with due dates already in the past (existing `billingDueDay` policy) are acceptable, or approve a separate due-date change.
3. **NOT VERIFIED** — Observe first production/staging month-close cron (TZ, failures, idempotency).
4. **NOT VERIFIED** — Side-by-side Android + Web walkthrough for one OPEN_ENDED member (open month → vacate or month-close).
5. **Optional gap** — Add `stayKind` / `pricingBasis` on `SpacePaymentResponse` for unambiguous full-month daily breakdown.
6. **Ops** — Ensure JVM timezone for scheduler matches business calendar (IST).
7. Keep Mess/Tiffin, MONTHLY, SHORT, allocate entry paths unchanged in release notes / regression pack.

---

## Overall readiness verdict

| Layer | Verdict |
|-------|---------|
| Backend billing lifecycle | **Ready for staged rollout** pending reconciliation approval + due-date acknowledgement |
| Android / Web presentation | **Ready** after defect fixes in this pass (local unit verification) |
| Production ledger / cron / E2E | **Not production-verified** — complete §10 items before declaring production complete |

**Bottom line:** The approved end-of-period OPEN_ENDED rule is implemented and unit-verified across Backend, Android and Web. Historical premature bills and post-close due-date behaviour need explicit approval; live month-close and cross-client E2E remain **NOT VERIFIED**.
