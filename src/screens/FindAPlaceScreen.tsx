import React, { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { CompositeNavigationProp, RouteProp } from '@react-navigation/native';
import type { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useTranslation } from 'react-i18next';
import { Building2, MapPin, Search, SlidersHorizontal, UtensilsCrossed, X } from 'lucide-react-native';
import { DISCOVER_PAGE_SIZE, getSpaceTypeLabel, locationsApi } from '../api';
import { discoverFilterKey } from '../api/discoverQuery';
import { spaceDiscoverApi } from '../api/spaceDiscoverApi';
import type { DiscoverSpaceCardResponse, SpaceType } from '../api/types';
import { ApiError } from '../api/types';
import { EnquireDialog } from '../components/EnquireDialog';
import { DiscoverLocationSheet } from '../components/discovery/DiscoverLocationSheet';
import { DiscoverSpaceCard } from '../components/discovery/DiscoverSpaceCard';
import {
  Button,
  EmptyState,
  FilterCheckboxRow,
  FilterDrawerSection,
  FilterRadioRow,
  ListFilterChips,
  ListFilterDrawer,
  ListSearchBar,
  SkeletonCard,
} from '../components/ui';
import type { ListFilterChipOption } from '../components/ui/ListFilterChips';
import type { MainStackParamList, MemberTabParamList } from '../navigation/types';
import { colors, radius, spacing, typography } from '../theme';
import {
  formatDiscoverLocationLabel,
  matchLocationRecord,
  shouldPromptDiscoverLocation,
  toSelectedDiscoverLocation,
  type SelectedDiscoverLocation,
} from '../utils/discoverLocation';
import { PRESET_AMENITY_CODES, resolvePresetAmenityLabel } from '../utils/amenities';

type Nav = CompositeNavigationProp<
  BottomTabNavigationProp<MemberTabParamList, 'FindAPlace'>,
  NativeStackNavigationProp<MainStackParamList>
>;
type Route = RouteProp<MemberTabParamList, 'FindAPlace'>;

type DiscoverCategory = 'places' | 'mess';
type PlaceTypeFilter = 'ALL' | Exclude<SpaceType, 'MESS'>;
type RentPreset = 'any' | 'under8k' | 'mid' | 'over15k';

const SEARCH_DEBOUNCE_MS = 300;
const PLACE_TYPES: Array<Exclude<SpaceType, 'MESS'>> = [
  'PG',
  'HOSTEL',
  'CO_LIVING',
  'RENTAL',
];
const AMENITY_FILTER_CODES = PRESET_AMENITY_CODES.filter(code => code !== 'BEDS');

function rentFromPreset(preset: RentPreset): { minRent: number | null; maxRent: number | null } {
  switch (preset) {
    case 'under8k':
      return { minRent: null, maxRent: 8000 };
    case 'mid':
      return { minRent: 5000, maxRent: 15000 };
    case 'over15k':
      return { minRent: 15000, maxRent: null };
    default:
      return { minRent: null, maxRent: null };
  }
}

function presetFromRent(minRent: number | null, maxRent: number | null): RentPreset {
  if (minRent === 5000 && maxRent === 15000) {
    return 'mid';
  }
  if (minRent == null && maxRent === 8000) {
    return 'under8k';
  }
  if (minRent === 15000 && maxRent == null) {
    return 'over15k';
  }
  return 'any';
}

function mergeUnique(
  current: DiscoverSpaceCardResponse[],
  incoming: DiscoverSpaceCardResponse[],
  append: boolean,
): DiscoverSpaceCardResponse[] {
  const next = append ? [...current, ...incoming] : incoming;
  const seen = new Set<string>();
  return next.filter(item => {
    if (seen.has(item.spaceId)) {
      return false;
    }
    seen.add(item.spaceId);
    return true;
  });
}

export function FindAPlaceScreen() {
  const { t, i18n } = useTranslation();
  const navigation = useNavigation<Nav>();
  const route = useRoute<Route>();

  const skipCategoryReset = useRef(true);
  const [category, setCategory] = useState<DiscoverCategory>(() =>
    route.params?.category === 'mess' || route.params?.category === 'places'
      ? route.params.category
      : 'places',
  );
  const [search, setSearch] = useState(() => route.params?.search?.trim() ?? '');
  const [debouncedSearch, setDebouncedSearch] = useState(() => route.params?.search?.trim() ?? '');
  const [placeTypeFilter, setPlaceTypeFilter] = useState<PlaceTypeFilter>('ALL');
  const [selectedLocation, setSelectedLocation] = useState<SelectedDiscoverLocation | null>(() =>
    route.params?.location?.trim()
      ? {
          location: route.params.location.trim(),
          district: route.params.district?.trim() ?? '',
          state: route.params.state?.trim() ?? '',
          cityTaluka: route.params.cityTaluka?.trim() ?? '',
          pincode: route.params.pincode?.trim() ?? '',
        }
      : null,
  );
  const [minRent, setMinRent] = useState<number | null>(null);
  const [maxRent, setMaxRent] = useState<number | null>(null);
  const [amenities, setAmenities] = useState<string[]>([]);
  const [locationOpen, setLocationOpen] = useState(false);
  const [filterOpen, setFilterOpen] = useState(false);
  const [draftRent, setDraftRent] = useState<RentPreset>('any');
  const [draftAmenities, setDraftAmenities] = useState<string[]>([]);
  const [items, setItems] = useState<DiscoverSpaceCardResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loadMoreError, setLoadMoreError] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const [totalElements, setTotalElements] = useState(0);
  const [enquireItem, setEnquireItem] = useState<DiscoverSpaceCardResponse | null>(null);
  const pageRef = useRef(0);
  const requestSeq = useRef(0);
  const inflightPageRef = useRef<number | null>(null);
  const appliedRouteKey = useRef<string | null>(null);
  const locationPromptedFor = useRef<DiscoverCategory | null>(null);
  const [routeReady, setRouteReady] = useState(false);

  useLayoutEffect(() => {
    navigation.setOptions({
      title: t('navigation.findAPlace'),
    });
  }, [navigation, t, i18n.language]);

  useEffect(() => {
    const params = route.params;
    const key = JSON.stringify(params ?? {});
    if (appliedRouteKey.current === key) {
      setRouteReady(true);
      return;
    }
    appliedRouteKey.current = key;
    if (params?.category === 'places' || params?.category === 'mess') {
      skipCategoryReset.current = true;
      setCategory(params.category);
    }
    if (params?.location?.trim()) {
      setSelectedLocation({
        location: params.location.trim(),
        district: params.district?.trim() ?? '',
        state: params.state?.trim() ?? '',
        cityTaluka: params.cityTaluka?.trim() ?? '',
        pincode: params.pincode?.trim() ?? '',
      });
      if (params.search?.trim()) {
        setSearch(params.search);
      }
    }
    setRouteReady(true);
  }, [route.params]);

  useEffect(() => {
    if (
      !shouldPromptDiscoverLocation({
        routeReady,
        hasLocation: Boolean(selectedLocation?.location),
        category,
        promptedFor: locationPromptedFor.current,
      })
    ) {
      if (selectedLocation?.location) {
        locationPromptedFor.current = category;
      }
      return;
    }
    locationPromptedFor.current = category;
    setLocationOpen(true);
  }, [category, routeReady, selectedLocation?.location]);

  useEffect(() => {
    if (!selectedLocation?.location || selectedLocation.district) {
      return;
    }
    let active = true;
    const lookup = selectedLocation.pincode || selectedLocation.location;
    locationsApi
      .search(lookup, {
        state: selectedLocation.state,
        district: selectedLocation.district,
        taluk: selectedLocation.cityTaluka,
      })
      .then(results => {
        if (!active) {
          return;
        }
        const match = matchLocationRecord(results, selectedLocation);
        if (!match?.district) {
          return;
        }
        setSelectedLocation(current => {
          if (!current || current.district) {
            return current;
          }
          return toSelectedDiscoverLocation({
            ...match,
            location: current.location,
            pincode: current.pincode || match.pincode,
          });
        });
      })
      .catch(() => undefined);
    return () => {
      active = false;
    };
  }, [selectedLocation]);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search.trim()), SEARCH_DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [search]);

  useEffect(() => {
    if (skipCategoryReset.current) {
      skipCategoryReset.current = false;
      return;
    }
    setPlaceTypeFilter('ALL');
    setSearch('');
    setDebouncedSearch('');
    setMinRent(null);
    setMaxRent(null);
    setAmenities([]);
  }, [category]);

  const placeTypeOptions = useMemo<ListFilterChipOption<PlaceTypeFilter>[]>(
    () => [
      { id: 'ALL', label: t('spaces.findPlace.typeAll') },
      ...PLACE_TYPES.map(type => ({
        id: type as PlaceTypeFilter,
        label: getSpaceTypeLabel(type),
      })),
    ],
    [t],
  );

  const isMess = category === 'mess';
  const placeTypes = !isMess && placeTypeFilter === 'ALL' ? PLACE_TYPES : undefined;
  const apiType: SpaceType | undefined = isMess
    ? 'MESS'
    : placeTypeFilter === 'ALL'
      ? undefined
      : placeTypeFilter;

  const discoverParams = useMemo(
    () => ({
      search: debouncedSearch || undefined,
      location: selectedLocation?.location || undefined,
      type: apiType,
      types: placeTypes,
      minRent: isMess ? null : minRent,
      maxRent: isMess ? null : maxRent,
      amenities: isMess || amenities.length === 0 ? undefined : amenities,
      size: DISCOVER_PAGE_SIZE,
      sort: 'newest' as const,
    }),
    [amenities, apiType, debouncedSearch, isMess, maxRent, minRent, placeTypes, selectedLocation?.location],
  );
  const filterKey = discoverFilterKey(discoverParams);

  const loadPage = useCallback(
    async (page: number, append: boolean) => {
      if (append && inflightPageRef.current != null) {
        return;
      }
      const seq = ++requestSeq.current;
      inflightPageRef.current = page;
      if (append) {
        setLoadingMore(true);
        setLoadMoreError(false);
      } else {
        setLoading(true);
        setError(null);
        setLoadMoreError(false);
      }

      try {
        const data = await spaceDiscoverApi.discoverSpaces({
          ...discoverParams,
          page,
        });

        if (seq !== requestSeq.current) {
          return;
        }

        const content =
          category === 'mess'
            ? data.content.filter(item => item.type === 'MESS')
            : data.content.filter(item =>
                PLACE_TYPES.includes(item.type as Exclude<SpaceType, 'MESS'>),
              );

        pageRef.current = data.page;
        setHasMore(!data.last);
        setTotalElements(data.totalElements ?? content.length);
        setItems(prev => mergeUnique(prev, content, append));
      } catch (err) {
        if (seq !== requestSeq.current) {
          return;
        }
        const message =
          err instanceof ApiError ? err.message : t('spaces.findPlace.loadError');
        if (append) {
          setLoadMoreError(true);
          setError(message);
        } else {
          setError(message);
          setItems([]);
          setHasMore(false);
          setTotalElements(0);
        }
      } finally {
        if (seq === requestSeq.current) {
          inflightPageRef.current = null;
          setLoading(false);
          setLoadingMore(false);
        }
      }
    },
    [category, discoverParams, t],
  );

  useEffect(() => {
    pageRef.current = 0;
    inflightPageRef.current = null;
    void loadPage(0, false);
  }, [filterKey, loadPage]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    pageRef.current = 0;
    inflightPageRef.current = null;
    await loadPage(0, false);
    setRefreshing(false);
  }, [loadPage]);

  const onEndReached = useCallback(() => {
    if (loading || loadingMore || !hasMore || refreshing || loadMoreError) {
      return;
    }
    void loadPage(pageRef.current + 1, true);
  }, [hasMore, loadMoreError, loading, loadingMore, loadPage, refreshing]);

  const extraFiltersActive = !isMess && (minRent != null || maxRent != null || amenities.length > 0);
  const isFiltering =
    debouncedSearch.length > 0 ||
    (!isMess && placeTypeFilter !== 'ALL') ||
    Boolean(selectedLocation?.location) ||
    extraFiltersActive;
  const showInitialLoading = loading && items.length === 0 && !error;

  const openFilters = () => {
    setDraftRent(presetFromRent(minRent, maxRent));
    setDraftAmenities(amenities);
    setFilterOpen(true);
  };

  const listHeader = (
    <View style={styles.header}>
      <View style={styles.categoryRow}>
        <Pressable
          onPress={() => setCategory('places')}
          style={[styles.categoryTab, !isMess && styles.categoryTabActive]}
          accessibilityRole="tab"
          accessibilityState={{ selected: !isMess }}>
          <Building2
            size={15}
            color={!isMess ? colors.white : colors.textSecondary}
            strokeWidth={2.2}
          />
          <Text style={[styles.categoryLabel, !isMess && styles.categoryLabelActive]}>
            {t('spaces.findPlace.tabs.places')}
          </Text>
        </Pressable>
        <Pressable
          onPress={() => setCategory('mess')}
          style={[styles.categoryTab, isMess && styles.categoryTabActive]}
          accessibilityRole="tab"
          accessibilityState={{ selected: isMess }}>
          <UtensilsCrossed
            size={15}
            color={isMess ? colors.white : colors.textSecondary}
            strokeWidth={2.2}
          />
          <Text style={[styles.categoryLabel, isMess && styles.categoryLabelActive]}>
            {t('spaces.findPlace.tabs.mess')}
          </Text>
        </Pressable>
      </View>

      <Text style={styles.eyebrow}>
        {isMess ? t('spaces.findPlace.tabs.messEyebrow') : t('spaces.findPlace.eyebrow')}
      </Text>
      <Text style={styles.heading}>
        {isMess ? t('spaces.findPlace.tabs.messTitle') : t('spaces.findPlace.heading')}
      </Text>
      <Text style={styles.subheading}>
        {isMess
          ? t('spaces.findPlace.tabs.messSubtitle')
          : t('spaces.findPlace.subheading')}
      </Text>

      <View style={styles.locationRow}>
        <Pressable
          onPress={() => setLocationOpen(true)}
          style={styles.locationChip}
          accessibilityRole="button"
          accessibilityLabel={
            selectedLocation
              ? formatDiscoverLocationLabel(selectedLocation)
              : t('spaces.findPlace.selectLocation')
          }>
          <MapPin size={16} color={colors.primaryDark} strokeWidth={2.2} />
          <Text style={styles.locationChipText} numberOfLines={1}>
            {selectedLocation
              ? formatDiscoverLocationLabel(selectedLocation)
              : t('spaces.findPlace.selectLocation')}
          </Text>
        </Pressable>
        {selectedLocation ? (
          <Pressable
            onPress={() => setSelectedLocation(null)}
            style={styles.clearLocation}
            accessibilityRole="button"
            accessibilityLabel={t('spaces.findPlace.clearLocation')}>
            <X size={16} color={colors.textSecondary} strokeWidth={2.2} />
          </Pressable>
        ) : null}
      </View>

      <ListSearchBar
        value={search}
        onChangeText={setSearch}
        placeholder={
          isMess
            ? t('spaces.findPlace.tabs.messSearchPlaceholder')
            : t('spaces.findPlace.searchPlaceholder')
        }
      />
      {!isMess ? (
        <View style={styles.filterRow}>
          <View style={styles.typeChips}>
            <ListFilterChips
              options={placeTypeOptions}
              value={placeTypeFilter}
              onChange={setPlaceTypeFilter}
            />
          </View>
          <Pressable
            onPress={openFilters}
            style={[styles.moreFilters, extraFiltersActive && styles.moreFiltersActive]}
            accessibilityRole="button"
            accessibilityLabel={t('spaces.findPlace.moreFilters')}>
            <SlidersHorizontal
              size={16}
              color={extraFiltersActive ? colors.white : colors.textSecondary}
              strokeWidth={2.2}
            />
          </Pressable>
        </View>
      ) : null}
      {!loading && !error ? (
        <Text style={styles.resultCount}>
          {isMess
            ? t('spaces.findPlace.tabs.messResultCount', { count: totalElements })
            : t('spaces.findPlace.resultCount', { count: totalElements })}
        </Text>
      ) : null}
      {error && items.length > 0 ? (
        <Text style={styles.errorInline}>{error}</Text>
      ) : null}
    </View>
  );

  const emptyTitle = selectedLocation
    ? isMess
      ? t('spaces.findPlace.tabs.messLocationEmptyTitle', { location: selectedLocation.location })
      : t('spaces.findPlace.locationEmptyTitle', { location: selectedLocation.location })
    : isFiltering
      ? t('spaces.findPlace.searchEmptyTitle')
      : isMess
        ? t('spaces.findPlace.tabs.messEmptyTitle')
        : t('spaces.findPlace.emptyTitle');
  const emptyDescription = selectedLocation
    ? isMess
      ? t('spaces.findPlace.tabs.messLocationEmptyDescription')
      : t('spaces.findPlace.locationEmptyDescription')
    : isFiltering
      ? t('spaces.findPlace.searchEmptyDescription')
      : isMess
        ? t('spaces.findPlace.tabs.messEmptyDescription')
        : t('spaces.findPlace.emptyDescription');

  const listEmpty = showInitialLoading ? (
    <View style={styles.skeletonWrap}>
      <SkeletonCard />
      <SkeletonCard />
      <SkeletonCard />
    </View>
  ) : error ? (
    <View style={styles.emptyWrap}>
      <EmptyState
        Icon={Search}
        title={t('spaces.findPlace.errorTitle')}
        description={error}
      />
      <Button
        label={t('spaces.findPlace.retry')}
        onPress={() => {
          pageRef.current = 0;
          inflightPageRef.current = null;
          void loadPage(0, false);
        }}
        style={styles.retryButton}
      />
    </View>
  ) : (
    <EmptyState Icon={isMess ? UtensilsCrossed : Search} title={emptyTitle} description={emptyDescription} />
  );

  return (
    <View style={styles.root}>
      <FlatList
        data={items}
        keyExtractor={item => item.spaceId}
        renderItem={({ item }) => (
          <DiscoverSpaceCard
            item={item}
            onPress={() =>
              navigation.navigate('FindAPlaceDetail', { spaceId: item.spaceId })
            }
            onEnquire={() => setEnquireItem(item)}
          />
        )}
        ListHeaderComponent={listHeader}
        ListEmptyComponent={listEmpty}
        ListFooterComponent={
          loadingMore ? (
            <ActivityIndicator color={colors.primary} style={styles.footerLoader} />
          ) : loadMoreError ? (
            <View style={styles.footerRetry}>
              <Button
                label={t('spaces.findPlace.loadMoreRetry')}
                variant="ghost"
                onPress={() => {
                  inflightPageRef.current = null;
                  void loadPage(pageRef.current + 1, true);
                }}
              />
            </View>
          ) : null
        }
        contentContainerStyle={styles.listContent}
        ItemSeparatorComponent={DiscoverListSeparator}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.primary}
            colors={[colors.primary]}
          />
        }
        onEndReached={onEndReached}
        onEndReachedThreshold={0.4}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      />

      <DiscoverLocationSheet
        visible={locationOpen}
        onClose={() => setLocationOpen(false)}
        onSelect={setSelectedLocation}
        rankingContext={
          selectedLocation
            ? {
                state: selectedLocation.state,
                district: selectedLocation.district,
                taluk: selectedLocation.cityTaluka,
              }
            : undefined
        }
      />

      <ListFilterDrawer
        visible={filterOpen}
        title={t('spaces.findPlace.moreFilters')}
        onClose={() => setFilterOpen(false)}
        onReset={() => {
          setDraftRent('any');
          setDraftAmenities([]);
        }}
        onApply={() => {
          const next = rentFromPreset(draftRent);
          setMinRent(next.minRent);
          setMaxRent(next.maxRent);
          setAmenities(draftAmenities);
          setFilterOpen(false);
        }}>
        <FilterDrawerSection title={t('spaces.findPlace.rentRange')}>
          {(['any', 'under8k', 'mid', 'over15k'] as const).map(preset => (
            <FilterRadioRow
              key={preset}
              label={t(`spaces.findPlace.rent.${preset}`)}
              selected={draftRent === preset}
              onSelect={() => setDraftRent(preset)}
            />
          ))}
        </FilterDrawerSection>
        <FilterDrawerSection title={t('spaces.amenities.title')}>
          {AMENITY_FILTER_CODES.map(code => (
            <FilterCheckboxRow
              key={code}
              label={resolvePresetAmenityLabel(code, t)}
              checked={draftAmenities.includes(code)}
              onToggle={() =>
                setDraftAmenities(current =>
                  current.includes(code)
                    ? current.filter(item => item !== code)
                    : [...current, code],
                )
              }
            />
          ))}
        </FilterDrawerSection>
      </ListFilterDrawer>

      <EnquireDialog
        open={enquireItem != null}
        spaceId={enquireItem?.spaceId ?? ''}
        spaceName={enquireItem?.name ?? ''}
        ownedByCurrentUser={Boolean(enquireItem?.ownedByCurrentUser)}
        onClose={() => setEnquireItem(null)}
      />
    </View>
  );
}

function DiscoverListSeparator() {
  return <View style={styles.separator} />;
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.background,
  },
  listContent: {
    padding: spacing.xxl,
    paddingBottom: spacing.section,
    flexGrow: 1,
  },
  header: {
    marginBottom: spacing.md,
    gap: spacing.sm,
  },
  categoryRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.xs,
  },
  categoryTab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    minHeight: 40,
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.white,
    paddingHorizontal: spacing.md,
  },
  categoryTabActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  categoryLabel: {
    ...typography.caption,
    fontWeight: '700',
    color: colors.textSecondary,
  },
  categoryLabelActive: {
    color: colors.white,
  },
  eyebrow: {
    ...typography.caption,
    fontWeight: '800',
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    color: colors.primaryDark,
  },
  heading: {
    ...typography.h2,
    fontSize: 24,
    lineHeight: 30,
    color: colors.textPrimary,
  },
  subheading: {
    ...typography.body,
    color: colors.textSecondary,
    marginBottom: spacing.xs,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  locationChip: {
    flex: 1,
    minHeight: 44,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.white,
    paddingHorizontal: spacing.md,
  },
  locationChipText: {
    ...typography.body,
    fontSize: 14,
    fontWeight: '600',
    color: colors.textPrimary,
    flex: 1,
  },
  clearLocation: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.border,
  },
  filterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  typeChips: {
    flex: 1,
    minWidth: 0,
  },
  moreFilters: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.border,
  },
  moreFiltersActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  resultCount: {
    ...typography.caption,
    fontWeight: '600',
    color: colors.textSecondary,
    marginTop: spacing.xs,
  },
  separator: {
    height: spacing.md,
  },
  skeletonWrap: {
    gap: spacing.md,
    marginTop: spacing.md,
  },
  emptyWrap: {
    alignItems: 'center',
    marginTop: spacing.lg,
  },
  retryButton: {
    marginTop: spacing.md,
    minWidth: 160,
  },
  errorInline: {
    ...typography.caption,
    color: colors.primaryDark,
  },
  footerLoader: {
    marginVertical: spacing.lg,
  },
  footerRetry: {
    marginVertical: spacing.md,
    alignItems: 'center',
  },
});
