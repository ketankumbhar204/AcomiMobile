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
  AccommodationListFooter,
  AccommodationSearchBar,
  AccommodationStatusBadge,
} from '../../components/accommodation';
import { EmptyState, FAB, HeaderBackButton, ListCard, SkeletonCard } from '../../components/ui';
import { useActiveSpaceId } from '../../hooks/useActiveSpaceId';
import { useUnits } from '../../hooks/useUnits';
import type { MainStackParamList } from '../../navigation/types';
import { useSpaceStore } from '../../store/spaceStore';
import { colors, spacing, typography } from '../../theme';
import {
  canCreateOrUpdateAccommodation,
  canManageAccommodation,
} from '../../utils/accommodationPermissions';
import { renameUnitName } from '../../utils/accommodationInlineRename';
import { useToastStore } from '../../store/toastStore';
import { useAccommodationUiProfile } from '../../hooks/useAccommodationUiProfile';

type UnitsNav = NativeStackNavigationProp<MainStackParamList, 'Units'>;
type UnitsRoute = NativeStackScreenProps<MainStackParamList, 'Units'>['route'];

export function UnitsScreen() {
  const { t, i18n } = useTranslation();
  const navigation = useNavigation<UnitsNav>();
  const route = useRoute<UnitsRoute>();
  const { buildingId, buildingName } = route.params;
  const spaceId = useActiveSpaceId(route.params.spaceId);

  const mySpaces = useSpaceStore(state => state.mySpaces);
  const spaceType = useMemo(
    () => mySpaces.find(space => space.spaceId === spaceId)?.spaceType,
    [mySpaces, spaceId],
  );
  const currentRole = useMemo(
    () => mySpaces.find(space => space.spaceId === spaceId)?.membershipRole,
    [mySpaces, spaceId],
  );
  const { profile } = useAccommodationUiProfile(spaceId, spaceType, buildingId);
  const isRental = profile?.layoutMode === 'RENTAL';
  const showFab = canCreateOrUpdateAccommodation(currentRole);
  const canManage = canManageAccommodation(currentRole);
  const showToast = useToastStore(state => state.showToast);

  const [searchQuery, setSearchQuery] = useState('');
  const [refreshing, setRefreshing] = useState(false);

  const { units, loading, loadingMore, error, hasMore, refresh, loadMore } = useUnits(
    spaceId,
    buildingId,
    { searchQuery },
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
      console.log('[UnitsScreen] focused', { spaceId, buildingId });
      void refresh();
    }, [buildingId, refresh, spaceId]),
  );

  const onRefresh = useCallback(async () => {
    console.log('[UnitsScreen] pull to refresh');
    setRefreshing(true);
    await refresh();
    setRefreshing(false);
  }, [refresh]);

  const openUnit = (unit: UnitListItemResponse) => {
    console.log('[UnitsScreen] open unit', unit.unitId);

    if (isRental || !profile?.showRoomsUnderUnit) {
      navigation.navigate('UnitDetail', {
        spaceId,
        buildingId,
        buildingName,
        unitId: unit.unitId,
      });
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
      return t(`accommodation.status.${unit.status}`);
    }
    return t('accommodation.listItem.unit', {
      roomCount: unit.roomCount,
      bedCount: unit.bedCount,
    });
  };

  const showLoading = loading && !refreshing && units.length === 0;

  const listHeader = (
    <View style={styles.header}>
      {error ? <Text style={styles.errorText}>{error}</Text> : null}
      <AccommodationSearchBar value={searchQuery} onChangeText={setSearchQuery} />
      {showLoading ? <SkeletonCard /> : null}
    </View>
  );

  const listEmpty =
    !showLoading && !error ? (
      <EmptyState
        title={t('accommodation.units.emptyTitle')}
        description={t('accommodation.units.emptyDescription')}
        icon="🚪"
      />
    ) : null;

  return (
    <View style={styles.root}>
      <FlatList
        data={showLoading ? [] : units}
        keyExtractor={item => item.unitId}
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
        renderItem={({ item: unit }) => (
          <View style={styles.listItem}>
            <View style={styles.badgeRow}>
              <AccommodationStatusBadge status={unit.status} />
            </View>
            <ListCard
              title={unit.name}
              subtitle={unitSubtitle(unit)}
              iconLabel={unit.name.charAt(0).toUpperCase()}
              editableName={canManage}
              onSaveName={async name => {
                await renameUnitName(spaceId, buildingId, unit.unitId, name);
                showToast(t('accommodation.units.updateSuccess'));
                await refresh();
              }}
              onPress={() => openUnit(unit)}
              onLongPress={() => openUnitDetail(unit)}
            />
          </View>
        )}
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
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.xl, paddingBottom: 96, flexGrow: 1 },
  header: { marginBottom: spacing.md },
  errorText: { ...typography.body, color: '#DC2626', marginBottom: spacing.lg },
  listItem: { gap: spacing.xs, marginBottom: spacing.md },
  badgeRow: { marginBottom: spacing.xs },
});
