import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import type { MealDeliveryLocation, UUID } from '../../api/types';
import { colors, radius, spacing, typography } from '../../theme';
import { MealDeliveryLocationPicker } from './MealDeliveryLocationPicker';

type MealDeliveryLocationCompactProps = {
  locations: MealDeliveryLocation[];
  selectedId?: UUID | null;
  lastUsedLocationId?: UUID | null;
  onSelect: (locationId: UUID) => void;
  readOnly?: boolean;
};

export function MealDeliveryLocationCompact({
  locations,
  selectedId,
  lastUsedLocationId,
  onSelect,
  readOnly = false,
}: MealDeliveryLocationCompactProps) {
  const { t } = useTranslation();

  if (locations.length === 0) {
    return null;
  }

  return (
    <View style={styles.block}>
      <View style={styles.header}>
        <View style={styles.headerAccent} />
        <Text style={styles.headerLabel}>{t('meals.poll.deliverTo')}</Text>
      </View>
      <MealDeliveryLocationPicker
        locations={locations}
        selectedId={selectedId}
        lastUsedLocationId={lastUsedLocationId}
        onSelect={onSelect}
        readOnly={readOnly}
        showEditAffordance={!readOnly && locations.length > 1}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  block: {
    marginTop: 0,
    padding: spacing.md,
    borderRadius: radius.input,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    gap: spacing.sm,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  headerAccent: {
    width: 3,
    height: 16,
    borderRadius: 2,
    backgroundColor: colors.primaryDark,
  },
  headerLabel: {
    ...typography.caption,
    color: colors.textSecondary,
    fontWeight: '600',
    letterSpacing: 0.4,
    textTransform: 'uppercase',
  },
});
