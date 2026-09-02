import React, { useCallback, useLayoutEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
  ScrollView,
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
import { BedDouble } from 'lucide-react-native';
import { accommodationApi } from '../../api/accommodationApi';
import type { BedListItemResponse, RoomResponse } from '../../api/types';
import {
  AccommodationContextTrail,
  AccommodationListFooter,
  bedStatusForApi,
  BED_FILTER_OPTION_COUNT,
  defaultBedStatusFilters,
  AccommodationViewModeToggle,
  BedSeatMapLayout,
  BedStatusLegend,
  BuilderRowLifecycleMenu,
  BulkBedsModal,
} from '../../components/accommodation';
import {
  AccommodationOccupancyFlowModals,
  BedInventoryListRow,
} from '../../components/occupancy';
import { Button, Card, EmptyState, FAB, HeaderBackButton, InlineEditableName, ListFilterToggleChips, ListSearchFilterBar, RequireAccommodationAccess, SkeletonCard } from '../../components/ui';
import { shouldUseFilterDrawer } from '../../utils/filterUx';
import { useActiveSpaceId } from '../../hooks/useActiveSpaceId';
import { useAccommodationOccupancyFlow } from '../../hooks/useAccommodationOccupancyFlow';
import { useAccommodationViewMode } from '../../hooks/useAccommodationViewMode';
import { useSpacePermissions } from '../../hooks/useSpacePermissions';
import { useBeds } from '../../hooks/useBeds';
import { useBulkBeds } from '../../hooks/useBulkBeds';
import type { MainStackParamList } from '../../navigation/types';
import { useToastStore } from '../../store/toastStore';
import { colors, spacing, typography } from '../../theme';
import { buildAccommodationTrail } from '../../utils/accommodationContext';
import { navigateToAccommodationTrailSegment } from '../../utils/accommodationNavigation';
import { invalidateAccommodationQueries } from '../../utils/accommodationQueryCache';
import { renameBedNumber, renameRoomName, updateBedPricingField } from '../../utils/accommodationInlineRename';
import { isAccommodationEntityActive } from '../../utils/accommodationEntityActive';
import { accommodationInactiveScopeKey } from '../../utils/accommodationInactiveRegistry';
import { applyAccommodationInactiveLifecycle } from '../../utils/accommodationInactiveLifecycle';
import { buildBedOccupancyMenuOptions } from '../../utils/bedOccupancyMenuOptions';
import { buildBedOccupancyTarget } from '../../utils/buildOccupancyTarget';

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

  const permissions = useSpacePermissions(spaceId);
  const spaceType = permissions.spaceType;
  const canManage = permissions.canManageAccommodation;
  const canManageOccupancyActions = permissions.canManageOccupancy;
  const showFab = permissions.canManageAccommodation;

  const { isLayout, setViewMode } = useAccommodationViewMode();

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilters, setStatusFilters] = useState(defaultBedStatusFilters);
  const [refreshing, setRefreshing] = useState(false);
  const [room, setRoom] = useState<RoomResponse | null>(null);
  const [roomLoading, setRoomLoading] = useState(true);
  const [bulkBedsVisible, setBulkBedsVisible] = useState(false);

  const bulkBedsHook = useBulkBeds();

  const statusFilter = bedStatusForApi(statusFilters);
  const useBedFilterDrawer = shouldUseFilterDrawer(BED_FILTER_OPTION_COUNT);

  const bedStatusChipOptions = useMemo(
    () =>
      (['AVAILABLE', 'OCCUPIED'] as const).map(status => ({
        id: status,
        label: t(`accommodation.status.${status}`),
      })),
    [t],
  );

  const { beds, loading, loadingMore, error, notFound, hasMore, refresh, loadMore, patchBed, removeBed } = useBeds(
    bedsContext,
    { searchQuery, status: statusFilter },
  );

  const resolvedRoomName = room?.name ?? roomName;
  const roomInactive = room != null && !isAccommodationEntityActive(room);

  const bedInactiveScopeKey = useMemo(
    () => accommodationInactiveScopeKey('bed', { spaceId, roomId }),
    [roomId, spaceId],
  );

  const applyBedLifecycle = useCallback(
    (
      action: 'deactivate' | 'restore' | 'delete',
      bed: BedListItemResponse,
    ) => {
      applyAccommodationInactiveLifecycle(
        action,
        'bed',
        bedInactiveScopeKey,
        bed.bedId,
        bed,
        {
          patch: patch => patchBed(bed.bedId, patch),
          remove: () => removeBed(bed.bedId),
        },
      );
    },
    [bedInactiveScopeKey, patchBed, removeBed],
  );

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

  const occupancyFlow = useAccommodationOccupancyFlow({
    spaceId,
    spaceType: spaceType ?? 'PG',
    canManage: canManageOccupancyActions,
    onSuccess: () => {
      void loadRoom();
      void refresh();
    },
  });

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
                setRoom(prev => (prev ? { ...prev, name } : prev));
                showToast(t('accommodation.rooms.updateSuccess'));
              }}
            />
          </View>
          <Text style={styles.roomMeta}>
            {t(`accommodation.roomType.${room.roomType}`)} ·{' '}
            {t('accommodation.rooms.capacity')}: {room.capacity}
          </Text>
        </View>
        {canManage ? (
          <BuilderRowLifecycleMenu
            spaceId={spaceId}
            buildingId={buildingId}
            entityType="room"
            entityId={roomId}
            role={permissions.membershipRole}
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

  const renderBedMenu = useCallback(
    (bed: BedListItemResponse) => {
      const occupancyContext = {
        target: buildBedOccupancyTarget({
          buildingId,
          buildingName: buildingName ?? '',
          floorId,
          floorName: parentType === 'floor' ? parentName : undefined,
          unitId,
          unitName: parentType === 'unit' ? parentName : undefined,
          roomId,
          roomName: resolvedRoomName ?? '',
          bedId: bed.bedId,
          bedName: bed.label,
        }),
        accommodationStatus: bed.status,
        occupancy: null,
      };

      const inactive = !isAccommodationEntityActive(bed);
      const occupancyOptions = canManageOccupancyActions && !inactive
        ? buildBedOccupancyMenuOptions(
            bed,
            spaceType ?? 'PG',
            occupancyContext,
            occupancyFlow,
            t,
            () => openBedDetail(bed),
          )
        : [];

      if (!canManage && occupancyOptions.length === 0) {
        return undefined;
      }

      return (
        <BuilderRowLifecycleMenu
          spaceId={spaceId}
          buildingId={buildingId}
          entityType="bed"
          entityId={bed.bedId}
          roomId={roomId}
          role={permissions.membershipRole}
          isInactive={inactive}
          prependOptions={occupancyOptions}
          forceShowTrigger={occupancyOptions.length > 0}
          sheetTitle={t('occupancy.bedMenu.title', {
            bed: bed.label,
            defaultValue: `Bed ${bed.label}`,
          })}
          onEdit={() =>
            navigation.navigate('BedForm', {
              spaceId,
              buildingId,
              roomId,
              mode: 'edit',
              bedId: bed.bedId,
            })
          }
          onSuccess={(action, entityType) => {
            applyBedLifecycle(action, bed);
            handleLifecycleSuccess(action, entityType);
          }}
        />
      );
    },
    [
      applyBedLifecycle,
      buildingId,
      buildingName,
      canManage,
      canManageOccupancyActions,
      floorId,
      handleLifecycleSuccess,
      navigation,
      occupancyFlow,
      parentName,
      parentType,
      permissions.membershipRole,
      resolvedRoomName,
      roomId,
      spaceId,
      spaceType,
      t,
      unitId,
    ],
  );

  const sharedHeader = hasBlockingError ? (
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
      {!hasBlockingError ? (
        <AccommodationViewModeToggle
          value={isLayout ? 'layout' : 'list'}
          onChange={setViewMode}
        />
      ) : null}
      <ListSearchFilterBar
        searchValue={searchQuery}
        onSearchChange={setSearchQuery}
        searchPlaceholder={t('accommodation.search.beds')}
        onFilterPress={() => {}}
        showFilterButton={useBedFilterDrawer}
      />
      {!useBedFilterDrawer ? (
        <ListFilterToggleChips
          options={bedStatusChipOptions}
          selected={statusFilters}
          onChange={setStatusFilters}
        />
      ) : null}
      {showLoading ? <SkeletonCard /> : null}
    </View>
  );

  const listEmpty =
    showEmpty ? (
      <EmptyState
        title={t('accommodation.beds.emptyTitle')}
        description={t('accommodation.beds.emptyDescription')}
        Icon={BedDouble}
      />
    ) : null;

  const layoutBody =
    !hasBlockingError && !showLoading && beds.length > 0 ? (
      <>
        <BedStatusLegend />
        <BedSeatMapLayout
          beds={beds}
          roomType={room?.roomType}
          roomName={resolvedRoomName}
          spaceId={spaceId}
          searchQuery={searchQuery}
          onBedPress={openBedDetail}
          renderBedMenu={renderBedMenu}
          roomInactive={roomInactive}
          editableRoomName={canManage}
          onSaveRoomName={async name => {
            if (!room) {
              return;
            }
            await renameRoomName(spaceId, roomId, name);
            setRoom(prev => (prev ? { ...prev, name } : prev));
            showToast(t('accommodation.rooms.updateSuccess'));
          }}
          renderBedNameEditor={bed =>
            canManage
              ? {
                  editableName: true,
                  onSaveName: async bedNumber => {
                    await renameBedNumber(spaceId, buildingId, roomId, bed.bedId, bedNumber);
                    patchBed(bed.bedId, { label: bedNumber });
                    showToast(t('accommodation.beds.updateSuccess'));
                  },
                }
              : {}
          }
          pricingEditable={canManage}
          onCommitBedPricing={async (bed, field, value) => {
            const updated = await updateBedPricingField(spaceId, roomId, bed.bedId, field, value);
            patchBed(bed.bedId, {
              defaultRent: updated.defaultRent,
              defaultDeposit: updated.defaultDeposit,
            });
            await refresh();
          }}
        />
        {loadingMore ? (
          <ActivityIndicator color={colors.primary} style={styles.loadMore} />
        ) : null}
      </>
    ) : showEmpty ? (
      listEmpty
    ) : null;

  return (
    <RequireAccommodationAccess spaceId={spaceId}>
    <View style={styles.root}>
      {isLayout && !hasBlockingError ? (
        <ScrollView
          contentContainerStyle={styles.content}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />
          }
          onScroll={({ nativeEvent }) => {
            const { layoutMeasurement, contentOffset, contentSize } = nativeEvent;
            const nearBottom =
              layoutMeasurement.height + contentOffset.y >= contentSize.height - 120;
            if (nearBottom && hasMore && !loadingMore) {
              void loadMore();
            }
          }}
          scrollEventThrottle={200}>
          {sharedHeader}
          {layoutBody}
        </ScrollView>
      ) : (
        <FlatList
          data={hasBlockingError || showLoading ? [] : beds}
          keyExtractor={item => item.bedId}
          contentContainerStyle={styles.content}
          refreshControl={
            !hasBlockingError ? (
              <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />
            ) : undefined
          }
          ListHeaderComponent={sharedHeader}
          ListEmptyComponent={listEmpty}
          ListFooterComponent={<AccommodationListFooter loadingMore={loadingMore} />}
          onEndReached={() => {
            if (hasMore && !hasBlockingError) {
              void loadMore();
            }
          }}
          onEndReachedThreshold={0.3}
          renderItem={({ item: bed }) => (
            <BedInventoryListRow
              bed={bed}
              spaceId={spaceId}
              spaceType={spaceType ?? 'PG'}
              flow={occupancyFlow}
              buildingId={buildingId}
              buildingName={buildingName}
              roomId={roomId}
              roomName={resolvedRoomName}
              floorId={floorId}
              unitId={unitId}
              parentName={parentName}
              parentType={parentType}
              canManageLifecycle={canManage}
              canManageOccupancyActions={canManageOccupancyActions}
              editableName={canManage}
              onSaveName={async bedNumber => {
                await renameBedNumber(spaceId, buildingId, roomId, bed.bedId, bedNumber);
                patchBed(bed.bedId, { label: bedNumber });
                showToast(t('accommodation.beds.updateSuccess'));
              }}
              onPress={() => openBedDetail(bed)}
              lifecycleMenuProps={{
                spaceId,
                buildingId,
                entityType: 'bed',
                entityId: bed.bedId,
                roomId,
                role: permissions.membershipRole,
                onEdit: () =>
                  navigation.navigate('BedForm', {
                    spaceId,
                    buildingId,
                    roomId,
                    mode: 'edit',
                    bedId: bed.bedId,
                  }),
                onSuccess: (action, entityType) => {
                  applyBedLifecycle(action, bed);
                  handleLifecycleSuccess(action, entityType);
                },
              }}
            />
          )}
        />
      )}

      {spaceType ? (
        <AccommodationOccupancyFlowModals
          spaceId={spaceId}
          spaceType={spaceType}
          flow={occupancyFlow}
        />
      ) : null}

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
    </RequireAccommodationAccess>
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
  secondaryAction: { marginBottom: spacing.md },
  errorText: { ...typography.body, color: '#DC2626', marginBottom: spacing.lg },
  backButton: { marginBottom: spacing.lg },
  loadMore: { marginVertical: spacing.md },
});
