import React, { useCallback, useLayoutEffect, useState } from 'react';
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
  AccommodationEntityRow,
  AccommodationListFooter,
  AccommodationSearchBar,
  AccommodationStatusBadge,
  BuildingSummaryHeader,
  BuilderRowLifecycleMenu,
  BulkUnitsModal,
  DuplicateBuildingModal,
  DuplicateFloorModal,
  HeaderMenuSlot,
} from '../../components/accommodation';
import { Button, EmptyState, FAB, HeaderBackButton, RequireAccommodationAccess, SkeletonCard } from '../../components/ui';
import { useActiveSpaceId } from '../../hooks/useActiveSpaceId';
import { useAccommodationUiProfile } from '../../hooks/useAccommodationUiProfile';
import { useSpacePermissions } from '../../hooks/useSpacePermissions';
import { useBulkUnits } from '../../hooks/useBulkUnits';
import { useDuplicateBuilding } from '../../hooks/useDuplicateBuilding';
import { useDuplicateFloor } from '../../hooks/useDuplicateFloor';
import { useFloors } from '../../hooks/useFloors';
import { useUnits } from '../../hooks/useUnits';
import type { MainStackParamList } from '../../navigation/types';
import { useToastStore } from '../../store/toastStore';
import { colors, spacing, typography } from '../../theme';
import { formatFloorHeaderTitle } from '../../utils/accommodationLabels';
import { invalidateAccommodationQueries } from '../../utils/accommodationQueryCache';
import {
  renameBuildingName,
  renameFloorName,
  renameUnitName,
} from '../../utils/accommodationInlineRename';

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
  } = useAccommodationUiProfile(spaceId, spaceType, buildingId);
  const canManage = permissions.canManageAccommodation;
  const showFab = permissions.canManageAccommodation;
  const isRental = profile?.layoutMode === 'RENTAL';

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
      void refreshAll();
      if (action === 'delete' && entityType === 'building') {
        navigation.goBack();
      }
    },
    [navigation, refreshAll],
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

  const listHeader = (
    <View style={styles.header}>
      {error ? <Text style={styles.errorText}>{error}</Text> : null}

      <BuildingSummaryHeader
        summary={summary}
        profile={profile!}
        loading={summaryLoading && !summary}
        editableName={showFab}
        onSaveName={async name => {
          await renameBuildingName(spaceId, buildingId, name);
          showToast(t('accommodation.buildings.updateSuccess'));
          await refreshAll();
        }}
      />

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

  const listEmpty =
    !showListLoading && !error ? (
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
            showToast(t('accommodation.floors.updateSuccess'));
            await refreshAll();
          }}
          onPress={() => openFloorRooms(item)}
          menu={
            canManage ? (
              <BuilderRowLifecycleMenu
                spaceId={spaceId}
                buildingId={buildingId}
                entityType="floor"
                entityId={item.floorId}
                role={permissions.membershipRole}
                onEdit={() =>
                  navigation.navigate('FloorForm', {
                    spaceId,
                    buildingId,
                    mode: 'edit',
                    floorId: item.floorId,
                  })
                }
                onDuplicate={() => setDuplicateFloorTarget(item)}
                duplicateLabel={t('accommodation.duplicate.floor.action')}
                onSuccess={handleLifecycleSuccess}
              />
            ) : undefined
          }
        />
      );
    }

    const unit = item as UnitListItemResponse;
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
        badge={isRental ? <AccommodationStatusBadge status={unit.status} /> : undefined}
        editableName={showFab}
        onSaveName={async name => {
          await renameUnitName(spaceId, buildingId, unit.unitId, name);
          showToast(t('accommodation.units.updateSuccess'));
          await refreshAll();
        }}
        onPress={() => openUnit(unit)}
        menu={
          canManage ? (
            <BuilderRowLifecycleMenu
              spaceId={spaceId}
              buildingId={buildingId}
              entityType="unit"
              entityId={unit.unitId}
              role={permissions.membershipRole}
              onEdit={() =>
                navigation.navigate('UnitForm', {
                  spaceId,
                  buildingId,
                  mode: 'edit',
                  unitId: unit.unitId,
                })
              }
              onSuccess={handleLifecycleSuccess}
            />
          ) : undefined
        }
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
        data={showListLoading ? [] : items}
        keyExtractor={item =>
          isFloorItem(item) ? item.floorId : (item as UnitListItemResponse).unitId
        }
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
