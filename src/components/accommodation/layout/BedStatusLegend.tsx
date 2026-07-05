import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import type { AccommodationStatus } from '../../../api/types';
import { colors, spacing, typography } from '../../../theme';
import { getAccommodationStatusColor } from '../../../utils/accommodationStatus';
import { StatusDot } from './StatusDot';

type BedStatusLegendProps = {
  statuses?: AccommodationStatus[];
};

const DEFAULT_STATUSES: AccommodationStatus[] = [
  'AVAILABLE',
  'RESERVED',
  'OCCUPIED',
  'MAINTENANCE',
];

export function BedStatusLegend({
  statuses = DEFAULT_STATUSES,
}: BedStatusLegendProps) {
  const { t } = useTranslation();

  return (
    <View style={styles.root}>
      {statuses.map(status => (
        <View key={status} style={styles.item}>
          <StatusDot status={status} />
          <Text style={[styles.label, { color: getAccommodationStatusColor(status) }]}>
            {t(`accommodation.status.${status}`)}
          </Text>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
    marginBottom: spacing.md,
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  label: {
    ...typography.caption,
    fontWeight: '600',
  },
});
