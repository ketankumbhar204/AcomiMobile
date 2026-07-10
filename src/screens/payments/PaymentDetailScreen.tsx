import React, { useCallback, useLayoutEffect, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useFocusEffect, useNavigation, useRoute } from '@react-navigation/native';
import type {
  NativeStackNavigationProp,
  NativeStackScreenProps,
} from '@react-navigation/native-stack';
import { useTranslation } from 'react-i18next';
import { PaymentServiceUnavailableError, paymentsApi } from '../../api/paymentsApi';
import type { PaymentTimelineEventResponse, SpacePaymentResponse } from '../../api/types';
import { PaymentHistoryTimeline } from '../../components/payments/PaymentHistoryTimeline';
import { PaymentProofPreviewModal } from '../../components/payments/PaymentProofPreviewModal';
import { PaymentStatusBadge } from '../../components/payments/PaymentStatusBadge';
import { PaymentStatusCardFrame } from '../../components/payments/PaymentStatusCardFrame';
import { UniversalPaymentProofModal } from '../../components/payments/UniversalPaymentProofModal';
import { Button, EmptyState, HeaderBackButton, Screen, SkeletonCard } from '../../components/ui';
import type { MainStackParamList } from '../../navigation/types';
import { useToastStore } from '../../store/toastStore';
import { colors, spacing, typography } from '../../theme';
import { formatPaymentAmount, formatPaymentDueDate } from '../../utils/paymentHistory';
import {
  isAwaitingOwnerReview,
  isPaymentActionable,
  isPaymentProofEditable,
} from '../../utils/paymentStatus';

type Nav = NativeStackNavigationProp<MainStackParamList, 'PaymentDetail'>;
type Route = NativeStackScreenProps<MainStackParamList, 'PaymentDetail'>['route'];

export function PaymentDetailScreen() {
  const { t, i18n } = useTranslation();
  const navigation = useNavigation<Nav>();
  const route = useRoute<Route>();
  const { spaceId, paymentId } = route.params;
  const showToast = useToastStore(state => state.showToast);

  const [payment, setPayment] = useState<SpacePaymentResponse | null>(null);
  const [timeline, setTimeline] = useState<PaymentTimelineEventResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [serviceUnavailable, setServiceUnavailable] = useState(false);
  const [proofVisible, setProofVisible] = useState(false);
  const [proofModalMode, setProofModalMode] = useState<'submit' | 'edit'>('submit');
  const [proofPreviewVisible, setProofPreviewVisible] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setServiceUnavailable(false);
    try {
      const detail = await paymentsApi.getPayment(spaceId, paymentId);
      setPayment(detail);
      const timelineResponse = await paymentsApi.getPaymentTimeline(spaceId, paymentId);
      setTimeline(timelineResponse.events);
    } catch (err) {
      if (err instanceof PaymentServiceUnavailableError) {
        setServiceUnavailable(true);
        setPayment(null);
        return;
      }
      showToast(t('paymentCollection.errors.loadPayment'));
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

  const canPay = isPaymentActionable(payment.paymentStatus);
  const canEditProof = isPaymentProofEditable(payment.paymentStatus);
  const waitingReview = isAwaitingOwnerReview(payment.paymentStatus);

  return (
    <Screen scrollable={false} contentStyle={styles.content}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <PaymentStatusCardFrame status={payment.paymentStatus} style={styles.summaryCard}>
          <View style={styles.headerRow}>
            <View style={styles.headerMain}>
              <Text style={styles.title}>{payment.title}</Text>
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
          <Text style={styles.due}>
            {t('paymentCollection.dueDate', { date: formatPaymentDueDate(payment.dueDate) })}
          </Text>

          {waitingReview ? (
            <Text style={styles.waiting}>{t('paymentCollection.waitingApproval')}</Text>
          ) : null}

          {payment.paymentStatus === 'UPDATE_REQUESTED' ? (
            <>
              <Text style={styles.updateHint}>{t('paymentCollection.updateRequestedHint')}</Text>
              {payment.rejectionReason ? (
                <View style={styles.ownerRequestBox}>
                  <Text style={styles.ownerRequestLabel}>{t('paymentCollection.ownerRequest')}</Text>
                  <Text style={styles.ownerRequestText}>{payment.rejectionReason}</Text>
                </View>
              ) : null}
            </>
          ) : null}

          {payment.paymentStatus === 'REJECTED' && payment.rejectionReason ? (
            <Text style={styles.rejectionText}>
              {t('paymentCollection.rejectedReason', { reason: payment.rejectionReason })}
            </Text>
          ) : null}
        </PaymentStatusCardFrame>

        {canPay ? (
          <Button
            label={
              payment.paymentStatus === 'REJECTED' || payment.paymentStatus === 'UPDATE_REQUESTED'
                ? t('paymentCollection.updatePayment')
                : t('paymentCollection.payNow')
            }
            onPress={openSubmitProof}
            style={styles.action}
          />
        ) : null}

        {canEditProof ? (
          <>
            {payment.proofUrl ? (
              <Button
                label={t('paymentCollection.proof.viewProof')}
                variant="secondary"
                onPress={() => setProofPreviewVisible(true)}
                style={styles.action}
              />
            ) : null}
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
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: {
    flex: 1,
    padding: spacing.xl,
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
  due: { ...typography.body, color: colors.muted },
  waiting: {
    ...typography.body,
    color: colors.primaryDark,
    marginTop: spacing.sm,
  },
  updateHint: {
    ...typography.body,
    color: colors.muted,
    marginTop: spacing.sm,
  },
  ownerRequestBox: {
    marginTop: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: 8,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  ownerRequestLabel: {
    ...typography.caption,
    color: colors.muted,
    fontWeight: '600',
    marginBottom: spacing.xs,
  },
  ownerRequestText: {
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
});
