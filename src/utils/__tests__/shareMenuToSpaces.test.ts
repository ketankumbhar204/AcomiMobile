import { mealsApi } from '../../api/mealsApi';
import { mapWithConcurrency, shareMenusToSpace } from '../shareMenuToSpaces';

jest.mock('../../api/mealsApi', () => ({
  mealsApi: {
    upsertDailyMenu: jest.fn(),
    publishDailyMenu: jest.fn(),
    openMealPoll: jest.fn(),
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
});
