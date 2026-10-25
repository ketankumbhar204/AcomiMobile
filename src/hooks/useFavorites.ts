import { useEffect, useSyncExternalStore } from 'react';
import { useAuthStore } from '../store/authStore';
import {
  favoriteSession,
  loadFavoriteListings,
  resetFavoriteListings,
  toggleFavoriteListing,
} from '../state/favoriteListings';
import type { FavoriteToggleResult } from '../utils/favoriteSession';

function useFavoriteSnapshot(): number {
  return useSyncExternalStore(
    favoriteSession.subscribe,
    favoriteSession.getSnapshot,
    favoriteSession.getSnapshot,
  );
}

export function useEnsureFavoritesLoaded(): void {
  const isAuthenticated = useAuthStore(state => state.isAuthenticated);
  const userId = useAuthStore(state => state.userId);

  useEffect(() => {
    if (!isAuthenticated || !userId) {
      resetFavoriteListings();
      return;
    }
    loadFavoriteListings(userId).catch(() => undefined);
  }, [isAuthenticated, userId]);
}

export function useIsFavorite(spaceId?: string | null): boolean {
  useFavoriteSnapshot();
  useEnsureFavoritesLoaded();
  return favoriteSession.isFavorite(spaceId);
}

export function useIsFavoritePending(spaceId?: string | null): boolean {
  useFavoriteSnapshot();
  useEnsureFavoritesLoaded();
  return favoriteSession.isPending(spaceId);
}

export function useFavoriteIds(): ReadonlySet<string> {
  useFavoriteSnapshot();
  useEnsureFavoritesLoaded();
  return favoriteSession.ids();
}

export function useToggleFavorite(): (spaceId: string) => Promise<FavoriteToggleResult> {
  useEnsureFavoritesLoaded();
  return toggleFavoriteListing;
}
