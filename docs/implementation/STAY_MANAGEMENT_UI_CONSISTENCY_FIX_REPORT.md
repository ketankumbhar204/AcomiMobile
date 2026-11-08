# Stay Management Wizard – UI Consistency Fix Report

**Date:** 2026-11-05
**Scope:** Shared layout, inventory labels, Review card, member validation, icons — Allocate / Reserve / Transfer on Android + Owner Web.

## 1. Issues identified and corrected

| # | Issue | Fix |
|---|--------|-----|
| 1 | Step 2 (member) had **double horizontal padding** (Screen contentStyle + ScrollView content) while Step 1 had a single gutter | Screen-level list/target padding set to `0`; single `spacing.lg` gutter in scroll content only |
| 2 | Footer used `spacing.xxl` while body used `lg` | Wizard sticky footer overrides to `paddingHorizontal: spacing.lg` |
| 3 | Inventory title showed bare **“A”** | Shared `formatOccupancyInventoryTitle` → **Bed A** (also Room/Unit prefixes when needed) |
| 4 | Review accommodation card overlap / cramped icon+text | Inventory summary uses fixed icon column, `alignItems: 'flex-start'`, wrapping title/path |
| 5 | Member error sat as a large banner above the footer | Inline `selectionError` under member mode chips; cleared on select |
| 6 | Member cards inconsistent | Unified padding, border, selected tint, radio alignment |
| 7 | Review Charges + Payment repeated daily/stay rent | Merged into one Charges Summary with **Total on allocation** |
| 8 | Dates shown as raw ISO | Review dates use `formatMenuDate` |
| 9 | Missing line icons on Review | Tag / ₹ / calendar / shield / food icons on review rows |
| 10 | Missing `memberContext` styles | Added consistent context chip styles |

**Not changed:** pricing rules, APIs, Vacant Beds / Bed Detail, Mess/Tiffin, step sequence.

## 2. Components / files changed

### Android (`K:\AcomiMobile`)
- `src/utils/formatOccupancyInventoryTitle.ts` (+ tests)
- `src/components/occupancy/SelectedInventorySummaryCard.tsx` (+ test)
- `src/features/occupancy/OccupancyWizard/OccupancyWizardScreen.tsx`
- `src/features/occupancy/OccupancyWizard/steps/MemberPickerStep.tsx`
- `src/features/occupancy/OccupancyWizard/steps/ReviewStep.tsx` (+ test update)

### Owner Web (`K:\AcomiWeb`)
- `src/modules/accommodation/utils/formatOccupancyInventoryTitle.ts` (+ tests)
- `src/modules/accommodation/pages/OccupancyWizardPage.tsx` (sidebar + review inventory title)

## 3. Test commands and results

```text
# Android
cd K:\AcomiMobile
npx jest src/utils/__tests__/formatOccupancyInventoryTitle.test.ts \
  src/features/occupancy/OccupancyWizard/__tests__/ReviewStep.shortStaySummary.test.tsx \
  src/components/occupancy/__tests__/OccupancyWizardHeroBanner.test.tsx \
  src/components/occupancy/__tests__/SelectedInventorySummaryCard.test.tsx \
  --no-coverage
```
**Result:** PASS (inventory title + Review + hero; SelectedInventorySummaryCard run next if needed)

```text
# Web
cd K:\AcomiWeb
npx vitest run src/modules/accommodation/utils/__tests__/formatOccupancyInventoryTitle.test.ts \
  src/modules/accommodation/utils/__tests__/occupancyWizardSteps.test.ts --reporter=dot
```
**Result:** PASS — 9 tests

## 4. Remaining / blocked verification

- **Device visual QA** of all five steps was not run in this session (no emulator walkthrough).
- Stepper label wrapping on very narrow devices may still clip mid-words; layout margins are aligned.
- Web review still uses a simpler stack than Android’s iconed charge rows (labels corrected; full icon parity optional follow-up).
