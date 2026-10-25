import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
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
import { AlertTriangle, ChevronRight, Info, Plus, Users } from 'lucide-react-native';
import type { SpacePaymentResponse } from '../../api/types';
import { OwnerPaymentCardActions } from '../../components/payments/OwnerPaymentCardActions';
import { PaymentDetailsSheet } from '../../components/payments/PaymentDetailsSheet';
import { UniversalPaymentCard } from '../../components/payments/UniversalPaymentCard';
import { PaymentReceivedConfirmModal } from '../../components/payments/PaymentReceivedConfirmModal';
import { PaymentReminderComposer } from '../../components/payments/PaymentReminderComposer';
import { PaymentsFilterDrawer } from '../../components/payments/PaymentsFilterDrawer';
import { PaymentsSummaryFilters } from '../../components/payments/PaymentsSummaryFilters';
import {
  Button,
  EmptyState,
  ListSearchFilterBar,
  MonthlySummaryHeader,
  SkeletonCard,
} from '../../components/ui';
import { DashboardTipCard } from '../../components/dashboard/shared/DashboardGuidedCards';
import { usePaymentsSummary } from '../../hooks/usePaymentsSummary';
import { useTenantPaymentsMonth } from '../../hooks/useTenantPaymentsMonth';
import { useOwnerPaymentCardActions } from '../../hooks/useOwnerPaymentCardActions';
import { useActiveSpaceId } from '../../hooks/useActiveSpaceId';
import { useSpaceStore } from '../../store/spaceStore';
import { useSpacePermissions } from '../../hooks/useSpacePermissions';
import { useSpaceProgressiveAccess } from '../../hooks/useSpaceProgressiveAccess';
import { useSpaceTabHeader } from '../../hooks/useSpaceTabHeader';
import type { MainStackParamList, SpaceTabParamList } from '../../navigation/types';
import { colors, radius, spacing, typography } from '../../theme';
import { canManagePayments, currentMonthKey } from '../../utils/dashboardFinancial';
import {
  countPaymentListFilters,
  defaultPaymentListFilters,
  isPrepaidOnlyLedger,
  PAYMENT_FILTER_OPTION_COUNT,
  paymentFiltersFromLegacy,
  type PaymentLedgerFilter,
  type PaymentListFilterState,
} from '../../utils/paymentLedger';
import { filterIndividualPayments } from '../../utils/individualPayments';
import { shouldUseFilterDrawer } from '../../utils/filterUx';
import { invalidatePaymentsMonthCaches } from '../../utils/paymentsMonthCache';
import { paymentListEmptyKind } from '../../utils/paymentMonthList';
import { paymentsApi } from '../../api/paymentsApi';
import {
  canOwnerMarkPaymentReceived,
  canOwnerSendPaymentReminder,
} from '../../utils/ownerPaymentCardActions';

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
  const spaceName = useSpaceStore(state =>
    state.currentSpace?.spaceId === spaceId
      ? state.currentSpace.spaceName
      : state.selectedSpace?.id === spaceId
        ? state.selectedSpace.name
        : null,
  );
  useSpaceTabHeader(spaceId);
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
  const [detailsPayment, setDetailsPayment] = useState<SpacePaymentResponse | null>(null);

  const summary = usePaymentsSummary(spaceId, canManage);
  const [filters, setFilters] = useState<PaymentListFilterState>(defaultPaymentListFilters);
  const [search, setSearch] = useState('');
  const records = useTenantPaymentsMonth(canManage ? spaceId : null, {
    enabled: canManage,
    initialMonth: summary.month,
  });
  const cardActions = useOwnerPaymentCardActions({
    spaceId,
    month: summary.month,
    onSettled: async () => {
      await Promise.all([summary.reload(), records.reload()]);
    },
  });
  const summaryReloadRef = useRef(summary.reload);
  const recordsReloadRef = useRef(records.reload);
  summaryReloadRef.current = summary.reload;
  recordsReloadRef.current = records.reload;
  const skipFocusReload = useRef(true);
  useFocusEffect(
    useCallback(() => {
      if (skipFocusReload.current) {
        skipFocusReload.current = false;
        return;
      }
      summaryReloadRef.current().catch(() => undefined);
      recordsReloadRef.current().catch(() => undefined);
    }, []),
  );

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
      setFilters(paymentFiltersFromLegacy(initialFilter));
    }
    navigation.setParams({ initialFilter: undefined });
  }, [navigation, openReviewQueue, route.params.initialFilter]);

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

  useEffect(() => {
    if (records.month !== summary.month) {
      records.setMonth(summary.month);
    }
  }, [records, summary.month]);

  const listReady = records.loadedMonth === summary.month;
  const reconciledMonth = useRef<string | null>(null);
  useEffect(() => {
    if (!listReady || records.loading) {
      return;
    }
    const pending = summary.financial?.pending ?? 0;
    if (pending <= 0 || records.payments.length > 0) {
      return;
    }
    if (reconciledMonth.current === summary.month) {
      return;
    }
    reconciledMonth.current = summary.month;
    records.reload().catch(() => undefined);
  }, [
    listReady,
    records,
    summary.financial?.pending,
    summary.month,
  ]);
  const visiblePayments = useMemo(
    () => (listReady ? filterIndividualPayments(records.payments, filters, search) : []),
    [filters, listReady, records.payments, search],
  );

  const activeFilterCount = useMemo(
    () => countPaymentListFilters(filters),
    [filters],
  );

  const prepaidOnly = isPrepaidOnlyLedger(summary.financial);

  const paymentEmptyState = useMemo(() => {
    const kind = paymentListEmptyKind({
      selectedMonth: summary.month,
      loadedMonth: records.loadedMonth,
      loading: records.loading,
      pendingAmount: summary.financial?.pending,
      recordCount: records.payments.length,
      visibleCount: visiblePayments.length,
      preset: filters.preset ?? null,
      hasSearchOrExtraFilter: Boolean(search.trim()) || activeFilterCount > 0,
    });
    if (kind === 'mismatch') {
      return {
        title: t('payments.emptyMismatch.title'),
        description: t('payments.emptyMismatch.description'),
      };
    }
    if (kind === 'pending') {
      return {
        title: t('payments.emptyPending.title'),
        description: t('payments.emptyPending.description'),
      };
    }
    if (kind === 'collected') {
      return {
        title: t('payments.emptyCollected.title'),
        description: prepaidOnly
          ? t('payments.emptyCollected.prepaidDescription')
          : t('payments.emptyCollected.description'),
      };
    }

    return {
      title: t('payments.records.emptyTitle'),
      description: t('payments.records.emptyDescription'),
    };
  }, [
    activeFilterCount,
    filters.preset,
    prepaidOnly,
    records.loadedMonth,
    records.loading,
    records.payments.length,
    search,
    summary.financial?.pending,
    summary.month,
    t,
    visiblePayments.length,
  ]);

  const handleFilterNavigate = useCallback(
    (nextFilter: PaymentLedgerFilter) => {
      if (nextFilter === 'underReview') {
        openReviewQueue({ section: 'pendingReview', pendingFilter: 'SUBMITTED' });
        return;
      }

      const active: PaymentLedgerFilter = filters.preset ?? 'all';
      if (nextFilter === active) {
        setFilters(paymentFiltersFromLegacy('all'));
        return;
      }
      setFilters(paymentFiltersFromLegacy(nextFilter));
    },
    [filters.preset, openReviewQueue],
  );

  const activeSummaryFilter: PaymentLedgerFilter = filters.preset ?? 'all';

  const handlePrevMonth = useCallback(() => {
    summary.setMonth(shiftMonth(summary.month, -1));
  }, [summary]);

  const handleNextMonth = useCallback(() => {
    if (isCurrentMonth) {
      return;
    }
    summary.setMonth(shiftMonth(summary.month, 1));
  }, [isCurrentMonth, summary]);

  const handleRefresh = useCallback(async () => {
    try {
      await paymentsApi.syncPaymentsMonth(spaceId, summary.month);
    } catch {
      // Still refresh reads even if sync fails.
    }
    invalidatePaymentsMonthCaches(spaceId, summary.month);
    await Promise.all([summary.reload(), records.reload()]);
  }, [records, spaceId, summary]);

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
  const refreshing = summary.refreshing || records.refreshing;

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
        <View style={styles.headingRow}>
          <Text style={styles.heading}>{t('payments.title')}</Text>
          <Button
            label={t('paymentCollection.addRecord.createAction')}
            icon={Plus}
            onPress={() =>
              navigation.navigate('CreatePayment', { spaceId, month: summary.month })
            }
            style={styles.createButton}
          />
        </View>

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
            Icon={AlertTriangle}
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

            {(summary.refreshError || records.refreshError) ? (
              <Text style={styles.refreshError} onPress={() => void handleRefresh()}>
                {t(summary.refreshError ?? records.refreshError ?? '')} ·{' '}
                {t('common.retry', { defaultValue: 'Tap to retry' })}
              </Text>
            ) : null}

            <ListSearchFilterBar
              searchValue={search}
              onSearchChange={setSearch}
              searchPlaceholder={t('payments.records.search')}
              onFilterPress={() => setFilterDrawerOpen(true)}
              activeFilterCount={activeFilterCount}
              showFilterButton={shouldUseFilterDrawer(PAYMENT_FILTER_OPTION_COUNT)}
            />

            <View style={styles.listHeader}>
              <Text style={styles.listTitle}>{t('payments.records.heading')}</Text>
              <Text style={styles.listCount}>
                {t('payments.membersCount', {
                  count: visiblePayments.length,
                })}
              </Text>
            </View>

            {!listReady || records.loading ? (
              <SkeletonCard />
            ) : records.error ? (
              <EmptyState
                title={t('payments.errors.title')}
                description={t(records.error)}
                Icon={AlertTriangle}
              />
            ) : visiblePayments.length === 0 ? (
              <EmptyState
                title={paymentEmptyState.title}
                description={paymentEmptyState.description}
              />
            ) : (
              visiblePayments.map(payment => (
                <UniversalPaymentCard
                  key={payment.paymentId}
                  payment={payment}
                  showMember
                  onPress={() => setDetailsPayment(payment)}
                  ownerActions={
                    <OwnerPaymentCardActions
                      showReceived={canOwnerMarkPaymentReceived(payment.paymentStatus)}
                      showReminder={canOwnerSendPaymentReminder(payment)}
                      receivedLoading={cardActions.isProcessing(payment.paymentId, 'received')}
                      reminderLoading={cardActions.isProcessing(payment.paymentId, 'reminder')}
                      onReceived={() => cardActions.requestReceivedForPayment(payment)}
                      onReminder={() => cardActions.sendReminderForPayment(payment)}
                    />
                  }
                />
              ))
            )}
          </>
        )}
      </ScrollView>

      <PaymentsFilterDrawer
        visible={filterDrawerOpen}
        applied={filters}
        onClose={() => setFilterDrawerOpen(false)}
        onApply={setFilters}
      />
      <PaymentDetailsSheet
        payment={
          detailsPayment
            ? visiblePayments.find(row => row.paymentId === detailsPayment.paymentId) ??
              detailsPayment
            : null
        }
        spaceId={spaceId}
        spaceName={spaceName}
        receivedLoading={
          detailsPayment != null &&
          cardActions.isProcessing(detailsPayment.paymentId, 'received')
        }
        reminderLoading={
          detailsPayment != null &&
          cardActions.isProcessing(detailsPayment.paymentId, 'reminder')
        }
        onClose={() => setDetailsPayment(null)}
        showOwnerActions={canManage}
        onReceived={payment => cardActions.requestReceivedForPayment(payment)}
        onReminder={payment => cardActions.sendReminderForPayment(payment)}
        onOpenFull={payment => {
          setDetailsPayment(null);
          navigation.navigate('PaymentDetail', {
            spaceId,
            paymentId: payment.paymentId,
            memberId: payment.memberId,
            memberName: payment.memberName,
          });
        }}
      />
      <PaymentReminderComposer
        visible={cardActions.reminderDraft != null}
        memberName={cardActions.reminderDraft?.memberName ?? ''}
        phone={cardActions.reminderPhone}
        message={cardActions.reminderMessage}
        notice={cardActions.reminderNotice}
        submitting={
          cardActions.reminderDraft != null &&
          cardActions.isProcessing(cardActions.reminderDraft.paymentId, 'reminder')
        }
        onChangeMessage={cardActions.setReminderMessage}
        onCancel={cardActions.cancelReminder}
        onConfirm={cardActions.confirmReminder}
      />
      <PaymentReceivedConfirmModal
        visible={cardActions.confirmPayments.length > 0}
        payments={cardActions.confirmPayments}
        spaceName={spaceName}
        loading={cardActions.receivedConfirmLoading}
        onClose={cardActions.cancelConfirm}
        onConfirm={cardActions.confirmReceived}
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
  headingRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },
  heading: {
    ...typography.h2,
    flexGrow: 1,
    flexShrink: 1,
    minWidth: '52%',
  },
  createButton: {
    flexGrow: 0,
    flexShrink: 0,
    minHeight: 40,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
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
