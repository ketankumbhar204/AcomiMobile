import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { colors, radius, shadows, spacing, typography } from '../../theme';
import {
  getAccommodationHierarchyAccent,
  getAccommodationHierarchyIcon,
  type AccommodationHierarchyLevel,
} from '../../utils/accommodationHierarchy';

type AccommodationFormHeroProps = {
  level: AccommodationHierarchyLevel;
  eyebrow: string;
  heading: string;
  subheading: string;
};

/** CreateSpace-style hero for accommodation create/edit forms. */
export function AccommodationFormHero({
  level,
  eyebrow,
  heading,
  subheading,
}: AccommodationFormHeroProps) {
  const palette = getAccommodationHierarchyAccent(level);
  const Icon = getAccommodationHierarchyIcon(level);

  return (
    <View
      style={[
        styles.hero,
        { backgroundColor: palette.soft, borderColor: palette.border },
      ]}
      accessibilityRole="header">
      <View
        style={[styles.decorBlob, { backgroundColor: `${palette.accent}33` }]}
        pointerEvents="none"
      />
      <View
        style={[styles.decorRing, { borderColor: `${palette.accent}22` }]}
        pointerEvents="none"
      />
      <View
        style={[styles.heroIconWrap, { borderColor: palette.border }]}
        accessibilityElementsHidden>
        <Icon size={18} color={palette.accent} strokeWidth={2.2} />
      </View>
      <Text style={[styles.eyebrow, { color: palette.accent }]}>{eyebrow}</Text>
      <Text style={[styles.heading, { color: palette.accent }]}>{heading}</Text>
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
    fontSize: 12,
    color: colors.muted,
    zIndex: 1,
  },
});
