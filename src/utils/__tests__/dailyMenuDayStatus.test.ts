import type { DailyMenuResponse } from '../../api/types';
import {
  isMealPlanned,
  listPlannedMealTypes,
  resolveDayPollControl,
  resolveDayShareAction,
  resolveDayShareVisual,
  summarizeDailyMenuDay,
} from '../dailyMenuDayStatus';

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

describe('resolveDayShareAction', () => {
  it('hides the action when nothing is planned', () => {
    expect(
      resolveDayShareAction({ published: 0, modified: 0, draft: 0, notPlanned: 3 }),
    ).toBe('hidden');
  });

  it('shows Share when any meal is planned and not fully published', () => {
    expect(resolveDayShareAction({ published: 0, modified: 0, draft: 1, notPlanned: 2 })).toBe(
      'share',
    );
    expect(resolveDayShareAction({ published: 1, modified: 0, draft: 1, notPlanned: 1 })).toBe(
      'share',
    );
    expect(resolveDayShareAction({ published: 2, modified: 1, draft: 0, notPlanned: 0 })).toBe(
      'share',
    );
  });

  it('treats a saved draft as planned and an empty meal as not planned', () => {
    expect(isMealPlanned(menu('BREAKFAST', 'DRAFT', 1))).toBe(true);
    expect(isMealPlanned(menu('LUNCH', 'PUBLISHED', 0))).toBe(false);
    expect(isMealPlanned(null)).toBe(false);
  });

  it('keeps sharing status independent of a saved menu', () => {
    expect(
      resolveDayShareVisual({ published: 0, modified: 0, draft: 2, notPlanned: 1 }),
    ).toBe('not_shared');
    expect(
      resolveDayShareVisual({ published: 2, modified: 0, draft: 0, notPlanned: 1 }),
    ).toBe('shared');
    expect(
      resolveDayShareVisual({ published: 1, modified: 1, draft: 0, notPlanned: 1 }),
    ).toBe('updated');
    expect(
      resolveDayShareVisual(
        { published: 0, modified: 0, draft: 1, notPlanned: 2 },
        { shareFailed: true },
      ),
    ).toBe('failed');
    expect(
      resolveDayShareVisual(
        { published: 2, modified: 0, draft: 0, notPlanned: 1 },
        { shareFailed: true },
      ),
    ).toBe('shared');
  });

  it('shows Close poll only while a poll for the day is open', () => {
    expect(resolveDayPollControl([])).toBe('hidden');
    expect(resolveDayPollControl(['OPEN'])).toBe('open');
    expect(resolveDayPollControl(['CLOSED', 'OPEN'])).toBe('open');
    expect(resolveDayPollControl(['CLOSED', 'CLOSED'])).toBe('closed');
  });

  it('shows Reshare only when every planned meal is already published', () => {
    expect(resolveDayShareAction({ published: 1, modified: 0, draft: 0, notPlanned: 2 })).toBe(
      'reshare',
    );
    expect(resolveDayShareAction({ published: 3, modified: 0, draft: 0, notPlanned: 0 })).toBe(
      'reshare',
    );
  });
});
