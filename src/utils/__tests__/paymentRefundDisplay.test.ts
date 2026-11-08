import {
  formatPaymentListTitle,
  isRefundTransaction,
  matchesPaymentRecordStatusFilter,
  paymentListDisplayStatus,
  resolveSettlementAmounts,
} from '../paymentRefundDisplay';

describe('paymentRefundDisplay', () => {
  describe('formatPaymentListTitle', () => {
    it('strips duplicate Refund prefixes and adds a single Refund · for REFUND rows', () => {
      expect(
        formatPaymentListTitle({
          title: 'Refund – Refund – Rent – November 2026',
          paymentCategory: 'REFUND',
        }),
      ).toBe('Refund · Rent – November 2026');
    });

    it('does not add Refund prefix for normal rent rows', () => {
      expect(
        formatPaymentListTitle({
          title: 'Rent – November 2026',
          paymentCategory: 'MONTHLY',
        }),
      ).toBe('Rent – November 2026');
    });
  });

  describe('paymentListDisplayStatus', () => {
    it('shows REFUND child rows as Refunded even when API status is PAID', () => {
      expect(
        paymentListDisplayStatus({
          paymentStatus: 'PAID',
          paymentCategory: 'REFUND',
        }),
      ).toBe('REFUNDED');
    });

    it('keeps Cancelled separate from Refunded', () => {
      expect(
        paymentListDisplayStatus({
          paymentStatus: 'CANCELLED',
          paymentCategory: 'MONTHLY',
        }),
      ).toBe('CANCELLED');
    });

    it('marks partial refunds as Partially Refunded', () => {
      expect(
        paymentListDisplayStatus({
          paymentStatus: 'PAID',
          paymentCategory: 'MONTHLY',
          partiallyRefunded: true,
          refundedAmount: 1000,
        }),
      ).toBe('PARTIALLY_REFUNDED');
    });

    it('does not treat UNDER_REVIEW as Paid or Refunded', () => {
      expect(
        paymentListDisplayStatus({
          paymentStatus: 'UNDER_REVIEW',
          paymentCategory: 'MONTHLY',
          isOverdue: true,
        }),
      ).toBe('UNDER_REVIEW');
    });
  });

  describe('resolveSettlementAmounts', () => {
    it('full refund uses remaining and retains zero', () => {
      expect(resolveSettlementAmounts('FULL_REFUND', 4500)).toEqual({
        refundAmount: 4500,
        retainedAmount: 0,
      });
    });

    it('retain uses remaining and refunds zero', () => {
      expect(resolveSettlementAmounts('RETAIN', 4500)).toEqual({
        refundAmount: 0,
        retainedAmount: 4500,
      });
    });

    it('partial refund auto-calculates retained from remaining', () => {
      expect(resolveSettlementAmounts('PARTIAL_REFUND', 4500, '1200')).toEqual({
        refundAmount: 1200,
        retainedAmount: 3300,
      });
    });

    it('clamps excessive refund to remaining', () => {
      expect(resolveSettlementAmounts('PARTIAL_REFUND', 4500, 9999)).toEqual({
        refundAmount: 4500,
        retainedAmount: 0,
      });
    });

    it('never returns negative retained', () => {
      expect(resolveSettlementAmounts('PARTIAL_REFUND', 100, -50)).toEqual({
        refundAmount: 0,
        retainedAmount: 100,
      });
    });

    it('handles decimal precision to two places', () => {
      expect(resolveSettlementAmounts('PARTIAL_REFUND', 100.1, '33.33')).toEqual({
        refundAmount: 33.33,
        retainedAmount: 66.77,
      });
    });
  });

  describe('matchesPaymentRecordStatusFilter', () => {
    it('matches REFUND rows only under Refunded filter', () => {
      const refundRow = {
        paymentStatus: 'PAID' as const,
        paymentCategory: 'REFUND' as const,
      };
      expect(matchesPaymentRecordStatusFilter(refundRow, new Set(['REFUNDED']))).toBe(true);
      expect(matchesPaymentRecordStatusFilter(refundRow, new Set(['PAID']))).toBe(false);
      expect(matchesPaymentRecordStatusFilter(refundRow, new Set(['CANCELLED']))).toBe(false);
    });

    it('includes partially refunded originals under Refunded, not Paid', () => {
      const partial = {
        paymentStatus: 'PAID' as const,
        paymentCategory: 'MONTHLY' as const,
        partiallyRefunded: true,
        refundedAmount: 1200,
        retainedAmount: 3300,
      };
      expect(matchesPaymentRecordStatusFilter(partial, new Set(['REFUNDED']))).toBe(true);
      expect(matchesPaymentRecordStatusFilter(partial, new Set(['PAID']))).toBe(false);
    });

    it('keeps Cancelled filter separate', () => {
      expect(
        matchesPaymentRecordStatusFilter(
          { paymentStatus: 'CANCELLED', paymentCategory: 'MONTHLY' },
          new Set(['CANCELLED']),
        ),
      ).toBe(true);
      expect(
        matchesPaymentRecordStatusFilter(
          { paymentStatus: 'CANCELLED', paymentCategory: 'MONTHLY' },
          new Set(['REFUNDED']),
        ),
      ).toBe(false);
    });
  });

  it('detects REFUND category transactions', () => {
    expect(isRefundTransaction({ paymentCategory: 'REFUND' })).toBe(true);
    expect(isRefundTransaction({ paymentCategory: 'MONTHLY' })).toBe(false);
  });
});
