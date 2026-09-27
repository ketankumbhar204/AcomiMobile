import { paymentsApi } from '../api/paymentsApi';
import type { UUID } from '../api/types';

export type MemberMonthPaymentNavTarget =
  | {
      kind: 'detail';
      paymentId: UUID;
      memberId: UUID;
      memberName: string;
    }
  | {
      kind: 'list';
      memberId: UUID;
      memberName: string;
      month: string;
      paymentCount: number;
    };

/**
 * Owner Members tab rows are member-month aggregates (no paymentId).
 * Resolve to a concrete payment detail when possible; otherwise the member payment list.
 */
export async function resolveMemberMonthPaymentTarget(
  spaceId: UUID,
  memberId: UUID,
  memberName: string,
  month: string,
  options?: { sync?: boolean },
): Promise<MemberMonthPaymentNavTarget> {
  if (options?.sync) {
    await paymentsApi.syncPaymentsMonth(spaceId, month);
  }
  const response = await paymentsApi.listPayments(spaceId, {
    memberId,
    month,
    sync: false,
  });
  const payments = response.payments ?? [];

  if (payments.length === 1) {
    return {
      kind: 'detail',
      paymentId: payments[0].paymentId,
      memberId,
      memberName: payments[0].memberName || memberName,
    };
  }

  return {
    kind: 'list',
    memberId,
    memberName,
    month,
    paymentCount: payments.length,
  };
}
