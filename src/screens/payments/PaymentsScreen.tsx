import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import {
  CompositeNavigationProp,
  RouteProp,
  useNavigation,
  useRoute,
} from '@react-navigation/native';
import type { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useTranslation } from 'react-i18next';
import { ChevronRight, Info, Users } from 'lucide-react-native';
import { MemberPaymentRow } from '../../components/payments/MemberPaymentRow';
import { PaymentsFilterDrawer } from '../../components/payments/PaymentsFilterDrawer';
import { PaymentsSummaryFilters } from '../../components/payments/PaymentsSummaryFilters';
import {
  EmptyState,
  ListSearchFilterBar,
  MonthlySummaryHeader,
  SkeletonCard,
} from '../../components/ui';
import { DashboardTipCard } from '../../components/dashboard/shared/DashboardGuidedCards';
import { usePaymentsMembers } from '../../hooks/usePaymentsMembers';
import { usePaymentsSummary } from '../../hooks/usePaymentsSummary';
import { useActiveSpaceId } from '../../hooks/useActiveSpaceId';
import { useSpacePermissions } from '../../hooks/useSpacePermissions';
import { useSpaceProgressiveAccess } from '../../hooks/useSpaceProgressiveAccess';
import { useSpaceTabHeader } from '../../hooks/useSpaceTabHeader';
import type { MainStackParamList, SpaceTabParamList } from '../../navigation/types';
import { useToastStore } from '../../store/toastStore';
import { colors, radius, spacing, typography } from '../../theme';
import { canManagePayments, currentMonthKey } from '../../utils/dashboardFinancial';
import {
  countPaymentListFilters,
  isPrepaidOnlyLedger,
  PAYMENT_FILTER_OPTION_COUNT,
  type PaymentLedgerFilter,
} from '../../utils/paymentLedger';
import { shouldUseFilterDrawer } from '../../utils/filterUx';
import { invalidatePaymentsMonthCaches } from '../../utils/paymentsMonthCache';
import { paymentsApi } from '../../api/paymentsApi';
import { resolveMemberMonthPaymentTarget } from '../../utils/resolveMemberMonthPaymentTarget';
import { NotificationBellButton } from '../../components/notifications/NotificationBellButton';

type PaymentsRoute = RouteProp<SpaceTabParamList, 'Payments'>;
type PaymentsNav = CompositeNavigationProp<
  BottomTabNavigationProp<SpaceTabParamList, 'Payments'>,
  NativeStackNavigationProp<MainStackParamList>
>;

type LegacyReviewSection =
  | 'members'
  | 'pendingReview'
  | 'history'
  | 'submitted'
  | 'changesRequested'
  | 'paid'
  | 'rejected';

function shiftMonth(month: string, delta: number): string {
  const [year, monthNum] = month.split('-').map(Number);
  const date = new Date(year, monthNum - 1 + delta, 1);
  return currentMonthKey(date);
}

function resolveDeepLinkDestination(initialSection: LegacyReviewSection | undefined): {
  kind: 'home' | 'review' | 'history';
  pendingFilter?: 'SUBMITTED' | 'NEEDS_UPDATE';
  historyFilter?: 'PAID' | 'REJECTED';
} {
  switch (initialSection) {
    case 'pendingReview':
    case 'submitted':
      return { kind: 'review', pendingFilter: 'SUBMITTED' };
    case 'changesRequested':
      return { kind: 'review', pendingFilter: 'NEEDS_UPDATE' };
    case 'history':
    case 'paid':
      return { kind: 'history', historyFilter: 'PAID' };
    case 'rejected':
      return { kind: 'history', historyFilter: 'REJECTED' };
    default:
      return { kind: 'home' };
  }
}

export function PaymentsScreen() {
  const { t } = useTranslation();
  const navigation = useNavigation<PaymentsNav>();
  const route = useRoute<PaymentsRoute>();
  const spaceId = useActiveSpaceId(route.params.spaceId);
  const notificationBell = useMemo(
    () => <NotificationBellButton spaceId={spaceId} />,
    [spaceId],
  );
  useSpaceTabHeader(spaceId, {
    showProfileAndMenu: true,
    headerRightExtra: notificationBell,
  });
  const showToast = useToastStore(state => state.showToast);

  const permissions = useSpacePermissions(spaceId);
  const canManage = canManagePayments(permissions.membershipRole);
  const { getCapability, loading: progressiveLoading } =
    useSpaceProgressiveAccess(spaceId);
  const paymentsAccess = getCapability('PAYMENTS');
  const showPaymentsSoftTip =
    canManage &&
    !progressiveLoading &&
    paymentsAccess?.mode === 'SOFT' &&
    Boolean(paymentsAccess.reasonKey);

  const [filterDrawerOpen, setFilterDrawerOpen] = useState(false);

  const summary = usePaymentsSummary(spaceId, canManage);
  const summarySettled = summary.hasData || Boolean(summary.error) || !summary.loading;
  const members = usePaymentsMembers(spaceId, summary.month, canManage && summarySettled);

  const isCurrentMonth = summary.month >= currentMonthKey();
  const submittedCount = summary.counts.submitted ?? 0;

  const openReviewQueue = useCallback(
    (opts?: {
      section?: 'pendingReview' | 'history';
      pendingFilter?: 'SUBMITTED' | 'NEEDS_UPDATE';
      historyFilter?: 'PAID' | 'REJECTED';
    }) => {
      navigation.navigate('PaymentReview', {
        spaceId,
        month: summary.month,
        section: opts?.section ?? 'pendingReview',
        pendingFilter: opts?.pendingFilter ?? 'SUBMITTED',
        historyFilter: opts?.historyFilter ?? 'PAID',
      });
    },
    [navigation, spaceId, summary.month],
  );

  useEffect(() => {
    const initialFilter = route.params.initialFilter;
    if (!initialFilter) {
      return;
    }
    if (initialFilter === 'underReview') {
      openReviewQueue({ section: 'pendingReview', pendingFilter: 'SUBMITTED' });
    } else {
      members.setFilter(initialFilter);
    }
    navigation.setParams({ initialFilter: undefined });
  }, [members.setFilter, navigation, openReviewQueue, route.params.initialFilter]);

  useEffect(() => {
    const initialSection = route.params.initialSection;
    if (!initialSection) {
      return;
    }
    const destination = resolveDeepLinkDestination(initialSection);
    if (destination.kind === 'review') {
      openReviewQueue({
        section: 'pendingReview',
        pendingFilter: destination.pendingFilter,
      });
    } else if (destination.kind === 'history') {
      openReviewQueue({
        section: 'history',
        historyFilter: destination.historyFilter,
      });
    }
    navigation.setParams({ initialSection: undefined });
  }, [navigation, openReviewQueue, route.params.initialSection]);

  const activeFilterCount = useMemo(
    () => countPaymentListFilters(members.filters),
    [members.filters],
  );

  const prepaidOnly = isPrepaidOnlyLedger(summary.financial);

  const paymentEmptyState = useMemo(() => {
    if (members.filters.preset === 'pending') {
      return {
        title: t('payments.emptyPending.title'),
        description: t('payments.emptyPending.description'),
      };
    }
    if (members.filters.preset === 'collected') {
      return {
        title: t('payments.emptyCollected.title'),
        description: prepaidOnly
          ? t('payments.emptyCollected.prepaidDescription')
          : t('payments.emptyCollected.description'),
      };
    }

    return {
      title:
        members.search.trim() || activeFilterCount > 0
          ? t('list.emptyFiltered')
          : t('payments.empty.title'),
      description:
        members.search.trim() || activeFilterCount > 0
          ? undefined
          : t('payments.empty.description'),
    };
  }, [activeFilterCount, members.filters.preset, members.search, prepaidOnly, t]);

  const handleFilterNavigate = useCallback(
    (nextFilter: PaymentLedgerFilter) => {
      if (nextFilter === 'underReview') {
        openReviewQueue({ section: 'pendingReview', pendingFilter: 'SUBMITTED' });
        return;
      }

      const active: PaymentLedgerFilter = members.filters.preset ?? 'all';
      if (nextFilter === active) {
        members.setFilter('all');
        return;
      }
      members.setFilter(nextFilter);
    },
    [members.filters.preset, members.setFilter, openReviewQueue],
  );

  const activeSummaryFilter: PaymentLedgerFilter = members.filters.preset ?? 'all';

  const handleMemberPress = useCallback(
    async (memberId: string, memberName: string) => {
      try {
        const target = await resolveMemberMonthPaymentTarget(
          spaceId,
          memberId,
          memberName,
          summary.month,
        );
        if (target.kind === 'detail') {
          navigation.navigate('PaymentDetail', {
            spaceId,
            paymentId: target.paymentId,
            memberId: target.memberId,
            memberName: target.memberName,
          });
          return;
        }
        navigation.navigate('MemberPayments', {
          spaceId,
          memberId: target.memberId,
          memberName: target.memberName,
          month: target.month,
        });
      } catch {
        showToast(t('paymentCollection.errors.loadPayment'));
      }
    },
    [navigation, showToast, spaceId, summary.month, t],
  );

  const handlePrevMonth = useCallback(() => {
    summary.setMonth(shiftMonth(summary.month, -1));
  }, [summary.month, summary.setMonth]);

  const handleNextMonth = useCallback(() => {
    if (isCurrentMonth) {
      return;
    }
    summary.setMonth(shiftMonth(summary.month, 1));
  }, [isCurrentMonth, summary.month, summary.setMonth]);

  const handleRefresh = useCallback(async () => {
    try {
      await paymentsApi.syncPaymentsMonth(spaceId, summary.month);
    } catch {
      // Still refresh reads even if sync fails.
    }
    invalidatePaymentsMonthCaches(spaceId, summary.month);
    await Promise.all([summary.reload(), members.reload()]);
  }, [members, spaceId, summary]);

  if (!canManage) {
    return (
      <View style={styles.screen}>
        <View style={styles.content}>
          <EmptyState
            title={t('payments.accessDenied.title')}
            description={t('payments.accessDenied.description')}
          />
        </View>
      </View>
    );
  }

  const showFullPageError =
    !summary.hasData && !summary.loading && Boolean(summary.error);
  const refreshing = summary.refreshing || members.refreshing;

  return (
    <View style={styles.screen}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={() => void handleRefresh()} />
        }>
        <Text style={styles.heading}>{t('payments.title')}</Text>

        {showPaymentsSoftTip && paymentsAccess?.reasonKey ? (
          <View style={styles.softTip}>
            <DashboardTipCard icon={Info} message={t(paymentsAccess.reasonKey)} />
          </View>
        ) : null}

        <MonthlySummaryHeader
          month={summary.month}
          onPreviousMonth={handlePrevMonth}
          onNextMonth={handleNextMonth}
          disableNext={isCurrentMonth}
          onMonthSelect={summary.setMonth}
          maxMonth={currentMonthKey()}>
          <PaymentsSummaryFilters
            loading={summary.loading}
            financial={summary.financial}
            activeFilter={activeSummaryFilter}
            onFilterPress={handleFilterNavigate}
          />
        </MonthlySummaryHeader>

        {showFullPageError ? (
          <EmptyState
            title={
              summary.serviceUnavailable
                ? t('paymentCollection.serviceUnavailable.title')
                : t('payments.errors.title')
            }
            description={t(summary.error ?? 'payments.errors.loadLedger')}
            icon="⚠️"
          />
        ) : (
          <>
            {submittedCount > 0 ? (
              <Pressable
                onPress={() =>
                  openReviewQueue({ section: 'pendingReview', pendingFilter: 'SUBMITTED' })
                }
                style={({ pressed }) => [styles.attentionBanner, pressed && styles.pressed]}
                accessibilityRole="button"
                accessibilityLabel={t('payments.attention.a11y', { count: submittedCount })}>
                <View style={styles.attentionIcon}>
                  <Users size={18} color={colors.primaryDark} strokeWidth={2.2} />
                </View>
                <View style={styles.attentionBody}>
                  <Text style={styles.attentionTitle}>
                    {t('payments.attention.title', { count: submittedCount })}
                  </Text>
                  <Text style={styles.attentionSubtitle}>
                    {t('payments.attention.subtitle')}
                  </Text>
                </View>
                <ChevronRight size={18} color={colors.primaryDark} strokeWidth={2.2} />
              </Pressable>
            ) : null}

            {(summary.refreshError || members.refreshError) ? (
              <Text style={styles.refreshError} onPress={() => void handleRefresh()}>
                {t(summary.refreshError ?? members.refreshError ?? '')} ·{' '}
                {t('common.retry', { defaultValue: 'Tap to retry' })}
              </Text>
            ) : null}

            <ListSearchFilterBar
              searchValue={members.search}
              onSearchChange={members.setSearch}
              searchPlaceholder={t('list.search.membersPayments')}
              onFilterPress={() => setFilterDrawerOpen(true)}
              activeFilterCount={activeFilterCount}
              showFilterButton={shouldUseFilterDrawer(PAYMENT_FILTER_OPTION_COUNT)}
            />

            <View style={styles.listHeader}>
              <Text style={styles.listTitle}>{t('membership.tabs.members')}</Text>
              <Text style={styles.listCount}>
                {t('payments.membersCount', {
                  count: members.filteredMembers.length,
                })}
              </Text>
            </View>

            {members.loading ? (
              <SkeletonCard />
            ) : members.error ? (
              <EmptyState
                title={t('payments.errors.title')}
                description={t(members.error)}
                icon="⚠️"
              />
            ) : members.filteredMembers.length === 0 ? (
              <EmptyState
                title={paymentEmptyState.title}
                description={paymentEmptyState.description}
              />
            ) : (
              <>
                {members.filteredMembers.map(row => (
                  <MemberPaymentRow
                    key={row.memberId}
                    row={row}
                    amountEmphasis={
                      members.filters.preset === 'collected' ? 'collected' : 'default'
                    }
                    onPress={() => void handleMemberPress(row.memberId, row.memberName)}
                  />
                ))}
                {members.hasMore ? (
                  <Text style={styles.loadMore} onPress={() => void members.loadMore()}>
                    {t('common.loadMore', { defaultValue: 'Load more' })}
                  </Text>
                ) : null}
              </>
            )}
          </>
        )}
      </ScrollView>

      <PaymentsFilterDrawer
        visible={filterDrawerOpen}
        applied={members.filters}
        onClose={() => setFilterDrawerOpen(false)}
        onApply={members.setFilters}
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
    gap: spacing.sm,
  },
  heading: {
    ...typography.h2,
    marginBottom: spacing.md,
  },
  softTip: {
    marginBottom: spacing.sm,
  },
  attentionBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.successTint,
    borderRadius: radius.card,
    borderWidth: 1,
    borderColor: `${colors.primary}33`,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    marginBottom: spacing.xs,
  },
  attentionIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  attentionBody: {
    flex: 1,
    gap: 2,
    minWidth: 0,
  },
  attentionTitle: {
    ...typography.bodyStrong,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  attentionSubtitle: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  pressed: {
    opacity: 0.92,
  },
  refreshError: {
    ...typography.caption,
    color: '#DC2626',
    marginBottom: spacing.xs,
  },
  listHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: spacing.xs,
    marginBottom: spacing.xs,
  },
  listTitle: {
    ...typography.bodyStrong,
    fontWeight: '700',
  },
  listCount: {
    ...typography.caption,
    color: colors.muted,
  },
  loadMore: {
    ...typography.bodyStrong,
    color: colors.primary,
    textAlign: 'center',
    paddingVertical: spacing.md,
  },
});
