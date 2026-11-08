# Payment Cancellation and Reservation Settlement — Implementation Report

**Date:** 2026-11-06
**Production-ready:** **No** — backend unit tests + client wiring landed; full scenario matrix and device/API smoke still pending.
**Scope:** Shared payment cancel/settle lifecycle + reservation cancellation settlement. No new payment categories. Booking-advance calculation unchanged.

## Existing payment lifecycle findings

| Area | Finding |
|---|---|
| `SpacePaymentStatus` | Had PENDING / PROOF_UPLOADED / UNDER_REVIEW / PAID / REJECTED / UPDATE_REQUESTED. **No CANCELLED**, no REFUNDED workflow status. |
| Partial collection | `PaymentDueStatusCalculator` treated PAID as fully collected; no `paidAmount` column. |
| Refunds | `SpacePaymentCategory.REFUND` existed and deposit summary already preferred paid REFUND rows, but **manual create blocked REFUND** (`Refund is not a creatable payment type`). Timeline had `REFUNDED` but no settle API. |
| Reservation cancel | Auto-rejected unpaid rent rows only; paid advance kept with remark; **no UI to refund/retain**; deposits not settled. |
| Integrity risk | Treating REFUND rows as normal PAID collections would inflate dashboard collected totals — ledger now excludes REFUND from paid/extra sums. |

## Backend / API / database changes

### Migration `V160__payment_cancellation_and_settlement.sql`
- Add `CANCELLED` to `space_payments.payment_status` check.
- Expand timeline event types with `CANCELLED`, `RETAINED` (and keep reminder events).
- Add `space_payments.related_payment_id` (refund → original obligation).
- New `payment_settlements` audit table: action, refund/retained amounts, reason, actor, timestamps, optional occupancy + refund payment link.

### Domain
- `SpacePaymentStatus.CANCELLED`
- `PaymentSettlementAction`: CANCEL_UNPAID, FULL_REFUND, PARTIAL_REFUND, RETAIN
- `PaymentFinancialDisposition` derived view
- `PaymentTimelineEventType.CANCELLED` / `RETAINED`

### Service `PaymentSettlementService`
- Cancel unpaid → status CANCELLED + settlement row + timeline (never deletes history).
- Settle collected → creates PAID `REFUND` child payment for refunded amount; retain audited without overwriting original PAID amount/status.
- Validates refund + retained ≤ unsettled collected balance; blocks repeat full settlement.
- Reservation preview + cancel apply decisions for collected rows; auto-cancels remaining unpaid obligations.

### APIs
| Method | Path | Purpose |
|---|---|---|
| GET | `/spaces/{spaceId}/occupancies/{id}/cancellation-settlement` | Preview obligations + allowed actions |
| POST | `/spaces/{spaceId}/occupancies/{id}/cancel-reservation` | Body now accepts `settlements[]` |
| POST | `/spaces/{spaceId}/payments/{id}/cancel` | Cancel unpaid |
| POST | `/spaces/{spaceId}/payments/{id}/settle` | Full/partial refund or retain |
| GET | `/spaces/{spaceId}/payments/{id}/settlements` | Settlement history |

### Ledger / reminders
- CANCELLED → outstanding 0, not reminder-eligible.
- REFUND category excluded from expected extras and from collected sums.
- Recurring rent ignores CANCELLED MONTHLY rows.

## Web changes
- Types: `CANCELLED`, settlement request/response types.
- `occupancyApi.previewReservationCancellation` + enriched cancel body.
- `paymentsApi.cancelPayment` / `settlePayment` / `listSettlements`.
- `ReservationCancellationDialog` + hook; wired into bed interaction host and entity inspector cancel.
- `PaymentSettlementActions` in payment inspector (cancel unpaid / refund-retain).
- Payment helper gates for cancel/settle + CANCELLED chip tone.

## Android changes
- Types + `occupancyApi.previewReservationCancellation`.
- `paymentsApi.cancelPayment` / `settlePayment` / `listSettlements`.
- `ReservationCancellationSettlementModal` wired through occupancy flow modals and member accommodation section.
- Payment detail sticky actions: cancel unpaid; refund/retain alerts for PAID.

## Settlement status and audit behaviour
- Original obligation amount and collection history remain.
- Refunds are separate REFUND transactions linked by `related_payment_id`, recorded as PAID when the owner records the refund (not marked before recording).
- Retained amounts live in `payment_settlements` (and timeline RETAINED), not as outstanding rent.
- Unpaid cancel uses CANCELLED (distinct from proof REJECTED).
- Repeated cancel/refund of a fully settled payment is rejected.

## Test results

| Suite | Status |
|---|---|
| `PaymentSettlementServiceTest` (cancel unpaid, reject paid cancel, full refund, partial+retain validation, reservation requires settlement, repeated refund) | **Pass** (`mvnw -Dtest=PaymentSettlementServiceTest`) |
| Web/Android compile smoke | Not fully run in this pass |
| Manual scenarios 1–14 from brief | **Pending** |

## Remaining limitations
1. Android payment-detail settle UI currently exposes full refund / retain via alerts; partial refund amount entry is available in reservation settlement modal and Web settle dialog.
2. Device/API smoke for dashboard, reminders, receipts, move-in-blocked-after-cancel, and Mess/Tiffin unaffected checks not yet executed.
3. Do not mark production-ready until critical manual payment-integrity checks pass.

## Regression boundaries (must stay green)
- Booking advance split calculation
- Direct allocate / move-in / extend / checkout
- MONTHLY / SHORT / OPEN_ENDED billing
- Deposit generation
- Mess/Tiffin meal payments
- Existing payment categories/types
