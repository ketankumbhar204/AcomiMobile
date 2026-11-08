# Reservation Booking Advance — Implementation Report

**Date:** 2026-11-06
**Verification pass:** 2026-11-06 (gap closure)
**Production-ready:** **No** — manual API/device payment-integrity smoke still pending.
**Rule locked:** First-period rent commitment. Booking advance is a **portion** of agreed first-period rent, not an extra charge.
**Scope:** Reservation only. Allocate / move-in / extend / Mess untouched except move-in duplicate-rent guard and ledger deduction for `RENT/ADVANCE`.

## Business behaviour

| Input | Result |
|---|---|
| Rent ₹6,000, advance blank/0 | Existing behaviour — **no** rent payment rows until move-in |
| Rent ₹6,000, advance ₹2,000 | `RENT/ADVANCE` ₹2,000 + `RENT/MONTHLY` remaining ₹4,000 |
| Advance = full rent | Only advance row; no zero remaining row |
| Advance > rent | Rejected |
| OPEN_ENDED + advance | Rejected (end-of-period billing must not create premature rent) |
| Deposit | Separate; still created at move-in via existing activation path |

Both rent rows reuse existing **RENT** type and existing categories (`ADVANCE`, `MONTHLY` / `EXTRA` for SHORT). No new payment category.

## Backend

### APIs / DTOs

| Item | Change |
|---|---|
| `POST …/occupancies/reserve` | Accepts optional `bookingAdvanceAmount`, `bookingAdvanceCollected`, `bookingAdvancePaymentMethod` |
| `ReserveOccupancyRequest` | New optional fields |
| `OccupancyResponse` | Exposes `bookingAdvanceAmount` |
| `OccupancyEntity` | Column `booking_advance_amount` (migration `V159__occupancy_booking_advance.sql`) |

### Services

| Service | Behaviour |
|---|---|
| `OccupancyService.reserve` | Persists advance; when `> 0`, calls rent-split generation + month snapshot refresh |
| `SpacePaymentGenerationService.createReservationFirstPeriodRentSplit` | Creates advance + remaining obligations; marks advance PAID only when `collected` |
| `SpacePaymentGenerationService.createActivationPayments` | **Skips** first-period rent generation when `bookingAdvanceAmount > 0` (deposit still created) |
| `SpacePaymentGenerationService.cancelReservationRentObligations` | Unpaid reservation rent → `REJECTED`; paid advance retained with audit remark |
| `SpacePaymentGenerationService` month sync / upsert | First-period MONTHLY remaining frozen when booking advance exists |
| `SpaceBillingService` + `SpacePaymentLedgerSupport` | When occupancy billing supplies full first-period rent, `RENT/ADVANCE` is **deducted** from extras so expected is not ₹6,000+₹2,000 |

### Space types

| Type | Booking advance |
|---|---|
| PG, Hostel, Co-living, Rental, Corporate Stay | Applicable (`isAccommodationApplicable`) |
| SHORT stay kind | Advance + remaining as `RENT/EXTRA` |
| OPEN_ENDED | Rejected |
| Mess / Tiffin | Not applicable (generation returns without creating rows) |

### Titles (UI-visible)

- `Rent — Booking advance`
- `Rent — Remaining balance — {Month YYYY}` (MONTHLY)
- `Short stay — Remaining balance` (SHORT)

### Idempotency / transaction

- Reserve + payment creation run in the existing `@Transactional` reserve method.
- Advance upsert keyed by space + member + month + `RENT` + `ADVANCE`.
- Remaining MONTHLY uses existing upsert; SHORT remaining uses EXTRA period uniqueness.
- Activation with advance skips rent on first and subsequent calls (deposit upsert remains idempotent).

### Conversion (reservation → occupancy)

When move-in/activation runs and `bookingAdvanceAmount > 0`:

1. Do **not** regenerate first-period rent (prevents ₹6,000 + ₹2,000/₹4,000 duplicate).
2. Create security deposit as today.
3. Subsequent months continue via existing sync / stay-type billing; first-period remaining stays frozen.

### Cancellation

- Unpaid advance / remaining rent obligations → `REJECTED` (no silent delete).
- Paid advance rows retained with remark for existing refund/forfeiture tools.
- Financial history preserved on payment + timeline records.

## Web (`AcomiWeb`)

| File | Change |
|---|---|
| `shared/types/accommodation.ts` | Request/response fields |
| `utils/occupancyRules.ts` | Pass advance on reserve body |
| `utils/bookingAdvance.ts` | Split/validation helper |
| `pages/OccupancyWizardPage.tsx` | Advance UI + review; submit-time validation (incl. SHORT first-period) |

Primary reserve entry: Occupancy wizard `RESERVE` mode. No separate hierarchy quick-reserve on Web.

## Android (`AcomiMobile`)

| File | Change |
|---|---|
| `api/types.ts` | Request/response fields |
| `utils/occupancyRules.ts` | Pass advance on reserve body |
| `utils/bookingAdvance.ts` | Split/validation helper |
| `utils/occupancyContract.ts` | Form values for advance |
| `ContractTermsForm.tsx` | Reservation-only advance UI |
| `ContractTermsStep.tsx` / `OccupancyWizardScreen.tsx` | Enable for RESERVE |
| `HierarchyOccupancyPickerModal.tsx` | `ContractTermsStep` mode `RESERVE`; review gets `contractValues` + `stayChoice`; submit via `useOccupancyWizardSubmit` |
| `useOccupancyWizardSubmit.ts` | Submit advance fields; OPEN_ENDED / exceeds-rent guards |
| `ReviewStep.tsx` | Reservation payment summary (advance / remaining / deposit) |

Payment list / profile / member payment screens show the backend **titles** and existing `ADVANCE` category labels — no new category plumbing required.

## Prefill / display

| Surface | What shows |
|---|---|
| Reserve contract | Booking advance (optional), remaining rent live calc, collected toggle |
| Review | First-period rent, advance (collected/pending), remaining, deposit |
| Payments | `Rent — Booking advance` / remaining titles; category ADVANCE vs MONTHLY |
| After move-in | Same payment rows; no second first-period rent charge |

## Verification checklist (gap closure)

| # | Check | Result |
|---|---|---|
| 1 | Rent split ₹6,000 / ₹2,000 → ADVANCE ₹2,000 + remaining ₹4,000 (total ₹6,000) | **Pass** — unit test `createReservationFirstPeriodRentSplit_createsAdvanceAndRemaining` |
| 2 | Advance PAID only when collected; remaining independent PENDING | **Pass** — `…_marksAdvancePaidWhenCollected` |
| 3 | Space types + OPEN_ENDED reject + SHORT EXTRA remaining | **Pass** — Corporate Stay / OPEN_ENDED / SHORT tests |
| 4 | Conversion skips first-period rent; retry safe | **Pass** — `createActivationPayments_skipsRent…` + second-call test; month-sync freeze test |
| 5 | Payment integrity (dashboard expected) | **Fixed** — occupancy billing no longer double-counts `RENT/ADVANCE`; ledger unit coverage added. Reminders/receipts use payment rows (no new category). **Manual dashboard smoke still pending.** |
| 6 | Cancel retains paid advance; rejects unpaid | **Pass** — `cancelReservationRentObligations_rejectsUnpaidAndKeepsPaidAdvance` |
| 7 | Allocate / move-in / extend / deposit / Mess unchanged | **Code review** — advance paths gated on reserve + `bookingAdvanceAmount`; Mess not in `isAccommodationApplicable` |
| 8 | Alternate entry points | Android hierarchy quick-reserve wired through same submit/contract path. Web: wizard only. |
| 9 | Tests executed | See below |

## Tests / verification

| Check | Status |
|---|---|
| Backend `SpacePaymentGenerationServiceTest` (split, full, zero, invalid, OPEN_ENDED, activation skip, retry, freeze, cancel, Corporate Stay, SHORT) | **Pass** (`mvnw -Dtest=SpacePaymentGenerationServiceTest`) |
| Backend `SpacePaymentLedgerSupportTest` (advance sum + ₹6k composition) | **Pass** |
| Android `bookingAdvance.test.ts` + `ReviewStep.shortStaySummary.test.tsx` | **Pass** (5 tests) |
| Web `bookingAdvance` helper smoke (6000/2000, full, zero, exceeds) | **Pass** |
| Manual API: reserve ₹6k/₹2k → two RENT rows totaling ₹6k | **Pending** |
| Manual: move-in does not create another ₹6k MONTHLY | **Pending** |
| Manual: dashboard expected/pending with collected advance | **Pending** (critical for production) |
| Manual: cancel with paid advance retains row | **Pending** |
| Manual: allocate unchanged | **Pending** |

## Hardening (post-inspection + gap closure)

1. **Month sync freeze** — `syncRentPayment` / `upsertPayment` skip first-period `RENT/MONTHLY` when `bookingAdvanceAmount > 0`.
2. **Cancel policy** — unpaid → `REJECTED`; paid advance retained with audit remark.
3. **Copy** — EN `reserveDatesHint` no longer claims “no charges when reserving.”
4. **Dashboard double-count fix** — when `rentFromOccupancy`, subtract `sumRentAdvanceAmount` from non-recurring extras.
5. **Hierarchy RESERVE** — contract step uses `mode=RESERVE` so booking-advance UI/submit fields apply.
6. **Client guards** — Android + Web reject OPEN_ENDED advance / advance > first-period before API.

## Files changed (gap-closure pass)

### Backend (`acomi-backend`)
- `SpacePaymentGenerationService.java` (prior: split / freeze / cancel / activation skip)
- `OccupancyService.java` (prior: reserve + cancel hooks)
- `SpacePaymentLedgerSupport.java` — `sumRentAdvanceAmount`
- `SpaceBillingService.java` — deduct advance when occupancy rent already counted
- `SpacePaymentGenerationServiceTest.java` — booking-advance cases
- `SpacePaymentLedgerSupportTest.java` — advance composition

### Web (`AcomiWeb`)
- `OccupancyWizardPage.tsx` — submit-time advance validation

### Android (`AcomiMobile`)
- Hierarchy / submit / contract wiring (prior + RESERVE mode)
- `docs/implementation/RESERVATION_BOOKING_ADVANCE_IMPLEMENTATION_REPORT.md` (this file)

## Outstanding issues (blocks production-ready)

1. **Manual API/device smoke** for reserve → payments → move-in → dashboard pending/collected → cancel with paid advance.
2. Paid-advance **refund UX** after cancel still uses existing payment tools (by design; not a new workflow).
3. Localized (non-EN) `reserveDatesHint` strings may still say “no charges” until locale packs refresh.
4. Payment method on collected advance remains optional on clients for v1.

## Limitations / follow-ups

1. Do **not** introduce new payment categories or a dedicated refund workflow in this feature.
2. OPEN_ENDED reservations allow booking advance against the first-period (daily) rent commitment.
3. Direct allocate / normal move-in without advance continue to use existing activation rent generation.

## Regression boundaries (must stay green)

- Direct allocate / move-in without prior advance
- MONTHLY / SHORT / OPEN_ENDED billing generators (except activation skip when advance exists)
- Deposit generation and refunds
- Extension / renewal / checkout
- Mess/Tiffin
- Existing payment categories and types
