import type { DailyMenuResponse, MealPollSlot } from '../../api/types';
import { buildDashboardMealSlotRows } from '../dashboardMealSlotDisplay';

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

function poll(
  mealType: MealPollSlot['mealType'],
  status: MealPollSlot['status'],
  responseCount: number,
): MealPollSlot {
  return {
    id: `${mealType}-poll`,
    pollDate: '2026-07-05',
    mealType,
    status,
    dailyMenuId: `${mealType}-menu`,
    options: [],
    responseCount,
  };
}

describe('buildDashboardMealSlotRows', () => {
  it('always returns all configured meal slots', () => {
    const rows = buildDashboardMealSlotRows({}, {});

    expect(rows.map(row => row.mealType)).toEqual(['BREAKFAST', 'LUNCH', 'DINNER']);
    expect(rows.every(row => row.status === 'not_planned')).toBe(true);
    expect(rows.every(row => row.captionKey === 'dashboard.operations.ctaPlanMenu')).toBe(true);
  });

  it('maps draft breakfast and lunch with dinner not planned', () => {
    const menuMap = {
      BREAKFAST: menu('BREAKFAST', 'DRAFT', 1),
      LUNCH: menu('LUNCH', 'DRAFT', 2),
    };

    const rows = buildDashboardMealSlotRows(menuMap, {});

    expect(rows[0]).toMatchObject({
      mealType: 'BREAKFAST',
      status: 'draft',
      statusLabelKey: 'dashboard.operations.statusDraft',
      captionKey: 'dashboard.operations.ctaPublishShare',
    });
    expect(rows[1]).toMatchObject({
      mealType: 'LUNCH',
      status: 'draft',
    });
    expect(rows[2]).toMatchObject({
      mealType: 'DINNER',
      status: 'not_planned',
      statusLabelKey: 'dashboard.operations.statusNotPlanned',
      captionKey: 'dashboard.operations.ctaPlanMenu',
    });
  });

  it('maps published breakfast with responses and draft lunch', () => {
    const menuMap = {
      BREAKFAST: menu('BREAKFAST', 'PUBLISHED', 1),
      LUNCH: menu('LUNCH', 'DRAFT', 1),
    };
    const pollMap = {
      BREAKFAST: poll('BREAKFAST', 'OPEN', 23),
    };

    const rows = buildDashboardMealSlotRows(menuMap, pollMap);

    expect(rows[0]).toMatchObject({
      mealType: 'BREAKFAST',
      status: 'published',
      captionKey: 'dashboard.operations.responsesCount',
      captionParams: { count: 23 },
    });
    expect(rows[1]).toMatchObject({
      mealType: 'LUNCH',
      status: 'draft',
    });
    expect(rows[2]).toMatchObject({
      mealType: 'DINNER',
      status: 'not_planned',
    });
  });
});
