import React, { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Building2, Grid2x2 } from 'lucide-react-native';
import type { BuildingSummaryResponse, UnitListItemResponse } from '../../../api/types';
import { colors, pastels, radius, shadows, spacing, typography } from '../../../theme';
import { countInactiveEntities, isAccommodationEntityActive } from '../../../utils/accommodationEntityActive';
import {
  InventoryListingCard,
  InventoryListingCardGrid,
} from '../InventoryListingCard';
import { aggregateUnitStatusCounts } from './layoutSummaryStats';
import { CircularOccupancyIndicator } from './cards/CircularOccupancyIndicator';
import { calcOccupancyPercent, occupancyPercentFromStatus } from './cards/occupancyUtils';

type RentalUnitsOverviewProps = {
  buildingSummary?: BuildingSummaryResponse | null;
  units: UnitListItemResponse[];
  onUnitPress: (unit: UnitListItemResponse) => void;
  renderUnitMenu?: (unit: UnitListItemResponse) => React.ReactNode;
};

const LEGEND = [
  { key: 'available', color: '#22C55E' },
  { key: 'occupied', color: '#2563EB' },
  { key: 'reserved', color: '#F97316' },
  { key: 'maintenance', color: '#7C3AED' },
  { key: 'blocked', color: '#EF4444' },
  { key: 'inactive', color: '#94A3B8' },
] as const;

export function RentalUnitsOverview({
  buildingSummary,
  units,
  onUnitPress,
  renderUnitMenu,
}: RentalUnitsOverviewProps) {
  const { t } = useTranslation();
  const statusCounts = useMemo(() => aggregateUnitStatusCounts(units), [units]);
  const inactiveCount = useMemo(() => countInactiveEntities(units), [units]);
  const unitCount = buildingSummary?.visibleUnitCount ?? units.length;
  const occupied = statusCounts.occupied ?? 0;
  const occupancyPercent = calcOccupancyPercent(occupied, unitCount);

  const counts = {
    available: statusCounts.available ?? 0,
    occupied,
    reserved: statusCounts.reserved ?? 0,
    maintenance: statusCounts.maintenance ?? 0,
    blocked: statusCounts.blocked ?? 0,
    inactive: inactiveCount,
  };

  return (
    <View style={styles.root}>
      <View style={styles.overview}>
        <View style={styles.overviewTop}>
          <View style={styles.overviewCopy}>
            <Text style={styles.overviewTitle}>
              {t('accommodation.builder.unitsOverview', { defaultValue: 'Units Overview' })}
            </Text>
            <Text style={styles.overviewSubtitle}>
              {t('accommodation.builder.unitOnlyOverviewSubtitle', {
                defaultValue: 'Units only — edit rent and deposit on each unit',
              })}
            </Text>
          </View>
          <View style={styles.ringWrap}>
            <CircularOccupancyIndicator percent={occupancyPercent} size={64} />
            <Text style={styles.ringLabel}>
              {t('accommodation.status.OCCUPIED', { defaultValue: 'Occupied' })}
            </Text>
          </View>
        </View>

        <View style={styles.tiles}>
          <View style={styles.tileRow}>
            <MetricTile
              icon={Grid2x2}
              pastel={pastels.green}
              value={String(unitCount)}
              label={t('accommodation.builder.totalUnits', { defaultValue: 'Total Units' })}
            />
            <MetricTile
              icon={Building2}
              pastel={pastels.orange}
              value={`${occupied} (${occupancyPercent}%)`}
              label={t('accommodation.status.OCCUPIED', { defaultValue: 'Occupied' })}
            />
          </View>
        </View>

        <View style={styles.legend}>
          {LEGEND.map(item => (
            <View key={item.key} style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: item.color }]} />
              <Text style={styles.legendText}>
                {t(`accommodation.builder.legend.${item.key}`, {
                  defaultValue: legendLabel(item.key),
                })}{' '}
                {counts[item.key]}
              </Text>
            </View>
          ))}
        </View>
      </View>

      <Text style={styles.sectionTitle}>
        {t('accommodation.builder.unitsCount', {
          count: units.length,
          defaultValue: 'Units ({{count}})',
        })}
      </Text>

      <InventoryListingCardGrid
        items={units}
        keyExtractor={unit => unit.unitId}
        renderCard={unit => {
          const inactive = !isAccommodationEntityActive(unit);
          return (
            <InventoryListingCard
              kind="unit"
              title={unit.name}
              status={inactive ? null : unit.status}
              inactive={inactive}
              occupancyPercent={inactive ? 0 : occupancyPercentFromStatus(unit.status)}
              menu={renderUnitMenu?.(unit)}
              onPressDetails={() => onUnitPress(unit)}
              onPressCard={() => onUnitPress(unit)}
            />
          );
        }}
      />
    </View>
  );
}

function legendLabel(key: (typeof LEGEND)[number]['key']): string {
  switch (key) {
    case 'available':
      return 'Available';
    case 'occupied':
      return 'Occupied';
    case 'reserved':
      return 'Reserved';
    case 'maintenance':
      return 'Maintenance';
    case 'blocked':
      return 'Blocked';
    default:
      return 'Inactive';
  }
}

function MetricTile({
  icon: Icon,
  pastel,
  value,
  label,
}: {
  icon: typeof Grid2x2;
  pastel: { bg: string; border: string; fg: string };
  value: string;
  label: string;
}) {
  return (
    <View style={[styles.tile, { backgroundColor: pastel.bg, borderColor: pastel.border }]}>
      <Icon size={16} color={pastel.fg} strokeWidth={2.2} />
      <Text style={[styles.tileValue, { color: pastel.fg }]} numberOfLines={1}>
        {value}
      </Text>
      <Text style={styles.tileLabel} numberOfLines={2}>
        {label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    marginBottom: spacing.lg,
    gap: spacing.md,
  },
  overview: {
    backgroundColor: colors.white,
    borderRadius: radius.card,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
    gap: spacing.md,
    ...shadows.sm,
  },
  overviewTop: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.md,
  },
  overviewCopy: {
    flex: 1,
    minWidth: 0,
    gap: 4,
  },
  overviewTitle: {
    ...typography.h3,
    fontSize: 18,
    lineHeight: 22,
    color: colors.textPrimary,
  },
  overviewSubtitle: {
    ...typography.caption,
    fontSize: 12,
    lineHeight: 16,
    color: colors.textSecondary,
  },
  ringWrap: {
    alignItems: 'center',
    gap: 2,
  },
  ringLabel: {
    ...typography.caption,
    fontSize: 10,
    color: colors.textSecondary,
  },
  tiles: {
    gap: spacing.sm,
  },
  tileRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  tile: {
    flex: 1,
    borderRadius: 14,
    borderWidth: 1,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.sm,
    gap: 2,
    minHeight: 72,
  },
  tileValue: {
    ...typography.h3,
    fontSize: 18,
    lineHeight: 22,
  },
  tileLabel: {
    ...typography.caption,
    fontSize: 11,
    color: colors.textSecondary,
  },
  legend: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  legendText: {
    ...typography.caption,
    fontSize: 11,
    color: colors.textSecondary,
  },
  sectionTitle: {
    ...typography.h3,
    fontSize: 16,
    color: colors.textPrimary,
  },
});
