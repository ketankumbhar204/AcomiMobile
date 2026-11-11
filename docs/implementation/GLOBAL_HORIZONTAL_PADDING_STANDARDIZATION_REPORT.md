# Global Horizontal Padding Standardization Report

**Date:** 2026-11-08  
**Scope:** Android (React Native) page-level left/right content margins only.  
**Constraint:** No navigation, API, business-logic, typography, color, or vertical-rhythm redesigns beyond preserving existing top/bottom values where they were already intentional.

---

## 1. Screens audited

| Area | Screens / surfaces reviewed |
|------|-----------------------------|
| Shared chrome | `Screen`, sticky form/workflow footers |
| Reference | Rooms (`AccommodationHomeScreen`) |
| Dashboard | `DashboardScreen`, `DashboardBedInventoryScreen`, pending actions / space health |
| Members | `MembersScreen`, `MemberDetailsScreen`, member home / subscription |
| Accommodation | Rooms home, rooms/beds lists, floor apartments, building/floor/room/bed/unit detail + forms |
| Payments | Payments home, payment detail layout helper, day-meal panel + bulk footer |
| Meals | Meals home, daily menu edit/today, menu library |
| Notifications | `SpaceNotificationsScreen`, `AccountNotificationsScreen` |
| Discovery / account | Find a Place, Favorites, My Spaces, Startup Offline |
| Admin / other | Admin dashboards/details (already largely `spacing.lg`); reports / inventory wrappers |

---

## 2. Rooms reference margin

**Source:** `AccommodationHomeScreen` content container.

| Token | Value | Notes |
|-------|-------|--------|
| **Reference** | `spacing.lg` = **16** | Was applied as uniform `padding: spacing.lg` |
| **Standard token** | `pageContentGutter` | Exported from `src/theme/spacing.ts` / `theme` as alias of `spacing.lg` |

This is the page-level left/right content margin used as the app-wide standard.

---

## 3. Screens with excessive / inconsistent padding found

| Screen / component | Before (horizontal) | Issue |
|--------------------|---------------------|--------|
| `Screen` default | `padding: spacing.xxl` (24 all sides) | Wider than Rooms; inherited by many screens |
| `DashboardScreen` | `paddingHorizontal: spacing.xxl` (24) | Visually looser than Rooms |
| `DashboardBedInventoryScreen` | `padding: spacing.xxl` (24) | Available beds wider than Rooms ops |
| `MembersScreen` | `padding: spacing.xl` (20) | Slightly wider than Rooms |
| Accommodation rooms/beds/floor lists | `padding: spacing.xl` (20) | Inconsistent with Rooms home |
| `MySpacesScreen`, `FindAPlaceScreen`, `DailyMenuEditScreen` | `spacing.xxl` (24) | Excessive page gutter |
| `FavoritesScreen` | Screen **plus** list/filters `spacing.xxl` | **Double horizontal inset** |
| Sticky bars / day-meal footer | `spacing.xxl` | Misaligned with tightened page content |
| Payment detail gutter helper | Documented as matching Dashboard `xxl` | Needed Rooms alignment |
| `SpaceNotificationsScreen` | `Screen` zeroed, then child `spacing.lg` only on some regions | Uneven top/side; empty states lacked side inset |
| `AccountNotificationsScreen` | `padding: spacing.md` (12) | Tighter / inconsistent vs page standard |

---

## 4. Root causes

1. **`Screen` default used 24dp** while Rooms opted into **16dp**, so any screen that relied on `Screen` without an override looked “more padded.”
2. **Dashboard explicitly locked to `spacing.xxl`**, compounding the visual gap vs Rooms.
3. **Nested padding** (notably Favorites: Screen gutter + FlatList/filter gutter).
4. **Per-screen magic numbers** (`xl` / `xxl` / `md`) instead of one semantic page gutter.
5. **Notifications** zeroed `Screen` padding and re-applied horizontal margins only on header/list, so empty/loading regions and top inset did not share one parent gutter.

---

## 5. Shared components / tokens modified

| Change | Path |
|--------|------|
| Added `pageContentGutter` | `src/theme/spacing.ts`, re-exported in `src/theme/index.ts` |
| `Screen` default horizontal → `pageContentGutter`; vertical kept at legacy `spacing.xxl` | `src/components/ui/Screen.tsx` |
| Sticky bar chrome horizontal → `pageContentGutter` | `src/components/progressive/stickyBarStyles.ts` |
| Day-meal bulk footer / panel page gutter | `DayMealPaymentBulkFooter.tsx`, `DayMealPaymentsPanel.tsx` |
| Payment detail gutter = `pageContentGutter` | `src/screens/payments/paymentDetailLayout.ts` (+ unit test) |

Screen-level updates (horizontal → `pageContentGutter`, vertical preserved where previously distinct): Dashboard, Dashboard bed inventory, Members, Accommodation rooms/beds/floor apartments, Rooms home (tokenized), My Spaces, Find a Place, Daily menu edit, Favorites (removed double inset), Startup Offline, Space + Account notifications.

---

## 6. Intentional exceptions retained

| Surface | Reason |
|---------|--------|
| `MenuPlanningBottomSheet` | Modal / sheet chrome; not page content |
| Dialog / confirm overlays (`padding: spacing.xl`) | Modal inset, not list page margins |
| Centered error/empty shells inside wizards | Full-area centering padding, not content columns |
| Card / chip / field **internal** padding | Unchanged (out of scope) |
| Horizontal carousels / edge-to-edge banners | No negative-margin hacks introduced |
| Auth / onboarding dense forms already on `lg` | Left as-is where already Rooms-aligned |

---

## 7. Before / after (visual)

Device screenshots were not captured in-CI for this pass. Expected deltas from the annotated product screenshots:

| Screen | Before | After |
|--------|--------|--------|
| **Dashboard** | Content ~24dp from edges; looser than Rooms | Aligns to **16dp** with Rooms |
| **Available beds** | Page gutter 24dp | **16dp**; KPI / filters / list share one parent inset |
| **Rooms** | Already 16dp | No regression (tokenized to `pageContentGutter`) |
| **Notifications** | Top tight / uneven; empty states without side gutter | Top `spacing.md` + sides `pageContentGutter` on screen root |
| **Favorites** | Double ~24+24 | Single `pageContentGutter` |

Manual visual check recommended on small and large phones for: Dashboard, Rooms, Members, Payments, Meals, Notifications, one form (sticky footer alignment), one detail (Payment detail).

---

## 8. Build and test results

| Check | Result |
|-------|--------|
| `paymentDetailLayout` unit expectations | Updated to assert `spacing.lg` / `pageContentGutter`; sticky bar matches content gutter |
| Full app binary rebuild / screenshot matrix | Not run in this pass — verify on device/emulator |

Run locally:

```bash
npx jest src/screens/payments/__tests__/paymentDetailLayout.test.ts --no-coverage
```

---

## 9. Remaining inconsistent / follow-up screens

These still use local `spacing.lg` (same **value** as the standard) without the `pageContentGutter` symbol, or have specialized layouts:

- Many detail/form screens already on `padding: spacing.lg` (Payments, Meals home, accommodation details, admin details) — **value-aligned**, optional token migration later.
- Admin list screens with `spacing.md` content padding — denser admin chrome; leave unless product wants Rooms parity there.
- `ReceivedEnquiriesScreen` / enquiry hubs — mixed chip/row paddings; page shell largely `lg`; revisit only if product flags them.
- Horizontal scroll rows that intentionally break the gutter — none changed in this pass.

---

## 10. Follow-up: Move In / Occupancy Wizard (2026-11-10)

**Symptom:** Stay-type and bed-picker steps looked wider-guttered than Member Details.

**Cause:**
1. `Screen` default horizontal gutter was not reliably cleared by `padding: 0`, so wizard scroll/header padding stacked on top (~32dp).
2. `wizardFooter` added another `spacing.lg` on top of `stickyBarChrome`’s `pageContentGutter`.

**Fix (`OccupancyWizardScreen`):**
- Apply **one** `pageContentGutter` on Screen `contentStyle` (same as Member Details).
- Remove nested horizontal padding from scroll content, target header/body.
- Set `wizardFooter.paddingHorizontal: 0` so sticky actions align with cards.
- Explicit `paddingHorizontal/Vertical: 0` on `listScreen` style override.

---

## Summary

- **Standard:** `pageContentGutter` = **16** (Rooms).
- **Primary fix:** `Screen` + Dashboard + bed inventory + shared sticky/payment gutters.
- **Nested padding:** Favorites corrected; Notifications use one screen-level gutter for top and sides.
- **No** card redesign, color, typography, or navigation changes.
