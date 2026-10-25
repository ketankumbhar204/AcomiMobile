import { useEffect, useSyncExternalStore } from 'react';
import { enquiryApi } from '../api/enquiryApi';
import { useAuthStore } from '../store/authStore';
import {
  getInquiredIds,
  getInquiryRecord,
  getInquirySnapshot,
  loadInquiredListings,
  resetInquiredListings,
  subscribeInquired,
  type InquiryRecord,
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

export function useInquiryRecord(listingId?: string | null): InquiryRecord | null {
  useAlreadyInquired(listingId);
  const version = useSyncExternalStore(subscribeInquired, getInquirySnapshot, getInquirySnapshot);
  void version;
  if (!listingId) return null;
  return getInquiryRecord(listingId);
}

export function useInquirySentVia(listingId?: string | null): InquirySentVia | null {
  return useInquiryRecord(listingId)?.sentVia ?? null;
}
