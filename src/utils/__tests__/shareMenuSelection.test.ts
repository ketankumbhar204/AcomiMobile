import { mealsApi } from '../../api/mealsApi';
import {
  buildShareMessageForSelection,
  buildShareOptionsBody,
  defaultSelectedMealTypes,
  publishDraftMenusForTypes,
} from '../shareMenuSelection';

jest.mock('../../api/mealsApi', () => ({
  mealsApi: {
    getSharePreview: jest.fn(),
    getDailyMenusByDate: jest.fn(),
    getMealCombos: jest.fn(),
    publishDailyMenu: jest.fn(),
  },
}));

describe('buildShareOptionsBody', () => {
  it('lists combos/items like backend share preview', () => {
    const body = buildShareOptionsBody(
      'LUNCH',
      {
        mealType: 'LUNCH',
        status: 'DRAFT',
        menuDate: '2026-07-20',
        notes: 'Extra salad',
        options: [
          {
            entryType: 'COMBO',
            comboId: 'c1',
            label: 'Standard Lunch Thali',
            sortOrder: 1,
            isAvailable: true,
            price: 80,
            currencyCode: 'INR',
            packageItems: [
              { itemId: 'i1', name: 'Chapati' },
              { itemId: 'i2', name: 'Dal Fry' },
            ],
          },
          {
            entryType: 'ITEM',
            itemId: 'i3',
            label: 'Buttermilk',
            sortOrder: 2,
            isAvailable: true,
          },
        ],
      } as never,
    );

    expect(body).toContain('1. Standard Lunch Thali - ₹80');
    expect(body).toContain('Chapati, Dal Fry');
    expect(body).toContain('2. Buttermilk');
    expect(body).toContain('3. Not available for Lunch');
    expect(body).toContain('Note: Extra salad');
  });
});

describe('buildShareMessageForSelection', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (mealsApi.getSharePreview as jest.Mock).mockResolvedValue({
      messageText:
        '🍽 Test Mess 1\nMonday, 20 Jul 2026 · Breakfast\n\n(not published)\n\nEligible participants: 4',
    });
    (mealsApi.getMealCombos as jest.Mock).mockResolvedValue([]);
  });

  it('loads preview without publishing drafts', async () => {
    (mealsApi.getSharePreview as jest.Mock).mockResolvedValue({
      messageText: 'Preview text\n\n1. Item\nEligible participants: 2',
    });

    const text = await buildShareMessageForSelection('space-1', '2026-07-18', ['BREAKFAST'], {
      BREAKFAST: {
        mealType: 'BREAKFAST',
        status: 'PUBLISHED',
        menuDate: '2026-07-18',
        options: [{ isAvailable: true, label: 'Poha', sortOrder: 1 }],
      } as never,
    });

    expect(mealsApi.getSharePreview).toHaveBeenCalledWith(
      'space-1',
      '2026-07-18',
      'BREAKFAST',
    );
    expect(mealsApi.publishDailyMenu).not.toHaveBeenCalled();
    expect(mealsApi.getDailyMenusByDate).not.toHaveBeenCalled();
    expect(text).toContain('Preview text');
  });

  it('fills draft menus into unpublished preview stubs', async () => {
    const text = await buildShareMessageForSelection('space-1', '2026-07-20', ['BREAKFAST'], {
      BREAKFAST: {
        mealType: 'BREAKFAST',
        status: 'DRAFT',
        menuDate: '2026-07-20',
        options: [
          {
            entryType: 'ITEM',
            label: 'Poha',
            sortOrder: 1,
            isAvailable: true,
          },
          {
            entryType: 'ITEM',
            label: 'Tea',
            sortOrder: 2,
            isAvailable: true,
          },
        ],
      } as never,
    });

    expect(mealsApi.publishDailyMenu).not.toHaveBeenCalled();
    expect(text).toContain('1. Poha');
    expect(text).toContain('2. Tea');
    expect(text).toContain('3. Not available for Breakfast');
    expect(text).not.toContain('(not published)');
    expect(text).toContain('Eligible participants: 4');
  });
});

describe('publishDraftMenusForTypes', () => {
  it('publishes only draft and modified meals with options', async () => {
    (mealsApi.publishDailyMenu as jest.Mock).mockResolvedValue({});

    await publishDraftMenusForTypes(
      'space-1',
      '2026-07-18',
      ['BREAKFAST', 'LUNCH', 'DINNER'],
      {
        BREAKFAST: {
          mealType: 'BREAKFAST',
          status: 'DRAFT',
          menuDate: '2026-07-18',
          options: [{ isAvailable: true, label: 'A', sortOrder: 1 }],
        } as never,
        LUNCH: {
          mealType: 'LUNCH',
          status: 'PUBLISHED',
          menuDate: '2026-07-18',
          options: [{ isAvailable: true, label: 'B', sortOrder: 1 }],
        } as never,
        DINNER: {
          mealType: 'DINNER',
          status: 'DRAFT',
          menuDate: '2026-07-18',
          options: [],
        } as never,
      },
    );

    expect(mealsApi.publishDailyMenu).toHaveBeenCalledTimes(1);
    expect(mealsApi.publishDailyMenu).toHaveBeenCalledWith(
      'space-1',
      '2026-07-18',
      'BREAKFAST',
    );
  });
});

describe('defaultSelectedMealTypes', () => {
  it('preselects draft/modified only — published stays unchecked', () => {
    const menuMap = {
      BREAKFAST: {
        mealType: 'BREAKFAST',
        status: 'DRAFT',
        options: [{ isAvailable: true }],
      },
      LUNCH: {
        mealType: 'LUNCH',
        status: 'PUBLISHED',
        options: [{ isAvailable: true }],
      },
      DINNER: {
        mealType: 'DINNER',
        status: 'MODIFIED',
        options: [{ isAvailable: true }],
      },
    } as never;

    expect(defaultSelectedMealTypes(menuMap)).toEqual(['BREAKFAST', 'DINNER']);
  });

  it('does not preselect published initial meal — user selects explicitly', () => {
    const menuMap = {
      LUNCH: {
        mealType: 'LUNCH',
        status: 'PUBLISHED',
        options: [{ isAvailable: true }],
      },
    } as never;

    expect(defaultSelectedMealTypes(menuMap, 'LUNCH')).toEqual([]);
  });
});
