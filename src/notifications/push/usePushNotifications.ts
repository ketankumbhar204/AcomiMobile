import { useEffect } from 'react';
import { useAuthStore } from '../../store/authStore';
import { useToastStore } from '../../store/toastStore';
import { navigationRef } from '../../navigation/navigationRef';
import {
  AuthorizationStatus,
  getMessagingSafe,
  type RemoteMessageLike,
} from './firebaseMessaging';
import { parsePushData } from './pushPayload';
import { registerCurrentDeviceToken } from './registerDeviceToken';
import { consumePendingPushPayload } from './pendingPush';
import { openPushNotification } from './openPushNotification';
import { getOrCreateDeviceId } from './deviceId';
import { deviceTokensApi } from '../../api/deviceTokensApi';
import { getAuthToken } from '../../api/client';
import { Platform } from 'react-native';
import { devLog } from '../../utils/devLog';

const LOG_TAG = '[Push]';

async function requestPermissionQuietly(): Promise<boolean> {
  const messaging = getMessagingSafe();
  if (!messaging) {
    return false;
  }
  try {
    const current = await messaging.hasPermission();
    if (
      current === AuthorizationStatus.AUTHORIZED ||
      current === AuthorizationStatus.PROVISIONAL
    ) {
      return true;
    }
    const next = await messaging.requestPermission();
    return (
      next === AuthorizationStatus.AUTHORIZED || next === AuthorizationStatus.PROVISIONAL
    );
  } catch (error) {
    console.warn(`${LOG_TAG} permission request failed`, error);
    return false;
  }
}

function messageToPayload(message: RemoteMessageLike | null | undefined) {
  if (!message) {
    return null;
  }
  return parsePushData(message.data, message.notification);
}

export function usePushNotifications(options: {
  navigationReady: boolean;
  spaceReady: boolean;
  inAdminApp: boolean;
}): void {
  const { navigationReady, spaceReady, inAdminApp } = options;
  const isAuthenticated = useAuthStore(state => state.isAuthenticated);
  const userId = useAuthStore(state => state.userId);
  const showToast = useToastStore(state => state.showToast);

  useEffect(() => {
    if (!isAuthenticated || !userId) {
      return;
    }
    let cancelled = false;
    let unsubscribeRefresh: (() => void) | undefined;
    let unsubscribeMessage: (() => void) | undefined;
    let unsubscribeOpened: (() => void) | undefined;

    async function start() {
      const messaging = getMessagingSafe();
      if (!messaging) {
        return;
      }
      const granted = await requestPermissionQuietly();
      if (!granted) {
        devLog(`${LOG_TAG} permission denied — app continues without push`);
      }
      if (cancelled) {
        return;
      }
      await registerCurrentDeviceToken();

      unsubscribeRefresh = messaging.onTokenRefresh(() => {
        void registerCurrentDeviceToken();
      });
      unsubscribeMessage = messaging.onMessage(remote => {
        const title = remote.notification?.title?.trim();
        const body = remote.notification?.body?.trim();
        const text = [title, body].filter(Boolean).join(' — ');
        if (text) {
          const payload = messageToPayload(remote);
          showToast(text, payload ? () => void openPushNotification(payload) : undefined);
        }
      });
      unsubscribeOpened = messaging.onNotificationOpenedApp(remote => {
        const payload = messageToPayload(remote);
        if (payload) {
          void openPushNotification(payload);
        }
      });
      const initial = await messaging.getInitialNotification();
      const payload = messageToPayload(initial);
      if (payload) {
        void openPushNotification(payload);
      }
    }

    void start();
    return () => {
      cancelled = true;
      unsubscribeRefresh?.();
      unsubscribeMessage?.();
      unsubscribeOpened?.();
    };
  }, [isAuthenticated, showToast, userId]);

  useEffect(() => {
    if (!isAuthenticated || !navigationReady || !spaceReady) {
      return;
    }
    if (inAdminApp) {
      const pending = consumePendingPushPayload();
      if (pending?.type === 'CONTACT_ENQUIRY' && pending.entityId && navigationRef.isReady()) {
        navigationRef.navigate('Admin', {
          screen: 'AdminEnquiryDetail',
          params: { id: pending.entityId },
        });
      }
      return;
    }
    const pending = consumePendingPushPayload();
    if (pending) {
      void openPushNotification(pending);
    }
  }, [inAdminApp, isAuthenticated, navigationReady, spaceReady]);
}

export async function syncTokenAfterRefresh(): Promise<void> {
  if (!getAuthToken()) {
    return;
  }
  const messaging = getMessagingSafe();
  if (!messaging) {
    return;
  }
  try {
    const token = await messaging.getToken();
    const deviceId = await getOrCreateDeviceId();
    await deviceTokensApi.register({
      token,
      platform: Platform.OS === 'ios' ? 'IOS' : 'ANDROID',
      deviceId,
      appVersion: '1.0',
    });
  } catch {
    // Token refresh is best-effort.
  }
}
