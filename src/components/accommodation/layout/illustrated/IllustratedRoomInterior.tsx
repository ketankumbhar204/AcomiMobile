import React, { useMemo } from 'react';
import {
  ImageBackground,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import type { RoomListItemResponse } from '../../../../api/types';
import { colors, typography } from '../../../../theme';
import { inferRoomListStatus } from '../../../../utils/inferRoomListStatus';
import { IllustratedBedMarker } from './IllustratedBedMarker';
import { getAccommodationSprite } from './spriteAssets';
import { statusBorderColor, synthesizeStatusDots } from './layoutStatusUtils';

const BED_LETTERS = 'ABCDEFGH';

function columnsForBeds(count: number): number {
  if (count <= 4) {
    return 1;
  }
  return 2;
}

function splitIntoColumns<T>(items: T[], columnCount: number): T[][] {
  const perCol = Math.ceil(items.length / columnCount);
  const cols: T[][] = [];
  for (let c = 0; c < columnCount; c++) {
    const slice = items.slice(c * perCol, (c + 1) * perCol);
    if (slice.length > 0) {
      cols.push(slice);
    }
  }
  return cols;
}

type IllustratedRoomInteriorProps = {
  room: RoomListItemResponse;
  highlighted?: boolean;
  onPress: () => void;
  onLongPress?: () => void;
  menu?: React.ReactNode;
};

export function IllustratedRoomInterior({
  room,
  highlighted = false,
  onPress,
  onLongPress,
  menu,
}: IllustratedRoomInteriorProps) {
  const roomStatus = inferRoomListStatus(room);
  const border = statusBorderColor(roomStatus);

  const beds = useMemo(() => {
    if (room.bedCount <= 0) {
      return [];
    }
    const statuses = synthesizeStatusDots({
      total: room.bedCount,
      occupied: room.occupiedBeds,
      available: room.availableBeds,
      maxDots: room.bedCount,
    });
    return statuses.map((status, index) => ({
      label: BED_LETTERS[index] ?? String(index + 1),
      status,
    }));
  }, [room]);

  const bedColumns = splitIntoColumns(beds, columnsForBeds(beds.length));

  return (
    <Pressable
      onPress={onPress}
      onLongPress={onLongPress}
      style={({ pressed }) => [styles.wrap, pressed && styles.pressed]}>
      <Text style={styles.roomName} numberOfLines={1}>
        {room.name}
      </Text>

      <View style={[styles.shellFrame, highlighted && styles.highlighted, { borderColor: border }]}>
        <ImageBackground
          source={getAccommodationSprite('roomInteriorShell')}
          style={styles.shell}
          imageStyle={styles.shellImage}
          resizeMode="stretch">
          <View style={styles.bedArea}>
            <View style={styles.bedColumns}>
              {bedColumns.map((colBeds, colIndex) => (
                <View key={`col-${colIndex}`} style={styles.bedColumn}>
                  {colBeds.map(bed => (
                    <IllustratedBedMarker
                      key={bed.label}
                      label={bed.label}
                      status={bed.status}
                    />
                  ))}
                </View>
              ))}
            </View>
          </View>
        </ImageBackground>
      </View>

      {room.bedCount > 0 ? (
        <Text style={styles.ratio}>
          {room.occupiedBeds}/{room.bedCount}
        </Text>
      ) : null}

      {menu ? <View style={styles.menu}>{menu}</View> : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  wrap: {
    width: 112,
    marginHorizontal: 4,
    alignItems: 'center',
    position: 'relative',
  },
  pressed: {
    opacity: 0.9,
  },
  highlighted: {
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.4,
    shadowRadius: 4,
    elevation: 3,
  },
  roomName: {
    ...typography.caption,
    fontWeight: '800',
    fontSize: 10,
    marginBottom: 4,
    textAlign: 'center',
  },
  shellFrame: {
    width: '100%',
    aspectRatio: 0.85,
    borderWidth: 2,
    borderRadius: 4,
    overflow: 'hidden',
    borderColor: colors.border,
  },
  shell: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  shellImage: {
    width: '100%',
    height: '100%',
  },
  bedArea: {
    flex: 1,
    paddingTop: 14,
    paddingBottom: 16,
    paddingHorizontal: 10,
    justifyContent: 'center',
  },
  bedColumns: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
  },
  bedColumn: {
    alignItems: 'flex-start',
  },
  ratio: {
    ...typography.caption,
    fontSize: 9,
    fontWeight: '700',
    color: colors.muted,
    marginTop: 4,
  },
  menu: {
    position: 'absolute',
    top: 14,
    right: 0,
    zIndex: 2,
  },
});
