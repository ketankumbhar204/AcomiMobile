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

  const lunchWithExtra: DailyMenuResponse = {
    menuDate: '2026-10-26',
    mealType: 'LUNCH',
    status: 'PUBLISHED',
    options: [
      {
        entryType: 'COMBO',
        comboId: 'combo-1',
        label: 'Chicken Thali',
        sortOrder: 1,
        isAvailable: true,
      },
      {
        entryType: 'PACKAGE',
        label: 'Papad',
        sortOrder: 2,
        isAvailable: true,
        isExtra: true,
        itemIds: undefined,
        packageItems: [{ itemId: 'item-papad', name: 'Papad' }],
      },
    ],
  };

  it('keeps extras when the destination is a mess', async () => {
    jest.mocked(mealsApi.getMealCombos).mockResolvedValue([
      { comboId: 'combo-1', name: 'Chicken Thali', isActive: true, enabledForSpace: true },
    ]);
    jest.mocked(mealsApi.getFoodItems).mockResolvedValue([
      { itemId: 'item-papad', name: 'Papad', isActive: true },
    ]);

    const result = await validateShareMenusToSpace(
      { LUNCH: lunchWithExtra },
      ['LUNCH'],
      space({
        spaceId: 'mess-b',
        spaceName: 'E2E Mess',
        spaceType: 'MESS',
        ownerId: 'owner-a',
      }),
      space({ spaceId: 'mess-a', spaceName: 'Source Mess', spaceType: 'MESS', ownerId: 'owner-a' }),
    );

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.optionsByMeal.LUNCH?.map(option => option.label)).toEqual([
        'Chicken Thali',
        'Papad',
      ]);
      expect(result.optionsByMeal.LUNCH?.[1]).toMatchObject({
        entryType: 'PACKAGE',
        isExtra: true,
        itemIds: ['item-papad'],
      });
      expect(result.skippedExtras).toBeUndefined();
      expect(result.extrasToEnable).toEqual(['item-papad']);
    }
  });

  it('does not enable an extra the destination mess already has', async () => {
    jest.mocked(mealsApi.getMealCombos).mockResolvedValue([
      { comboId: 'combo-1', name: 'Chicken Thali', isActive: true, enabledForSpace: true },
    ]);
    jest.mocked(mealsApi.getFoodItems).mockResolvedValue([
      { itemId: 'item-papad', name: 'Papad', isActive: true, isExtra: true },
    ]);

    const result = await validateShareMenusToSpace(
      { LUNCH: lunchWithExtra },
      ['LUNCH'],
      space({
        spaceId: 'mess-b',
        spaceName: 'E2E Mess',
        spaceType: 'MESS',
        ownerId: 'owner-a',
      }),
      space({ spaceId: 'mess-a', spaceName: 'Source Mess', spaceType: 'MESS', ownerId: 'owner-a' }),
    );

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.optionsByMeal.LUNCH?.[1]).toMatchObject({ isExtra: true, itemIds: ['item-papad'] });
      expect(result.extrasToEnable).toBeUndefined();
    }
  });

  it('enables only the extras this mess has not turned on, once per item', async () => {
    const breakfast: DailyMenuResponse = {
      menuDate: '2026-10-27',
      mealType: 'BREAKFAST',
      status: 'PUBLISHED',
      options: [
        {
          entryType: 'PACKAGE',
          label: 'Egg Bhurji',
          sortOrder: 1,
          isAvailable: true,
          isExtra: true,
          packageItems: [{ itemId: 'item-bhurji', name: 'Egg Bhurji' }],
        },
        {
          entryType: 'PACKAGE',
          label: 'Idli',
          sortOrder: 2,
          isAvailable: true,
          isExtra: false,
          packageItems: [{ itemId: 'item-idli', name: 'Idli' }],
        },
      ],
    };
    const dinnerWithSameExtra: DailyMenuResponse = {
      ...lunchWithExtra,
      mealType: 'DINNER',
      options: [
        ...(lunchWithExtra.options ?? []),
        {
          entryType: 'PACKAGE',
          label: 'Egg Bhurji',
          sortOrder: 3,
          isAvailable: true,
          isExtra: true,
          packageItems: [{ itemId: 'item-bhurji', name: 'Egg Bhurji' }],
        },
      ],
    };
    jest.mocked(mealsApi.getMealCombos).mockResolvedValue([
      { comboId: 'combo-1', name: 'Chicken Thali', isActive: true, enabledForSpace: true },
    ]);
    jest.mocked(mealsApi.getFoodItems).mockResolvedValue([
      { itemId: 'item-papad', name: 'Papad', isActive: true, isExtra: true },
      { itemId: 'item-bhurji', name: 'Egg Bhurji', isActive: true, isExtra: false },
      { itemId: 'item-idli', name: 'Idli', isActive: true, isExtra: false },
    ]);

    const result = await validateShareMenusToSpace(
      { BREAKFAST: breakfast, DINNER: dinnerWithSameExtra },
      ['BREAKFAST', 'DINNER'],
      space({
        spaceId: 'mess-b',
        spaceName: 'PGA Mess',
        spaceType: 'MESS',
        ownerId: 'owner-a',
      }),
      space({
        spaceId: 'mess-a',
        spaceName: 'E2E Mess 38096',
        spaceType: 'MESS',
        ownerId: 'owner-a',
      }),
    );

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.extrasToEnable).toEqual(['item-bhurji']);
      expect(result.optionsByMeal.BREAKFAST?.find(option => option.label === 'Idli')).toMatchObject({
        isExtra: false,
      });
      expect(result.optionsByMeal.DINNER?.filter(option => option.isExtra)).toHaveLength(2);
    }
  });

  it('omits extras for a non-mess destination and still shares the meal', async () => {
    jest.mocked(mealsApi.getMealCombos).mockResolvedValue([
      { comboId: 'combo-1', name: 'Chicken Thali', isActive: true, enabledForSpace: true },
    ]);
    jest.mocked(mealsApi.getFoodItems).mockResolvedValue([]);

    const result = await validateShareMenusToSpace(
      { LUNCH: lunchWithExtra },
      ['LUNCH'],
      space({
        spaceId: 'pg-c',
        spaceName: 'E2E PG',
        spaceType: 'PG',
        ownerId: 'owner-a',
      }),
      space({ spaceId: 'mess-a', spaceName: 'Source Mess', spaceType: 'MESS', ownerId: 'owner-a' }),
    );

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.optionsByMeal.LUNCH?.map(option => option.label)).toEqual(['Chicken Thali']);
      expect(result.optionsByMeal.LUNCH?.some(option => option.isExtra)).toBe(false);
      expect(result.skippedExtras).toEqual(['Papad']);
      expect(result.extrasToEnable).toBeUndefined();
    }
  });

  it('omits extras for every non-mess type when all spaces are selected', async () => {
    jest.mocked(mealsApi.getMealCombos).mockResolvedValue([
      { comboId: 'combo-1', name: 'Chicken Thali', isActive: true, enabledForSpace: true },
    ]);
    jest.mocked(mealsApi.getFoodItems).mockResolvedValue([
      { itemId: 'item-papad', name: 'Papad', isActive: true },
    ]);

    const source = space({
      spaceId: 'mess-a',
      spaceName: 'Source Mess',
      spaceType: 'MESS',
      ownerId: 'owner-a',
    });
    const destinations = [
      space({ spaceId: 'mess-b', spaceName: 'Mess B', spaceType: 'MESS', ownerId: 'owner-a' }),
      space({ spaceId: 'pg-c', spaceName: 'PG C', spaceType: 'PG', ownerId: 'owner-a' }),
      space({ spaceId: 'co-d', spaceName: 'Co-living D', spaceType: 'CO_LIVING', ownerId: 'owner-a' }),
      space({ spaceId: 'hostel-e', spaceName: 'Hostel E', spaceType: 'HOSTEL', ownerId: 'owner-a' }),
    ];

    const results = await Promise.all(
      destinations.map(target =>
        validateShareMenusToSpace({ LUNCH: lunchWithExtra }, ['LUNCH'], target, source),
      ),
    );

    expect(results.every(result => result.ok)).toBe(true);
    const mess = results[0];
    const others = results.slice(1);
    if (mess.ok) {
      expect(mess.optionsByMeal.LUNCH?.some(option => option.isExtra)).toBe(true);
      expect(mess.extrasToEnable).toEqual(['item-papad']);
    }
    for (const result of others) {
      if (result.ok) {
        expect(result.optionsByMeal.LUNCH?.some(option => option.isExtra)).toBe(false);
        expect(result.skippedExtras).toEqual(['Papad']);
        expect(result.extrasToEnable).toBeUndefined();
      }
    }
  });
});
