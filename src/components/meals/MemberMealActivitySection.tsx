import React, { useEffect, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, View } from 'react-native';
import type { UUID } from '../../api/types';
import { useMemberMealActivity } from '../../hooks/useMemberMealActivity';
import { colors, spacing } from '../../theme';
import { MemberMealActivityCalendarPanel } from './MemberMealActivityCalendarPanel';
import { MemberMealActivityHistoryPanel } from './MemberMealActivityHistoryPanel';
import { MemberMealActivityMonthNav } from './MemberMealActivityMonthNav';
import { MemberMealActivitySummaryCards } from './MemberMealActivitySummaryCards';
import { MemberMealActivityTabBar, type MemberMealActivityView } from './MemberMealActivityTabBar';

type MemberMealActivitySectionProps = {
  spaceId: UUID;
  memberId: UUID;
  selectedDate?: string | null;
  onSelectDate: (date: string) => void;
  onBindReload?: (reload: () => void) => void;
};

export function MemberMealActivitySection({
  spaceId,
  memberId,
  selectedDate,
  onSelectDate,
  onBindReload,
}: MemberMealActivitySectionProps) {
  const [activeView, setActiveView] = useState<MemberMealActivityView>('history');
  const { month, loading, error, activity, reload, goToPreviousMonth, goToNextMonth } =
    useMemberMealActivity(spaceId, memberId);

  useEffect(() => {
    onBindReload?.(reload);
  }, [onBindReload, reload]);

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
          <MemberMealActivitySummaryCards view={activeView} activity={activity} />

          <MemberMealActivityMonthNav
            month={month}
            onPreviousMonth={goToPreviousMonth}
            onNextMonth={goToNextMonth}
          />

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
