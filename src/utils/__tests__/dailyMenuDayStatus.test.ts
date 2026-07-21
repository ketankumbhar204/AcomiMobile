import type { DailyMenuResponse } from '../../api/types';
import { listPlannedMealTypes, summarizeDailyMenuDay } from '../dailyMenuDayStatus';

function menu(
  mealType: DailyMenuResponse['mealType'],
  status: DailyMenuResponse['status'],
  optionCount: number,
): DailyMenuResponse {
  return {
    menuId: `${mealType}-id`,
    menuDate: '2026-07-05',
    mealType,
    status,
    options: Array.from({ length: optionCount }, (_, index) => ({
      optionId: `${mealType}-opt-${index}`,
      isAvailable: true,
      sortOrder: index,
    })),
  } as DailyMenuResponse;
}

describe('dailyMenuDayStatus', () => {
  it('counts draft breakfast as planned', () => {
    const menus = [menu('BREAKFAST', 'DRAFT', 2)];

    expect(summarizeDailyMenuDay(menus)).toEqual({
      published: 0,
      modified: 0,
      draft: 1,
      notPlanned: 2,
    });
    expect(listPlannedMealTypes(menus)).toEqual(['BREAKFAST']);
  });

  it('counts modified lunch separately from published', () => {
    const menus = [
      menu('BREAKFAST', 'PUBLISHED', 1),
      menu('LUNCH', 'MODIFIED', 2),
    ];

    expect(summarizeDailyMenuDay(menus)).toEqual({
      published: 1,
      modified: 1,
      draft: 0,
      notPlanned: 1,
    });
  });

  it('ignores menus with no available options', () => {
    const menus = [
      {
        ...menu('BREAKFAST', 'DRAFT', 0),
        options: [{ optionId: 'x', isAvailable: false, sortOrder: 0 }],
      } as DailyMenuResponse,
    ];

    expect(summarizeDailyMenuDay(menus)).toEqual({
      published: 0,
      modified: 0,
      draft: 0,
      notPlanned: 3,
    });
    expect(listPlannedMealTypes(menus)).toEqual([]);
  });
});
