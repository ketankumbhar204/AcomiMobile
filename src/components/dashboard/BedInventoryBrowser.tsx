import React, { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  TextInput,
  View,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import type { AccommodationStatus, BedSpaceListItemResponse, SpaceType, UUID } from '../../api/types';
import { EmptyState, SkeletonCard } from '../ui';
import { useBuildings } from '../../hooks/useBuildings';
import { useSpaceBedSearch } from '../../hooks/useSpaceBedSearch';
import { colors, radius, spacing, typography } from '../../theme';
import {
  groupBedsForInventoryBrowse,
  type BedInventoryListGroup,
} from '../../utils/bedInventoryHierarchy';
import {
  DashboardBedInventoryFiltersBar,
  DashboardBedInventoryFilterDropdownOverlay,
  type DashboardBedInventoryFilterLabels,
  type DashboardBedInventoryFilterOverlayLayout,
  type DashboardBedInventoryFiltersBarHandle,
} from './DashboardBedInventoryFiltersBar';
import {
  defaultDashboardBedInventoryFilters,
  type DashboardBedInventoryFilters,
} from './DashboardBedInventoryFilterDrawer';
import { DashboardBedRoomSectionCard } from './DashboardBedRoomSectionCard';
import { DashboardBedUnitSectionCard } from './DashboardBedUnitSectionCard';
import type { BedInventoryFlowAction } from './DashboardBedInventoryBedRow';

export type BedInventoryBrowserProps = {
  spaceId: UUID;
  spaceType: SpaceType;
  status?: AccommodationStatus;
  flowAction?: BedInventoryFlowAction;
  onFlowAction?: (bed: BedSpaceListItemResponse) => void;
  canManageOccupancy?: boolean;
  onBedPress?: (bed: BedSpaceListItemResponse) => void;
  onAllocate?: (bed: BedSpaceListItemResponse) => void;
  onReserve?: (bed: BedSpaceListItemResponse) => void;
  subtitle?: string;
  showSubtitle?: boolean;
  showSummary?: boolean;
  contentStyle?: StyleProp<ViewStyle>;
  listContentStyle?: StyleProp<ViewStyle>;
  refreshTrigger?: number;
  compactPadding?: boolean;
  /** Scroll filters, search, and bed groups in one list (wizard flows). */
  unifiedScroll?: boolean;
  headerAccessory?: ReactNode;
};

export function BedInventoryBrowser({
  spaceId,
  spaceType,
  status = 'AVAILABLE',
  flowAction = 'dashboard',
  onFlowAction,
  canManageOccupancy = false,
  onBedPress,
  onAllocate,
  onReserve,
  subtitle,
  showSubtitle = true,
  showSummary = true,
  contentStyle,
  listContentStyle,
  refreshTrigger = 0,
  compactPadding = false,
  unifiedScroll = false,
  headerAccessory,
}: BedInventoryBrowserProps) {
  const { t } = useTranslation();
  const [searchQuery, setSearchQuery] = useState('');
  const [filterLabels, setFilterLabels] = useState<DashboardBedInventoryFilterLabels>({});
  const [filters, setFilters] = useState<DashboardBedInventoryFilters>(
    defaultDashboardBedInventoryFilters(),
  );
  const [filterOverlayLayout, setFilterOverlayLayout] =
    useState<DashboardBedInventoryFilterOverlayLayout | null>(null);
  const overlayHostRef = useRef<View>(null);
  const filtersBarRef = useRef<DashboardBedInventoryFiltersBarHandle>(null);

  const { buildings } = useBuildings(spaceId);

  const beds = useSpaceBedSearch({
    spaceId,
    status,
    query: searchQuery,
    buildingId: filters.buildingId,
    floorId: filters.floorId,
    unitId: filters.unitId,
    loadAll: true,
  });

  useEffect(() => {
    if (refreshTrigger > 0) {
      void beds.refresh();
    }
  }, [beds, refreshTrigger]);

  const inventoryGroups = useMemo(
    () =>
      groupBedsForInventoryBrowse(beds.items, spaceType, buildings, filters.buildingId),
    [beds.items, buildings, filters.buildingId, spaceType],
  );

  const hasActiveFilters =
    Boolean(filters.buildingId || filters.floorId || filters.unitId) ||
    searchQuery.trim().length > 0;

  const summaryScope = useMemo(() => {
    const parts = [
      filterLabels.buildingName ?? t('dashboard.drilldown.allBuildings'),
      filterLabels.floorName,
      filterLabels.unitName,
    ].filter(Boolean);
    return parts.join(' · ');
  }, [filterLabels.buildingName, filterLabels.floorName, filterLabels.unitName, t]);

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

  const resolvedSubtitle =
    subtitle ??
    (status === 'AVAILABLE'
      ? t('dashboard.drilldown.vacantBedsSubtitle')
      : t('dashboard.drilldown.occupiedBedsSubtitle'));

  const renderInventoryGroup = useCallback(
    ({ item }: { item: BedInventoryListGroup }) => {
      const sharedProps = {
        flowAction,
        onFlowAction,
        canManageOccupancy,
        onBedPress: onBedPress ?? (() => {}),
        onAllocate,
        onReserve,
      };

      if (item.type === 'unit') {
        return <DashboardBedUnitSectionCard group={item.group} {...sharedProps} />;
      }

      return <DashboardBedRoomSectionCard group={item.group} {...sharedProps} />;
    },
    [
      canManageOccupancy,
      flowAction,
      onAllocate,
      onBedPress,
      onFlowAction,
      onReserve,
    ],
  );

  const inventoryGroupKey = useCallback((item: BedInventoryListGroup) => item.group.key, []);

  const summaryBlock =
    showSummary && !beds.loading && beds.items.length > 0 ? (
      <View style={styles.summary}>
        <Text style={styles.summaryPrimary}>
          {status === 'AVAILABLE'
            ? t('dashboard.drilldown.showingAvailableBeds', { count: beds.items.length })
            : t('dashboard.drilldown.showingBeds', { count: beds.items.length })}
        </Text>
        <Text style={styles.summaryScope}>{summaryScope}</Text>
      </View>
    ) : null;

  const filtersAndSearch = (
    <>
      <DashboardBedInventoryFiltersBar
        ref={filtersBarRef}
        spaceId={spaceId}
        spaceType={spaceType}
        filters={filters}
        onChange={setFilters}
        onLabelsChange={setFilterLabels}
        overlayHostRef={overlayHostRef}
        onOverlayLayoutChange={setFilterOverlayLayout}
      />
      <TextInput
        style={styles.searchInput}
        value={searchQuery}
        onChangeText={setSearchQuery}
        placeholder={t('dashboard.drilldown.searchBeds')}
        placeholderTextColor={colors.muted}
        autoCorrect={false}
        clearButtonMode="while-editing"
      />
    </>
  );

  const scrollHeader = (
    <>
      {headerAccessory ? <View style={styles.headerAccessory}>{headerAccessory}</View> : null}
      {showSubtitle ? (
        <Text style={[styles.subtitle, compactPadding && styles.subtitleCompact]}>
          {resolvedSubtitle}
        </Text>
      ) : null}
      {filtersAndSearch}
      {summaryBlock}
    </>
  );

  const fixedHeader = (
    <>
      {headerAccessory ? <View style={styles.headerAccessory}>{headerAccessory}</View> : null}
      {showSubtitle ? (
        <Text style={[styles.subtitle, compactPadding && styles.subtitleCompact]}>
          {resolvedSubtitle}
        </Text>
      ) : null}
      {filtersAndSearch}
    </>
  );

  const listHeader = summaryBlock;

  const emptyComponent = useMemo(() => {
    if (beds.loading && beds.items.length === 0) {
      return <SkeletonCard />;
    }
    if (beds.error) {
      return <EmptyState title={t('common.errors.generic')} description={beds.error} />;
    }
    return <EmptyState title={empty.title} description={empty.description} />;
  }, [beds.error, beds.items.length, beds.loading, empty.description, empty.title, t]);

  if (unifiedScroll) {
    return (
      <View ref={overlayHostRef} style={[styles.body, contentStyle]}>
        <FlatList
          data={inventoryGroups}
          keyExtractor={inventoryGroupKey}
          renderItem={renderInventoryGroup}
          ListHeaderComponent={scrollHeader}
          ListEmptyComponent={emptyComponent}
          refreshControl={
            <RefreshControl refreshing={beds.refreshing} onRefresh={() => void beds.refresh()} />
          }
          contentContainerStyle={[
            styles.listContent,
            inventoryGroups.length === 0 && styles.listContentEmpty,
            listContentStyle,
          ]}
          initialNumToRender={6}
          maxToRenderPerBatch={4}
          windowSize={7}
          removeClippedSubviews={false}
          keyboardShouldPersistTaps="handled"
          style={styles.unifiedList}
          ListFooterComponent={
            beds.loadingMore ? (
              <ActivityIndicator color={colors.primary} style={styles.footerLoader} />
            ) : null
          }
        />
        {filterOverlayLayout ? (
          <DashboardBedInventoryFilterDropdownOverlay
            layout={filterOverlayLayout}
            onSelect={value => filtersBarRef.current?.selectOption(value)}
            onClose={() => filtersBarRef.current?.closeDropdown()}
          />
        ) : null}
      </View>
    );
  }

  return (
    <View ref={overlayHostRef} style={[styles.body, contentStyle]}>
      {fixedHeader}
      {beds.loading && beds.items.length === 0 ? (
        <SkeletonCard />
      ) : beds.error ? (
        <EmptyState title={t('common.errors.generic')} description={beds.error} />
      ) : inventoryGroups.length === 0 ? (
        <>
          {listHeader}
          <EmptyState title={empty.title} description={empty.description} />
        </>
      ) : (
        <FlatList
          data={inventoryGroups}
          keyExtractor={inventoryGroupKey}
          renderItem={renderInventoryGroup}
          ListHeaderComponent={listHeader}
          refreshControl={
            <RefreshControl refreshing={beds.refreshing} onRefresh={() => void beds.refresh()} />
          }
          contentContainerStyle={[styles.listContent, listContentStyle]}
          initialNumToRender={6}
          maxToRenderPerBatch={4}
          windowSize={7}
          removeClippedSubviews
          keyboardShouldPersistTaps="handled"
          ListFooterComponent={
            beds.loadingMore ? (
              <ActivityIndicator color={colors.primary} style={styles.footerLoader} />
            ) : null
          }
        />
      )}
      {filterOverlayLayout ? (
        <DashboardBedInventoryFilterDropdownOverlay
          layout={filterOverlayLayout}
          onSelect={value => filtersBarRef.current?.selectOption(value)}
          onClose={() => filtersBarRef.current?.closeDropdown()}
        />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  body: {
    flex: 1,
    position: 'relative',
    minHeight: 0,
  },
  unifiedList: {
    flex: 1,
  },
  headerAccessory: {
    marginBottom: spacing.sm,
  },
  subtitle: {
    ...typography.body,
    color: colors.textSecondary,
    paddingTop: spacing.md,
    paddingBottom: spacing.xs,
    lineHeight: 20,
  },
  subtitleCompact: {
    paddingTop: 0,
  },
  searchInput: {
    minHeight: 44,
    backgroundColor: colors.white,
    borderRadius: radius.input,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    ...typography.body,
    color: colors.textPrimary,
    marginTop: spacing.xs,
    marginBottom: spacing.sm,
  },
  summary: {
    marginBottom: spacing.md,
    gap: spacing.xxs,
  },
  summaryPrimary: {
    ...typography.bodyStrong,
    color: colors.textPrimary,
  },
  summaryScope: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  listContent: {
    paddingBottom: spacing.xl,
  },
  listContentEmpty: {
    flexGrow: 1,
  },
  footerLoader: {
    marginVertical: spacing.md,
  },
});
