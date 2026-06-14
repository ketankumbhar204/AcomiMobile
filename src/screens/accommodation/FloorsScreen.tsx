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
import type { FloorListItemResponse } from '../../api/types';
import { AccommodationListFooter, AccommodationSearchBar } from '../../components/accommodation';
import { EmptyState, FAB, HeaderBackButton, ListCard, RequireAccommodationAccess, SkeletonCard } from '../../components/ui';
import { useActiveSpaceId } from '../../hooks/useActiveSpaceId';
import { useFloors } from '../../hooks/useFloors';
import { useSpacePermissions } from '../../hooks/useSpacePermissions';
import type { MainStackParamList } from '../../navigation/types';
import { colors, spacing, typography } from '../../theme';
import { renameFloorName } from '../../utils/accommodationInlineRename';
import { useToastStore } from '../../store/toastStore';
import { formatFloorHeaderTitle } from '../../utils/accommodationLabels';

type FloorsNav = NativeStackNavigationProp<MainStackParamList, 'Floors'>;
type FloorsRoute = NativeStackScreenProps<MainStackParamList, 'Floors'>['route'];

export function FloorsScreen() {
  const { t, i18n } = useTranslation();
  const navigation = useNavigation<FloorsNav>();
  const route = useRoute<FloorsRoute>();
  const { buildingId, buildingName } = route.params;
  const spaceId = useActiveSpaceId(route.params.spaceId);

  const permissions = useSpacePermissions(spaceId);
  const showFab = permissions.canManageAccommodation;
  const canManage = permissions.canManageAccommodation;
  const showToast = useToastStore(state => state.showToast);

  const [searchQuery, setSearchQuery] = useState('');
  const [refreshing, setRefreshing] = useState(false);

  const { floors, loading, loadingMore, error, hasMore, refresh, loadMore } = useFloors(
    spaceId,
    buildingId,
    { searchQuery },
  );

  useLayoutEffect(() => {
    navigation.setOptions({
      title: buildingName ?? t('accommodation.floors.title'),
      headerBackVisible: false,
      headerLeft: () => <HeaderBackButton />,
    });
  }, [buildingName, navigation, t, i18n.language]);

  useFocusEffect(
    useCallback(() => {
      console.log('[FloorsScreen] focused', { spaceId, buildingId });
      void refresh();
    }, [buildingId, refresh, spaceId]),
  );

  const onRefresh = useCallback(async () => {
    console.log('[FloorsScreen] pull to refresh');
    setRefreshing(true);
    await refresh();
    setRefreshing(false);
  }, [refresh]);

  const openRooms = (floor: FloorListItemResponse) => {
    console.log('[FloorsScreen] open floor rooms', floor.floorId);
    navigation.navigate('AccommodationRooms', {
      spaceId,
      buildingId,
      buildingName,
      parentType: 'floor',
      parentId: floor.floorId,
      parentName: floor.name,
    });
  };

  const openFloorDetail = (floor: FloorListItemResponse) => {
    navigation.navigate('FloorDetail', {
      spaceId,
      buildingId,
      floorId: floor.floorId,
      buildingName,
    });
  };

  const showLoading = loading && !refreshing && floors.length === 0;

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
        title={t('accommodation.floors.emptyTitle')}
        description={t('accommodation.floors.emptyDescription')}
        icon="🏗️"
      />
    ) : null;

  return (
    <RequireAccommodationAccess spaceId={spaceId}>
    <View style={styles.root}>
      <FlatList
        data={showLoading ? [] : floors}
        keyExtractor={item => item.floorId}
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
        renderItem={({ item: floor }) => (
          <View style={styles.listCard}>
            <ListCard
              title={floor.name}
              subtitle={t('accommodation.listItem.floor', {
                roomCount: floor.roomCount,
                bedCount: floor.bedCount,
              })}
              iconLabel={floor.name.charAt(0).toUpperCase()}
              editableName={canManage}
              onSaveName={async name => {
                await renameFloorName(spaceId, buildingId, floor.floorId, name);
                showToast(t('accommodation.floors.updateSuccess'));
                await refresh();
              }}
              onPress={() => openRooms(floor)}
              onLongPress={() => openFloorDetail(floor)}
            />
          </View>
        )}
      />

      {showFab ? (
        <FAB
          onPress={() =>
            navigation.navigate('FloorForm', {
              spaceId,
              buildingId,
              mode: 'create',
            })
          }
          accessibilityLabel={t('accommodation.floors.addFab')}
        />
      ) : null}
    </View>
    </RequireAccommodationAccess>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.xl, paddingBottom: 96, flexGrow: 1 },
  header: { marginBottom: spacing.md },
  errorText: { ...typography.body, color: '#DC2626', marginBottom: spacing.lg },
  listCard: { marginBottom: spacing.md },
});
