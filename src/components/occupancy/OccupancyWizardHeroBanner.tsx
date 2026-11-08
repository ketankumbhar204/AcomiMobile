import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import type { LucideIcon } from 'lucide-react-native';
import { colors, radius, spacing, typography } from '../../theme';
import { CompactPageBanner } from '../ui/CompactPageBanner';

type OccupancyWizardHeroBannerProps = {
  title: string;
  Icon: LucideIcon;
  /** Compact stay-type chip, right-aligned in the banner (e.g. "Daily"). */
  stayTypeLabel?: string | null;
};

/**
 * Compact single-row wizard banner: [icon] title …… [Stay Type chip]
 */
export function OccupancyWizardHeroBanner({
  title,
  Icon,
  stayTypeLabel = null,
}: OccupancyWizardHeroBannerProps) {
  return (
    <CompactPageBanner
      icon={Icon}
      title={title}
      accent={colors.primaryDark}
      soft={colors.successTint}
      border={`${colors.primary}33`}
      testID="occupancy-wizard-hero"
      right={
        stayTypeLabel ? (
          <View
            style={styles.stayTypeChip}
            accessibilityRole="text"
            accessibilityLabel={`Stay Type: ${stayTypeLabel}`}
            testID="occupancy-wizard-hero-stay-type">
            <Text style={styles.stayTypeChipText} numberOfLines={2}>
              {stayTypeLabel}
            </Text>
          </View>
        ) : null
      }
    />
  );
}

const styles = StyleSheet.create({
  stayTypeChip: {
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: `${colors.primary}33`,
    borderRadius: radius.sm,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    maxWidth: 110,
  },
  stayTypeChipText: {
    ...typography.caption,
    fontSize: 11,
    lineHeight: 14,
    fontWeight: '600',
    color: colors.primaryDark,
    textAlign: 'center',
  },
});
