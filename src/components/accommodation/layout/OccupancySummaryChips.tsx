import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { colors, spacing, typography } from '../../../theme';
import { StatusDot } from './StatusDot';
import type { AccommodationStatus } from '../../../api/types';
import { getAccommodationStatusColor } from '../../../utils/accommodationStatus';

type OccupancyBreakdown = {
  available?: number;
  occupied?: number;
  reserved?: number;
  maintenance?: number;
};

type OccupancySummaryChipsProps = {
  breakdown: OccupancyBreakdown;
  compact?: boolean;
  status?: AccommodationStatus | null;
  ratioLabel?: string;
};

export function OccupancySummaryChips({
  breakdown,
  compact = false,
  status,
  ratioLabel,
}: OccupancySummaryChipsProps) {
  const { t } = useTranslation();

  const entries: { key: AccommodationStatus; count: number }[] = [];
  if (breakdown.available != null && breakdown.available > 0) {
    entries.push({ key: 'AVAILABLE', count: breakdown.available });
  }
  if (breakdown.reserved != null && breakdown.reserved > 0) {
    entries.push({ key: 'RESERVED', count: breakdown.reserved });
  }
  if (breakdown.occupied != null && breakdown.occupied > 0) {
    entries.push({ key: 'OCCUPIED', count: breakdown.occupied });
  }
  if (breakdown.maintenance != null && breakdown.maintenance > 0) {
    entries.push({ key: 'MAINTENANCE', count: breakdown.maintenance });
  }

  if (entries.length === 0 && !ratioLabel && !status) {
    return null;
  }

  if (compact && ratioLabel) {
    return (
      <View style={styles.compactRow}>
        {status ? <StatusDot status={status} size={8} /> : null}
        <Text style={styles.ratio}>{ratioLabel}</Text>
      </View>
    );
  }

  return (
    <View style={styles.wrap}>
      {ratioLabel ? (
        <View style={styles.compactRow}>
          {status ? <StatusDot status={status} size={8} /> : null}
          <Text style={styles.ratio}>{ratioLabel}</Text>
        </View>
      ) : null}
      {entries.map(entry => (
        <View key={entry.key} style={styles.chip}>
          <StatusDot status={entry.key} size={8} />
          <Text style={[styles.chipText, { color: getAccommodationStatusColor(entry.key) }]}>
            {entry.count} {t(`accommodation.status.${entry.key}`)}
          </Text>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    gap: spacing.xs,
    marginTop: spacing.xs,
  },
  compactRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  ratio: {
    ...typography.caption,
    color: colors.textSecondary,
    fontWeight: '600',
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  chipText: {
    ...typography.caption,
    fontWeight: '500',
  },
});
