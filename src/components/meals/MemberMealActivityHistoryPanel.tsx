import React, { useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import type { MemberMealActivityMonth } from '../../api/types';
import { ScrollableChipRail, MenuChip } from './library';
import { colors, spacing, typography } from '../../theme';
import { todayIsoDate } from '../../utils/mealDates';
import {
  filterActivityDays,
  type ActivityDateSortOrder,
  type ActivityHistoryFilter,
} from '../../utils/memberMealActivityHistory';
import { MemberMealActivityDayCard } from './MemberMealActivityDayCard';

type MemberMealActivityHistoryPanelProps = {
  month: string;
  loading: boolean;
  error: string | null;
  activity: MemberMealActivityMonth | null;
  onSelectDate: (date: string) => void;
  onRetry?: () => void;
};

const FILTERS: ActivityHistoryFilter[] = ['ALL', 'PAID', 'PENDING', 'SKIPPED'];

export function MemberMealActivityHistoryPanel({
  loading,
  error,
  activity,
  onSelectDate,
  onRetry,
}: MemberMealActivityHistoryPanelProps) {
  const { t, i18n } = useTranslation();
  const [filter, setFilter] = useState<ActivityHistoryFilter>('ALL');
  const [sortOrder, setSortOrder] = useState<ActivityDateSortOrder>('desc');
  const todayIso = todayIsoDate();

  const filteredDays = useMemo(
    () => filterActivityDays(activity?.days ?? [], filter, todayIso, sortOrder),
    [activity?.days, filter, sortOrder, todayIso],
  );

  const toggleSort = () => {
    setSortOrder(prev => (prev === 'desc' ? 'asc' : 'desc'));
  };

  if (error) {
    return (
      <View style={styles.errorWrap}>
        <Text style={styles.error}>{error}</Text>
        {onRetry ? (
          <Pressable onPress={onRetry} accessibilityRole="button">
            <Text style={styles.retry}>{t('common.retry')}</Text>
          </Pressable>
        ) : null}
      </View>
    );
  }

  return (
    <View style={styles.wrap}>
      <View style={styles.toolbar}>
        <View style={styles.chips}>
          <ScrollableChipRail>
            {FILTERS.map(item => (
              <MenuChip
                key={item}
                label={t(
                  `meals.activity.history.filter${item === 'ALL' ? 'All' : item.charAt(0) + item.slice(1).toLowerCase()}`,
                )}
                variant="filter"
                size="compact"
                selected={filter === item}
                onPress={() => setFilter(item)}
              />
            ))}
          </ScrollableChipRail>
        </View>
        <Pressable
          onPress={toggleSort}
          style={({ pressed }) => [styles.sortButton, pressed && styles.sortButtonPressed]}
          accessibilityRole="button"
          accessibilityLabel={
            sortOrder === 'desc'
              ? t('meals.activity.history.sortNewestFirst')
              : t('meals.activity.history.sortOldestFirst')
          }
          hitSlop={8}>
          <Text style={styles.sortIcon}>{sortOrder === 'desc' ? '↓' : '↑'}</Text>
        </Pressable>
      </View>

      {!loading && filteredDays.length === 0 ? (
        <Text style={styles.emptyText}>{t('meals.activity.history.empty')}</Text>
      ) : (
        <View style={styles.list}>
          {filteredDays.map(day => (
            <MemberMealActivityDayCard
              key={day.date}
              day={day}
              todayIso={todayIso}
              locale={i18n.language}
              onPress={onSelectDate}
            />
          ))}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    gap: spacing.sm,
  },
  toolbar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  chips: {
    flex: 1,
    minWidth: 0,
  },
  sortButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sortButtonPressed: {
    opacity: 0.85,
    backgroundColor: colors.lightGreen,
  },
  sortIcon: {
    ...typography.bodyStrong,
    color: colors.primaryDark,
    fontSize: 18,
    lineHeight: 22,
  },
  list: {
    gap: spacing.sm,
  },
  errorWrap: {
    gap: spacing.sm,
    paddingVertical: spacing.sm,
  },
  error: {
    ...typography.caption,
    color: '#DC2626',
  },
  retry: {
    ...typography.bodyStrong,
    color: colors.primaryDark,
  },
  emptyText: {
    ...typography.body,
    color: colors.muted,
    textAlign: 'center',
    paddingVertical: spacing.md,
  },
});
