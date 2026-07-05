import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import type { AmenityAssignment } from '../../api/types';
import {
  amenityKey,
  isAmenitySelected,
  presetAmenityLabelKey,
  toggleAssignedAmenity,
  type AmenityCode,
} from '../../utils/amenities';
import { colors, radius, spacing, typography } from '../../theme';

type OccupancyAmenitiesSectionProps = {
  available: AmenityAssignment[];
  assigned: AmenityAssignment[];
  onChange: (assigned: AmenityAssignment[]) => void;
  disabled?: boolean;
};

function AmenityCheckbox({
  label,
  checked,
  disabled,
  onToggle,
}: {
  label: string;
  checked: boolean;
  disabled?: boolean;
  onToggle: () => void;
}) {
  return (
    <Pressable
      onPress={onToggle}
      disabled={disabled}
      style={styles.checkboxRow}
      accessibilityRole="checkbox"
      accessibilityState={{ checked, disabled: Boolean(disabled) }}>
      <View style={[styles.checkboxBox, checked && styles.checkboxBoxChecked]}>
        {checked ? <Text style={styles.checkboxMark}>✓</Text> : null}
      </View>
      <Text style={styles.checkboxLabel} numberOfLines={2}>
        {label}
      </Text>
    </Pressable>
  );
}

export function OccupancyAmenitiesSection({
  available,
  assigned,
  onChange,
  disabled = false,
}: OccupancyAmenitiesSectionProps) {
  const { t } = useTranslation();

  if (available.length === 0) {
    return (
      <View style={styles.wrap}>
        <Text style={styles.title}>{t('occupancy.amenities.title')}</Text>
        <Text style={styles.empty}>{t('occupancy.amenities.noneConfigured')}</Text>
      </View>
    );
  }

  function labelFor(amenity: AmenityAssignment): string {
    if (amenity.code === 'CUSTOM') {
      return amenity.label;
    }
    return t(presetAmenityLabelKey(amenity.code as AmenityCode));
  }

  return (
    <View style={styles.wrap}>
      <Text style={styles.title}>{t('occupancy.amenities.title')}</Text>
      <Text style={styles.hint}>{t('occupancy.amenities.hint')}</Text>
      <View style={styles.grid}>
        {available.map(amenity => {
          const selected = isAmenitySelected(available, assigned, amenity);
          return (
            <View key={amenityKey(amenity)} style={styles.gridItem}>
              <AmenityCheckbox
                label={labelFor(amenity)}
                checked={selected}
                disabled={disabled}
                onToggle={() =>
                  onChange(toggleAssignedAmenity(available, assigned, amenity))
                }
              />
            </View>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    marginTop: spacing.md,
    marginBottom: spacing.sm,
  },
  title: {
    ...typography.bodyStrong,
    marginBottom: spacing.xs,
  },
  hint: {
    ...typography.caption,
    color: colors.muted,
    marginBottom: spacing.sm,
  },
  empty: {
    ...typography.body,
    color: colors.muted,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -spacing.xs,
  },
  gridItem: {
    width: '50%',
    paddingHorizontal: spacing.xs,
    marginBottom: spacing.xs,
  },
  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
    paddingVertical: spacing.xs,
  },
  checkboxBox: {
    width: 20,
    height: 20,
    borderRadius: 4,
    borderWidth: 1.5,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.white,
    marginTop: 1,
  },
  checkboxBoxChecked: {
    borderColor: colors.primary,
    backgroundColor: colors.primary,
  },
  checkboxMark: {
    color: colors.white,
    fontSize: 12,
    fontWeight: '700',
    lineHeight: 14,
  },
  checkboxLabel: {
    ...typography.caption,
    color: colors.textPrimary,
    flex: 1,
    flexShrink: 1,
  },
});
