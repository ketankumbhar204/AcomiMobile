import { canSendPaymentReminder, hasPrepaidOverflow } from '../mealPollPayment';

describe('mealPollPayment', () => {
  describe('canSendPaymentReminder', () => {
    it('returns true for pending and rejected statuses', () => {
      expect(canSendPaymentReminder('PENDING')).toBe(true);
      expect(canSendPaymentReminder('REJECTED')).toBe(true);
    });

    it('returns false for other statuses', () => {
      expect(canSendPaymentReminder('PAID')).toBe(false);
      expect(canSendPaymentReminder('PENDING_APPROVAL')).toBe(false);
      expect(canSendPaymentReminder(null)).toBe(false);
      expect(canSendPaymentReminder(undefined)).toBe(false);
    });
  });

  describe('hasPrepaidOverflow', () => {
    it('returns true when overflow payment flag is set with positive amount', () => {
      expect(hasPrepaidOverflow(true, 120)).toBe(true);
    });

    it('returns false when overflow is disabled or amount is zero', () => {
      expect(hasPrepaidOverflow(false, 120)).toBe(false);
      expect(hasPrepaidOverflow(true, 0)).toBe(false);
      expect(hasPrepaidOverflow(true, null)).toBe(false);
    });
  });
});
