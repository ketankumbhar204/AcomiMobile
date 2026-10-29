import React, { useMemo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Building2, ChevronRight, Grid2x2 } from 'lucide-react-native';
import type { BuildingSummaryResponse, UnitListItemResponse } from '../../../api/types';
import { colors, pastels, radius, shadows, spacing, typography } from '../../../theme';
import { countInactiveEntities, isAccommodationEntityActive } from '../../../utils/accommodationEntityActive';
import { AccommodationInactiveBadge } from '../AccommodationInactiveBadge';
import { AccommodationStatusBadge } from '../AccommodationStatusBadge';
import { chunkIntoRows } from './visual/planLayoutUtils';
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

  const rows = useMemo(() => chunkIntoRows(units, 2), [units]);

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

      <View style={styles.grid}>
        {rows.map((row, rowIndex) => (
          <View key={`row-${rowIndex}`} style={styles.gridRow}>
            {row.map(unit => (
              <RentalUnitCard
                key={unit.unitId}
                unit={unit}
                menu={renderUnitMenu?.(unit)}
                onPress={() => onUnitPress(unit)}
              />
            ))}
            {row.length < 2 ? <View style={styles.gridSpacer} /> : null}
          </View>
        ))}
      </View>
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

function RentalUnitCard({
  unit,
  menu,
  onPress,
}: {
  unit: UnitListItemResponse;
  menu?: React.ReactNode;
  onPress: () => void;
}) {
  const { t } = useTranslation();
  const inactive = !isAccommodationEntityActive(unit);
  const status = inactive ? null : unit.status;
  const percent = inactive ? 0 : occupancyPercentFromStatus(unit.status);

  return (
    <View style={[styles.card, inactive && styles.cardInactive]}>
      <View style={styles.cardTop}>
        <View style={styles.unitIcon}>
          <Building2 size={16} color={pastels.green.fg} strokeWidth={2.2} />
        </View>
        <Text style={styles.unitName} numberOfLines={1}>
          {unit.name}
        </Text>
        {menu ? <View style={styles.menu}>{menu}</View> : null}
      </View>
      <View style={styles.statusRow}>
        {inactive ? <AccommodationInactiveBadge /> : status ? <AccommodationStatusBadge status={status} /> : null}
        <Text style={styles.percent}>{percent}%</Text>
      </View>
      <Pressable
        onPress={onPress}
        style={({ pressed }) => [styles.detailsButton, pressed && styles.detailsPressed]}
        accessibilityRole="button"
        accessibilityLabel={t('accommodation.layout.dashboard.viewDetails', {
          defaultValue: 'View details',
        })}>
        <Text style={styles.detailsLabel}>
          {t('accommodation.layout.dashboard.viewDetails', { defaultValue: 'View details' })}
        </Text>
        <ChevronRight size={16} color={colors.primary} strokeWidth={2.4} />
      </Pressable>
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
  grid: {
    gap: spacing.sm,
  },
  gridRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  gridSpacer: {
    flex: 1,
  },
  card: {
    flex: 1,
    backgroundColor: colors.white,
    borderRadius: radius.card,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    gap: spacing.sm,
    ...shadows.sm,
  },
  cardInactive: {
    opacity: 0.7,
  },
  cardTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  unitIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: pastels.green.bg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  unitName: {
    ...typography.bodyStrong,
    flex: 1,
    minWidth: 0,
    fontSize: 16,
    color: colors.textPrimary,
  },
  menu: {
    marginRight: -4,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 4,
  },
  meta: {
    ...typography.caption,
    fontSize: 11,
    color: colors.textSecondary,
    marginRight: 4,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  percent: {
    ...typography.caption,
    fontSize: 12,
    fontWeight: '700',
    color: colors.textSecondary,
  },
  detailsButton: {
    minHeight: 36,
    borderRadius: radius.button,
    borderWidth: 1,
    borderColor: colors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
    paddingHorizontal: spacing.sm,
  },
  detailsPressed: {
    backgroundColor: colors.mintSubtle,
  },
  detailsLabel: {
    ...typography.bodyStrong,
    fontSize: 13,
    color: colors.primary,
  },
});
