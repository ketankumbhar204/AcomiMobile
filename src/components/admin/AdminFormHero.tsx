import React from 'react';
import type { LucideIcon } from 'lucide-react-native';
import { colors } from '../../theme';
import { CompactPageBanner } from '../ui/CompactPageBanner';

type AdminFormHeroProps = {
  icon: LucideIcon;
  /** Kept for call-site compatibility; no longer rendered (title is sufficient). */
  eyebrow: string;
  heading: string;
  subheading?: string;
};

export function AdminFormHero({
  icon,
  heading,
  subheading,
}: AdminFormHeroProps) {
  return (
    <CompactPageBanner
      icon={icon}
      title={heading}
      subtitle={subheading}
      accent={colors.primaryDark}
      soft={colors.successTint}
      border={`${colors.primary}33`}
      testID="admin-form-hero"
    />
  );
}
