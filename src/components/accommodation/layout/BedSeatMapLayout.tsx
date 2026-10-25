import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import type { BedListItemResponse, RoomType, UUID } from '../../../api/types';
import { colors, spacing, typography } from '../../../theme';
import { filterActiveEntities } from '../../../utils/accommodationEntityActive';
import { matchesAccommodationSearch } from '../../../utils/accommodationLayoutSearch';
import { BuildingInventoryBedCard } from '../BuildingInventoryBedCard';
import { HorizontalBedCarousel } from '../HorizontalBedCarousel';
import { LayoutSummaryCard } from './cards/LayoutSummaryCard';
import { LayoutEntityPhoto } from './cards/LayoutEntityPhoto';
import { LayoutIllustration } from './cards/LayoutIllustration';
import { calcOccupancyPercent } from './cards/occupancyUtils';
import { getRoomIllustration } from './illustrations/illustrationAssets';
import { aggregateBedStatusCounts, countInactiveFromList } from './layoutSummaryStats';
import type { AccommodationStatus } from '../../../api/types';

type BedSeatMapLayoutProps = {
  beds: BedListItemResponse[];
  roomType?: RoomType;
  roomName?: string;
  roomId?: UUID;
  roomPhotoFileId?: string | null;
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
  onEditBed?: (bed: BedListItemResponse) => void;
};

function countByStatus(beds: BedListItemResponse[], status: AccommodationStatus): number {
  return beds.filter(b => b.status === status).length;
}

export function BedSeatMapLayout({
  beds,
  roomName,
  roomId,
  roomPhotoFileId,
  spaceId,
  searchQuery,
  onBedPress,
  onBedLongPress,
  renderBedMenu,
  roomInactive = false,
  editableRoomName = false,
  onSaveRoomName,
  onEditBed,
}: BedSeatMapLayoutProps) {
  const { t } = useTranslation();
  const activeBeds = filterActiveEntities(beds);

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
          photo={
            roomId ? (
              <LayoutEntityPhoto
                kind="room"
                entityId={roomId}
                fileId={roomPhotoFileId}
                title={roomName}
                height={112}
                fallback={
                  <LayoutIllustration
                    source={getRoomIllustration(Math.max(activeBeds.length, 1))}
                    size="room"
                  />
                }
              />
            ) : undefined
          }
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

      <HorizontalBedCarousel
        fadeColor={colors.background}
        accessibilityLabel={t('accommodation.layout.dashboard.bedsSection', { defaultValue: 'Beds' })}>
        {beds.map(bed => (
          <BuildingInventoryBedCard
            key={bed.bedId}
            bed={bed}
            spaceId={spaceId}
            highlighted={matchesAccommodationSearch(bed.label, searchQuery)}
            onPress={() => onBedPress(bed)}
            onLongPress={onBedLongPress ? () => onBedLongPress(bed) : undefined}
            menu={renderBedMenu?.(bed)}
            onEdit={onEditBed ? () => onEditBed(bed) : undefined}
          />
        ))}
      </HorizontalBedCarousel>
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
});
