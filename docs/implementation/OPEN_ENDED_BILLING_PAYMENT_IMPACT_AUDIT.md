# OPEN_ENDED (No Fixed Move-Out Date) — Billing & Payment Impact Audit

**Date:** 2026-11-05
**Scope:** AUDIT ONLY — no code, ledger, or payment-record changes
**Trigger member:** Daily rent ₹1,000; stay type No Fixed Move-Out Date; Payments tab shows Pending **₹26,000** for **Rent – November 2026**

---

## 1. Root cause and source of ₹26,000

### Verdict

**₹26,000 is a real, persisted rent charge** in `space_payments`, not a client-side estimate and not monthly catalog rent.

| Attribute | Value |
|-----------|--------|
| Creation path | Backend `SpacePaymentGenerationService.syncRentPayment` (on allocate/move-in activation sync and/or month sync) |
| Record type | Invoice/charge row: `paymentType = RENT`, `paymentCategory = MONTHLY` |
| Status (as shown) | `PENDING` |
| Month | `2026-11` |
| Title | `Rent — November 2026` |
| Association | Same space + member + occupancy activation billing |

### Exact calculation and billing period

Authoritative backend:

- `OccupancyBillingCalculator` / `BillingAmountCalculator`
- Tests: `openEndedDailyRate_midMonthJoin_isDailyTimesBillableDays`, `untilILeaveDailyRate_billsDailyTimesDaysInMonth_notCatalogMonthly`

For OPEN_ENDED with `pricingBasis = DAILY_RATE` and `rentSnapshot = 1000` (daily):

```text
daysInMonth (Nov 2026)     = 30
configuredMonthlyAmount    = dailyRate × daysInMonth = 1000 × 30 = 30,000
move-in                    = 2026-11-05
billingPeriodStart..End    = 2026-11-05 … 2026-11-30  (inclusive)
billableDays               = 26
amount (prorated)          = 30,000 × 26 / 30 = 26,000
                           = dailyRate × billableDays = 1000 × 26
```

**Was daily rate used?** Yes.
**Was amount from monthly catalog?** No — derived from daily `rentSnapshot` × billable days.
**Due date:** Mid-month join uses period start (**5 Nov 2026**) when prorated.

### Client role

Android `MemberPaymentsTab` / Web `MemberPaymentsPanel` **display** API `payment.amount` and ledger pending from:

- `GET /api/v1/spaces/{spaceId}/payments?month=&memberId=`
- `GET /api/v1/spaces/{spaceId}/payments/members?month=`

They do **not** invent ₹26,000 on device for this screen.

---

## 2. Existing OPEN_ENDED business rules (as implemented)

| Topic | Existing behaviour |
|-------|-------------------|
| Pricing snapshot | Owner-entered **daily** ₹ in `rentSnapshot`; `stayKind=OPEN_ENDED`; `pricingBasis=DAILY_RATE` |
| Fixed stay total | **None** (`agreedTotal` null) — correct |
| Billing cadence | **One RENT / MONTHLY charge per calendar month** until vacate |
| Conversion | Full-month = daily × daysInMonth; then prorate by billable days in month |
| Partial month | Inclusive calendar days from max(move-in, month start) to min(vacate/month end) |
| Advance vs after | Generated on activation sync and/or payment month sync — **not** a cron rent job |
| Due date | Space billing day, or period start for mid-month join |
| Partial pay / outstanding | `outstandingAmount` from payment row / ledger residual |
| Deposit | Separate one-time deposit charge / member deposit ledger |

Documented UI copy (wizard): *“Daily rent accumulates into one rent charge per calendar month until vacate.”*

---

## 3. Stay-type comparison

| | MONTHLY | SHORT (fixed Daily) | OPEN_ENDED |
|--|---------|---------------------|------------|
| `rentSnapshot` meaning | Monthly rent | Daily ₹/night | Daily ₹/day |
| Stay total | N/A (recurring) | `agreedTotal` = daily × nights | None |
| Payment category | RENT / MONTHLY | RENT / **EXTRA** (once) | RENT / **MONTHLY** (recurring) |
| Client contract UI | Monthly labels | Daily + stay total | Daily /day, no stay total |
| Risk of monthly assumption | Correct | Wrong if treated as monthly | Wrong if `rentSnapshot` treated as monthly without `DAILY_RATE` |

Shared monthly-rent assumptions incorrectly applied:

1. Mobile offline `computeOccupancyMonthlyTotalForMonth` — treats any `rentSnapshot` as monthly (dangerous for OPEN_ENDED daily).
2. Extend/Renew UX copy — “New monthly rent” / “Monthly renewal” for OPEN_ENDED.
3. Latent Web `stayMonthlyTotal` — ignores stayKind (currently unused by UI).

---

## 4. Affected Android surfaces

| Area | Components | Creates / reads / displays |
|------|------------|----------------------------|
| Member Payments | `MemberPaymentsTab`, `UniversalPaymentCard`, `MemberPaymentsScreen` | Reads payment list + members ledger pending |
| Member Contract / Deposit | `OccupancyContractSnapshotCard`, `MemberDepositTab`, `MemberAccommodationSection` | Displays daily rate (stayFinancialDisplay); deposit separate |
| Payment collection | `CreatePaymentScreen`, `PaymentDetailScreen`, reminders | Reads/writes payment APIs |
| Occupied bed faces | `OccupiedBedPaymentFace`, `OccupiedBedStaySection`, `useOccupiedBedStay` | Reads `stay-charges` outstanding |
| Dashboard | `DashboardFinancialSnapshot`, `useSpaceDashboard`, **offline fallback** | Live: payment summary API; offline: **may mis-estimate OPEN_ENDED** |
| Stay lifecycle | Wizard Review note, `ExtendStayModal`, vacate confirm | Create occupancy; extend copy monthly; vacate no settlement math |
| Inventory | Move-in bed faces with stayKind | Rate display only |

---

## 5. Affected Owner Web surfaces

| Area | Components |
|------|------------|
| Member Payments | `MemberPaymentsPanel` |
| Member stay / deposit | `MemberCurrentStayCard`, deposit section |
| Payments workspace | `PaymentsWorkspacePage`, inspector, KPIs |
| Occupied faces | `OccupiedBedPaymentFace`, `OccupiedBedStaySection` |
| Dashboard | `FinancialSummaryWidget` (API — no Mobile-style offline fallback) |
| Extend | `ExtendStayDialog` (“New monthly rent”) |
| Entity inspector | Occupant rent via stayFinancialDisplay |

---

## 6. Backend APIs / services / entities

| Layer | Name |
|-------|------|
| Services | `SpacePaymentGenerationService`, `OccupancyBillingCalculator`, `BillingAmountCalculator`, `PaymentMonthSnapshotService`, `OccupancyService.applyStayChoice` / `syncActivationPayments` |
| Scheduler | `PaymentReminderScheduler` (reminders only — **does not create rent**) |
| Persistence | `space_payments` (and related payment snapshot columns: amount, billableDays, daysInMonth, configuredMonthlyAmount, billingPeriod*, dueDate, status) |
| Occupancy | `stayKind`, `pricingBasis`, `rentSnapshot`, `depositSnapshot` |
| APIs | `GET/POST …/payments`, `…/payments/members`, `…/payments/summary`, `…/payments/sync`, `…/payments/stay-charges` |

Path reference (backend repo):
`K:\Projects\Acomi\Backend\acomi-backend\…\payment\application\…` and `…\dashboard\application\support\OccupancyBillingCalculator.java`

---

## 7. Existing vs expected (product tension)

| Topic | Existing (code) | Stated correction goal (query §1) |
|-------|-----------------|-----------------------------------|
| Show daily rate separately | Yes on Contract/Deposit | Aligns |
| Invent fixed total stay rent | No for OPEN_ENDED | Aligns |
| Show ₹26,000 as pending | **Yes — because a real RENT/MONTHLY row exists** | Query says: only show outstanding if supported by persisted bill — **this record qualifies** |
| “Not yet billed” when no bill | Not fully distinguished in UI if sync creates charge immediately on allocate | Needs product decision if activation should **not** create current-month rent until period end / sync policy |
| Preserve monthly cadence | Yes — one charge per calendar month | Aligns — **do not remove cadence** |
| Don’t change MONTHLY / SHORT | Unchanged in this audit | Aligns |

**Important:** Treating ₹26,000 as a “false estimate” and hiding it would **suppress a real ledger charge**, violating “do not delete/modify historical transactions” and “if actual bill, preserve and display accurately.”

---

## 8. Impact on existing members / history

- Members already activated as OPEN_ENDED `DAILY_RATE` likely have **one pending/paid RENT row per occupied month**, amount = daily × billable days.
- Changing generation formula or suppressing display without backend agreement would desync UI from ledger and dashboards.
- Legacy OPEN_ENDED with `pricingBasis` null may still treat `rentSnapshot` as **monthly** — different cohort.

---

## 9. Recommended changes (for a later implementation pass — not done now)

### A. UI / presentation (safe, no ledger rewrite)

1. Payments card for OPEN_ENDED: keep amount if row exists; add context e.g. **Daily ₹1,000 × 26 days (5–30 Nov)** using `billableDays` / `configuredMonthlyAmount` / period fields already on payment DTO.
2. Distinguish **unbilled** (no RENT row for month) → “Not yet billed” vs **billed pending** (row exists).
3. Fix Extend/Renew copy for OPEN_ENDED (daily rate language).
4. Fix Mobile offline expected-rent fallback to respect `DAILY_RATE` / stayKind.
5. Do **not** hide ₹26,000 for this member while the PENDING row exists.

### B. Backend / billing logic (requires product approval)

1. Confirm whether rent for the **current partial month** should be generated on day-of allocate vs end-of-month / explicit sync.
2. Optionally enrich payment title/subtitle for OPEN_ENDED (daily × days).
3. Do not change MONTHLY or SHORT generators without a separate RFC.

### C. Billing cadence

**Preserve** one calendar-month RENT charge for OPEN_ENDED. Do not switch to daily payment collection.

---

## 10. Regression test scenarios (recommended)

1. OPEN_ENDED unbilled month (no payment row) → UI “Not yet billed”, not ₹0-as-due confusion.
2. OPEN_ENDED billed pending (daily × billable days) → show amount + period + daily context; Contract still shows ₹/day.
3. OPEN_ENDED partially paid → outstanding = amount − paid.
4. OPEN_ENDED fully paid → no pending.
5. OPEN_ENDED mid-month join (e.g. 5 Nov @ ₹1000) → amount = 1000 × days remaining inclusive.
6. OPEN_ENDED full month occupancy → daily × daysInMonth.
7. MONTHLY unchanged (full + prorated).
8. SHORT fixed stay → EXTRA once, not monthly OPEN_ENDED path.
9. Deposit never mixed into rent pending.
10. Android + Web same member/month parity.

---

## 11. Constraints respected this pass

- Audit only — **no implementation**, no payment delete/modify/suppress.
- No billing cadence or calculation changes.
- Findings based on backend calculators, payment generation service, mobile/web payment clients, and stay docs — not assumptions alone.

---

## Bottom line

The ₹26,000 November pending line is **consistent with current approved OPEN_ENDED rules**: daily ₹1,000 accumulated into **one November rent charge** for **26 billable days** (5–30 Nov). Contract UI correctly shows **₹1,000/day**. Any “correction” must clarify **presentation of an actual bill** (and when bills are generated), not treat this amount as a spurious estimate or invent a fixed total stay rent.
