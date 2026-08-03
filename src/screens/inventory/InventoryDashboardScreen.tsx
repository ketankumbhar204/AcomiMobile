import React, { useCallback, useLayoutEffect, useMemo, useState } from 'react';
import {
  FlatList,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RouteProp } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import { ChevronRight, TriangleAlert } from 'lucide-react-native';
import type { InventoryItemListFilter, InventoryStockStatus } from '../../api/inventoryTypes';
import { InventoryItemCard } from '../../components/inventory';
import { MealFormHero } from '../../components/meals/MealFormHero';
import {
  EmptyState,
  FAB,
  HeaderBackButton,
  ListFilterChips,
  ListSearchBar,
  PermissionDeniedScreen,
  Screen,
  SkeletonCard,
} from '../../components/ui';
import type { ListFilterChipOption } from '../../components/ui/ListFilterChips';
import { useInventoryItems } from '../../hooks/useInventory';
import { useInventoryProfile } from '../../hooks/useInventoryProfile';
import type { MainStackParamList } from '../../navigation/types';
import { colors, radius, spacing, typography } from '../../theme';
import { deriveInventoryStockStatus } from '../../utils/inventoryVisuals';

type Route = RouteProp<MainStackParamList, 'InventoryDashboard' | 'InventoryItems'>;
type Nav = NativeStackNavigationProp<
  MainStackParamList,
  'InventoryDashboard' | 'InventoryItems'
>;

type CatalogFilter = InventoryItemListFilter | 'ATTENTION';

function resolveInitialFilter(
  stockFilter?: MainStackParamList['InventoryDashboard']['stockFilter'],
): CatalogFilter {
  if (stockFilter === 'OUT_OF_STOCK' || stockFilter === 'CRITICAL') {
    return 'CRITICAL';
  }
  if (stockFilter === 'LOW' || stockFilter === 'ATTENTION') {
    return 'ATTENTION';
  }
  return 'ALL';
}

/**
 * Inventory home = catalog. One scroll: summary, search, filters, items.
 * Stock In / Out / Edit live on the item — not as global destinations.
 */
export function InventoryDashboardScreen() {
  const { t } = useTranslation();
  const navigation = useNavigation<Nav>();
  const route = useRoute<Route>();
  const { spaceId, stockFilter: initialFilter } = route.params;
  const { spaceType, profile, canView, canManage } = useInventoryProfile(spaceId);

  const { items, loading, error, reload } = useInventoryItems(spaceId, spaceType, canView);
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState<CatalogFilter>(() =>
    resolveInitialFilter(initialFilter),
  );

  useLayoutEffect(() => {
    navigation.setOptions({
      title: t(profile.moduleTitleKey, { defaultValue: profile.moduleTitleDefault }),
      headerBackVisible: false,
      headerLeft: () => <HeaderBackButton />,
    });
  }, [navigation, profile.moduleTitleDefault, profile.moduleTitleKey, t]);

  const needAttention = useMemo(
    () =>
      items.filter(item => {
        const status = deriveInventoryStockStatus(item);
        return status === 'LOW' || status === 'CRITICAL' || status === 'OUT_OF_STOCK';
      }).length,
    [items],
  );

  const statusLabel = useCallback(
    (status: InventoryStockStatus) => {
      if (status === 'OUT_OF_STOCK') {
        return t('inventory.status.CRITICAL', { defaultValue: 'Critical' });
      }
      if (status === 'LOW') {
        return t('inventory.status.LOW', { defaultValue: 'Low' });
      }
      if (status === 'CRITICAL') {
        return t('inventory.status.CRITICAL', { defaultValue: 'Critical' });
      }
      if (status === 'HEALTHY') {
        return t('inventory.status.HEALTHY', { defaultValue: 'Healthy' });
      }
      return t(`inventory.status.${status}`, { defaultValue: status });
    },
    [t],
  );

  const filterOptions = useMemo<ListFilterChipOption<InventoryItemListFilter>[]>(
    () => [
      { id: 'ALL', label: t('list.filters.all') },
      { id: 'LOW', label: t('inventory.status.LOW', { defaultValue: 'Low' }), tone: 'warning' },
      {
        id: 'CRITICAL',
        label: t('inventory.status.CRITICAL', { defaultValue: 'Critical' }),
        tone: 'warning',
      },
    ],
    [t],
  );

  const chipValue: InventoryItemListFilter =
    filter === 'ATTENTION' ? 'ALL' : filter === 'HEALTHY' ? 'ALL' : filter;

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return items.filter(item => {
      const status = deriveInventoryStockStatus(item);
      if (filter === 'ATTENTION') {
        if (status !== 'LOW' && status !== 'CRITICAL' && status !== 'OUT_OF_STOCK') {
          return false;
        }
      } else if (filter === 'LOW' && status !== 'LOW') {
        return false;
      } else if (
        filter === 'CRITICAL' &&
        status !== 'CRITICAL' &&
        status !== 'OUT_OF_STOCK'
      ) {
        return false;
      }
      if (!q) {
        return true;
      }
      return item.name.toLowerCase().includes(q);
    });
  }, [filter, items, query]);

  if (!canView) {
    return <PermissionDeniedScreen spaceId={spaceId} />;
  }

  const summaryLine = t('inventory.hero.summaryLine', {
    items: items.length,
    attention: needAttention,
    defaultValue: '{{items}} Items · {{attention}} Need Attention',
  });

  const listHeader = (
    <View style={styles.headerBlock}>
      <MealFormHero
        icon={profile.icon}
        eyebrow={t('inventory.eyebrow', { defaultValue: 'Inventory' })}
        heading={t(profile.moduleTitleKey, { defaultValue: profile.moduleTitleDefault })}
        subheading={summaryLine}
        accent={profile.theme.accent}
        soft={profile.theme.soft}
        border={profile.theme.border}
        compact
      />

      {needAttention > 0 && filter !== 'ATTENTION' ? (
        <Pressable
          onPress={() => {
            setQuery('');
            setFilter('ATTENTION');
          }}
          style={({ pressed }) => [styles.attentionBanner, pressed && styles.bannerPressed]}
          accessibilityRole="button"
          accessibilityLabel={t('inventory.banner.attentionA11y', {
            count: needAttention,
            defaultValue: '{{count}} items need attention. View them.',
          })}>
          <TriangleAlert size={18} color="#D97706" strokeWidth={2.2} />
          <View style={styles.bannerBody}>
            <Text style={styles.bannerTitle}>
              {t('inventory.banner.attention', {
                count: needAttention,
                defaultValue: '{{count}} items need attention',
              })}
            </Text>
            <Text style={styles.bannerAction}>
              {t('inventory.banner.view', { defaultValue: 'View →' })}
            </Text>
          </View>
          <ChevronRight size={18} color="#D97706" strokeWidth={2.4} />
        </Pressable>
      ) : null}

      {filter === 'ATTENTION' ? (
        <Pressable
          onPress={() => setFilter('ALL')}
          style={styles.attentionActive}
          accessibilityRole="button">
          <Text style={styles.attentionActiveText}>
            {t('inventory.banner.showingAttention', {
              count: needAttention,
              defaultValue: 'Showing {{count}} items that need attention · Clear',
            })}
          </Text>
        </Pressable>
      ) : null}

      <ListSearchBar
        value={query}
        onChangeText={setQuery}
        placeholder={t('inventory.items.search', { defaultValue: 'Search…' })}
      />
      <ListFilterChips
        options={filterOptions}
        value={chipValue}
        onChange={next => setFilter(next)}
      />
    </View>
  );

  return (
    <Screen style={styles.screen} contentStyle={styles.content}>
      {loading && items.length === 0 ? (
        <View style={styles.gap}>
          {listHeader}
          <SkeletonCard />
          <SkeletonCard />
        </View>
      ) : error ? (
        <View style={styles.gap}>
          {listHeader}
          <EmptyState
            Icon={TriangleAlert}
            title={t('common.errors.generic')}
            description={error}
          />
        </View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={item => item.itemId}
          ListHeaderComponent={listHeader}
          contentContainerStyle={styles.list}
          refreshControl={
            <RefreshControl refreshing={loading} onRefresh={() => void reload()} />
          }
          ListEmptyComponent={
            <EmptyState
              Icon={profile.icon}
              title={
                query || filter !== 'ALL'
                  ? t('list.emptyFiltered')
                  : t('inventory.empty.itemsTitle', { defaultValue: 'No items yet' })
              }
              description={t('inventory.empty.itemsBodySimple', {
                defaultValue: 'Add rice, milk, oil — whatever you track day to day.',
              })}
            />
          }
          renderItem={({ item }) => (
            <InventoryItemCard
              item={item}
              statusLabel={statusLabel}
              onPress={() =>
                navigation.navigate('InventoryItemDetails', {
                  spaceId,
                  itemId: item.itemId,
                })
              }
            />
          )}
        />
      )}

      {canManage ? (
        <FAB
          accessibilityLabel={t('inventory.actions.addItem', { defaultValue: 'Add Item' })}
          onPress={() =>
            navigation.navigate('InventoryItemForm', { spaceId, mode: 'create' })
          }
        />
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  content: { flex: 1, paddingTop: spacing.md },
  headerBlock: {
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  gap: { gap: spacing.sm },
  list: { gap: spacing.sm, paddingBottom: 96 },
  attentionBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.warningTint,
    borderWidth: 1,
    borderColor: '#FDE68A',
    borderRadius: radius.card,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    minHeight: 52,
  },
  bannerPressed: { opacity: 0.9 },
  bannerBody: { flex: 1, gap: 2 },
  bannerTitle: {
    ...typography.bodyStrong,
    color: '#92400E',
  },
  bannerAction: {
    ...typography.caption,
    color: '#D97706',
    fontWeight: '700',
  },
  attentionActive: {
    alignSelf: 'flex-start',
    paddingVertical: 2,
  },
  attentionActiveText: {
    ...typography.caption,
    color: colors.primaryDark,
    fontWeight: '600',
  },
});
