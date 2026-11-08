# Menu Library UX redesign

The Menu Library screen is now a compact catalogue. The decorative setup banner is gone. Items and Combos share one summary, one readiness notice, and one row pattern. Mess spaces that use meal extras get the same row pattern on the Extras tab. The screen is still the single Menu Library used by mess and other meal spaces.

## Files inspected

- `src/screens/meals/MenuLibraryScreen.tsx`
- `src/hooks/useMenuLibrary.ts`
- `src/utils/fetchSpaceMenuCatalog.ts`
- `src/api/mealsApi.ts` and food category, item, and combo types in `src/api/types.ts`
- `src/components/meals/library/` (chips, rails, item grid, combo rail, combo preview)
- `src/components/meals/MenuLibraryReadyTip.tsx`
- `src/components/meals/ConfigureLibraryExtrasSheet.tsx`
- `src/components/meals/MenuLibraryFilterDrawer.tsx` (present, not mounted by this screen)
- `src/navigation/MainNavigator.tsx` Menu Library route
- Meal Subscription Plan copy in `src/i18n/locales/en.json`

## Files changed

- `src/screens/meals/MenuLibraryScreen.tsx`
- `src/hooks/useMenuLibrary.ts`
- `src/components/meals/MenuLibraryReadyTip.tsx`
- `src/components/meals/library/MenuLibraryTabBar.tsx`
- `src/components/meals/library/CategoryChipRail.tsx`
- `src/components/meals/library/MenuChip.tsx`
- `src/components/meals/library/index.ts`
- `src/components/ui/HeaderOverflowMenu.tsx`
- `src/i18n/locales/en.json` and the same ready-tip sentence in `hi`, `mr`, `kn`, `te`, `ta`
- New catalogue pieces under `src/components/meals/library/`:
  - `LibrarySummaryStrip.tsx`
  - `LibrarySectionHeader.tsx`
  - `LibraryCatalogRow.tsx`
  - `LibraryItemEditor.tsx`
  - `LibraryItemSection.tsx`
  - `LibraryComboSection.tsx`
  - `LibraryManageCategoriesSheet.tsx`
- Tests:
  - `src/screens/meals/__tests__/MenuLibraryScreen.catalogue.test.tsx`
  - `src/hooks/__tests__/useMenuLibrary.selection.test.ts`

`ItemChipGrid`, `ComboChipRail`, and `ComboPreviewBar` are still in the library folder. The Menu Library screen no longer composes them. Combo creation and editing still open the existing `MealComboForm` screen.

## Before / after

Before:

1. Large “Build your catalog / Menu library” banner.
2. Large “Your menu library is ready” card with a second stay action.
3. A text count line that changed with the tab.
4. Items and Combos as chips. Important actions depended on tap or long-press.
5. Combos used a second preview card under the chip rail.
6. Meal Subscription Plan was a title-only row.

After:

1. The navigator app bar stays “Menu Library”, with the existing back control. This screen had no app-bar overflow actions, so none were added.
2. Three compact counts: items, categories, combos. Values come from the loaded catalog. They are hidden while the catalog is still loading.
3. A short dismissible readiness card: success icon, “Your menu library is ready”, “Edit your items and combos anytime.”, and “Continue to menu planning”.
4. Items (count) and Combos (count). Mess spaces that require meal prices also keep Extras (count).
5. Items: Categories, Manage categories, horizontally scrolling chips including All, then the item list and Add item.
6. Combos: All combos, Add combo, and one card per combo with included items.
7. Meal Subscription Plan stays under the catalogue as its own navigation card.

## Components reused or created

Reused: `Screen`, `CategoryChipRail`, `ScrollableChipRail`, `MenuChip`, `InlineChipEditor`, `FoodTypePicker`, `FoodTypeIcon`, `EntityPhoto`, `DashboardActionRow`, `EmptyState`, `HeaderOverflowMenu`, `ConfigureLibraryExtrasSheet`, and the existing confirm alerts.

Created: the summary strip, section header, catalogue row, item editor, item section, combo section, and category management sheet.

`HeaderOverflowMenu` now accepts an optional icon and an inline trigger so item and combo rows can open the same popup used elsewhere. Existing header menus that do not pass an icon are unchanged.

## Existing functionality preserved

- Catalog load, reload on focus, and in-memory item patch still go through `useMenuLibrary` and `fetchSpaceMenuCatalog`.
- Category create and deactivate, item create, update, and deactivate, combo create, update, deactivate, and show/hide in this space still call the same `mealsApi` methods with the same payloads.
- Custom items can be renamed and have their food type changed. Global items can be hidden for the space, not renamed.
- Category removal still uses the global versus space confirmation copy.
- Item and combo photos still use `EntityPhoto`.
- Prices, food-type icons, combo quantities, combo descriptions, and “Hidden in this space” still render from the existing fields.
- The readiness card still stores dismissal per space in AsyncStorage at `@acomi/menu-library-ready-tip:{spaceId}`. Dismiss and Continue do not delete catalog data. Continue still opens Menu Planning and dismisses the card.
- Empty catalog, API failure, loading, empty category, empty combos, and permission denied remain.
- Meal Subscription Plan still navigates to `SubscriptionPlans`. Its business logic was not changed.
- Mess extras still use `ConfigureLibraryExtrasSheet`. Removing an extra still clears `isExtra` and leaves the item in Items.

There is no category rename in the current API or screen, so none was added. Item search, sort, duplicate, reorder, and bulk actions are not part of this screen. Item price editing remains in the extras sheet and the combo form, which already owned it.

Selecting All is now the default. A chosen category or combo stays selected when the owner switches tabs. Removing a category that was selected returns to All.

## Tests

`npx jest src/screens/meals/__tests__/MenuLibraryScreen.catalogue.test.tsx src/hooks/__tests__/useMenuLibrary.selection.test.ts --no-coverage`

Result: 2 suites passed, 12 tests passed.

Covered:

- Items view with live counts, All, category counts including zero, long item names, custom versus global overflow actions, readiness copy, and the subscription card.
- Category filter, Combos view with included item names, hidden combo status, long combo names, and edit/hide/remove actions.
- The category filter and the selected combo survive a tab change. A second tap on the selected combo opens the existing edit form.
- Empty category, dismissed readiness card, loading without zero counts, and an empty library.
- Mess Extras tab uses the same item row and “Remove extra”.
- Manage categories exposes add and remove.
- All-versus-specific category selection rules.

## Screenshots

A running Android device was not available in this session, so device screenshots were not captured. The catalogue test rendered both tabs and checked the visible copy, counts, rows, and actions.

## Outstanding

- Live API create, edit, and delete were not executed against a running backend. The screen still calls the existing API functions.
- Visual pass on a physical narrow phone was not done. Counts use flexible tiles, category chips scroll, and long names use two lines.
- The old chip-grid “Show all” cap is gone. The list shows every active item in the selected filter.
