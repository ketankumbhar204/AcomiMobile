import React, { useCallback, useLayoutEffect, useState } from 'react';
import { ScrollView, StyleSheet, Text } from 'react-native';
import { useFocusEffect, useNavigation, useRoute } from '@react-navigation/native';
import type {
  NativeStackNavigationProp,
  NativeStackScreenProps,
} from '@react-navigation/native-stack';
import { useTranslation } from 'react-i18next';
import { PaymentServiceUnavailableError, paymentsApi } from '../../api/paymentsApi';
import type { PaymentTimelineEventResponse, SpacePaymentResponse } from '../../api/types';
import { PaymentHistoryTimeline } from '../../components/payments/PaymentHistoryTimeline';
import { UniversalPaymentProofModal } from '../../components/payments/UniversalPaymentProofModal';
import { Button, EmptyState, HeaderBackButton, Screen, SkeletonCard } from '../../components/ui';
import type { MainStackParamList } from '../../navigation/types';
import { useToastStore } from '../../store/toastStore';
import { colors, spacing, typography } from '../../theme';
import { formatPaymentAmount, formatPaymentDueDate } from '../../utils/paymentHistory';
import { isAwaitingOwnerReview, isPaymentActionable } from '../../utils/paymentStatus';

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
      showToast(t('paymentCollection.proof.submitted'));
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
  const waitingReview = isAwaitingOwnerReview(payment.paymentStatus);

  return (
    <Screen scrollable={false} contentStyle={styles.content}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <Text style={styles.title}>{payment.title}</Text>
        <Text style={styles.category}>
          {t(`paymentCollection.type.${payment.paymentType}`)} ·{' '}
          {t(`paymentCollection.category.${payment.paymentCategory}`)}
        </Text>
        {payment.targetLabel ? <Text style={styles.target}>{payment.targetLabel}</Text> : null}
        <Text style={styles.amount}>
          {formatPaymentAmount(payment.amount, payment.currencyCode)}
        </Text>
        <Text style={styles.due}>
          {t('paymentCollection.dueDate', { date: formatPaymentDueDate(payment.dueDate) })}
        </Text>
        <Text style={styles.status}>
          {t(`paymentCollection.status.${payment.paymentStatus}`)}
        </Text>

        {waitingReview ? (
          <Text style={styles.waiting}>{t('paymentCollection.waitingApproval')}</Text>
        ) : null}

        {payment.paymentStatus === 'REJECTED' && payment.rejectionReason ? (
          <Text style={styles.rejectionText}>
            {t('paymentCollection.rejectedReason', { reason: payment.rejectionReason })}
          </Text>
        ) : null}

        {canPay ? (
          <Button
            label={
              payment.paymentStatus === 'REJECTED'
                ? t('paymentCollection.uploadAgain')
                : t('paymentCollection.payNow')
            }
            onPress={() => setProofVisible(true)}
            style={styles.action}
          />
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
        submitting={submitting}
        onClose={() => setProofVisible(false)}
        onSubmit={payload => void handleSubmitProof(payload)}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: {
    flex: 1,
    padding: spacing.xl,
  },
  title: { ...typography.h2, marginBottom: spacing.xs },
  category: { ...typography.caption, color: colors.muted, marginBottom: spacing.xs },
  target: { ...typography.caption, color: colors.muted, marginBottom: spacing.sm },
  amount: { ...typography.h1, marginBottom: spacing.xs },
  due: { ...typography.body, color: colors.muted },
  status: { ...typography.bodyStrong, marginTop: spacing.md },
  waiting: {
    ...typography.body,
    color: colors.primaryDark,
    marginTop: spacing.sm,
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
