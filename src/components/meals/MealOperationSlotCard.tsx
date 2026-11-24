import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import type { MealType } from '../../api/types';
import { MealStatusBadge } from './MealStatusBadge';
import { MealTypeVisual } from './MealTypeVisual';
import { colors, radius, shadows, spacing, typography } from '../../theme';
import type { DashboardMealSlotCaptionTone } from '../../utils/dashboardMealSlotDisplay';
import { mealStatusTheme, type MealStatusKind } from '../../utils/mealStatusTheme';

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

const COUNT_PLACEHOLDER = '—';

/**
 * Shared meal-slot card used on Dashboard Meal Operations and the headcount drawer strip.
 * Entire card surface follows SHARED / READY TO SHARE / EMPTY status colours.
 *
 * Layout is a fixed vertical stack so sibling cards stay row-aligned:
 * icon → title → status → count → message.
 */
export function MealOperationSlotCard({
  mealLabel,
  caption,
  countPrimary,
  countUnit,
  captionTone: _captionTone,
  statusKind,
  onPress,
  mealType,
  selected = false,
  compact = false,
}: MealOperationSlotCardProps) {
  const statusTheme = mealStatusTheme(statusKind);
  const accent = statusTheme.color;
  const metricValue =
    countPrimary != null && countPrimary.length > 0 ? countPrimary : COUNT_PLACEHOLDER;
  const message = countUnit && countUnit.length > 0 ? countUnit : caption;
  const showIcon = Boolean(mealType) && !compact;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected }}
      accessibilityLabel={`${mealLabel}, ${metricValue}, ${message}`}
      onPress={onPress}
      style={({ pressed }) => [
        styles.slotCard,
        compact && styles.slotCardCompact,
        {
          backgroundColor: statusTheme.background,
          borderColor: statusTheme.border,
          borderWidth: selected ? 2 : 1.5,
        },
        pressed && styles.slotCardPressed,
        !selected && compact && styles.slotCardUnselectedCompact,
        !selected && !compact && styles.slotCardDesignA,
      ]}>
      {selected ? (
        <View style={[styles.selectedIndicator, { backgroundColor: accent }]} />
      ) : null}
      {/* TODO: pass imageSource on MealTypeVisual when meal photos are available */}
      {showIcon ? (
        <View style={styles.iconSlot}>
          <MealTypeVisual mealType={mealType!} size={18} color={accent} />
        </View>
      ) : null}
      <Text style={[styles.slotMealLabel, { color: accent }]} numberOfLines={1}>
        {mealLabel}
      </Text>
      <View style={[styles.badgeSlot, compact && styles.badgeSlotCompact]}>
        <MealStatusBadge
          kind={statusKind}
          size={compact ? 'compact' : 'default'}
          style={styles.slotStatusBadge}
        />
      </View>
      <View style={styles.slotMetricBlock}>
        <Text style={[styles.slotCountPrimary, { color: accent }]} numberOfLines={1}>
          {metricValue}
        </Text>
        <Text style={[styles.slotCountUnit, { color: accent }]} numberOfLines={2}>
          {message}
        </Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  slotCard: {
    flex: 1,
    minHeight: 96,
    borderRadius: radius.card,
    borderWidth: 1.5,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.xs,
    alignItems: 'center',
    justifyContent: 'flex-start',
    gap: spacing.xxs,
    overflow: 'hidden',
  },
  slotCardDesignA: {
    minHeight: 132,
    paddingVertical: spacing.sm,
    gap: spacing.xs,
    ...shadows.sm,
  },
  slotCardCompact: {
    minHeight: 96,
    paddingVertical: spacing.xs,
  },
  slotCardUnselectedCompact: {
    minHeight: 88,
    opacity: 0.92,
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
  iconSlot: {
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  slotMealLabel: {
    ...typography.bodyStrong,
    color: colors.textPrimary,
    fontWeight: '700',
    textAlign: 'center',
    fontSize: 16,
    lineHeight: 20,
    minHeight: 20,
  },
  badgeSlot: {
    minHeight: 28,
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeSlotCompact: {
    minHeight: 22,
  },
  slotStatusBadge: {
    alignSelf: 'center',
    maxWidth: '100%',
  },
  slotMetricBlock: {
    alignItems: 'center',
    gap: 2,
    marginTop: 2,
    width: '100%',
  },
  slotCountPrimary: {
    ...typography.bodyStrong,
    fontSize: 18,
    lineHeight: 22,
    minHeight: 22,
    textAlign: 'center',
    fontWeight: '800',
  },
  slotCountUnit: {
    ...typography.caption,
    fontSize: 12,
    lineHeight: 15,
    minHeight: 15,
    textAlign: 'center',
    fontWeight: '600',
  },
});
