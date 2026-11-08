# Menu Library items and combos UI redesign

The Menu Library screen was redesigned to match the approved catalogue layout. The existing catalog, APIs, and meal rules are unchanged. Mess and other meal spaces use this same screen. Mess spaces that require meal prices still have the Extras tab, now using the same item rows.

## Files inspected

- `src/screens/meals/MenuLibraryScreen.tsx` and its route in `src/navigation/MainNavigator.tsx`
- `src/hooks/useMenuLibrary.ts`
- `src/utils/fetchSpaceMenuCatalog.ts` and `src/utils/menuCatalogCache.ts`
- `src/api/mealsApi.ts` category, item, combo, and extra methods
- `FoodCategoryResponse`, `FoodItemResponse`, `MealComboResponse`, and `FoodType` in `src/api/types.ts`
- `src/components/meals/library/CategoryChipRail.tsx`
- `src/components/meals/library/ItemChipGrid.tsx`
- `src/components/meals/library/ComboChipRail.tsx`
- `src/components/meals/library/ComboPreviewBar.tsx`
- `src/components/meals/library/InlineChipEditor.tsx`
- `src/components/meals/library/MenuLibraryTabBar.tsx`
- `src/components/meals/MenuLibraryReadyTip.tsx`
- `src/components/meals/ConfigureLibraryExtrasSheet.tsx`
- `src/components/meals/MenuLibraryFilterDrawer.tsx` (not mounted from Menu Library)
- `src/components/ui/HeaderOverflowMenu.tsx`
- `src/components/ui/FoodTypeIcon.tsx` and `FoodTypePicker.tsx`
- `src/components/files/EntityPhoto.tsx`
- Subscription navigation and `meals.subscriptionPlans` copy

## Files changed

- `src/screens/meals/MenuLibraryScreen.tsx`
- `src/hooks/useMenuLibrary.ts`
- `src/components/meals/MenuLibraryReadyTip.tsx`
- `src/components/meals/library/MenuLibraryTabBar.tsx`
- `src/components/meals/library/CategoryChipRail.tsx`
- `src/components/meals/library/MenuChip.tsx`
- `src/components/meals/library/index.ts`
- `src/components/ui/HeaderOverflowMenu.tsx`
- `src/i18n/locales/en.json`
- Ready-tip body only: `src/i18n/locales/hi.json`, `mr.json`, `kn.json`, `te.json`, `ta.json`
- New catalogue components under `src/components/meals/library/`:
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

No database tables, endpoints, DTOs, repositories, or sample-catalog generation were changed.

## Before / after screen structure

Before:

- Decorative "Build your catalog" banner plus the app-bar title.
- Large readiness card with body copy, a full continue button, and "Stay and edit library".
- A single caption such as "13 categories · 69 items".
- Items: category chips, long-press to remove, item chips, tap or long-press for an alert, and a separate remove-category text button.
- Combos: combo chips, long-press for an alert, then a preview bar for the selected combo.
- Meal Subscription Plan as a title row.
- Extras, when enabled, reused the chip grid.

After, both tabs:

- App bar unchanged: back and "Menu Library".
- Summary tiles for items, categories, and combos.
- Compact readiness card, only until dismissed or continued.
- Segmented tabs with counts.
- Catalogue content.
- Meal Subscription Plan card with the existing subtitle and a calendar icon.
- The existing footer hint.

Items tab:

- Categories heading and Manage categories.
- Scrolling chips: All (count) and each category (count), with left/right scroll arrows when the row overflows.
- Item heading with the visible count and Add item.
- One row per item: food-type or photo, name, category, Custom when the item is custom, price when present, overflow menu.

Combos tab:

- All combos (count) and Add combo.
- One card per combo: food-type or photo, name, included items with quantities, description, price, hidden state, overflow menu.
- The selected combo stays highlighted. The first tap selects it. A second tap opens edit, which is the previous chip behavior.

## Functionality-to-UI mapping

| Existing operation | Where it is now | API / behavior |
|---|---|---|
| Load catalog | Screen focus reload | `fetchSpaceMenuCatalog` |
| View all items | All chip, default | `selectedCategoryId === null` |
| Filter by category | Category chip | Same selected-category state |
| Add category | Manage categories, then Add category | `mealsApi.createFoodCategory` |
| Remove category | Manage categories trash, and long-press on a chip | `deactivateFoodCategory` plus the existing global/space confirm |
| Rename category | Not available before | No update-category API. Not added |
| Add item | Add item | `createFoodItem` with name, food type, and category. Choosing All asks for a category first |
| Edit item | Overflow Edit, custom items only. Row tap opens the same menu | `updateFoodItem` with name and food type |
| Remove item | Overflow Remove, then the existing confirm | `deactivateFoodItem`. Confirm copy still differs for custom and global items |
| Item photo | Leading photo control | `EntityPhoto` kind `menuItem` |
| Item price display | Trailing price when `defaultPrice` is set | Display only. Price editing stays in the extras sheet and combo form |
| Food type | Icon on the row, picker in the editor | `VEG`, `NON_VEG`, `EGG` |
| Add combo | Add combo | Navigates to `MealComboForm` create |
| Edit combo | Overflow Edit, or second tap on the selected card | Navigates to `MealComboForm` edit. Same record |
| Remove combo | Overflow Remove, then the existing confirm | `deactivateMealCombo`. Underlying items are not deleted by this call |
| Hide or show combo in this space | Overflow | `setMealComboEnabled` |
| Combo photo | Leading photo control | `EntityPhoto` kind `combo` |
| Included items and quantities | Card subtitle | `formatComboIncludesCompact` |
| Combo price, description, food type | Card meta, detail, and icon | Existing fields |
| Configure extras | Extras tab button | Existing `ConfigureLibraryExtrasSheet` |
| Remove extra | Extras overflow | `updateFoodItemExtra({ isExtra: false })`. The item stays in Items |
| Edit extra item | Extras overflow Edit for custom items | Same item update |
| Continue to menu planning | Readiness card | `MenuPlanning`. Also dismisses the card |
| Dismiss readiness | Close icon | AsyncStorage `@acomi/menu-library-ready-tip:{spaceId}`. Data is not deleted |
| Meal Subscription Plan | Card under the catalogue | `SubscriptionPlans`. Logic not changed |
| Empty catalog hint | Banner when there are no items | Existing seed copy |
| API failure | Banner | Existing backend-pending copy |
| Loading | Spinner, counts hidden | Existing loading flag |
| No meal permission | Permission denied screen | Unchanged |
| Viewer without manage rights | Catalogue without add, manage, or overflow | Unchanged permission checks |

Not present on this screen before the redesign, and still not present: item search, sort, duplicate, reorder, bulk actions, and an item availability toggle. `MenuLibraryFilterDrawer` is unused by this screen and was left as-is.

The old item grid stopped at 32 chips and offered "Show all". The new list renders every active item in the current filter, so that extra tap is no longer required.

## CRUD verification

Automated tests rendered the screen with fixture catalog data and checked that the controls are wired:

- Items and Combos counts match the fixture (4 items, 4 categories, 3 combos).
- All shows every item. Rice shows only Plain Rice. Breakfast shows the empty-category message and does not remove the other items.
- Returning to All restores Chapati and Chicken Curry.
- Custom Chapati offers Edit and Remove. Global Plain Rice offers Remove only.
- Chicken Thali offers Edit, Hide in this space, and Remove, and shows `2 Chapati · Chicken Curry · Plain Rice`.
- Egg Thali shows "Hidden in this space".
- Selecting Egg Thali, leaving the tab, and tapping it again opens `MealComboForm` in edit mode for that combo id.
- Manage categories shows Add category and a remove control for each category, including an empty one.
- Extras tab shows Chapati and "Remove extra", then Items still shows the full catalogue.
- A long item name and a long combo name are present on their rows, which wrap at two lines.

The delete confirms, create calls, and update calls were not executed against a live backend in this session. The handlers still call the same `mealsApi` functions as before.

## Responsive results

Checked in the rendered layout, not on a device:

- Summary tiles use `flex: 1` and `minWidth: 0`, so three counts share the width.
- Tabs shrink their labels (`adjustsFontSizeToFit`, minimum scale 0.7) and include the mess Extras tab when pricing requires it.
- Category chips stay in `ScrollableChipRail`, which shows chevrons when the row overflows.
- Item and combo titles use two lines. Included combo items use up to three lines.
- The category sheet list is capped at 320dp so many categories scroll.
- Add and manage actions stay on the section row and do not shrink away.

A physical narrow-phone pass and a wide-phone pass were not run.

## API integration

Confirmed by inspection, not by a live call:

- `getFoodCategories`, `getFoodItems`, and `getMealCombos` still load through `fetchSpaceMenuCatalog`.
- Create and update payloads are unchanged: category `{ name }`; item `{ categoryId, name, foodType, isExtra? }`; item update `{ name, foodType }`.
- Deactivate category, item, and combo, combo enablement, and extra flag updates are the same functions.
- Combo form navigation still passes `{ spaceId, mode, comboId }`.
- No local or mock catalog replaced the API. Tests mock the hook only inside the test file.

## Regression results

Command:

`npx jest src/screens/meals/__tests__/MenuLibraryScreen.catalogue.test.tsx src/hooks/__tests__/useMenuLibrary.selection.test.ts --no-coverage`

Result: 2 suites passed, 12 tests passed, 0 failed.

Covered states: Items selected, Combos selected, several categories, an empty category, an empty library, the sample-style library fixture, long names, the readiness card visible, the readiness card dismissed, loading without a misleading zero count, tab changes without losing the category filter or the selected combo, mess Extras, and category management.

Not covered by an automated test: creating a record through the inline editor, the native confirm dialog, photo upload, or menu-planning behavior after Continue.

## Screenshots

Device screenshots of the installed app were not captured. No Android device or emulator session was available here. The catalogue test is the verification of the Items and Combos trees, including counts, chip labels, row text, overflow actions, the readiness card, and the subscription card.

## What could not be preserved as a separate control

- "Stay and edit library" was removed. The close icon dismisses the card and leaves the owner on the library, which is what that button did.
- The separate combo preview bar was removed. Each combo card now shows the included items that the preview bar showed for the selected combo only.
- The app-bar three-dot control from the mockup was not added. This screen's navigator options had no overflow actions to keep.
- Category rename was not added because the app has no category update API.

## Web

The same catalogue layout is now on the web Menu Library (`AcomiWeb` `MenuLibraryPage`): counted summary tiles, a short dismissible readiness card, Items/Combos/Extras tabs with live counts, category chips with counts, Manage categories, explicit Add item and Add combo labels, and a Meal Subscription Plan card that opens the existing plans route. Search, food-type filter, table and cards, pagination, refresh, photos, extras configuration, and the existing create, edit, hide, and remove dialogs stay wired.

Web check: `node scripts/check-menu-library-catalogue.mjs` from `AcomiWeb`. It passed, and the mobile Jest command above still passes (2 suites, 12 tests). The app and the web dev server were not started.

## Pending

- Run the screen on a narrow Android device and capture Items and Combos screenshots.
- Exercise add, edit, and remove for an item, a category, and a combo against the running API, including a combo that references items, and confirm the items remain after the combo is removed.
- Confirm a previously dismissed readiness card stays dismissed after an app restart on a device. The storage key is unchanged.
