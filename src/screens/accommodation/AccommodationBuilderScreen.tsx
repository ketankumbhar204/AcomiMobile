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
import type {
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
  BuildingSummaryHeader,
  BuildingUnitElevation,
  BuilderRowLifecycleMenu,
  BulkUnitsModal,
  DuplicateBuildingModal,
  DuplicateFloorModal,
  HeaderMenuSlot,
  UNIT_GRID_NUM_COLUMNS,
} from '../../components/accommodation';
import { Button, EmptyState, FAB, HeaderBackButton, RequireAccommodationAccess, SkeletonCard } from '../../components/ui';
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
} from '../../utils/accommodationInlineRename';
import { isAccommodationEntityActive } from '../../utils/accommodationEntityActive';
import { applyAccommodationInactiveLifecycle } from '../../utils/accommodationInactiveLifecycle';

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

  const { isLayout, isList, setViewMode } = useAccommodationViewMode();

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

  const refreshAll = useCallback(async () => {
    await Promise.all([refreshSummary(), refreshList()]);
  }, [refreshList, refreshSummary]);

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

  const showListLoading = listLoading && !refreshing && items.length === 0;
  const error = summaryError ?? listError;
  const useUnitGrid = isLayout && profile?.showUnits;
  const useFloorStack = isLayout && profile?.showFloors;

  const listHeader = (
    <View style={styles.header}>
      {error ? <Text style={styles.errorText}>{error}</Text> : null}

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

      {canManage && profile?.showUnits && (spaceType === 'CO_LIVING' || spaceType === 'RENTAL') ? (
        <Button
          label={t('accommodation.bulk.units.action')}
          variant="secondary"
          onPress={() => setBulkUnitsVisible(true)}
          style={styles.secondaryAction}
        />
      ) : null}

      {canManage && profile?.showFloors ? (
        <Button
          label={t('accommodation.duplicate.building.action')}
          variant="secondary"
          onPress={() => setDuplicateBuildingVisible(true)}
          style={styles.secondaryAction}
        />
      ) : null}

      <AccommodationSearchBar value={searchQuery} onChangeText={setSearchQuery} />

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
    isLayout && !showListLoading && floorItems.length > 0 ? (
      <BuildingElevationLayout
        buildingName={summary?.name}
        buildingSummary={summary}
        floors={floorItems}
        layoutMode={profile?.layoutMode}
        searchQuery={searchQuery}
        onFloorPress={openFloorRooms}
        renderFloorMenu={renderFloorMenu}
      />
    ) : isLayout && !showListLoading && unitItems.length > 0 ? (
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
    isLayout &&
    !showListLoading &&
    (floorItems.length > 0 || unitItems.length > 0);

  const listEmpty =
    hasLayoutContent ? null : !showListLoading && !error ? (
      <EmptyState
        title={
          profile?.showFloors
            ? t('accommodation.floors.emptyTitle')
            : t('accommodation.units.emptyTitle')
        }
        description={
          profile?.showFloors
            ? t('accommodation.floors.emptyDescription')
            : t('accommodation.units.emptyDescription')
        }
        icon={profile?.showFloors ? '🏗️' : '🚪'}
      />
    ) : null;

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
          iconLabel={item.name.charAt(0).toUpperCase()}
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
        iconLabel={unit.name.charAt(0).toUpperCase()}
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
        data={showListLoading || isLayout ? [] : items}
        key={isLayout ? 'accommodation-layout' : useUnitGrid ? 'unit-grid' : 'accommodation-list'}
        numColumns={!isLayout && useUnitGrid ? UNIT_GRID_NUM_COLUMNS : 1}
        columnWrapperStyle={!isLayout && useUnitGrid ? styles.unitGridRow : undefined}
        keyExtractor={item =>
          isFloorItem(item) ? item.floorId : (item as UnitListItemResponse).unitId
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
        ListFooterComponent={<AccommodationListFooter loadingMore={loadingMore} />}
        onEndReached={() => {
          if (hasMore) {
            void loadMore();
          }
        }}
        onEndReachedThreshold={0.3}
        renderItem={renderItem}
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
    padding: spacing.xl,
    paddingBottom: 96,
    flexGrow: 1,
  },
  header: {
    marginBottom: spacing.md,
  },
  secondaryAction: {
    marginBottom: spacing.md,
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
  errorText: {
    ...typography.body,
    color: '#DC2626',
    marginBottom: spacing.lg,
  },
});
