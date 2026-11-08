# Compact Page Banner — Standardization Report

**Date:** 2026-11-08
**Related audit:** [COMPACT_PAGE_BANNER_AUDIT.md](./COMPACT_PAGE_BANNER_AUDIT.md)

## 1. Total screens audited

70+ screens and reusable header surfaces across accommodation, membership, occupancy, payments, meals, admin, complaints, notifications, inventory, auth, profile, and dashboard modules.

## 2. Screens using oversized banners before the change

**Shared large heroes**

- `AccommodationFormHero` — Building, Floor, Unit, Room, Bed forms + Quick Setup
- `AdminFormHero` — Admin Add Property, Add Mess, Create Test User

**Inline large stacked heroes**

- `CreateSpaceScreen`
- `AddMemberScreen`
- `EditMemberScreen`
- `InviteMemberScreen`
- `MemberSubscriptionScreen`

**Approximate pre-change height:** ~140–160 dp (stacked icon + uppercase eyebrow + 22 pt title + subtitle + vertical padding + decorative ring).

## 3. Screens migrated to the shared component

| Area | Screens |
|------|---------|
| Accommodation forms | Add/Edit Building, Floor, Unit, Room, Bed; Quick Setup |
| Rooms home | `AccommodationHomeScreen` (reference aligned to shared component) |
| Spaces | Create Space |
| Members | Add / Edit / Invite Member; Member Subscription |
| Admin | Add Property, Add Mess, Create Test User |
| Meals / payments / complaints / etc. | All prior `MealFormHero` consumers (now via `CompactPageBanner`) |
| Occupancy wizard | `OccupancyWizardHeroBanner` |

## 4. Screens intentionally left unchanged

| Surface | Why |
|---------|-----|
| `AuthHero` | Auth/onboarding brand layout |
| `ProfileHero` | Profile identity |
| `DashboardOwnerHero` / `DashboardCustomerHero` | Dashboard identity / ops context |
| `AccommodationEntityHero` | Detail-screen entity card (meta, badge, footer) |
| KPI / pending-payment / setup action cards | Content, not page intros |
| Toolbar-only screens without form banners | No banner needed |

## 5. Shared component created or reused

**Created:** `src/components/ui/CompactPageBanner.tsx`
Exported from `src/components/ui/index.ts`.

**API**

- `icon`, `title`, optional `subtitle`, optional `right`
- Theme colours: `accent`, `soft`, `border`
- Subtle optional right-edge decor blob (`showDecor`)
- Accessibility: `accessibilityRole="header"`, combined label

**Wrappers updated to delegate**

- `AccommodationFormHero`
- `AdminFormHero`
- `MealFormHero`
- `OccupancyWizardHeroBanner`

Existing design tokens (`colors`, `radius`, `shadows`, `spacing`, `typography`) are reused. No new design system.

## 6. Source files changed

**New**

- `src/components/ui/CompactPageBanner.tsx`
- `docs/ui/COMPACT_PAGE_BANNER_AUDIT.md`
- `docs/ui/COMPACT_PAGE_BANNER_STANDARDIZATION_REPORT.md`

**Components**

- `src/components/accommodation/AccommodationFormHero.tsx`
- `src/components/admin/AdminFormHero.tsx`
- `src/components/admin/adminStyles.ts` (removed unused `adminHero`)
- `src/components/meals/MealFormHero.tsx`
- `src/components/occupancy/OccupancyWizardHeroBanner.tsx`
- `src/components/ui/index.ts`

**Screens**

- `src/screens/accommodation/AccommodationHomeScreen.tsx`
- `src/screens/CreateSpaceScreen.tsx`
- `src/screens/AddMemberScreen.tsx`
- `src/screens/EditMemberScreen.tsx`
- `src/screens/InviteMemberScreen.tsx`
- `src/screens/MemberSubscriptionScreen.tsx`

Accommodation form screens (`BuildingFormScreen`, `FloorFormScreen`, etc.) and admin screens did not need call-site edits — they already used the shared heroes whose implementation changed.

## 7. Before / after height (representative)

| Screen | Before (approx.) | After (approx.) | Delta |
|--------|------------------|-----------------|------:|
| Edit Building | ~150 dp | ~88–100 dp | −50–60 dp |
| Edit Floor | ~150 dp | ~88–100 dp | −50–60 dp |
| Add Member | ~150 dp | ~88–100 dp | −50–60 dp |
| Create Space | ~150 dp | ~88–100 dp | −50–60 dp |
| Rooms home | ~85–95 dp | ~88–100 dp | ~same (aligned) |

First useful form field sits noticeably higher on Edit Building / Edit Floor after removing the stacked eyebrow + oversized title block.

## 8. Responsive validation performed

| Check | Result |
|-------|--------|
| Layout code: flex row, `minWidth: 0` on text, title/subtitle wrap (2 lines) | Implemented |
| Icon fixed 44 dp; no overlap with title | Implemented |
| Right slot capped (`maxWidth: '34%'`) for wizard chip | Implemented |
| No fixed max height that clips content | `minHeight: 80` only |
| Device matrix (small / large phones, font scale) | Not run on physical devices in this pass; layout constraints follow existing Rooms/Meal compact patterns |

## 9. Build and test results

| Check | Result |
|-------|--------|
| IDE diagnostics (`ReadLints`) on changed files | Clean — no linter errors |
| ESLint on shared banner components (`CompactPageBanner`, `AccommodationFormHero`, `AdminFormHero`, `MealFormHero`, `OccupancyWizardHeroBanner`, `adminStyles`) | **Passed** (`--max-warnings 0`) |
| ESLint on migrated screens | Pre-existing warnings only (`no-void`, `react/no-unstable-nested-components`); none introduced by banner edits |
| Jest `localeMatrix` | Failed on pre-existing hi/mr interpolation token mismatches — **unrelated** to banner work |
| Dedicated banner unit / UI tests | None present in repo |
| Full Android assemble / device UI matrix | Not executed in this pass |

Functional behaviour (API, validation, save, navigation, sticky form actions) was not modified.

## 10. Incomplete items

- Physical-device responsive pass (small / large phone, font scale) not executed here; layout matches the existing Rooms compact pattern already shipping in production.
- No incomplete banner migrations remain for oversized form page banners identified in the audit.
