import {
  buildMealResponseLists,
  matchesMealResponseSearch,
  mealResponseCardStatus,
  type MealResponseMemberRow,
} from '../mealResponseMembers';
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
      {
        memberId: 'm1',
        memberName: 'Asha',
        mobileNumber: null,
        choice: 'Poha, Not available',
        responded: true,
      },
      {
        memberId: 'm2',
        memberName: 'Ravi',
        mobileNumber: null,
        choice: 'Not available',
        responded: true,
      },
    ]);
    expect(lists.notResponded.map(row => row.memberId)).toEqual(['m3']);
    expect(lists.eligible.map(row => row.memberName)).toEqual(['Asha', 'Neha', 'Ravi']);
  });
});

describe('matchesMealResponseSearch', () => {
  const row: MealResponseMemberRow = {
    memberId: 'm1',
    memberName: 'Rahul Kumar',
    mobileNumber: '9999999991',
    choice: 'Chicken Thali',
    responded: true,
  };

  it('matches a full name, a partial name, and a mobile number', () => {
    expect(matchesMealResponseSearch(row, 'Rahul Kumar')).toBe(true);
    expect(matchesMealResponseSearch(row, 'kumar')).toBe(true);
    expect(matchesMealResponseSearch(row, '9999999991')).toBe(true);
    expect(matchesMealResponseSearch(row, '+91 99999')).toBe(true);
  });

  it('does not throw when the phone number is missing', () => {
    expect(
      matchesMealResponseSearch({ ...row, mobileNumber: null }, '99999'),
    ).toBe(false);
    expect(
      matchesMealResponseSearch({ ...row, mobileNumber: null }, 'rahul'),
    ).toBe(true);
  });
});

describe('mealResponseCardStatus', () => {
  const responded: MealResponseMemberRow = {
    memberId: 'm1',
    memberName: 'Rahul',
    mobileNumber: null,
    choice: 'Chicken Thali',
    responded: true,
  };
  const waiting: MealResponseMemberRow = {
    memberId: 'm2',
    memberName: 'Amit',
    mobileNumber: null,
    choice: null,
    responded: false,
  };

  it('keeps responded members responded even on the eligible list', () => {
    expect(mealResponseCardStatus(responded, 'eligible')).toBe('responded');
    expect(mealResponseCardStatus(responded, 'responded')).toBe('responded');
  });

  it('labels a waiting member by the list they are viewed in', () => {
    expect(mealResponseCardStatus(waiting, 'eligible')).toBe('eligible');
    expect(mealResponseCardStatus(waiting, 'not_responded')).toBe('not_responded');
  });
});
