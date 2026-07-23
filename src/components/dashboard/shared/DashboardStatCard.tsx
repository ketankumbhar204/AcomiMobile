import React, { memo, type ComponentType } from 'react';
import {
  Pressable,
  StyleSheet,
  Text,
  View,
  type StyleProp,
  type TextStyle,
  type ViewStyle,
} from 'react-native';
import { ChevronRight } from 'lucide-react-native';
import { colors, radius, shadows, spacing, typography } from '../../../theme';

type IconProps = {
  size?: number;
  color?: string;
  strokeWidth?: number;
};

export type DashboardStatCardProps = {
  label: string;
  value: string;
  icon?: ComponentType<IconProps>;
  accent?: string;
  valueStyle?: StyleProp<TextStyle>;
  onPress?: () => void;
  /** When true, card grows in a 2-column wrap grid. */
  gridItem?: boolean;
  /** Compact Design A card for equal-width This-month rows. */
  compact?: boolean;
  style?: StyleProp<ViewStyle>;
};

/**
 * Design A statistic card — shared by Customer + Owner dashboards.
 */
export const DashboardStatCard = memo(function DashboardStatCard({
  label,
  value,
  icon: Icon,
  accent = colors.primaryDark,
  valueStyle,
  onPress,
  gridItem = false,
  compact = false,
  style,
}: DashboardStatCardProps) {
  const body = (
    <>
      {Icon ? (
        <View
          style={[
            styles.iconWrap,
            compact && styles.iconWrapCompact,
            { backgroundColor: `${accent}18` },
          ]}>
          <Icon size={compact ? 13 : 18} color={accent} strokeWidth={2.2} />
        </View>
      ) : null}
      <Text
        style={[styles.value, compact && styles.valueCompact, { color: accent }, valueStyle]}
        numberOfLines={1}
        adjustsFontSizeToFit={compact}
        minimumFontScale={0.75}>
        {value}
      </Text>
      <Text style={[styles.label, compact && styles.labelCompact]} numberOfLines={2}>
        {label}
      </Text>
      {onPress && !compact ? (
        <View style={styles.chevron} pointerEvents="none">
          <ChevronRight size={14} color={colors.muted} strokeWidth={2.4} />
        </View>
      ) : null}
    </>
  );

  const cardStyle = [
    styles.card,
    compact && styles.cardCompact,
    gridItem && !compact && styles.gridItem,
    style,
  ];

  if (!onPress) {
    return (
      <View style={cardStyle} accessibilityRole="summary" accessibilityLabel={`${label}: ${value}`}>
        {body}
      </View>
    );
  }

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [...cardStyle, styles.pressable, pressed && styles.pressed]}
      accessibilityRole="button"
      accessibilityLabel={`${label}: ${value}`}>
      {body}
    </Pressable>
  );
});

const styles = StyleSheet.create({
  card: {
    flex: 1,
    minWidth: 0,
    backgroundColor: colors.white,
    borderRadius: radius.card,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    minHeight: 96,
    gap: spacing.xs,
    position: 'relative',
    ...shadows.sm,
  },
  cardCompact: {
    flex: 1,
    minWidth: 0,
    minHeight: 78,
    paddingHorizontal: spacing.xs,
    paddingVertical: spacing.sm,
    borderRadius: radius.button,
    gap: 2,
    alignItems: 'center',
  },
  gridItem: {
    flexGrow: 1,
    flexBasis: '47%',
  },
  pressable: {},
  pressed: {
    opacity: 0.9,
    borderColor: `${colors.primary}66`,
  },
  iconWrap: {
    width: 32,
    height: 32,
    borderRadius: radius.button,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconWrapCompact: {
    width: 24,
    height: 24,
    borderRadius: radius.sm,
    marginBottom: 2,
  },
  value: {
    ...typography.h3,
    fontSize: 18,
    lineHeight: 24,
    color: colors.textPrimary,
  },
  valueCompact: {
    fontSize: 13,
    lineHeight: 16,
    fontWeight: '700',
    textAlign: 'center',
    width: '100%',
  },
  label: {
    ...typography.caption,
    color: colors.muted,
    fontWeight: '600',
  },
  labelCompact: {
    fontSize: 10,
    lineHeight: 12,
    textAlign: 'center',
    width: '100%',
  },
  chevron: {
    position: 'absolute',
    top: spacing.sm,
    right: spacing.sm,
  },
});
