import { favoritesApi } from '../api/favoritesApi';
import { useAuthStore } from '../store/authStore';
import { FavoriteSession, runFavoriteToggle, type FavoriteToggleResult } from '../utils/favoriteSession';

export const favoriteSession = new FavoriteSession();

let loadedUserId: string | null = null;
let inflight: Promise<boolean> | null = null;

export function resetFavoriteListings(): void {
  loadedUserId = null;
  inflight = null;
  favoriteSession.reset();
}

export async function loadFavoriteListings(
  userId: string,
  options?: { force?: boolean },
): Promise<boolean> {
  if (!userId) {
    resetFavoriteListings();
    return false;
  }
  if (!options?.force && loadedUserId === userId && inflight == null) {
    return true;
  }
  if (!options?.force && inflight && loadedUserId === userId) {
    return inflight.then(() => loadedUserId === userId);
  }
  loadedUserId = userId;
  const stamp = favoriteSession.mutationStamp();
  const request = (async () => {
    try {
      const ids = await favoritesApi.ids();
      if (loadedUserId !== userId) return false;
      favoriteSession.hydrateIfUnchanged(stamp, ids);
      return true;
    } catch {
      if (loadedUserId === userId) loadedUserId = null;
      return false;
    }
  })();
  inflight = request;
  try {
    return await request;
  } finally {
    if (inflight === request) inflight = null;
  }
}

export async function toggleFavoriteListing(spaceId: string): Promise<FavoriteToggleResult> {
  const isAuthenticated = useAuthStore.getState().isAuthenticated;
  return runFavoriteToggle(isAuthenticated, spaceId, favoriteSession, {
    add: id => favoritesApi.add(id),
    remove: id => favoritesApi.remove(id),
  });
}
