import React, { useCallback, useState } from 'react';
import { ActivityIndicator, FlatList, StyleSheet, View } from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useTranslation } from 'react-i18next';
import { Heart } from 'lucide-react-native';
import { favoritesApi } from '../api/favoritesApi';
import type { DiscoverSpaceCardResponse } from '../api/types';
import { ApiError } from '../api/types';
import { EnquireDialog } from '../components/EnquireDialog';
import { DiscoverSpaceCard } from '../components/discovery/DiscoverSpaceCard';
import { Button, EmptyState, Screen } from '../components/ui';
import { useFavoriteIds } from '../hooks/useFavorites';
import type { MainStackParamList } from '../navigation/types';
import { useAuthStore } from '../store/authStore';
import { loadFavoriteListings } from '../state/favoriteListings';
import { colors, spacing } from '../theme';

type Nav = NativeStackNavigationProp<MainStackParamList, 'Favorites'>;

export function FavoritesScreen() {
  const { t } = useTranslation();
  const navigation = useNavigation<Nav>();
  const favoriteIds = useFavoriteIds();
  const userId = useAuthStore(state => state.userId);
  const [items, setItems] = useState<DiscoverSpaceCardResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [enquireItem, setEnquireItem] = useState<DiscoverSpaceCardResponse | null>(null);

  const load = useCallback(async () => {
    setError(null);
    try {
      if (userId) {
        await loadFavoriteListings(userId, { force: true });
      }
      const rows = await favoritesApi.list();
      setItems(rows);
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

  const visible = items.filter(item => favoriteIds.has(item.spaceId));

  return (
    <Screen>
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
              onPress={() => navigation.navigate('FindAPlaceDetail', { spaceId: item.spaceId })}
              onEnquire={() => setEnquireItem(item)}
            />
          )}
          ListEmptyComponent={
            <EmptyState
              Icon={Heart}
              title={t('spaces.favorites.empty', { defaultValue: 'No favorites yet' })}
              description={t('spaces.favorites.emptyHint', {
                defaultValue: 'Tap the heart on a PG, hostel, co-living, rental, or mess listing to save it here.',
              })}
            />
          }
        />
      )}
      <EnquireDialog
        open={enquireItem != null}
        spaceId={enquireItem?.spaceId ?? ''}
        spaceName={enquireItem?.name ?? ''}
        ownedByCurrentUser={Boolean(enquireItem?.ownedByCurrentUser)}
        onClose={() => setEnquireItem(null)}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  loader: { marginTop: spacing.section },
  empty: { padding: spacing.xxl, gap: spacing.md },
  list: { padding: spacing.xxl, paddingBottom: spacing.section, flexGrow: 1, gap: spacing.md },
});
