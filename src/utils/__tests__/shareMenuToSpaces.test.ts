import { mealsApi } from '../../api/mealsApi';
import { mapWithConcurrency, shareMenusToSpace } from '../shareMenuToSpaces';

jest.mock('../../api/mealsApi', () => ({
  mealsApi: {
    upsertDailyMenu: jest.fn(),
    publishDailyMenu: jest.fn(),
    openMealPoll: jest.fn(),
    updateFoodItemExtra: jest.fn(),
  },
}));

const validated = {
  ok: true as const,
  optionsByMeal: {
    BREAKFAST: [{ entryType: 'ITEM' as const, itemId: 'i1', label: 'Idli', sortOrder: 1, isAvailable: true }],
    LUNCH: [{ entryType: 'ITEM' as const, itemId: 'i2', label: 'Rice', sortOrder: 1, isAvailable: true }],
  },
  notesByMeal: {},
};

describe('mapWithConcurrency', () => {
  it('keeps order and caps how many spaces run at once', async () => {
    let active = 0;
    let maxActive = 0;
    const results = await mapWithConcurrency([0, 1, 2, 3, 4, 5], 2, async value => {
      active += 1;
      maxActive = Math.max(maxActive, active);
      await new Promise(resolve => setTimeout(resolve, 15));
      active -= 1;
      return value * 2;
    });
    expect(results).toEqual([0, 2, 4, 6, 8, 10]);
    expect(maxActive).toBeLessThanOrEqual(2);
    expect(maxActive).toBeGreaterThan(1);
  });
});

describe('shareMenusToSpace', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (mealsApi.upsertDailyMenu as jest.Mock).mockResolvedValue({});
    (mealsApi.publishDailyMenu as jest.Mock).mockResolvedValue({});
    (mealsApi.openMealPoll as jest.Mock).mockResolvedValue({ status: 'OPEN' });
    (mealsApi.updateFoodItemExtra as jest.Mock).mockResolvedValue({});
  });

  it('writes meals together and opens each poll once', async () => {
    const result = await shareMenusToSpace('space-2', '2026-10-11', ['BREAKFAST', 'LUNCH'], validated);
    expect(mealsApi.upsertDailyMenu).toHaveBeenCalledTimes(2);
    expect(mealsApi.publishDailyMenu).toHaveBeenCalledTimes(2);
    expect(mealsApi.openMealPoll).toHaveBeenCalledTimes(2);
    expect(result.failed).toEqual([]);
    expect(result.opened).toEqual(['BREAKFAST', 'LUNCH']);
  });

  it('does not write or reopen a meal that already opened', async () => {
    const result = await shareMenusToSpace(
      'space-2',
      '2026-10-11',
      ['BREAKFAST', 'LUNCH'],
      validated,
      ['BREAKFAST'],
    );
    expect(mealsApi.upsertDailyMenu).toHaveBeenCalledTimes(1);
    expect(mealsApi.upsertDailyMenu).toHaveBeenCalledWith(
      'space-2',
      '2026-10-11',
      'LUNCH',
      expect.any(Object),
    );
    expect(mealsApi.openMealPoll).toHaveBeenCalledTimes(1);
    expect(mealsApi.openMealPoll).toHaveBeenCalledWith('space-2', '2026-10-11', 'LUNCH');
    expect(result.opened).toEqual(['BREAKFAST', 'LUNCH']);
  });

  it('does not treat a failed destination save as success', async () => {
    (mealsApi.upsertDailyMenu as jest.Mock).mockRejectedValue(
      new Error('Combo is not active'),
    );

    await expect(
      shareMenusToSpace('space-2', '2026-10-11', ['LUNCH'], validated),
    ).rejects.toThrow('Combo is not active');
    expect(mealsApi.publishDailyMenu).not.toHaveBeenCalled();
    expect(mealsApi.openMealPoll).not.toHaveBeenCalled();
  });

  it('turns on missing library extras before saving the menu', async () => {
    const order: string[] = [];
    (mealsApi.updateFoodItemExtra as jest.Mock).mockImplementation(async () => {
      order.push('enable');
      return {};
    });
    (mealsApi.upsertDailyMenu as jest.Mock).mockImplementation(async () => {
      order.push('upsert');
      return {};
    });

    await shareMenusToSpace('mess-b', '2026-10-27', ['BREAKFAST', 'DINNER'], {
      ok: true,
      optionsByMeal: {
        BREAKFAST: [
          {
            entryType: 'PACKAGE',
            itemIds: ['item-bhurji'],
            label: 'Egg Bhurji',
            sortOrder: 1,
            isAvailable: true,
            isExtra: true,
          },
        ],
        DINNER: [
          {
            entryType: 'PACKAGE',
            itemIds: ['item-bhurji'],
            label: 'Egg Bhurji',
            sortOrder: 1,
            isAvailable: true,
            isExtra: true,
          },
        ],
      },
      notesByMeal: {},
      extrasToEnable: ['item-bhurji', 'item-bhurji'],
    });

    expect(mealsApi.updateFoodItemExtra).toHaveBeenCalledTimes(1);
    expect(mealsApi.updateFoodItemExtra).toHaveBeenCalledWith('mess-b', 'item-bhurji', {
      isExtra: true,
    });
    expect(order).toEqual(['enable', 'upsert', 'upsert']);
  });

  it('does not save the menu when enabling the extra fails', async () => {
    (mealsApi.updateFoodItemExtra as jest.Mock).mockRejectedValue(
      new Error('Meal extras are only supported for Mess spaces'),
    );

    await expect(
      shareMenusToSpace('pg-c', '2026-10-27', ['BREAKFAST'], {
        ok: true,
        optionsByMeal: {
          BREAKFAST: [
            {
              entryType: 'PACKAGE',
              itemIds: ['item-bhurji'],
              label: 'Egg Bhurji',
              sortOrder: 1,
              isAvailable: true,
              isExtra: true,
            },
          ],
        },
        notesByMeal: {},
        extrasToEnable: ['item-bhurji'],
      }),
    ).rejects.toThrow('Meal extras are only supported for Mess spaces');
    expect(mealsApi.upsertDailyMenu).not.toHaveBeenCalled();
    expect(mealsApi.publishDailyMenu).not.toHaveBeenCalled();
  });
});
