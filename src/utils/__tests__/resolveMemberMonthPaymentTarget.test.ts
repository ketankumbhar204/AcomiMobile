import { resolveMemberMonthPaymentTarget } from '../resolveMemberMonthPaymentTarget';
import { paymentsApi } from '../../api/paymentsApi';

jest.mock('../../api/paymentsApi', () => ({
  paymentsApi: {
    listPayments: jest.fn(),
  },
}));

const listPayments = paymentsApi.listPayments as jest.MockedFunction<
  typeof paymentsApi.listPayments
>;

describe('resolveMemberMonthPaymentTarget', () => {
  beforeEach(() => {
    listPayments.mockReset();
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
    });
  });
});
