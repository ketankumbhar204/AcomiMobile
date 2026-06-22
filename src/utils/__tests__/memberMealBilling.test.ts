import {
  buildSubscriptionPurchasePayload,
  isSubscriptionBilling,
  resolveEffectiveMemberMealBilling,
} from '../memberMealBilling';

describe('memberMealBilling', () => {
  describe('resolveEffectiveMemberMealBilling', () => {
    it('uses space default when selection is DEFAULT', () => {
      expect(resolveEffectiveMemberMealBilling('DEFAULT', 'PAY_PER_MEAL')).toBe('PAY_PER_MEAL');
    });

    it('uses explicit override when provided', () => {
      expect(resolveEffectiveMemberMealBilling('PREPAID_BALANCE', 'PAY_PER_MEAL')).toBe(
        'PREPAID_BALANCE',
      );
    });
  });

  describe('isSubscriptionBilling', () => {
    it('returns true for subscription override or default', () => {
      expect(isSubscriptionBilling('PREPAID_BALANCE', 'PAY_PER_MEAL')).toBe(true);
      expect(isSubscriptionBilling('DEFAULT', 'PREPAID_BALANCE')).toBe(true);
      expect(isSubscriptionBilling('DEFAULT', 'PAY_PER_MEAL')).toBe(false);
    });
  });

  describe('buildSubscriptionPurchasePayload', () => {
    it('builds meal pack purchase with paid amount', () => {
      expect(buildSubscriptionPurchasePayload('30', '3000', 'MEALS')).toEqual({
        amount: 30,
        paidAmount: 3000,
      });
    });

    it('requires price for meal pack purchases', () => {
      expect(buildSubscriptionPurchasePayload('30', '', 'MEALS')).toBeNull();
    });

    it('builds currency subscription purchase', () => {
      expect(buildSubscriptionPurchasePayload('', '2500', 'CURRENCY')).toEqual({
        amount: 2500,
        paidAmount: 2500,
      });
    });
  });
});
