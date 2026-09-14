import React, { useCallback, useLayoutEffect, useMemo, useState } from 'react';
import {
  FlatList,
  Pressable,
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
import { Copy, Grid2x2, Layers, Pencil } from 'lucide-react-native';
import type {
  BedSpaceListItemResponse,
  FloorListItemResponse,
  SpaceType,
  UnitListItemResponse,
} from '../../api/types';
import {
  AccommodationContextTrail,
  AccommodationEntityRow,
  AccommodationListFooter,
  AccommodationSearchBar,
  AccommodationStatusBadge,
  AccommodationViewModeToggle,
  BuildingElevationLayout,
  BuildingInventoryRoomSection,
  BuildingSummaryHeader,
  BuildingUnitElevation,
  BuilderRowLifecycleMenu,
  BulkUnitsModal,
  DuplicateBuildingModal,
  DuplicateFloorModal,
  HeaderMenuSlot,
  UNIT_GRID_NUM_COLUMNS,
} from '../../components/accommodation';
import type { MenuOption } from '../../components/accommodation/BuilderRowLifecycleMenu';
import { EmptyState, FAB, HeaderBackButton, RequireAccommodationAccess, SkeletonCard } from '../../components/ui';
import { DashboardSectionTitle } from '../../components/dashboard/DashboardSectionTitle';
import { DashboardActionRow } from '../../components/dashboard/shared/DashboardActionRow';
import { useHierarchyOccupancyPicker } from '../../hooks/useHierarchyOccupancyPicker';
import { useActiveSpaceId } from '../../hooks/useActiveSpaceId';
import { useAccommodationUiProfile } from '../../hooks/useAccommodationUiProfile';
import { useSpacePermissions } from '../../hooks/useSpacePermissions';
import { useAccommodationViewMode } from '../../hooks/useAccommodationViewMode';
import { useAccommodationSearchScroll } from '../../hooks/useAccommodationSearchScroll';
import { useBulkUnits } from '../../hooks/useBulkUnits';
import { useDuplicateBuilding } from '../../hooks/useDuplicateBuilding';
import { useDuplicateFloor } from '../../hooks/useDuplicateFloor';
import { useFloors } from '../../hooks/useFloors';
import { useUnits } from '../../hooks/useUnits';
import { useSpaceBedSearch } from '../../hooks/useSpaceBedSearch';
import { resetToAccommodationHome } from '../../navigation/navigationRef';
import type { MainStackParamList } from '../../navigation/types';
import { useToastStore } from '../../store/toastStore';
import { colors, spacing, typography } from '../../theme';
import { buildAccommodationTrail } from '../../utils/accommodationContext';
import { navigateToAccommodationTrailSegment } from '../../utils/accommodationNavigation';
import { invalidateAccommodationQueries } from '../../utils/accommodationQueryCache';
import {
  renameBuildingName,
  renameFloorName,
  renameUnitName,
  updateBedPricingField,
} from '../../utils/accommodationInlineRename';
import { isAccommodationEntityActive } from '../../utils/accommodationEntityActive';
import { applyAccommodationInactiveLifecycle } from '../../utils/accommodationInactiveLifecycle';
import { groupBedsByRoom, roomGroupPathSegments, type BedRoomGroup } from '../../utils/groupBedsByRoom';

type Nav = NativeStackNavigationProp<MainStackParamList, 'AccommodationBuilder'>;
type Route = NativeStackScreenProps<MainStackParamList, 'AccommodationBuilder'>['route'];

type ListItem = FloorListItemResponse | UnitListItemResponse;

function isFloorItem(item: ListItem): item is FloorListItemResponse {
  return 'floorId' in item;
}

export function AccommodationBuilderScreen() {
  const { t, i18n } = useTranslation();
  const navigation = useNavigation<Nav>();
  const route = useRoute<Route>();
  const { buildingId } = route.params;
  const spaceId = useActiveSpaceId(route.params.spaceId);
  const showToast = useToastStore(state => state.showToast);

  const permissions = useSpacePermissions(spaceId);
  const spaceType = permissions.spaceType as SpaceType | undefined;

  const {
    profile,
    summary,
    summaryLoading,
    summaryError,
    refreshSummary,
    patchSummary,
  } = useAccommodationUiProfile(spaceId, spaceType, buildingId);
  const canManage = permissions.canManageAccommodation;
  const canManageOccupancyActions = permissions.canManageOccupancy;
  const showFab = permissions.canManageAccommodation;
  const hierarchyPicker = useHierarchyOccupancyPicker(spaceId, spaceType);
  const isRental = profile?.layoutMode === 'RENTAL';

  const { isLayout, setViewMode } = useAccommodationViewMode();

  const [searchQuery, setSearchQuery] = useState('');
  const [refreshing, setRefreshing] = useState(false);

  const floorsHook = useFloors(spaceId, buildingId, {
    enabled: Boolean(profile?.showFloors),
    searchQuery,
  });
  const unitsHook = useUnits(spaceId, buildingId, {
    enabled: Boolean(profile?.showUnits),
    searchQuery,
  });

  const inventoryEnabled = Boolean(
    profile?.showBeds && profile.layoutMode !== 'RENTAL',
  );
  const bedsHook = useSpaceBedSearch({
    spaceId,
    buildingId,
    query: searchQuery,
    enabled: inventoryEnabled,
    loadAll: true,
  });
  const roomGroups = useMemo(
    () => groupBedsByRoom(bedsHook.items),
    [bedsHook.items],
  );
  /** Same inventory mock for List and Layout (elevation layout kept for non-bed modes). */
  const useInventoryList = inventoryEnabled;

  const listHook = profile?.showFloors ? floorsHook : unitsHook;
  const {
    loading: listLoading,
    loadingMore,
    error: listError,
    hasMore,
    refresh: refreshList,
    loadMore,
  } = listHook;

  const items: ListItem[] = profile?.showFloors ? floorsHook.floors : unitsHook.units;

  const listRef = useAccommodationSearchScroll(
    items,
    searchQuery,
    useCallback((item: ListItem) => item.name, []),
  );

  const trailContext = useMemo(
    () => ({
      spaceId,
      buildingId,
      buildingName: summary?.name,
      layoutMode: profile?.layoutMode,
    }),
    [buildingId, profile?.layoutMode, spaceId, summary?.name],
  );

  const trailSegments = useMemo(
    () => buildAccommodationTrail(trailContext, 'building'),
    [trailContext],
  );

  const onTrailNavigate = useCallback(
    (level: Parameters<typeof navigateToAccommodationTrailSegment>[2]) => {
      navigateToAccommodationTrailSegment(navigation, trailContext, level);
    },
    [navigation, trailContext],
  );

  const duplicateBuildingHook = useDuplicateBuilding();
  const duplicateFloorHook = useDuplicateFloor();
  const bulkUnitsHook = useBulkUnits();

  const [duplicateBuildingVisible, setDuplicateBuildingVisible] = useState(false);
  const [duplicateFloorTarget, setDuplicateFloorTarget] = useState<FloorListItemResponse | null>(
    null,
  );
  const [bulkUnitsVisible, setBulkUnitsVisible] = useState(false);

  const refreshBeds = bedsHook.refresh;
  const refreshAll = useCallback(async () => {
    await Promise.all([
      refreshSummary(),
      refreshList(),
      inventoryEnabled ? refreshBeds() : Promise.resolve(),
    ]);
  }, [inventoryEnabled, refreshBeds, refreshList, refreshSummary]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await refreshAll();
    setRefreshing(false);
  }, [refreshAll]);

  const handleLifecycleSuccess = useCallback(
    (action: 'deactivate' | 'restore' | 'delete', entityType: string) => {
      if (action === 'delete' && entityType === 'building') {
        resetToAccommodationHome(spaceId);
        return;
      }
      void refreshAll();
    },
    [refreshAll, spaceId],
  );

  useLayoutEffect(() => {
    navigation.setOptions({
      title: summary?.name ?? t('accommodation.overview.title'),
      headerBackVisible: false,
      headerLeft: () => <HeaderBackButton />,
      headerRight: canManage
        ? () => (
            <HeaderMenuSlot>
              <BuilderRowLifecycleMenu
                spaceId={spaceId}
                buildingId={buildingId}
                entityType="building"
                entityId={buildingId}
                role={permissions.membershipRole}
                onEdit={() =>
                  navigation.navigate('BuildingForm', { spaceId, mode: 'edit', buildingId })
                }
                onDuplicate={() => setDuplicateBuildingVisible(true)}
                duplicateLabel={t('accommodation.duplicate.building.action')}
                onSuccess={handleLifecycleSuccess}
              />
            </HeaderMenuSlot>
          )
        : undefined,
    });
  }, [
    buildingId,
    canManage,
    handleLifecycleSuccess,
    i18n.language,
    navigation,
    permissions.membershipRole,
    spaceId,
    summary?.name,
    t,
  ]);

  useFocusEffect(
    useCallback(() => {
      void refreshAll();
    }, [refreshAll]),
  );

  const openFloorRooms = (floor: FloorListItemResponse) => {
    if (profile?.showUnitsOnFloor) {
      navigation.navigate('AccommodationFloorApartments', {
        spaceId,
        buildingId,
        buildingName: summary?.name,
        floorId: floor.floorId,
        floorName: floor.name,
      });
      return;
    }
    navigation.navigate('AccommodationRooms', {
      spaceId,
      buildingId,
      buildingName: summary?.name,
      parentType: 'floor',
      parentId: floor.floorId,
      parentName: floor.name,
      parentRoomCount: floor.roomCount,
      parentBedCount: floor.bedCount,
    });
  };

  const openUnit = (unit: UnitListItemResponse) => {
    if (isRental || !profile?.showRoomsUnderUnit) {
      navigation.navigate('UnitDetail', {
        spaceId,
        buildingId,
        buildingName: summary?.name,
        unitId: unit.unitId,
      });
      return;
    }

    navigation.navigate('AccommodationRooms', {
      spaceId,
      buildingId,
      buildingName: summary?.name,
      parentType: 'unit',
      parentId: unit.unitId,
      parentName: unit.name,
      parentRoomCount: unit.roomCount,
      parentBedCount: unit.bedCount,
    });
  };

  const showListLoading = useInventoryList
    ? bedsHook.loading && !refreshing && roomGroups.length === 0
    : listLoading && !refreshing && items.length === 0;
  const error = summaryError ?? (useInventoryList ? bedsHook.error : listError);
  const useUnitGrid = isLayout && !useInventoryList && profile?.showUnits;

  const listHeader = (
    <View style={styles.header}>
      {error ? (
        <View style={styles.errorBanner}>
          <Text style={styles.errorBannerText}>{error}</Text>
        </View>
      ) : null}

      <BuildingSummaryHeader
        summary={summary}
        profile={profile!}
        loading={summaryLoading && !summary}
        editableName={showFab}
        onSaveName={async name => {
          await renameBuildingName(
            spaceId,
            buildingId,
            name,
            summary
              ? { code: summary.code, layoutMode: summary.layoutMode }
              : undefined,
          );
          patchSummary({ name });
          showToast(t('accommodation.buildings.updateSuccess'));
        }}
      />

      <AccommodationContextTrail segments={trailSegments} onNavigate={onTrailNavigate} />

      <AccommodationViewModeToggle value={isLayout ? 'layout' : 'list'} onChange={setViewMode} />

      <AccommodationSearchBar
        value={searchQuery}
        onChangeText={setSearchQuery}
        placeholder={
          useInventoryList
            ? t('accommodation.builder.searchRooms', { defaultValue: 'Search rooms...' })
            : undefined
        }
      />

      {canManage && profile?.showUnits && (spaceType === 'CO_LIVING' || spaceType === 'RENTAL') ? (
        <DashboardActionRow
          icon={Grid2x2}
          accent="#EA580C"
          title={t('accommodation.bulk.units.action')}
          subtitle={t('accommodation.bulk.units.hint', {
            defaultValue: 'Add multiple units at once',
          })}
          onPress={() => setBulkUnitsVisible(true)}
        />
      ) : null}

      {canManage && profile?.showFloors ? (
        <DashboardActionRow
          icon={Copy}
          accent="#2563EB"
          title={t('accommodation.duplicate.building.action')}
          subtitle={t('accommodation.duplicate.building.hint', {
            name: summary?.name ?? '',
          })}
          onPress={() => setDuplicateBuildingVisible(true)}
        />
      ) : null}

      <DashboardSectionTitle
        title={
          useInventoryList
            ? t('accommodation.builder.allRooms', { defaultValue: 'All Rooms' })
            : profile?.showFloors
              ? t('accommodation.floors.title')
              : t('accommodation.units.title')
        }
        subtitle={
          useInventoryList
            ? t('accommodation.builder.inventorySubtitle')
            : t('accommodation.builder.listSubtitle')
        }
      />

      {showListLoading ? <SkeletonCard /> : null}
    </View>
  );

  const floorItems = items.filter(isFloorItem);
  const unitItems = items.filter((item): item is UnitListItemResponse => !isFloorItem(item));

  const renderFloorMenu = (floor: FloorListItemResponse) => {
    const inactive = !isAccommodationEntityActive(floor);
    const occupancyOptions =
      canManageOccupancyActions && !inactive
        ? hierarchyPicker.buildMenuOptions(
          {
            buildingId,
            buildingName: summary?.name ?? '',
            layoutMode: profile?.layoutMode,
            floorId: floor.floorId,
            floorName: floor.name,
          },
          () => openFloorRooms(floor),
        )
      : [];

    if (!canManage && occupancyOptions.length === 0) {
      return undefined;
    }

    return (
      <BuilderRowLifecycleMenu
        spaceId={spaceId}
        buildingId={buildingId}
        entityType="floor"
        entityId={floor.floorId}
        role={permissions.membershipRole}
        isInactive={inactive}
        prependOptions={occupancyOptions}
        forceShowTrigger={occupancyOptions.length > 0}
        onEdit={() =>
          navigation.navigate('FloorForm', {
            spaceId,
            buildingId,
            mode: 'edit',
            floorId: floor.floorId,
          })
        }
        onDuplicate={() => setDuplicateFloorTarget(floor)}
        duplicateLabel={t('accommodation.duplicate.floor.action')}
        onSuccess={(action, entityType) => {
          applyAccommodationInactiveLifecycle(
            action,
            'floor',
            floorsHook.inactiveScopeKey ?? '',
            floor.floorId,
            floor,
            {
              patch: patch => floorsHook.patchFloor(floor.floorId, patch),
              remove: () => floorsHook.removeFloor(floor.floorId),
            },
          );
          handleLifecycleSuccess(action, entityType);
        }}
      />
    );
  };

  const renderUnitMenu = (unit: UnitListItemResponse) => {
    const inactive = !isAccommodationEntityActive(unit);
    const occupancyOptions =
      canManageOccupancyActions && !inactive
        ? hierarchyPicker.buildMenuOptions(
          {
            buildingId,
            buildingName: summary?.name ?? '',
            layoutMode: profile?.layoutMode,
            unitId: unit.unitId,
            unitName: unit.name,
          },
          () => openUnit(unit),
        )
      : [];

    if (!canManage && occupancyOptions.length === 0) {
      return undefined;
    }

    return (
      <BuilderRowLifecycleMenu
        spaceId={spaceId}
        buildingId={buildingId}
        entityType="unit"
        entityId={unit.unitId}
        role={permissions.membershipRole}
        isInactive={inactive}
        prependOptions={occupancyOptions}
        forceShowTrigger={occupancyOptions.length > 0}
        onEdit={() =>
          navigation.navigate('UnitForm', {
            spaceId,
            buildingId,
            mode: 'edit',
            unitId: unit.unitId,
          })
        }
        onSuccess={(action, entityType) => {
          applyAccommodationInactiveLifecycle(
            action,
            'unit',
            unitsHook.inactiveScopeKey ?? '',
            unit.unitId,
            unit,
            {
              patch: patch => unitsHook.patchUnit(unit.unitId, patch),
              remove: () => unitsHook.removeUnit(unit.unitId),
            },
          );
          handleLifecycleSuccess(action, entityType);
        }}
      />
    );
  };

  const layoutVisual =
    !useInventoryList && isLayout && !showListLoading && floorItems.length > 0 ? (
      <BuildingElevationLayout
        buildingName={summary?.name}
        buildingSummary={summary}
        floors={floorItems}
        layoutMode={profile?.layoutMode}
        searchQuery={searchQuery}
        onFloorPress={openFloorRooms}
        renderFloorMenu={renderFloorMenu}
      />
    ) : !useInventoryList && isLayout && !showListLoading && unitItems.length > 0 ? (
      <BuildingUnitElevation
        buildingName={summary?.name}
        buildingSummary={summary}
        units={unitItems}
        layoutMode={profile?.layoutMode}
        searchQuery={searchQuery}
        onUnitPress={openUnit}
        renderUnitMenu={renderUnitMenu}
      />
    ) : null;

  const hasLayoutContent =
    !useInventoryList &&
    isLayout &&
    !showListLoading &&
    (floorItems.length > 0 || unitItems.length > 0);

  const listEmpty =
    hasLayoutContent ? null : !showListLoading && !error ? (
      <EmptyState
        title={
          useInventoryList
            ? t('accommodation.rooms.emptyTitle', { defaultValue: 'No rooms yet' })
            : profile?.showFloors
              ? t('accommodation.floors.emptyTitle')
              : t('accommodation.units.emptyTitle')
        }
        description={
          useInventoryList
            ? t('accommodation.rooms.emptyDescription', {
                defaultValue: 'Add floors and rooms to see beds here.',
              })
            : profile?.showFloors
              ? t('accommodation.floors.emptyDescription')
              : t('accommodation.units.emptyDescription')
        }
        Icon={useInventoryList ? Layers : profile?.showFloors ? Layers : Grid2x2}
      />
    ) : null;

  const openBedDetail = (bed: BedSpaceListItemResponse) => {
    navigation.navigate('BedDetail', {
      spaceId,
      buildingId: bed.buildingId,
      roomId: bed.roomId,
      bedId: bed.bedId,
      buildingName: bed.buildingName,
      parentName: bed.unitName ?? bed.floorName ?? undefined,
      parentType: bed.unitId ? 'unit' : 'floor',
      floorId: bed.floorId ?? undefined,
      unitId: bed.unitId ?? undefined,
      roomName: bed.roomName,
      bedLabel: bed.label,
    });
  };

  const renderRoomMenu = (group: BedRoomGroup) => {
    if (!canManage) {
      return undefined;
    }
    const prependOptions: MenuOption[] = [
      {
        label: t('accommodation.builder.editBuilding', { defaultValue: 'Edit building' }),
        action: () =>
          navigation.navigate('BuildingForm', {
            spaceId,
            buildingId,
            mode: 'edit',
          }),
      },
    ];
    if (group.floorId) {
      prependOptions.push({
        label: t('accommodation.builder.editFloor', { defaultValue: 'Edit floor' }),
        action: () =>
          navigation.navigate('FloorForm', {
            spaceId,
            buildingId,
            mode: 'edit',
            floorId: group.floorId!,
          }),
      });
    }
    if (group.unitId) {
      prependOptions.push({
        label: t('accommodation.builder.editUnit', { defaultValue: 'Edit unit' }),
        action: () =>
          navigation.navigate('UnitForm', {
            spaceId,
            buildingId,
            mode: 'edit',
            unitId: group.unitId!,
          }),
      });
    }
    prependOptions.push({
      label: t('accommodation.builder.editRoom', { defaultValue: 'Edit room' }),
      action: () =>
        navigation.navigate('RoomForm', {
          spaceId,
          buildingId,
          parentType: group.unitId ? 'unit' : 'floor',
          parentId: (group.unitId ?? group.floorId) as string,
          mode: 'edit',
          roomId: group.roomId,
        }),
    });

    return (
      <BuilderRowLifecycleMenu
        spaceId={spaceId}
        buildingId={buildingId}
        entityType="room"
        entityId={group.roomId}
        role={permissions.membershipRole}
        prependOptions={prependOptions}
        hierarchyOnly
        triggerVariant="pencil"
        forceShowTrigger
        onEdit={() =>
          navigation.navigate('RoomForm', {
            spaceId,
            buildingId,
            parentType: group.unitId ? 'unit' : 'floor',
            parentId: (group.unitId ?? group.floorId) as string,
            mode: 'edit',
            roomId: group.roomId,
          })
        }
        onSuccess={() => {
          void refreshAll();
        }}
      />
    );
  };

  const renderBedMenu = (bed: BedSpaceListItemResponse) => {
    if (!canManage) {
      return undefined;
    }
    return (
      <Pressable
        onPress={() =>
          navigation.navigate('BedForm', {
            spaceId,
            buildingId,
            roomId: bed.roomId,
            bedId: bed.bedId,
            mode: 'edit',
          })
        }
        hitSlop={8}
        style={({ pressed }) => [styles.bedEditBtn, pressed && styles.bedEditBtnPressed]}
        accessibilityRole="button"
        accessibilityLabel={t('accommodation.builder.editBed', { defaultValue: 'Edit bed' })}>
        <Pencil size={16} color={colors.info} strokeWidth={2.4} />
      </Pressable>
    );
  };

  const renderInventoryItem = ({ item }: { item: BedRoomGroup }) => (
    <BuildingInventoryRoomSection
      group={item}
      pathSegments={roomGroupPathSegments(item, {
        includeBuilding: true,
        includeUnit: Boolean(profile?.showUnits || profile?.showUnitsOnFloor),
      })}
      pricingEditable={canManage}
      showAddBed={canManage}
      menu={renderRoomMenu(item)}
      renderBedMenu={renderBedMenu}
      onRoomPress={() =>
        navigation.navigate('AccommodationBeds', {
          spaceId,
          buildingId,
          roomId: item.roomId,
          roomName: item.roomName,
          buildingName: item.buildingName,
          parentName: item.unitName ?? item.floorName ?? undefined,
          parentType: item.unitId ? 'unit' : 'floor',
          floorId: item.floorId ?? undefined,
          unitId: item.unitId ?? undefined,
        })
      }
      onBedPress={openBedDetail}
      onAddBed={() =>
        navigation.navigate('BedForm', {
          spaceId,
          buildingId,
          roomId: item.roomId,
          mode: 'create',
        })
      }
      onCommitPricing={async (bed, field, value) => {
        await updateBedPricingField(spaceId, bed.roomId, bed.bedId, field, value);
        await bedsHook.refresh();
      }}
    />
  );

  const renderItem = ({ item }: { item: ListItem }) => {
    if (isFloorItem(item)) {
      const floorMenu = renderFloorMenu(item);
      return (
        <AccommodationEntityRow
          title={item.name}
          subtitle={t('accommodation.listItem.floor', {
            roomCount: item.roomCount,
            bedCount: item.bedCount,
          })}
          hierarchyLevel="floor"
          editableName={showFab}
          onSaveName={async name => {
            await renameFloorName(spaceId, buildingId, item.floorId, name);
            floorsHook.patchFloor(item.floorId, { name });
            showToast(t('accommodation.floors.updateSuccess'));
          }}
          active={item.active}
          onPress={() => openFloorRooms(item)}
          menu={floorMenu}
        />
      );
    }

    const unit = item as UnitListItemResponse;
    const unitMenu = renderUnitMenu(unit);

    return (
      <AccommodationEntityRow
        title={unit.name}
        subtitle={
          isRental
            ? t(`accommodation.status.${unit.status}`)
            : t('accommodation.listItem.unit', {
                roomCount: unit.roomCount,
                bedCount: unit.bedCount,
              })
        }
        hierarchyLevel="unit"
        badge={isRental && isAccommodationEntityActive(unit) ? <AccommodationStatusBadge status={unit.status} /> : undefined}
        editableName={showFab}
        onSaveName={async name => {
          await renameUnitName(spaceId, buildingId, unit.unitId, name);
          unitsHook.patchUnit(unit.unitId, { name });
          showToast(t('accommodation.units.updateSuccess'));
        }}
        active={unit.active}
        onPress={() => openUnit(unit)}
        menu={unitMenu}
      />
    );
  };

  if (!profile || !spaceType) {
    return (
      <View style={styles.centered}>
        <Text style={styles.errorText}>{t('accommodation.builder.notApplicable')}</Text>
      </View>
    );
  }

  return (
    <RequireAccommodationAccess spaceId={spaceId}>
    <View style={styles.root}>
      <FlatList
        ref={listRef}
        data={
          showListLoading || (!useInventoryList && isLayout)
            ? []
            : useInventoryList
              ? roomGroups
              : items
        }
        key={
          useInventoryList
            ? 'building-inventory-rooms'
            : isLayout
              ? 'accommodation-layout'
              : useUnitGrid
                ? 'unit-grid'
                : 'accommodation-list'
        }
        numColumns={!useInventoryList && !isLayout && useUnitGrid ? UNIT_GRID_NUM_COLUMNS : 1}
        columnWrapperStyle={
          !useInventoryList && !isLayout && useUnitGrid ? styles.unitGridRow : undefined
        }
        keyExtractor={item =>
          useInventoryList
            ? (item as BedRoomGroup).key
            : isFloorItem(item as ListItem)
              ? (item as FloorListItemResponse).floorId
              : (item as UnitListItemResponse).unitId
        }
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />
        }
        ListHeaderComponent={
          <>
            {listHeader}
            {layoutVisual}
          </>
        }
        ListEmptyComponent={listEmpty}
        ListFooterComponent={
          <AccommodationListFooter
            loadingMore={useInventoryList ? bedsHook.loadingMore : loadingMore}
          />
        }
        onEndReached={() => {
          if (useInventoryList) {
            return;
          }
          if (hasMore) {
            void loadMore();
          }
        }}
        onEndReachedThreshold={0.3}
        renderItem={
          useInventoryList
            ? (renderInventoryItem as never)
            : (renderItem as never)
        }
      />

      {showFab ? (
        <FAB
          onPress={() => {
            if (profile.showFloors) {
              navigation.navigate('FloorForm', { spaceId, buildingId, mode: 'create' });
            } else {
              navigation.navigate('UnitForm', { spaceId, buildingId, mode: 'create' });
            }
          }}
          accessibilityLabel={
            profile.showFloors
              ? t('accommodation.floors.addFab')
              : t('accommodation.units.addFab')
          }
        />
      ) : null}

      <DuplicateBuildingModal
        visible={duplicateBuildingVisible}
        sourceName={summary?.name ?? ''}
        loading={duplicateBuildingHook.loading}
        error={duplicateBuildingHook.error}
        onClose={() => {
          setDuplicateBuildingVisible(false);
          duplicateBuildingHook.setError(null);
        }}
        onSubmit={async (targetName, targetCode) => {
          const result = await duplicateBuildingHook.duplicate(spaceId, buildingId, {
            targetBuildingName: targetName,
            targetBuildingCode: targetCode,
          });
          if (!result) {
            return;
          }
          setDuplicateBuildingVisible(false);
          showToast(t('accommodation.duplicate.building.success'));
          navigation.replace('AccommodationBuilder', {
            spaceId,
            buildingId: result.buildingId,
          });
        }}
      />

      <DuplicateFloorModal
        visible={!!duplicateFloorTarget}
        sourceName={duplicateFloorTarget?.name ?? ''}
        loading={duplicateFloorHook.loading}
        error={duplicateFloorHook.error}
        onClose={() => {
          setDuplicateFloorTarget(null);
          duplicateFloorHook.setError(null);
        }}
        onSubmit={async (targetFloorNumber, targetName, renumberRooms = true) => {
          if (!duplicateFloorTarget) {
            return;
          }
          const result = await duplicateFloorHook.duplicate(
            spaceId,
            buildingId,
            duplicateFloorTarget.floorId,
            { targetFloorNumber, targetName, renumberRooms },
          );
          if (!result) {
            return;
          }
          setDuplicateFloorTarget(null);
          showToast(t('accommodation.duplicate.floor.success'));
          invalidateAccommodationQueries();
          void refreshAll();
        }}
      />

      <BulkUnitsModal
        visible={bulkUnitsVisible}
        loading={bulkUnitsHook.loading}
        error={bulkUnitsHook.error}
        onClose={() => {
          setBulkUnitsVisible(false);
          bulkUnitsHook.setError(null);
        }}
        onSubmit={async (count, startUnitNumber, defaultStatus) => {
          const result = await bulkUnitsHook.bulkCreate(spaceId, buildingId, {
            count,
            startUnitNumber,
            defaultStatus,
          });
          if (!result) {
            return;
          }
          setBulkUnitsVisible(false);
          showToast(t('accommodation.bulk.units.success', { count: result.unitsCreated }));
          invalidateAccommodationQueries();
          void refreshAll();
        }}
      />
      {hierarchyPicker.pickerModal}
    </View>
    </RequireAccommodationAccess>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    padding: spacing.lg,
    paddingBottom: 96,
    flexGrow: 1,
  },
  header: {
    marginBottom: spacing.md,
    gap: spacing.sm,
  },
  buildingLayoutTitle: {
    ...typography.bodyStrong,
    textAlign: 'center',
    marginBottom: spacing.md,
  },
  floorStackContainer: {
    borderWidth: 2,
    borderColor: colors.border,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: colors.white,
  },
  unitGridRow: {
    gap: spacing.sm,
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xl,
  },
  errorBanner: {
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FECACA',
    borderRadius: 14,
    padding: spacing.md,
    marginBottom: spacing.sm,
  },
  errorBannerText: {
    ...typography.body,
    fontSize: 14,
    color: '#DC2626',
  },
  errorText: {
    ...typography.body,
    color: '#DC2626',
    marginBottom: spacing.lg,
  },
  bedEditBtn: {
    width: 32,
    height: 32,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#EFF6FF',
    borderWidth: 1,
    borderColor: '#BFDBFE',
  },
  bedEditBtnPressed: {
    opacity: 0.85,
  },
});
