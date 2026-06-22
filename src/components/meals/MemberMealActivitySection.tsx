import React, { useEffect, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, View } from 'react-native';
import type { MealBillingType, UUID } from '../../api/types';
import { useMemberMealActivity } from '../../hooks/useMemberMealActivity';
import { colors, spacing } from '../../theme';
import { MemberMealBalancePanel } from './MemberMealBalancePanel';
import { MemberMealPaymentTimeline } from './MemberMealPaymentTimeline';
import { MemberMealActivityCalendarPanel } from './MemberMealActivityCalendarPanel';
import { MemberMealActivityHistoryPanel } from './MemberMealActivityHistoryPanel';
import { MemberMealActivityMonthNav } from './MemberMealActivityMonthNav';
import { MemberMealActivitySummaryCards } from './MemberMealActivitySummaryCards';
import { MemberMealActivityTabBar, type MemberMealActivityView } from './MemberMealActivityTabBar';

type MemberMealActivitySectionProps = {
  spaceId: UUID;
  memberId: UUID;
  effectiveMealBillingType?: MealBillingType;
  canManageBalance?: boolean;
  selectedDate?: string | null;
  onSelectDate: (date: string) => void;
  onBindReload?: (reload: () => void) => void;
};

export function MemberMealActivitySection({
  spaceId,
  memberId,
  effectiveMealBillingType,
  canManageBalance = false,
  selectedDate,
  onSelectDate,
  onBindReload,
}: MemberMealActivitySectionProps) {
  const [activeView, setActiveView] = useState<MemberMealActivityView>('history');
  const { month, loading, error, activity, reload, goToPreviousMonth, goToNextMonth } =
    useMemberMealActivity(spaceId, memberId);

  const isPrepaid = effectiveMealBillingType === 'PREPAID_BALANCE';

  useEffect(() => {
    onBindReload?.(reload);
  }, [onBindReload, reload]);

  const handlePurchased = () => {
    reload();
  };

  return (
    <View style={styles.wrap}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        stickyHeaderIndices={[0]}
        showsVerticalScrollIndicator
        nestedScrollEnabled
        keyboardShouldPersistTaps="handled">
        <View style={styles.stickyHeader}>
          <MemberMealActivityTabBar activeView={activeView} onViewChange={setActiveView} />
        </View>

        <View style={styles.body}>
          <MemberMealBalancePanel
            spaceId={spaceId}
            memberId={memberId}
            effectiveMealBillingType={effectiveMealBillingType}
            canManage={canManageBalance}
            onPurchased={handlePurchased}
          />
          {!isPrepaid ? (
            <MemberMealActivitySummaryCards view={activeView} activity={activity} />
          ) : null}

          <MemberMealActivityMonthNav
            month={month}
            onPreviousMonth={goToPreviousMonth}
            onNextMonth={goToNextMonth}
          />

          {isPrepaid ? null : (
            <MemberMealPaymentTimeline spaceId={spaceId} memberId={memberId} month={month} />
          )}

          {loading ? <ActivityIndicator color={colors.primary} style={styles.loader} /> : null}

          {activeView === 'calendar' ? (
            <MemberMealActivityCalendarPanel
              month={month}
              loading={loading}
              error={error}
              activity={activity}
              selectedDate={selectedDate}
              onSelectDate={onSelectDate}
            />
          ) : (
            <MemberMealActivityHistoryPanel
              month={month}
              loading={loading}
              error={error}
              activity={activity}
              onSelectDate={onSelectDate}
            />
          )}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flex: 1,
    minHeight: 320,
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
