import type { SpacePaymentResponse } from '../../api/types';
import { defaultPaymentListFilters, paymentFiltersFromLegacy } from '../paymentLedger';
import { filterIndividualPayments, matchesIndividualPayment } from '../individualPayments';

function payment(partial: Partial<SpacePaymentResponse> & Pick<SpacePaymentResponse, 'paymentId' | 'memberName' | 'title' | 'paymentType' | 'paymentStatus'>): SpacePaymentResponse {
  return {
    spaceId: 'space',
    memberId: partial.memberId ?? partial.paymentId,
    paymentCategory: 'EXTRA',
    amount: 1000,
    currencyCode: 'INR',
    dueDate: '2026-10-01',
    month: '2026-10',
    createdAt: '2026-10-01T00:00:00Z',
    updatedAt: '2026-10-01T00:00:00Z',
    ...partial,
  };
}

describe('individual payment list', () => {
  const rows = [
    payment({
      paymentId: 'rent-rahul',
      memberId: 'rahul',
      memberName: 'Rahul Kumar',
      title: 'Rent - October 2026',
      paymentType: 'RENT',
      paymentStatus: 'PENDING',
      dueDate: '2026-10-01',
      amount: 6000,
    }),
    payment({
      paymentId: 'power-rahul',
      memberId: 'rahul',
      memberName: 'Rahul Kumar',
      title: 'Electricity',
      paymentType: 'UTILITY',
      paymentStatus: 'PENDING',
      dueDate: '2026-10-04',
      amount: 1000,
      memberMobile: '9999999999',
    }),
    payment({
      paymentId: 'rent-pga',
      memberId: 'pga',
      memberName: 'PGA Member 8556255',
      title: 'Rent - October 2026',
      paymentType: 'RENT',
      paymentStatus: 'PAID',
      dueDate: '2026-10-01',
      amount: 6000,
    }),
  ];

  it('shows each charge as its own record', () => {
    const visible = filterIndividualPayments(rows, defaultPaymentListFilters(), '');
    expect(visible.map(row => row.paymentId)).toEqual([
      'power-rahul',
      'rent-rahul',
      'rent-pga',
    ]);
  });

  it('filters by member, status, and search', () => {
    expect(
      filterIndividualPayments(rows, paymentFiltersFromLegacy('pending'), 'electric').map(
        row => row.paymentId,
      ),
    ).toEqual(['power-rahul']);
    expect(
      filterIndividualPayments(rows, paymentFiltersFromLegacy('collected'), '').map(
        row => row.memberName,
      ),
    ).toEqual(['PGA Member 8556255']);
    expect(
      matchesIndividualPayment(rows[0], { memberId: 'rahul', query: 'rent' }),
    ).toBe(true);
    expect(matchesIndividualPayment(rows[0], { memberId: 'pga' })).toBe(false);
    expect(matchesIndividualPayment(rows[1], { query: '99999' })).toBe(true);
    expect(matchesIndividualPayment(rows[1], { query: '999 9999' })).toBe(true);
  });
});
