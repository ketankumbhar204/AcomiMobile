import { useEffect, useSyncExternalStore } from 'react';
import { enquiryApi } from '../api/enquiryApi';
import { useAuthStore } from '../store/authStore';
import {
  getInquiredIds,
  getInquirySentVia,
  loadInquiredListings,
  resetInquiredListings,
  subscribeInquired,
  type InquirySentVia,
} from '../state/inquiredListings';

export function useAlreadyInquired(listingId?: string | null): boolean {
  const isAuthenticated = useAuthStore(state => state.isAuthenticated);
  const userId = useAuthStore(state => state.userId);
  const ids = useSyncExternalStore(subscribeInquired, getInquiredIds, getInquiredIds);

  useEffect(() => {
    if (!isAuthenticated || !userId) {
      resetInquiredListings();
      return;
    }
    loadInquiredListings(userId, () => enquiryApi.listInquiredListingIds()).catch(() => undefined);
  }, [isAuthenticated, userId]);

  return Boolean(listingId && ids.has(listingId));
}

export function useInquirySentVia(listingId?: string | null): InquirySentVia | null {
  const inquired = useAlreadyInquired(listingId);
  if (!inquired || !listingId) return null;
  return getInquirySentVia(listingId);
}
