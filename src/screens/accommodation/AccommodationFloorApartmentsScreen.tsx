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
import type { UnitListItemResponse } from '../../api/types';
import {
  AccommodationContextTrail,
  AccommodationEntityRow,
  AccommodationListFooter,
  AccommodationSearchBar,
  AccommodationStatusBadge,
  ParentSummaryCard,
} from '../../components/accommodation';
import { Button, EmptyState, FAB, HeaderBackButton, SkeletonCard } from '../../components/ui';
import { useActiveSpaceId } from '../../hooks/useActiveSpaceId';
import { useUnitsByFloor } from '../../hooks/useUnitsByFloor';
import type { MainStackParamList } from '../../navigation/types';
import { useSpaceStore } from '../../store/spaceStore';
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
import {
  canCreateOrUpdateAccommodation,
  canManageAccommodation,
} from '../../utils/accommodationPermissions';
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

  const mySpaces = useSpaceStore(state => state.mySpaces);
  const currentRole = useMemo(
    () => mySpaces.find(space => space.spaceId === spaceId)?.membershipRole,
    [mySpaces, spaceId],
  );
  const showFab = canCreateOrUpdateAccommodation(currentRole);
  const canManage = canManageAccommodation(currentRole);
  const showToast = useToastStore(state => state.showToast);

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
  } = useUnitsByFloor(spaceId, buildingId, floorId, { searchQuery });

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

  const summaryCounts = useMemo(() => {
    if (units.length === 0) {
      return { roomCount: undefined, bedCount: undefined };
    }
    return {
      roomCount: units.reduce((sum, unit) => sum + unit.roomCount, 0),
      bedCount: units.reduce((sum, unit) => sum + unit.bedCount, 0),
    };
  }, [units]);

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

  const renderItem = ({ item }: { item: UnitListItemResponse }) => (
    <AccommodationEntityRow
      title={item.name}
      subtitle={t('accommodation.listItem.unit', {
        roomCount: item.roomCount,
        bedCount: item.bedCount,
      })}
      iconLabel={item.name.charAt(0).toUpperCase()}
      badge={<AccommodationStatusBadge status={item.status} />}
      editableName={canManage}
      onSaveName={async name => {
        await renameUnitName(spaceId, buildingId, item.unitId, name);
        showToast(t('accommodation.units.updateSuccess'));
        await refresh();
      }}
      onPress={() => openUnitRooms(item)}
    />
  );

  const showLoading = loading && !refreshing && units.length === 0;

  const listHeader = (
    <View style={styles.header}>
      {error ? <Text style={styles.errorText}>{error}</Text> : null}

      <AccommodationContextTrail segments={trailSegments} onNavigate={onTrailNavigate} />

      <ParentSummaryCard
        roomCount={summaryCounts.roomCount}
        bedCount={summaryCounts.bedCount}
        loading={showLoading}
      />

      <Text style={styles.sectionLabel}>{t('accommodation.apartments.onFloor')}</Text>
      <Text style={styles.sectionCount}>
        {t('accommodation.apartments.count', { count: units.length })}
      </Text>

      <AccommodationSearchBar value={searchQuery} onChangeText={setSearchQuery} />
      {showLoading ? <SkeletonCard /> : null}
    </View>
  );

  return (
    <View style={styles.container}>
      <FlatList
        data={showLoading ? [] : units}
        keyExtractor={item => item.unitId}
        renderItem={renderItem}
        ListHeaderComponent={listHeader}
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
          !showLoading && !error ? (
            <EmptyState
              title={t('accommodation.apartments.emptyTitle')}
              description={t('accommodation.apartments.emptyMessage')}
              icon="🏠"
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
    </View>
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
});
