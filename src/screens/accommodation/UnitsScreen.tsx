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
import { Grid2x2 } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import type { UnitListItemResponse } from '../../api/types';
import {
  AccommodationListFooter,
  AccommodationSearchBar,
  InventoryListingCard,
  PersistedUnitInteractionHost,
} from '../../components/accommodation';
import { DashboardSectionTitle } from '../../components/dashboard/DashboardSectionTitle';
import {
  AccommodationOccupancyFlowModals,
  AccommodationOccupancyQuickActions,
} from '../../components/occupancy';
import { EmptyState, FAB, HeaderBackButton, RequireAccommodationAccess, SkeletonCard } from '../../components/ui';
import { useAccommodationOccupancyFlow } from '../../hooks/useAccommodationOccupancyFlow';
import { useActiveSpaceId } from '../../hooks/useActiveSpaceId';
import { useSpacePermissions } from '../../hooks/useSpacePermissions';
import { useUnits } from '../../hooks/useUnits';
import type { MainStackParamList } from '../../navigation/types';
import { colors, radius, spacing, typography } from '../../theme';
import { isAccommodationEntityActive } from '../../utils/accommodationEntityActive';
import { buildUnitOccupancyTarget, isOccupancyTargetSupported } from '../../utils/buildOccupancyTarget';
import { occupancyPercentFromStatus } from '../../components/accommodation/layout/cards/occupancyUtils';
import { useAccommodationUiProfile } from '../../hooks/useAccommodationUiProfile';
import { usePersistedUnitInteraction } from '../../hooks/usePersistedUnitInteraction';
import { devLog } from '../../utils/devLog';

type UnitsNav = NativeStackNavigationProp<MainStackParamList, 'Units'>;
type UnitsRoute = NativeStackScreenProps<MainStackParamList, 'Units'>['route'];

export function UnitsScreen() {
  const { t, i18n } = useTranslation();
  const navigation = useNavigation<UnitsNav>();
  const route = useRoute<UnitsRoute>();
  const { buildingId, buildingName } = route.params;
  const spaceId = useActiveSpaceId(route.params.spaceId);

  const permissions = useSpacePermissions(spaceId);
  const spaceType = permissions.spaceType;
  const { profile } = useAccommodationUiProfile(spaceId, spaceType, buildingId);
  const isRental = profile?.layoutMode === 'RENTAL';
  const showFab = permissions.canManageAccommodation;
  const canManage = permissions.canManageAccommodation;
  const canManageOccupancyActions = permissions.canManageOccupancy;
  const supportsUnitOccupancy = Boolean(
    spaceType && isOccupancyTargetSupported(spaceType, 'UNIT'),
  );
  const [searchQuery, setSearchQuery] = useState('');
  const [refreshing, setRefreshing] = useState(false);

  const { units, loading, loadingMore, error, hasMore, refresh, loadMore } = useUnits(
    spaceId,
    buildingId,
    { searchQuery },
  );

  const unitInteraction = usePersistedUnitInteraction({
    spaceId,
    buildingId,
    buildingName: buildingName ?? '',
    spaceType,
    canEditStructure: canManage,
    canManageOccupancy: canManageOccupancyActions,
    onSuccess: () => {
      void refresh();
    },
  });

  const occupancyFlow = useAccommodationOccupancyFlow({
    spaceId,
    spaceType: spaceType ?? 'RENTAL',
    canManage: canManageOccupancyActions,
    onSuccess: () => {
      void refresh();
    },
  });

  const buildUnitContext = useCallback(
    (unit: UnitListItemResponse) => ({
      target: buildUnitOccupancyTarget({
        buildingId,
        buildingName: buildingName ?? '',
        unitId: unit.unitId,
        unitName: unit.name,
      }),
      accommodationStatus: unit.status,
      occupancy: null,
    }),
    [buildingId, buildingName],
  );

  useLayoutEffect(() => {
    navigation.setOptions({
      title: buildingName ?? t('accommodation.units.title'),
      headerBackVisible: false,
      headerLeft: () => <HeaderBackButton />,
    });
  }, [buildingName, navigation, t, i18n.language]);

  useFocusEffect(
    useCallback(() => {
      devLog('[UnitsScreen] focused', { spaceId, buildingId });
      void refresh();
    }, [buildingId, refresh, spaceId]),
  );

  const onRefresh = useCallback(async () => {
    devLog('[UnitsScreen] pull to refresh');
    setRefreshing(true);
    await refresh();
    setRefreshing(false);
  }, [refresh]);

  const openUnit = (unit: UnitListItemResponse) => {
    devLog('[UnitsScreen] open unit', unit.unitId);

    if (isRental || !profile?.showRoomsUnderUnit) {
      unitInteraction.open(unit);
      return;
    }

    navigation.navigate('AccommodationRooms', {
      spaceId,
      buildingId,
      buildingName,
      parentType: 'unit',
      parentId: unit.unitId,
      parentName: unit.name,
    });
  };

  const openUnitDetail = (unit: UnitListItemResponse) => {
    navigation.navigate('UnitDetail', {
      spaceId,
      buildingId,
      buildingName,
      unitId: unit.unitId,
    });
  };

  const unitSubtitle = (unit: UnitListItemResponse) => {
    if (isRental) {
      return null;
    }
    return t('accommodation.listItem.unit', {
      roomCount: unit.roomCount,
      bedCount: unit.bedCount,
    });
  };

  const showLoading = loading && !refreshing && units.length === 0;

  const listHeader = (
    <View style={styles.header}>
      {error ? (
        <View style={styles.errorBanner}>
          <Text style={styles.errorBannerText}>{error}</Text>
        </View>
      ) : null}
      <DashboardSectionTitle title={t('accommodation.units.title')} />
      <AccommodationSearchBar value={searchQuery} onChangeText={setSearchQuery} />
      {showLoading ? <SkeletonCard /> : null}
    </View>
  );

  const listEmpty =
    !showLoading && !error ? (
      <EmptyState
        title={t('accommodation.units.emptyTitle')}
        description={t('accommodation.units.emptyDescription')}
        Icon={Grid2x2}
      />
    ) : null;

  return (
    <RequireAccommodationAccess spaceId={spaceId}>
    <View style={styles.root}>
      <FlatList
        data={showLoading ? [] : units}
        keyExtractor={item => item.unitId}
        numColumns={2}
        columnWrapperStyle={styles.columnWrapper}
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
        renderItem={({ item: unit }) => {
          const inactive = !isAccommodationEntityActive(unit);
          return (
            <View style={styles.gridItem}>
              <InventoryListingCard
                kind="unit"
                title={unit.name}
                subtitle={unitSubtitle(unit)}
                status={inactive ? null : unit.status}
                inactive={inactive}
                occupancyPercent={inactive ? 0 : occupancyPercentFromStatus(unit.status)}
                onPressDetails={() => openUnitDetail(unit)}
                onPressCard={() => openUnit(unit)}
              />
              {supportsUnitOccupancy && spaceType && canManageOccupancyActions ? (
                <AccommodationOccupancyQuickActions
                  spaceType={spaceType}
                  accommodationStatus={unit.status}
                  context={buildUnitContext(unit)}
                  flow={occupancyFlow}
                  canManage={canManageOccupancyActions}
                  layout="compact"
                  onViewOccupant={
                    unit.status === 'AVAILABLE' ? undefined : () => openUnitDetail(unit)
                  }
                />
              ) : null}
            </View>
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
      <PersistedUnitInteractionHost
        interaction={unitInteraction}
        spaceId={spaceId}
        spaceType={spaceType}
        buildingId={buildingId}
        buildingName={buildingName}
      />

      {showFab ? (
        <FAB
          onPress={() =>
            navigation.navigate('UnitForm', { spaceId, buildingId, mode: 'create' })
          }
          accessibilityLabel={t('accommodation.units.addFab')}
        />
      ) : null}
    </View>
    </RequireAccommodationAccess>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.lg, paddingBottom: 96, flexGrow: 1 },
  header: { marginBottom: spacing.md },
  errorBanner: {
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FECACA',
    borderRadius: radius.button,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  errorBannerText: {
    ...typography.body,
    fontSize: 14,
    color: '#DC2626',
  },
  columnWrapper: {
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  gridItem: {
    flex: 1,
    minWidth: 0,
    gap: spacing.xs,
  },
});
