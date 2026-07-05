import React, { useCallback, useLayoutEffect } from 'react';
import { RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useFocusEffect, useNavigation, useRoute } from '@react-navigation/native';
import type {
  NativeStackNavigationProp,
  NativeStackScreenProps,
} from '@react-navigation/native-stack';
import { useTranslation } from 'react-i18next';
import { PaymentApprovalCard } from '../../components/payments/PaymentApprovalCard';
import {
  EmptyState,
  HeaderBackButton,
  ListFilterChips,
  Screen,
  SkeletonCard,
} from '../../components/ui';
import { usePaymentReview, type PaymentReviewTab } from '../../hooks/usePaymentReview';
import type { MainStackParamList } from '../../navigation/types';
import { useToastStore } from '../../store/toastStore';
import { colors, spacing, typography } from '../../theme';

type Nav = NativeStackNavigationProp<MainStackParamList, 'PaymentReview'>;
type Route = NativeStackScreenProps<MainStackParamList, 'PaymentReview'>['route'];

const TABS: PaymentReviewTab[] = ['SUBMITTED', 'PAID', 'REJECTED'];

export function PaymentReviewScreen() {
  const { t, i18n } = useTranslation();
  const navigation = useNavigation<Nav>();
  const route = useRoute<Route>();
  const { spaceId } = route.params;
  const showToast = useToastStore(state => state.showToast);

  const review = usePaymentReview(spaceId);

  useLayoutEffect(() => {
    navigation.setOptions({
      title: t('paymentCollection.review.title'),
      headerBackVisible: false,
      headerLeft: () => <HeaderBackButton />,
    });
  }, [i18n.language, navigation, t]);

  useFocusEffect(
    useCallback(() => {
      void review.reload();
    }, [review.reload]),
  );

  const tabOptions = TABS.map(tab => ({
    id: tab,
    label:
      tab === 'SUBMITTED'
        ? t('paymentCollection.review.tabSubmitted', { count: review.submittedCount })
        : t(`paymentCollection.review.tab${tab}`),
  }));

  const handleApprove = async (paymentId: string) => {
    try {
      await review.review(paymentId, 'APPROVE');
      showToast(t('paymentCollection.review.approved'));
    } catch {
      showToast(t('paymentCollection.errors.review'));
    }
  };

  const handleReject = async (
    paymentId: string,
    code: import('../../api/types').PaymentRejectionReason,
    reason?: string,
  ) => {
    try {
      await review.review(paymentId, 'REJECT', reason, code);
      showToast(t('paymentCollection.review.rejected'));
    } catch {
      showToast(t('paymentCollection.errors.review'));
    }
  };

  if (review.serviceUnavailable) {
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

  return (
    <Screen scrollable={false} contentStyle={styles.content}>
      <ScrollView
        refreshControl={
          <RefreshControl
            refreshing={review.loading}
            onRefresh={() => void review.reload()}
          />
        }
        showsVerticalScrollIndicator={false}>
        <Text style={styles.subtitle}>{t('paymentCollection.review.subtitle')}</Text>

        <ListFilterChips
          options={tabOptions}
          value={review.tab}
          onChange={value => review.setTab(value)}
        />

        {review.error ? <Text style={styles.error}>{t(review.error)}</Text> : null}

        {review.loading && review.payments.length === 0 ? (
          <SkeletonCard />
        ) : review.payments.length === 0 ? (
          <EmptyState title={t(`paymentCollection.review.empty.${review.tab}`)} icon="💳" />
        ) : (
          review.payments.map(payment => (
            <PaymentApprovalCard
              key={payment.paymentId}
              payment={payment}
              reviewing={review.reviewingId === payment.paymentId}
              onApprove={() => void handleApprove(payment.paymentId)}
              onReject={(code, reason) => void handleReject(payment.paymentId, code, reason)}
            />
          ))
        )}
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: {
    flex: 1,
    padding: spacing.xl,
  },
  subtitle: {
    ...typography.body,
    color: colors.muted,
    marginBottom: spacing.md,
  },
  error: {
    ...typography.body,
    color: '#DC2626',
    marginBottom: spacing.md,
  },
});
