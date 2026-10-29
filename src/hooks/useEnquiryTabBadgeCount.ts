import { useCallback, useEffect, useSyncExternalStore } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { useAccountEnquiryUnreadCount } from './useAccountEnquiryUnreadCount';
import {
  getOwnerPendingEnquiryCount,
  isOwnerEnquiryBadgeResolved,
  refreshOwnerPendingEnquiryCount,
  subscribeOwnerPendingEnquiryCount,
} from '../store/ownerPendingEnquiryStore';

/**
 * Enquiries tab badge.
 * Owner inbox: pending received enquiries (same number as the Pending card).
 * Customer inbox: unread enquiry notifications, unchanged.
 */
export function useEnquiryTabBadgeCount(): number {
  const unread = useAccountEnquiryUnreadCount();
  const resolved = useSyncExternalStore(
    subscribeOwnerPendingEnquiryCount,
    isOwnerEnquiryBadgeResolved,
    isOwnerEnquiryBadgeResolved,
  );
  const ownerPending = useSyncExternalStore(
    subscribeOwnerPendingEnquiryCount,
    getOwnerPendingEnquiryCount,
    getOwnerPendingEnquiryCount,
  );

  useEffect(() => {
    void refreshOwnerPendingEnquiryCount();
  }, []);

  useFocusEffect(
    useCallback(() => {
      void refreshOwnerPendingEnquiryCount();
    }, []),
  );

  if (!resolved || ownerPending == null) {
    return resolved ? unread : 0;
  }
  return ownerPending;
}
