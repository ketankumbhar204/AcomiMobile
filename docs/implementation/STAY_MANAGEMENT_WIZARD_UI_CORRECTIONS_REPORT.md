# Stay Management Wizard UI/UX Corrections Report

**Date:** 2026-11-05
**Scope:** Android + Owner Web Stay Management wizard (Allocate / Reserve / Transfer).
**Reference:** Annotated device screenshots (compact banner, alignment, hierarchy repetition).

## 1. Issues identified and root causes

| Issue | Root cause |
|-------|------------|
| Tall page banner (icon above title) | Hero used default column layout + `marginBottom` under the icon |
| Stepper wider/narrower than content | `OccupancyWizardStepHeader` added `paddingHorizontal: spacing.xl` while page used `spacing.lg`; list steps had **no** shared horizontal gutter |
| Full Space/Type/Building… hierarchy on Review | Review used `HierarchyBreadcrumbCard` row list |
| Tenant strip + member card duplication | `showMemberContext` rendered name/mobile above stepper on every post-member step |
| Stale checkout / field errors | Some `onChange` paths did not clear `expectedExitError` / `formError` when a valid value was set |

## 2. Files changed

### Android (`K:\AcomiMobile`)

| File | Change |
|------|--------|
| `OccupancyWizardHeroBanner.tsx` | **New** compact single-row `[icon] title` banner |
| `OccupancyWizardScreen.tsx` | Uses hero banner; shared `spacing.lg` gutter on form + list scroll; disabled tenant strip; clears date/form errors on change |
| `OccupancyWizardStepHeader.tsx` | `paddingHorizontal: 0` (page owns gutter); export styles for regression |
| `SelectedInventorySummaryCard.tsx` | `embedded` mode for Review nesting |
| `ReviewStep.tsx` | Compact inventory summary instead of full hierarchy rows |
| Tests | Hero row layout; step-header gutter; checkout error clearing |

### Owner Web (`K:\AcomiWeb`)

| File | Change |
|------|--------|
| `OccupancyWizardPage.tsx` | Removed redundant step-progress description under header; stepper width/padding aligned to card; checkout errors clear on change |

### Backend

None (UI/layout/validation-clearing only).

## 3. Tests executed

| Suite | Result |
|-------|--------|
| Android Jest (hero, step-header alignment, checkout clearing, ShortStayChoice, ReviewStep, shortStay, steps) | **32 passed / 7 suites** |
| Owner Web Vitest `src/modules/accommodation/utils` | **99 passed / 4 files** |
| Backend | Not required for this pass |
| Device / browser visual QA | **Not performed** |

## 4. Remaining visual / functional notes

- Reload Metro / reopen wizard to pick up JS layout changes on device.
- Member list card chrome (avatars/status pills) unchanged beyond alignment.
- Sticky footer behaviour unchanged (already used `StickyFormActions` / Web `StickyFooter`).
- Short Stay daily-rate pricing rules unchanged in this pass.

## 5. Confirmations

- **Mess/Tiffin:** untouched
- **Vacant Beds → Bed Detail → Allocate:** untouched
- **Pricing / API contracts:** unchanged in this correction pass
- **Visual QA on device/browser:** not claimed complete
