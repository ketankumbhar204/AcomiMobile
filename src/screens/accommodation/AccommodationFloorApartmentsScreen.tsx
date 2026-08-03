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
import { Grid2x2 } from 'lucide-react-native';
import type { UnitListItemResponse } from '../../api/types';
import {
  AccommodationContextTrail,
  AccommodationEntityRow,
  AccommodationListFooter,
  AccommodationSearchBar,
  AccommodationStatusBadge,
  AccommodationViewModeToggle,
  ApartmentFloorPlanLayout,
  AccommodationMetadataCard,
  BuilderRowLifecycleMenu,
} from '../../components/accommodation';
import { EmptyState, FAB, HeaderBackButton, RequireAccommodationAccess, SkeletonCard } from '../../components/ui';
import { useHierarchyOccupancyPicker } from '../../hooks/useHierarchyOccupancyPicker';
import { useAccommodationUiProfile } from '../../hooks/useAccommodationUiProfile';
import { useAccommodationViewMode } from '../../hooks/useAccommodationViewMode';
import { useAccommodationSearchScroll } from '../../hooks/useAccommodationSearchScroll';
import { useActiveSpaceId } from '../../hooks/useActiveSpaceId';
import { useSpacePermissions } from '../../hooks/useSpacePermissions';
import { useUnitsByFloor } from '../../hooks/useUnitsByFloor';
import type { MainStackParamList } from '../../navigation/types';
import { colors, spacing, typography } from '../../theme';
import { formatFloorHeaderTitle } from '../../utils/accommodationLabels';
import {
  buildAccommodationTrail,
  type AccommodationTrailLevel,
} from '../../utils/accommodationContext';
import {
  accommodationTrailContextFromParent,
  navigateToAccommodationTrailSegment,
} from '../../utils/accommodationNavigation';
import { renameUnitName } from '../../utils/accommodationInlineRename';
import { useToastStore } from '../../store/toastStore';

type Nav = NativeStackNavigationProp<MainStackParamList, 'AccommodationFloorApartments'>;
type Route = NativeStackScreenProps<MainStackParamList, 'AccommodationFloorApartments'>['route'];

export function AccommodationFloorApartmentsScreen() {
  const { t, i18n } = useTranslation();
  const navigation = useNavigation<Nav>();
  const route = useRoute<Route>();
  const { buildingId, buildingName, floorId, floorName } = route.params;
  const spaceId = useActiveSpaceId(route.params.spaceId);

  const permissions = useSpacePermissions(spaceId);
  const spaceType = permissions.spaceType;
  const showFab = permissions.canManageAccommodation;
  const canManage = permissions.canManageAccommodation;
  const canManageOccupancyActions = permissions.canManageOccupancy;
  const showToast = useToastStore(state => state.showToast);
  const hierarchyPicker = useHierarchyOccupancyPicker(spaceId, spaceType);

  const { profile } = useAccommodationUiProfile(spaceId, spaceType, buildingId);

  const { isLayout, setViewMode } = useAccommodationViewMode();

  const [searchQuery, setSearchQuery] = useState('');
  const [refreshing, setRefreshing] = useState(false);

  const {
    units,
    loading,
    loadingMore,
    error,
    hasMore,
    refresh,
    loadMore,
    patchUnit,
  } = useUnitsByFloor(spaceId, buildingId, floorId, { searchQuery });

  const listRef = useAccommodationSearchScroll(
    units,
    searchQuery,
    useCallback((unit: UnitListItemResponse) => unit.name, []),
  );

  const trailContext = useMemo(
    () =>
      accommodationTrailContextFromParent(
        { spaceId, buildingId, buildingName },
        'floor',
        floorId,
        floorName,
      ),
    [buildingId, buildingName, floorId, floorName, spaceId],
  );

  const trailSegments = useMemo(
    () => buildAccommodationTrail(trailContext, 'floor'),
    [trailContext],
  );

  useLayoutEffect(() => {
    navigation.setOptions({
      title: formatFloorHeaderTitle(buildingName, floorName ?? t('accommodation.apartments.onFloor')),
      headerBackVisible: false,
      headerLeft: () => <HeaderBackButton />,
    });
  }, [buildingName, floorName, i18n.language, navigation, t]);

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

  const onTrailNavigate = useCallback(
    (level: AccommodationTrailLevel) => {
      navigateToAccommodationTrailSegment(navigation, trailContext, level);
    },
    [navigation, trailContext],
  );

  const openUnitRooms = (unit: UnitListItemResponse) => {
    navigation.navigate('AccommodationRooms', {
      spaceId,
      buildingId,
      buildingName,
      parentType: 'unit',
      parentId: unit.unitId,
      parentName: unit.name,
      parentRoomCount: unit.roomCount,
      parentBedCount: unit.bedCount,
    });
  };

  const renderUnitMenu = (item: UnitListItemResponse) => {
    const occupancyOptions = canManageOccupancyActions
      ? hierarchyPicker.buildMenuOptions(
          {
            buildingId,
            buildingName: buildingName ?? '',
            layoutMode: profile?.layoutMode,
            floorId,
            floorName: floorName ?? '',
            unitId: item.unitId,
            unitName: item.name,
          },
          () => openUnitRooms(item),
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
        entityId={item.unitId}
        role={permissions.membershipRole}
        prependOptions={occupancyOptions}
        forceShowTrigger={occupancyOptions.length > 0}
        onEdit={() =>
          navigation.navigate('UnitForm', {
            spaceId,
            buildingId,
            floorId,
            mode: 'edit',
            unitId: item.unitId,
          })
        }
        onSuccess={() => {
          void refresh();
        }}
      />
    );
  };

  const renderItem = ({ item }: { item: UnitListItemResponse }) => (
    <AccommodationEntityRow
      title={item.name}
      subtitle={t('accommodation.listItem.unit', {
        roomCount: item.roomCount,
        bedCount: item.bedCount,
      })}
      hierarchyLevel="unit"
      badge={<AccommodationStatusBadge status={item.status} />}
      editableName={canManage}
      onSaveName={async name => {
        await renameUnitName(spaceId, buildingId, item.unitId, name);
        patchUnit(item.unitId, { name });
        showToast(t('accommodation.units.updateSuccess'));
      }}
      onPress={() => openUnitRooms(item)}
      menu={renderUnitMenu(item)}
    />
  );

  const showLoading = loading && !refreshing && units.length === 0;

  const layoutVisual =
    isLayout && !showLoading && units.length > 0 ? (
      <ApartmentFloorPlanLayout
        floorName={floorName}
        units={units}
        searchQuery={searchQuery}
        onUnitPress={openUnitRooms}
        renderUnitMenu={renderUnitMenu}
      />
    ) : null;

  const listHeader = (
    <View style={styles.header}>
      {error ? <Text style={styles.errorText}>{error}</Text> : null}

      <AccommodationContextTrail segments={trailSegments} onNavigate={onTrailNavigate} />

      <AccommodationMetadataCard title={floorName ?? t('accommodation.floors.title')} />

      <AccommodationViewModeToggle value={isLayout ? 'layout' : 'list'} onChange={setViewMode} />

      {!isLayout ? (
        <>
          <Text style={styles.sectionLabel}>{t('accommodation.apartments.onFloor')}</Text>
          <Text style={styles.sectionCount}>
            {t('accommodation.apartments.count', { count: units.length })}
          </Text>
        </>
      ) : null}

      <AccommodationSearchBar value={searchQuery} onChangeText={setSearchQuery} />
      {showLoading ? <SkeletonCard /> : null}
    </View>
  );

  return (
    <RequireAccommodationAccess spaceId={spaceId}>
    <View style={styles.container}>
      <FlatList
        ref={listRef}
        data={showLoading || isLayout ? [] : units}
        key={isLayout ? 'floor-plan' : 'unit-list'}
        keyExtractor={item => item.unitId}
        renderItem={renderItem}
        ListHeaderComponent={
          <>
            {listHeader}
            {layoutVisual}
          </>
        }
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={() => void onRefresh()} />
        }
        onEndReached={() => {
          if (hasMore && !loadingMore) {
            void loadMore();
          }
        }}
        onEndReachedThreshold={0.3}
        ListEmptyComponent={
          isLayout && layoutVisual
            ? null
            : !showLoading && !error ? (
            <EmptyState
              title={t('accommodation.apartments.emptyTitle')}
              description={t('accommodation.apartments.emptyMessage')}
              Icon={Grid2x2}
            />
          ) : null
        }
        ListFooterComponent={<AccommodationListFooter loadingMore={loadingMore} />}
        contentContainerStyle={styles.listContent}
      />

      {showFab ? (
        <FAB
          onPress={() =>
            navigation.navigate('UnitForm', {
              spaceId,
              buildingId,
              floorId,
              mode: 'create',
            })
          }
          accessibilityLabel={t('accommodation.units.addFab')}
        />
      ) : null}
      {hierarchyPicker.pickerModal}
    </View>
    </RequireAccommodationAccess>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  listContent: {
    padding: spacing.xl,
    paddingBottom: 96,
    flexGrow: 1,
  },
  header: {
    marginBottom: spacing.md,
  },
  sectionLabel: {
    ...typography.bodyStrong,
    marginBottom: spacing.xs,
  },
  sectionCount: {
    ...typography.caption,
    color: colors.muted,
    marginBottom: spacing.lg,
  },
  errorText: {
    ...typography.body,
    color: '#DC2626',
    marginBottom: spacing.lg,
  },
  unitGridRow: {
    gap: spacing.sm,
  },
});
