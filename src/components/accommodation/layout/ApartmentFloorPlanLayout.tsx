import React, { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import type { UnitListItemResponse } from '../../../api/types';
import { spacing, typography } from '../../../theme';
import { matchesAccommodationSearch } from '../../../utils/accommodationLayoutSearch';
import { chunkIntoRows } from './visual/planLayoutUtils';
import { LayoutSummaryCard } from './cards/LayoutSummaryCard';
import { UnitLayoutCard } from './cards/UnitLayoutCard';
import { calcOccupancyPercent } from './cards/occupancyUtils';
const GRID_COLUMNS = 2;

type ApartmentFloorPlanLayoutProps = {
  floorName?: string;
  units: UnitListItemResponse[];
  layoutMode?: string;
  searchQuery: string;
  onUnitPress: (unit: UnitListItemResponse) => void;
  onUnitLongPress?: (unit: UnitListItemResponse) => void;
  renderUnitMenu?: (unit: UnitListItemResponse) => React.ReactNode;
};

export function ApartmentFloorPlanLayout({
  floorName,
  units,
  searchQuery,
  onUnitPress,
  onUnitLongPress,
  renderUnitMenu,
}: ApartmentFloorPlanLayoutProps) {
  const { t } = useTranslation();
  const rows = useMemo(() => chunkIntoRows(units, GRID_COLUMNS), [units]);

  const totals = useMemo(() => {
    const roomCount = units.reduce((sum, u) => sum + u.roomCount, 0);
    const bedCount = units.reduce((sum, u) => sum + u.bedCount, 0);
    const occupied = units.reduce((sum, u) => sum + (u.occupiedBeds ?? 0), 0);
    return {
      roomCount,
      bedCount,
      occupancyPercent: calcOccupancyPercent(occupied, bedCount),
    };
  }, [units]);

  const statusCounts = useMemo(() => aggregateUnitStatusCounts(units), [units]);

  return (
    <View style={styles.root}>
      <LayoutSummaryCard
        title={floorName ?? t('accommodation.apartments.onFloor')}
        illustration={getFloorIllustration()}
        illustrationSize="floor"
        occupancyPercent={totals.occupancyPercent}
        statusCounts={statusCounts}
        metrics={[          {
            label: t('accommodation.layout.dashboard.units'),
            value: String(units.length),
          },
          {
            label: t('accommodation.layout.dashboard.rooms'),
            value: String(totals.roomCount),
          },
          {
            label: t('accommodation.layout.dashboard.beds'),
            value: String(totals.bedCount),
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
