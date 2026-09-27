import { resolveMemberMonthPaymentTarget } from '../resolveMemberMonthPaymentTarget';
import { paymentsApi } from '../../api/paymentsApi';

jest.mock('../../api/paymentsApi', () => ({
  paymentsApi: {
    listPayments: jest.fn(),
    syncPaymentsMonth: jest.fn(),
  },
}));

const listPayments = paymentsApi.listPayments as jest.MockedFunction<
  typeof paymentsApi.listPayments
>;
const syncPaymentsMonth = paymentsApi.syncPaymentsMonth as jest.MockedFunction<
  typeof paymentsApi.syncPaymentsMonth
>;

describe('resolveMemberMonthPaymentTarget', () => {
  beforeEach(() => {
    listPayments.mockReset();
    syncPaymentsMonth.mockReset();
    syncPaymentsMonth.mockResolvedValue(undefined);
  });

  it('opens payment detail when exactly one payment exists', async () => {
    listPayments.mockResolvedValue({
      month: '2026-07',
      payments: [
        {
          paymentId: 'pay-1',
          memberId: 'm-1',
          memberName: 'Customer Three',
        } as never,
      ],
    });

    await expect(
      resolveMemberMonthPaymentTarget('s-1', 'm-1', 'Customer Three', '2026-07'),
    ).resolves.toEqual({
      kind: 'detail',
      paymentId: 'pay-1',
      memberId: 'm-1',
      memberName: 'Customer Three',
    });
  });

  it('opens member payment list when zero or multiple payments exist', async () => {
    listPayments.mockResolvedValue({
      month: '2026-07',
      payments: [
        { paymentId: 'pay-1', memberId: 'm-1', memberName: 'A' } as never,
        { paymentId: 'pay-2', memberId: 'm-1', memberName: 'A' } as never,
      ],
    });

    await expect(
      resolveMemberMonthPaymentTarget('s-1', 'm-1', 'A', '2026-07'),
    ).resolves.toEqual({
      kind: 'list',
      memberId: 'm-1',
      memberName: 'A',
      month: '2026-07',
      paymentCount: 2,
    });
  });

  it('syncs expected payments before resolving when requested', async () => {
    listPayments.mockResolvedValue({
      month: '2026-09',
      payments: [
        { paymentId: 'pay-rent', memberId: 'm-1', memberName: 'Rahul' } as never,
        { paymentId: 'pay-dep', memberId: 'm-1', memberName: 'Rahul' } as never,
      ],
    });

    await expect(
      resolveMemberMonthPaymentTarget('s-1', 'm-1', 'Rahul', '2026-09', { sync: true }),
    ).resolves.toEqual({
      kind: 'list',
      memberId: 'm-1',
      memberName: 'Rahul',
      month: '2026-09',
      paymentCount: 2,
    });
    expect(syncPaymentsMonth).toHaveBeenCalledWith('s-1', '2026-09');
  });
});
