import { buildMealResponseLists } from '../mealResponseMembers';
import type { MealHeadcountDetailResponse } from '../../api/types';

function detail(
  partial: Partial<MealHeadcountDetailResponse>,
): MealHeadcountDetailResponse {
  return {
    date: '2026-10-18',
    mealType: 'BREAKFAST',
    pollId: 'poll-1',
    pollStatus: 'OPEN',
    mealsToPrepare: 0,
    eligibleCount: 0,
    options: [],
    noResponseMembers: [],
    ...partial,
  };
}

describe('buildMealResponseLists', () => {
  it('keeps an empty responded list when nobody has answered', () => {
    const lists = buildMealResponseLists(
      detail({
        noResponseMembers: [
          { memberId: 'm1', memberName: 'Asha' },
          { memberId: 'm2', memberName: 'Ravi' },
        ],
      }),
    );

    expect(lists.responded).toEqual([]);
    expect(lists.notResponded.map(row => row.memberName)).toEqual(['Asha', 'Ravi']);
    expect(lists.eligible).toHaveLength(2);
  });

  it('treats any chosen option as a response and joins multiple choices', () => {
    const lists = buildMealResponseLists(
      detail({
        options: [
          {
            optionId: 'opt-1',
            optionType: 'MENU_ENTRY',
            sortOrder: 0,
            label: 'Poha',
            count: 1,
            members: [{ memberId: 'm1', memberName: 'Asha' }],
          },
          {
            optionId: 'opt-2',
            optionType: 'NOT_AVAILABLE',
            sortOrder: 1,
            label: 'Not available',
            count: 1,
            members: [
              { memberId: 'm1', memberName: 'Asha' },
              { memberId: 'm2', memberName: 'Ravi' },
            ],
          },
        ],
        noResponseMembers: [{ memberId: 'm3', memberName: 'Neha' }],
      }),
    );

    expect(lists.responded).toEqual([
      { memberId: 'm1', memberName: 'Asha', choice: 'Poha, Not available', responded: true },
      { memberId: 'm2', memberName: 'Ravi', choice: 'Not available', responded: true },
    ]);
    expect(lists.notResponded.map(row => row.memberId)).toEqual(['m3']);
    expect(lists.eligible.map(row => row.memberName)).toEqual(['Asha', 'Neha', 'Ravi']);
  });
});
