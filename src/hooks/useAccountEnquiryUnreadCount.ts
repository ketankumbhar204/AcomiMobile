import { useCallback, useEffect, useSyncExternalStore } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import {
  getAccountEnquiryUnreadCount,
  getUnreadEnquiryIds,
  refreshAccountEnquiryUnread,
  subscribeAccountEnquiryUnread,
} from '../store/accountEnquiryUnreadStore';

export function useAccountEnquiryUnreadCount(): number {
  const count = useSyncExternalStore(
    subscribeAccountEnquiryUnread,
    getAccountEnquiryUnreadCount,
    getAccountEnquiryUnreadCount,
  );

  useEffect(() => {
    void refreshAccountEnquiryUnread();
  }, []);

  useFocusEffect(
    useCallback(() => {
      void refreshAccountEnquiryUnread();
    }, []),
  );

  return count;
}

/** Snapshot of unread enquiry IDs for NEW badges on the list. */
export function useUnreadEnquiryIds(): ReadonlySet<string> {
  return useSyncExternalStore(
    subscribeAccountEnquiryUnread,
    getUnreadEnquiryIds,
    getUnreadEnquiryIds,
  );
}
