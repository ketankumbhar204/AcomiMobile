import React, { useCallback, useEffect, useLayoutEffect, useMemo } from 'react';
import { RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useTranslation } from 'react-i18next';
import { PaymentsReviewList } from '../../components/payments/PaymentsReviewList';
import { EmptyState, ListFilterChips, Screen } from '../../components/ui';
import { usePaymentsReviewList } from '../../hooks/usePaymentsReviewList';
import { usePaymentsSummary } from '../../hooks/usePaymentsSummary';
import { useActiveSpaceId } from '../../hooks/useActiveSpaceId';
import { useSpacePermissions } from '../../hooks/useSpacePermissions';
import type { MainStackParamList } from '../../navigation/types';
import { useToastStore } from '../../store/toastStore';
import { colors, spacing, typography } from '../../theme';
import { canManagePayments, currentMonthKey } from '../../utils/dashboardFinancial';
import { invalidateDashboardQueries } from '../../utils/dashboardQueryCache';
import { invalidatePaymentsMonthCaches } from '../../utils/paymentsMonthCache';

type Route = RouteProp<MainStackParamList, 'PaymentReview'>;
type Nav = NativeStackNavigationProp<MainStackParamList, 'PaymentReview'>;

/**
 * Full-screen Review Queue / month History queue.
 * Reuses PaymentsReviewList + review APIs (Approve / Reject / Request update).
 */
export function PaymentReviewScreen() {
  const { t } = useTranslation();
  const navigation = useNavigation<Nav>();
  const route = useRoute<Route>();
  const spaceId = useActiveSpaceId(route.params.spaceId);
  const showToast = useToastStore(state => state.showToast);
  const permissions = useSpacePermissions(spaceId);
  const canManage = canManagePayments(permissions.membershipRole);

  const section = route.params.section === 'history' ? 'history' : 'pendingReview';

  const summary = usePaymentsSummary(spaceId, canManage);
  const effectiveMonth = route.params.month ?? summary.month ?? currentMonthKey();

  const reviewList = usePaymentsReviewList(
    spaceId,
    effectiveMonth,
    section,
    canManage,
  );

  const title =
    section === 'history'
      ? t('paymentCollection.review.tabHistoryLabel')
      : t('paymentCollection.review.tabPendingReviewLabel');

  useLayoutEffect(() => {
    navigation.setOptions({ title });
  }, [navigation, title]);

  useEffect(() => {
    if (route.params.pendingFilter) {
      reviewList.setPendingFilter(route.params.pendingFilter);
    }
    if (route.params.historyFilter) {
      reviewList.setHistoryFilter(route.params.historyFilter);
    }
  }, [
    reviewList.setHistoryFilter,
    reviewList.setPendingFilter,
    route.params.historyFilter,
    route.params.pendingFilter,
  ]);

  useEffect(() => {
    if (route.params.month && route.params.month !== summary.month) {
      summary.setMonth(route.params.month);
    }
  }, [route.params.month, summary.month, summary.setMonth]);

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

  const afterReview = useCallback(async () => {
    invalidatePaymentsMonthCaches(spaceId, effectiveMonth);
    invalidateDashboardQueries();
    await summary.reload();
  }, [effectiveMonth, spaceId, summary]);

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
      <Screen>
        <EmptyState
          title={t('payments.accessDenied.title')}
          description={t('payments.accessDenied.description')}
        />
      </Screen>
    );
  }

  return (
    <Screen contentStyle={styles.screenContent}>
      <View style={styles.header}>
        <Text style={styles.monthHint}>{effectiveMonth}</Text>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        refreshControl={
          <RefreshControl
            refreshing={reviewList.refreshing || summary.refreshing}
            onRefresh={() => {
              void Promise.all([reviewList.reload(), summary.reload()]);
            }}
          />
        }>
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
          onReject={(paymentId, code, reason) => void handleReject(paymentId, code, reason)}
          onRequestUpdate={(paymentId, message) => handleRequestUpdate(paymentId, message)}
          onOpenDetail={payment =>
            navigation.navigate('PaymentDetail', {
              spaceId,
              paymentId: payment.paymentId,
              memberId: payment.memberId,
              memberName: payment.memberName,
            })
          }
        />
        {reviewList.hasMore ? (
          <Text style={styles.loadMore} onPress={() => void reviewList.loadMore()}>
            {t('common.loadMore', { defaultValue: 'Load more' })}
          </Text>
        ) : null}
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  screenContent: {
    flex: 1,
    padding: 0,
    minHeight: 0,
  },
  header: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xs,
    paddingBottom: spacing.xs,
  },
  monthHint: {
    ...typography.caption,
    color: colors.muted,
  },
  scroll: {
    flex: 1,
  },
  content: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.section,
    gap: spacing.sm,
  },
  loadMore: {
    ...typography.bodyStrong,
    color: colors.primary,
    textAlign: 'center',
    paddingVertical: spacing.md,
  },
});
