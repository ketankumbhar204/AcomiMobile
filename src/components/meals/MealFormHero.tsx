import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import type { LucideIcon } from 'lucide-react-native';
import { colors, radius, shadows, spacing, typography } from '../../theme';

type MealFormHeroProps = {
  icon: LucideIcon;
  eyebrow: string;
  heading: string;
  subheading: string;
  /** Accent color for icon and heading (default primaryDark) */
  accent?: string;
  soft?: string;
  border?: string;
  /** Dense single-row hero for form-heavy screens. */
  compact?: boolean;
};

/** CreateSpace-style hero for Meals forms and hubs. */
export function MealFormHero({
  icon: Icon,
  eyebrow,
  heading,
  subheading,
  accent = colors.primaryDark,
  soft = colors.successTint,
  border = `${colors.primary}33`,
  compact = false,
}: MealFormHeroProps) {
  return (
    <View
      style={[
        styles.hero,
        compact && styles.heroCompact,
        { backgroundColor: soft, borderColor: border },
      ]}
      accessibilityRole="header">
      <View
        style={[
          styles.decorBlob,
          compact && styles.decorBlobCompact,
          { backgroundColor: `${accent}1F` },
        ]}
        pointerEvents="none"
      />
      {compact ? null : (
        <View
          style={[styles.decorRing, { borderColor: `${accent}14` }]}
          pointerEvents="none"
        />
      )}
      <View
        style={[
          styles.heroIconWrap,
          compact && styles.heroIconWrapCompact,
          { borderColor: border },
        ]}
        accessibilityElementsHidden>
        <Icon size={compact ? 16 : 18} color={accent} strokeWidth={2.2} />
      </View>
      <View style={compact ? styles.compactText : undefined}>
        <Text style={[styles.eyebrow, { color: accent }]}>{eyebrow}</Text>
        <Text
          style={[styles.heading, compact && styles.headingCompact, { color: accent }]}
          numberOfLines={1}>
          {heading}
        </Text>
        <Text style={styles.subheading} numberOfLines={compact ? 2 : undefined}>
          {subheading}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  hero: {
    marginBottom: spacing.md,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
    borderRadius: radius.section,
    borderWidth: 1,
    overflow: 'hidden',
    position: 'relative',
    ...shadows.sm,
  },
  heroCompact: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.sm,
    marginBottom: spacing.sm,
    borderRadius: 18,
  },
  decorBlob: {
    position: 'absolute',
    width: 120,
    height: 120,
    borderRadius: 60,
    top: -48,
    right: -28,
  },
  decorBlobCompact: {
    width: 84,
    height: 84,
    borderRadius: 42,
    top: -40,
    right: -22,
  },
  compactText: {
    flex: 1,
    minWidth: 0,
    zIndex: 1,
  },
  decorRing: {
    position: 'absolute',
    width: 56,
    height: 56,
    borderRadius: 28,
    borderWidth: 8,
    bottom: -16,
    right: 40,
  },
  heroIconWrap: {
    width: 36,
    height: 36,
    borderRadius: radius.sm,
    backgroundColor: colors.white,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
    zIndex: 1,
  },
  heroIconWrapCompact: {
    width: 32,
    height: 32,
    marginBottom: 0,
  },
  eyebrow: {
    ...typography.eyebrow,
    marginBottom: 2,
    zIndex: 1,
  },
  heading: {
    ...typography.h2,
    fontSize: 22,
    lineHeight: 28,
    fontWeight: '600',
    marginBottom: 2,
    zIndex: 1,
  },
  headingCompact: {
    fontSize: 18,
    lineHeight: 22,
    fontWeight: '700',
    marginBottom: 0,
  },
  subheading: {
    ...typography.caption,
    fontSize: 12,
    color: colors.muted,
    zIndex: 1,
  },
});
