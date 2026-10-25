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
import {
  displayLocalNotification,
  displayedMessageKeys,
  ensureAndroidNotificationPermission,
  planNotificationDisplay,
  requestAndroidPostNotifications,
  subscribeNotificationOpens,
} from './notificationDisplay';

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

let permissionWarningShown = false;

async function resolveNotificationPermission(
  showToast: (message: string) => void,
): Promise<boolean> {
  if (Platform.OS !== 'android') {
    return requestPermissionQuietly();
  }
  const messaging = getMessagingSafe();
  const current = messaging ? await messaging.hasPermission() : AuthorizationStatus.DENIED;
  const decision = await ensureAndroidNotificationPermission({
    platform: 'android',
    sdk: typeof Platform.Version === 'number' ? Platform.Version : Number(Platform.Version),
    notificationsEnabled:
      current === AuthorizationStatus.AUTHORIZED || current === AuthorizationStatus.PROVISIONAL,
    requestPostNotifications: requestAndroidPostNotifications,
  });
  if (!decision.enabled && !permissionWarningShown) {
    permissionWarningShown = true;
    showToast(
      'Notifications are off for ACOMI. Enable them in Android Settings, Apps, ACOMI, Notifications.',
    );
  }
  return decision.enabled;
}

async function presentIncomingMessage(
  remote: RemoteMessageLike,
  visibility: 'foreground' | 'background' | 'terminated',
  notificationsEnabled: boolean,
): Promise<void> {
  const title = remote.notification?.title ?? remote.data?.title ?? '';
  const body = remote.notification?.body ?? remote.data?.body ?? '';
  const messageKey = remote.messageId ?? remote.data?.notificationId ?? null;
  devLog(`${LOG_TAG} status=MESSAGE_RECEIVED visibility=${visibility}`);
  const plan = planNotificationDisplay({
    visibility,
    notificationBlockPresent: Boolean(remote.notification?.title || remote.notification?.body),
    title,
    body,
    messageKey,
    displayedKeys: displayedMessageKeys(),
    notificationsEnabled,
  });
  if (plan.action !== 'display-local') {
    devLog(`${LOG_TAG} status=${plan.reason}`);
    return;
  }
  const status = await displayLocalNotification({
    title: title.trim(),
    body: body.trim(),
    messageKey,
    data: remote.data,
  });
  devLog(`${LOG_TAG} status=${status === 'DISPLAYED' ? 'NOTIFICATION_DISPLAYED' : status}`);
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
    let unsubscribeOpenedLocal: (() => void) | undefined;

    async function start() {
      const messaging = getMessagingSafe();
      if (!messaging) {
        return;
      }
      const notificationsEnabled = await resolveNotificationPermission(showToast);
      if (!notificationsEnabled) {
        devLog(`${LOG_TAG} status=PERMISSION_DENIED`);
      }
      if (cancelled) {
        return;
      }
      await registerCurrentDeviceToken();
      if (cancelled) {
        return;
      }

      unsubscribeRefresh = messaging.onTokenRefresh(() => {
        void registerCurrentDeviceToken();
      });
      unsubscribeMessage = messaging.onMessage(remote => {
        void presentIncomingMessage(remote, 'foreground', notificationsEnabled);
      });
      unsubscribeOpenedLocal = subscribeNotificationOpens(payload => {
        void openPushNotification(payload);
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
      unsubscribeOpenedLocal?.();
    };
  }, [isAuthenticated, showToast, userId]);

  useEffect(() => {
    if (!isAuthenticated || !navigationReady || !spaceReady) {
      return;
    }
    if (inAdminApp) {
      const pending = consumePendingPushPayload();
      if (pending && navigationRef.isReady()) {
        if (pending.type === 'CONTACT_ENQUIRY' && pending.entityId) {
          navigationRef.navigate('Admin', {
            screen: 'AdminEnquiryDetail',
            params: { id: pending.entityId },
          });
        } else if (pending.type === 'INQUIRY_CREDIT_PAYMENT_PENDING') {
          navigationRef.navigate('Admin', { screen: 'AdminInquiryCreditRequests' });
        }
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
