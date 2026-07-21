import React from 'react';
import { StyleSheet, Text, View, type StyleProp, type ViewStyle } from 'react-native';
import { useTranslation } from 'react-i18next';
import type { DailyMenuResponse, MealPollSlot } from '../../api/types';
import { radius, spacing, typography } from '../../theme';
import {
  mealStatusTheme,
  resolveMealStatusKind,
  type MealStatusKind,
} from '../../utils/mealStatusTheme';

type MealStatusBadgeProps = {
  /** Explicit status. Prefer this when already resolved. */
  kind?: MealStatusKind;
  menu?: DailyMenuResponse | null;
  poll?: Pick<MealPollSlot, 'status'> | null;
  /** compact = icon + short label; pill = filled chip */
  size?: 'compact' | 'default';
  style?: StyleProp<ViewStyle>;
};

/**
 * Single meal-status badge used across Dashboard, Menu Planning, Share, etc.
 */
export function MealStatusBadge({
  kind: kindProp,
  menu,
  poll,
  size = 'default',
  style,
}: MealStatusBadgeProps) {
  const { t } = useTranslation();
  const kind = kindProp ?? resolveMealStatusKind(menu, poll);
  const theme = mealStatusTheme(kind);
  const label = t(theme.labelKey);
  const compact = size === 'compact';

  return (
    <View
      style={[
        styles.badge,
        compact && styles.badgeCompact,
        {
          borderColor: theme.color,
          backgroundColor: theme.background,
        },
        style,
      ]}
      accessibilityRole="text"
      accessibilityLabel={label}>
      <Text style={[styles.icon, compact && styles.iconCompact, { color: theme.color }]}>
        {theme.icon}
      </Text>
      <Text
        style={[styles.label, compact && styles.labelCompact, { color: theme.color }]}
        numberOfLines={1}>
        {label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    borderWidth: 1,
    borderRadius: radius.full,
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
    alignSelf: 'flex-start',
    maxWidth: '100%',
  },
  badgeCompact: {
    paddingHorizontal: spacing.xs,
    paddingVertical: 2,
    gap: 3,
  },
  icon: {
    fontSize: 12,
    fontWeight: '700',
    lineHeight: 14,
  },
  iconCompact: {
    fontSize: 11,
    lineHeight: 13,
  },
  label: {
    ...typography.caption,
    fontWeight: '700',
    fontSize: 11,
    lineHeight: 14,
    flexShrink: 1,
  },
  labelCompact: {
    fontSize: 10,
    lineHeight: 12,
  },
});
