import React, { useMemo, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import type { MemberMealActivityMonth } from '../../api/types';
import { ScrollableChipRail, MenuChip } from './library';
import { colors, spacing, typography } from '../../theme';
import { todayIsoDate } from '../../utils/mealDates';
import {
  filterActivityDays,
  type ActivityHistoryFilter,
} from '../../utils/memberMealActivityHistory';
import { MemberMealActivityDayCard } from './MemberMealActivityDayCard';

type MemberMealActivityHistoryPanelProps = {
  month: string;
  loading: boolean;
  error: string | null;
  activity: MemberMealActivityMonth | null;
  onSelectDate: (date: string) => void;
};

const FILTERS: ActivityHistoryFilter[] = ['ALL', 'PAID', 'PENDING', 'SKIPPED'];

export function MemberMealActivityHistoryPanel({
  loading,
  error,
  activity,
  onSelectDate,
}: MemberMealActivityHistoryPanelProps) {
  const { t, i18n } = useTranslation();
  const [filter, setFilter] = useState<ActivityHistoryFilter>('ALL');
  const todayIso = todayIsoDate();

  const filteredDays = useMemo(
    () => filterActivityDays(activity?.days ?? [], filter, todayIso),
    [activity?.days, filter, todayIso],
  );

  if (error) {
    return <Text style={styles.error}>{error}</Text>;
  }

  return (
    <View style={styles.wrap}>
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
  list: {
    gap: spacing.sm,
  },
  error: {
    ...typography.caption,
    color: '#DC2626',
  },
  emptyText: {
    ...typography.body,
    color: colors.muted,
    textAlign: 'center',
    paddingVertical: spacing.md,
  },
});
