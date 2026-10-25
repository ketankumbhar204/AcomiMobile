import type { DailyMenuResponse, MySpaceResponse } from '../../api/types';
import { mealsApi } from '../../api/mealsApi';
import { validateShareMenusToSpace } from '../shareMenuToSpaces';

jest.mock('../../api/mealsApi', () => ({
  mealsApi: {
    getMealCombos: jest.fn(),
    getFoodItems: jest.fn(),
  },
}));

function space(partial: Partial<MySpaceResponse> & Pick<MySpaceResponse, 'spaceId' | 'spaceName'>): MySpaceResponse {
  return {
    spaceType: 'PG',
    membershipRole: 'OWNER',
    isDefault: false,
    joinedAt: '2026-01-01',
    ...partial,
  };
}

const dinner: DailyMenuResponse = {
  menuDate: '2026-10-19',
  mealType: 'DINNER',
  status: 'DRAFT',
  options: [
    {
      entryType: 'COMBO',
      comboId: 'combo-1',
      label: 'Combo 1 test',
      sortOrder: 0,
      isAvailable: true,
    },
  ],
};

describe('validateShareMenusToSpace', () => {
  beforeEach(() => {
    jest.mocked(mealsApi.getMealCombos).mockReset();
    jest.mocked(mealsApi.getFoodItems).mockReset();
  });

  it('blocks a space owned by someone else', async () => {
    const result = await validateShareMenusToSpace(
      { DINNER: dinner },
      ['DINNER'],
      space({ spaceId: 'target', spaceName: 'E2E Empty Probe', ownerId: 'owner-b' }),
      space({ spaceId: 'source', spaceName: 'Sunrise PG', ownerId: 'owner-a' }),
    );

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.reason).toBe('cross-owner');
      expect(result.spaceName).toBe('E2E Empty Probe');
    }
    expect(mealsApi.getMealCombos).not.toHaveBeenCalled();
  });

  it('keeps the same combo id for another space of the same owner', async () => {
    jest.mocked(mealsApi.getMealCombos).mockResolvedValue([
      {
        comboId: 'combo-1',
        name: 'Combo 1 test',
        isActive: true,
        enabledForSpace: true,
      },
    ]);
    jest.mocked(mealsApi.getFoodItems).mockResolvedValue([]);

    const result = await validateShareMenusToSpace(
      { DINNER: dinner },
      ['DINNER'],
      space({ spaceId: 'target', spaceName: 'E2E CO_LIVING', ownerId: 'owner-a' }),
      space({ spaceId: 'source', spaceName: 'Sunrise PG', ownerId: 'owner-a' }),
    );

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.optionsByMeal.DINNER?.[0]?.comboId).toBe('combo-1');
    }
  });

  it('rejects a combo hidden in the target space', async () => {
    jest.mocked(mealsApi.getMealCombos).mockResolvedValue([
      {
        comboId: 'combo-1',
        name: 'Combo 1 test',
        isActive: true,
        enabledForSpace: false,
      },
    ]);
    jest.mocked(mealsApi.getFoodItems).mockResolvedValue([]);

    const result = await validateShareMenusToSpace(
      { DINNER: dinner },
      ['DINNER'],
      space({ spaceId: 'target', spaceName: 'E2E CO_LIVING', ownerId: 'owner-a' }),
      space({ spaceId: 'source', spaceName: 'Sunrise PG', ownerId: 'owner-a' }),
    );

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.reason).toBe('hidden');
      expect(result.missingLabels).toEqual(['Combo 1 test']);
    }
  });
});
