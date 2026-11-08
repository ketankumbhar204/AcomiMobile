import React from 'react';
import { StyleSheet } from 'react-native';
import type { LucideIcon } from 'lucide-react-native';
import { colors, spacing } from '../../theme';
import { CompactPageBanner } from '../ui/CompactPageBanner';

type MealFormHeroProps = {
  icon: LucideIcon;
  /** Kept for call-site compatibility; no longer rendered (title is sufficient). */
  eyebrow?: string;
  heading: string;
  subheading?: string;
  accent?: string;
  soft?: string;
  border?: string;
  /** Kept for call-site compatibility; banner is always compact. */
  compact?: boolean;
};

/** Compact horizontal hero: icon + title (+ optional subtitle). */
export function MealFormHero({
  icon,
  heading,
  subheading,
  accent = colors.primaryDark,
  soft = colors.successTint,
  border = `${colors.primary}33`,
}: MealFormHeroProps) {
  return (
    <CompactPageBanner
      icon={icon}
      title={heading}
      subtitle={subheading}
      accent={accent}
      soft={soft}
      border={border}
      style={styles.compactMargin}
      testID="meal-form-hero"
    />
  );
}

const styles = StyleSheet.create({
  compactMargin: {
    marginBottom: spacing.sm,
  },
});
