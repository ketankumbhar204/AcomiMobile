import React, { useMemo } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useTranslation } from 'react-i18next';
import { X } from 'lucide-react-native';
import type { BedSpaceListItemResponse, UUID } from '../../api/types';
import { BuildingInventoryRoomSection } from './BuildingInventoryRoomSection';
import { EmptyState } from '../ui';
import { useSpaceBedSearch } from '../../hooks/useSpaceBedSearch';
import type { MainStackParamList } from '../../navigation/types';
import { colors, radius, spacing, typography } from '../../theme';
import {
  groupBedsByRoom,
  roomGroupPathCrumbs,
  type BedRoomGroup,
} from '../../utils/groupBedsByRoom';

export type RoomsOpsFocus =
  | 'OCCUPIED'
  | 'VACANT'
  | 'MOVE_INS_THIS_MONTH'
  | 'PENDING_PAYMENTS';

type AccommodationOpsFocusInventoryProps = {
  spaceId: UUID;
  opsFocus: RoomsOpsFocus;
  focusedBedIds: ReadonlySet<string>;
  onClear: () => void;
  includeUnits?: boolean;
};

function filterBedsByOpsFocus(
  beds: BedSpaceListItemResponse[],
  opsFocus: RoomsOpsFocus,
  focusedBedIds: ReadonlySet<string>,
): BedSpaceListItemResponse[] {
  if (opsFocus === 'OCCUPIED') {
    return beds.filter(bed => bed.status === 'OCCUPIED');
  }
  if (opsFocus === 'VACANT') {
    return beds.filter(bed => bed.status === 'AVAILABLE');
  }
  return beds.filter(bed => focusedBedIds.has(bed.bedId));
}

function opsFocusLabel(
  opsFocus: RoomsOpsFocus,
  t: (key: string, opts?: Record<string, unknown>) => string,
): string {
  if (opsFocus === 'OCCUPIED') {
    return t('dashboard.accommodationOperations.occupiedBeds');
  }
  if (opsFocus === 'VACANT') {
    return t('dashboard.accommodationOperations.vacantBeds');
  }
  if (opsFocus === 'PENDING_PAYMENTS') {
    return t('dashboard.accommodationOperations.pendingPayments');
  }
  return t('dashboard.accommodationOperations.moveInsThisMonth');
}

/** Filtered Wing → Floor → Unit → Room → Bed cards for Property operations focus. */
export function AccommodationOpsFocusInventory({
  spaceId,
  opsFocus,
  focusedBedIds,
  onClear,
  includeUnits = false,
}: AccommodationOpsFocusInventoryProps) {
  const { t } = useTranslation();
  const navigation = useNavigation<NativeStackNavigationProp<MainStackParamList>>();
  const bedsHook = useSpaceBedSearch({
    spaceId,
    enabled: Boolean(spaceId),
    loadAll: true,
  });

  const roomGroups = useMemo(() => {
    const filtered = filterBedsByOpsFocus(bedsHook.items, opsFocus, focusedBedIds);
    return groupBedsByRoom(filtered);
  }, [bedsHook.items, focusedBedIds, opsFocus]);

  const openBedDetail = (bed: BedSpaceListItemResponse) => {
    navigation.navigate('BedDetail', {
      spaceId,
      buildingId: bed.buildingId,
      roomId: bed.roomId,
      bedId: bed.bedId,
      bedLabel: bed.label,
      buildingName: bed.buildingName,
      roomName: bed.roomName,
      parentName: bed.unitName ?? bed.floorName ?? undefined,
      parentType: bed.unitId ? 'unit' : 'floor',
      floorId: bed.floorId ?? undefined,
      unitId: bed.unitId ?? undefined,
    });
  };

  const openRoom = (group: BedRoomGroup) => {
    navigation.navigate('AccommodationBeds', {
      spaceId,
      buildingId: group.buildingId,
      roomId: group.roomId,
      roomName: group.roomName,
      buildingName: group.buildingName,
      parentName: group.unitName ?? group.floorName ?? undefined,
      parentType: group.unitId ? 'unit' : 'floor',
      floorId: group.floorId ?? undefined,
      unitId: group.unitId ?? undefined,
    });
  };

  return (
    <View style={styles.wrap}>
      <View style={styles.chipRow}>
        <View style={styles.chip}>
          <Text style={styles.chipLabel} numberOfLines={1}>
            {t('accommodation.workspace.showingOpsFocus', {
              defaultValue: 'Showing: {{label}}',
              label: opsFocusLabel(opsFocus, t),
            })}
          </Text>
          <Pressable
            onPress={onClear}
            hitSlop={8}
            accessibilityRole="button"
            accessibilityLabel={t('common.clear', { defaultValue: 'Clear' })}
            style={styles.clearBtn}>
            <X size={14} color={colors.primaryDark} strokeWidth={2.4} />
          </Pressable>
        </View>
        <Text style={styles.count}>
          {t('accommodation.workspace.roomsBedsCount', {
            defaultValue: '{{rooms}} Rooms • {{beds}} Beds',
            rooms: roomGroups.length,
            beds: roomGroups.reduce((sum, group) => sum + group.beds.length, 0),
          })}
        </Text>
      </View>

      {bedsHook.loading && bedsHook.items.length === 0 ? (
        <ActivityIndicator color={colors.primary} style={styles.loader} />
      ) : roomGroups.length === 0 ? (
        <EmptyState
          title={t('accommodation.rooms.emptyOpsFocusTitle', {
            defaultValue: 'No matching beds',
          })}
          description={t('accommodation.rooms.emptyOpsFocusDescription', {
            defaultValue:
              'Try clearing the Property operations filter or adjusting search.',
          })}
        />
      ) : (
        roomGroups.map(group => (
          <BuildingInventoryRoomSection
            key={group.key}
            group={group}
            pathCrumbs={roomGroupPathCrumbs(group, {
              includeBuilding: true,
              includeUnit: includeUnits || Boolean(group.unitId),
            })}
            showAddBed={false}
            onRoomPress={() => openRoom(group)}
            onBedPress={openBedDetail}
          />
        ))
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    gap: spacing.md,
    marginBottom: spacing.lg,
  },
  chipRow: {
    gap: spacing.sm,
  },
  chip: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    borderRadius: radius.full,
    borderWidth: 1.5,
    borderColor: colors.primary,
    backgroundColor: colors.lightGreen,
    paddingLeft: spacing.sm,
    paddingRight: spacing.xs,
    paddingVertical: spacing.xs,
    maxWidth: '100%',
  },
  chipLabel: {
    ...typography.caption,
    color: colors.primaryDark,
    fontWeight: '700',
    flexShrink: 1,
  },
  clearBtn: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  count: {
    ...typography.caption,
    color: colors.muted,
    fontWeight: '600',
  },
  loader: {
    marginVertical: spacing.xl,
  },
});
