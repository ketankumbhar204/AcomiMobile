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
import { useNavigation } from '@react-navigation/native';
import type { CompositeNavigationProp } from '@react-navigation/native';
import type { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useTranslation } from 'react-i18next';
import { Building2, Search, UtensilsCrossed } from 'lucide-react-native';
import { getSpaceTypeLabel } from '../api';
import { spaceDiscoverApi } from '../api/spaceDiscoverApi';
import type { DiscoverSpaceCardResponse, SpaceType } from '../api/types';
import { ApiError } from '../api/types';
import { DiscoverSpaceCard } from '../components/discovery/DiscoverSpaceCard';
import {
  Button,
  EmptyState,
  ListFilterChips,
  ListSearchBar,
  SkeletonCard,
} from '../components/ui';
import type { ListFilterChipOption } from '../components/ui/ListFilterChips';
import type { MainStackParamList, MemberTabParamList } from '../navigation/types';
import { colors, radius, spacing, typography } from '../theme';

type Nav = CompositeNavigationProp<
  BottomTabNavigationProp<MemberTabParamList, 'FindAPlace'>,
  NativeStackNavigationProp<MainStackParamList>
>;

type DiscoverCategory = 'places' | 'mess';
type PlaceTypeFilter = 'ALL' | Exclude<SpaceType, 'MESS'>;

const PAGE_SIZE = 20;
const SEARCH_DEBOUNCE_MS = 300;
const PLACE_TYPES: Array<Exclude<SpaceType, 'MESS'>> = [
  'PG',
  'HOSTEL',
  'CO_LIVING',
  'RENTAL',
];

export function FindAPlaceScreen() {
  const { t, i18n } = useTranslation();
  const navigation = useNavigation<Nav>();

  const [category, setCategory] = useState<DiscoverCategory>('places');
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [placeTypeFilter, setPlaceTypeFilter] = useState<PlaceTypeFilter>('ALL');
  const [items, setItems] = useState<DiscoverSpaceCardResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(false);
  const [totalElements, setTotalElements] = useState(0);
  const pageRef = useRef(0);
  const requestSeq = useRef(0);

  useLayoutEffect(() => {
    navigation.setOptions({
      title: t('navigation.findAPlace'),
    });
  }, [navigation, t, i18n.language]);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search.trim()), SEARCH_DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [search]);

  useEffect(() => {
    setPlaceTypeFilter('ALL');
    setSearch('');
    setDebouncedSearch('');
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

  const apiType: SpaceType | undefined =
    category === 'mess'
      ? 'MESS'
      : placeTypeFilter === 'ALL'
        ? undefined
        : placeTypeFilter;

  const loadPage = useCallback(
    async (page: number, append: boolean) => {
      const seq = ++requestSeq.current;
      if (append) {
        setLoadingMore(true);
      } else {
        setLoading(true);
        setError(null);
      }

      try {
        const data = await spaceDiscoverApi.discoverSpaces({
          search: debouncedSearch || undefined,
          type: apiType,
          page,
          size: PAGE_SIZE,
          sort: 'newest',
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
        setItems(prev => (append ? [...prev, ...content] : content));
      } catch (err) {
        if (seq !== requestSeq.current) {
          return;
        }
        const message =
          err instanceof ApiError ? err.message : t('spaces.findPlace.loadError');
        setError(message);
        if (!append) {
          setItems([]);
          setHasMore(false);
          setTotalElements(0);
        }
      } finally {
        if (seq === requestSeq.current) {
          setLoading(false);
          setLoadingMore(false);
        }
      }
    },
    [apiType, category, debouncedSearch, t],
  );

  useEffect(() => {
    pageRef.current = 0;
    void loadPage(0, false);
  }, [loadPage]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    pageRef.current = 0;
    await loadPage(0, false);
    setRefreshing(false);
  }, [loadPage]);

  const onEndReached = useCallback(() => {
    if (loading || loadingMore || !hasMore || refreshing) {
      return;
    }
    void loadPage(pageRef.current + 1, true);
  }, [hasMore, loading, loadingMore, loadPage, refreshing]);

  const isMess = category === 'mess';
  const isFiltering =
    debouncedSearch.length > 0 || (!isMess && placeTypeFilter !== 'ALL');
  const showInitialLoading = loading && items.length === 0 && !error;

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
        <ListFilterChips
          options={placeTypeOptions}
          value={placeTypeFilter}
          onChange={setPlaceTypeFilter}
        />
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
          void loadPage(0, false);
        }}
        style={styles.retryButton}
      />
    </View>
  ) : (
    <EmptyState
      Icon={isMess ? UtensilsCrossed : Search}
      title={
        isFiltering
          ? t('spaces.findPlace.searchEmptyTitle')
          : isMess
            ? t('spaces.findPlace.tabs.messEmptyTitle')
            : t('spaces.findPlace.emptyTitle')
      }
      description={
        isFiltering
          ? t('spaces.findPlace.searchEmptyDescription')
          : isMess
            ? t('spaces.findPlace.tabs.messEmptyDescription')
            : t('spaces.findPlace.emptyDescription')
      }
    />
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
          />
        )}
        ListHeaderComponent={listHeader}
        ListEmptyComponent={listEmpty}
        ListFooterComponent={
          loadingMore ? (
            <ActivityIndicator
              color={colors.primary}
              style={styles.footerLoader}
            />
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
});
