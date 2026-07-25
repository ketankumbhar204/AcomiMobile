import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import type { MealType } from '../../api/types';
import { MealStatusBadge } from './MealStatusBadge';
import { MealTypeVisual } from './MealTypeVisual';
import { colors, radius, shadows, spacing, typography } from '../../theme';
import type { DashboardMealSlotCaptionTone } from '../../utils/dashboardMealSlotDisplay';
import { MENU_PLANNING_POLL_OPEN_COLOR } from '../../utils/menuPlanningStatusVisual';
import { mealStatusTheme, type MealStatusKind } from '../../utils/mealStatusTheme';

function captionToneColor(tone: DashboardMealSlotCaptionTone): string {
  switch (tone) {
    case 'complete':
      return colors.success;
    case 'progress':
      return MENU_PLANNING_POLL_OPEN_COLOR;
    default:
      return colors.textSecondary;
  }
}

export type MealOperationSlotCardProps = {
  mealLabel: string;
  caption: string;
  countPrimary?: string;
  countUnit?: string;
  captionTone: DashboardMealSlotCaptionTone;
  statusKind: MealStatusKind;
  onPress: () => void;
  /** When set, shows Design A meal-type icon (swap to photo later via MealTypeVisual). */
  mealType?: MealType;
  /** Drawer / strip selection — stronger border, elevation, slightly larger. */
  selected?: boolean;
  /** Slightly tighter padding for drawer strip. */
  compact?: boolean;
};

/**
 * Shared meal-slot card used on Dashboard Meal Operations and the headcount drawer strip.
 */
export function MealOperationSlotCard({
  mealLabel,
  caption,
  countPrimary,
  countUnit,
  captionTone,
  statusKind,
  onPress,
  mealType,
  selected = false,
  compact = false,
}: MealOperationSlotCardProps) {
  const theme = mealStatusTheme(statusKind);
  const toneColor = captionToneColor(captionTone);
  const showMetric = countPrimary != null && countPrimary.length > 0;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected }}
      accessibilityLabel={`${mealLabel}, ${caption}`}
      onPress={onPress}
      style={({ pressed }) => [
        styles.slotCard,
        compact && styles.slotCardCompact,
        {
          backgroundColor: selected ? theme.background : colors.white,
          borderColor: selected ? theme.color : colors.border,
        },
        selected && styles.slotCardSelected,
        selected && { borderColor: theme.color },
        pressed && styles.slotCardPressed,
        !selected && compact && styles.slotCardUnselectedCompact,
        !selected && !compact && styles.slotCardDesignA,
      ]}>
      {selected ? <View style={[styles.selectedIndicator, { backgroundColor: theme.color }]} /> : null}
      {/* TODO: pass imageSource on MealTypeVisual when meal photos are available */}
      {mealType && !compact ? <MealTypeVisual mealType={mealType} size={18} /> : null}
      <Text style={styles.slotMealLabel} numberOfLines={1}>
        {mealLabel}
      </Text>
      <MealStatusBadge kind={statusKind} size="compact" style={styles.slotStatusBadge} />
      {showMetric ? (
        <View style={styles.slotMetricBlock}>
          <View style={styles.slotCaptionRow}>
            <View style={[styles.slotBadgeDot, { backgroundColor: toneColor }]} />
            <Text style={[styles.slotCountPrimary, { color: toneColor }]} numberOfLines={1}>
              {countPrimary}
            </Text>
          </View>
          {countUnit ? (
            <Text style={[styles.slotCountUnit, { color: toneColor }]} numberOfLines={1}>
              {countUnit}
            </Text>
          ) : null}
        </View>
      ) : (
        <Text style={styles.slotCaption} numberOfLines={2}>
          {caption}
        </Text>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  slotCard: {
    flex: 1,
    minHeight: 96,
    borderRadius: radius.card,
    borderWidth: 1,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.xs,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xxs,
    overflow: 'hidden',
  },
  slotCardDesignA: {
    minHeight: 104,
    paddingVertical: spacing.sm,
    gap: spacing.xs,
    ...shadows.sm,
  },
  slotCardCompact: {
    minHeight: 88,
    paddingVertical: spacing.xs,
  },
  slotCardUnselectedCompact: {
    minHeight: 80,
    opacity: 0.92,
  },
  slotCardSelected: {
    borderWidth: 2.5,
    minHeight: 100,
    paddingVertical: spacing.sm,
    ...shadows.md,
    elevation: 4,
    transform: [{ scale: 1.02 }],
  },
  selectedIndicator: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 3,
  },
  slotCardPressed: {
    opacity: 0.92,
  },
  slotMealLabel: {
    ...typography.caption,
    color: colors.textPrimary,
    fontWeight: '700',
    textAlign: 'center',
    fontSize: 11,
  },
  slotStatusBadge: {
    alignSelf: 'center',
    maxWidth: '100%',
  },
  slotMetricBlock: {
    alignItems: 'center',
    gap: 2,
    marginTop: 2,
  },
  slotCaptionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    paddingHorizontal: 2,
  },
  slotBadgeDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    flexShrink: 0,
  },
  slotCountPrimary: {
    ...typography.bodyStrong,
    fontSize: 16,
    lineHeight: 20,
    textAlign: 'center',
    fontWeight: '800',
  },
  slotCountUnit: {
    ...typography.caption,
    fontSize: 10,
    lineHeight: 12,
    textAlign: 'center',
    fontWeight: '600',
  },
  slotCaption: {
    ...typography.caption,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 14,
    fontSize: 10,
    flexShrink: 1,
  },
});
