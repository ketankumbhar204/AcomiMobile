# Stay Management Mock UI Implementation Report

**Date:** 2026-11-05
**Scope:** Approved mock designs (Steps 1–5) for Allocate / Reserve / Transfer on Android + Owner Web, plus Short Stay **daily-rate** business model.

## Summary

Implemented mock-aligned wizard chrome and Short Stay daily rent × nights pricing end-to-end (UI → API payload → backend snapshot → payment amount), with legacy fixed-`agreedTotal` Short Stays still accepted.

## Files changed

### Backend (`K:\Projects\Acomi\Backend\acomi-backend`)

| File | Change |
|------|--------|
| `ShortStayRules.java` | Daily rate via `rentSnapshot`; stay rent = daily × nights; legacy `agreedTotal`-only still valid |
| `OccupancyService.java` | Pass/store SHORT daily `rentSnapshot`; reserve/transfer no longer strip it |
| `OccupancyContractSnapshotService.java` | Persist SHORT daily rate; do not inherit MONTHLY rent as SHORT daily |
| `SpacePaymentGenerationService.java` | Short EXTRA amount from `resolveStayRent(daily, legacyAgreed)` |
| `AllocateOccupancyRequest.java` | Schema docs for daily vs legacy total |
| `ShortStayRulesTest.java` | Daily × nights + zero-rate cases |
| `OccupancyContractSnapshotServiceTest.java` | Persists daily snapshot; transfer MONTHLY→SHORT still null rent |

### Android (`K:\AcomiMobile`)

| File | Change |
|------|--------|
| `OccupancyWizardStepHeader.tsx` | Connected progress line; compact inventory summary |
| `SelectedInventorySummaryCard.tsx` | New compact space (+ optional member) card |
| `ShortStayChoice.tsx` | Mock stay-type cards; Short details/duration; **daily rent** + stay-rent card |
| `OccupancyWizardScreen.tsx` | Continue always on intermediate steps; daily rent wiring; compact header |
| `useOccupancyWizardSubmit.ts` | SHORT sends `rentSnapshot` (daily) + derived `agreedTotal` |
| `shortStay.ts` | `dailyRent` → `rentSnapshot` + `agreedTotal = daily × nights` |
| `ReviewStep.tsx` | Charges summary: daily × nights + total on allocation |
| `en.json` | Short stay hint copy |
| Tests | `ShortStayChoice`, `ReviewStep.shortStaySummary`, steps, `shortStay` util |

### Owner Web (`K:\AcomiWeb`)

| File | Change |
|------|--------|
| `utils/shortStay.ts` | Synced with mobile daily-rate `applyStayChoice` |
| `OccupancyWizardPage.tsx` | Contract daily rent field + stay-rent alert; submit uses `dailyRent` |

## Screens vs mocks

| Step | Status |
|------|--------|
| 1 Choose Stay Type | Cards with icons, hints, radio/check, compact inventory, connected stepper |
| 2 Select Member | Continue always visible (auto-advance retained); compact inventory |
| 3 Stay Details | Type banner + info icon; checkout; duration bar (half-open nights) |
| 4 Contract Terms | Short: daily rent + live stay rent; Monthly/Until I Leave existing fields retained |
| 5 Review | Accommodation / member / charges with daily × nights + total on allocation |

**Deviations / remaining polish**

- Web progress still uses MUI `Stepper` (connected) rather than the custom mobile connector component.
- Member picker card chrome not fully restyled to mock avatars/status pills (behaviour unchanged).
- Amenities still use existing collapsible section (not redesigned grid).
- Transfer source/destination dual summary on review not fully split into two mock-style cards.
- Device/browser visual QA **not** performed in this pass.

## Pricing / API / DB

- **New SHORT contract:** owner enters daily rent → stored in `rent_snapshot`; server sets `agreed_total = daily × nights`; `pricing_basis` remains `FIXED_TOTAL` for the EXTRA payment amount.
- **Legacy SHORT:** `rent_snapshot` null + positive `agreed_total` still works (no migration).
- **No Flyway / no production DB changes.**
- **Extensions:** still owner `additionalAmount` — **BLOCKED** for automatic daily × added nights (product decision not taken).
- **Reserve:** still no activation payments until move-in.
- **Mess/Tiffin:** untouched.
- **Vacant Beds → Bed Detail → Allocate:** preserved.

## Tests executed

| Suite | Result |
|-------|--------|
| Backend `ShortStayRulesTest` + `OccupancyContractSnapshotServiceTest` | PASS |
| Android Jest: `occupancyWizardSteps`, `shortStay`, `ShortStayChoice`, `ReviewStep.shortStaySummary` | PASS (27) |
| Full payment persistence matrix / OccupancyService IT | Not re-run in this pass |
| Device / browser visual QA | **Not performed** |

## Payment persistence

Unit/rules coverage confirms stay rent resolution and snapshot persistence. Full allocate → DB payment row assertion suite was **not** re-run here; recommended follow-up: `SpacePaymentGenerationServiceTest` / stay matrix with daily `rentSnapshot`.

## Blockers

1. **Short Stay extensions** — still fixed `additionalAmount`; deriving from daily × added nights needs product approval.
2. **Full visual parity** on Web member/amenities/transfer dual cards — deferred polish.
3. **Backend restart required** on the local machine to pick up Java changes before device E2E.

## Confirmations

- Mess/Tiffin: **untouched**
- Vacant beds entry path: **preserved**
- Browser/device visual QA: **not performed**
