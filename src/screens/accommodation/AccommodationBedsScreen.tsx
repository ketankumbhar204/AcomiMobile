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
import { accommodationApi } from '../../api/accommodationApi';
import type { BedListItemResponse, RoomResponse } from '../../api/types';
import {
  AccommodationContextTrail,
  AccommodationEntityRow,
  AccommodationListFooter,
  AccommodationSearchBar,
  AccommodationStatusBadge,
  BuilderRowLifecycleMenu,
  BulkBedsModal,
} from '../../components/accommodation';
import { Button, Card, EmptyState, FAB, HeaderBackButton, InlineEditableName, SkeletonCard } from '../../components/ui';
import { useActiveSpaceId } from '../../hooks/useActiveSpaceId';
import { useBeds } from '../../hooks/useBeds';
import { useBulkBeds } from '../../hooks/useBulkBeds';
import type { MainStackParamList } from '../../navigation/types';
import { useSpaceStore } from '../../store/spaceStore';
import { useToastStore } from '../../store/toastStore';
import { colors, spacing, typography } from '../../theme';
import { buildAccommodationTrail } from '../../utils/accommodationContext';
import { navigateToAccommodationTrailSegment } from '../../utils/accommodationNavigation';
import {
  canCreateOrUpdateAccommodation,
  canManageAccommodation,
} from '../../utils/accommodationPermissions';
import { invalidateAccommodationQueries } from '../../utils/accommodationQueryCache';
import { renameBedNumber, renameRoomName } from '../../utils/accommodationInlineRename';

type BedsNav = NativeStackNavigationProp<MainStackParamList, 'AccommodationBeds'>;
type BedsRoute = NativeStackScreenProps<MainStackParamList, 'AccommodationBeds'>['route'];

export function AccommodationBedsScreen() {
  const { t, i18n } = useTranslation();
  const navigation = useNavigation<BedsNav>();
  const route = useRoute<BedsRoute>();
  const spaceId = useActiveSpaceId(route.params.spaceId);
  const {
    buildingId,
    roomId,
    roomName,
    buildingName,
    parentName,
    parentType,
    floorId,
    unitId,
  } = route.params;
  const showToast = useToastStore(state => state.showToast);

  const bedsContext = useMemo(
    () =>
      spaceId && roomId && buildingId
        ? { spaceId, buildingId, roomId, floorId, unitId }
        : null,
    [buildingId, floorId, roomId, spaceId, unitId],
  );

  const mySpaces = useSpaceStore(state => state.mySpaces);
  const currentRole = useMemo(
    () => mySpaces.find(space => space.spaceId === spaceId)?.membershipRole,
    [mySpaces, spaceId],
  );
  const canManage = canManageAccommodation(currentRole);
  const showFab = canCreateOrUpdateAccommodation(currentRole);

  const [searchQuery, setSearchQuery] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const [room, setRoom] = useState<RoomResponse | null>(null);
  const [roomLoading, setRoomLoading] = useState(true);
  const [bulkBedsVisible, setBulkBedsVisible] = useState(false);

  const bulkBedsHook = useBulkBeds();

  const { beds, loading, loadingMore, error, notFound, hasMore, refresh, loadMore } = useBeds(
    bedsContext,
    { searchQuery },
  );

  const resolvedRoomName = room?.name ?? roomName;

  const trailContext = useMemo(
    () => ({
      spaceId,
      buildingId,
      buildingName,
      floorId,
      floorName: parentType === 'floor' ? parentName : undefined,
      unitId,
      unitName: parentType === 'unit' ? parentName : undefined,
      roomId,
      roomName: resolvedRoomName,
    }),
    [
      buildingId,
      buildingName,
      floorId,
      parentName,
      parentType,
      resolvedRoomName,
      roomId,
      spaceId,
      unitId,
    ],
  );

  const trailSegments = useMemo(
    () => buildAccommodationTrail(trailContext, 'room'),
    [trailContext],
  );

  const onTrailNavigate = useCallback(
    (level: Parameters<typeof navigateToAccommodationTrailSegment>[2]) => {
      navigateToAccommodationTrailSegment(navigation, trailContext, level);
    },
    [navigation, trailContext],
  );

  const loadRoom = useCallback(async () => {
    setRoomLoading(true);
    try {
      const data = await accommodationApi.getRoom(spaceId, roomId);
      setRoom(data);
    } catch {
      setRoom(null);
    } finally {
      setRoomLoading(false);
    }
  }, [roomId, spaceId]);

  useLayoutEffect(() => {
    navigation.setOptions({
      title: resolvedRoomName,
      headerBackVisible: false,
      headerLeft: () => <HeaderBackButton />,
    });
  }, [navigation, resolvedRoomName, i18n.language]);

  useFocusEffect(
    useCallback(() => {
      void loadRoom();
      void refresh();
    }, [loadRoom, refresh]),
  );

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await Promise.all([loadRoom(), refresh()]);
    setRefreshing(false);
  }, [loadRoom, refresh]);

  const openBedDetail = (bed: BedListItemResponse) => {
    navigation.navigate('BedDetail', {
      spaceId,
      buildingId,
      roomId,
      bedId: bed.bedId,
      buildingName: buildingName ?? undefined,
      parentName: parentName ?? undefined,
      parentType,
      floorId,
      unitId,
      roomName: resolvedRoomName,
      bedLabel: bed.label,
    });
  };

  const handleLifecycleSuccess = useCallback(
    (_action: 'deactivate' | 'restore' | 'delete', _entityType: string) => {
      invalidateAccommodationQueries();
      void refresh();
    },
    [refresh],
  );

  const handleRoomLifecycleSuccess = useCallback(() => {
    invalidateAccommodationQueries();
    void loadRoom();
    void refresh();
  }, [loadRoom, refresh]);

  const hasBlockingError = notFound || Boolean(error);
  const showLoading = (loading || roomLoading) && !refreshing && beds.length === 0;
  const showEmpty = !showLoading && !hasBlockingError && beds.length === 0;

  const roomSummary = room ? (
    <Card style={styles.roomCard}>
      <View style={styles.roomCardHeader}>
        <View style={styles.roomCardBody}>
          <View style={styles.roomTitleWrap}>
            <InlineEditableName
              value={room.name}
              editable={canManage}
              onSave={async name => {
                await renameRoomName(spaceId, roomId, name);
                showToast(t('accommodation.rooms.updateSuccess'));
                await loadRoom();
              }}
            />
          </View>
          <Text style={styles.roomMeta}>
            {t(`accommodation.roomType.${room.roomType}`)} ·{' '}
            {t('accommodation.rooms.capacity')}: {room.capacity}
          </Text>
          <View style={styles.badgeRow}>
            <AccommodationStatusBadge status={room.status} />
          </View>
        </View>
        {canManage ? (
          <BuilderRowLifecycleMenu
            spaceId={spaceId}
            buildingId={buildingId}
            entityType="room"
            entityId={roomId}
            role={currentRole}
            onEdit={() =>
              navigation.navigate('RoomForm', {
                spaceId,
                buildingId,
                parentType: room.floorId || floorId ? 'floor' : 'unit',
                parentId: (room.floorId ?? room.unitId ?? floorId ?? unitId) as string,
                mode: 'edit',
                roomId,
              })
            }
            onSuccess={(_action, _entityType) => {
              handleRoomLifecycleSuccess();
            }}
          />
        ) : null}
      </View>
    </Card>
  ) : roomLoading ? (
    <SkeletonCard />
  ) : null;

  const listHeader = hasBlockingError ? (
    <View style={styles.header}>
      {error ? <Text style={styles.errorText}>{error}</Text> : null}
      <Button
        label={t('accommodation.errors.goBack')}
        variant="secondary"
        onPress={() => navigation.goBack()}
        style={styles.backButton}
      />
    </View>
  ) : (
    <View style={styles.header}>
      {error ? <Text style={styles.errorText}>{error}</Text> : null}
      <AccommodationContextTrail segments={trailSegments} onNavigate={onTrailNavigate} />
      {roomSummary}
      {canManage ? (
        <Button
          label={t('accommodation.bulk.beds.action')}
          variant="secondary"
          onPress={() => setBulkBedsVisible(true)}
          style={styles.secondaryAction}
        />
      ) : null}
      <AccommodationSearchBar value={searchQuery} onChangeText={setSearchQuery} />
      {showLoading ? <SkeletonCard /> : null}
    </View>
  );

  const listEmpty =
    showEmpty ? (
      <EmptyState
        title={t('accommodation.beds.emptyTitle')}
        description={t('accommodation.beds.emptyDescription')}
        icon="🛌"
      />
    ) : null;

  return (
    <View style={styles.root}>
      <FlatList
        data={hasBlockingError || showLoading ? [] : beds}
        keyExtractor={item => item.bedId}
        contentContainerStyle={styles.content}
        refreshControl={
          !hasBlockingError ? (
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />
          ) : undefined
        }
        ListHeaderComponent={listHeader}
        ListEmptyComponent={listEmpty}
        ListFooterComponent={<AccommodationListFooter loadingMore={loadingMore} />}
        onEndReached={() => {
          if (hasMore && !hasBlockingError) {
            void loadMore();
          }
        }}
        onEndReachedThreshold={0.3}
        renderItem={({ item: bed }) => (
          <AccommodationEntityRow
            title={bed.label}
            subtitle={t(`accommodation.status.${bed.status}`)}
            iconLabel={bed.label.charAt(0).toUpperCase()}
            editableName={canManage}
            onSaveName={async bedNumber => {
              await renameBedNumber(spaceId, buildingId, roomId, bed.bedId, bedNumber);
              showToast(t('accommodation.beds.updateSuccess'));
              await refresh();
            }}
            onPress={() => openBedDetail(bed)}
            menu={
              canManage ? (
                <BuilderRowLifecycleMenu
                  spaceId={spaceId}
                  buildingId={buildingId}
                  entityType="bed"
                  entityId={bed.bedId}
                  roomId={roomId}
                  role={currentRole}
                  onEdit={() =>
                    navigation.navigate('BedForm', {
                      spaceId,
                      buildingId,
                      roomId,
                      mode: 'edit',
                      bedId: bed.bedId,
                    })
                  }
                  onSuccess={handleLifecycleSuccess}
                />
              ) : undefined
            }
          />
        )}
      />

      {showFab && !hasBlockingError ? (
        <FAB
          onPress={() =>
            navigation.navigate('BedForm', {
              spaceId,
              buildingId,
              roomId,
              mode: 'create',
            })
          }
          accessibilityLabel={t('accommodation.beds.addFab')}
        />
      ) : null}

      <BulkBedsModal
        visible={bulkBedsVisible}
        roomName={resolvedRoomName}
        loading={bulkBedsHook.loading}
        error={bulkBedsHook.error}
        onClose={() => {
          setBulkBedsVisible(false);
          bulkBedsHook.setError(null);
        }}
        onSubmit={async (count, labelStyle) => {
          const result = await bulkBedsHook.bulkCreate(spaceId, roomId, {
            count,
            labelStyle,
          });
          if (!result) {
            return;
          }
          setBulkBedsVisible(false);
          showToast(t('accommodation.bulk.beds.success', { count: result.bedsCreated }));
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
  roomCard: { marginBottom: spacing.lg },
  roomCardHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  roomCardBody: {
    flex: 1,
    minWidth: 0,
    paddingRight: spacing.xs,
  },
  roomTitleWrap: { marginBottom: spacing.xs },
  roomMeta: { ...typography.body, color: colors.textSecondary, marginBottom: spacing.sm },
  badgeRow: { marginTop: spacing.xs },
  secondaryAction: { marginBottom: spacing.md },
  errorText: { ...typography.body, color: '#DC2626', marginBottom: spacing.lg },
  backButton: { marginBottom: spacing.lg },
});
