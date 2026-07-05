import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import type { BedListItemResponse, RoomType, UUID } from '../../../api/types';
import { spacing, typography } from '../../../theme';
import { filterActiveEntities } from '../../../utils/accommodationEntityActive';
import { matchesAccommodationSearch } from '../../../utils/accommodationLayoutSearch';
import { chunkIntoRows } from './visual/planLayoutUtils';
import { BedLayoutCard } from './cards/BedLayoutCard';
import { LayoutSummaryCard } from './cards/LayoutSummaryCard';
import { calcOccupancyPercent } from './cards/occupancyUtils';
import { getRoomIllustration } from './illustrations/illustrationAssets';
import { aggregateBedStatusCounts, countInactiveFromList } from './layoutSummaryStats';
import type { AccommodationStatus } from '../../../api/types';

const GRID_COLUMNS = 2;

type BedSeatMapLayoutProps = {
  beds: BedListItemResponse[];
  roomType?: RoomType;
  roomName?: string;
  spaceId?: UUID;
  searchQuery: string;
  onBedPress: (bed: BedListItemResponse) => void;
  onBedLongPress?: (bed: BedListItemResponse) => void;
  renderBedMenu?: (bed: BedListItemResponse) => React.ReactNode;
  roomInactive?: boolean;
  editableRoomName?: boolean;
  onSaveRoomName?: (name: string) => Promise<void>;
  renderBedNameEditor?: (bed: BedListItemResponse) => {
    editableName?: boolean;
    onSaveName?: (name: string) => Promise<void>;
  };
};

function countByStatus(beds: BedListItemResponse[], status: AccommodationStatus): number {
  return beds.filter(b => b.status === status).length;
}

export function BedSeatMapLayout({
  beds,
  roomName,
  spaceId,
  searchQuery,
  onBedPress,
  onBedLongPress,
  renderBedMenu,
  roomInactive = false,
  editableRoomName = false,
  onSaveRoomName,
  renderBedNameEditor,
}: BedSeatMapLayoutProps) {
  const { t } = useTranslation();
  const activeBeds = filterActiveEntities(beds);
  const rows = chunkIntoRows(beds, GRID_COLUMNS);

  const occupied =
    countByStatus(activeBeds, 'OCCUPIED') + countByStatus(activeBeds, 'RESERVED');
  const occupancyPercent = calcOccupancyPercent(occupied, activeBeds.length);
  const statusCounts = {
    ...aggregateBedStatusCounts(beds),
    inactive: countInactiveFromList(beds),
  };

  return (
    <View style={styles.root}>
      {roomName ? (
        <LayoutSummaryCard
          title={roomName}
          illustration={getRoomIllustration(Math.max(activeBeds.length, 1))}
          illustrationSize="room"
          occupancyPercent={roomInactive ? undefined : occupancyPercent}
          statusCounts={statusCounts}
          inactive={roomInactive}
          editableName={editableRoomName}
          onSaveName={onSaveRoomName}
          metrics={[
            {
              label: t('accommodation.layout.dashboard.capacity'),
              value: String(activeBeds.length),
            },
            {
              label: t('accommodation.layout.dashboard.available'),
              value: String(countByStatus(activeBeds, 'AVAILABLE')),
            },
            {
              label: t('accommodation.layout.dashboard.occupied'),
              value: String(countByStatus(activeBeds, 'OCCUPIED')),
            },
            {
              label: t('accommodation.layout.dashboard.inactive'),
              value: String(statusCounts.inactive ?? 0),
            },
          ]}
        />
      ) : null}

      <Text style={styles.sectionTitle}>{t('accommodation.layout.dashboard.bedsSection')}</Text>

      {rows.map((row, rowIndex) => (
        <View key={`row-${rowIndex}`} style={styles.row}>
          {row.map(bed => {
            const nameEditor = renderBedNameEditor?.(bed);
            return (
              <BedLayoutCard
                key={bed.bedId}
                bed={bed}
                spaceId={spaceId}
                highlighted={matchesAccommodationSearch(bed.label, searchQuery)}
                onPress={() => onBedPress(bed)}
                onLongPress={onBedLongPress ? () => onBedLongPress(bed) : undefined}
                menu={renderBedMenu?.(bed)}
                editableName={nameEditor?.editableName}
                onSaveName={nameEditor?.onSaveName}
              />
            );
          })}
          {row.length < GRID_COLUMNS ? <View style={styles.spacer} /> : null}
        </View>
      ))}
    </View>
  );
}

export function bedSeatStatusLegend(): AccommodationStatus[] {
  return ['AVAILABLE', 'RESERVED', 'OCCUPIED', 'MAINTENANCE'];
}

const styles = StyleSheet.create({
  root: {
    marginBottom: spacing.md,
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
