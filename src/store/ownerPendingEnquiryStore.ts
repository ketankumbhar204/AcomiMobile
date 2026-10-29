import { AppState, type AppStateStatus } from 'react-native';
import { enquiryApi } from '../api/enquiryApi';

type Listener = () => void;

/** Pending received enquiries. Null after resolve means this account is not an owner inbox. */
let ownerPending: number | null = null;
let resolved = false;
const listeners = new Set<Listener>();
let refreshInFlight: Promise<number | null> | null = null;
let appStateSubscribed = false;

function emit() {
  listeners.forEach(listener => listener());
}

export function isOwnerEnquiryBadgeResolved(): boolean {
  return resolved;
}

/** Pending count for an owner inbox, or null when this account uses the customer enquiry list. */
export function getOwnerPendingEnquiryCount(): number | null {
  return resolved ? ownerPending : null;
}

export function subscribeOwnerPendingEnquiryCount(listener: Listener): () => void {
  listeners.add(listener);
  ensureAppStateRefresh();
  return () => {
    listeners.delete(listener);
  };
}

/** Keep the tab badge in step with the unfiltered Pending card. */
export function publishOwnerPendingEnquiryCount(pending: number): void {
  ownerPending = pending;
  resolved = true;
  emit();
}

/**
 * Owners see received enquiries. Their tab badge is the pending total, not leftover notifications.
 * Customers (inbox mode MINE) return null so callers keep the notification unread count.
 */
export async function refreshOwnerPendingEnquiryCount(): Promise<number | null> {
  if (refreshInFlight) {
    return refreshInFlight;
  }
  refreshInFlight = (async () => {
    try {
      const inbox = await enquiryApi.inbox();
      if (inbox.mode !== 'RECEIVED') {
        ownerPending = null;
        resolved = true;
        emit();
        return null;
      }
      const summary = await enquiryApi.receivedSummary();
      ownerPending = summary.pending ?? 0;
      resolved = true;
      emit();
      return ownerPending;
    } catch {
      return resolved ? ownerPending : null;
    } finally {
      refreshInFlight = null;
    }
  })();
  return refreshInFlight;
}

function ensureAppStateRefresh() {
  if (appStateSubscribed) {
    return;
  }
  appStateSubscribed = true;
  AppState.addEventListener('change', (state: AppStateStatus) => {
    if (state === 'active' && listeners.size > 0) {
      void refreshOwnerPendingEnquiryCount();
    }
  });
}
