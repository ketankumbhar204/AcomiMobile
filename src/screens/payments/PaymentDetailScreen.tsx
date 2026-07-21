import React, { useCallback, useLayoutEffect, useMemo, useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useFocusEffect, useNavigation, useRoute } from '@react-navigation/native';
import type {
  NativeStackNavigationProp,
  NativeStackScreenProps,
} from '@react-navigation/native-stack';
import { useTranslation } from 'react-i18next';
import { PaymentServiceUnavailableError, paymentsApi } from '../../api/paymentsApi';
import { mealsApi } from '../../api/mealsApi';
import type {
  MemberMealActivityDayDetail,
  PaymentRejectionReason,
  PaymentTimelineEventResponse,
  SpacePaymentResponse,
} from '../../api/types';
import { MealSelectionSummary } from '../../components/meals/MealSelectionSummary';
import { PaymentHistoryTimeline } from '../../components/payments/PaymentHistoryTimeline';
import { PaymentNeedsUpdatePanel } from '../../components/payments/PaymentNeedsUpdatePanel';
import { PaymentProofPreviewModal } from '../../components/payments/PaymentProofPreviewModal';
import { PaymentRequestUpdateModal } from '../../components/payments/PaymentRequestUpdateModal';
import { PaymentStatusBadge } from '../../components/payments/PaymentStatusBadge';
import { PaymentStatusCardFrame } from '../../components/payments/PaymentStatusCardFrame';
import { UniversalPaymentProofModal } from '../../components/payments/UniversalPaymentProofModal';
import { Button, EmptyState, HeaderBackButton, Screen, SkeletonCard } from '../../components/ui';
import { useSpacePermissions } from '../../hooks/useSpacePermissions';
import type { MainStackParamList } from '../../navigation/types';
import { useToastStore } from '../../store/toastStore';
import { colors, radius, spacing, typography } from '../../theme';
import { canManagePayments } from '../../utils/dashboardFinancial';
import { invalidateDashboardQueries } from '../../utils/dashboardQueryCache';
import { invalidatePaymentsMonthCaches } from '../../utils/paymentsMonthCache';
import {
  buildMealSummaryFromDayDetails,
  countMealSummaryDays,
  displayMealPaymentTitle,
} from '../../utils/mealSelectionSummary';
import { buildPaymentDetailMetaRows } from '../../utils/paymentDetailMeta';
import { resolvePaymentMealDetailDates } from '../../utils/paymentMealDayScope';
import { formatBillingPeriod } from '../../utils/paymentProofPolicy';
import { formatPaymentAmount } from '../../utils/paymentHistory';
import {
  isAwaitingOwnerReview,
  isOwnerReviewActionable,
  isPaymentActionable,
  isPaymentProofEditable,
} from '../../utils/paymentStatus';

const REJECTION_REASONS: PaymentRejectionReason[] = [
  'PAYMENT_AMOUNT_MISMATCH',
  'WRONG_SCREENSHOT',
  'INVALID_UTR',
  'OTHER',
];

type Nav = NativeStackNavigationProp<MainStackParamList, 'PaymentDetail'>;
type Route = NativeStackScreenProps<MainStackParamList, 'PaymentDetail'>['route'];

export function PaymentDetailScreen() {
  const { t, i18n } = useTranslation();
  const navigation = useNavigation<Nav>();
  const route = useRoute<Route>();
  const { spaceId, paymentId, memberId: routeMemberId, memberName: routeMemberName } =
    route.params;
  const showToast = useToastStore(state => state.showToast);
  const permissions = useSpacePermissions(spaceId);
  const isOwnerOperator = canManagePayments(permissions.membershipRole);

  const [payment, setPayment] = useState<SpacePaymentResponse | null>(null);
  const [timeline, setTimeline] = useState<PaymentTimelineEventResponse[]>([]);
  const [mealDayDetails, setMealDayDetails] = useState<MemberMealActivityDayDetail[]>([]);
  const [loading, setLoading] = useState(true);
  const [serviceUnavailable, setServiceUnavailable] = useState(false);
  const [proofVisible, setProofVisible] = useState(false);
  const [proofModalMode, setProofModalMode] = useState<'submit' | 'edit'>('submit');
  const [proofPreviewVisible, setProofPreviewVisible] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [reviewing, setReviewing] = useState(false);
  const [rejectVisible, setRejectVisible] = useState(false);
  const [requestUpdateVisible, setRequestUpdateVisible] = useState(false);
  const [selectedReason, setSelectedReason] = useState<PaymentRejectionReason | null>(null);
  const hasPaymentRef = React.useRef(false);

  const load = useCallback(async () => {
    const keepExisting = hasPaymentRef.current;
    if (!keepExisting) {
      setLoading(true);
    }
    setServiceUnavailable(false);
    try {
      const detail = await paymentsApi.getPayment(spaceId, paymentId);
      setPayment(detail);
      hasPaymentRef.current = true;
      const timelineResponse = await paymentsApi.getPaymentTimeline(spaceId, paymentId);
      setTimeline(timelineResponse.events);

      const mealDates = resolvePaymentMealDetailDates(detail);
      if (detail.paymentType === 'MEAL' && detail.memberId && mealDates.length > 0) {
        try {
          const dayDetails = await Promise.all(
            mealDates.map(date =>
              mealsApi
                .getMemberMealActivityDay(spaceId, detail.memberId, date)
                .catch(() => null),
            ),
          );
          setMealDayDetails(
            dayDetails.filter((row): row is MemberMealActivityDayDetail => row != null),
          );
        } catch {
          setMealDayDetails([]);
        }
      } else {
        setMealDayDetails([]);
      }
    } catch (err) {
      if (err instanceof PaymentServiceUnavailableError) {
        setServiceUnavailable(true);
        if (!keepExisting) {
          setPayment(null);
          hasPaymentRef.current = false;
        }
        return;
      }
      if (!keepExisting) {
        showToast(t('paymentCollection.errors.loadPayment'));
      }
    } finally {
      setLoading(false);
    }
  }, [paymentId, showToast, spaceId, t]);

  useLayoutEffect(() => {
    navigation.setOptions({
      title: t('paymentCollection.detail.title'),
      headerBackVisible: false,
      headerLeft: () => <HeaderBackButton />,
    });
  }, [i18n.language, navigation, t]);

  useFocusEffect(
    useCallback(() => {
      void load();
    }, [load]),
  );

  const handleSubmitProof = async (
    payload: Parameters<typeof paymentsApi.submitProof>[2],
  ) => {
    setSubmitting(true);
    try {
      const updated = await paymentsApi.submitProof(spaceId, paymentId, payload);
      setPayment(updated);
      const timelineResponse = await paymentsApi.getPaymentTimeline(spaceId, paymentId);
      setTimeline(timelineResponse.events);
      setProofVisible(false);
      invalidateDashboardQueries();
      if (updated.month) {
        invalidatePaymentsMonthCaches(spaceId, updated.month);
      }
      showToast(
        proofModalMode === 'edit'
          ? t('paymentCollection.proof.updated')
          : t('paymentCollection.proof.submitted'),
      );
    } catch (err) {
      if (err instanceof PaymentServiceUnavailableError) {
        showToast(t('paymentCollection.serviceUnavailable.title'));
      } else {
        showToast(t('paymentCollection.errors.submitProof'));
      }
    } finally {
      setSubmitting(false);
    }
  };

  const openSubmitProof = () => {
    setProofModalMode('submit');
    setProofVisible(true);
  };

  const openEditProof = () => {
    setProofModalMode('edit');
    setProofVisible(true);
  };

  const openTimeline = () => {
    navigation.navigate('PaymentHistory', { spaceId, paymentId });
  };

  const handleReview = useCallback(
    async (
      action: 'APPROVE' | 'REJECT' | 'REQUEST_UPDATE',
      remarks?: string,
      code?: PaymentRejectionReason,
    ) => {
      setReviewing(true);
      try {
        const updated = await paymentsApi.reviewPayment(spaceId, paymentId, {
          action,
          remarks,
          rejectionCode: code,
        });
        setPayment(updated);
        const timelineResponse = await paymentsApi.getPaymentTimeline(spaceId, paymentId);
        setTimeline(timelineResponse.events);
        invalidateDashboardQueries();
        if (updated.month) {
          invalidatePaymentsMonthCaches(spaceId, updated.month);
        }
        showToast(
          action === 'APPROVE'
            ? t('paymentCollection.review.approved')
            : action === 'REJECT'
              ? t('paymentCollection.review.rejected')
              : t('paymentCollection.review.updateRequested'),
        );
      } catch (err) {
        if (err instanceof PaymentServiceUnavailableError) {
          showToast(t('paymentCollection.serviceUnavailable.title'));
        } else {
          showToast(t('paymentCollection.errors.review'));
        }
      } finally {
        setReviewing(false);
      }
    },
    [paymentId, showToast, spaceId, t],
  );

  const mealSummary = useMemo(() => {
    if (!payment || payment.paymentType !== 'MEAL' || mealDayDetails.length === 0) {
      return null;
    }
    const model = buildMealSummaryFromDayDetails(mealDayDetails);
    if (!model) {
      return null;
    }
    return {
      ...model,
      totalAmount: Number(payment.amount),
      currencyCode: payment.currencyCode || model.currencyCode,
    };
  }, [mealDayDetails, payment]);

  const displayTitle = useMemo(() => {
    if (!payment) {
      return '';
    }
    if (payment.paymentType !== 'MEAL') {
      return payment.title;
    }
    return displayMealPaymentTitle(payment.title);
  }, [payment]);

  const billingPeriodLabel = useMemo(() => {
    if (!payment?.month) {
      return null;
    }
    return formatBillingPeriod(payment.month, i18n.language);
  }, [i18n.language, payment?.month]);

  const mealDaysCount = useMemo(
    () => (payment?.paymentType === 'MEAL' ? countMealSummaryDays(mealSummary) : 0),
    [mealSummary, payment?.paymentType],
  );

  const metaRows = useMemo(
    () =>
      payment
        ? buildPaymentDetailMetaRows(payment, t, {
            billingPeriodLabel:
              payment.paymentType === 'MEAL' ? billingPeriodLabel : null,
            mealDaysCount: payment.paymentType === 'MEAL' ? mealDaysCount : null,
          })
        : [],
    [billingPeriodLabel, mealDaysCount, payment, t],
  );

  const memberId = payment?.memberId ?? routeMemberId;
  const memberName = payment?.memberName || routeMemberName || '';
  const payerMessageLabel =
    permissions.spaceType === 'MESS'
      ? t('paymentCollection.detail.customerMessage')
      : t('paymentCollection.detail.tenantMessage');

  const openMemberProfile = useCallback(() => {
    if (!memberId) {
      return;
    }
    navigation.navigate('MemberDetails', { spaceId, memberId });
  }, [memberId, navigation, spaceId]);

  if (loading && !payment && !serviceUnavailable) {
    return (
      <Screen contentStyle={styles.content}>
        <SkeletonCard />
      </Screen>
    );
  }

  if (serviceUnavailable) {
    return (
      <Screen contentStyle={styles.content}>
        <EmptyState
          title={t('paymentCollection.serviceUnavailable.title')}
          description={t('paymentCollection.serviceUnavailable.description')}
          icon="⚠️"
        />
      </Screen>
    );
  }

  if (!payment) {
    return (
      <Screen contentStyle={styles.content}>
        <Text style={styles.error}>{t('paymentCollection.errors.loadPayment')}</Text>
      </Screen>
    );
  }

  // Owners get review actions; customers keep pay / edit-proof actions.
  const canPay = !isOwnerOperator && isPaymentActionable(payment.paymentStatus);
  const canEditProof = !isOwnerOperator && isPaymentProofEditable(payment.paymentStatus);
  const waitingReview = isAwaitingOwnerReview(payment.paymentStatus);
  const canOwnerReview =
    isOwnerOperator && isOwnerReviewActionable(payment.paymentStatus);
  const canViewProof = Boolean(payment.proofUrl);
  const remarks = payment.remarks?.trim() || '';
  const ownerNotes =
    payment.rejectionReason?.trim() &&
    (payment.paymentStatus === 'UPDATE_REQUESTED' ||
      payment.paymentStatus === 'REJECTED' ||
      isOwnerOperator)
      ? payment.rejectionReason.trim()
      : null;

  return (
    <Screen scrollable={false} contentStyle={styles.content}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {isOwnerOperator && memberId ? (
          <Pressable
            onPress={openMemberProfile}
            style={({ pressed }) => [styles.memberCard, pressed && styles.memberCardPressed]}
            accessibilityRole="button"
            accessibilityLabel={t('paymentCollection.detail.viewMember')}>
            <View style={styles.memberMain}>
              <Text style={styles.memberName} numberOfLines={1}>
                {memberName || t('paymentCollection.memberPayments.title')}
              </Text>
              <Text style={styles.memberRole} numberOfLines={1}>
                {permissions.spaceType === 'MESS'
                  ? t('spaces.roles.CUSTOMER')
                  : t('spaces.roles.TENANT')}
              </Text>
            </View>
            <Text style={styles.viewMemberLink}>{t('paymentCollection.detail.viewMember')} ›</Text>
          </Pressable>
        ) : null}

        <PaymentStatusCardFrame status={payment.paymentStatus} style={styles.summaryCard}>
          <View style={styles.headerRow}>
            <View style={styles.headerMain}>
              <Text style={styles.title}>{displayTitle}</Text>
              <Text style={styles.category}>
                {t(`paymentCollection.type.${payment.paymentType}`)} ·{' '}
                {t(`paymentCollection.category.${payment.paymentCategory}`)}
              </Text>
            </View>
            <PaymentStatusBadge status={payment.paymentStatus} />
          </View>
          {payment.targetLabel ? <Text style={styles.target}>{payment.targetLabel}</Text> : null}
          <Text style={styles.amount}>
            {formatPaymentAmount(payment.amount, payment.currencyCode)}
          </Text>

          <View style={styles.metaBlock}>
            {metaRows.map(row => (
              <View key={row.key} style={styles.metaRow}>
                <Text style={styles.metaLabel}>{t(row.labelKey)}</Text>
                <Text style={styles.metaValue}>{row.value}</Text>
              </View>
            ))}
          </View>

          {waitingReview && !isOwnerOperator ? (
            <Text style={styles.waiting}>{t('paymentCollection.waitingApproval')}</Text>
          ) : null}

          {payment.paymentStatus === 'UPDATE_REQUESTED' ? (
            <PaymentNeedsUpdatePanel
              ownerRequest={ownerNotes}
              showCta={!isOwnerOperator}
              onUpdatePress={openSubmitProof}
            />
          ) : null}

          {payment.paymentStatus === 'REJECTED' && ownerNotes ? (
            <Text style={styles.rejectionText}>
              {t('paymentCollection.rejectedReason', { reason: ownerNotes })}
            </Text>
          ) : null}

          {remarks ? (
            <View style={styles.messageBox}>
              <Text style={styles.messageLabel}>{payerMessageLabel}</Text>
              <Text style={styles.messageText}>{remarks}</Text>
            </View>
          ) : null}

          {ownerNotes &&
          payment.paymentStatus !== 'UPDATE_REQUESTED' &&
          payment.paymentStatus !== 'REJECTED' ? (
            <View style={styles.messageBox}>
              <Text style={styles.messageLabel}>{t('paymentCollection.detail.ownerNotes')}</Text>
              <Text style={styles.messageText}>{ownerNotes}</Text>
            </View>
          ) : null}
        </PaymentStatusCardFrame>

        {mealSummary ? (
          <View style={styles.mealSummaryWrap}>
            <MealSelectionSummary
              model={mealSummary}
              variant="detailed"
              showTotals
              title={t('meals.summary.dayBreakdownTitle')}
              onDayPress={
                memberId
                  ? date =>
                      navigation.navigate('DayMealPaymentDetail', {
                        spaceId,
                        memberId,
                        date,
                        memberName: memberName || undefined,
                      })
                  : undefined
              }
            />
          </View>
        ) : null}

        {canOwnerReview ? (
          <View style={styles.ownerActions}>
            <Button
              label={t('paymentCollection.approval.approve')}
              onPress={() => void handleReview('APPROVE')}
              loading={reviewing}
              style={styles.action}
            />
            <Button
              label={t('paymentCollection.approval.needsUpdateAction')}
              variant="secondary"
              onPress={() => setRequestUpdateVisible(true)}
              disabled={reviewing}
              style={styles.action}
            />
            <Button
              label={t('paymentCollection.approval.reject')}
              variant="secondary"
              onPress={() => setRejectVisible(true)}
              disabled={reviewing}
              style={styles.action}
            />
          </View>
        ) : null}

        {canPay && payment.paymentStatus !== 'UPDATE_REQUESTED' ? (
          <Button
            label={
              payment.paymentStatus === 'REJECTED'
                ? t('paymentCollection.updatePayment')
                : t('paymentCollection.payNow')
            }
            onPress={openSubmitProof}
            style={styles.action}
          />
        ) : null}

        {canViewProof ? (
          <Button
            label={t('paymentCollection.proof.viewProof')}
            variant="secondary"
            onPress={() => setProofPreviewVisible(true)}
            style={styles.action}
          />
        ) : null}

        {canEditProof ? (
          <>
            <Button
              label={t('paymentCollection.proof.replaceProof')}
              variant="secondary"
              onPress={openEditProof}
              style={styles.action}
            />
            <Button
              label={t('paymentCollection.proof.editDetails')}
              variant="secondary"
              onPress={openEditProof}
              style={styles.action}
            />
          </>
        ) : null}

        <Button
          label={t('paymentCollection.timeline.viewFull')}
          variant="secondary"
          onPress={openTimeline}
          style={styles.action}
        />

        <Text style={styles.sectionTitle}>{t('paymentCollection.timeline.recent')}</Text>
        <PaymentHistoryTimeline events={timeline} />
      </ScrollView>

      <UniversalPaymentProofModal
        visible={proofVisible}
        payment={payment}
        mode={proofModalMode}
        submitting={submitting}
        onClose={() => setProofVisible(false)}
        onSubmit={payload => void handleSubmitProof(payload)}
      />

      <PaymentProofPreviewModal
        visible={proofPreviewVisible}
        proofUrl={payment.proofUrl}
        onClose={() => setProofPreviewVisible(false)}
      />

      <PaymentRequestUpdateModal
        visible={requestUpdateVisible}
        reviewing={reviewing}
        onClose={() => setRequestUpdateVisible(false)}
        onConfirm={async message => {
          await handleReview('REQUEST_UPDATE', message);
          setRequestUpdateVisible(false);
        }}
      />

      <Modal visible={rejectVisible} transparent animationType="fade">
        <View style={styles.rejectOverlay}>
          <View style={styles.rejectCard}>
            <Text style={styles.rejectTitle}>{t('paymentCollection.approval.reject')}</Text>
            {REJECTION_REASONS.map(code => (
              <Pressable
                key={code}
                style={[
                  styles.rejectReason,
                  selectedReason === code && styles.rejectReasonSelected,
                ]}
                onPress={() => setSelectedReason(code)}>
                <Text style={styles.rejectReasonLabel}>
                  {t(`paymentCollection.rejection.${code}`)}
                </Text>
              </Pressable>
            ))}
            <View style={styles.rejectActions}>
              <Button
                label={t('common.cancel')}
                variant="secondary"
                onPress={() => {
                  setRejectVisible(false);
                  setSelectedReason(null);
                }}
                style={styles.rejectActionBtn}
              />
              <Button
                label={t('paymentCollection.approval.reject')}
                onPress={() => {
                  if (!selectedReason) {
                    return;
                  }
                  const label = t(`paymentCollection.rejection.${selectedReason}`);
                  setRejectVisible(false);
                  void handleReview('REJECT', label, selectedReason).finally(() =>
                    setSelectedReason(null),
                  );
                }}
                disabled={!selectedReason || reviewing}
                loading={reviewing}
                style={styles.rejectActionBtn}
              />
            </View>
          </View>
        </View>
      </Modal>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: {
    flex: 1,
    padding: spacing.xl,
  },
  memberCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.card,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  memberCardPressed: {
    opacity: 0.85,
  },
  memberMain: {
    flex: 1,
    minWidth: 0,
  },
  memberName: {
    ...typography.bodyStrong,
  },
  memberRole: {
    ...typography.caption,
    color: colors.muted,
    marginTop: 2,
  },
  viewMemberLink: {
    ...typography.caption,
    color: colors.primaryDark,
    fontWeight: '700',
  },
  summaryCard: {
    padding: spacing.lg,
    marginBottom: spacing.md,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: spacing.sm,
    marginBottom: spacing.xs,
  },
  headerMain: {
    flex: 1,
    minWidth: 0,
  },
  title: { ...typography.h2 },
  category: { ...typography.caption, color: colors.muted, marginTop: spacing.xxs },
  target: { ...typography.caption, color: colors.muted, marginTop: spacing.sm },
  amount: { ...typography.h1, marginTop: spacing.sm, marginBottom: spacing.xs },
  mealSummaryWrap: {
    marginTop: spacing.md,
    marginBottom: spacing.md,
  },
  ownerActions: {
    marginBottom: spacing.sm,
  },
  metaBlock: {
    marginTop: spacing.md,
    gap: spacing.xs,
  },
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: spacing.md,
  },
  metaLabel: {
    ...typography.caption,
    color: colors.muted,
    flexShrink: 0,
  },
  metaValue: {
    ...typography.caption,
    color: colors.textPrimary,
    fontWeight: '600',
    flex: 1,
    textAlign: 'right',
  },
  waiting: {
    ...typography.body,
    color: colors.primaryDark,
    marginTop: spacing.sm,
  },
  messageBox: {
    marginTop: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: 8,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  messageLabel: {
    ...typography.caption,
    color: colors.muted,
    fontWeight: '600',
    marginBottom: spacing.xs,
  },
  messageText: {
    ...typography.body,
    color: colors.textPrimary,
  },
  rejectionText: {
    ...typography.body,
    color: '#991B1B',
    marginTop: spacing.md,
  },
  action: { marginTop: spacing.md },
  sectionTitle: { ...typography.h3, marginTop: spacing.xl, marginBottom: spacing.sm },
  error: { ...typography.body, color: '#DC2626' },
  rejectOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'center',
    padding: spacing.xl,
  },
  rejectCard: {
    backgroundColor: colors.white,
    borderRadius: radius.card,
    padding: spacing.lg,
  },
  rejectTitle: {
    ...typography.h3,
    marginBottom: spacing.md,
  },
  rejectReason: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.card,
    padding: spacing.md,
    marginBottom: spacing.sm,
  },
  rejectReasonSelected: {
    borderColor: colors.primary,
    backgroundColor: colors.lightGreen,
  },
  rejectReasonLabel: {
    ...typography.body,
  },
  rejectActions: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.md,
  },
  rejectActionBtn: {
    flex: 1,
  },
});
