import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
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
import { ClipboardClock, History, Users } from 'lucide-react-native';
import { MemberPaymentRow } from '../../components/payments/MemberPaymentRow';
import { PaymentsFilterDrawer } from '../../components/payments/PaymentsFilterDrawer';
import { PaymentsReviewList } from '../../components/payments/PaymentsReviewList';
import {
  PaymentsSectionTabBar,
  type PaymentsSection,
} from '../../components/payments/PaymentsSectionTabBar';
import { PaymentsSummaryFilters } from '../../components/payments/PaymentsSummaryFilters';
import {
  EmptyState,
  ListFilterChips,
  ListSearchFilterBar,
  MonthlySummaryHeader,
  SkeletonCard,
} from '../../components/ui';
import { usePaymentsMembers } from '../../hooks/usePaymentsMembers';
import { usePaymentsReviewList } from '../../hooks/usePaymentsReviewList';
import { usePaymentsSummary } from '../../hooks/usePaymentsSummary';
import { useActiveSpaceId } from '../../hooks/useActiveSpaceId';
import { useSpacePermissions } from '../../hooks/useSpacePermissions';
import { useSpaceTabHeader } from '../../hooks/useSpaceTabHeader';
import type { MainStackParamList, SpaceTabParamList } from '../../navigation/types';
import { useToastStore } from '../../store/toastStore';
import { colors, spacing, typography } from '../../theme';
import { canManagePayments, currentMonthKey } from '../../utils/dashboardFinancial';
import { invalidateDashboardQueries } from '../../utils/dashboardQueryCache';
import {
  countPaymentListFilters,
  isPrepaidOnlyLedger,
  PAYMENT_FILTER_OPTION_COUNT,
  type PaymentLedgerFilter,
} from '../../utils/paymentLedger';
import { shouldUseFilterDrawer } from '../../utils/filterUx';
import { invalidatePaymentsMonthCaches } from '../../utils/paymentsMonthCache';
import { paymentsApi } from '../../api/paymentsApi';
import type { HistoryReviewFilter, PendingReviewFilter } from '../../utils/ownerPaymentFilters';
import { resolveMemberMonthPaymentTarget } from '../../utils/resolveMemberMonthPaymentTarget';
import { NotificationBellButton } from '../../components/notifications/NotificationBellButton';

type PaymentsRoute = RouteProp<SpaceTabParamList, 'Payments'>;
type PaymentsNav = CompositeNavigationProp<
  BottomTabNavigationProp<SpaceTabParamList, 'Payments'>,
  NativeStackNavigationProp<MainStackParamList>
>;

type LegacyReviewSection = 'submitted' | 'changesRequested' | 'paid' | 'rejected';

function shiftMonth(month: string, delta: number): string {
  const [year, monthNum] = month.split('-').map(Number);
  const date = new Date(year, monthNum - 1 + delta, 1);
  return currentMonthKey(date);
}

function resolveInitialSection(
  initialSection: PaymentsSection | LegacyReviewSection | undefined,
): {
  section: PaymentsSection;
  pendingFilter: PendingReviewFilter;
  historyFilter: HistoryReviewFilter;
} {
  switch (initialSection) {
    case 'pendingReview':
      return { section: 'pendingReview', pendingFilter: 'SUBMITTED', historyFilter: 'PAID' };
    case 'history':
      return { section: 'history', pendingFilter: 'SUBMITTED', historyFilter: 'PAID' };
    case 'submitted':
      return { section: 'pendingReview', pendingFilter: 'SUBMITTED', historyFilter: 'PAID' };
    case 'changesRequested':
      return { section: 'pendingReview', pendingFilter: 'NEEDS_UPDATE', historyFilter: 'PAID' };
    case 'paid':
      return { section: 'history', pendingFilter: 'SUBMITTED', historyFilter: 'PAID' };
    case 'rejected':
      return { section: 'history', pendingFilter: 'SUBMITTED', historyFilter: 'REJECTED' };
    default:
      return { section: 'members', pendingFilter: 'SUBMITTED', historyFilter: 'PAID' };
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

  const [section, setSection] = useState<PaymentsSection>('members');
  const [filterDrawerOpen, setFilterDrawerOpen] = useState(false);
  const [autoOpenedReviewHint, setAutoOpenedReviewHint] = useState(false);
  const autoEntryResolvedRef = useRef(false);

  const summary = usePaymentsSummary(spaceId, canManage);
  // Lists wait until the first summary attempt settles (success or error).
  const summarySettled = summary.hasData || Boolean(summary.error) || !summary.loading;
  const members = usePaymentsMembers(
    spaceId,
    summary.month,
    canManage && section === 'members' && summarySettled,
  );
  const reviewList = usePaymentsReviewList(
    spaceId,
    summary.month,
    section === 'history' ? 'history' : 'pendingReview',
    canManage && section !== 'members' && summarySettled,
  );

  const isCurrentMonth = summary.month >= currentMonthKey();

  useEffect(() => {
    const initialFilter = route.params.initialFilter;
    if (!initialFilter) {
      return;
    }
    autoEntryResolvedRef.current = true;
    setAutoOpenedReviewHint(false);
    setSection('members');
    members.setFilter(initialFilter);
    navigation.setParams({ initialFilter: undefined });
  }, [members.setFilter, navigation, route.params.initialFilter]);

  useEffect(() => {
    const initialSection = route.params.initialSection;
    if (!initialSection) {
      return;
    }
    autoEntryResolvedRef.current = true;
    setAutoOpenedReviewHint(false);
    const resolved = resolveInitialSection(initialSection);
    setSection(resolved.section);
    reviewList.setPendingFilter(resolved.pendingFilter);
    reviewList.setHistoryFilter(resolved.historyFilter);
    navigation.setParams({ initialSection: undefined });
  }, [
    navigation,
    reviewList.setHistoryFilter,
    reviewList.setPendingFilter,
    route.params.initialSection,
  ]);

  // One-shot entry: open Pending Review when current month has under-review payments.
  useEffect(() => {
    if (autoEntryResolvedRef.current) {
      return;
    }
    if (route.params.initialSection || route.params.initialFilter) {
      return;
    }
    if (!summary.hasData || summary.loading) {
      return;
    }
    autoEntryResolvedRef.current = true;
    const isCurrent = summary.month === currentMonthKey();
    const underReviewCount = summary.counts.submitted ?? 0;
    if (isCurrent && underReviewCount > 0) {
      setSection('pendingReview');
      setAutoOpenedReviewHint(true);
    }
  }, [
    route.params.initialFilter,
    route.params.initialSection,
    summary.counts.submitted,
    summary.hasData,
    summary.loading,
    summary.month,
  ]);

  const handleSectionChange = useCallback((nextSection: PaymentsSection) => {
    setAutoOpenedReviewHint(false);
    setSection(nextSection);
  }, []);

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

  const sectionTabs = useMemo(
    () => [
      {
        id: 'members' as const,
        label: t('membership.tabs.members'),
        icon: Users,
      },
      {
        id: 'pendingReview' as const,
        label: t('paymentCollection.review.tabPendingReviewLabel'),
        icon: ClipboardClock,
        badge: summary.counts.pendingReview ?? 0,
        badgeTone: 'info' as const,
      },
      {
        id: 'history' as const,
        label: t('paymentCollection.review.tabHistoryLabel'),
        icon: History,
        badge: summary.counts.history ?? 0,
        badgeTone: 'muted' as const,
      },
    ],
    [summary.counts.history, summary.counts.pendingReview, t],
  );

  const pendingChipOptions = useMemo(
    () => [
      {
        id: 'SUBMITTED' as const,
        label: t('paymentCollection.review.chips.submittedLabel'),
        badge: summary.counts.submitted ?? 0,
        tone: 'primary' as const,
      },
      {
        id: 'NEEDS_UPDATE' as const,
        label: t('paymentCollection.review.chips.needsUpdateLabel'),
        badge: summary.counts.changesRequested ?? 0,
        tone: 'warning' as const,
      },
    ],
    [summary.counts.changesRequested, summary.counts.submitted, t],
  );

  const historyChipOptions = useMemo(
    () => [
      {
        id: 'PAID' as const,
        label: t('paymentCollection.review.chips.paidLabel'),
        badge: summary.counts.paid ?? 0,
        tone: 'primary' as const,
      },
      {
        id: 'REJECTED' as const,
        label: t('paymentCollection.review.chips.rejectedLabel'),
        badge: summary.counts.rejected ?? 0,
        tone: 'danger' as const,
      },
    ],
    [summary.counts.paid, summary.counts.rejected, t],
  );

  const handleFilterNavigate = useCallback(
    (nextFilter: PaymentLedgerFilter) => {
      setAutoOpenedReviewHint(false);

      // Under Review summary → Pending Review (Submitted). Filter conditions unchanged.
      if (nextFilter === 'underReview') {
        const alreadyOpen =
          section === 'pendingReview' && members.filters.preset === 'underReview';
        if (alreadyOpen) {
          members.setFilter('all');
          return;
        }
        members.setFilter('underReview');
        reviewList.setPendingFilter('SUBMITTED');
        setSection('pendingReview');
        return;
      }

      setSection('members');
      const active: PaymentLedgerFilter = members.filters.preset ?? 'all';
      // Re-tap active filter clears back to Expected / all.
      if (nextFilter === active) {
        members.setFilter('all');
        return;
      }
      members.setFilter(nextFilter);
    },
    [
      members.filters.preset,
      members.setFilter,
      reviewList.setPendingFilter,
      section,
    ],
  );

  const activeSummaryFilter: PaymentLedgerFilter =
    section === 'pendingReview' && members.filters.preset === 'underReview'
      ? 'underReview'
      : members.filters.preset ?? 'all';

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

  const handleOpenPaymentDetail = useCallback(
    (paymentId: string, memberId?: string, memberName?: string) => {
      navigation.navigate('PaymentDetail', {
        spaceId,
        paymentId,
        memberId,
        memberName,
      });
    },
    [navigation, spaceId],
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
      // Explicit sync command (write) — not part of default open.
      await paymentsApi.syncPaymentsMonth(spaceId, summary.month);
    } catch {
      // Still refresh reads even if sync fails.
    }
    invalidatePaymentsMonthCaches(spaceId, summary.month);
    await Promise.all([
      summary.reload(),
      section === 'members' ? members.reload() : reviewList.reload(),
    ]);
  }, [members, reviewList, section, spaceId, summary]);

  const afterReview = useCallback(async () => {
    invalidatePaymentsMonthCaches(spaceId, summary.month);
    invalidateDashboardQueries();
    // KPIs / members only. Review cards are patched from the review API response —
    // soft-refetching the queue here races snapshot rebuild and restores stale cards.
    await summary.reload();
    if (section === 'members') {
      await members.reload();
    }
  }, [members, section, spaceId, summary]);

  const handleApprove = useCallback(
    async (paymentId: string) => {
      try {
        const updated = await reviewList.review(paymentId, 'APPROVE');
        if (updated) {
          summary.applyReviewOutcome('APPROVE', updated.amount);
        }
        showToast(t('paymentCollection.review.approved'));
        await afterReview();
      } catch {
        showToast(t('paymentCollection.errors.review'));
      }
    },
    [afterReview, reviewList, showToast, summary, t],
  );

  const handleReject = useCallback(
    async (
      paymentId: string,
      code: import('../../api/types').PaymentRejectionReason,
      reason?: string,
    ) => {
      try {
        const updated = await reviewList.review(paymentId, 'REJECT', reason, code);
        if (updated) {
          summary.applyReviewOutcome('REJECT', updated.amount);
        }
        showToast(t('paymentCollection.review.rejected'));
        await afterReview();
      } catch {
        showToast(t('paymentCollection.errors.review'));
      }
    },
    [afterReview, reviewList, showToast, summary, t],
  );

  const handleRequestUpdate = useCallback(
    async (paymentId: string, message: string) => {
      try {
        const updated = await reviewList.review(paymentId, 'REQUEST_UPDATE', message);
        if (updated) {
          summary.applyReviewOutcome('REQUEST_UPDATE', updated.amount);
        }
        showToast(t('paymentCollection.review.updateRequested'));
        await afterReview();
      } catch (err) {
        showToast(t('paymentCollection.errors.review'));
        throw err;
      }
    },
    [afterReview, reviewList, showToast, summary, t],
  );

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
  const listRefreshError =
    section === 'members' ? members.refreshError : reviewList.refreshError;
  const refreshing =
    summary.refreshing ||
    (section === 'members' ? members.refreshing : reviewList.refreshing);

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
        <Text style={styles.subheading}>{t('payments.subtitle')}</Text>

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
            <PaymentsSectionTabBar
              sections={sectionTabs}
              activeSection={section}
              onSectionChange={id => handleSectionChange(id as PaymentsSection)}
            />

            {autoOpenedReviewHint &&
            section === 'pendingReview' &&
            (summary.counts.submitted ?? 0) > 0 ? (
              <Text style={styles.autoOpenHint}>
                {t('paymentCollection.review.autoOpenHint', {
                  count: summary.counts.submitted ?? 0,
                })}
              </Text>
            ) : null}

            {(summary.refreshError || listRefreshError) ? (
              <Text
                style={styles.refreshError}
                onPress={() => void handleRefresh()}>
                {t(summary.refreshError ?? listRefreshError ?? '')} ·{' '}
                {t('common.retry', { defaultValue: 'Tap to retry' })}
              </Text>
            ) : null}

            {section === 'members' ? (
              <>
                <ListSearchFilterBar
                  searchValue={members.search}
                  onSearchChange={members.setSearch}
                  searchPlaceholder={t('list.search.membersPayments')}
                  onFilterPress={() => setFilterDrawerOpen(true)}
                  activeFilterCount={activeFilterCount}
                  showFilterButton={shouldUseFilterDrawer(PAYMENT_FILTER_OPTION_COUNT)}
                />

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
            ) : (
              <>
                {section === 'pendingReview' ? (
                  <ListFilterChips
                    options={pendingChipOptions}
                    value={reviewList.pendingFilter}
                    onChange={reviewList.setPendingFilter}
                  />
                ) : (
                  <ListFilterChips
                    options={historyChipOptions}
                    value={reviewList.historyFilter}
                    onChange={reviewList.setHistoryFilter}
                  />
                )}

                <PaymentsReviewList
                  review={reviewList}
                  showActions
                  spaceType={permissions.spaceType}
                  onApprove={paymentId => void handleApprove(paymentId)}
                  onReject={(paymentId, code, reason) =>
                    void handleReject(paymentId, code, reason)
                  }
                  onRequestUpdate={(paymentId, message) =>
                    handleRequestUpdate(paymentId, message)
                  }
                  onOpenDetail={payment =>
                    handleOpenPaymentDetail(
                      payment.paymentId,
                      payment.memberId,
                      payment.memberName,
                    )
                  }
                />
                {reviewList.hasMore ? (
                  <Text style={styles.loadMore} onPress={() => void reviewList.loadMore()}>
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
    marginBottom: spacing.xs,
  },
  subheading: {
    ...typography.body,
    color: colors.muted,
    marginBottom: spacing.md,
  },
  refreshError: {
    ...typography.caption,
    color: '#DC2626',
    marginBottom: spacing.xs,
  },
  autoOpenHint: {
    ...typography.caption,
    color: colors.muted,
    marginBottom: spacing.xs,
  },
  loadMore: {
    ...typography.bodyStrong,
    color: colors.primary,
    textAlign: 'center',
    paddingVertical: spacing.md,
  },
});
