import React, { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  View,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { BedDouble, BedSingle, CalendarDays } from 'lucide-react-native';
import type { AccommodationStatus, BedSpaceListItemResponse, SpaceType, UUID } from '../../api/types';
import { EmptyState, InventoryListSkeleton, ListSearchBar } from '../ui';
import { useBuildings } from '../../hooks/useBuildings';
import { useSpacePermissions } from '../../hooks/useSpacePermissions';
import { navigateToRoomGroupEntityEdit } from '../../utils/accommodationNavigation';
import type { MainStackParamList } from '../../navigation/types';
import { useSpaceBedSearch } from '../../hooks/useSpaceBedSearch';
import { colors, radius, shadows, spacing, typography } from '../../theme';
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
import {
  filterBedsById,
  type PropertyOpsFocus,
} from '../../utils/propertyOpsFocus';

export type BedInventoryBrowserProps = {
  spaceId: UUID;
  spaceType: SpaceType;
  status?: AccommodationStatus;
  flowAction?: BedInventoryFlowAction;
  onFlowAction?: (bed: BedSpaceListItemResponse) => void;
  canManageOccupancy?: boolean;
  onBedPress?: (bed: BedSpaceListItemResponse) => void;
  onEditBed?: (bed: BedSpaceListItemResponse) => void;
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
  /** Property-operations card that is open. Drives the result summary wording. */
  opsFocus?: PropertyOpsFocus | null;
  /** When set, only these beds stay in the list (move-ins this month). */
  bedIdAllowList?: ReadonlySet<string> | null;
  /** Hold the list on a skeleton while the allow-list is still loading. */
  listPending?: boolean;
  /** Seed hierarchy filters (e.g. OccupancyWizard opened from a floor/unit). */
  initialFilters?: DashboardBedInventoryFilters;
};

export function BedInventoryBrowser({
  spaceId,
  spaceType,
  status = 'AVAILABLE',
  flowAction = 'dashboard',
  onFlowAction,
  canManageOccupancy = false,
  onBedPress,
  onEditBed,
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
  opsFocus = null,
  bedIdAllowList = null,
  listPending = false,
  initialFilters,
}: BedInventoryBrowserProps) {
  const { t } = useTranslation();
  const navigation = useNavigation<NativeStackNavigationProp<MainStackParamList>>();
  const canManageStructure = useSpacePermissions(spaceId).canManageAccommodation;
  const [searchQuery, setSearchQuery] = useState('');
  const [filterLabels, setFilterLabels] = useState<DashboardBedInventoryFilterLabels>({});
  const [filters, setFilters] = useState<DashboardBedInventoryFilters>(() => ({
    ...defaultDashboardBedInventoryFilters(),
    ...(initialFilters ?? {}),
  }));
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

  const visibleBeds = useMemo(
    () => filterBedsById(beds.items, bedIdAllowList),
    [bedIdAllowList, beds.items],
  );

  const inventoryGroups = useMemo(
    () =>
      groupBedsForInventoryBrowse(visibleBeds, spaceType, buildings, filters.buildingId),
    [buildings, filters.buildingId, spaceType, visibleBeds],
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
        : opsFocus === 'moveIns'
          ? t('dashboard.drilldown.emptyMoveIns')
          : status === 'AVAILABLE'
            ? t('dashboard.drilldown.emptyVacantBeds')
            : t('dashboard.drilldown.emptyOccupiedBeds'),
      description: hasActiveFilters
        ? undefined
        : opsFocus === 'moveIns'
          ? t('dashboard.drilldown.emptyOccupancyDescription')
          : t('dashboard.drilldown.emptyBedsDescription'),
    }),
    [hasActiveFilters, opsFocus, status, t],
  );

  const resolvedSubtitle =
    subtitle ??
    (status === 'AVAILABLE'
      ? t('dashboard.drilldown.vacantBedsSubtitle')
      : t('dashboard.drilldown.occupiedBedsSubtitle'));

  const openAddBed = useCallback(
    (room: { buildingId: string; roomId: string }) => {
      navigation.navigate('BedForm', {
        spaceId,
        buildingId: room.buildingId,
        roomId: room.roomId,
        mode: 'create',
      });
    },
    [navigation, spaceId],
  );

  const showAddBed = canManageStructure && flowAction === 'dashboard';

  const renderInventoryGroup = useCallback(
    ({ item }: { item: BedInventoryListGroup }) => {
      const sharedProps = {
        spaceId,
        flowAction,
        onFlowAction,
        canManageOccupancy,
        onBedPress: onBedPress ?? (() => {}),
        onEditBed: flowAction === 'dashboard' ? onEditBed : undefined,
        onAllocate,
        onReserve,
        showAddBed,
      };

      if (item.type === 'unit') {
        return (
          <DashboardBedUnitSectionCard
            group={item.group}
            {...sharedProps}
            onAddBed={showAddBed ? openAddBed : undefined}
            onPathCrumbPress={
              canManageStructure
                ? (room, crumb) =>
                    navigateToRoomGroupEntityEdit(navigation, spaceId, room, crumb.level)
                : undefined
            }
          />
        );
      }

      return (
        <DashboardBedRoomSectionCard
          group={item.group}
          {...sharedProps}
          onAddBed={showAddBed ? () => openAddBed(item.group) : undefined}
          onPathCrumbPress={
            canManageStructure
              ? crumb =>
                  navigateToRoomGroupEntityEdit(navigation, spaceId, item.group, crumb.level)
              : undefined
          }
        />
      );
    },
    [
      canManageOccupancy,
      canManageStructure,
      flowAction,
      navigation,
      onAllocate,
      onBedPress,
      onEditBed,
      onFlowAction,
      onReserve,
      openAddBed,
      showAddBed,
      spaceId,
    ],
  );

  const inventoryGroupKey = useCallback((item: BedInventoryListGroup) => item.group.key, []);

  const summaryCount = visibleBeds.length;
  const summaryLabel =
    opsFocus === 'moveIns'
      ? t('dashboard.drilldown.showingMoveIns', {
          count: summaryCount,
          defaultValue: 'Showing {{count}} move-ins this month',
        })
      : opsFocus === 'occupied' || status === 'OCCUPIED'
        ? t('dashboard.drilldown.showingOccupiedBeds', {
            count: summaryCount,
            defaultValue: 'Showing {{count}} occupied beds',
          })
        : status === 'AVAILABLE'
          ? t('dashboard.drilldown.showingAvailableBeds', { count: summaryCount })
          : t('dashboard.drilldown.showingBeds', { count: summaryCount });
  const SummaryIcon =
    opsFocus === 'moveIns' ? CalendarDays : status === 'AVAILABLE' ? BedSingle : BedDouble;

  const summaryBlock =
    showSummary && !beds.loading && !listPending && summaryCount > 0 ? (
      <View style={styles.summaryCard}>
        <View style={styles.summaryIcon}>
          <SummaryIcon size={16} color={colors.primaryDark} strokeWidth={2.2} />
        </View>
        <View style={styles.summaryText}>
          <Text style={styles.summaryPrimary}>{summaryLabel}</Text>
          <Text style={styles.summaryScope}>{summaryScope}</Text>
        </View>
      </View>
    ) : null;

  const filtersBar = (
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
  );

  const searchBar = (
    <ListSearchBar
      value={searchQuery}
      onChangeText={setSearchQuery}
      placeholder={t('dashboard.drilldown.searchBeds')}
    />
  );

  const filtersAndSearch = (
    <>
      {filtersBar}
      {searchBar}
    </>
  );

  type UnifiedListRow =
    | { kind: 'accessory' }
    | { kind: 'subtitle' }
    | { kind: 'filters' }
    | { kind: 'search' }
    | { kind: 'summary' }
    | { kind: 'group'; group: BedInventoryListGroup };

  const showSummaryRow =
    showSummary && !beds.loading && !listPending && summaryCount > 0;

  /**
   * All page chrome lives in `data` (no ListHeaderComponent) so stickyHeaderIndices
   * can pin only the search row. RN treats sticky index 0 as ListHeaderComponent when
   * that prop is set — which previously pinned the ops cards.
   */
  const { unifiedRows, stickySearchIndex } = useMemo(() => {
    const rows: UnifiedListRow[] = [];
    if (headerAccessory) {
      rows.push({ kind: 'accessory' });
    }
    if (showSubtitle) {
      rows.push({ kind: 'subtitle' });
    }
    rows.push({ kind: 'filters' });
    rows.push({ kind: 'search' });
    const searchIndex = rows.length - 1;
    if (showSummaryRow) {
      rows.push({ kind: 'summary' });
    }
    for (const group of inventoryGroups) {
      rows.push({ kind: 'group', group });
    }
    return { unifiedRows: rows, stickySearchIndex: searchIndex };
  }, [headerAccessory, inventoryGroups, showSubtitle, showSummaryRow]);

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
    if (listPending || (beds.loading && beds.items.length === 0)) {
      return <InventoryListSkeleton cards={3} />;
    }
    if (beds.error) {
      return (
        <EmptyState
          Icon={BedDouble}
          title={t('common.errors.generic')}
          description={beds.error}
        />
      );
    }
    return (
      <EmptyState
        Icon={status === 'AVAILABLE' ? BedSingle : BedDouble}
        title={empty.title}
        description={empty.description}
      />
    );
  }, [beds.error, beds.items.length, beds.loading, empty.description, empty.title, listPending, status, t]);

  const renderUnifiedRow = useCallback(
    ({ item }: { item: UnifiedListRow }) => {
      if (item.kind === 'accessory') {
        return <View style={styles.headerAccessory}>{headerAccessory}</View>;
      }
      if (item.kind === 'subtitle') {
        return (
          <Text style={[styles.subtitle, compactPadding && styles.subtitleCompact]}>
            {resolvedSubtitle}
          </Text>
        );
      }
      if (item.kind === 'filters') {
        return filtersBar;
      }
      if (item.kind === 'search') {
        return (
          <View style={styles.stickySearch}>
            <ListSearchBar
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholder={t('dashboard.drilldown.searchBeds')}
            />
          </View>
        );
      }
      if (item.kind === 'summary') {
        return summaryBlock;
      }
      return renderInventoryGroup({ item: item.group });
    },
    [
      compactPadding,
      filtersBar,
      headerAccessory,
      renderInventoryGroup,
      resolvedSubtitle,
      searchQuery,
      summaryBlock,
      t,
    ],
  );

  const unifiedRowKey = useCallback(
    (item: UnifiedListRow) => {
      if (item.kind === 'group') {
        return inventoryGroupKey(item.group);
      }
      return item.kind;
    },
    [inventoryGroupKey],
  );

  if (unifiedScroll) {
    const showEmptyFooter = inventoryGroups.length === 0;
    return (
      <View ref={overlayHostRef} style={[styles.body, contentStyle]}>
        <FlatList
          data={unifiedRows}
          keyExtractor={unifiedRowKey}
          renderItem={renderUnifiedRow}
          stickyHeaderIndices={[stickySearchIndex]}
          refreshControl={
            <RefreshControl refreshing={beds.refreshing} onRefresh={() => void beds.refresh()} />
          }
          contentContainerStyle={[
            styles.listContent,
            inventoryGroups.length === 0 && styles.listContentEmpty,
            listContentStyle,
          ]}
          initialNumToRender={8}
          maxToRenderPerBatch={4}
          windowSize={7}
          removeClippedSubviews={false}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          style={styles.unifiedList}
          ListFooterComponent={
            beds.loadingMore ? (
              <ActivityIndicator color={colors.primary} style={styles.footerLoader} />
            ) : showEmptyFooter ? (
              emptyComponent
            ) : null
          }
        />
        {filterOverlayLayout ? (
          <DashboardBedInventoryFilterDropdownOverlay
            layout={filterOverlayLayout}
            onSelect={value =>
              filtersBarRef.current?.selectOption(value, filterOverlayLayout.openField)
            }
            onClose={() => filtersBarRef.current?.closeDropdown()}
          />
        ) : null}
      </View>
    );
  }

  return (
    <View ref={overlayHostRef} style={[styles.body, contentStyle]}>
      {fixedHeader}
      {listPending || (beds.loading && beds.items.length === 0) ? (
        <InventoryListSkeleton cards={3} />
      ) : beds.error ? (
        <EmptyState
          Icon={BedDouble}
          title={t('common.errors.generic')}
          description={beds.error}
        />
      ) : inventoryGroups.length === 0 ? (
        <>
          {listHeader}
          <EmptyState
            Icon={status === 'AVAILABLE' ? BedSingle : BedDouble}
            title={empty.title}
            description={empty.description}
          />
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
          removeClippedSubviews={false}
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
          onSelect={value =>
            filtersBarRef.current?.selectOption(value, filterOverlayLayout.openField)
          }
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
  stickySearch: {
    backgroundColor: colors.background,
    zIndex: 2,
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
  summaryCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.md,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    backgroundColor: colors.white,
    borderRadius: radius.card,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadows.sm,
  },
  summaryIcon: {
    width: 36,
    height: 36,
    borderRadius: radius.button,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.lightGreen,
  },
  summaryText: {
    flex: 1,
    minWidth: 0,
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
