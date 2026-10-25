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
import { colors, radius, spacing, typography } from '../../../theme';

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
  /** Pastel tile fill — used on dashboard KPI rows. */
  surface?: string;
  surfaceBorder?: string;
  /** Active filter selection (Rooms Property operations). */
  selected?: boolean;
  /** Border color while selected. Defaults to the brand green. */
  selectionColor?: string;
  /**
   * Horizontal icon | value layout. Dashboard rows stay stacked.
   * Used by screens that explicitly opted into the wider card.
   */
  horizontal?: boolean;
  style?: StyleProp<ViewStyle>;
};

/**
 * Design A statistic card — shared by Customer + Owner dashboards.
 * Centered icon → value → label for consistent KPI rhythm.
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
  surface,
  surfaceBorder,
  selected = false,
  selectionColor,
  horizontal = false,
  style,
}: DashboardStatCardProps) {
  const body = horizontal ? (
    <>
      {Icon ? (
        <View style={[styles.iconWrapRow, { backgroundColor: `${accent}18` }]}>
          <Icon size={18} color={accent} strokeWidth={2.2} />
        </View>
      ) : null}
      {Icon ? <View style={styles.divider} /> : null}
      <View style={styles.copy}>
        <Text
          style={[styles.valueRow, { color: accent }, valueStyle]}
          numberOfLines={1}
          adjustsFontSizeToFit
          minimumFontScale={0.7}>
          {value}
        </Text>
        <Text style={styles.labelRow} numberOfLines={2}>
          {label}
        </Text>
      </View>
      {onPress ? <ChevronRight size={16} color={colors.muted} strokeWidth={2.2} /> : null}
    </>
  ) : (
    <>
      {Icon ? (
        <View
          style={[
            styles.iconWrap,
            compact && styles.iconWrapCompact,
            { backgroundColor: `${accent}18` },
          ]}>
          <Icon size={compact ? 14 : 16} color={accent} strokeWidth={2.2} />
        </View>
      ) : null}
      <Text
        style={[
          styles.value,
          compact && styles.valueCompact,
          { color: accent },
          valueStyle,
        ]}
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
    horizontal ? styles.cardRow : styles.card,
    !horizontal && compact && styles.cardCompact,
    gridItem && !compact && styles.gridItem,
    surface
      ? { backgroundColor: surface, borderColor: surfaceBorder ?? `${accent}33` }
      : null,
    selected
      ? { borderColor: selectionColor ?? colors.primary, borderWidth: 2 }
      : null,
    style,
  ];

  if (!onPress) {
    return (
      <View
        style={cardStyle}
        accessibilityRole="summary"
        accessibilityLabel={`${label}: ${value}`}>
        {body}
      </View>
    );
  }

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        ...cardStyle,
        styles.pressable,
        pressed && styles.pressed,
      ]}
      accessibilityRole="button"
      accessibilityState={{ selected }}
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
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.sm,
    minHeight: 78,
    gap: spacing.xs,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  cardRow: {
    flex: 1,
    minWidth: 0,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.white,
    borderRadius: radius.card,
    borderWidth: 1,
    borderColor: colors.border,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.sm,
    minHeight: 72,
  },
  cardCompact: {
    flex: 1,
    minWidth: 0,
    minHeight: 72,
    paddingHorizontal: spacing.xs,
    paddingVertical: spacing.xs,
    borderRadius: radius.button,
    gap: spacing.xxs,
    alignItems: 'center',
    justifyContent: 'center',
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
    width: 28,
    height: 28,
    borderRadius: radius.sm,
  },
  iconWrapRow: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  divider: {
    width: 1,
    alignSelf: 'stretch',
    marginVertical: 4,
    backgroundColor: colors.border,
  },
  copy: {
    flex: 1,
    minWidth: 0,
    justifyContent: 'center',
  },
  value: {
    ...typography.h3,
    fontSize: 24,
    lineHeight: 28,
    fontWeight: '700',
    color: colors.textPrimary,
    textAlign: 'center',
  },
  valueCompact: {
    fontSize: 14,
    lineHeight: 18,
    fontWeight: '700',
    textAlign: 'center',
    width: '100%',
  },
  valueRow: {
    ...typography.h3,
    fontSize: 26,
    lineHeight: 30,
    fontWeight: '700',
  },
  label: {
    ...typography.caption,
    fontSize: 12,
    lineHeight: 14,
    color: colors.muted,
    fontWeight: '600',
    textAlign: 'center',
  },
  labelCompact: {
    fontSize: 11,
    lineHeight: 13,
    textAlign: 'center',
    width: '100%',
  },
  labelRow: {
    ...typography.caption,
    fontSize: 12,
    lineHeight: 15,
    color: colors.muted,
    fontWeight: '600',
  },
  chevron: {
    position: 'absolute',
    top: spacing.sm,
    right: spacing.sm,
  },
});
