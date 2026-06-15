# CountIn Phase 5 — Meal Management (Backend Implementation)

Aligned with the React Native contract in `docs/meals-phase-5-ui-integration.md`.

## Migrations (`src/main/resources/db/migration/meal/`)

| Version | Description |
|---------|-------------|
| V34 | `meal_plans` catalog |
| V35 | `meal_participations` + `meal_participation_history` |
| V36 | Legacy `meal_items`, `meal_combos`, `meal_combo_items` |
| V37 | `daily_menus`, `daily_menu_options` |
| V38 | Backfill participations from food-enabled occupancies |
| **V39** | **Food catalog:** `food_categories`, `food_items`, `space_food_item_settings` |
| **V40** | **Global seed:** 12 categories, 62 items (fixed UUIDs for sample combos) |
| **V41** | Drop legacy `meal_items`; link `meal_combo_items` → `food_items` |
| **V42** | Rename `daily_menu_options` → `daily_menu_entries` (+ `entry_type`, `item_id`) |
| **V43** | Idempotent global catalog repair + backfill MESS sample combos |
| **V44** | `space_food_category_settings` for per-space global category hide |
| **V45** | Backfill sample combos for all active spaces with none |

## Phase 5.1 — Menu library

### Global catalog (platform, read-only)
- 12 categories: Breads, Rice, Dal, Sabzi, Breakfast, Paratha, South Indian, Snacks, Beverages, Desserts, Salads, Extras
- 62 seeded global items (see `V40__seed_global_food_catalog.sql`)

### Space catalog
- Custom items (`scope=SPACE`, `isCustom=true`)
- Custom categories (`scope=SPACE`)
- Global item hide via `space_food_item_settings.is_enabled=false`

### Sample combo seeding (all space types)
On space create and on first `GET /food-categories` or `GET /meal-combos` when a space has no active combos, seeds sample combos when the global catalog exists (Flyway V45 backfills existing spaces):
- Standard Lunch Thali (Chapati, Dal Fry, Plain Rice, Green Salad)
- Dal Rice Combo (Dal Fry, Plain Rice)

## API endpoints

Base: `/api/v1/spaces/{spaceId}` — all use `ApiResponse<T>` envelope.

### Food catalog (Phase 5.1)
| Method | Path |
|--------|------|
| GET | `/food-categories` |
| POST | `/food-categories` |
| POST | `/food-categories/{categoryId}/deactivate` | 204 No Content |
| GET | `/food-items?categoryId=` |
| POST | `/food-items` |
| PUT | `/food-items/{itemId}` |
| POST | `/food-items/{itemId}/deactivate` | 204 No Content |

### Meal combos
| Method | Path |
|--------|------|
| GET/POST | `/meal-combos` |
| PUT | `/meal-combos/{comboId}` |
| POST | `/meal-combos/{comboId}/deactivate` | 204 No Content |

Create body uses `itemIds[]` (library) and/or `newItems[]` (inline add-from-combo-form):

```json
{
  "name": "Sunday Special",
  "description": "Optional",
  "itemIds": ["existing-chapati-uuid"],
  "newItems": [{ "categoryId": "uuid", "name": "Mess Special Dal" }]
}
```

At least one of `itemIds` or `newItems` required.

### Daily menus (Phase 5.2)
| Method | Path |
|--------|------|
| GET | `/daily-menus/today`, `/daily-menus?from=&to=`, `/daily-menus/{date}/{mealType}` |
| PUT | `/daily-menus/{date}/{mealType}` |
| POST | `/daily-menus/{date}/{mealType}/publish` |
| DELETE | `/daily-menus/{date}/{mealType}` |

Upsert accepts frontend `options[]` with `comboId`, `itemId`, `label`, `sortOrder`, `isAvailable`. GET returns `entryType`, `comboId`, `itemId` for round-trip.

DELETE draft menu returns **204 No Content** (matches frontend `unwrapVoidResponse`).

### Participation (Phase 5.3)
| Method | Path |
|--------|------|
| GET/POST/PUT | `/meal-plans`, `/meal-participations` |
| POST | `/meal-participations/{id}/pause\|resume\|stop` |
| GET | `/members/{memberId}/meal-participation` |

### Eligibility (Phase 5.4)
| Method | Path |
|--------|------|
| GET | `/meals/eligibility-summary?date=` — slots include `eligibleCount`, `pausedCount`, `published`, `byPlan[]` |
| GET | `/meals/eligible-participants?date=&mealType=` — `{ memberId, memberName, mobileNumber, mealPlanCode, mealPlanName }` |

### Member extension
`GET /members/{memberId}` includes nullable `mealParticipation` block.

## Response field names (frontend contract)

| Resource | Key fields |
|----------|------------|
| FoodCategory | `categoryId`, `itemCount`, `scope`, `isActive` |
| FoodItem | `itemId`, `categoryId`, `categoryName`, `isCustom`, `isActive` |
| MealCombo | `comboId`, `scope`, `isActive`, `items[].itemId`, `items[].name` |
| MealPlan | `mealPlanId`, `isActive` |
| Participation | `participationId`, `memberRole`, `mealPlanCode` |
| DailyMenu | `dailyMenuId`, `options[].optionId` |

## Permissions (`GET /spaces/my`)

`canManageMeals`, `canViewMeals`, `canManageMealParticipation`, `canViewOwnMealParticipation`

## Occupancy bridge (Phase 5.5)

- `createMealParticipation` on move-in/allocate when food enabled
- Vacate stops ACTIVE participation
- V38 backfill for existing occupancies

## Out of scope

Entitlements, credits, polls, MealResponse, WhatsApp, weekly templates, menu history, headcount from subscriptions.

## Tests

- `FoodCatalogServiceTest` — categories, custom items, global deactivate, STAFF denied
- `MealAccessServiceTest`, `MealEligibilityEngineTest`
- `SpacePermissionPolicyTest` — meal permission flags
