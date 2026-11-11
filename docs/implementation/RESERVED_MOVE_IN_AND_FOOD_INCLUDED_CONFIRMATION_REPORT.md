# Reserved Move-In + Food Included Confirmation

**Date:** 2026-11-09  
**Repos:** `AcomiMobile` (Android), `AcomiWeb` (Web), `Projects/Acomi/Backend` (investigated)

## Summary

1. **Reserved → Move In** was blocked on **Web member occupancy panel** because Move In / Cancel were never wired, and actions only considered `currentOccupancy` (ACTIVE), ignoring `reservedOccupancy`.
2. **Android** Move In already existed on member accommodation; resolution of the reserved occupancy id was hardened so the wizard can open from member id when the reserved row is present.
3. **Food Included** toggle on Android now requires confirmation before calling the existing meal-access API.
4. **Backend** already supports promoting a `RESERVED` occupancy via `POST .../occupancies/{id}/move-in` without creating a duplicate occupancy or first-period rent. No backend code change was required for the move-in path.

## Root cause — reserved Move In

### Web (`MemberOccupancyPanel`)

- Stay card correctly preferred `reservedOccupancy` when there was no ACTIVE stay.
- Action buttons only rendered when `currentOccupancy.occupancyId` existed.
- `onMoveIn` / `onCancel` were never passed to `OccupancyActionButtons`, so even a reserved `currentOccupancy` could not show Move In.

### Android

- Member details already showed Move In for `occupancyStatus === 'RESERVED'`.
- Wizard already loads reserved occupancy by `occupancyId` or by `memberId` via `getMemberOccupancies`.
- Hardened id resolution: `reservedOccupancy` → member summary → any `RESERVED` row in the occupancy list; allow opening MOVE_IN with member id when status is RESERVED even if id is briefly missing.

### Backend (investigated, unchanged)

| Check | Result |
|---|---|
| `OccupancyService.moveIn` | Loads `RESERVED` occupancy, sets ACTIVE, sets `actualMoveInAt`, syncs inventory/member status |
| Duplicate occupancy | Updates the same occupancy row; does not create a second reservation |
| Financials | `syncActivationPayments` + existing reservation payment records; no new API invented |
| Invalid states | Rejects non-RESERVED occupancy; date / inventory overlap guards remain |
| Tests | Existing `moveIn_whenReserved_promotesToActive` covers happy path |

## Food Included confirmation (Android)

| Step | Behaviour |
|---|---|
| Tap toggle | Dialog opens; Switch remains on saved value |
| Cancel | Dialog closes; no API call |
| Confirm | Calls existing `setMemberMealAccess` |
| Success | Toast + refresh participation map |
| Failure | Previous value retained + error toast |
| In-flight | Loading indicator; further toggles ignored |

Components: `MemberListMealAccessRow` (Members list), `MemberCompactHeader` (Mess meal access switch).

Reusable dialog: existing `useConfirmDialog` / `ConfirmDialogProvider`.

### Web Food Included

No Members-list Food Included toggle exists on Web today (only meal enrollment on add-member). No parallel list toggle was invented. Meal participation APIs already exist if a future list toggle is added — use the same confirmation copy.

## Files changed

### Android (`AcomiMobile`)

- `src/components/occupancy/MemberAccommodationSection.tsx` — reserved occupancy resolution + MOVE_IN open rules
- `src/components/meals/MemberListMealAccessRow.tsx` — confirm before save
- `src/components/member/MemberCompactHeader.tsx` — confirm before save
- `src/i18n/locales/en.json` — confirmation strings

### Web (`AcomiWeb`)

- `src/modules/members/components/panels/MemberOccupancyPanel.tsx` — Move In / Cancel for reserved stays using `reservedOccupancy`

### Backend

- No code changes.

## Regression protection

Unchanged by design:

- Direct ALLOCATE walk-in
- Reserve / cancel reservation / transfer / vacate
- Booking advance + first-period rent split (backend path untouched)
- MONTHLY / SHORT / OPEN_ENDED billing rules
- Members card layout, payments UI, dashboard

## Test plan (manual / device)

### A. Reserved move-in

1. Reserve a tenant without moving in → status Reserved.
2. Open member occupancy (Web + Android) → **Move In** visible.
3. Complete wizard → status Moved In; bed occupied; payments not duplicated.

### B. Food Included confirmation (Android)

1. Tap Food Included on reserved/moved-in tenant → dialog.
2. Cancel → value unchanged after refresh.
3. Confirm enable/disable → API succeeds; list/detail match after refresh.
4. Force API failure → previous value retained.

### C. Invalid move-in

- Cancelled / already active occupancy still rejected by backend.
- Unauthorized users still cannot manage occupancy.

## Screenshots

Capture after reload:

1. Web reserved member with Move In action
2. Android reserved member Move In
3. Android Food Included confirmation dialog (enable + disable)
