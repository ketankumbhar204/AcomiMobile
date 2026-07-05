import React, { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import type { BuildingSummaryResponse, UnitListItemResponse } from '../../../api/types';
import { spacing, typography } from '../../../theme';
import { matchesAccommodationSearch } from '../../../utils/accommodationLayoutSearch';
import { chunkIntoRows } from './visual/planLayoutUtils';
import { LayoutSummaryCard } from './cards/LayoutSummaryCard';
import { UnitLayoutCard } from './cards/UnitLayoutCard';
import { occupancyPercentFromStatus, calcOccupancyPercent } from './cards/occupancyUtils';
import { getBuildingIllustration } from './illustrations/illustrationAssets';
import {
  aggregateUnitStatusCounts,
  buildingSummaryOccupancyPercent,
  buildingSummaryToStatusCounts,
} from './layoutSummaryStats';

const GRID_COLUMNS = 2;

type BuildingUnitElevationProps = {
  buildingName?: string;
  buildingSummary?: BuildingSummaryResponse | null;
  units: UnitListItemResponse[];  layoutMode?: string;
  searchQuery: string;
  onUnitPress: (unit: UnitListItemResponse) => void;
  onUnitLongPress?: (unit: UnitListItemResponse) => void;
  renderUnitMenu?: (unit: UnitListItemResponse) => React.ReactNode;
};

export function BuildingUnitElevation({
  buildingName,
  buildingSummary,
  units,
  searchQuery,
  onUnitPress,
  onUnitLongPress,
  renderUnitMenu,
}: BuildingUnitElevationProps) {  const { t } = useTranslation();
  const rows = useMemo(() => chunkIntoRows(units, GRID_COLUMNS), [units]);

  const totals = useMemo(() => {
    const roomCount = units.reduce((sum, u) => sum + u.roomCount, 0);
    const bedCount = units.reduce((sum, u) => sum + u.bedCount, 0);
    const occupied = units.reduce((sum, u) => sum + (u.occupiedBeds ?? 0), 0);
    const hasBedCounts = units.some(u => u.bedCount > 0 && u.availableBeds !== undefined);
    const avgPercent = hasBedCounts
      ? calcOccupancyPercent(occupied, bedCount)
      : units.length > 0
        ? Math.round(
            units.reduce((sum, u) => sum + occupancyPercentFromStatus(u.status), 0) / units.length,
          )
        : 0;
    return { roomCount, bedCount, avgPercent };
  }, [units]);

  const occupancyPercent = buildingSummary
    ? buildingSummaryOccupancyPercent(buildingSummary)
    : totals.avgPercent;

  const statusCounts = buildingSummary
    ? buildingSummaryToStatusCounts(buildingSummary)
    : aggregateUnitStatusCounts(units);

  return (
    <View style={styles.root}>
      <LayoutSummaryCard
        title={buildingName ?? t('accommodation.units.title')}
        illustration={getBuildingIllustration()}
        illustrationSize="building"
        occupancyPercent={occupancyPercent}
        statusCounts={statusCounts}
        metrics={[
          {
            label: t('accommodation.layout.dashboard.units'),
            value: String(buildingSummary?.visibleUnitCount ?? units.length),
          },
          {
            label: t('accommodation.layout.dashboard.rooms'),
            value: String(buildingSummary?.rooms ?? totals.roomCount),
          },
          {
            label: t('accommodation.layout.dashboard.beds'),
            value: String(buildingSummary?.beds ?? totals.bedCount),
          },
        ]}
      />
      <Text style={styles.sectionTitle}>{t('accommodation.layout.dashboard.unitsSection')}</Text>

      {rows.map((row, rowIndex) => (
        <View key={`row-${rowIndex}`} style={styles.row}>
          {row.map(unit => (
            <UnitLayoutCard
              key={unit.unitId}
              unit={unit}
              highlighted={matchesAccommodationSearch(unit.name, searchQuery)}
              onPress={() => onUnitPress(unit)}
              onLongPress={onUnitLongPress ? () => onUnitLongPress(unit) : undefined}
              menu={renderUnitMenu?.(unit)}
            />
          ))}
          {row.length < GRID_COLUMNS ? <View style={styles.spacer} /> : null}
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    marginBottom: spacing.lg,
  },
  sectionTitle: {
    ...typography.bodyStrong,
    marginBottom: spacing.sm,
  },
  row: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  spacer: {
    flex: 1,
  },
});
