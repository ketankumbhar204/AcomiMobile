import React, { useEffect, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, View } from 'react-native';
import type { MealBillingType, UUID } from '../../api/types';
import { useMemberMealActivity } from '../../hooks/useMemberMealActivity';
import { colors, spacing } from '../../theme';
import { MonthlySummaryHeader } from '../ui/MonthlySummaryHeader';
import { MemberMealBalancePanel } from './MemberMealBalancePanel';
import { MemberMealPaymentTimeline } from './MemberMealPaymentTimeline';
import { MemberMealActivityCalendarPanel } from './MemberMealActivityCalendarPanel';
import { MemberMealActivityHistoryPanel } from './MemberMealActivityHistoryPanel';
import { MemberMealActivitySummaryCards } from './MemberMealActivitySummaryCards';
import { MemberMealActivityTabBar, type MemberMealActivityView } from './MemberMealActivityTabBar';

type MemberMealActivitySectionProps = {
  spaceId: UUID;
  memberId: UUID;
  effectiveMealBillingType?: MealBillingType;
  canManageBalance?: boolean;
  /** customer = meal history only (no payment timeline / payment amount cards). */
  audience?: 'owner' | 'customer';
  selectedDate?: string | null;
  onSelectDate: (date: string) => void;
  onBindReload?: (reload: () => void) => void;
  /** When true, render without an inner ScrollView so a parent can scroll the whole Meals tab. */
  embedInParentScroll?: boolean;
};

export function MemberMealActivitySection({
  spaceId,
  memberId,
  effectiveMealBillingType,
  canManageBalance = false,
  audience = 'owner',
  selectedDate,
  onSelectDate,
  onBindReload,
  embedInParentScroll = false,
}: MemberMealActivitySectionProps) {
  const [activeView, setActiveView] = useState<MemberMealActivityView>('history');
  const { month, loading, error, activity, reload, goToPreviousMonth, goToNextMonth } =
    useMemberMealActivity(spaceId, memberId);

  const isPrepaid = effectiveMealBillingType === 'PREPAID_BALANCE';
  const isCustomer = audience === 'customer';

  useEffect(() => {
    onBindReload?.(reload);
  }, [onBindReload, reload]);

  const handlePurchased = () => {
    reload();
  };

  const header = (
    <View style={styles.stickyHeader}>
      <MemberMealActivityTabBar activeView={activeView} onViewChange={setActiveView} />
    </View>
  );

  const body = (
    <View style={styles.body}>
      {/* Owner manages prepaid balance here; customers use Today's Meals / Payments. */}
      {!isCustomer ? (
        <MemberMealBalancePanel
          spaceId={spaceId}
          memberId={memberId}
          effectiveMealBillingType={effectiveMealBillingType}
          canManage={canManageBalance}
          onPurchased={handlePurchased}
        />
      ) : null}

      <MonthlySummaryHeader
        month={month}
        onPreviousMonth={goToPreviousMonth}
        onNextMonth={goToNextMonth}>
        {!isPrepaid || isCustomer ? (
          <MemberMealActivitySummaryCards
            view={activeView}
            activity={activity}
            audience={audience}
          />
        ) : null}
      </MonthlySummaryHeader>

      {!isPrepaid && !isCustomer ? (
        <MemberMealPaymentTimeline
          spaceId={spaceId}
          memberId={memberId}
          month={month}
          audience={audience}
        />
      ) : null}

      {loading ? <ActivityIndicator color={colors.primary} style={styles.loader} /> : null}

      {activeView === 'calendar' ? (
        <MemberMealActivityCalendarPanel
          month={month}
          loading={loading}
          error={error}
          activity={activity}
          selectedDate={selectedDate}
          onSelectDate={onSelectDate}
          onRetry={reload}
        />
      ) : (
        <MemberMealActivityHistoryPanel
          month={month}
          loading={loading}
          error={error}
          activity={activity}
          onSelectDate={onSelectDate}
          onRetry={reload}
        />
      )}
    </View>
  );

  if (embedInParentScroll) {
    return (
      <View style={styles.embedded}>
        {header}
        {body}
      </View>
    );
  }

  return (
    <View style={styles.wrap}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        stickyHeaderIndices={[0]}
        showsVerticalScrollIndicator
        nestedScrollEnabled
        keyboardShouldPersistTaps="handled">
        {header}
        {body}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flex: 1,
    minHeight: 320,
  },
  embedded: {
    marginTop: spacing.xs,
    paddingBottom: spacing.lg,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: spacing.lg,
  },
  stickyHeader: {
    backgroundColor: colors.background,
    paddingBottom: spacing.xxs,
  },
  body: {
    gap: spacing.sm,
    paddingTop: spacing.xs,
  },
  loader: {
    marginVertical: spacing.sm,
  },
});
