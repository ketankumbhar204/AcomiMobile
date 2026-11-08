import React from 'react';
import { CompactPageBanner } from '../ui/CompactPageBanner';
import {
  getAccommodationHierarchyAccent,
  getAccommodationHierarchyIcon,
  type AccommodationHierarchyLevel,
} from '../../utils/accommodationHierarchy';

type AccommodationFormHeroProps = {
  level: AccommodationHierarchyLevel;
  /** Kept for call-site compatibility; no longer rendered (title is sufficient). */
  eyebrow: string;
  heading: string;
  subheading: string;
};

/** Compact page banner for accommodation create/edit forms. */
export function AccommodationFormHero({
  level,
  heading,
  subheading,
}: AccommodationFormHeroProps) {
  const palette = getAccommodationHierarchyAccent(level);
  const Icon = getAccommodationHierarchyIcon(level);

  return (
    <CompactPageBanner
      icon={Icon}
      title={heading}
      subtitle={subheading}
      accent={palette.accent}
      soft={palette.soft}
      border={palette.border}
      testID="accommodation-form-hero"
    />
  );
}
