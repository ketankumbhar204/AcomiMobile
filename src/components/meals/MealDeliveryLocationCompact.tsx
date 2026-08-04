import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { MapPin, Pencil } from 'lucide-react-native';
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

/**
 * Delivery strip matching poll mock: MapPin + label + name/description + Change.
 */
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

  const selected = locations.find(row => row.id === selectedId) ?? null;
  const isLastUsed = selectedId != null && selectedId === lastUsedLocationId;
  const canChange = !readOnly && locations.length > 1;

  return (
    <View style={styles.block}>
      <View style={styles.row}>
        <View style={styles.iconWrap}>
          <MapPin size={14} color={colors.primaryDark} />
        </View>
        <View style={styles.body}>
          <Text style={styles.label}>{t('meals.poll.deliveryLocation')}</Text>
          {selected ? (
            <>
              <Text style={styles.name} numberOfLines={1}>
                {selected.name}
              </Text>
              {selected.description ? (
                <Text style={styles.description} numberOfLines={2}>
                  {selected.description}
                </Text>
              ) : null}
              {isLastUsed ? (
                <View style={styles.lastUsedBadge}>
                  <Text style={styles.lastUsedText}>{t('meals.poll.lastUsedDelivery')}</Text>
                </View>
              ) : null}
            </>
          ) : (
            <Text style={styles.placeholder}>{t('meals.poll.selectDeliveryLocation')}</Text>
          )}
        </View>
        {canChange ? (
          <MealDeliveryLocationPicker
            locations={locations}
            selectedId={selectedId}
            lastUsedLocationId={lastUsedLocationId}
            onSelect={onSelect}
            readOnly={readOnly}
            trigger={
              <View style={styles.changeBtn}>
                <Pencil size={13} color={colors.primaryDark} />
                <Text style={styles.changeText}>{t('meals.poll.changeDelivery')}</Text>
              </View>
            }
          />
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  block: {
    padding: spacing.md,
    borderRadius: radius.input,
    backgroundColor: colors.section,
    borderWidth: 1,
    borderColor: `${colors.primaryDark}33`,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
  },
  iconWrap: {
    width: 28,
    height: 28,
    borderRadius: radius.button,
    backgroundColor: `${colors.primaryDark}14`,
    alignItems: 'center',
    justifyContent: 'center',
  },
  body: {
    flex: 1,
    minWidth: 0,
    gap: 2,
  },
  label: {
    ...typography.caption,
    color: colors.textSecondary,
    fontWeight: '700',
    letterSpacing: 0.3,
    textTransform: 'uppercase',
  },
  name: {
    ...typography.bodyStrong,
    color: colors.textPrimary,
  },
  description: {
    ...typography.caption,
    color: colors.muted,
  },
  placeholder: {
    ...typography.body,
    color: colors.muted,
  },
  lastUsedBadge: {
    alignSelf: 'flex-start',
    marginTop: 4,
    backgroundColor: `${colors.primary}18`,
    paddingHorizontal: spacing.xs,
    paddingVertical: 2,
    borderRadius: radius.sm,
  },
  lastUsedText: {
    ...typography.caption,
    color: colors.primaryDark,
    fontWeight: '600',
  },
  changeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: radius.button,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.white,
  },
  changeText: {
    ...typography.caption,
    color: colors.primaryDark,
    fontWeight: '700',
  },
});
