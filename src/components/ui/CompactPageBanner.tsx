import React from 'react';
import { StyleSheet, Text, View, type StyleProp, type ViewStyle } from 'react-native';
import type { LucideIcon } from 'lucide-react-native';
import { colors, radius, shadows, spacing, typography } from '../../theme';

export type CompactPageBannerProps = {
  icon: LucideIcon;
  title: string;
  subtitle?: string | null;
  /** Optional right-side contextual content (chip, badge, etc.). */
  right?: React.ReactNode;
  accent?: string;
  soft?: string;
  border?: string;
  /** Soft right-edge accent blob; keep subtle to match Rooms entry card. */
  showDecor?: boolean;
  style?: StyleProp<ViewStyle>;
  testID?: string;
  accessibilityLabel?: string;
};

/**
 * Compact horizontal page banner used across form and module screens.
 * Layout: [icon] title / subtitle … [optional right]
 * Target height ~80–105dp depending on subtitle presence.
 */
export function CompactPageBanner({
  icon: Icon,
  title,
  subtitle,
  right,
  accent = colors.primaryDark,
  soft = colors.successTint,
  border = `${colors.primary}33`,
  showDecor = true,
  style,
  testID,
  accessibilityLabel,
}: CompactPageBannerProps) {
  const a11yLabel =
    accessibilityLabel ??
    (subtitle ? `${title}. ${subtitle}` : title);

  return (
    <View
      style={[styles.banner, { backgroundColor: soft, borderColor: border }, style]}
      accessibilityRole="header"
      accessibilityLabel={a11yLabel}
      testID={testID}>
      {showDecor ? (
        <View
          style={[styles.decorBlob, { backgroundColor: `${accent}1F` }]}
          pointerEvents="none"
        />
      ) : null}
      <View
        style={[styles.iconWrap, { borderColor: border }]}
        accessibilityElementsHidden
        importantForAccessibility="no-hide-descendants">
        <Icon size={18} color={accent} strokeWidth={2.2} />
      </View>
      <View style={styles.textCol}>
        <Text style={[styles.title, { color: accent }]} numberOfLines={2}>
          {title}
        </Text>
        {subtitle ? (
          <Text style={styles.subtitle} numberOfLines={2}>
            {subtitle}
          </Text>
        ) : null}
      </View>
      {right ? <View style={styles.right}>{right}</View> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.md,
    paddingVertical: 12,
    paddingHorizontal: spacing.md,
    borderRadius: radius.section,
    borderWidth: 1,
    overflow: 'hidden',
    position: 'relative',
    minHeight: 80,
    ...shadows.sm,
  },
  decorBlob: {
    position: 'absolute',
    width: 96,
    height: 96,
    borderRadius: 48,
    top: -40,
    right: -28,
  },
  iconWrap: {
    width: 44,
    height: 44,
    borderRadius: radius.sm,
    backgroundColor: colors.white,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1,
    flexShrink: 0,
  },
  textCol: {
    flex: 1,
    minWidth: 0,
    zIndex: 1,
    gap: 2,
  },
  title: {
    ...typography.bodyStrong,
    fontSize: 16,
    lineHeight: 20,
    fontWeight: '700',
  },
  subtitle: {
    ...typography.caption,
    fontSize: 12,
    lineHeight: 16,
    color: colors.muted,
  },
  right: {
    zIndex: 1,
    flexShrink: 0,
    maxWidth: '34%',
  },
});
