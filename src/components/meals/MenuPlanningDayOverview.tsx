import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import type { DailyMenuResponse, MealPollSlot, MealType } from '../../api/types';
import { Button } from '../ui/Button';
import { colors, radius, spacing, typography } from '../../theme';
import type { DailyMenuDaySummary } from '../../utils/dailyMenuDayStatus';
import { mealTypeLabelKey, MEAL_TYPES } from '../../utils/mealLabels';
import {
  MENU_PLANNING_POLL_OPEN_COLOR,
  resolveMealSlotCardHint,
} from '../../utils/menuPlanningStatusVisual';
import { mealStatusTheme, resolveMealStatusKind } from '../../utils/mealStatusTheme';
import { MealStatusBadge } from './MealStatusBadge';

type MenuPlanningDayOverviewProps = {
  menuMap: Partial<Record<MealType, DailyMenuResponse>>;
  pollMap: Partial<Record<MealType, MealPollSlot>>;
  eligibilityByMeal?: Partial<Record<MealType, number>>;
  statusSummary: DailyMenuDaySummary;
  eligibleCount: number;
  selectedMealType: MealType;
  onSelectMealType: (mealType: MealType) => void;
  shareDisabled?: boolean;
  onShare?: () => void;
  dateReadOnly?: boolean;
  hasOpenPolls?: boolean;
  respondedCount?: number;
};

function CompactMealSlotCell({
  mealType,
  menu,
  poll,
  eligibleCount,
  selected,
  onPress,
}: {
  mealType: MealType;
  menu?: DailyMenuResponse | null;
  poll?: MealPollSlot | null;
  eligibleCount: number;
  selected: boolean;
  onPress: () => void;
}) {
  const { t } = useTranslation();
  const hint = resolveMealSlotCardHint(menu, poll, eligibleCount);
  const statusKind = resolveMealStatusKind(menu);
  const theme = mealStatusTheme(statusKind);
  const secondary = t(hint.hintKey, hint.hintParams);
  const backgroundColor = selected ? theme.background : colors.white;
  const borderColor = selected ? colors.primary : theme.color;
  const secondaryColor = hint.pollOpen ? MENU_PLANNING_POLL_OPEN_COLOR : colors.muted;

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.slotCell,
        {
          borderColor,
          backgroundColor,
          borderWidth: selected ? 2 : 1,
        },
        selected && styles.slotCellSelected,
        pressed && styles.slotCellPressed,
      ]}
      accessibilityRole="tab"
      accessibilityState={{ selected }}
      accessibilityLabel={`${t(mealTypeLabelKey(mealType))}, ${t(theme.labelKey)}, ${secondary}`}>
      <Text style={[styles.slotName, selected && styles.slotNameSelected]} numberOfLines={1}>
        {t(mealTypeLabelKey(mealType))}
      </Text>
      <MealStatusBadge kind={statusKind} size="compact" style={styles.slotBadge} />
      <Text style={[styles.slotHint, { color: secondaryColor }]} numberOfLines={1}>
        {hint.pollOpen ? `👥 ${secondary}` : secondary}
      </Text>
    </Pressable>
  );
}

export function MenuPlanningDayOverview({
  menuMap,
  pollMap,
  eligibilityByMeal = {},
  statusSummary,
  eligibleCount,
  selectedMealType,
  onSelectMealType,
  shareDisabled = false,
  onShare,
  dateReadOnly = false,
  hasOpenPolls = false,
  respondedCount = 0,
}: MenuPlanningDayOverviewProps) {
  const { t } = useTranslation();
  const notShared = statusSummary.draft + statusSummary.modified;

  const pollLine = hasOpenPolls
    ? t('dashboard.operations.pollOpenLine', {
        responded: respondedCount,
        eligible: eligibleCount,
      })
    : statusSummary.published > 0
      ? t('dashboard.operations.pollClosed')
      : statusSummary.draft > 0
        ? t('dashboard.operations.pollNotOpenDraft')
        : t('dashboard.operations.pollNotOpen');

  return (
    <View style={styles.wrap}>
      <View style={styles.mealStrip} accessibilityRole="tablist">
        {MEAL_TYPES.map(mealType => (
          <CompactMealSlotCell
            key={mealType}
            mealType={mealType}
            menu={menuMap[mealType]}
            poll={pollMap[mealType]}
            eligibleCount={eligibilityByMeal[mealType] ?? eligibleCount}
            selected={selectedMealType === mealType}
            onPress={() => onSelectMealType(mealType)}
          />
        ))}
      </View>

      <View style={styles.toolbar}>
        <View style={styles.summaryBlock}>
          <Text style={styles.dayStatusLine} numberOfLines={1}>
            {t('meals.planning.dayStatusVisual', {
              shared: statusSummary.published,
              notShared,
              empty: statusSummary.notPlanned,
            })}
          </Text>
          <Text
            style={[styles.pollLine, hasOpenPolls && styles.pollLineOpen]}
            numberOfLines={2}>
            {pollLine}
            {eligibleCount > 0
              ? ` · ${eligibleCount} ${t('meals.planning.membersShort')}`
              : ''}
          </Text>
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
  slotCellSelected: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  slotCellPressed: {
    opacity: 0.9,
  },
  slotName: {
    ...typography.caption,
    fontWeight: '700',
    color: colors.textPrimary,
    textAlign: 'center',
    fontSize: 11,
  },
  slotNameSelected: {
    color: colors.primaryDark,
  },
  slotBadge: {
    alignSelf: 'center',
    maxWidth: '100%',
  },
  slotHint: {
    ...typography.caption,
    fontSize: 10,
    lineHeight: 12,
    textAlign: 'center',
  },
  toolbar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  summaryBlock: {
    flex: 1,
    minWidth: 0,
    gap: 2,
  },
  dayStatusLine: {
    ...typography.caption,
    color: colors.muted,
    fontWeight: '600',
  },
  pollLine: {
    ...typography.caption,
    color: colors.textSecondary,
    fontSize: 11,
    lineHeight: 14,
  },
  pollLineOpen: {
    color: MENU_PLANNING_POLL_OPEN_COLOR,
    fontWeight: '600',
  },
  shareButton: {
    minHeight: 36,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    flexShrink: 0,
  },
});
