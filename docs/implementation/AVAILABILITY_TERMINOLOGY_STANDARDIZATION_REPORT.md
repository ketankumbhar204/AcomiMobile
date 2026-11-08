# Availability Terminology Standardization Report

**Date:** 2026-11-07
**Scope:** User-facing “Vacant” → “Available” across ACOMI platforms
**Constraint:** Display terminology only — no API, enum, DB, filter, or occupancy logic changes

---

## 1. Repositories and modules audited

| Repository | Role | Audited |
|---|---|---|
| `AcomiMobile` | Android / React Native owner app | Yes |
| `AcomiWeb` | Owner Web App | Yes |
| `AcomiPublicWebsite` | Marketing / public site | Yes |
| Admin surfaces inside `AcomiWeb` | Admin property flows | Yes (no separate Vacant inventory labels found beyond shared i18n) |

Search covered UI components, i18n locales, hardcoded marketing copy, filter chips, drilldown titles, empty states, and health-action copy.

---

## 2. Screens and components updated

### AcomiMobile

| Area | Change |
|---|---|
| i18n `en` / `hi` / `mr` / `ta` / `kn` / `te` | Display strings for ops cards, drilldown titles, empty states, space KPI, health improve-occupancy |
| `AccommodationOpsFocusInventory` | `Showing:` badge uses shared Available beds label mapping |
| `SpaceDetailsScreen` | KPI defaultValue → `Available beds` |
| `src/utils/availabilityDisplayLabel.ts` | Shared display-label helper (keys + English fallbacks) |
| Unit test | `availabilityDisplayLabel.test.ts` |

### AcomiWeb

| Area | Change |
|---|---|
| i18n `en` / `hi` / `mr` / `ta` / `kn` / `te` | `vacant` / `vacantBeds` / drilldown title / empty / improveOccupancy display copy |
| `RoomInventoryPanel` | `Showing:` VACANT focus defaultValue → Available beds |
| `AuthPhonePreview` | Hardcoded chip `Vacant` → `Available` |
| `src/shared/utils/availabilityDisplayLabel.ts` | Shared display-label helper |

### AcomiPublicWebsite

| Area | Change |
|---|---|
| i18n `status.vacant` + property-run / occupancy marketing copy | Vacant → Available (localized where applicable) |
| Product mocks / home occupancy sections | Hardcoded Vacant labels → Available |
| Script mock screens (`dashboard.html`, `occupancy.html`) | Label text updated |
| Shot alt text | vacant → available wording |

---

## 3. Before / after terminology examples

| Context | Before | After |
|---|---|---|
| Rooms focus chip | `Showing: Vacant beds` | `Showing: Available beds` |
| Ops short card (Web) | `Vacant` | `Available` |
| Drilldown title | `Vacant beds` | `Available beds` |
| Empty state | `No vacant beds` | `No available beds` |
| Space details KPI | `Vacant beds` | `Available beds` |
| Health action | `…allocating vacant beds` | `…allocating available beds` |
| Public site metric | `Vacant` | `Available` |

Short filter cards that already showed **Available** (Mobile `vacantBedsShort`, Rooms capsules, bed status chips via `accommodation.status.AVAILABLE`) were left as-is.

---

## 4. Internal references intentionally retained

These remain **unchanged** by design:

| Kind | Examples |
|---|---|
| API / DTO fields | `vacantBeds`, dashboard summary `vacantBeds` |
| Internal ops focus ids | `vacant`, `VACANT`, `PropertyOpsFocus = 'vacant'` |
| Navigation params | `focus: 'vacant'` |
| Callback / prop names | `onVacantPress`, `handleVacantBedsPress` |
| Helpers | `allocateNeedsVacantBedPick`, health target `kind: 'vacantBeds'` |
| Theme / tone tokens | `tone: 'vacant'` (color token, not user copy) |
| Demo data property names | `beds.vacant`, `vacantPct` (numeric fields) |
| i18n **keys** | `vacantBeds`, `vacantBedsTitle`, `emptyVacantBeds` (values updated; keys kept for compatibility) |
| Docs / historical audits | Implementation markdown under `docs/implementation/*` describing prior Vacant UX |
| Vacate / vacated occupancy actions | Unrelated lifecycle verb — not availability status |

Bed/room/unit status enums continue to use API value `AVAILABLE`. Maintenance / blocked / inactive inventory is still excluded from Available counts and filters.

---

## 5. Shared terminology mapping

Added:

- Mobile: `src/utils/availabilityDisplayLabel.ts`
- Web: `src/shared/utils/availabilityDisplayLabel.ts`

Both map display nouns (`short` / `beds` / `units`) to existing i18n keys and provide English fallbacks using **Available** wording, without renaming internal vacant identifiers.

---

## 6. Tests executed and results

| Test | Result |
|---|---|
| `src/utils/__tests__/availabilityDisplayLabel.test.ts` | **PASS** (2 tests) |
| Manual device / browser smoke of Dashboard / Rooms / Building filters | Not run in this pass — terminology-only change; counts and filter wiring untouched |

Behaviour preserved:

1. Available / Occupied / Reserved counts still sourced from the same ops / inventory APIs.
2. Selecting Available / vacant focus still filters to `AVAILABLE` beds.
3. Reserved / maintenance / blocked inventory is not relabelled as Available.
4. No request/response contract changes.

---

## 7. Remaining “Vacant” / vacant occurrences (classified)

| Classification | Action |
|---|---|
| Internal/backend identifiers, focus ids, API fields | Retain |
| Theme tone `vacant`, demo numeric `vacant` fields | Retain |
| i18n key names containing `vacant*` | Retain (values are Available*) |
| Code comments / JSDoc mentioning vacant inventory paths | Retain (developer context) |
| Historical implementation docs | Retain |
| User-facing UI strings in Mobile / Web / Public site product surfaces | Updated in this pass |

**No remaining user-facing “Vacant” inventory labels found** in Mobile `src`, Web `src`, or Public Website product UI after the second search for `Vacant beds`, `"Vacant"`, and `No vacant`.

---

## 8. Expected outcome

ACOMI consistently displays **Available** instead of **Vacant** for unoccupied allocatable inventory across Mobile, Owner Web, and the Public Website, without changing inventory, reservation, allocation, or availability behaviour.
