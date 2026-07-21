import React, { useCallback, useLayoutEffect, useMemo, useState } from 'react';
import { RefreshControl, ScrollView, StyleSheet, Text } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import type {
  NativeStackNavigationProp,
  NativeStackScreenProps,
} from '@react-navigation/native-stack';
import { useTranslation } from 'react-i18next';
import { PaymentServiceUnavailableError, paymentsApi } from '../../api/paymentsApi';
import type { SpacePaymentResponse } from '../../api/types';
import { UniversalPaymentCard } from '../../components/payments/UniversalPaymentCard';
import { UniversalPaymentProofModal } from '../../components/payments/UniversalPaymentProofModal';
import { EmptyState, HeaderBackButton, ListFilterChips, Screen, SkeletonCard } from '../../components/ui';
import { useToastStore } from '../../store/toastStore';
import { useMealPaymentActivitySummaries } from '../../hooks/useMealPaymentActivitySummaries';
import { useUniversalPayments } from '../../hooks/useUniversalPayments';
import type { MainStackParamList } from '../../navigation/types';
import { colors, spacing, typography } from '../../theme';
import {
  countTenantPaymentFilter,
  filterTenantPayments,
  type TenantPaymentFilter,
} from '../../utils/tenantPaymentFilters';
import { invalidateDashboardQueries } from '../../utils/dashboardQueryCache';
import { invalidatePaymentsMonthCaches } from '../../utils/paymentsMonthCache';
import { currentMonthKey } from '../../utils/dashboardFinancial';

type Nav = NativeStackNavigationProp<MainStackParamList, 'MemberPayments'>;
type Route = NativeStackScreenProps<MainStackParamList, 'MemberPayments'>['route'];

export function MemberPaymentsScreen() {
  const { t, i18n } = useTranslation();
  const navigation = useNavigation<Nav>();
  const route = useRoute<Route>();
  const { spaceId, memberId, memberName, month: routeMonth } = route.params;
  const showToast = useToastStore(state => state.showToast);

  const { payments, loading, error, serviceUnavailable, reload } = useUniversalPayments(spaceId, {
    memberId,
    month: routeMonth,
  });
  const { summaryByPaymentId, reload: reloadMealSummaries } = useMealPaymentActivitySummaries(
    spaceId,
    memberId,
    payments,
  );
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState<TenantPaymentFilter>('ALL');
  const [updatePayment, setUpdatePayment] = useState<SpacePaymentResponse | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useLayoutEffect(() => {
    navigation.setOptions({
      title: t('paymentCollection.memberPayments.title'),
      headerBackVisible: false,
      headerLeft: () => <HeaderBackButton />,
    });
  }, [i18n.language, navigation, t]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await reload();
      await reloadMealSummaries();
    } finally {
      setRefreshing(false);
    }
  }, [reload, reloadMealSummaries]);

  const filterOptions = useMemo(
    () =>
      (
        [
          ['ALL', 'paymentCollection.tenantFilters.all'],
          ['NEEDS_UPDATE', 'paymentCollection.tenantFilters.needsUpdate'],
          ['UNDER_REVIEW', 'paymentCollection.tenantFilters.underReview'],
          ['PAID', 'paymentCollection.tenantFilters.paid'],
          ['REJECTED', 'paymentCollection.tenantFilters.rejected'],
          ['PENDING', 'paymentCollection.tenantFilters.pending'],
        ] as const
      ).map(([id, key]) => ({
        id,
        label: t(key, { count: countTenantPaymentFilter(payments, id) }),
      })),
    [payments, t],
  );

  const visiblePayments = useMemo(
    () => filterTenantPayments(payments, filter),
    [filter, payments],
  );

  const openPayment = useCallback(
    (paymentId: string) => {
      navigation.navigate('PaymentDetail', { spaceId, paymentId, memberId, memberName });
    },
    [memberId, memberName, navigation, spaceId],
  );

  const handleSubmitProof = useCallback(
    async (payload: Parameters<typeof paymentsApi.submitProof>[2]) => {
      if (!updatePayment) {
        return;
      }
      setSubmitting(true);
      try {
        await paymentsApi.submitProof(spaceId, updatePayment.paymentId, payload);
        setUpdatePayment(null);
        invalidatePaymentsMonthCaches(spaceId, updatePayment.month ?? currentMonthKey());
        invalidateDashboardQueries();
        showToast(t('paymentCollection.proof.submitted'));
        await reload();
      } catch (err) {
        if (err instanceof PaymentServiceUnavailableError) {
          showToast(t('paymentCollection.serviceUnavailable.title'));
        } else {
          showToast(t('paymentCollection.errors.submitProof'));
        }
      } finally {
        setSubmitting(false);
      }
    },
    [reload, showToast, spaceId, t, updatePayment],
  );

  return (
    <Screen scrollable={false} contentStyle={styles.content}>
      <ScrollView
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={() => void onRefresh()} />
        }
        showsVerticalScrollIndicator={false}>
        <Text style={styles.heading}>{memberName}</Text>
        <Text style={styles.subheading}>{t('paymentCollection.memberPayments.subtitle')}</Text>

        <ListFilterChips options={filterOptions} value={filter} onChange={setFilter} />

        {serviceUnavailable ? (
          <EmptyState
            title={t('paymentCollection.serviceUnavailable.title')}
            description={t('paymentCollection.serviceUnavailable.description')}
            icon="⚠️"
          />
        ) : null}

        {error ? <Text style={styles.error}>{t(error)}</Text> : null}

        {!serviceUnavailable && loading && payments.length === 0 ? (
          <SkeletonCard />
        ) : null}

        {!serviceUnavailable && !loading && visiblePayments.length === 0 ? (
          <EmptyState
            title={t('paymentCollection.memberPayments.emptyTitle')}
            description={t('paymentCollection.memberPayments.emptyDescription')}
            icon="💳"
          />
        ) : null}

        {!serviceUnavailable
          ? visiblePayments.map(payment => (
              <UniversalPaymentCard
                key={payment.paymentId}
                payment={payment}
                mealSummary={summaryByPaymentId[payment.paymentId] ?? null}
                onPress={() => openPayment(payment.paymentId)}
                onUpdatePress={() => setUpdatePayment(payment)}
              />
            ))
          : null}
      </ScrollView>

      <UniversalPaymentProofModal
        visible={updatePayment != null}
        payment={updatePayment}
        mode="submit"
        submitting={submitting}
        onClose={() => setUpdatePayment(null)}
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
  heading: {
    ...typography.h2,
    marginBottom: spacing.xs,
  },
  subheading: {
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
