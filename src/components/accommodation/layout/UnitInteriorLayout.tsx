import React, { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import type { RoomListItemResponse } from '../../../api/types';
import { spacing, typography } from '../../../theme';
import { matchesAccommodationSearch } from '../../../utils/accommodationLayoutSearch';
import { chunkIntoRows } from './visual/planLayoutUtils';
import { LayoutSummaryCard } from './cards/LayoutSummaryCard';
import { RoomLayoutCard } from './cards/RoomLayoutCard';
import { calcOccupancyPercent } from './cards/occupancyUtils';
import { getUnitIllustration } from './illustrations/illustrationAssets';
import { aggregateRoomBedStatusCounts } from './layoutSummaryStats';
const GRID_COLUMNS = 2;

type UnitInteriorLayoutProps = {
  unitName?: string;
  rooms: RoomListItemResponse[];
  searchQuery: string;
  onRoomPress: (room: RoomListItemResponse) => void;
  onRoomLongPress?: (room: RoomListItemResponse) => void;
  renderRoomMenu?: (room: RoomListItemResponse) => React.ReactNode;
};

export function UnitInteriorLayout({
  unitName,
  rooms,
  searchQuery,
  onRoomPress,
  onRoomLongPress,
  renderRoomMenu,
}: UnitInteriorLayoutProps) {
  const { t } = useTranslation();
  const rows = useMemo(() => chunkIntoRows(rooms, GRID_COLUMNS), [rooms]);

  const totals = useMemo(() => {
    const bedCount = rooms.reduce((sum, r) => sum + r.bedCount, 0);
    const occupied = rooms.reduce((sum, r) => sum + r.occupiedBeds, 0);
    return { bedCount, occupied };
  }, [rooms]);

  const occupancyPercent = calcOccupancyPercent(totals.occupied, totals.bedCount);
  const statusCounts = useMemo(() => aggregateRoomBedStatusCounts(rooms), [rooms]);

  return (
    <View style={styles.root}>
      <LayoutSummaryCard
        title={unitName ?? t('accommodation.rooms.title')}
        illustration={getUnitIllustration(rooms.length, totals.bedCount)}
        illustrationSize="unit"
        occupancyPercent={occupancyPercent}
        statusCounts={statusCounts}
        metrics={[          {
            label: t('accommodation.layout.dashboard.rooms'),
            value: String(rooms.length),
          },
          {
            label: t('accommodation.layout.dashboard.beds'),
            value: String(totals.bedCount),
          },
          {
            label: t('accommodation.layout.dashboard.occupied'),
            value: String(totals.occupied),
          },
        ]}
      />

      <Text style={styles.sectionTitle}>{t('accommodation.layout.dashboard.roomsSection')}</Text>

      {rows.map((row, rowIndex) => (
        <View key={`row-${rowIndex}`} style={styles.row}>
          {row.map(room => (
            <RoomLayoutCard
              key={room.roomId}
              room={room}
              highlighted={matchesAccommodationSearch(room.name, searchQuery)}
              onPress={() => onRoomPress(room)}
              onLongPress={onRoomLongPress ? () => onRoomLongPress(room) : undefined}
              menu={renderRoomMenu?.(room)}
            />
          ))}
          {row.length < GRID_COLUMNS ? <View style={styles.spacer} /> : null}
        </View>
      ))}
    </View>
  );
}

export function RoomBlockTile() {
  return null;
}

export function RoomBlockHeader({ parentName }: { parentName?: string }) {
  if (!parentName) {
    return null;
  }
  return (
    <View style={styles.header}>
      <Text style={styles.headerTitle}>{parentName}</Text>
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
  header: {
    marginBottom: spacing.md,
  },
  headerTitle: {
    ...typography.bodyStrong,
  },
});
