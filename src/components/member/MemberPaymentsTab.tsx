import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useTranslation } from 'react-i18next';
import { Plus } from 'lucide-react-native';
import type { MemberDetailsResponse, SpacePaymentResponse } from '../../api/types';
import { paymentsApi } from '../../api/paymentsApi';
import { OwnerPaymentCardActions } from '../payments/OwnerPaymentCardActions';
import { PaymentDetailsSheet } from '../payments/PaymentDetailsSheet';
import { UniversalPaymentCard } from '../payments/UniversalPaymentCard';
import { EmptyState, SkeletonCard } from '../ui';
import { PaymentReceivedConfirmModal } from '../payments/PaymentReceivedConfirmModal';
import { useOwnerPaymentCardActions } from '../../hooks/useOwnerPaymentCardActions';
import { useSpaceStore } from '../../store/spaceStore';
import { useUniversalPayments } from '../../hooks/useUniversalPayments';
import type { MainStackParamList } from '../../navigation/types';
import { colors, spacing, typography } from '../../theme';
import { canManagePayments, currentMonthKey } from '../../utils/dashboardFinancial';
import {
  formatDuesAmount,
  memberDuesCue,
  type MemberDuesSnapshot,
} from '../../utils/memberDues';
import { useSpacePermissions } from '../../hooks/useSpacePermissions';
import {
  canOwnerMarkPaymentReceived,
  canOwnerSendPaymentReminder,
} from '../../utils/ownerPaymentCardActions';

function MemberDuesSummary({
  ledger,
  ledgerState,
  payments,
  labelFor,
}: {
  ledger: MemberDuesSnapshot | null;
  ledgerState: 'loading' | 'ready' | 'error';
  payments: SpacePaymentResponse[];
  labelFor: (key: string, options?: Record<string, unknown>) => string;
}) {
  if (ledgerState === 'loading') {
    return null;
  }
  if (ledgerState === 'error') {
    return (
      <Text style={styles.duesMuted}>
        {labelFor('membership.dues.loadFailed', {
          defaultValue: 'Payment totals could not be loaded.',
        })}
      </Text>
    );
  }
  const cue = memberDuesCue(ledger);
  if (!cue) {
    return null;
  }
  const currency = ledger?.currencyCode || 'INR';
  const overdue = payments.reduce((sum, payment) => {
    if (!payment.isOverdue || payment.outstandingAmount == null || payment.outstandingAmount <= 0) {
      return sum;
    }
    if (
      payment.paymentStatus === 'PAID' ||
      payment.paymentStatus === 'UNDER_REVIEW' ||
      payment.paymentStatus === 'PROOF_UPLOADED'
    ) {
      return sum;
    }
    return sum + payment.outstandingAmount;
  }, 0);
  const nextDue = payments
    .filter(payment => (payment.outstandingAmount ?? 0) > 0 && Boolean(payment.dueDate))
    .map(payment => payment.dueDate)
    .sort()[0];
  const text =
    cue.kind === 'due'
      ? labelFor('membership.dues.pending', {
          amount: formatDuesAmount(cue.amount, currency),
          defaultValue: 'Pending: {{amount}}',
        })
      : cue.kind === 'review'
        ? labelFor('membership.dues.review', {
            amount: formatDuesAmount(cue.amount, currency),
            defaultValue: 'Under review: {{amount}}',
          })
        : labelFor('membership.dues.clear', { defaultValue: 'No pending dues' });

  return (
    <View style={styles.duesBox}>
      <Text
        style={
          cue.kind === 'due'
            ? styles.duesDue
            : cue.kind === 'clear'
              ? styles.duesClear
              : styles.duesReview
        }>
        {text}
      </Text>
      {overdue > 0 ? (
        <Text style={styles.duesOverdue}>
          {labelFor('membership.dues.overdue', {
            amount: formatDuesAmount(overdue, currency),
            defaultValue: 'Overdue: {{amount}}',
          })}
        </Text>
      ) : null}
      {nextDue && cue.kind === 'due' ? (
        <Text style={styles.duesMuted}>
          {labelFor('membership.dues.nextDue', {
            date: new Date(`${nextDue}T00:00:00`).toLocaleDateString(),
            defaultValue: 'Next due: {{date}}',
          })}
        </Text>
      ) : null}
    </View>
  );
}

type MemberPaymentsTabProps = {
  spaceId: string;
  member: MemberDetailsResponse;
};

export function MemberPaymentsTab({ spaceId, member }: MemberPaymentsTabProps) {
  const { t } = useTranslation();
  const navigation = useNavigation<NativeStackNavigationProp<MainStackParamList>>();
  const permissions = useSpacePermissions(spaceId);
  const canManage = canManagePayments(permissions.membershipRole);
  const month = currentMonthKey();
  const [ledger, setLedger] = useState<MemberDuesSnapshot | null>(null);
  const [detailsPayment, setDetailsPayment] = useState<SpacePaymentResponse | null>(null);
  const [ledgerState, setLedgerState] = useState<'loading' | 'ready' | 'error'>('loading');
  const { payments, loading, error, serviceUnavailable, reload } = useUniversalPayments(spaceId, {
    memberId: member.memberId,
    month,
    enabled: true,
  });
  const spaceName = useSpaceStore(state =>
    state.currentSpace?.spaceId === spaceId
      ? state.currentSpace.spaceName
      : state.selectedSpace?.id === spaceId
        ? state.selectedSpace.name
        : null,
  );
  const cardActions = useOwnerPaymentCardActions({
    spaceId,
    month,
    onSettled: async () => {
      await reload();
    },
  });

  const openCreate = useCallback(() => {
    navigation.navigate('CreatePayment', {
      spaceId,
      month,
      memberId: member.memberId,
      memberName: member.fullName,
      memberMobile: member.mobileNumber,
    });
  }, [member.fullName, member.memberId, member.mobileNumber, month, navigation, spaceId]);

  useEffect(() => {
    if (!canManage) {
      setLedger(null);
      setLedgerState('ready');
      return;
    }
    let cancelled = false;
    setLedgerState('loading');
    paymentsApi
      .getPaymentsMembers(spaceId, { month, q: member.fullName, page: 0, size: 20 })
      .then(page => {
        if (cancelled) return;
        const match = page.page.content.find(row => row.memberId === member.memberId);
        setLedger(
          match
            ? {
                pending: match.pending,
                underReview: match.underReview,
                expectedCharges: match.expectedCharges,
                currencyCode: match.currencyCode,
              }
            : null,
        );
        setLedgerState('ready');
      })
      .catch(() => {
        if (!cancelled) setLedgerState('error');
      });
    return () => {
      cancelled = true;
    };
  }, [canManage, member.fullName, member.memberId, month, spaceId]);

  const reloadRef = useRef(reload);
  reloadRef.current = reload;
  const skipFocusReload = useRef(true);
  useFocusEffect(
    useCallback(() => {
      if (skipFocusReload.current) {
        skipFocusReload.current = false;
        return;
      }
      reloadRef.current().catch(() => undefined);
    }, []),
  );

  return (
    <View style={styles.wrap}>
      <View style={styles.header}>
        <View style={styles.headerText}>
          <Text style={styles.title}>{t('paymentCollection.addRecord.historyTitle')}</Text>
          <Text style={styles.subtitle}>
            {new Date(`${month}-01T00:00:00`).toLocaleDateString(undefined, {
              month: 'long',
              year: 'numeric',
            })}
          </Text>
        </View>
        {canManage ? (
          <Pressable
            onPress={openCreate}
            style={styles.addButton}
            accessibilityRole="button"
            accessibilityLabel={t('paymentCollection.addRecord.action')}>
            <Plus size={14} color={colors.white} strokeWidth={2.4} />
            <Text style={styles.addLabel}>{t('paymentCollection.addRecord.action')}</Text>
          </Pressable>
        ) : null}
      </View>

      {canManage ? (
        <MemberDuesSummary
          ledger={ledger}
          ledgerState={ledgerState}
          payments={payments}
          labelFor={(key, options) => t(key, options)}
        />
      ) : null}

      {loading ? <SkeletonCard /> : null}
      {!loading && (error || serviceUnavailable) ? (
        <EmptyState
          title={t('payments.errors.title')}
          description={t('paymentCollection.errors.loadPayments')}
        />
      ) : null}
      {!loading && !error && !serviceUnavailable && payments.length === 0 ? (
        <EmptyState
          title={t('paymentCollection.addRecord.historyEmptyTitle')}
          description={t('paymentCollection.addRecord.historyEmptyDescription')}
        />
      ) : null}
      {!loading && !serviceUnavailable
        ? payments.map(payment => (
            <UniversalPaymentCard
              key={payment.paymentId}
              payment={payment}
              onPress={() => setDetailsPayment(payment)}
              ownerActions={
                canManage ? (
                  <OwnerPaymentCardActions
                    showReceived={canOwnerMarkPaymentReceived(payment.paymentStatus)}
                    showReminder={canOwnerSendPaymentReminder(payment.reminderEligible)}
                    receivedLoading={cardActions.isProcessing(payment.paymentId, 'received')}
                    reminderLoading={cardActions.isProcessing(payment.paymentId, 'reminder')}
                    onReceived={() => cardActions.requestReceivedForPayment(payment)}
                    onReminder={() => cardActions.sendReminderForPayment(payment)}
                  />
                ) : undefined
              }
            />
          ))
        : null}
      <PaymentDetailsSheet
        payment={
          detailsPayment
            ? payments.find(row => row.paymentId === detailsPayment.paymentId) ?? detailsPayment
            : null
        }
        spaceName={spaceName}
        receivedLoading={
          detailsPayment != null &&
          cardActions.isProcessing(detailsPayment.paymentId, 'received')
        }
        reminderLoading={
          detailsPayment != null &&
          cardActions.isProcessing(detailsPayment.paymentId, 'reminder')
        }
        onClose={() => setDetailsPayment(null)}
        onReceived={payment => cardActions.requestReceivedForPayment(payment)}
        onReminder={payment => cardActions.sendReminderForPayment(payment)}
        onOpenFull={payment => {
          setDetailsPayment(null);
          navigation.navigate('PaymentDetail', {
            spaceId,
            paymentId: payment.paymentId,
            memberId: member.memberId,
            memberName: member.fullName,
          });
        }}
      />
      <PaymentReceivedConfirmModal
        visible={cardActions.confirmPayments.length > 0}
        payments={cardActions.confirmPayments}
        spaceName={spaceName}
        loading={cardActions.receivedConfirmLoading}
        onClose={cardActions.cancelConfirm}
        onConfirm={cardActions.confirmReceived}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    gap: spacing.sm,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  headerText: {
    flex: 1,
  },
  title: {
    ...typography.bodyStrong,
    color: colors.textPrimary,
  },
  subtitle: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    backgroundColor: colors.primary,
    borderRadius: 10,
    minHeight: 36,
    paddingHorizontal: spacing.sm,
  },
  addLabel: {
    ...typography.caption,
    color: colors.white,
    fontWeight: '700',
  },
  duesBox: {
    gap: 2,
  },
  duesDue: {
    ...typography.caption,
    color: '#D97706',
    fontWeight: '700',
  },
  duesClear: {
    ...typography.caption,
    color: colors.primaryDark,
    fontWeight: '700',
  },
  duesReview: {
    ...typography.caption,
    color: '#2563EB',
    fontWeight: '700',
  },
  duesOverdue: {
    ...typography.caption,
    color: '#DC2626',
    fontWeight: '700',
  },
  duesMuted: {
    ...typography.caption,
    color: colors.textSecondary,
  },
});
