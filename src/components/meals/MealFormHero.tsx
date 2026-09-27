import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import type { LucideIcon } from 'lucide-react-native';
import { colors, radius, shadows, spacing, typography } from '../../theme';

type MealFormHeroProps = {
  icon: LucideIcon;
  eyebrow?: string;
  heading: string;
  subheading?: string;
  accent?: string;
  soft?: string;
  border?: string;
  compact?: boolean;
};

/** Compact horizontal hero: icon + title on one row. */
export function MealFormHero({
  icon: Icon,
  eyebrow,
  heading,
  subheading,
  accent = colors.primaryDark,
  soft = colors.successTint,
  border = `${colors.primary}33`,
  compact = true,
}: MealFormHeroProps) {
  return (
    <View
      style={[styles.hero, compact && styles.heroCompact, { backgroundColor: soft, borderColor: border }]}
      accessibilityRole="header">
      <View
        style={[styles.decorBlob, { backgroundColor: `${accent}1F` }]}
        pointerEvents="none"
      />
      <View
        style={[styles.heroIconWrap, { borderColor: border }]}
        accessibilityElementsHidden>
        <Icon size={16} color={accent} strokeWidth={2.2} />
      </View>
      <View style={styles.textCol}>
        {eyebrow ? (
          <Text style={[styles.eyebrow, { color: accent }]} numberOfLines={1}>
            {eyebrow}
          </Text>
        ) : null}
        <Text style={[styles.heading, { color: accent }]} numberOfLines={1}>
          {heading}
        </Text>
        {subheading ? (
          <Text style={styles.subheading} numberOfLines={1}>
            {subheading}
          </Text>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  hero: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.md,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: 18,
    borderWidth: 1,
    overflow: 'hidden',
    position: 'relative',
    ...shadows.sm,
  },
  heroCompact: {
    marginBottom: spacing.sm,
  },
  decorBlob: {
    position: 'absolute',
    width: 84,
    height: 84,
    borderRadius: 42,
    top: -40,
    right: -22,
  },
  heroIconWrap: {
    width: 32,
    height: 32,
    borderRadius: radius.sm,
    backgroundColor: colors.white,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1,
  },
  textCol: {
    flex: 1,
    minWidth: 0,
    zIndex: 1,
    gap: 1,
  },
  eyebrow: {
    ...typography.eyebrow,
    fontSize: 10,
  },
  heading: {
    ...typography.bodyStrong,
    fontSize: 16,
    lineHeight: 20,
    fontWeight: '700',
  },
  subheading: {
    ...typography.caption,
    fontSize: 12,
    color: colors.muted,
  },
});
