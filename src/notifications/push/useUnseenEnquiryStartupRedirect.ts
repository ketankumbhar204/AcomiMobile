import { useEffect, useRef } from 'react';
import { Linking } from 'react-native';
import { enquiryApi } from '../../api/enquiryApi';
import { navigateMainStack } from '../../navigation/mainStackNavigation';
import { navigationRef } from '../../navigation/navigationRef';
import { refreshAccountEnquiryUnread } from '../../store/accountEnquiryUnreadStore';
import { refreshOwnerPendingEnquiryCount } from '../../store/ownerPendingEnquiryStore';
import { devLog } from '../../utils/devLog';
import { getMessagingSafe } from './firebaseMessaging';
import { peekPendingPushPayload } from './pendingPush';

const LOG_TAG = '[UnseenEnquiryStartup]';

/** One redirect attempt per JS session (fresh launch), not on every resume. */
let sessionAttempted = false;

async function shouldSkipUnseenEnquiryRedirect(): Promise<boolean> {
  if (peekPendingPushPayload()) {
    return true;
  }
  try {
    const url = await Linking.getInitialURL();
    if (url) {
      return true;
    }
  } catch {
    // ignore
  }
  try {
    const messaging = getMessagingSafe();
    if (messaging) {
      const initial = await messaging.getInitialNotification();
      if (initial) {
        return true;
      }
    }
  } catch {
    // ignore
  }
  return false;
}

/**
 * On a normal cold start, land on the Enquiries tab when there is something to handle.
 * Owners use pending received enquiries (the Pending card). Customers use unread
 * enquiry notifications. Deep links and push notifications take precedence.
 */
export function useUnseenEnquiryStartupRedirect(enabled: boolean): void {
  const ranRef = useRef(false);

  useEffect(() => {
    if (!enabled || sessionAttempted || ranRef.current) {
      return;
    }
    ranRef.current = true;
    sessionAttempted = true;

    let cancelled = false;
    void (async () => {
      try {
        if (await shouldSkipUnseenEnquiryRedirect()) {
          devLog(`${LOG_TAG} skip — deep link or push`);
          return;
        }
        const pending = await refreshOwnerPendingEnquiryCount();
        if (cancelled) {
          return;
        }
        if (pending != null) {
          if (pending <= 0 || !navigationRef.isReady()) {
            return;
          }
          devLog(`${LOG_TAG} redirect to Enquiries (pending=${pending})`);
          navigateMainStack('MemberTabs', { screen: 'Enquiries' });
          return;
        }
        await refreshAccountEnquiryUnread();
        const page = await enquiryApi.listNotifications({ size: 1 });
        if (cancelled) {
          return;
        }
        const unread = page.unreadCount ?? 0;
        if (unread <= 0) {
          return;
        }
        if (!navigationRef.isReady()) {
          return;
        }
        devLog(`${LOG_TAG} redirect to Enquiries (unread=${unread})`);
        navigateMainStack('MemberTabs', { screen: 'Enquiries' });
      } catch (error) {
        devLog(`${LOG_TAG} failed`, error);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [enabled]);
}
