# OPEN_ENDED — Update Daily Rent / Revise Stay Terms

**Date:** 2026-11-06
**Scope:** Owner Web App + Android + existing Backend extend API
**Out of scope:** Mess/Tiffin; MONTHLY/SHORT billing logic changes

## Summary

For `stayKind === OPEN_ENDED` (“No Fixed Move-Out Date”), the fixed-duration **Extend stay** form (New Planned End / Additional Amount / Rent Starts In YYYY-MM) is no longer offered. Owners use **Update Daily Rent** with:

- Current Daily Rent (read-only, from `rentSnapshot`)
- New Daily Rent (prefilled, must change)
- Effective From (date picker, default next calendar day)
- Optional reason (Rent revision / Mutual agreement / Other)

Submission reuses `POST …/occupancies/{id}/extend` **without** `expectedExitDate`, sending `rentSnapshot` + `rentEffectiveMonth` (day-level) + optional `reason`. `stayKind` and deposit are unchanged.

---

## Files changed

### Backend (already supported — `K:/Projects/Acomi/Backend/acomi-backend`)

| Area | Path |
|---|---|
| Extend DTO | `occupancy/api/dto/request/ExtendOccupancyRequest.java` — optional `expectedExitDate`, `reason` |
| Extension service | `OccupancyExtensionService.java` — `reviseOpenEndedDailyRent` when OE + no new end |
| Rules | `StayExtensionRules.java` |
| Response | `OccupancyResponse.java` — `priorRentSnapshot`, `rentEffectiveMonth` |
| Billing split | `OccupancyBillingCalculator.java` — prior×days before effective + new×days from effective |
| Tests | `OccupancyExtensionServiceTest.java`, `OccupancyBillingCalculatorTest.java` |

### Owner Web (`K:/AcomiWeb`)

| Path | Change |
|---|---|
| `src/shared/types/accommodation.ts` | Optional extend end/reason; occupancy `priorRentSnapshot` / `rentEffectiveMonth` |
| `src/modules/accommodation/utils/reviseOpenEndedRent.ts` | Prefill, validation, request builder |
| `src/modules/accommodation/components/ReviseOpenEndedRentDialog.tsx` | OE revise UI + preview |
| `src/modules/accommodation/components/OccupancyActionButtons.tsx` | OE → Update Daily Rent; hide Extend/Renew until stayKind known |
| `src/modules/accommodation/components/EntityInspector.tsx` | Wire revise session + `stayKind` |
| `src/modules/accommodation/components/BedInteractionDialog.tsx` | Pass `stayKind` / `onReviseOpenEnded` |
| `src/modules/accommodation/components/PersistedBedInteractionHost.tsx` | Fetch occupancy stayKind; revise dialog |
| `src/modules/members/components/panels/MemberOccupancyPanel.tsx` | Same action/dialog wiring |
| `src/modules/accommodation/utils/stayFinancialDisplay.ts` | Show rate effective-from + prior daily rent |
| `scripts/check-revise-open-ended-rent.mjs` | Builder regression checks |
| `src/modules/accommodation/utils/__tests__/reviseOpenEndedRent.test.ts` | Mirror assertions (Vitest-style; repo runs via mjs) |

### Android (`K:/AcomiMobile`)

| Path | Change |
|---|---|
| `src/api/types.ts` | Optional extend end/reason; prior/effective on occupancy |
| `src/utils/reviseOpenEndedRent.ts` | Prefill, validation, request builder |
| `src/components/occupancy/ReviseOpenEndedRentModal.tsx` | OE revise UI + preview |
| `src/hooks/useAccommodationOccupancyFlow.ts` | `startReviseOpenEndedRent`; OE extend/renew → revise |
| `src/components/occupancy/AccommodationOccupancyFlowModals.tsx` | Route revise vs extend modals |
| `src/components/occupancy/AccommodationOccupancyActions.tsx` | OE action tile |
| `src/components/occupancy/AccommodationOccupancyQuickActions.tsx` | OE quick action |
| `src/components/occupancy/MemberAccommodationSection.tsx` | OE action + revise modal |
| `src/utils/stayFinancialDisplay.ts` | Rate effective-from + prior daily rent |
| `src/utils/__tests__/reviseOpenEndedRent.test.ts` | Unit tests |

---

## Backend / API dependencies

**Supported — no frontend simulation required.**

Rent-only OPEN_ENDED revision:

```http
POST /spaces/{spaceId}/occupancies/{occupancyId}/extend
{
  "idempotencyKey": "…",
  "rentSnapshot": 1200,
  "rentEffectiveMonth": "2026-11-10",
  "reason": "Rent revision"   // optional
}
```

- Omit `expectedExitDate` and `additionalAmount`.
- Backend rejects unchanged rent, missing current rent, effective date before move-in or before business date.
- Sets `priorRentSnapshot` ← old rate, `rentSnapshot` ← new, `rentEffectiveMonth` ← effective day.
- Does **not** change `stayKind`, deposit, or planned end.
- Does **not** regenerate historical paid/generated payment rows; calculator splits **unbilled** calendar periods only.

**Gap / note:** Same-day effective changes are allowed only when `effective >= businessDate`. There is no separate “confirm same-day for unbilled days only” UX flag — backend already blocks dates before business date. Clients default to **next calendar day**.

---

## Prefill sources

| Field | Source |
|---|---|
| Current Daily Rent | Active occupancy `rentSnapshot` (persisted daily rate; **not** monthly÷30) |
| New Daily Rent | Same as current (editable); submit blocked if unchanged |
| Effective From | `defaultRentEffectiveFromYmd()` → next local calendar day |
| Reason | Empty optional dropdown |
| Deposit | Not shown / not sent |

If `rentSnapshot` is null/NaN: error state, submit disabled — no silent zero.

---

## Effective-date handling

- UI default: next calendar day after “today” (local).
- Editable via platform date picker.
- Preview: “Previous rate applies through” = day before effective-from.
- Backend: day-level for OPEN_ENDED (`applyRentChange(..., openEndedDayLevel=true)`).
- MONTHLY extend still uses month-grain `rentEffectiveMonth` when provided on the fixed-duration form.

---

## Billing and historical payment protections

Preserved by existing `OccupancyBillingCalculator` + extension service:

1. OPEN_ENDED `DAILY_RATE` charges **actual occupied days** only.
2. One RENT/MONTHLY payable after the calendar billing period closes (not advance future days).
3. Inclusive occupied-day convention unchanged.
4. Mid-period revision: prior rate × days before effective; new rate × days from effective onward.
5. Already generated/paid rows are not rewritten with the new rate.
6. Checkout/final settlement path unchanged.
7. MONTHLY / SHORT extend + billing paths unchanged (rent-only branch is OE-only).

---

## Tests executed

| Suite | Result |
|---|---|
| Android `src/utils/__tests__/reviseOpenEndedRent.test.ts` | **PASS** (4 tests) |
| Web `scripts/check-revise-open-ended-rent.mjs` | **PASS** |
| Web `scripts/check-extend-stay.mjs` (MONTHLY/SHORT builder unchanged) | **PASS** |
| Backend `OccupancyExtensionServiceTest` (prior work in backend repo) | Present; includes rent-unchanged / OE revise cases |
| Full Web `npm test` (includes unrelated `check-short-stay.mjs`) | **FAIL** on pre-existing `shortStayEnabled` assertion — **not caused by this change** |
| Manual device matrix PG/Hostel/Co-living/Rental | Pending owner smoke on device/build |

---

## Regression matrix

| # | Check | Status |
|---|---|---|
| 1 | OPEN_ENDED shows Update Daily Rent / Revise Stay Terms | Implemented (Web + Android action gating) |
| 2 | OE form has no New Planned End / Additional Amount / Rent Starts In | Implemented (dedicated revise dialog/modal) |
| 3 | Current daily rent prefilled from `rentSnapshot` | Implemented |
| 4 | New daily rent editable + validated (≥0, must change) | Implemented |
| 5 | Effective date prefilled + editable | Implemented |
| 6 | No silent rewrite of historical/generated bills | Backend calculator + extend history only |
| 7 | No advance charge of future days | Existing OE billing rules preserved |
| 8 | Deposit unchanged | Not sent on revise request |
| 9 | Stay type remains OPEN_ENDED | Backend rent-only path; UI copy states type does not change |
| 10 | MONTHLY Extend Stay unchanged | Separate `ExtendStayDialog` / `ExtendStayModal`; action still shown for MONTHLY |
| 11 | SHORT fixed-duration extend unchanged | Same; renew hidden for SHORT |
| 12 | PG / Hostel / Co-living / Rental | Same occupancy actions; space-type-agnostic |
| 13 | Mess/Tiffin untouched | No meal modules modified |

---

## Contract / Stay Details presentation

- Locked contract terms remain historical.
- OPEN_ENDED financial presentation now appends **Rate effective from** and **Previous daily rent** when `rentEffectiveMonth` / `priorRentSnapshot` are present.
- Stay type chip (“No Fixed Move-Out Date”) retained; rate revision does not re-label the stay as Monthly or Daily (pricing basis stays Daily).

---

## Follow-ups (optional)

1. Owner device smoke: revise OE rent → confirm payments list unchanged for closed periods; next open period uses split rates.
2. Add `check-revise-open-ended-rent.mjs` to Web `package.json` `test` script when the pre-existing short-stay check is fixed.
3. Reduce Stay Type redundancy between Contract and Stay Details cards if product wants a layout pass (not done here to avoid unrelated UI churn).
