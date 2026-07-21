import type {
  DailyMenuResponse,
  FoodItemResponse,
  MealComboResponse,
  MySpaceResponse,
} from '../../api/types';
import { mealsApi } from '../../api/mealsApi';
import { validateShareMenusToSpace } from '../shareMenuToSpaces';

jest.mock('../../api/mealsApi', () => ({
  mealsApi: {
    getMealCombos: jest.fn(),
    getFoodItems: jest.fn(),
    upsertDailyMenu: jest.fn(),
    publishDailyMenu: jest.fn(),
  },
}));

const targetSpace: MySpaceResponse = {
  spaceId: 'target',
  spaceName: 'Mess B',
  spaceType: 'MESS',
  membershipRole: 'OWNER',
  isDefault: false,
  joinedAt: '2026-01-01',
};

describe('validateShareMenusToSpace', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('maps combos by name and succeeds', async () => {
    (mealsApi.getMealCombos as jest.Mock).mockResolvedValue([
      { comboId: 'c2', name: 'Dal Rice', isActive: true },
    ] as MealComboResponse[]);
    (mealsApi.getFoodItems as jest.Mock).mockResolvedValue([] as FoodItemResponse[]);

    const sourceMenus = {
      LUNCH: {
        mealType: 'LUNCH',
        status: 'DRAFT',
        menuDate: '2026-07-18',
        options: [
          {
            entryType: 'COMBO',
            comboId: 'c1',
            label: 'Dal Rice',
            sortOrder: 1,
            isAvailable: true,
          },
        ],
      } as DailyMenuResponse,
    };

    const result = await validateShareMenusToSpace(sourceMenus, ['LUNCH'], targetSpace);
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.optionsByMeal.LUNCH?.[0]).toMatchObject({
        entryType: 'COMBO',
        comboId: 'c2',
        label: 'Dal Rice',
      });
    }
  });

  it('fails when a combo is missing in the target library', async () => {
    (mealsApi.getMealCombos as jest.Mock).mockResolvedValue([] as MealComboResponse[]);
    (mealsApi.getFoodItems as jest.Mock).mockResolvedValue([] as FoodItemResponse[]);

    const sourceMenus = {
      BREAKFAST: {
        mealType: 'BREAKFAST',
        status: 'DRAFT',
        menuDate: '2026-07-18',
        options: [
          {
            entryType: 'COMBO',
            label: 'Idli Plate',
            sortOrder: 1,
            isAvailable: true,
          },
        ],
      } as DailyMenuResponse,
    };

    const result = await validateShareMenusToSpace(sourceMenus, ['BREAKFAST'], targetSpace);
    expect(result).toMatchObject({
      ok: false,
      spaceName: 'Mess B',
      missingLabels: ['Idli Plate'],
    });
  });
});
