# Payment Reference ID

Human-readable, immutable payment identifiers for customer and owner support flows.

## Format

`PAY-YYYYMMDD-NNNNNN` (e.g. `PAY-20260720-000123`)

- Prefix `PAY-`
- Date of mint (`YYYYMMDD`, server local date at first submission)
- Zero-padded per-space daily sequence

## Backend (implemented)

| Piece | Location |
|-------|----------|
| Migration | `db/migration/payment/V91__payment_reference.sql` |
| Generator | `PaymentReferenceService` (atomic upsert on `payment_reference_counters`) |
| Columns | `space_payments.payment_reference`, `meal_poll_day_payments.payment_reference` |
| Mint on meal proof | `MealPollService.applyProofToDayPayment` |
| Mint on universal proof | `SpacePaymentService.submitNewProof` |
| Bridge copy | `MealDaySpacePaymentBridge.applyProofFields` (day → space, once) |
| API fields | `SpacePaymentResponse`, `MemberMealActivityDayPaymentResponse`, `MemberMealActivityDayResponse`, `BulkMealPollPaymentProofResponse` |

### Rules

1. Mint **once** on first successful proof submission.
2. **Never regenerate** on resubmit / approve / reject / request-update.
3. Unique partial indexes enforce uniqueness when present.
4. Soft backfill: existing human `payment_batch_id` values are copied into `payment_reference` where safe (non-UUID).

`referenceNumber` remains the customer-entered UTR and is unrelated.

## Frontend

App displays via `resolvePaymentReferenceDisplay()` — prefers `paymentReference`, falls back to human `paymentBatchId`, hides UUIDs.
