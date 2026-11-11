# Members Card Date Information UI Report

**Date:** 2026-11-09  
**App:** AcomiMobile (React Native Android)  
**Scope:** Members screen member-card UI only — planned/actual move-in and expected move-out

## 1. Files / components modified

| File | Change |
|---|---|
| `src/components/member/MemberListCard.tsx` | Added compact two-column stay date row (tone by Reserved / Moved In) |
| `src/screens/MembersScreen.tsx` | Reuses existing occupancy load; maps ACTIVE/RESERVED dates into card props |
| `src/utils/memberListStayDates.ts` | **New** helper — builds labels/values from existing occupancy fields |
| `src/utils/__tests__/memberListStayDates.test.ts` | **New** unit coverage for date rules |
| `src/i18n/locales/en.json` | Added `occupancy.section.plannedMoveIn`, `occupancy.section.noFixedDate` |

## 2. Existing fields reused for each date

| Display | Status | Source fields |
|---|---|---|
| Planned move-in | Reserved (`occupancy.status === 'RESERVED'`) | `moveInDate` |
| Move-in date | Moved In (`occupancy.status === 'ACTIVE'`) | `actualMoveInAt`, fallback `moveInDate` when actual is absent (legacy rows) |
| Expected move-out | Reserved / Moved In with fixed stay | `expectedExitDate` → `expectedCheckoutDate` via existing `getOccupancyExitDate` |
| No fixed date | `stayKind === 'OPEN_ENDED'` **or** exit date missing | Display label only — no date invented |
| Formatting | All | Existing `formatOccupancyAllocatedDate` |

Stay type chip continues to use existing `stayKind` (`MONTHLY` / `SHORT` / `OPEN_ENDED`).

## 3. How Reserved and Moved In are distinguished

- Occupancy pages already loaded on Members (`ACTIVE`, `RESERVED`, `VACATED`).
- Preferred row per member: **ACTIVE first, then RESERVED** (vacated ignored for the date row).
- Card tone: Reserved → light blue panel; Moved In → light green panel.
- Move-in label: Reserved → **Planned move-in**; Moved In → **Move-in date**.

Member occupancy badges (`RESERVED` / `ALLOCATED`) and stay-type badges are unchanged.

## 4. OPEN_ENDED / no-fixed dates

- When `stayKind === 'OPEN_ENDED'`, right column shows **No fixed date** even if an exit field exists.
- When exit date is null/blank for MONTHLY or SHORT, right column also shows **No fixed date** (no inference from stay type).
- Missing move-in shows **—** (never today’s date).

## 5. Backend / API / database

**No backend, API, database, migration, or DTO changes.**  
All dates come from existing `OccupancyResponse` fields already fetched for stay labels / stay-type chips.

## 6. Payment, reservation, occupancy logic

Unchanged:

- Search, filters, tabs, FAB, navigation, contact sheet
- Pending dues display and payment navigation
- Food included toggle / meal access API
- Reservation, move-in, move-out, billing workflows
- Location trail rules (still hidden for Reserved unless already Moved In / Vacated per existing `memberListStayLabel`)

## 7. Build / test results

```text
npx jest src/utils/__tests__/memberListStayDates.test.ts --no-coverage
```

(Run during implementation; helper covers Reserved fixed, Reserved open-ended, Moved In fixed, Moved In open-ended, missing dates.)

## 8. Screenshots

Capture on device after Metro reload:

1. Reserved + fixed planned move-in / expected move-out (blue date row)
2. Reserved + No Fixed stay type (blue row, **No fixed date**)
3. Moved In + Monthly/Daily with location + green date row
4. Moved In + No Fixed (green row, **No fixed date**)

## 9. Missing API fields / unresolved issues

- None blocking for the approved cases when occupancy rows include `moveInDate` / `actualMoveInAt` / exit dates / `stayKind`.
- Legacy ACTIVE rows without `actualMoveInAt` fall back to `moveInDate` so the card does not show a blank left column when the backend only stored the planned field after move-in.
- Owners and members with no ACTIVE/RESERVED occupancy omit the date row (no fabricated dates).
