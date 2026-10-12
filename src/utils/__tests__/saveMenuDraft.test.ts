import { mealsApi } from '../../api/mealsApi';
import { saveMenuDraft } from '../dailyMenuDraft';

jest.mock('../../api/mealsApi', () => ({
  mealsApi: {
    upsertDailyMenu: jest.fn(),
  },
}));

describe('saveMenuDraft', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('persists only the meal being edited', async () => {
    (mealsApi.upsertDailyMenu as jest.Mock).mockResolvedValue({ mealType: 'BREAKFAST' });

    await saveMenuDraft(
      'space-1',
      '2026-10-10',
      'BREAKFAST',
      [
        {
          entryType: 'COMBO',
          comboId: 'combo-1',
          label: 'Combo 1 test',
          sortOrder: 1,
          isAvailable: true,
        },
      ],
      null,
    );

    expect(mealsApi.upsertDailyMenu).toHaveBeenCalledTimes(1);
    expect(mealsApi.upsertDailyMenu).toHaveBeenCalledWith(
      'space-1',
      '2026-10-10',
      'BREAKFAST',
      expect.objectContaining({
        notes: null,
        options: [
          expect.objectContaining({
            entryType: 'COMBO',
            comboId: 'combo-1',
            label: 'Combo 1 test',
          }),
        ],
      }),
    );
    const mealTypes = (mealsApi.upsertDailyMenu as jest.Mock).mock.calls.map(call => call[2]);
    expect(mealTypes).toEqual(['BREAKFAST']);
  });
});
