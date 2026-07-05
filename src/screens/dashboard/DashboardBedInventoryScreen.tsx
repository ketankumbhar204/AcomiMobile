import React, { useCallback, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useTranslation } from 'react-i18next';
import type { AccommodationStatus, UUID } from '../../api/types';
import {
  countDashboardBedInventoryFilters,
  DashboardBedInventoryFilterDrawer,
  defaultDashboardBedInventoryFilters,
  type DashboardBedInventoryFilters,
} from '../../components/dashboard/DashboardBedInventoryFilterDrawer';
import { DashboardBedInventoryRow } from '../../components/dashboard/DashboardBedInventoryRow';
import { EmptyState, ListSearchFilterBar, SkeletonCard } from '../../components/ui';
import { Screen } from '../../components/ui/Screen';
import { useSpaceBedSearch } from '../../hooks/useSpaceBedSearch';
import type { MainStackParamList } from '../../navigation/types';
import { colors, spacing, typography } from '../../theme';
import { formatBedSpaceLocation } from '../../utils/bedSpaceLocation';
import { shouldUseFilterDrawer } from '../../utils/filterUx';

type Route = {
  key: string;
  name: 'DashboardBedInventory';
  params: {
    spaceId: UUID;
    status: AccommodationStatus;
  };
};

type Nav = NativeStackNavigationProp<MainStackParamList, 'DashboardBedInventory'>;

const BED_INVENTORY_FILTER_OPTION_COUNT = 3;

export function DashboardBedInventoryScreen() {
  const { t } = useTranslation();
  const navigation = useNavigation<Nav>();
  const route = useRoute<Route>();
  const { spaceId, status } = route.params;
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState<DashboardBedInventoryFilters>(
    defaultDashboardBedInventoryFilters(),
  );
  const [filterDrawerOpen, setFilterDrawerOpen] = useState(false);

  const activeFilterCount = countDashboardBedInventoryFilters(filters);

  const beds = useSpaceBedSearch({
    spaceId,
    status,
    query: searchQuery,
    buildingId: filters.buildingId,
    floorId: filters.floorId,
    unitId: filters.unitId,
  });

  const subtitle =
    status === 'AVAILABLE'
      ? t('dashboard.drilldown.vacantBedsSubtitle')
      : t('dashboard.drilldown.occupiedBedsSubtitle');

  const hasActiveFilters = activeFilterCount > 0 || searchQuery.trim().length > 0;

  const empty = useMemo(
    () => ({
      title: hasActiveFilters
        ? t('list.emptyFiltered')
        : status === 'AVAILABLE'
          ? t('dashboard.drilldown.emptyVacantBeds')
          : t('dashboard.drilldown.emptyOccupiedBeds'),
      description: hasActiveFilters ? undefined : t('dashboard.drilldown.emptyBedsDescription'),
    }),
    [hasActiveFilters, status, t],
  );

  const handleBedPress = useCallback(
    (bed: (typeof beds.items)[number]) => {
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
    },
    [navigation, spaceId],
  );

  return (
    <Screen style={styles.screen} contentStyle={styles.content}>
      <Text style={styles.subtitle}>{subtitle}</Text>
      <ListSearchFilterBar
          searchValue={searchQuery}
          onSearchChange={setSearchQuery}
          searchPlaceholder={t('dashboard.drilldown.searchBeds')}
          onFilterPress={() => setFilterDrawerOpen(true)}
          activeFilterCount={activeFilterCount}
          showFilterButton={shouldUseFilterDrawer(BED_INVENTORY_FILTER_OPTION_COUNT)}
        />

      {beds.loading && beds.items.length === 0 ? (
        <SkeletonCard />
      ) : beds.error ? (
        <EmptyState title={t('common.errors.generic')} description={beds.error} />
      ) : beds.items.length === 0 ? (
        <EmptyState title={empty.title} description={empty.description} />
      ) : (
        <FlatList
          data={beds.items}
          keyExtractor={item => item.bedId}
          refreshControl={
            <RefreshControl refreshing={beds.refreshing} onRefresh={() => void beds.refresh()} />
          }
          onEndReached={() => void beds.loadMore()}
          onEndReachedThreshold={0.4}
          ListFooterComponent={
            beds.loadingMore ? (
              <ActivityIndicator color={colors.primary} style={styles.footerLoader} />
            ) : null
          }
          contentContainerStyle={styles.listContent}
          renderItem={({ item }) => (
            <DashboardBedInventoryRow
              label={formatBedSpaceLocation(item)}
              onPress={() => handleBedPress(item)}
            />
          )}
        />
      )}

      <DashboardBedInventoryFilterDrawer
        visible={filterDrawerOpen}
        spaceId={spaceId}
        applied={filters}
        onClose={() => setFilterDrawerOpen(false)}
        onApply={setFilters}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  content: {
    padding: spacing.xxl,
    paddingTop: 0,
  },
  subtitle: {
    ...typography.body,
    color: colors.textSecondary,
    paddingTop: spacing.md,
    paddingBottom: spacing.sm,
    lineHeight: 20,
  },
  listContent: {
    paddingBottom: spacing.xl,
    gap: spacing.sm,
  },
  footerLoader: {
    marginVertical: spacing.md,
  },
});
