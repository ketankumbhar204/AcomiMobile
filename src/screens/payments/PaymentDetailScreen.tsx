import React, { useCallback, useLayoutEffect, useMemo, useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useFocusEffect, useNavigation, useRoute } from '@react-navigation/native';
import type {
  NativeStackNavigationProp,
  NativeStackScreenProps,
} from '@react-navigation/native-stack';
import { useTranslation } from 'react-i18next';
import { ChevronRight, FileText, TriangleAlert, WalletCards } from 'lucide-react-native';
import { PaymentServiceUnavailableError, paymentsApi } from '../../api/paymentsApi';
import { mealsApi } from '../../api/mealsApi';
import type {
  MemberMealActivityDayDetail,
  PaymentRejectionReason,
  PaymentTimelineEventResponse,
  SpacePaymentResponse,
} from '../../api/types';
import { MealSelectionSummary } from '../../components/meals/MealSelectionSummary';
import { PaymentDetailSummary } from '../../components/payments/PaymentDetailSummary';
import { PaymentHistoryTimeline } from '../../components/payments/PaymentHistoryTimeline';
import { PaymentNeedsUpdatePanel } from '../../components/payments/PaymentNeedsUpdatePanel';
import { PaymentProofPreviewModal } from '../../components/payments/PaymentProofPreviewModal';
import { PaymentReceivedConfirmModal } from '../../components/payments/PaymentReceivedConfirmModal';
import { PaymentReminderComposer } from '../../components/payments/PaymentReminderComposer';
import { PaymentRequestUpdateModal } from '../../components/payments/PaymentRequestUpdateModal';
import { UniversalPaymentProofModal } from '../../components/payments/UniversalPaymentProofModal';
import { StickyFormActions } from '../../components/progressive';
import { Button, EmptyState, HeaderBackButton, Screen, Skeleton, SkeletonCard } from '../../components/ui';
import { useSpacePermissions } from '../../hooks/useSpacePermissions';
import { useSpaceStore } from '../../store/spaceStore';
import type { MainStackParamList } from '../../navigation/types';
import { useToastStore } from '../../store/toastStore';
import { colors, radius, shadows, spacing, typography } from '../../theme';
import { canManagePayments } from '../../utils/dashboardFinancial';
import {
  canOwnerMarkPaymentReceived,
  canOwnerSendPaymentReminder,
} from '../../utils/ownerPaymentCardActions';
import { paymentReminderToastKey } from '../../utils/paymentReminderFeedback';
import { buildPaymentReminderMessage } from '../../utils/paymentReminderMessage';
import { firstWhatsAppPhone } from '../../utils/photoRequest';
import { openReminderWhatsApp } from '../../utils/paymentReminderLaunch';
import { invalidateDashboardQueries } from '../../utils/dashboardQueryCache';
import { invalidatePaymentsMonthCaches } from '../../utils/paymentsMonthCache';
import {
  buildMealSummaryFromDayDetails,
  countMealSummaryDays,
  displayMealPaymentTitle,
} from '../../utils/mealSelectionSummary';
import {
  paymentDetailContentGutter,
  paymentDetailScreenPadding,
} from './paymentDetailLayout';
import { resolvePaymentMealDetailDates } from '../../utils/paymentMealDayScope';
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
  const spaceName = useSpaceStore(state =>
    state.currentSpace?.spaceId === spaceId
      ? state.currentSpace.spaceName
      : state.selectedSpace?.id === spaceId
        ? state.selectedSpace.name
        : null,
  );
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
  const [sendingReminder, setSendingReminder] = useState(false);
  const [reminderOpen, setReminderOpen] = useState(false);
  const [reminderMessage, setReminderMessage] = useState('');
  const [reminderNotice, setReminderNotice] = useState('');
  const [rejectVisible, setRejectVisible] = useState(false);
  const [requestUpdateVisible, setRequestUpdateVisible] = useState(false);
  const [selectedReason, setSelectedReason] = useState<PaymentRejectionReason | null>(null);
  const [receivedVisible, setReceivedVisible] = useState(false);
  const [markingReceived, setMarkingReceived] = useState(false);
  const hasPaymentRef = React.useRef(false);
  const timelineCountRef = React.useRef(0);

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
      try {
        const timelineResponse = await paymentsApi.getPaymentTimeline(spaceId, paymentId);
        timelineCountRef.current = timelineResponse.events.length;
        setTimeline(timelineResponse.events);
      } catch (timelineError) {
        if (timelineError instanceof PaymentServiceUnavailableError) {
          throw timelineError;
        }
        if (timelineCountRef.current === 0) {
          setTimeline([]);
          showToast(t('paymentCollection.errors.loadTimeline'));
        }
      }

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
        setPayment(null);
        hasPaymentRef.current = false;
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

  const handleMarkReceived = useCallback(async () => {
    setMarkingReceived(true);
    try {
      const updated = await paymentsApi.markPaymentReceived(spaceId, paymentId);
      setPayment(updated);
      const timelineResponse = await paymentsApi.getPaymentTimeline(spaceId, paymentId);
      setTimeline(timelineResponse.events);
      invalidateDashboardQueries();
      if (updated.month) {
        invalidatePaymentsMonthCaches(spaceId, updated.month);
      }
      setReceivedVisible(false);
      showToast(t('paymentCollection.received.success'));
    } catch (err) {
      if (err instanceof PaymentServiceUnavailableError) {
        showToast(t('paymentCollection.serviceUnavailable.title'));
      } else {
        showToast(t('paymentCollection.received.failed'));
      }
    } finally {
      setMarkingReceived(false);
    }
  }, [paymentId, showToast, spaceId, t]);

  const handleSendReminder = useCallback(async () => {
    const message = reminderMessage.trim();
    if (!message) {
      return;
    }
    setSendingReminder(true);
    setReminderNotice('');
    try {
      const result = await paymentsApi.sendPaymentReminder(spaceId, paymentId);
      let launch: Awaited<ReturnType<typeof openReminderWhatsApp>> = 'invalid';
      try {
        launch = await openReminderWhatsApp(
          {
            ...result,
            internationalPhone:
              result.internationalPhone || firstWhatsAppPhone([payment?.memberMobile]),
          },
          message,
        );
      } catch {
        launch = 'failed';
      }
      if (result.inAppFailureCode === 'NOTIFICATION_FAILED') {
        showToast(t('paymentCollection.reminder.notificationFailed'));
      } else if (result.inAppFailureCode === 'MEMBER_NOT_ON_ACOMI') {
        showToast(t('paymentCollection.reminder.memberNotOnAcomi'));
      } else if (result.inAppRecorded && launch !== 'opened') {
        showToast(t('paymentCollection.reminder.inAppSaved'));
      }
      if (launch === 'opened') {
        showToast(
          t(
            result.inAppRecorded
              ? 'paymentCollection.reminder.openedWhatsApp'
              : 'paymentCollection.reminder.whatsAppReady',
          ),
        );
      } else if (launch === 'copied') {
        showToast(t('paymentCollection.reminder.copied'));
      } else if (launch === 'invalid') {
        setReminderNotice(
          t('paymentCollection.reminder.whatsAppUnavailable', {
            defaultValue:
              'This number can’t be opened in WhatsApp. You can still save the in-app reminder.',
          }),
        );
        showToast(t(paymentReminderToastKey('invalidRecipient')));
      } else {
        showToast(t('paymentCollection.reminder.whatsAppFailed'));
      }
      if (launch !== 'invalid') {
        setReminderOpen(false);
      }
      const timelineResponse = await paymentsApi.getPaymentTimeline(spaceId, paymentId);
      setTimeline(timelineResponse.events);
    } catch (err) {
      if (err instanceof PaymentServiceUnavailableError) {
        showToast(t('paymentCollection.serviceUnavailable.title'));
      } else {
        showToast(t('paymentCollection.reminder.failed'));
      }
    } finally {
      setSendingReminder(false);
    }
  }, [payment?.memberMobile, paymentId, reminderMessage, showToast, spaceId, t]);

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
    return displayMealPaymentTitle(payment.title, undefined, undefined, t('payments.mealPaymentTitle'));
  }, [payment, t]);

  const mealDaysCount = useMemo(
    () => (payment?.paymentType === 'MEAL' ? countMealSummaryDays(mealSummary) : 0),
    [mealSummary, payment?.paymentType],
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
      <Screen contentStyle={styles.loadingPad}>
        <View style={styles.skeletonWrap}>
          <Skeleton width="100%" height={72} borderRadius={18} />
          <SkeletonCard />
          <Skeleton width="100%" height={120} borderRadius={18} />
        </View>
      </Screen>
    );
  }

  if (serviceUnavailable) {
    return (
      <Screen contentStyle={styles.loadingPad}>
        <EmptyState
          Icon={TriangleAlert}
          title={t('paymentCollection.serviceUnavailable.title')}
          description={t('paymentCollection.serviceUnavailable.description')}
        />
      </Screen>
    );
  }

  if (!payment) {
    return (
      <Screen contentStyle={styles.loadingPad}>
        <EmptyState
          Icon={WalletCards}
          title={t('paymentCollection.errors.loadPayment')}
          description={t('paymentCollection.errors.loadPaymentRetry')}
        />
        <Button
          label={t('common.retry')}
          variant="secondary"
          onPress={() => void load()}
          style={styles.action}
        />
      </Screen>
    );
  }

  // Owners get review actions; customers keep pay / edit-proof actions.
  const canPay = !isOwnerOperator && isPaymentActionable(payment.paymentStatus);
  const canEditProof = !isOwnerOperator && isPaymentProofEditable(payment.paymentStatus);
  const waitingReview = isAwaitingOwnerReview(payment.paymentStatus);
  const canOwnerReview =
    isOwnerOperator && isOwnerReviewActionable(payment.paymentStatus);
  const canSendReminder =
    isOwnerOperator && canOwnerSendPaymentReminder(payment) && !waitingReview;
  const canMarkReceived =
    isOwnerOperator && canOwnerMarkPaymentReceived(payment.paymentStatus) && !waitingReview;
  const canViewProof = Boolean(payment.proofUrl);
  const remarks = payment.remarks?.trim() || '';
  const ownerNotes =
    payment.rejectionReason?.trim() &&
    (payment.paymentStatus === 'UPDATE_REQUESTED' ||
      payment.paymentStatus === 'REJECTED' ||
      isOwnerOperator)
      ? payment.rejectionReason.trim()
      : null;

  const hasStickyActions =
    canOwnerReview || canPay || canEditProof || canSendReminder || canMarkReceived;

  return (
    <Screen scrollable={false} contentStyle={styles.screen}>
      <View style={styles.flex}>
      <ScrollView
        style={styles.flex}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}>
        <PaymentDetailSummary
          payment={payment}
          spaceId={spaceId}
          memberName={memberName}
          spaceName={spaceName}
          title={displayTitle}
          mealDaysCount={payment.paymentType === 'MEAL' ? mealDaysCount : null}>
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

          {payment.description?.trim() ? (
            <View style={styles.messageBox}>
              <Text style={styles.messageLabel}>{t('paymentCollection.addRecord.description')}</Text>
              <Text style={styles.messageText}>{payment.description.trim()}</Text>
            </View>
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

          {isOwnerOperator && memberId ? (
            <Pressable
              onPress={openMemberProfile}
              accessibilityRole="button"
              accessibilityLabel={t('paymentCollection.detail.viewMember')}>
              <Text style={styles.memberLink}>{t('paymentCollection.detail.viewMember')}</Text>
            </Pressable>
          ) : null}
        </PaymentDetailSummary>

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

        {canViewProof ? (
          <Button
            label={t('paymentCollection.proof.viewProof')}
            variant="secondary"
            onPress={() => setProofPreviewVisible(true)}
            style={styles.action}
          />
        ) : null}

        <Pressable
          onPress={openTimeline}
          accessibilityRole="button"
          accessibilityLabel={t('paymentCollection.timeline.viewFull')}
          style={styles.timelineButton}>
          <FileText size={18} color={colors.teal} strokeWidth={2.2} />
          <Text style={styles.timelineLabel}>{t('paymentCollection.timeline.viewFull')}</Text>
          <ChevronRight size={18} color={colors.teal} strokeWidth={2.2} />
        </Pressable>

        <Text style={styles.sectionTitle}>{t('paymentCollection.timeline.recent')}</Text>
        <PaymentHistoryTimeline events={timeline} />
      </ScrollView>

      {hasStickyActions ? (
        <StickyFormActions>
          {canOwnerReview ? (
            <View style={styles.stickyStack}>
              <Button
                label={t('paymentCollection.approval.approve')}
                onPress={() => void handleReview('APPROVE')}
                loading={reviewing}
              />
              <Button
                label={t('paymentCollection.approval.needsUpdateAction')}
                variant="secondary"
                onPress={() => setRequestUpdateVisible(true)}
                disabled={reviewing}
              />
              <Button
                label={t('paymentCollection.approval.reject')}
                variant="secondary"
                onPress={() => setRejectVisible(true)}
                disabled={reviewing}
              />
            </View>
          ) : null}
          {canMarkReceived ? (
            <Button
              label={t('paymentCollection.received.action')}
              onPress={() => setReceivedVisible(true)}
              loading={markingReceived}
              disabled={reviewing || sendingReminder}
            />
          ) : null}
          {canSendReminder ? (
            <Button
              label={t('paymentCollection.reminder.send')}
              variant="secondary"
              onPress={() => {
                if (!payment) {
                  return;
                }
                setReminderNotice('');
                setReminderMessage(buildPaymentReminderMessage(payment));
                setReminderOpen(true);
              }}
              loading={sendingReminder}
              disabled={reviewing || markingReceived}
            />
          ) : null}
          {canPay && payment.paymentStatus !== 'UPDATE_REQUESTED' ? (
            <Button
              label={
                payment.paymentStatus === 'REJECTED'
                  ? t('paymentCollection.updatePayment')
                  : t('paymentCollection.payNow')
              }
              onPress={openSubmitProof}
            />
          ) : null}
          {canEditProof ? (
            <View style={styles.stickyStack}>
              <Button
                label={t('paymentCollection.proof.replaceProof')}
                variant="secondary"
                onPress={openEditProof}
              />
              <Button
                label={t('paymentCollection.proof.editDetails')}
                variant="secondary"
                onPress={openEditProof}
              />
            </View>
          ) : null}
        </StickyFormActions>
      ) : null}
      </View>

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
        fileId={payment.proofFileId}
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

      <PaymentReminderComposer
        visible={reminderOpen}
        memberName={payment.memberName || memberName}
        phone={firstWhatsAppPhone([payment.memberMobile])}
        message={reminderMessage}
        notice={reminderNotice}
        submitting={sendingReminder}
        onChangeMessage={setReminderMessage}
        onCancel={() => setReminderOpen(false)}
        onConfirm={() => void handleSendReminder()}
      />
      <PaymentReceivedConfirmModal
        visible={receivedVisible}
        payments={[payment]}
        loading={markingReceived}
        onClose={() => setReceivedVisible(false)}
        onConfirm={() => void handleMarkReceived()}
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
  screen: {
    flex: 1,
    padding: paymentDetailScreenPadding,
  },
  loadingPad: {
    flex: 1,
    padding: paymentDetailScreenPadding,
    paddingTop: spacing.md,
    paddingHorizontal: paymentDetailContentGutter,
  },
  skeletonWrap: {
    gap: spacing.md,
  },
  scrollContent: {
    paddingTop: spacing.md,
    paddingHorizontal: paymentDetailContentGutter,
    paddingBottom: spacing.xxl,
    gap: spacing.md,
  },
  flex: {
    flex: 1,
  },
  stickyStack: {
    gap: spacing.sm,
  },
  memberLink: {
    ...typography.bodyStrong,
    color: colors.teal,
    marginTop: spacing.sm,
  },
  mealSummaryWrap: {
    marginTop: spacing.xs,
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
  action: {
    marginTop: 0,
  },
  timelineButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    minHeight: 52,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    backgroundColor: colors.lightGreen,
    borderRadius: radius.button,
    borderWidth: 1,
    borderColor: colors.border,
  },
  timelineLabel: {
    ...typography.bodyStrong,
    flex: 1,
    color: colors.teal,
    fontSize: 15,
  },
  sectionTitle: {
    ...typography.bodyStrong,
    fontSize: 16,
    marginTop: spacing.xs,
  },
  rejectOverlay: {
    flex: 1,
    backgroundColor: colors.overlayScrim,
    justifyContent: 'center',
    padding: spacing.xl,
  },
  rejectCard: {
    ...shadows.raised,
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
