import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import type { LucideIcon } from 'lucide-react-native';
import { colors, radius, shadows, spacing, typography } from '../../theme';

type AuthHeroProps = {
  icon: LucideIcon;
  eyebrow: string;
  heading: string;
  subheading: string;
  accent?: string;
  soft?: string;
  border?: string;
};

/** Soft green CreateSpace-style hero for auth & onboarding. */
export function AuthHero({
  icon: Icon,
  eyebrow,
  heading,
  subheading,
  accent = colors.primaryDark,
  soft = colors.lightGreen,
  border = `${colors.primary}33`,
}: AuthHeroProps) {
  return (
    <View
      style={[styles.hero, { backgroundColor: soft, borderColor: border }]}
      accessibilityRole="header">
      <View
        style={[styles.decorBlob, { backgroundColor: `${accent}1F` }]}
        pointerEvents="none"
      />
      <View
        style={[styles.decorRing, { borderColor: `${accent}14` }]}
        pointerEvents="none"
      />
      <View
        style={[styles.heroIconWrap, { borderColor: border }]}
        accessibilityElementsHidden>
        <Icon size={18} color={accent} strokeWidth={2.2} />
      </View>
      <Text style={[styles.eyebrow, { color: accent }]}>{eyebrow}</Text>
      <Text style={[styles.heading, { color: accent }]}>{heading}</Text>
      <Text style={styles.subheading}>{subheading}</Text>
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
  decorBlob: {
    position: 'absolute',
    width: 120,
    height: 120,
    borderRadius: 60,
    top: -48,
    right: -28,
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
    width: 40,
    height: 40,
    borderRadius: radius.sm,
    backgroundColor: colors.white,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
    zIndex: 1,
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
  subheading: {
    ...typography.caption,
    fontSize: 13,
    lineHeight: 18,
    color: colors.muted,
    zIndex: 1,
  },
});
