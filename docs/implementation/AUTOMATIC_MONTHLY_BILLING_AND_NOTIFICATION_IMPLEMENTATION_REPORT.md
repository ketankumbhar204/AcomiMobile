# Automatic Monthly Billing and Customer Notifications — Implementation Report

**Date:** 2026-11-07
**Decisions used:** accommodation billing = calendar month; Mess/Tiffin billing = calendar month; due date = 1st of that month.
**Production-ready:** No. The scheduler path was executed on an isolated database on 2026-11-07. A customer phone was not attached, Firebase did not accept a real device token, and the admin page was not opened in a browser.

This is the existing payment lifecycle, extended for MONTHLY accommodation rent. It is not a second billing engine.

---

## 1. Existing architecture found

| Concern | What already existed | What this work does |
|---|---|---|
| Rent rows | `SpacePaymentGenerationService.syncExpectedPayments` / `upsertPayment`. Unique index `uq_space_payments_generated_period` on space, member, month, type, category, due date (V137). | New path `ensureAutomaticMonthlyRent` inserts only. It does not call the full sync, so deposits and meal rollups are not touched. |
| First period | Move-in `createActivationPayments` and reservation advance split. `isReservationFirstPeriodRentFrozen` stops month sync from replacing that first period. | Scheduler uses the same freeze. An existing row for the month is left as stored. |
| Amount | `OccupancyBillingCalculator.computeBilling` plus `BillingAmountCalculator`. Mid-month join and exit stay prorated. Full months previously used `space.billingDueDay` (default 1). | Full months created by this job are due on the 1st. Prorated periods keep the existing period-start due date. |
| SHORT | Never a monthly rent row. | Still excluded. |
| OPEN_ENDED daily rate | Payable only after the month closes or on vacate. Month-close job called `syncExpectedPaymentsInternal`. | This job never creates that rent. Month-close cron is now days 1–3, Asia/Kolkata, so a missed 1st can still close the previous month. |
| Mess / Tiffin | `MealBillingType` is pay-per-meal or prepaid balance. Plan fields are meals included, price, and `validityDays`. Approval credits meal balance via `MemberMealBalanceService.recordPurchase`. Pause is `MealParticipationStatus.PAUSED`. | No calendar-month subscription payment is created. See section 4. |
| Reminders | `PaymentReminderScheduler` selects `dueDate < businessDate`. It does not insert payments. | Unchanged. A row due on the 1st is not reminded on the 1st. |
| Push | `NotificationService.publish` with `dedupeKey`. Async FCM after commit had no retry. | New durable outbox. In-app publish sets `suppressAsyncPush` so only the outbox worker sends FCM. |
| Ledger | `SpacePaymentLedgerSupport` drops CANCELLED from expected and pending. Collected is PAID/REFUNDED minus REFUND rows. | New PENDING rows flow through that ledger. Android and Web were not given a second formula. |

Cancelled reservations are stored as VACATED with `reservedAt` set and `actualMoveInAt` null. `OccupancyBillingCalculator.isBillableInMonth` now returns false for VACATED when `actualMoveInAt` is null. A real checkout has that timestamp.

---

## 2. Schedulers

| Job | When | Zone | Action |
|---|---|---|---|
| `MonthlyCalendarBillingScheduler.onFirstOfMonth` | `0 10 1 1 * *` | `Asia/Kolkata` (override `acomi.billing.monthly-rent.zone`) | `runDueCycles` |
| Catch-up | `0 20 2 * * *` | same | same service |
| Startup catch-up | application ready | — | only when `acomi.billing.monthly-rent.catch-up-on-startup` is true. False in base config. True in `application-prod.yml`. |
| Notification worker | `0 */15 * * * *` | same | reconcile missing outbox rows, then deliver due rows |
| `OpenEndedRentMonthCloseScheduler` | `0 40 0 1-3 * *` | Asia/Kolkata | previous month only, existing sync. Still refuses the open month. |

`enabled_from_month` is the Asia/Kolkata month at migration time (V162). Recovery looks back `acomi.billing.monthly-rent.recovery-months` (default 2), and never before `enabled_from_month`. A deploy in November 2026 can create missing November MONTHLY rent. It does not backfill October. A later outage can recover the previous month inside that window.

Eligibility for a recovered month uses move-in date, vacate date, stay kind, and the billing date (`asOf` = the 1st of that month). It does not use “active today” alone. There is no daily membership snapshot. `member.active` is the current flag, so a member deactivated after the billing date can be skipped on a late recovery. That limit is recorded rather than guessed.

---

## 3. Accommodation eligibility and amount

Eligible only when all of these hold:

- Stay kind is not SHORT.
- Not OPEN_ENDED daily rate.
- Not RESERVED.
- Not a reservation that never moved in (`reservedAt` set and `actualMoveInAt` null).
- Member is active when a member is present.
- Occupancy overlaps the calendar month.
- `shouldGeneratePayableRent` is true for that month and the 1st.
- The month is not the reservation-advance first period.

PG, hostel, co-living, rental, and corporate stay use this same MONTHLY gate. The space type does not by itself imply PG monthly rent. SHORT and OPEN_ENDED daily rate stay on their existing paths. Legacy OPEN_ENDED with a null pricing basis still follows the existing monthly snapshot rule inside the calculator; this job skips only `isOpenEndedDailyRate`.

Amount is `computeBilling` for that occupancy and month: agreed rent, bed/room/unit snapshot, effective-dated revision, and existing proration. A zero or missing amount is not written. Historical rows are not rewritten.

Created row:

| Field | Value |
|---|---|
| Category | `RENT` / `MONTHLY` |
| Month | `YYYY-MM` |
| Period | billing snapshot start and end |
| Amount | computed total |
| Status | `PENDING` |
| Due date | 1st when the period is a full month; period start when prorated |
| Remarks | `Automatic calendar-month rent` |
| Title | `Rent — {Month Year}` |

---

## 4. Mess / Tiffin — not implemented as a calendar charge

Confirmed product model:

- Prepaid plans are packs with a price, included meals, and validity days. Approval adds meal balance. It does not insert a monthly space payment.
- Pay-per-meal and daily or one-time orders already have their own activity billing.
- Pause, end, and expiry are participation and balance states, not a calendar subscription.

`MessCalendarBillingPolicy.generatesCalendarMonthPayment()` returns false. A Mess space still gets a monitoring run with zero eligible customers and skip reason `MESS_NOT_CALENDAR_MONTH`, so the admin view shows that the cycle ran and created nothing.

A ₹3,000 “Mess subscription for November” row was not invented. Adding that charge needs a new subscription product: calendar period, pause rules, and what happens to an unused prepaid balance. That decision is still open.

---

## 5. First-period duplicate prevention

1. Move-in or reservation split creates the first period through the existing methods.
2. The scheduler looks up space + member + month + `RENT` + `MONTHLY` before insert.
3. If that row exists, including a prorated first period, paid row, or owner-created row, the insert is skipped. Remarks are not the key.
4. A reservation first period is also skipped before calculation when the booking advance freeze applies.
5. A notification is enqueued only when this job’s result is `CREATED`. A move-in row is not announced again as “generated by the monthly job”.
6. The database unique index still rejects a concurrent second insert. The loser is treated as already present. The member transaction is `REQUIRES_NEW`, so one collision does not roll back the rest of the space.

A cancelled or refunded row for that same month returns `FROZEN` and is not replaced. A later month is a different key, so a refund of October does not count as November.

---

## 6. Idempotency and recovery

- Run claim: unique `(space_id, billing_month)`. A fresh `SUCCESS` is not rerun. A `RUNNING` row younger than 20 minutes is left to the other instance. `FAILED` and `PARTIAL` can be claimed again.
- Payment identity: existing generated-period unique index, plus the lookup above. Application memory is not the lock.
- Notification identity: unique `(payment_id, event_type)` with event `MONTHLY_RENT_GENERATED`.
- Firebase down: the payment stays. The outbox stays `PENDING` and is retried. `deliverOne` never saves the payment.
- FCM accepted (`accepted > 0`) is stored as `FCM_ACCEPTED` with `fcmAcceptedAt`. That row is not sent again. Acceptance is provider acceptance, not proof the phone showed it.
- No token: retry with `NO_ACTIVE_TOKEN`, then `FAILED` after 8 attempts. Backoff is 15 minutes times the attempt count. Invalid-token cleanup stays on the existing push service.
- No customer user: outbox `SKIPPED` / `NO_CUSTOMER_ACCOUNT`. The owner is not used as a stand-in.
- Admin “retry failed notifications” resets `FAILED` outbox rows to `PENDING`. It does not insert payments.
- Admin “run due billing” calls the same `runDueCycles`. Duplicate protection still applies.

---

## 7. Firebase message

Title: `Monthly rent payment generated`

Body: `Your {MMMM yyyy} rent of ₹{amount} has been generated for {space}. Due date: {d MMMM yyyy}. Open ACOMI to view payment details.`

Data: type `PAYMENT_GENERATED`, space id, entity type `PAYMENT`, entity id = payment id, action route `PaymentDetail`.

In-app dedupe key: `PAYMENT_GENERATED:{paymentId}:{userId}`.

Android and Web deep links treat `PAYMENT_GENERATED` like the existing payment reminder: open `PaymentDetail` when the payment id is present, otherwise the payments tab. There is no customer preference store for turning this push off. The existing token lifecycle is used. Multiple active tokens are sent through `deliverTracked`.

---

## 8. Financial totals

Expected, collected, pending, and under review stay on `SpacePaymentLedgerSupport` and the payment APIs the apps already call.

- A new PENDING rent increases expected and pending.
- CANCELLED stays out of expected and pending.
- A completed refund reduces net collected through the existing REFUND rows. The refund is not a new month’s rent.
- If the obligation itself is waived, that is still the cancellation path. A refund alone does not cancel the rent row.
- Member, space, and dashboard cards read the same ledger. No Android or Web formula was added.

---

## 9. Admin monitoring

`GET /api/v1/admin/monthly-billing`
`POST /api/v1/admin/monthly-billing/run`
`POST /api/v1/admin/monthly-billing/notifications/retry-failed`

Role: existing admin API security (`ROLE_ADMIN`).

Web: `/admin/monthly-billing` in the admin layout. The page lists runs (period, status, eligible accommodation, created, skipped, failed, notifications queued, skip reasons) and recent notification rows (status, attempts, last error, FCM accepted time). It states that FCM acceptance is not display proof, and that Mess/Tiffin packs are not calendar-month charges.

The page was not opened in a browser against a running admin session.

---

## 10. Database and files

Migration: `payment/V162__monthly_calendar_billing.sql`

- `monthly_billing_control` singleton, `enabled_from_month`
- `monthly_billing_runs` unique per space and month
- `monthly_billing_notifications` unique per payment and event

Backend (new): eligibility, Mess policy, member billing, calendar billing service, notification outbox service, monitor service, scheduler, admin controller, run/notification entities and repositories, `NotificationType.PAYMENT_GENERATED`.

Backend (changed): `SpacePaymentGenerationService` create-only monthly insert and due-on-1st for full months; `SpacePaymentRepository` pending automatic rent without an outbox row; `OccupancyBillingCalculator.isBillableInMonth` excludes vacated rows that never moved in; `OpenEndedRentMonthCloseScheduler` days 1–3 in Asia/Kolkata; `application.yml` and `application-prod.yml` billing keys; notification test catalog route.

Android: `NotificationType` and `notificationDeepLinks.ts`.
Web: deep link case, admin route, layout entry, `AdminMonthlyBillingPage`.

---

## 11. Tests run on 2026-11-07

Backend, exit 0:

```
.\mvnw.cmd -q "-Dtest=OccupancyBillingCalculatorTest,MonthlyRentEligibilityTest,MonthlyBillingNotificationServiceTest,SpacePaymentGenerationServiceTest" test
```

Covered in those classes:

- Active MONTHLY stay, including hostel, co-living, rental, and corporate through the same gate.
- Moved in on the 1st.
- Reserved, cancelled before move-in, vacated before the month, vacated during the month (that month only).
- Future move-in excluded from the earlier month.
- SHORT excluded. OPEN_ENDED daily rate excluded even after the month has closed.
- Inactive member excluded. Booking-advance first period frozen.
- Mess policy does not generate a calendar payment.
- Full-month automatic rent due on the 1st.
- Second insert for the same period skipped.
- Cancelled obligation not recreated.
- SHORT and OPEN_ENDED ensure path writes nothing.
- Existing activation, short-stay, reservation split, paid-row, and rent-revision generation tests still in `SpacePaymentGenerationServiceTest`.
- Calculator: cancelled reservation without move-in is not billable; open-ended payable rent still waits for month close or vacate; vacated fixtures set `actualMoveInAt`.
- Notification copy includes space, month, amount, and due date.
- Firebase failure leaves the outbox pending and does not save the payment.
- Accepted send is not retried.
- Duplicate enqueue is a no-op.
- Recipient is the customer user.

Android, exit 0: `notificationDeepLinks.push.test.ts` — 17 passed, including `PAYMENT_GENERATED` opening `PaymentDetail` for payment id `pay-dec`.

Not run:

- Concurrent multi-instance billing against Postgres.
- Restart during a run.
- API smoke of admin run/retry.
- Real-device FCM delivery.
- Web admin page in a browser.
- Full refund, partial refund, retained amount, and unpaid cancellation totals as a new suite. Those rules remain on the existing ledger tests and were not re-executed in this pass.
- `SpacePaymentGenerationStayMatrixTest` was not in this last Maven filter. It passed in the earlier session before the calculator assertion fix. The vacated calculator fixtures now set `actualMoveInAt`, which matches a real checkout.

---

## 12. Scenario map

| # | Scenario | Result |
|---|---|---|
| 1–5 | Active MONTHLY PG, hostel, co-living, rental, corporate | Eligible by the shared MONTHLY gate. Space type is not a separate formula. |
| 6–7 | Reserved; vacated before the 1st | Skipped. |
| 8 | Moved in on the 1st | Eligible. Full month, due the 1st. |
| 9 | Mid-month join with first payment already stored | Existing month row is not inserted again. Next month is a new key. Proration stays on the existing calculator. |
| 10 | Payment already exists for the month | `ALREADY_PRESENT`. |
| 11 | Rent revision before the billing date | Amount comes from `computeBilling`. Old rows are not rewritten. |
| 12 | Previous month paid, still active | New month can be created. Paid month is not replaced. |
| 13–14 | SHORT; OPEN_ENDED month-close | Excluded from this job. Month-close job unchanged in formula, cron extended to days 1–3. |
| 15–24 | Mess/Tiffin monthly, daily, one-time, expired, cancelled, paused, resumed, mid-month, existing payment | No calendar charge. Policy recorded. Pack and meal billing unchanged. |
| 25–28 | 1st run, second run, concurrent claim, restart | Unique run row and unique payment index. Not proven under two live JVMs. |
| 29–30 | Missed 1st; historical eligibility | Recovery window and dates as in section 2. No daily status log. |
| 31 | Cancelled payment | Not recreated. |
| 32 | Partial failure | Member transaction isolates the failure. Run becomes `PARTIAL` when any member throws. Retry reclaims `PARTIAL`. |
| 33–38 | FCM success, many devices, missing token, Firebase down, retry without a second payment, no duplicate | Unit-tested for failure, acceptance, and duplicate enqueue. Not tested on a device. |
| 39–41 | Deep link; customer not owner; no notice if create fails | Deep link unit-tested. Enqueue only after `CREATED`. No device proof. |
| 42–49 | Expected, collected, pending, refunds, cancellation, reminders, Mess ledger | Existing ledger. Reminders stay overdue-only and do not create payments. Mess calendar ledger rows were not added. |
| 50 | MONTHLY, SHORT, OPEN_ENDED, deposit regressions | Generation service tests in the passing filter cover activation, short stay, deposit, and open-ended skip. Stay matrix not re-run in the last command. |

---

## 13. Production verification — 2026-11-07

Isolated database `acomi_billing_verify` (PostgreSQL 17, Flyway through V162). The test called `MonthlyCalendarBillingScheduler.onFirstOfMonth()`, which is the method the 1st-of-month cron calls. Scheduling was off during the test so a timer could not insert rows beside the call. Generated rent rows came from that call. The three rows that existed beforehand came from `createActivationPayments`, the move-in path.

Kolkata date during the run: **2026-11-07**. Current billing month: **2026-11**. `enabled_from_month` was set to **2026-10-01**. Recovery window: **2** months. September was inside neither the window nor `enabled_from`, and no September run or rent row was created.

Evidence file: `docs/implementation/monthly-billing-verification-evidence.json`.

### Scheduler runs

| Run | Id | Month | Timezone | Eligible | Created | Skipped | Failed | Notices | Skip reasons |
|---|---|---|---|---|---|---|---|---|---|
| Ledger PG | `3275cf19-fd19-4d6c-a929-410bc004bf34` | 2026-11-01 | Asia/Kolkata | 6 | 6 | 0 | 0 | 6 | — |
| Guard PG, October | `8fc5d83a-f553-4e07-a3fa-776adedf9fef` | 2026-10-01 | Asia/Kolkata | 2 | 1 | 1 | 0 | 1 | `ALREADY_PRESENT=1` |
| Guard PG, November | `cc91c79e-fab3-4a34-b3ad-4b8f2ae471f7` | 2026-11-01 | Asia/Kolkata | 4 | 2 | 6 | 0 | 2 | `ALREADY_PRESENT=2; SHORT_STAY=1; OPEN_ENDED_MONTH_CLOSE=1; INACTIVE_MEMBER=1; NOT_MOVED_IN=1` |
| Mess | `3b70ab52-7883-4a78-b06b-e61345a35f44` | 2026-11-01 | Asia/Kolkata | 0 | 0 | 1 | 0 | 0 | `MESS_NOT_CALENDAR_MONTH` |

Monthly rent rows before the job: 3. After the first call: 16. The 13 new ids are in the evidence file. A second `onFirstOfMonth()` left those 16 ids unchanged.

Spaces use `billingDueDay` 5. Rows this job inserted for a full month are due on the 1st. Example: Tenant A payment `293210dc-73cc-48ca-a658-1ca445162ec9`, November 2026, ₹6,000.00, due 2026-11-01, `PENDING`, remarks `Automatic calendar-month rent`.

The same due-on-1st result was recorded for hostel ₹6,100 (`4da9ed53-ece1-47e7-9e04-55f7048def35`), co-living ₹6,200 (`6a218a89-873e-41da-936f-8bb80e1245d8`), rental ₹6,300 (`6c1a2f1b-925b-4435-99f2-05683a43ea87`), and corporate ₹6,400 (`392204b2-c4e8-4961-a3d2-89e0e99740e7`). Each payment's member id is the occupancy member. There is no company, employer, or separate payer field on the occupancy or payment model, so a corporate stay is billed to that occupant. A company-billed contract cannot be detected, and none was excluded.

### Period coverage

| Case | Result |
|---|---|
| Move-in on 1 Nov, activation already created the month | One row. Remarks stay the activation text. Due date stays 5 Nov because activation uses `billingDueDay`. The job does not move it. |
| Move-in on 15 Nov, activation already created the prorated month | One row. Due 15 Nov. Not duplicated. |
| Move-in on 15 Nov, no prior row | Job created the prorated amount. Due 15 Nov, not the 1st. |
| October activation only, still active in November | October row kept. November row created, due 1 Nov. |
| Vacated 20 Oct | October row only. No November row. |
| Vacated 30 Sep | No October or November row. No September run. |
| SHORT, OPEN_ENDED daily rate, reserved, cancelled before move-in, inactive member | No monthly rent row. Skip reasons above. |

A later reclaim of the Ledger PG run (status forced back to `RUNNING` with a start time 30 minutes earlier) used the same run id and wrote `created=0`, `skipped=6`, `ALREADY_PRESENT=4; CANCELLED_OR_REFUNDED=2`. Payment ids did not change. `monitorService.runNow()` (the admin rerun) also left the payment ids unchanged. Two JVMs were not run at the same time.

### Settlement and reissue

Ledger PG after generation, from `SpaceBillingService.buildLedger` for 2026-11: expected ₹39,500, pending ₹39,500, collected empty. Member rows: A ₹6,000, B ₹7,000, C ₹5,000, D ₹8,000, E ₹9,000, F ₹4,500, each pending the same amount.

| Step | Space expected | Space collected | Space pending | Member result |
|---|---|---|---|---|
| B marked received | 39,500 | 7,000 | 32,500 | B collected 7,000, pending empty |
| C cancelled, job run again | 34,500 | 7,000 | 27,500 | C expected and pending empty. Same cancelled row, still one monthly row |
| B fully refunded, job run again | 34,500 | empty | 34,500 | B expected 7,000, collected empty, **member pending empty**. Status `REFUNDED`. Still one monthly row |
| D partial refund ₹3,000, E retained, F under review | 34,500 | 14,000 | 16,000 | D collected 5,000 and pending empty. E collected 9,000. F under review 4,500 and pending empty |

The space pending figure is `expected − collected − under review`. It puts refunded money back into the space pending total. The member row does not: a refunded or partially refunded `PAID` row is not an unpaid obligation, so member pending stays empty while expected remains. Android `normalizeLedgerRow` fills a null pending with that same residual, so a member screen can show B as ₹7,000 pending even though the API member pending is null. Web payment summaries read the API pending value.

`createManualPayment` for `RENT` / `MONTHLY` is rejected with "generated automatically". The cancelled November row was not replaced. An owner can still create `RENT` / `EXTRA`. That charge was `d3421be9-2805-465a-b52b-34176f40120a`, ₹1,500, category `EXTRA`, and the cancelled monthly row stayed the only `RENT` / `MONTHLY` row. That is not a reissue of the monthly obligation. No auditable path currently recreates a cancelled or refunded calendar-month rent row.

### Notifications

Tenant A outbox `efd4eb5e-01f3-41ae-a264-d9d698591b78` for payment `293210dc-73cc-48ca-a658-1ca445162ec9`. Recipient user `39561eb7-e6ba-4fd9-b145-286ffcc7a575` is the tenant account, not the owner.

No token: status stayed `PENDING`, error `NO_ACTIVE_TOKEN`, payment id unchanged.

Two Android tokens with fake registration values: Firebase returned `INVALID_ARGUMENT`. Status stayed `PENDING`, `fcmAcceptedAt` stayed empty, attempt count increased, payment id unchanged. Acceptance was not recorded, and display was not shown.

Admin retry of a `FAILED` outbox row queued it again and did not add a payment.

`adb devices` listed no phone. No tap-through to payment details was captured.

### Admin page and clients

`/admin/monthly-billing` was not opened in a browser. The page's TypeScript errors (Stack `flexWrap`, the admin API unwrap, and the one-argument title helper) were corrected so the page matches the existing admin client. Web `tsc -b` still fails in unrelated accommodation and dashboard files. `npm run test:notification-links` passed.

Android Jest, 56 passed: notification deep links, open-push, owner-only notifications, payment ledger, refund display, and payment status. Those tests do not drive a device.

Web and Android screens were not placed next to this ledger response. Both are built to show the API figures, with the Android null-pending fallback described above.

### Mess / Tiffin left unchanged

No calendar-month Mess or Tiffin charge was added. The Mess run recorded the existing pack and pay-per-meal explanation and created no payment.

A future calendar subscription would need, before any charge exists:

- A subscription record with status, pause, and cancel history dated by the day, not only a current flag.
- A calendar period (start, end, month) distinct from pack `validityDays`.
- The price that applies on the 1st, including a plan change effective mid-month.
- Whether a pause suspends the next 1st, and what happens to unused prepaid meals.
- The payer account and the payment category, so it cannot collide with meal-day rows.
- The same idempotency key style as rent: business + customer + period + charge type.
- A decision that daily and one-time orders stay off this job.

### Regression commands

| Command | Result |
|---|---|
| `MonthlyCalendarBillingSchedulerVerificationTest` with `DB_NAME=acomi_billing_verify` and `-Dacomi.billing.verify=true` | 1 test, exit 0, 186 s |
| Android Jest payment and notification files listed above | 6 suites, 56 tests, exit 0 |
| Web `npm run test:notification-links` | exit 0 |
| Web `tsc -b` | Project still fails in unrelated accommodation and dashboard files. A second pass found no errors in `AdminMonthlyBillingPage`, `monthlyBillingAdminApi`, or `AdminLayout`. |
| `MonthlyRentEligibilityTest`, `MonthlyBillingNotificationServiceTest`, `SpacePaymentGenerationServiceTest`, `OccupancyBillingCalculatorTest`, `SpacePaymentGenerationStayMatrixTest` | 103 tests, 0 failures. Stay matrix 36, generation service 26, eligibility 13, notifications 5. |

---

## 14. Remaining blockers

1. No customer device was attached, so Firebase delivery and the payment-detail tap are unproven. `INVALID_ARGUMENT` on a fake token is not acceptance and is not display.
2. `/admin/monthly-billing` was not opened in a browser session.
3. Web and Android screens were not compared visually with the ledger response. Android can turn a null member pending into residual expected after a refund.
4. A cancelled or refunded `RENT` / `MONTHLY` row cannot be reissued. The manual API rejects that category, and the scheduler will not recreate it.
5. Space pending and member pending disagree after a refund or partial refund.
6. Mess/Tiffin calendar billing is still a product decision, not an implementation.
7. There is still no customer preference to mute this push.
8. Recovery uses move-in and vacate timestamps plus today's `member.active` flag. There is no daily membership history.

Production-ready stays **no** until a registered customer phone shows the notice for a payment this job created, the admin page is checked in a browser, and the refund pending figures are confirmed on the Web and Android screens that owners actually use.
