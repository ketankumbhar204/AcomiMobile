import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useTranslation } from 'react-i18next';
import { Plus } from 'lucide-react-native';
import type {
  MemberDetailsResponse,
  PaymentRejectionReason,
  PaymentReviewAction,
  SpacePaymentResponse,
} from '../../api/types';
import { PaymentServiceUnavailableError, paymentsApi } from '../../api/paymentsApi';
import { OwnerPaymentCardActions } from '../payments/OwnerPaymentCardActions';
import { UniversalPaymentProofModal } from '../payments/UniversalPaymentProofModal';
import { Button } from '../ui';
import { PaymentDetailsSheet } from '../payments/PaymentDetailsSheet';
import { PaymentReviewActions } from '../payments/PaymentReviewActions';
import { UniversalPaymentCard } from '../payments/UniversalPaymentCard';
import { EmptyState, SkeletonCard } from '../ui';
import { PaymentReceivedConfirmModal } from '../payments/PaymentReceivedConfirmModal';
import { PaymentReminderComposer } from '../payments/PaymentReminderComposer';
import { useOwnerPaymentCardActions } from '../../hooks/useOwnerPaymentCardActions';
import { useSpaceStore } from '../../store/spaceStore';
import { useToastStore } from '../../store/toastStore';
import { useUniversalPayments } from '../../hooks/useUniversalPayments';
import type { MainStackParamList } from '../../navigation/types';
import { colors, spacing, typography } from '../../theme';
import { canManagePayments, currentMonthKey } from '../../utils/dashboardFinancial';
import { paymentAfterReview } from '../../utils/paymentReviewRows';
import { publishPaymentUpdated } from '../../utils/paymentUpdates';
import { isAwaitingOwnerReview, isPaymentProofEditable } from '../../utils/paymentStatus';
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
    .filter(
      payment =>
        !isAwaitingOwnerReview(payment.paymentStatus) &&
        payment.paymentStatus !== 'PAID' &&
        (payment.outstandingAmount ?? 0) > 0 &&
        Boolean(payment.dueDate),
    )
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
  const showToast = useToastStore(state => state.showToast);
  const [reviewingId, setReviewingId] = useState<string | null>(null);
  const month = currentMonthKey();
  const [ledger, setLedger] = useState<MemberDuesSnapshot | null>(null);
  const [detailsPayment, setDetailsPayment] = useState<SpacePaymentResponse | null>(null);
  const [proofOpen, setProofOpen] = useState(false);
  const [submittingProof, setSubmittingProof] = useState(false);
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

  const reviewPayment = useCallback(
    async (
      paymentId: string,
      action: PaymentReviewAction,
      remarks?: string,
      rejectionCode?: PaymentRejectionReason,
    ) => {
      setReviewingId(paymentId);
      try {
        const updated = await paymentsApi.reviewPayment(spaceId, paymentId, {
          action,
          remarks,
          rejectionCode,
        });
        const patched = paymentAfterReview(updated, action);
        publishPaymentUpdated({
          ...patched,
          spaceId: patched.spaceId || spaceId,
          month: patched.month || month,
        });
        showToast(
          t(
            action === 'APPROVE'
              ? 'paymentCollection.review.approved'
              : action === 'REJECT'
                ? 'paymentCollection.review.rejected'
                : 'paymentCollection.review.updateRequested',
          ),
        );
        await reload();
      } catch (err) {
        showToast(t('paymentCollection.errors.review'));
        throw err;
      } finally {
        setReviewingId(null);
      }
    },
    [month, reload, showToast, spaceId, t],
  );

  const reviewActionsFor = useCallback(
    (payment: SpacePaymentResponse) => (
      <PaymentReviewActions
        reviewing={reviewingId === payment.paymentId}
        onApprove={() => void reviewPayment(payment.paymentId, 'APPROVE')}
        onReject={(code, reason) => void reviewPayment(payment.paymentId, 'REJECT', reason, code)}
        onRequestUpdate={message => reviewPayment(payment.paymentId, 'REQUEST_UPDATE', message)}
      />
    ),
    [reviewPayment, reviewingId],
  );

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
  const openPayment = detailsPayment
    ? payments.find(row => row.paymentId === detailsPayment.paymentId) ?? detailsPayment
    : null;
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
                canManage
                  ? isAwaitingOwnerReview(payment.paymentStatus)
                    ? reviewActionsFor(payment)
                    : (
                      <OwnerPaymentCardActions
                        showReceived={canOwnerMarkPaymentReceived(payment.paymentStatus)}
                        showReminder={canOwnerSendPaymentReminder(payment)}
                        receivedLoading={cardActions.isProcessing(payment.paymentId, 'received')}
                        reminderLoading={cardActions.isProcessing(payment.paymentId, 'reminder')}
                        onReceived={() => cardActions.requestReceivedForPayment(payment)}
                        onReminder={() => cardActions.sendReminderForPayment(payment)}
                      />
                    )
                  : undefined
              }
            />
          ))
        : null}
      <PaymentDetailsSheet
        payment={openPayment}
        spaceId={spaceId}
        spaceName={spaceName}
        receivedLoading={
          openPayment != null && cardActions.isProcessing(openPayment.paymentId, 'received')
        }
        reminderLoading={
          openPayment != null && cardActions.isProcessing(openPayment.paymentId, 'reminder')
        }
        onClose={() => setDetailsPayment(null)}
        showOwnerActions={canManage}
        reviewActions={
          canManage && openPayment && isAwaitingOwnerReview(openPayment.paymentStatus)
            ? reviewActionsFor(openPayment)
            : undefined
        }
        onReceived={payment => cardActions.requestReceivedForPayment(payment)}
        onReminder={payment => cardActions.sendReminderForPayment(payment)}
        memberProofActions={
          !canManage && openPayment && isPaymentProofEditable(openPayment.paymentStatus) ? (
            <>
              <Button
                label={t('paymentCollection.proof.replaceProof')}
                variant="secondary"
                onPress={() => setProofOpen(true)}
              />
              <Button
                label={t('paymentCollection.proof.editDetails')}
                variant="secondary"
                onPress={() => setProofOpen(true)}
              />
            </>
          ) : undefined
        }
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
      <PaymentReminderComposer
        visible={cardActions.reminderDraft != null}
        memberName={cardActions.reminderDraft?.memberName || member.fullName}
        phone={cardActions.reminderPhone}
        message={cardActions.reminderMessage}
        notice={cardActions.reminderNotice}
        submitting={
          cardActions.reminderDraft != null &&
          cardActions.isProcessing(cardActions.reminderDraft.paymentId, 'reminder')
        }
        onChangeMessage={cardActions.setReminderMessage}
        onCancel={cardActions.cancelReminder}
        onConfirm={cardActions.confirmReminder}
      />
      <PaymentReceivedConfirmModal
        visible={cardActions.confirmPayments.length > 0}
        payments={cardActions.confirmPayments}
        spaceName={spaceName}
        loading={cardActions.receivedConfirmLoading}
        onClose={cardActions.cancelConfirm}
        onConfirm={cardActions.confirmReceived}
      />
      <UniversalPaymentProofModal
        visible={proofOpen && openPayment != null && !canManage}
        payment={openPayment}
        mode="edit"
        submitting={submittingProof}
        onClose={() => setProofOpen(false)}
        onSubmit={payload => {
          if (!openPayment) {
            return;
          }
          setSubmittingProof(true);
          void paymentsApi
            .submitProof(spaceId, openPayment.paymentId, payload)
            .then(async updated => {
              setProofOpen(false);
              const patched = {
                ...updated,
                spaceId: updated.spaceId || spaceId,
                month: updated.month || month,
              };
              setDetailsPayment(patched);
              publishPaymentUpdated(patched);
              showToast(t('paymentCollection.proof.updated'));
              await reload();
            })
            .catch(err => {
              showToast(
                err instanceof PaymentServiceUnavailableError
                  ? t('paymentCollection.serviceUnavailable.title')
                  : t('paymentCollection.errors.submitProof'),
              );
            })
            .finally(() => setSubmittingProof(false));
        }}
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
