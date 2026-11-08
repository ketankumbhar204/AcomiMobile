# ACOMI Web – OPEN_ENDED End-of-Period Billing Verification Report

**Date:** 2026-11-05
**Scope:** Owner Web only. Backend remains source of truth. No frontend rent generation. No historical ledger mutation.

---

## Summary

Web now presents OPEN_ENDED (No Fixed Move-Out Date) in line with the approved rule: daily rate pricing, **Not yet billed** while the period is open and no RENT row exists, persisted amount/status once the backend generates the bill, and no daily `rentSnapshot` treated as monthly rent in dues or KPIs.

---

## Files / components changed

| Path | Change |
|------|--------|
| `src/modules/payments/utils/paymentDisplay.ts` | **New.** `paymentDisplayTitle` (no duplicate month), `formatPersistedRentBreakdown`, `isDailyRateRentSnapshot` |
| `src/modules/payments/utils/__tests__/paymentDisplay.test.ts` | **New.** Title + breakdown tests |
| `src/modules/payments/components/CompactPaymentCard.tsx` | Title without appended period; optional API breakdown subtitle |
| `src/modules/payments/components/PaymentInspector.tsx` | Same title rule; rent calculation from persisted fields |
| `src/modules/payments/utils/paymentReminderMessage.ts` | Avoid appending month when title already includes it |
| `src/modules/members/components/panels/MemberPaymentsPanel.tsx` | Not yet billed cue + empty-state copy for OPEN_ENDED |
| `src/modules/members/components/MemberCurrentStayCard.tsx` | Move-out **Not fixed** when OPEN_ENDED and no exit date |
| `src/modules/accommodation/utils/stayFinancialDisplay.ts` | OPEN_ENDED: Pricing basis **Daily** + Daily rent (no Monthly labels) |
| `src/modules/accommodation/utils/__tests__/stayFinancialDisplay.test.ts` | OPEN_ENDED presentation assertions |
| `src/modules/members/utils/__tests__/openEndedBilling.test.ts` | Unbilled vs billed + monthly-total guards |

### Already in place (prior pass; verified, not redesigned)

| Path | Role |
|------|------|
| `memberStayDisplay.stayMonthlyTotal` | Returns `null` for OPEN_ENDED / DAILY_RATE |
| `memberDues.isOpenEndedRentUnbilled` | No RENT row → unbilled |
| `OccupiedBedPaymentFace` / `OccupiedBedStaySection` | NO_RECORD → **Not yet billed** for OPEN_ENDED |
| `ExtendStayDialog` (+ EntityInspector / MemberOccupancyPanel) | **New daily rent** / renew stay wording |
| `FinancialSummaryWidget` / Payments KPIs | API billed ledger only |

---

## API fields reused (no new contracts)

| Field | Use |
|-------|-----|
| `payment.title` | Display title as returned |
| `payment.amount` / `baseAmount` / `paymentStatus` / `outstandingAmount` | Exact backend values |
| `billingPeriodStart` / `billingPeriodEnd` | Period display + breakdown |
| `billableDays` / `daysInMonth` / `isProrated` | Partial / occupied-day context |
| `configuredMonthlyAmount` | Daily-rate snapshot when `daily × days ≈ amount` |
| Occupancy `stayKind` / `pricingBasis` / `rentSnapshot` | Stay labels only — not invented bills |

---

## Backend API gaps identified

| Gap | Notes |
|-----|-------|
| No explicit `pricingBasis` / `stayKind` on `SpacePaymentResponse` | Daily-rate breakdown inferred when `configuredMonthlyAmount × billableDays ≈ amount`. Works for OPEN_ENDED daily snapshots; optional future enrichment would make this explicit. |
| No first-class “accrued rent” API | Web does **not** invent accrued payable amounts. Unbilled state is labeled **Not yet billed** only. |
| Summary KPIs | Continue to use backend payment-month summary; Web does not multiply daily × 30 offline. |

---

## Payment display: before vs after period closure

| State | Web behaviour |
|-------|----------------|
| Open period, no RENT row | **Not yet billed** (member payments cue + empty history; occupied-bed face). No outstanding rent invented. |
| Deposit only | Deposit remains separate; does not clear “not yet billed” for rent. |
| Period closed / vacate — backend RENT row exists | Show persisted `amount`, status, due date; breakdown e.g. `₹1,000 × 26 days (5 Nov–30 Nov) = ₹26,000` when fields present. |
| Historical premature RENT rows | Display exactly as returned. No suppress / rewrite / reinterpret. |

---

## Dashboard / KPI changes

- No new frontend expected-rent math for OPEN_ENDED.
- `stayMonthlyTotal` excludes OPEN_ENDED daily rates from any monthly interpretation.
- Financial widgets and payment workspace KPIs remain backend-summary driven.
- Empty pending copy clarifies that daily-rate stays bill when the period closes or on vacate.

---

## Tests executed

```
npx vitest run src/modules/members/utils src/modules/accommodation/utils src/modules/payments/utils
```

**Result:** 10 files, **120 passed**.

Covered requirements include: Not yet billed, accrued ≠ payable, breakdown from persisted fields, daily ≠ monthly, MONTHLY totals unchanged, title without duplicate month.

Lint on edited files: clean.

---

## Regression confirmation (intentionally unchanged)

| Flow | Confirmation |
|------|----------------|
| MONTHLY rent display / totals | `stayMonthlyTotal` and MONTHLY stay rows unchanged |
| SHORT fixed-duration | stayFinancialDisplay SHORT path unchanged |
| Deposit | Separate SECURITY rows; not in rent breakdown |
| Vacant → Bed Detail → Allocate | Untouched |
| Reservation / transfer / checkout entry | Untouched (checkout bills via backend) |
| Payment collection / reminders | Titles cleaned only; no new workflow |
| Mess / Tiffin | Untouched |

---

## Implementation rule compliance

- Smallest safe presentation changes only.
- No frontend billing generation.
- No backend contract changes.
- No production / historical payment mutation.
