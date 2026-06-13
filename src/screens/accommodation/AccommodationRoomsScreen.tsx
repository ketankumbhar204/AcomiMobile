import React, { useCallback, useLayoutEffect, useMemo, useState } from 'react';
import {
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useFocusEffect, useNavigation, useRoute } from '@react-navigation/native';
import type {
  NativeStackNavigationProp,
  NativeStackScreenProps,
} from '@react-navigation/native-stack';
import { useTranslation } from 'react-i18next';
import type { RoomListItemResponse } from '../../api/types';
import {
  AccommodationContextTrail,
  AccommodationEntityRow,
  AccommodationListFooter,
  AccommodationSearchBar,
  BuilderRowLifecycleMenu,
  BulkRoomsModal,
  DuplicateRoomModal,
  ParentSummaryCard,
} from '../../components/accommodation';
import {
  AccommodationOccupancyFlowModals,
  AccommodationOccupancyQuickActions,
} from '../../components/occupancy';
import { Button, EmptyState, FAB, HeaderBackButton, SkeletonCard } from '../../components/ui';
import { useAccommodationOccupancyFlow } from '../../hooks/useAccommodationOccupancyFlow';
import { useActiveSpaceId } from '../../hooks/useActiveSpaceId';
import { useBulkRooms } from '../../hooks/useBulkRooms';
import { useDuplicateRoom } from '../../hooks/useDuplicateRoom';
import { useRoomsByFloor } from '../../hooks/useRoomsByFloor';
import { useRoomsByUnit } from '../../hooks/useRoomsByUnit';
import type { MainStackParamList } from '../../navigation/types';
import { useSpaceStore } from '../../store/spaceStore';
import { useToastStore } from '../../store/toastStore';
import { colors, spacing, typography } from '../../theme';
import { formatFloorHeaderTitle } from '../../utils/accommodationLabels';
import {
  roomBundleFromRoom,
  toAccommodationBedsParams,
} from '../../utils/accommodationNavigation';
import {
  canCreateOrUpdateAccommodation,
  canManageAccommodation,
} from '../../utils/accommodationPermissions';
import { canManageOccupancy } from '../../utils/occupancyPermissions';
import {
  buildRoomOccupancyTarget,
  isOccupancyTargetSupported,
} from '../../utils/buildOccupancyTarget';
import { inferRoomListStatus } from '../../utils/inferRoomListStatus';
import {
  defaultLayoutModeForSpaceType,
  getAccommodationUiProfile,
} from '../../utils/accommodationProfile';
import { buildAccommodationTrail } from '../../utils/accommodationContext';
import {
  accommodationTrailContextFromParent,
  navigateToAccommodationTrailSegment,
} from '../../utils/accommodationNavigation';
import { invalidateAccommodationQueries } from '../../utils/accommodationQueryCache';
import { renameRoomName } from '../../utils/accommodationInlineRename';

type RoomsNav = NativeStackNavigationProp<MainStackParamList, 'AccommodationRooms'>;
type RoomsRoute = NativeStackScreenProps<MainStackParamList, 'AccommodationRooms'>['route'];

export function AccommodationRoomsScreen() {
  const { t, i18n } = useTranslation();
  const navigation = useNavigation<RoomsNav>();
  const route = useRoute<RoomsRoute>();
  const {
    buildingId,
    buildingName,
    parentType,
    parentId,
    parentName,
    parentRoomCount,
    parentBedCount,
  } = route.params;
  const spaceId = useActiveSpaceId(route.params.spaceId);
  const showToast = useToastStore(state => state.showToast);

  const mySpaces = useSpaceStore(state => state.mySpaces);
  const spaceType = useMemo(
    () => mySpaces.find(space => space.spaceId === spaceId)?.spaceType,
    [mySpaces, spaceId],
  );
  const currentRole = useMemo(
    () => mySpaces.find(space => space.spaceId === spaceId)?.membershipRole,
    [mySpaces, spaceId],
  );
  const profile = useMemo(
    () =>
      spaceType
        ? getAccommodationUiProfile(spaceType, defaultLayoutModeForSpaceType(spaceType))
        : null,
    [spaceType],
  );
  const canManage = canManageAccommodation(currentRole);
  const canManageOccupancyActions = canManageOccupancy(currentRole);
  const showFab = canCreateOrUpdateAccommodation(currentRole);
  const showBeds = profile?.showBeds ?? false;
  const supportsRoomOccupancy = Boolean(
    spaceType && isOccupancyTargetSupported(spaceType, 'ROOM'),
  );

  const [searchQuery, setSearchQuery] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const [duplicateRoomTarget, setDuplicateRoomTarget] = useState<RoomListItemResponse | null>(
    null,
  );
  const [bulkRoomsVisible, setBulkRoomsVisible] = useState(false);

  const duplicateRoomHook = useDuplicateRoom();
  const bulkRoomsHook = useBulkRooms();

  const floorHook = useRoomsByFloor(
    parentType === 'floor' ? spaceId : null,
    parentType === 'floor' ? parentId : null,
    { enabled: parentType === 'floor', searchQuery },
  );
  const unitHook = useRoomsByUnit(
    parentType === 'unit' ? spaceId : null,
    parentType === 'unit' ? parentId : null,
    { enabled: parentType === 'unit', searchQuery },
  );

  const { rooms, loading, loadingMore, error, hasMore, refresh, loadMore } =
    parentType === 'floor' ? floorHook : unitHook;

  const occupancyFlow = useAccommodationOccupancyFlow({
    spaceId,
    spaceType: spaceType ?? 'PG',
    canManage: canManageOccupancyActions,
    onSuccess: () => {
      void refresh();
    },
  });

  const screenTitle = useMemo(() => {
    if (parentType === 'floor' && parentName) {
      return formatFloorHeaderTitle(buildingName, parentName);
    }
    if (parentType === 'unit' && parentName) {
      return buildingName ? `${buildingName} · ${parentName}` : parentName;
    }
    if (parentType === 'floor' && buildingName) {
      return formatFloorHeaderTitle(buildingName, t('accommodation.rooms.title'));
    }
    return t('accommodation.rooms.title');
  }, [buildingName, parentName, parentType, t]);

  const derivedCounts = useMemo(() => {
    if (parentRoomCount != null || parentBedCount != null) {
      return { roomCount: parentRoomCount, bedCount: parentBedCount };
    }
    if (rooms.length === 0) {
      return { roomCount: undefined, bedCount: undefined };
    }
    return {
      roomCount: rooms.length,
      bedCount: rooms.reduce((sum, room) => sum + room.bedCount, 0),
    };
  }, [parentBedCount, parentRoomCount, rooms]);

  useLayoutEffect(() => {
    navigation.setOptions({
      title: screenTitle,
      headerBackVisible: false,
      headerLeft: () => <HeaderBackButton />,
    });
  }, [navigation, screenTitle, i18n.language]);

  useFocusEffect(
    useCallback(() => {
      void refresh();
    }, [refresh]),
  );

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await refresh();
    setRefreshing(false);
  }, [refresh]);

  const parentContext =
    parentType === 'floor'
      ? ({ type: 'floor' as const, id: parentId })
      : ({ type: 'unit' as const, id: parentId });

  const trailContext = useMemo(
    () => ({
      ...accommodationTrailContextFromParent(
        { spaceId, buildingId, buildingName },
        parentType,
        parentId,
        parentName,
      ),
      layoutMode: spaceType ? defaultLayoutModeForSpaceType(spaceType) : undefined,
    }),
    [buildingId, buildingName, parentId, parentName, parentType, spaceId, spaceType],
  );

  const trailSegments = useMemo(
    () => buildAccommodationTrail(trailContext, parentType === 'floor' ? 'floor' : 'unit'),
    [parentType, trailContext],
  );

  const onTrailNavigate = useCallback(
    (level: Parameters<typeof navigateToAccommodationTrailSegment>[2]) => {
      navigateToAccommodationTrailSegment(navigation, trailContext, level);
    },
    [navigation, trailContext],
  );

  const buildRoomContext = useCallback(
    (room: RoomListItemResponse, status: NonNullable<ReturnType<typeof inferRoomListStatus>>) => ({
      target: buildRoomOccupancyTarget({
        buildingId,
        buildingName: buildingName ?? '',
        floorId: parentType === 'floor' ? parentId : undefined,
        floorName: parentType === 'floor' ? parentName : undefined,
        unitId: parentType === 'unit' ? parentId : undefined,
        unitName: parentType === 'unit' ? parentName : undefined,
        roomId: room.roomId,
        roomName: room.name,
      }),
      accommodationStatus: status,
      occupancy: null,
    }),
    [buildingId, buildingName, parentId, parentName, parentType],
  );

  const openRoomDetail = (room: RoomListItemResponse) => {
    navigation.navigate('RoomDetail', {
      spaceId,
      buildingId,
      roomId: room.roomId,
      floorId: parentType === 'floor' ? parentId : undefined,
      unitId: parentType === 'unit' ? parentId : undefined,
    });
  };

  const openRoom = (room: RoomListItemResponse) => {
    const bundle = roomBundleFromRoom(
      spaceId,
      buildingId,
      { roomId: room.roomId, name: room.name },
      parentContext,
      { buildingName: buildingName ?? undefined, parentName: parentName ?? undefined },
    );

    if (showBeds) {
      navigation.navigate('AccommodationBeds', toAccommodationBedsParams(bundle));
      return;
    }

    navigation.navigate('RoomDetail', {
      spaceId,
      buildingId,
      roomId: room.roomId,
      floorId: parentType === 'floor' ? parentId : undefined,
      unitId: parentType === 'unit' ? parentId : undefined,
    });
  };

  const handleLifecycleSuccess = useCallback(
    (_action: 'deactivate' | 'restore' | 'delete', _entityType: string) => {
      invalidateAccommodationQueries();
      void refresh();
    },
    [refresh],
  );

  const showLoading = loading && !refreshing && rooms.length === 0;

  const listHeader = (
    <View style={styles.header}>
      {error ? <Text style={styles.errorText}>{error}</Text> : null}

      <AccommodationContextTrail segments={trailSegments} onNavigate={onTrailNavigate} />

      <ParentSummaryCard
        roomCount={derivedCounts.roomCount}
        bedCount={derivedCounts.bedCount}
        loading={showLoading}
      />

      {canManage ? (
        <Button
          label={t('accommodation.bulk.rooms.action')}
          variant="secondary"
          onPress={() => setBulkRoomsVisible(true)}
          style={styles.secondaryAction}
        />
      ) : null}

      <AccommodationSearchBar value={searchQuery} onChangeText={setSearchQuery} />
      {showLoading ? <SkeletonCard /> : null}
    </View>
  );

  const listEmpty =
    !showLoading && !error ? (
      <EmptyState
        title={t('accommodation.rooms.emptyTitle')}
        description={t('accommodation.rooms.emptyDescription')}
        icon="🛏️"
      />
    ) : null;

  return (
    <View style={styles.root}>
      <FlatList
        data={showLoading ? [] : rooms}
        keyExtractor={item => item.roomId}
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />
        }
        ListHeaderComponent={listHeader}
        ListEmptyComponent={listEmpty}
        ListFooterComponent={<AccommodationListFooter loadingMore={loadingMore} />}
        onEndReached={() => {
          if (hasMore) {
            void loadMore();
          }
        }}
        onEndReachedThreshold={0.3}
        renderItem={({ item: room }) => {
          const inferredStatus = inferRoomListStatus(room);
          const roomContext =
            supportsRoomOccupancy && inferredStatus
              ? buildRoomContext(room, inferredStatus)
              : null;

          return (
          <AccommodationEntityRow
            title={room.name}
            subtitle={t('accommodation.listItem.room', {
              type: t(`accommodation.roomType.${room.roomType}`),
              bedCount: room.bedCount,
              availableBeds: room.availableBeds,
              occupiedBeds: room.occupiedBeds,
            })}
            iconLabel={room.name.charAt(0).toUpperCase()}
            editableName={showFab}
            onSaveName={async name => {
              await renameRoomName(spaceId, room.roomId, name);
              showToast(t('accommodation.rooms.updateSuccess'));
              await refresh();
            }}
            onPress={() => openRoom(room)}
            footer={
              roomContext && spaceType && canManageOccupancyActions ? (
                <AccommodationOccupancyQuickActions
                  spaceType={spaceType}
                  accommodationStatus={inferredStatus!}
                  context={roomContext}
                  flow={occupancyFlow}
                  canManage={canManageOccupancyActions}
                  layout="compact"
                  onViewOccupant={
                    inferredStatus === 'AVAILABLE'
                      ? undefined
                      : () => openRoomDetail(room)
                  }
                />
              ) : undefined
            }
            menu={
              canManage ? (
                <BuilderRowLifecycleMenu
                  spaceId={spaceId}
                  buildingId={buildingId}
                  entityType="room"
                  entityId={room.roomId}
                  role={currentRole}
                  onEdit={() =>
                    navigation.navigate('RoomForm', {
                      spaceId,
                      buildingId,
                      parentType,
                      parentId,
                      mode: 'edit',
                      roomId: room.roomId,
                    })
                  }
                  onDuplicate={() => setDuplicateRoomTarget(room)}
                  duplicateLabel={t('accommodation.duplicate.room.action')}
                  onSuccess={handleLifecycleSuccess}
                />
              ) : undefined
            }
          />
          );
        }}
      />

      {spaceType ? (
        <AccommodationOccupancyFlowModals
          spaceId={spaceId}
          spaceType={spaceType}
          flow={occupancyFlow}
        />
      ) : null}

      {showFab ? (
        <FAB
          onPress={() =>
            navigation.navigate('RoomForm', {
              spaceId,
              buildingId,
              parentType,
              parentId,
              mode: 'create',
            })
          }
          accessibilityLabel={t('accommodation.rooms.addFab')}
        />
      ) : null}

      <DuplicateRoomModal
        visible={!!duplicateRoomTarget}
        sourceName={duplicateRoomTarget?.name ?? ''}
        loading={duplicateRoomHook.loading}
        error={duplicateRoomHook.error}
        onClose={() => {
          setDuplicateRoomTarget(null);
          duplicateRoomHook.setError(null);
        }}
        onSubmit={async targetRoomNumber => {
          if (!duplicateRoomTarget) {
            return;
          }
          const result = await duplicateRoomHook.duplicate(spaceId, duplicateRoomTarget.roomId, {
            targetRoomNumber,
          });
          if (!result) {
            return;
          }
          setDuplicateRoomTarget(null);
          showToast(t('accommodation.duplicate.room.success'));
          invalidateAccommodationQueries();
          void refresh();
        }}
      />

      <BulkRoomsModal
        visible={bulkRoomsVisible}
        loading={bulkRoomsHook.loading}
        error={bulkRoomsHook.error}
        onClose={() => {
          setBulkRoomsVisible(false);
          bulkRoomsHook.setError(null);
        }}
        onSubmit={async payload => {
          const result =
            parentType === 'floor'
              ? await bulkRoomsHook.bulkCreateUnderFloor(spaceId, parentId, payload)
              : await bulkRoomsHook.bulkCreateUnderUnit(spaceId, parentId, payload);
          if (!result) {
            return;
          }
          setBulkRoomsVisible(false);
          showToast(
            t('accommodation.bulk.rooms.success', {
              rooms: result.roomsCreated,
              beds: result.bedsCreated,
            }),
          );
          invalidateAccommodationQueries();
          void refresh();
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.xl, paddingBottom: 96, flexGrow: 1 },
  header: { marginBottom: spacing.md },
  secondaryAction: { marginBottom: spacing.md },
  errorText: { ...typography.body, color: '#DC2626', marginBottom: spacing.lg },
});
