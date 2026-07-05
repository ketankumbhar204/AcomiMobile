import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import type { RoomListItemResponse } from '../../../../api/types';
import { InlineEditableName } from '../../../ui/InlineEditableName';
import { colors, radius, shadows, spacing, typography } from '../../../../theme';
import { isAccommodationEntityActive } from '../../../../utils/accommodationEntityActive';
import { inferRoomListStatus } from '../../../../utils/inferRoomListStatus';
import {
  AccommodationInactiveBadge,
  accommodationInactiveCardStyle,
  accommodationInactiveIllustrationStyle,
} from '../../AccommodationInactiveBadge';
import { AccommodationStatusBadge } from '../../AccommodationStatusBadge';
import { getRoomIllustration } from '../illustrations/illustrationAssets';
import { CircularOccupancyIndicator } from './CircularOccupancyIndicator';
import { LayoutCardShell } from './LayoutCardShell';
import { LayoutIllustration } from './LayoutIllustration';
import { OccupancyProgressBar } from './OccupancyProgressBar';
import { calcOccupancyPercent } from './occupancyUtils';

type RoomLayoutCardProps = {
  room: RoomListItemResponse;
  highlighted?: boolean;
  onPress: () => void;
  onLongPress?: () => void;
  menu?: React.ReactNode;
  editableName?: boolean;
  onSaveName?: (name: string) => Promise<void>;
};

export function RoomLayoutCard({
  room,
  highlighted = false,
  onPress,
  onLongPress,
  menu,
  editableName = false,
  onSaveName,
}: RoomLayoutCardProps) {
  const { t } = useTranslation();
  const inactive = !isAccommodationEntityActive(room);
  const activeBedCount = inactive ? 0 : room.bedCount;
  const percent = calcOccupancyPercent(room.occupiedBeds, activeBedCount);
  const status = inactive ? null : inferRoomListStatus(room);
  const illustration = getRoomIllustration(Math.max(activeBedCount, 1));

  return (
    <LayoutCardShell
      debugCardId={`room-${room.roomId}`}
      onPress={onPress}
      onLongPress={onLongPress}
      menu={menu}
      shellStyle={styles.shell}
      cardStyle={[
        styles.card,
        highlighted && styles.highlighted,
        inactive && accommodationInactiveCardStyle,
      ]}
      pressedStyle={styles.pressed}>
      <LayoutIllustration
        source={illustration}
        size="room"
        style={inactive ? accommodationInactiveIllustrationStyle : undefined}
      />
      {editableName && onSaveName ? (
        <InlineEditableName value={room.name} editable onSave={onSaveName} />
      ) : (
        <Text style={[styles.title, inactive && styles.titleInactive]} numberOfLines={2}>
          {room.name}
        </Text>
      )}
      {!inactive ? (
        <>
          <Text style={styles.ratio}>
            {t('accommodation.layout.dashboard.bedsOccupied', {
              occupied: room.occupiedBeds,
              total: room.bedCount,
            })}
          </Text>
          <OccupancyProgressBar percent={percent} height={6} />
        </>
      ) : null}
      <View style={styles.footer}>
        {inactive ? (
          <AccommodationInactiveBadge />
        ) : status ? (
          <AccommodationStatusBadge status={status} />
        ) : null}
        {!inactive ? <CircularOccupancyIndicator percent={percent} size={40} /> : null}
      </View>
    </LayoutCardShell>
  );
}

const styles = StyleSheet.create({
  shell: {
    flex: 1,
    minWidth: '46%',
    maxWidth: '50%',
    marginBottom: spacing.md,
  },
  card: {
    flex: 1,
    backgroundColor: colors.white,
    borderRadius: radius.card,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    gap: 6,
    ...shadows.sm,
  },
  highlighted: {
    borderColor: colors.primary,
    borderWidth: 2,
  },
  pressed: {
    backgroundColor: colors.surface,
  },
  title: {
    ...typography.bodyStrong,
    fontSize: 15,
  },
  titleInactive: {
    color: '#6B7280',
  },
  ratio: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: spacing.xs,
  },
});
