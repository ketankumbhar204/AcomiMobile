import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Share2 } from 'lucide-react-native';
import type { DailyMenuResponse, MealType } from '../../api/types';
import { colors, radius, shadows, spacing, typography } from '../../theme';
import { mealTypeLabelKey, MEAL_TYPES } from '../../utils/mealLabels';
import type { DailyMenuDaySummary } from '../../utils/dailyMenuDayStatus';
import { MealTypeVisual } from './MealTypeVisual';

type MenuPlanningDayOverviewProps = {
  menuMap: Partial<Record<MealType, DailyMenuResponse>>;
  statusSummary: DailyMenuDaySummary;
  selectedMealType: MealType;
  onSelectMealType: (mealType: MealType) => void;
  onShareDay?: () => void;
  shareDisabled?: boolean;
  dateReadOnly?: boolean;
};

function CompactMealSlotCell({
  mealType,
  menu,
  selected,
  onPress,
}: {
  mealType: MealType;
  menu?: DailyMenuResponse | null;
  selected: boolean;
  onPress: () => void;
}) {
  const { t } = useTranslation();
  const hasPlan = (menu?.options?.filter(option => option.isAvailable) ?? []).length > 0;
  const status =
    !hasPlan
      ? 'not_planned'
      : menu?.status === 'PUBLISHED'
        ? 'shared'
        : menu?.status === 'MODIFIED'
          ? 'updated'
          : 'planned';
  const statusLabel =
    status === 'not_planned'
      ? t('meals.planning.selector.notPlanned', { defaultValue: 'Not planned' })
      : status === 'shared'
        ? t('meals.planning.selector.shared', { defaultValue: 'Shared' })
        : status === 'updated'
          ? t('meals.planning.selector.updated', { defaultValue: 'Updated' })
          : t('meals.planning.selector.planned', { defaultValue: 'Planned' });
  const actionLabel = hasPlan
    ? t('meals.planning.selector.viewMenu', { defaultValue: 'View menu' })
    : t('meals.planning.selector.planMenu', { defaultValue: 'Plan menu' });

  return (
    <Pressable
      onPress={onPress}
      android_ripple={{ color: 'rgba(18, 140, 126, 0.12)' }}
      style={({ pressed }) => [
        styles.slotCell,
        selected && styles.slotCellSelected,
        selected && { borderColor: colors.primary, backgroundColor: '#F0FDF4' },
        !selected && { borderColor: colors.border, backgroundColor: colors.white },
        pressed && styles.slotCellPressed,
      ]}
      accessibilityRole="tab"
      accessibilityState={{ selected }}
      accessibilityLabel={`${t(mealTypeLabelKey(mealType))}, ${statusLabel}`}>
      <MealTypeVisual mealType={mealType} size={18} style={styles.slotIcon} />
      <Text style={[styles.slotName, selected && styles.slotNameSelected]} numberOfLines={1}>
        {t(mealTypeLabelKey(mealType))}
      </Text>
      <View
        style={[
          styles.statusChip,
          status === 'shared' && styles.statusShared,
          status === 'updated' && styles.statusUpdated,
          status === 'planned' && styles.statusPlanned,
          status === 'not_planned' && styles.statusNotPlanned,
        ]}>
        <Text
          style={[
            styles.statusText,
            status === 'shared' && styles.statusSharedText,
            status === 'updated' && styles.statusUpdatedText,
            status === 'planned' && styles.statusPlannedText,
            status === 'not_planned' && styles.statusNotPlannedText,
          ]}
          numberOfLines={1}>
          {statusLabel}
        </Text>
      </View>
      <Text style={styles.slotHint} numberOfLines={1}>
        {actionLabel}
      </Text>
    </Pressable>
  );
}

export function MenuPlanningDayOverview({
  menuMap,
  statusSummary,
  selectedMealType,
  onSelectMealType,
  onShareDay,
  shareDisabled = false,
  dateReadOnly = false,
}: MenuPlanningDayOverviewProps) {
  const { t } = useTranslation();
  const dayStatus =
    statusSummary.modified > 0
      ? 'updated'
      : statusSummary.published > 0 &&
          statusSummary.draft === 0 &&
          statusSummary.modified === 0
        ? 'shared'
        : 'not_shared';
  const dayStatusLabel =
    dayStatus === 'updated'
      ? t('meals.planning.dayShare.updated', {
          defaultValue: 'Updated since last share',
        })
      : dayStatus === 'shared'
        ? t('meals.planning.dayShare.shared', { defaultValue: 'Shared' })
        : t('meals.planning.dayShare.notShared', { defaultValue: 'Not shared' });

  return (
    <View style={styles.wrap}>
      <View style={styles.dayShare}>
        <View style={styles.dayStatus}>
          <View
            style={[
              styles.dayStatusDot,
              dayStatus === 'shared' && styles.dayStatusDotShared,
              dayStatus === 'updated' && styles.dayStatusDotUpdated,
            ]}
          />
          <Text
            style={[
              styles.dayStatusText,
              dayStatus === 'shared' && styles.dayStatusTextShared,
              dayStatus === 'updated' && styles.dayStatusTextUpdated,
            ]}
            numberOfLines={1}>
            {dayStatusLabel}
          </Text>
        </View>
        <View style={styles.dayShareDivider} />
        <Pressable
          onPress={!dateReadOnly && !shareDisabled ? onShareDay : undefined}
          disabled={dateReadOnly || shareDisabled || !onShareDay}
          android_ripple={{ color: 'rgba(18, 140, 126, 0.1)' }}
          style={({ pressed }) => [
            styles.dayShareAction,
            (dateReadOnly || shareDisabled) && styles.dayShareDisabled,
            pressed && styles.slotCellPressed,
          ]}
          accessibilityRole="button"
          accessibilityState={{ disabled: dateReadOnly || shareDisabled }}>
          <Share2 size={17} color={colors.primaryDark} strokeWidth={2.2} />
          <Text style={styles.dayShareActionText} numberOfLines={1}>
            {t('meals.planning.dayShare.action', {
              defaultValue: "Share today's menu",
            })}
          </Text>
        </Pressable>
      </View>
      <Text style={styles.dayShareSubtitle}>
        {t('meals.planning.dayShare.subtitle', {
          defaultValue: 'Share Breakfast, Lunch and Dinner together',
        })}
      </Text>

      <View style={styles.mealStrip} accessibilityRole="tablist">
        {MEAL_TYPES.map(mealType => (
          <CompactMealSlotCell
            key={mealType}
            mealType={mealType}
            menu={menuMap[mealType]}
            selected={selectedMealType === mealType}
            onPress={() => onSelectMealType(mealType)}
          />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    gap: spacing.sm,
  },
  dayShare: {
    minHeight: 44,
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: `${colors.primary}33`,
    borderRadius: radius.full,
    backgroundColor: '#F8FFFB',
    overflow: 'hidden',
  },
  dayStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingHorizontal: spacing.md,
  },
  dayStatusDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: '#F59E0B',
  },
  dayStatusDotShared: {
    backgroundColor: colors.success,
  },
  dayStatusDotUpdated: {
    backgroundColor: '#2563EB',
  },
  dayStatusText: {
    ...typography.caption,
    color: '#C2410C',
    fontSize: 12,
    fontWeight: '700',
  },
  dayStatusTextShared: {
    color: colors.success,
  },
  dayStatusTextUpdated: {
    color: '#2563EB',
  },
  dayShareDivider: {
    width: 1,
    height: 22,
    backgroundColor: colors.border,
  },
  dayShareAction: {
    minHeight: 44,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
  },
  dayShareDisabled: {
    opacity: 0.45,
  },
  dayShareActionText: {
    ...typography.bodyStrong,
    color: colors.primaryDark,
    fontSize: 13,
    fontWeight: '600',
  },
  dayShareSubtitle: {
    ...typography.caption,
    color: colors.textSecondary,
    fontSize: 12,
    textAlign: 'center',
  },
  mealStrip: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  slotCell: {
    flex: 1,
    minWidth: 0,
    minHeight: 132,
    borderWidth: 1,
    borderRadius: radius.button,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.xs,
    gap: spacing.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  slotCellSelected: {
    borderWidth: 2,
    ...shadows.sm,
    transform: [{ scale: 1.02 }],
  },
  slotCellPressed: {
    opacity: 0.92,
  },
  slotIcon: {
    width: 38,
    height: 38,
    borderRadius: 19,
  },
  slotName: {
    ...typography.caption,
    fontWeight: '700',
    color: colors.textPrimary,
    textAlign: 'center',
    fontSize: 12,
    lineHeight: 14,
  },
  slotNameSelected: {
    color: colors.primaryDark,
  },
  statusChip: {
    maxWidth: '100%',
    minHeight: 24,
    justifyContent: 'center',
    borderWidth: 1,
    borderRadius: radius.full,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
  },
  statusNotPlanned: {
    borderColor: '#FDBA74',
    backgroundColor: '#FFF7ED',
  },
  statusPlanned: {
    borderColor: '#86EFAC',
    backgroundColor: '#F0FDF4',
  },
  statusShared: {
    borderColor: '#6EE7B7',
    backgroundColor: '#ECFDF5',
  },
  statusUpdated: {
    borderColor: '#93C5FD',
    backgroundColor: '#EFF6FF',
  },
  statusText: {
    ...typography.caption,
    fontSize: 10,
    lineHeight: 12,
    fontWeight: '700',
  },
  statusNotPlannedText: {
    color: '#C2410C',
  },
  statusPlannedText: {
    color: colors.success,
  },
  statusSharedText: {
    color: colors.success,
  },
  statusUpdatedText: {
    color: '#2563EB',
  },
  slotHint: {
    ...typography.caption,
    color: colors.textSecondary,
    fontSize: 12,
    lineHeight: 14,
    fontWeight: '500',
    textAlign: 'center',
  },
});
