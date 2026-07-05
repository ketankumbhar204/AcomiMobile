import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import type { DailyMenuResponse, MealPollSlot, MealType } from '../../api/types';
import { Button } from '../ui/Button';
import { colors, radius, spacing, typography } from '../../theme';
import type { DailyMenuDaySummary } from '../../utils/dailyMenuDayStatus';
import { mealTypeLabelKey, MEAL_TYPES } from '../../utils/mealLabels';
import {
  MENU_PLANNING_STATUSES,
  type MenuPlanningStatusFilter,
} from '../../utils/menuPlanningFilter';
import { toggleSetValue } from '../../utils/filterCount';
import {
  menuPlanningStatusFilterLabelKey,
  MENU_PLANNING_STATUS_COLORS,
  MENU_PLANNING_STATUS_SYMBOLS,
  resolveMealSlotOverviewDetail,
} from '../../utils/menuPlanningStatusVisual';

type MenuPlanningDayOverviewProps = {
  menuMap: Partial<Record<MealType, DailyMenuResponse>>;
  pollMap: Partial<Record<MealType, MealPollSlot>>;
  statusSummary: DailyMenuDaySummary;
  eligibleCount: number;
  selectedFilters: Set<MenuPlanningStatusFilter>;
  onFilterChange: (selected: Set<MenuPlanningStatusFilter>) => void;
  shareDisabled?: boolean;
  onShare?: () => void;
  dateReadOnly?: boolean;
};

function isFilterActive(selected: Set<MenuPlanningStatusFilter>, id: MenuPlanningStatusFilter) {
  return selected.size === 0 || selected.has(id);
}

function CompactMealSlotCell({
  mealType,
  menu,
  poll,
}: {
  mealType: MealType;
  menu?: DailyMenuResponse | null;
  poll?: MealPollSlot | null;
}) {
  const { t } = useTranslation();
  const { status } = resolveMealSlotOverviewDetail(menu, poll);
  const color = MENU_PLANNING_STATUS_COLORS[status];
  const symbol = MENU_PLANNING_STATUS_SYMBOLS[status];
  const statusLabel = t(menuPlanningStatusFilterLabelKey(status));
  const responseCount = poll?.responseCount ?? 0;
  const showResponses = status === 'published';

  return (
    <View style={[styles.slotCell, { borderColor: color }]}>
      <Text style={styles.slotName} numberOfLines={1}>
        {t(mealTypeLabelKey(mealType))}
      </Text>
      <View style={styles.slotStatusRow}>
        <Text style={[styles.slotSymbol, { color }]}>{symbol}</Text>
        <Text style={[styles.slotStatus, { color }]} numberOfLines={1}>
          {statusLabel}
        </Text>
      </View>
      {showResponses ? (
        <Text style={styles.slotResponses} numberOfLines={1}>
          {t('meals.planning.slotChoseShort', { count: responseCount })}
        </Text>
      ) : null}
    </View>
  );
}

export function MenuPlanningDayOverview({
  menuMap,
  pollMap,
  statusSummary,
  eligibleCount,
  selectedFilters,
  onFilterChange,
  shareDisabled = false,
  onShare,
  dateReadOnly = false,
}: MenuPlanningDayOverviewProps) {
  const { t } = useTranslation();

  return (
    <View style={styles.wrap}>
      <View style={styles.mealStrip}>
        {MEAL_TYPES.map(mealType => (
          <CompactMealSlotCell
            key={mealType}
            mealType={mealType}
            menu={menuMap[mealType]}
            poll={pollMap[mealType]}
          />
        ))}
      </View>

      <View style={styles.toolbar}>
        <View style={styles.countRow}>
          {MENU_PLANNING_STATUSES.map(status => {
            const active = isFilterActive(selectedFilters, status);
            const count =
              status === 'published'
                ? statusSummary.published
                : status === 'draft'
                  ? statusSummary.draft
                  : statusSummary.notPlanned;
            const color = MENU_PLANNING_STATUS_COLORS[status];
            const label = t(menuPlanningStatusFilterLabelKey(status));

            return (
              <Pressable
                key={status}
                onPress={() => onFilterChange(toggleSetValue(selectedFilters, status))}
                style={[styles.countChip, active && styles.countChipActive]}
                accessibilityRole="button"
                accessibilityState={{ selected: active }}
                accessibilityLabel={`${label}, ${count}`}>
                <View style={[styles.dot, { backgroundColor: color }]} />
                <Text style={[styles.count, active && styles.countActive]}>{count}</Text>
              </Pressable>
            );
          })}

          <View style={styles.divider} />

          <View
            style={styles.membersChip}
            accessibilityLabel={t('meals.planning.eligibleMembers', { count: eligibleCount })}>
            <Text style={styles.membersCount}>{eligibleCount}</Text>
            <Text style={styles.membersLabel}>{t('meals.planning.membersShort')}</Text>
          </View>
        </View>

        {onShare && !dateReadOnly ? (
          <Button
            label={t('meals.planning.shareMenu')}
            disabled={shareDisabled}
            onPress={onShare}
            style={styles.shareButton}
          />
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  mealStrip: {
    flexDirection: 'row',
    gap: spacing.xs,
  },
  slotCell: {
    flex: 1,
    minWidth: 0,
    borderWidth: 1,
    borderRadius: radius.button,
    backgroundColor: colors.white,
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.xs,
    gap: 2,
  },
  slotName: {
    ...typography.caption,
    fontWeight: '700',
    color: colors.textPrimary,
    textAlign: 'center',
    fontSize: 11,
  },
  slotStatusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 3,
  },
  slotSymbol: {
    fontSize: 11,
    fontWeight: '800',
    lineHeight: 14,
  },
  slotStatus: {
    ...typography.caption,
    fontWeight: '700',
    fontSize: 11,
    lineHeight: 14,
  },
  slotResponses: {
    ...typography.caption,
    color: colors.muted,
    fontSize: 10,
    lineHeight: 12,
    textAlign: 'center',
  },
  toolbar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  countRow: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    minWidth: 0,
  },
  countChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.full,
    backgroundColor: colors.white,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xxs,
  },
  countChipActive: {
    borderColor: colors.primary,
    backgroundColor: colors.lightGreen,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  count: {
    ...typography.bodyStrong,
    fontSize: 13,
    color: colors.textPrimary,
    minWidth: 10,
    textAlign: 'center',
  },
  countActive: {
    color: colors.primaryDark,
  },
  divider: {
    width: 1,
    height: 16,
    backgroundColor: colors.border,
    marginHorizontal: spacing.xxs,
  },
  membersChip: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 3,
  },
  membersCount: {
    ...typography.bodyStrong,
    fontSize: 13,
    color: colors.primaryDark,
  },
  membersLabel: {
    ...typography.caption,
    color: colors.muted,
    fontWeight: '600',
    fontSize: 11,
  },
  shareButton: {
    minHeight: 36,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    flexShrink: 0,
  },
});
