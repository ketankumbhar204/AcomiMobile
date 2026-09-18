import { AppState, type AppStateStatus } from 'react-native';
import { enquiryApi } from '../api/enquiryApi';

type Listener = () => void;

let unreadCount = 0;
let unreadEnquiryIds = new Set<string>();
const listeners = new Set<Listener>();
let refreshInFlight: Promise<void> | null = null;
let appStateSubscribed = false;

function emit() {
  listeners.forEach(listener => listener());
}

export function getAccountEnquiryUnreadCount(): number {
  return unreadCount;
}

export function getUnreadEnquiryIds(): ReadonlySet<string> {
  return unreadEnquiryIds;
}

export function isEnquiryUnread(enquiryId: string | null | undefined): boolean {
  if (!enquiryId) {
    return false;
  }
  return unreadEnquiryIds.has(enquiryId);
}

export function subscribeAccountEnquiryUnread(listener: Listener): () => void {
  listeners.add(listener);
  ensureAppStateRefresh();
  return () => {
    listeners.delete(listener);
  };
}

export async function refreshAccountEnquiryUnread(): Promise<void> {
  if (refreshInFlight) {
    return refreshInFlight;
  }
  refreshInFlight = (async () => {
    try {
      const page = await enquiryApi.listNotifications({ size: 50 });
      unreadCount = page.unreadCount ?? 0;
      const nextIds = new Set<string>();
      for (const item of page.notifications ?? []) {
        if (!item.read && item.enquiryId) {
          nextIds.add(item.enquiryId);
        }
      }
      unreadEnquiryIds = nextIds;
      emit();
    } catch {
      // Keep last known count; badge is best-effort.
    } finally {
      refreshInFlight = null;
    }
  })();
  return refreshInFlight;
}

/** Mark unread account notifications for an enquiry as read (best-effort). */
export async function markEnquiryNotificationsRead(enquiryId: string): Promise<void> {
  try {
    const page = await enquiryApi.listNotifications({ size: 50 });
    const unread = (page.notifications ?? []).filter(
      item => !item.read && item.enquiryId === enquiryId,
    );
    await Promise.all(
      unread.map(item => enquiryApi.markNotificationRead(item.notificationId).catch(() => null)),
    );
  } finally {
    await refreshAccountEnquiryUnread();
  }
}

function ensureAppStateRefresh() {
  if (appStateSubscribed) {
    return;
  }
  appStateSubscribed = true;
  AppState.addEventListener('change', (state: AppStateStatus) => {
    if (state === 'active' && listeners.size > 0) {
      void refreshAccountEnquiryUnread();
    }
  });
}
