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
  } as unknown as DailyMenuResponse;
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
    expect(rows.every(row => row.statusKind === 'empty')).toBe(true);
    expect(rows.every(row => row.captionKey === 'meals.planning.cardHintEmpty')).toBe(true);
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
      statusKind: 'draft',
      statusLabelKey: 'meals.status.notShared',
      captionKey: 'meals.planning.cardHintDraft',
    });
    expect(rows[2]).toMatchObject({
      mealType: 'DINNER',
      status: 'not_planned',
      statusKind: 'empty',
    });
  });

  it('keeps Shared as primary when poll is open; responses are secondary', () => {
    const menuMap = {
      BREAKFAST: menu('BREAKFAST', 'PUBLISHED', 1),
      LUNCH: menu('LUNCH', 'DRAFT', 1),
    };
    const pollMap = {
      BREAKFAST: poll('BREAKFAST', 'OPEN', 1),
    };

    const rows = buildDashboardMealSlotRows(menuMap, pollMap, { BREAKFAST: 4 }, {}, 4);

    expect(rows[0]).toMatchObject({
      mealType: 'BREAKFAST',
      status: 'published',
      statusKind: 'shared',
      statusLabelKey: 'meals.status.shared',
      captionKey: 'meals.planning.cardHintResponses',
      captionParams: { responded: 1, eligible: 4 },
      countPrimary: '1 / 4',
      captionTone: 'progress',
    });
  });

  it('maps modified meals to needs-reshare status', () => {
    const menuMap = {
      BREAKFAST: menu('BREAKFAST', 'MODIFIED', 2),
    };

    const rows = buildDashboardMealSlotRows(menuMap, {});

    expect(rows[0]).toMatchObject({
      statusKind: 'needs_reshare',
      captionKey: 'meals.planning.cardHintNeedsReshare',
    });
  });

  it('shows Shared + Poll closed when poll is closed', () => {
    const menuMap = {
      BREAKFAST: menu('BREAKFAST', 'PUBLISHED', 1),
    };
    const pollMap = {
      BREAKFAST: poll('BREAKFAST', 'CLOSED', 3),
    };

    const rows = buildDashboardMealSlotRows(
      menuMap,
      pollMap,
      { BREAKFAST: 4 },
      { BREAKFAST: 4 },
    );

    expect(rows[0]).toMatchObject({
      statusKind: 'shared',
      statusLabelKey: 'meals.status.shared',
      captionKey: 'meals.planning.cardHintPollClosed',
      captionTone: 'muted',
    });
  });
});
