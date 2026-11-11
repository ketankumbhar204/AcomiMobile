import React from 'react';
import { StyleSheet, Text, View, type StyleProp, type ViewStyle } from 'react-native';
import { Check, Circle, Send } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import type { DailyMenuResponse, MealPollSlot } from '../../api/types';
import { radius, spacing, typography } from '../../theme';
import {
  isReadyToShareKind,
  mealStatusTheme,
  resolveMealStatusKind,
  type MealStatusKind,
} from '../../utils/mealStatusTheme';

type MealStatusBadgeProps = {
  /** Explicit status. Prefer this when already resolved. */
  kind?: MealStatusKind;
  menu?: DailyMenuResponse | null;
  poll?: Pick<MealPollSlot, 'status'> | null;
  /** compact = tighter chip for dense rows; default = dashboard-scale badge */
  size?: 'compact' | 'default';
  style?: StyleProp<ViewStyle>;
};

/**
 * Single meal-status badge used across Dashboard, Menu Planning, Share, etc.
 * Solid filled chip: SHARED (green) / READY TO SHARE (blue) / EMPTY (orange).
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
  const StatusIcon = kind === 'shared' ? Check : isReadyToShareKind(kind) ? Send : Circle;

  return (
    <View
      style={[
        styles.badge,
        compact && styles.badgeCompact,
        {
          backgroundColor: theme.badgeBackground,
        },
        style,
      ]}
      accessibilityRole="text"
      accessibilityLabel={label}>
      <StatusIcon
        size={compact ? 11 : 13}
        color={theme.badgeForeground}
        strokeWidth={2.6}
      />
      <Text
        style={[
          styles.label,
          compact && styles.labelCompact,
          { color: theme.badgeForeground },
        ]}
        numberOfLines={1}
        adjustsFontSizeToFit
        minimumFontScale={0.85}>
        {label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    borderRadius: radius.full,
    paddingHorizontal: spacing.sm + 2,
    paddingVertical: 5,
    alignSelf: 'flex-start',
    maxWidth: '100%',
  },
  badgeCompact: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
    gap: 4,
  },
  label: {
    ...typography.caption,
    fontWeight: '700',
    fontSize: 13,
    lineHeight: 16,
    letterSpacing: 0.3,
    textTransform: 'uppercase',
    flexShrink: 1,
  },
  labelCompact: {
    fontSize: 11,
    lineHeight: 14,
    letterSpacing: 0.2,
  },
});
