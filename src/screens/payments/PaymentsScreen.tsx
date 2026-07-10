import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import {
  CompositeNavigationProp,
  RouteProp,
  useFocusEffect,
  useNavigation,
  useRoute,
} from '@react-navigation/native';
import type { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useTranslation } from 'react-i18next';
import { DashboardFinancialSnapshot } from '../../components/dashboard';
import { MemberMealActivityMonthNav } from '../../components/meals/MemberMealActivityMonthNav';
import { MemberPaymentRow } from '../../components/payments/MemberPaymentRow';
import { PaymentsFilterDrawer } from '../../components/payments/PaymentsFilterDrawer';
import { PaymentsReviewList } from '../../components/payments/PaymentsReviewList';
import {
  PaymentsSectionTabBar,
  type PaymentsSection,
} from '../../components/payments/PaymentsSectionTabBar';
import { EmptyState, ListFilterChips, ListSearchFilterBar, SkeletonCard } from '../../components/ui';
import {
  usePaymentReview,
  type HistoryReviewFilter,
  type PendingReviewFilter,
} from '../../hooks/usePaymentReview';
import { usePaymentsLedger } from '../../hooks/usePaymentsLedger';
import { useSpacePermissions } from '../../hooks/useSpacePermissions';
import { useSpaceTabHeader } from '../../hooks/useSpaceTabHeader';
import type { MainStackParamList, SpaceTabParamList } from '../../navigation/types';
import { useSpaceStore } from '../../store/spaceStore';
import { useToastStore } from '../../store/toastStore';
import { colors, spacing, typography } from '../../theme';
import { canManagePayments, currentMonthKey } from '../../utils/dashboardFinancial';
import {
  countPaymentListFilters,
  isPrepaidOnlyLedger,
  PAYMENT_FILTER_OPTION_COUNT,
  type PaymentLedgerFilter,
} from '../../utils/paymentLedger';
import { shouldUseFilterDrawer } from '../../utils/filterUx';
import { findMySpaceEntry } from '../../utils/spacePermissions';

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
  const { spaceId } = route.params;
  useSpaceTabHeader(spaceId);
  const showToast = useToastStore(state => state.showToast);

  const mySpaces = useSpaceStore(state => state.mySpaces);
  const currentSpace = useSpaceStore(state => state.currentSpace);
  const spaceEntry = findMySpaceEntry(mySpaces, spaceId);
  const permissions = useSpacePermissions(spaceId);
  const spaceType =
    permissions.spaceType ??
    spaceEntry?.spaceType ??
    (currentSpace?.spaceId === spaceId ? currentSpace.spaceType : undefined);
  const canManage = canManagePayments(permissions.membershipRole);

  const [section, setSection] = useState<PaymentsSection>('members');
  const [pendingFilter, setPendingFilter] = useState<PendingReviewFilter>('SUBMITTED');
  const [historyFilter, setHistoryFilter] = useState<HistoryReviewFilter>('PAID');
  const [filterDrawerOpen, setFilterDrawerOpen] = useState(false);

  const ledger = usePaymentsLedger(spaceId, spaceType, canManage);
  // Review list must load independently of ledger so Pending Review / History
  // still fetch when the members ledger is slow or fails.
  const reviewSyncExpected = section !== 'members';
  const review = usePaymentReview(spaceId, {
    enabled: canManage,
    month: ledger.month,
    syncExpected: reviewSyncExpected,
    queue: section === 'history' ? 'HISTORY' : 'PENDING',
    pendingFilter,
    historyFilter,
  });
  const isCurrentMonth = ledger.month >= currentMonthKey();

  useFocusEffect(
    useCallback(() => {
      if (!canManage) {
        return;
      }
      void ledger.reload();
      void review.reload();
    }, [canManage, ledger.reload, review.reload]),
  );

  useEffect(() => {
    const initialFilter = route.params.initialFilter;
    if (initialFilter) {
      ledger.setFilter(initialFilter);
    }
  }, [ledger.setFilter, route.params.initialFilter]);

  useEffect(() => {
    const initialSection = route.params.initialSection;
    if (!initialSection) {
      return;
    }
    const resolved = resolveInitialSection(initialSection);
    setSection(resolved.section);
    setPendingFilter(resolved.pendingFilter);
    setHistoryFilter(resolved.historyFilter);
    navigation.setParams({ initialSection: undefined });
  }, [navigation, route.params.initialSection]);

  const activeFilterCount = useMemo(
    () => countPaymentListFilters(ledger.filters),
    [ledger.filters],
  );

  const prepaidOnly = isPrepaidOnlyLedger(ledger.summary);

  const paymentEmptyState = useMemo(() => {
    if (ledger.filters.preset === 'pending') {
      return {
        title: t('payments.emptyPending.title'),
        description: t('payments.emptyPending.description'),
      };
    }
    if (ledger.filters.preset === 'collected') {
      return {
        title: t('payments.emptyCollected.title'),
        description: prepaidOnly
          ? t('payments.emptyCollected.prepaidDescription')
          : t('payments.emptyCollected.description'),
      };
    }

    return {
      title:
        ledger.search.trim() || activeFilterCount > 0
          ? t('list.emptyFiltered')
          : t('payments.empty.title'),
      description:
        ledger.search.trim() || activeFilterCount > 0
          ? undefined
          : t('payments.empty.description'),
    };
  }, [activeFilterCount, ledger.filters.preset, ledger.search, prepaidOnly, t]);

  const sectionTabs = useMemo(
    () => [
      { id: 'members' as const, label: t('membership.tabs.members') },
      {
        id: 'pendingReview' as const,
        label: t('paymentCollection.review.tabPendingReview', {
          count: review.pendingReviewCount ?? 0,
        }),
      },
      {
        id: 'history' as const,
        label: t('paymentCollection.review.tabHistory', { count: review.historyCount ?? 0 }),
      },
    ],
    [review.historyCount, review.pendingReviewCount, t],
  );

  const pendingChipOptions = useMemo(
    () => [
      {
        id: 'SUBMITTED' as const,
        label: t('paymentCollection.review.chips.submitted', { count: review.submittedCount }),
      },
      {
        id: 'NEEDS_UPDATE' as const,
        label: t('paymentCollection.review.chips.needsUpdate', { count: review.changesRequestedCount }),
      },
    ],
    [review.changesRequestedCount, review.submittedCount, t],
  );

  const historyChipOptions = useMemo(
    () => [
      { id: 'PAID' as const, label: t('paymentCollection.review.chips.paid', { count: review.paidCount }) },
      {
        id: 'REJECTED' as const,
        label: t('paymentCollection.review.chips.rejected', { count: review.rejectedCount }),
      },
    ],
    [review.paidCount, review.rejectedCount, t],
  );

  const handleFilterNavigate = useCallback(
    (nextFilter: PaymentLedgerFilter) => {
      ledger.setFilter(nextFilter);
    },
    [ledger.setFilter],
  );

  const handleMemberPress = useCallback(
    (memberId: string) => {
      navigation.navigate('MemberDetails', { spaceId, memberId });
    },
    [navigation, spaceId],
  );

  const handlePrevMonth = useCallback(() => {
    ledger.setMonth(shiftMonth(ledger.month, -1));
  }, [ledger.month, ledger.setMonth]);

  const handleNextMonth = useCallback(() => {
    if (isCurrentMonth) {
      return;
    }
    ledger.setMonth(shiftMonth(ledger.month, 1));
  }, [isCurrentMonth, ledger.month, ledger.setMonth]);

  const handleSectionChange = useCallback((nextSection: PaymentsSection) => {
    setSection(nextSection);
    if (nextSection === 'pendingReview') {
      setPendingFilter('SUBMITTED');
    } else if (nextSection === 'history') {
      setHistoryFilter('PAID');
    }
  }, []);

  const handleRefresh = useCallback(() => {
    void ledger.reload();
    if (section !== 'members') {
      void review.reload();
    }
  }, [ledger.reload, review.reload, section]);

  const handleApprove = useCallback(
    async (paymentId: string) => {
      try {
        await review.review(paymentId, 'APPROVE');
        showToast(t('paymentCollection.review.approved'));
        void ledger.reload();
      } catch {
        showToast(t('paymentCollection.errors.review'));
      }
    },
    [ledger.reload, review, showToast, t],
  );

  const handleReject = useCallback(
    async (
      paymentId: string,
      code: import('../../api/types').PaymentRejectionReason,
      reason?: string,
    ) => {
      try {
        await review.review(paymentId, 'REJECT', reason, code);
        showToast(t('paymentCollection.review.rejected'));
        void ledger.reload();
      } catch {
        showToast(t('paymentCollection.errors.review'));
      }
    },
    [ledger.reload, review, showToast, t],
  );

  const handleRequestUpdate = useCallback(
    async (paymentId: string, message: string) => {
      try {
        await review.review(paymentId, 'REQUEST_UPDATE', message);
        showToast(t('paymentCollection.review.updateRequested'));
        void ledger.reload();
      } catch {
        showToast(t('paymentCollection.errors.review'));
      }
    },
    [ledger.reload, review, showToast, t],
  );

  const refreshing = ledger.loading || review.loading;

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

  return (
    <View style={styles.screen}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }>
        <MemberMealActivityMonthNav
          month={ledger.month}
          onPreviousMonth={handlePrevMonth}
          onNextMonth={handleNextMonth}
          disableNext={isCurrentMonth}
        />

        <PaymentsSectionTabBar
          sections={sectionTabs}
          activeSection={section}
          onSectionChange={id => handleSectionChange(id as PaymentsSection)}
        />

        {section === 'members' ? (
          <>
            <DashboardFinancialSnapshot
              loading={ledger.loading}
              financial={ledger.summary}
              onExpectedPress={() => handleFilterNavigate('all')}
              onCollectedPress={() => handleFilterNavigate('collected')}
              onPendingPress={() => handleFilterNavigate('pending')}
            />

            <ListSearchFilterBar
              searchValue={ledger.search}
              onSearchChange={ledger.setSearch}
              searchPlaceholder={t('list.search.membersPayments')}
              onFilterPress={() => setFilterDrawerOpen(true)}
              activeFilterCount={activeFilterCount}
              showFilterButton={shouldUseFilterDrawer(PAYMENT_FILTER_OPTION_COUNT)}
            />

            {ledger.error && !ledger.loading ? (
              <EmptyState
                title={t('payments.errors.title')}
                description={t(ledger.error)}
              />
            ) : ledger.loading && ledger.members.length === 0 ? (
              <SkeletonCard />
            ) : ledger.filteredMembers.length === 0 ? (
              <EmptyState
                title={paymentEmptyState.title}
                description={paymentEmptyState.description}
              />
            ) : (
              ledger.filteredMembers.map(row => (
                <MemberPaymentRow
                  key={row.memberId}
                  row={row}
                  onPress={() => handleMemberPress(row.memberId)}
                />
              ))
            )}

            {ledger.summary?.source === 'OCCUPANCY' ? (
              <Text style={styles.hint}>{t('payments.occupancyHint')}</Text>
            ) : null}
          </>
        ) : (
          <>
            {section === 'pendingReview' ? (
              <ListFilterChips
                options={pendingChipOptions}
                value={pendingFilter}
                onChange={setPendingFilter}
              />
            ) : (
              <ListFilterChips
                options={historyChipOptions}
                value={historyFilter}
                onChange={setHistoryFilter}
              />
            )}

            <PaymentsReviewList
              review={review}
              showActions
              onApprove={paymentId => void handleApprove(paymentId)}
              onReject={(paymentId, code, reason) => void handleReject(paymentId, code, reason)}
              onRequestUpdate={(paymentId, message) => void handleRequestUpdate(paymentId, message)}
            />
          </>
        )}
      </ScrollView>

      <PaymentsFilterDrawer
        visible={filterDrawerOpen}
        applied={ledger.filters}
        onClose={() => setFilterDrawerOpen(false)}
        onApply={ledger.setFilters}
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
  },
  hint: {
    ...typography.caption,
    color: colors.muted,
    marginTop: spacing.md,
    lineHeight: 18,
  },
});
