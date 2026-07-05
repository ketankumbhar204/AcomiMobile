import React, { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import type { BuildingSummaryResponse, FloorListItemResponse } from '../../../api/types';
import { colors, spacing, typography } from '../../../theme';
import { matchesAccommodationSearch } from '../../../utils/accommodationLayoutSearch';
import { FloorLayoutCard } from './cards/FloorLayoutCard';
import { LayoutSummaryCard } from './cards/LayoutSummaryCard';
import { calcOccupancyPercent } from './cards/occupancyUtils';
import { getBuildingIllustration } from './illustrations/illustrationAssets';
import {
  buildingSummaryOccupancyPercent,
  buildingSummaryToStatusCounts,
} from './layoutSummaryStats';

type BuildingElevationLayoutProps = {
  buildingName?: string;
  buildingSummary?: BuildingSummaryResponse | null;
  floors: FloorListItemResponse[];
  layoutMode?: string;
  searchQuery: string;
  onFloorPress: (floor: FloorListItemResponse) => void;
  onFloorLongPress?: (floor: FloorListItemResponse) => void;
  renderFloorMenu?: (floor: FloorListItemResponse) => React.ReactNode;
};

export function BuildingElevationLayout({
  buildingName,
  buildingSummary,
  floors,
  layoutMode,
  searchQuery,
  onFloorPress,
  onFloorLongPress,
  renderFloorMenu,
}: BuildingElevationLayoutProps) {
  const { t } = useTranslation();

  const totals = useMemo(() => {
    const roomCount = floors.reduce((sum, f) => sum + f.roomCount, 0);
    const bedCount = floors.reduce((sum, f) => sum + f.bedCount, 0);
    const occupied = floors.reduce((sum, f) => sum + f.occupied, 0);
    return { roomCount, bedCount, occupied };
  }, [floors]);

  const occupancyPercent =
    buildingSummary && buildingSummary.beds > 0
      ? buildingSummaryOccupancyPercent(buildingSummary)
      : calcOccupancyPercent(totals.occupied, totals.bedCount);

  const statusCounts =
    buildingSummary && buildingSummary.beds > 0
      ? buildingSummaryToStatusCounts(buildingSummary)
      : {
          available: floors.reduce((sum, f) => sum + f.available, 0),
          occupied: totals.occupied,
        };

  return (
    <View style={styles.root}>
      <LayoutSummaryCard
        title={buildingName ?? t('accommodation.builder.title')}
        illustration={getBuildingIllustration()}
        illustrationSize="building"
        occupancyPercent={occupancyPercent}
        statusCounts={statusCounts}
        metrics={[
          {
            label: t('accommodation.layout.dashboard.floors'),
            value: String(buildingSummary?.floors ?? floors.length),
          },
          {
            label: t('accommodation.layout.dashboard.rooms'),
            value: String(
              buildingSummary?.rooms && buildingSummary.rooms > 0
                ? buildingSummary.rooms
                : totals.roomCount,
            ),
          },
          {
            label: t('accommodation.layout.dashboard.beds'),
            value: String(
              buildingSummary?.beds && buildingSummary.beds > 0
                ? buildingSummary.beds
                : totals.bedCount,
            ),
          },
        ]}
      />
      <Text style={styles.sectionTitle}>{t('accommodation.layout.dashboard.floorsSection')}</Text>

      {floors.map(floor => (
        <FloorLayoutCard
          key={floor.floorId}
          floor={floor}
          layoutMode={layoutMode}
          highlighted={matchesAccommodationSearch(floor.name, searchQuery)}
          onPress={() => onFloorPress(floor)}
          onLongPress={onFloorLongPress ? () => onFloorLongPress(floor) : undefined}
          menu={renderFloorMenu?.(floor)}
        />
      ))}
    </View>
  );
}

export function BuildingFloorStackFrame({
  buildingName,
  children,
}: {
  buildingName?: string;
  children: React.ReactNode;
}) {
  return (
    <View style={styles.root}>
      {children}
      {buildingName ? <Text style={styles.caption}>{buildingName}</Text> : null}
    </View>
  );
}

export function BuildingFloorStackRow() {
  return null;
}

export function BuildingFloorStackHeader() {
  return null;
}

const styles = StyleSheet.create({
  root: {
    marginBottom: spacing.lg,
  },
  sectionTitle: {
    ...typography.bodyStrong,
    marginBottom: spacing.sm,
    color: colors.textPrimary,
  },
  caption: {
    ...typography.caption,
    color: colors.muted,
    marginTop: spacing.sm,
    textAlign: 'center',
  },
});
