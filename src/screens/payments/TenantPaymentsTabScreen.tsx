import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import {
  CompositeNavigationProp,
  RouteProp,
  useNavigation,
  useRoute,
} from '@react-navigation/native';
import type { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useTranslation } from 'react-i18next';
import { TriangleAlert, WalletCards } from 'lucide-react-native';
import { PaymentServiceUnavailableError, paymentsApi } from '../../api/paymentsApi';
import type { SpacePaymentResponse } from '../../api/types';
import { MealFormHero } from '../../components/meals/MealFormHero';
import { DayMealPaymentsPanel } from '../../components/payments/DayMealPaymentsPanel';
import { PaymentsSectionTabBar } from '../../components/payments/PaymentsSectionTabBar';
import { UniversalPaymentCard } from '../../components/payments/UniversalPaymentCard';
import { UniversalPaymentProofModal } from '../../components/payments/UniversalPaymentProofModal';
import { Button, EmptyState, ListFilterChips, Skeleton, SkeletonCard } from '../../components/ui';
import { useCustomerSubscriptionStatus } from '../../hooks/useCustomerSubscriptionStatus';
import { useLinkedMember } from '../../hooks/useLinkedMember';
import { useActiveSpaceId } from '../../hooks/useActiveSpaceId';
import { useMealPaymentActivitySummaries } from '../../hooks/useMealPaymentActivitySummaries';
import { useSpaceTabHeader } from '../../hooks/useSpaceTabHeader';
import { useToastStore } from '../../store/toastStore';
import { useTenantPaymentsMonth } from '../../hooks/useTenantPaymentsMonth';
import type { MainStackParamList, SpaceTabParamList } from '../../navigation/types';
import { colors, spacing, typography } from '../../theme';
import { invalidateDashboardQueries } from '../../utils/dashboardQueryCache';
import { invalidatePaymentsMonthCaches } from '../../utils/paymentsMonthCache';
import {
  countTenantPaymentFilterInSection,
  countTenantPaymentSection,
  filterTenantPaymentsInSection,
  resolvePreferredTenantPaymentsSection,
  type TenantPaymentFilter,
  type TenantPaymentsSection,
} from '../../utils/tenantPaymentFilters';

type Route = RouteProp<SpaceTabParamList, 'Payments'>;
type Nav = CompositeNavigationProp<
  BottomTabNavigationProp<SpaceTabParamList, 'Payments'>,
  NativeStackNavigationProp<MainStackParamList>
>;

type SectionChipFilter = Extract<
  TenantPaymentFilter,
  'ALL' | 'NEEDS_UPDATE' | 'PENDING' | 'PAID' | 'REJECTED'
>;

export function TenantPaymentsTabScreen() {
  const { t } = useTranslation();
  const navigation = useNavigation<Nav>();
  const route = useRoute<Route>();
  const spaceId = useActiveSpaceId(route.params.spaceId);
  useSpaceTabHeader(spaceId);
  const showToast = useToastStore(state => state.showToast);

  const { memberId, member, loading: memberLoading } = useLinkedMember(spaceId);
  const { status: subscriptionStatus, loading: billingLoading } = useCustomerSubscriptionStatus(
    spaceId,
    memberId,
  );

  const isPayPerMeal =
    !subscriptionStatus?.prepaidBilling &&
    (subscriptionStatus?.mealBillingType == null ||
      subscriptionStatus.mealBillingType === 'PAY_PER_MEAL');

  const {
    payments,
    loading,
    error,
    serviceUnavailable,
    refreshError,
    refreshing,
    reload,
    replacePayment,
    month,
  } = useTenantPaymentsMonth(spaceId, {
    memberId: memberId ?? undefined,
    enabled: Boolean(memberId) && !isPayPerMeal,
  });
  const { summaryByPaymentId, reload: reloadMealSummaries } = useMealPaymentActivitySummaries(
    spaceId,
    memberId,
    payments,
    Boolean(memberId) && !isPayPerMeal,
  );
  const [section, setSection] = useState<TenantPaymentsSection>('actionNeeded');
  const [actionFilter, setActionFilter] = useState<SectionChipFilter>('ALL');
  const [historyFilter, setHistoryFilter] = useState<SectionChipFilter>('ALL');
  const [updatePayment, setUpdatePayment] = useState<SpacePaymentResponse | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (loading && payments.length === 0) {
      return;
    }
    setSection(prev => resolvePreferredTenantPaymentsSection(payments, prev));
  }, [loading, month, payments]);

  const onRefresh = useCallback(async () => {
    await reload();
    await reloadMealSummaries();
  }, [reload, reloadMealSummaries]);

  const sectionTabs = useMemo(
    () => [
      {
        id: 'actionNeeded' as const,
        label: t('paymentCollection.tenantSections.actionNeeded', {
          count: countTenantPaymentSection(payments, 'actionNeeded'),
        }),
      },
      {
        id: 'underReview' as const,
        label: t('paymentCollection.tenantSections.underReview', {
          count: countTenantPaymentSection(payments, 'underReview'),
        }),
      },
      {
        id: 'history' as const,
        label: t('paymentCollection.tenantSections.history', {
          count: countTenantPaymentSection(payments, 'history'),
        }),
      },
    ],
    [payments, t],
  );

  const actionChipOptions = useMemo(
    () => [
      {
        id: 'ALL' as const,
        label: t('paymentCollection.review.chips.all'),
      },
      {
        id: 'NEEDS_UPDATE' as const,
        label: t('paymentCollection.tenantFilters.needsUpdate', {
          count: countTenantPaymentFilterInSection(payments, 'actionNeeded', 'NEEDS_UPDATE'),
        }),
      },
      {
        id: 'PENDING' as const,
        label: t('paymentCollection.tenantFilters.pending', {
          count: countTenantPaymentFilterInSection(payments, 'actionNeeded', 'PENDING'),
        }),
      },
      {
        id: 'REJECTED' as const,
        label: t('paymentCollection.tenantFilters.rejected', {
          count: countTenantPaymentFilterInSection(payments, 'actionNeeded', 'REJECTED'),
        }),
      },
    ],
    [payments, t],
  );

  const historyChipOptions = useMemo(
    () => [
      { id: 'ALL' as const, label: t('paymentCollection.review.chips.all') },
      {
        id: 'PAID' as const,
        label: t('paymentCollection.tenantFilters.paid', {
          count: countTenantPaymentFilterInSection(payments, 'history', 'PAID'),
        }),
      },
    ],
    [payments, t],
  );

  const activeFilter: TenantPaymentFilter =
    section === 'actionNeeded' ? actionFilter : section === 'history' ? historyFilter : 'ALL';

  const visiblePayments = useMemo(
    () => filterTenantPaymentsInSection(payments, section, activeFilter),
    [activeFilter, payments, section],
  );

  const openPayment = useCallback(
    (paymentId: string) => {
      if (!memberId) {
        return;
      }
      navigation.navigate('PaymentDetail', {
        spaceId,
        paymentId,
        memberId,
        memberName: member?.fullName ?? t('paymentCollection.memberPayments.title'),
      });
    },
    [member?.fullName, memberId, navigation, spaceId, t],
  );

  const handleSubmitProof = useCallback(
    async (payload: Parameters<typeof paymentsApi.submitProof>[2]) => {
      if (!updatePayment) {
        return;
      }
      setSubmitting(true);
      try {
        const updated = await paymentsApi.submitProof(spaceId, updatePayment.paymentId, payload);
        setUpdatePayment(null);
        replacePayment(updated);
        invalidatePaymentsMonthCaches(spaceId, month);
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
    [month, reload, replacePayment, showToast, spaceId, t, updatePayment],
  );

  if ((memberLoading || billingLoading) && !memberId) {
    return (
      <View style={styles.screen}>
        <View style={styles.content}>
          <SkeletonCard />
        </View>
      </View>
    );
  }

  if (!memberId) {
    return (
      <View style={styles.screen}>
        <View style={styles.content}>
          <EmptyState
            Icon={WalletCards}
            title={t('paymentCollection.memberPayments.emptyTitle')}
            description={t('paymentCollection.memberPayments.noLinkedMember')}
          />
        </View>
      </View>
    );
  }

  if (isPayPerMeal) {
    return (
      <DayMealPaymentsPanel
        spaceId={spaceId}
        memberId={memberId}
        memberName={member?.fullName}
      />
    );
  }

  return (
    <View style={styles.screen}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={() => void onRefresh()} />
        }>
        <MealFormHero
          icon={WalletCards}
          eyebrow={t('paymentCollection.memberPayments.eyebrow', { defaultValue: 'Billing' })}
          heading={t('paymentCollection.memberPayments.title')}
          subheading={
            member?.fullName ??
            t('paymentCollection.memberPayments.subtitle', {
              defaultValue: 'Your payments and proofs for this space.',
            })
          }
          compact
        />

        <PaymentsSectionTabBar
          sections={sectionTabs}
          activeSection={section}
          onSectionChange={id => setSection(id as TenantPaymentsSection)}
        />

        {section === 'actionNeeded' ? (
          <ListFilterChips
            options={actionChipOptions}
            value={actionFilter}
            onChange={setActionFilter}
          />
        ) : null}

        {section === 'history' ? (
          <ListFilterChips
            options={historyChipOptions}
            value={historyFilter}
            onChange={setHistoryFilter}
          />
        ) : null}

        {serviceUnavailable ? (
          <EmptyState
            Icon={TriangleAlert}
            title={t('paymentCollection.serviceUnavailable.title')}
            description={t('paymentCollection.serviceUnavailable.description')}
          />
        ) : null}

        {error ? (
          <View style={styles.errorBlock}>
            <View style={styles.errorBanner}>
              <TriangleAlert size={16} color="#DC2626" strokeWidth={2.2} />
              <Text style={styles.errorText}>{t(error)}</Text>
            </View>
            <Button label={t('common.retry')} variant="secondary" onPress={() => void reload()} />
          </View>
        ) : null}

        {refreshError && payments.length > 0 ? (
          <Text style={styles.errorText} onPress={() => void reload()}>
            {t(refreshError)} · {t('common.retry', { defaultValue: 'Tap to retry' })}
          </Text>
        ) : null}

        {!serviceUnavailable && !error && loading && payments.length === 0 ? (
          <View style={styles.skeletonWrap}>
            <Skeleton width="100%" height={88} borderRadius={18} />
            <Skeleton width="100%" height={88} borderRadius={18} />
          </View>
        ) : null}

        {!serviceUnavailable && !error && !loading && visiblePayments.length === 0 ? (
          <EmptyState
            Icon={WalletCards}
            title={t('paymentCollection.memberPayments.emptyTitle')}
            description={t(`paymentCollection.tenantSections.empty.${section}`)}
          />
        ) : null}

        {!serviceUnavailable && !error
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
        mode={
          updatePayment?.paymentStatus === 'PENDING' ||
          updatePayment?.paymentStatus === 'REJECTED' ||
          updatePayment?.paymentStatus === 'UPDATE_REQUESTED'
            ? 'submit'
            : 'edit'
        }
        submitting={submitting}
        onClose={() => setUpdatePayment(null)}
        onSubmit={payload => void handleSubmitProof(payload)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scroll: {
    flex: 1,
  },
  content: {
    padding: spacing.lg,
    paddingBottom: spacing.section,
    gap: spacing.md,
  },
  errorBlock: {
    gap: spacing.sm,
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FECACA',
    borderRadius: 18,
    padding: spacing.md,
  },
  errorText: {
    ...typography.body,
    flex: 1,
    color: '#DC2626',
  },
  skeletonWrap: {
    gap: spacing.sm,
  },
});
