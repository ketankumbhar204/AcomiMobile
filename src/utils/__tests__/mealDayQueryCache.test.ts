import {
  fetchDailyMenusByDateCached,
  resetMealDayQueryCacheForTests,
} from '../mealDayQueryCache';

jest.mock('../../api/mealsApi', () => ({
  mealsApi: {
    getDailyMenusByDate: jest.fn(),
    getMealPolls: jest.fn(),
    getEligibilitySummary: jest.fn(),
    getMealHeadcountDay: jest.fn(),
  },
}));

import { mealsApi } from '../../api/mealsApi';

describe('mealDayQueryCache', () => {
  beforeEach(() => {
    resetMealDayQueryCacheForTests();
    jest.clearAllMocks();
    (mealsApi.getDailyMenusByDate as jest.Mock).mockResolvedValue([]);
  });

  it('dedupes concurrent identical daily-menu fetches', async () => {
    const [a, b] = await Promise.all([
      fetchDailyMenusByDateCached('space-1', '2026-07-10'),
      fetchDailyMenusByDateCached('space-1', '2026-07-10'),
    ]);

    expect(a).toEqual([]);
    expect(b).toEqual([]);
    expect(mealsApi.getDailyMenusByDate).toHaveBeenCalledTimes(1);
  });
});
