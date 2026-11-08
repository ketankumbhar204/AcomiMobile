# Compact Page Banner — Repository Audit

**Date:** 2026-11-08
**Scope:** Full React Native (Android) application UI under `src/`
**Reference design:** Rooms entry card on `AccommodationHomeScreen` (compact horizontal banner)

## Summary

| Metric | Count |
|--------|------:|
| Screens / surfaces audited for page banners | 70+ |
| Oversized stacked decorative banners (before) | 15 call sites via 2 shared heroes + 5 inline heroes |
| Already compact (MealFormHero / Rooms / wizard) | 30+ |
| Migrated to `CompactPageBanner` | All oversized form banners |
| Intentionally unchanged | Auth, dashboard, profile, entity-detail heroes |

## Shared components discovered

| Component | Path | Before | After / treatment |
|-----------|------|--------|-------------------|
| `AccommodationFormHero` | `src/components/accommodation/AccommodationFormHero.tsx` | Large stacked banner (icon → eyebrow → 22pt title → subtitle + decor blob/ring) | Wraps `CompactPageBanner`; eyebrow no longer rendered |
| `AdminFormHero` | `src/components/admin/AdminFormHero.tsx` | Same stacked pattern via `adminHero` styles | Wraps `CompactPageBanner` |
| `MealFormHero` | `src/components/meals/MealFormHero.tsx` | Already compact horizontal | Now delegates to `CompactPageBanner` |
| `OccupancyWizardHeroBanner` | `src/components/occupancy/OccupancyWizardHeroBanner.tsx` | Already compact; had decor ring | Wraps `CompactPageBanner` + stay-type chip |
| **`CompactPageBanner`** | `src/components/ui/CompactPageBanner.tsx` | — | **New shared component** |
| `AuthHero` | `src/components/auth/AuthHero.tsx` | Auth/onboarding branding | **No change** (not a form page banner) |
| `ProfileHero` | `src/components/profile/ProfileHero.tsx` | Profile identity | **No change** |
| `DashboardOwnerHero` / `DashboardCustomerHero` | `src/components/dashboard/...` | Dashboard identity | **No change** |
| `AccommodationEntityHero` | `src/components/accommodation/AccommodationEntityHero.tsx` | Entity detail identity card | **No change** |
| `MemberCompactHeader` | `src/components/member/MemberCompactHeader.tsx` | Already compact | **No change** |

---

## A. Property and building management

| Screen name | File | Before | ~Height | Banner elements | Proposed | Status |
|-------------|------|--------|---------|-----------------|----------|--------|
| Add / Edit Building | `BuildingFormScreen.tsx` | Large banner (`AccommodationFormHero`) | ~140–160 dp | Icon, BUILDING, title, subtitle, shapes | Shared compact | **Migrated** |
| Add / Edit Floor | `FloorFormScreen.tsx` | Large banner | ~140–160 dp | Icon, FLOOR, title, subtitle, shapes | Shared compact | **Migrated** |
| Add / Edit Unit | `UnitFormScreen.tsx` | Large banner | ~140–160 dp | Icon, UNIT, title, subtitle, shapes | Shared compact | **Migrated** |
| Add / Edit Room | `RoomFormScreen.tsx` | Large banner | ~140–160 dp | Icon, ROOM, title, subtitle, shapes | Shared compact | **Migrated** |
| Add / Edit Bed | `BedFormScreen.tsx` | Large banner | ~140–160 dp | Icon, BED, title, subtitle, shapes | Shared compact | **Migrated** |
| Building setup wizard | `QuickSetupWizardScreen.tsx` | Large banner (step 0) | ~140–160 dp | Icon, eyebrow, title, subtitle | Shared compact | **Migrated** |
| Rooms home | `AccommodationHomeScreen.tsx` | Compact (reference) | ~80–100 dp | Icon, title, subtitle, soft blob | Shared compact | **Aligned** (now uses `CompactPageBanner`) |
| Create Space | `CreateSpaceScreen.tsx` | Large inline stacked | ~140–160 dp | Icon, eyebrow, title, subtitle, shapes | Shared compact | **Migrated** |
| Building / Floor / Unit / Room / Bed details | `*DetailScreen.tsx` + `AccommodationEntityHero` | Entity identity card | ~120+ dp | Larger icon well, title, meta | Retain entity hero | **Unchanged** (content identity, not page intro) |
| Property layout picker | Embedded in Building / Quick Setup | Content picker | — | Layout cards | No page banner | **N/A** |

---

## B. Member and occupancy

| Screen name | File | Before | Proposed | Status |
|-------------|------|--------|----------|--------|
| Add Member | `AddMemberScreen.tsx` | Large inline stacked | Shared compact | **Migrated** |
| Edit Member | `EditMemberScreen.tsx` | Large inline stacked | Shared compact | **Migrated** |
| Invite Member | `InviteMemberScreen.tsx` | Large inline stacked | Shared compact | **Migrated** |
| Member Subscription | `MemberSubscriptionScreen.tsx` | Large inline stacked | Shared compact | **Migrated** |
| Occupancy wizard | `OccupancyWizardHeroBanner` consumers | Compact + stay chip | Shared compact | **Aligned** |
| Member list / home headers | `MemberCompactHeader`, list screens | Compact / toolbar | Retain | **Unchanged** |
| Allocation / Transfer / Checkout / Extend | Wizard steps | Wizard banner / progress | Retain wizard pattern | **Unchanged** (already compact) |

---

## C. Payments and financial operations

| Screen name | File | Before | Status |
|-------------|------|--------|--------|
| Create Payment | `CreatePaymentScreen.tsx` | `MealFormHero` (compact) | **Aligned** via `MealFormHero` → `CompactPageBanner` |
| Payment History | `PaymentHistoryScreen.tsx` | Compact | **Aligned** |
| Tenant Payments | `TenantPaymentsTabScreen.tsx` | Compact | **Aligned** |
| Day Meal Bulk Pay / Detail | `DayMealBulkPayScreen.tsx`, `DayMealPaymentDetailScreen.tsx` | Compact | **Aligned** |
| Payment approval cards | `PaymentApprovalCard.tsx` | Content cards | **Unchanged** |

---

## D. Mess and meals

| Screen name | File | Before | Status |
|-------------|------|--------|--------|
| Meals Home, Menu Library, Daily Menu*, Combos, Plans, Delivery, Poll, Share | Various under `src/screens/meals/` | `MealFormHero` compact | **Aligned** |
| Admin Add Mess | `AdminAddMessScreen.tsx` | Large `AdminFormHero` | **Migrated** |
| Admin Add Property | `AdminAddPropertyScreen.tsx` | Large `AdminFormHero` | **Migrated** |
| Admin Create Test User | `AdminCreateTestUserScreen.tsx` | Large `AdminFormHero` | **Migrated** |

---

## E. Other modules

| Screen name | File | Before | Status |
|-------------|------|--------|--------|
| Complaints list / detail / raise | `complaints/*` | `MealFormHero` compact | **Aligned** |
| Notifications | `SpaceNotificationsScreen.tsx` | Compact | **Aligned** |
| Inventory dashboard | `InventoryDashboardScreen.tsx` | Compact | **Aligned** |
| Global activity | `GlobalActivityListScreen.tsx` | Compact | **Aligned** |
| Pending actions | `DashboardPendingActionsScreen.tsx` | Compact | **Aligned** |
| Edit Space | `EditSpaceScreen.tsx` | Compact `MealFormHero` | **Aligned** |
| Home (space picker) | `HomeScreen.tsx` | Compact | **Aligned** |
| Auth (Login, OTP, Register, …) | `AuthHero` | Branding hero | **Unchanged** |
| Profile | `ProfileHero` | Identity | **Unchanged** |
| Owner / Customer dashboard heroes | Dashboard components | Dashboard identity | **Unchanged** |
| Onboarding / Complete profile | Auth-style heroes | Onboarding | **Unchanged** |

---

## Intentionally not migrated

1. **Auth / onboarding heroes** — marketing/branding layouts; not operational form page banners.
2. **Dashboard owner/customer heroes** — space identity / KPI context, not form intros.
3. **Profile hero** — profile identity card.
4. **Accommodation entity detail heroes** — building/floor/room/bed detail identity with meta/footer; not the oversized form intro pattern.
5. **KPI / ops / pending-payment cards** — content cards, not page banners.
6. **App bars / bottom nav / FABs** — navigation chrome.

## Duplicate title guidance

Form screens keep the navigation title in the stack header and a compact contextual banner with the same title + short subtitle. The compact banner height (~80–105 dp) avoids the previous “double heading” feeling of a large stacked card repeating BUILDING / Edit Building under an “Edit Building” app bar. Category eyebrows (BUILDING, FLOOR, etc.) are no longer shown.
