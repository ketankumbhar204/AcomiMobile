import React, { useCallback, useState } from 'react';
import { ActivityIndicator, FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useTranslation } from 'react-i18next';
import { Heart } from 'lucide-react-native';
import { favoritesApi } from '../api/favoritesApi';
import type { DiscoverSpaceCardResponse } from '../api/types';
import { ApiError } from '../api/types';
import { DiscoverSpaceCard } from '../components/discovery/DiscoverSpaceCard';
import { Button, EmptyState, Screen } from '../components/ui';
import { useFavoriteIds, useToggleFavorite } from '../hooks/useFavorites';
import type { MainStackParamList } from '../navigation/types';
import { useAuthStore } from '../store/authStore';
import { loadFavoriteListings } from '../state/favoriteListings';
import { colors, radius, spacing, typography } from '../theme';

type Nav = NativeStackNavigationProp<MainStackParamList, 'Favorites'>;

export function FavoritesScreen() {
  const { t } = useTranslation();
  const navigation = useNavigation<Nav>();
  const favoriteIds = useFavoriteIds();
  const toggleFavorite = useToggleFavorite();
  const userId = useAuthStore(state => state.userId);
  const [filter, setFilter] = useState<'all' | 'places' | 'mess'>('all');
  const [items, setItems] = useState<DiscoverSpaceCardResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const load = useCallback(async () => {
    setError(null);
    try {
      if (userId) {
        await loadFavoriteListings(userId, { force: true });
      }
      const rows = await favoritesApi.list();
      const seen = new Set<string>();
      setItems(rows.filter(row => {
        if (!row.spaceId || seen.has(row.spaceId)) {
          return false;
        }
        seen.add(row.spaceId);
        return true;
      }));
    } catch (err) {
      const message = err instanceof ApiError
        ? err.message
        : t('spaces.favorites.loadFailed', { defaultValue: 'Could not load favorites.' });
      setError(message);
    } finally {
      setLoading(false);
    }
  }, [t, userId]);

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      void load();
    }, [load]),
  );

  const saved = items.filter(item => favoriteIds.has(item.spaceId));
  const visible = saved.filter(item => {
    if (filter === 'mess') {
      return item.type === 'MESS';
    }
    if (filter === 'places') {
      return item.type !== 'MESS';
    }
    return true;
  });
  const present = new Set(items.map(item => item.spaceId));
  const missingIds = !loading && !error && filter === 'all'
    ? [...favoriteIds].filter(id => !present.has(id))
    : [];

  return (
    <Screen>
      <View style={styles.filters}>
        {([
          ['all', t('spaces.favorites.all', { defaultValue: 'All' })],
          ['places', t('spaces.findPlace.tabs.places', { defaultValue: 'Places' })],
          ['mess', t('spaces.findPlace.tabs.mess', { defaultValue: 'Meals' })],
        ] as const).map(([value, label]) => (
          <Pressable
            key={value}
            onPress={() => setFilter(value)}
            style={[styles.filterChip, filter === value && styles.filterChipOn]}
            accessibilityRole="tab"
            accessibilityState={{ selected: filter === value }}>
            <Text style={[styles.filterLabel, filter === value && styles.filterLabelOn]}>{label}</Text>
          </Pressable>
        ))}
      </View>
      {loading && items.length === 0 ? (
        <ActivityIndicator color={colors.primary} style={styles.loader} />
      ) : error && items.length === 0 ? (
        <View style={styles.empty}>
          <EmptyState
            Icon={Heart}
            title={t('spaces.favorites.loadFailed', { defaultValue: 'Could not load favorites.' })}
            description={error}
          />
          <Button label={t('spaces.findPlace.retry')} onPress={() => { setLoading(true); void load(); }} />
        </View>
      ) : (
        <FlatList
          data={visible}
          keyExtractor={item => item.spaceId}
          contentContainerStyle={styles.list}
          renderItem={({ item }) => (
            <DiscoverSpaceCard
              item={item}
              onPress={() =>
                navigation.navigate('FindAPlaceDetail', {
                  spaceId: item.spaceId,
                  focusSection: null,
                })
              }
              onViewSection={section =>
                navigation.navigate('FindAPlaceDetail', {
                  spaceId: item.spaceId,
                  focusSection: section,
                })
              }
            />
          )}
          ListFooterComponent={
            missingIds.length > 0 ? (
              <View style={styles.missingWrap}>
                {missingIds.map(id => (
                  <View key={id} style={styles.missing}>
                    <Text style={styles.missingTitle}>
                      {t('spaces.favorites.unavailable', { defaultValue: 'This listing is no longer available.' })}
                    </Text>
                    <Button
                      label={t('spaces.favorites.removeSaved', { defaultValue: 'Remove from favorites' })}
                      onPress={() => { void toggleFavorite(id); }}
                    />
                  </View>
                ))}
              </View>
            ) : null
          }
          ListEmptyComponent={
            missingIds.length > 0 ? null : (
              <EmptyState
                Icon={Heart}
                title={t('spaces.favorites.empty', { defaultValue: 'No favorites yet' })}
                description={t('spaces.favorites.emptyHint', {
                  defaultValue: 'Tap the heart on a PG, hostel, co-living, rental, or mess listing to save it here.',
                })}
              />
            )
          }
        />
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  filters: {
    flexDirection: 'row',
    gap: spacing.sm,
    paddingHorizontal: spacing.xxl,
    paddingTop: spacing.lg,
  },
  filterChip: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.full,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    backgroundColor: colors.white,
  },
  filterChipOn: {
    borderColor: colors.primary,
    backgroundColor: colors.primary,
  },
  filterLabel: {
    ...typography.caption,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  filterLabelOn: {
    color: colors.white,
  },
  missingWrap: { gap: spacing.sm, marginTop: spacing.md },
  missing: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.card,
    backgroundColor: colors.white,
    padding: spacing.lg,
    gap: spacing.sm,
  },
  missingTitle: {
    ...typography.body,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  loader: { marginTop: spacing.section },
  empty: { padding: spacing.xxl, gap: spacing.md },
  list: { padding: spacing.xxl, paddingBottom: spacing.section, flexGrow: 1, gap: spacing.md },
});
