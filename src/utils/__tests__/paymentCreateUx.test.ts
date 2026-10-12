import { readFileSync } from 'fs';
import { join } from 'path';

function source(relativePath: string): string {
  return readFileSync(join(__dirname, '../../..', relativePath), 'utf8');
}

describe('payment create UX', () => {
  const payments = source('src/screens/payments/PaymentsScreen.tsx');
  const create = source('src/screens/payments/CreatePaymentScreen.tsx');
  const history = source('src/screens/payments/MemberPaymentsScreen.tsx');
  const profile = source('src/components/member/MemberPaymentsTab.tsx');
  const details = source('src/screens/MemberDetailsScreen.tsx');
  const actions = source('src/components/payments/OwnerPaymentCardActions.tsx');
  const picker = source('src/components/occupancy/OccupancyMemberPickerModal.tsx');

  it('opens create payment from the payments header without a row action', () => {
    expect(payments).toContain("t('paymentCollection.addRecord.createAction')");
    expect(payments).toContain(
      "navigation.navigate('CreatePayment', { spaceId, month: summary.month })",
    );
    expect(payments).not.toContain('onAddPayment');
    expect(payments).toContain('summaryReloadRef.current()');
    expect(payments).toContain('recordsReloadRef.current()');
    expect(payments).toContain('UniversalPaymentCard');
    expect(payments).not.toContain('MemberPaymentRow');
  });

  it('requires a member and keeps received and reminder actions', () => {
    expect(create).toContain('const memberLocked = Boolean(routeMemberId)');
    expect(create).toContain("t('paymentCollection.addRecord.errors.member')");
    expect(create).toContain('OccupancyMemberPickerModal');
    expect(create).toContain('disabled={memberLocked}');
    expect(create).toContain('submitLock.current');
    expect(create).toContain('padding: paymentDetailScreenPadding');
    expect(create).toContain('paddingHorizontal: paymentDetailContentGutter');
    expect(create).not.toContain('padding: spacing.lg,\n    paddingBottom: 140');
    expect(create).toContain('invalidatePaymentsMonthCaches');
    expect(actions).toContain("t('paymentCollection.received.action')");
    expect(actions).toContain("t('paymentCollection.reminder.send')");
    expect(actions).not.toContain('onAddPayment');
    expect(actions).not.toContain('Plus');
    expect(actions).toContain('flex: 1');
  });

  it('locks the current member on profile and history add payment', () => {
    expect(profile).toContain("t('paymentCollection.addRecord.action')");
    expect(profile).toContain('memberId: member.memberId');
    expect(profile).toContain('memberMobile: member.mobileNumber');
    expect(profile).toContain('canManagePayments');
    expect(profile).toContain('reloadRef.current()');
    expect(details).toContain("case 'payments'");
    expect(details).toContain('<MemberPaymentsTab');
    expect(history).toContain("t('paymentCollection.addRecord.action')");
    expect(history).toContain('memberId,');
    expect(history).not.toContain('onAddPayment');
    expect(picker).toContain('memberMatchesPaymentSearch');
    expect(picker).toContain('memberApi.getMembers(spaceId)');
  });

  it('keeps create and add payment labels in en, hi, and mr', () => {
    for (const locale of ['en', 'hi', 'mr']) {
      const messages = JSON.parse(source(`src/i18n/locales/${locale}.json`)) as {
        membership: { detailTabs: { payments: string } };
        paymentCollection: {
          addRecord: { action: string; createAction: string; errors: { member: string } };
        };
      };
      expect(messages.membership.detailTabs.payments.length).toBeGreaterThan(0);
      expect(messages.paymentCollection.addRecord.createAction.length).toBeGreaterThan(0);
      expect(messages.paymentCollection.addRecord.action.length).toBeGreaterThan(0);
      expect(messages.paymentCollection.addRecord.errors.member.length).toBeGreaterThan(0);
      expect(messages.paymentCollection.addRecord.createAction).not.toBe(
        messages.paymentCollection.addRecord.action,
      );
    }
  });
});
