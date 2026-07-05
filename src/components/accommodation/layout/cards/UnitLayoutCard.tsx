import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import type { UnitListItemResponse } from '../../../../api/types';
import { colors, radius, shadows, spacing, typography } from '../../../../theme';
import { AccommodationStatusBadge } from '../../AccommodationStatusBadge';
import { getUnitIllustration } from '../illustrations/illustrationAssets';
import { CircularOccupancyIndicator } from './CircularOccupancyIndicator';
import { LayoutCardShell } from './LayoutCardShell';
import { LayoutIllustration } from './LayoutIllustration';
import { occupancyPercentFromStatus } from './occupancyUtils';

type UnitLayoutCardProps = {
  unit: UnitListItemResponse;
  highlighted?: boolean;
  onPress: () => void;
  onLongPress?: () => void;
  menu?: React.ReactNode;
};

export function UnitLayoutCard({
  unit,
  highlighted = false,
  onPress,
  onLongPress,
  menu,
}: UnitLayoutCardProps) {
  const { t } = useTranslation();
  const percent = occupancyPercentFromStatus(unit.status);
  const illustration = getUnitIllustration(unit.roomCount, unit.bedCount);

  return (
    <LayoutCardShell
      debugCardId={`unit-${unit.unitId}`}
      onPress={onPress}
      onLongPress={onLongPress}
      menu={menu}
      shellStyle={styles.shell}
      cardStyle={[styles.card, highlighted && styles.highlighted]}
      pressedStyle={styles.pressed}>
      <LayoutIllustration source={illustration} size="unit" />
      <Text style={styles.title} numberOfLines={2}>
        {unit.name}
      </Text>
      <Text style={styles.meta}>
        {t('accommodation.layout.dashboard.roomsAndBeds', {
          rooms: unit.roomCount,
          beds: unit.bedCount,
        })}
      </Text>
      <View style={styles.footer}>
        <AccommodationStatusBadge status={unit.status} />
        <CircularOccupancyIndicator percent={percent} size={44} />
      </View>
    </LayoutCardShell>
  );
}

const styles = StyleSheet.create({
  shell: {
    flex: 1,
    minWidth: '46%',
    maxWidth: '50%',
    marginBottom: spacing.md,
  },
  card: {
    flex: 1,
    backgroundColor: colors.white,
    borderRadius: radius.card,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    ...shadows.sm,
  },
  highlighted: {
    borderColor: colors.primary,
    borderWidth: 2,
  },
  pressed: {
    backgroundColor: colors.surface,
  },
  title: {
    ...typography.bodyStrong,
    fontSize: 16,
    marginBottom: 4,
  },
  meta: {
    ...typography.caption,
    color: colors.textSecondary,
    marginBottom: spacing.sm,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 'auto',
  },
});
