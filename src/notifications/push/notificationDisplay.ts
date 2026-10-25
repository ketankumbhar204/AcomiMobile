import { NativeEventEmitter, NativeModules, PermissionsAndroid, Platform } from 'react-native';
import { parsePushData, type PushNotificationPayload } from './pushPayload';

export type PushVisibility = 'foreground' | 'background' | 'terminated';

export type DisplayPlan = {
  action: 'display-local' | 'system-tray' | 'skip';
  reason:
    | 'PERMISSION_DENIED'
    | 'EMPTY'
    | 'DUPLICATE'
    | 'FOREGROUND'
    | 'SYSTEM_TRAY'
    | 'DATA_ONLY';
};

const displayedKeys = new Set<string>();

export function planNotificationDisplay(input: {
  visibility: PushVisibility;
  notificationBlockPresent: boolean;
  title?: string | null;
  body?: string | null;
  messageKey?: string | null;
  displayedKeys: ReadonlySet<string>;
  notificationsEnabled: boolean;
}): DisplayPlan {
  const title = input.title?.trim() ?? '';
  const body = input.body?.trim() ?? '';
  if (!input.notificationsEnabled) {
    return { action: 'skip', reason: 'PERMISSION_DENIED' };
  }
  if (!title && !body) {
    return { action: 'skip', reason: 'EMPTY' };
  }
  const key = input.messageKey?.trim();
  if (key && input.displayedKeys.has(key)) {
    return { action: 'skip', reason: 'DUPLICATE' };
  }
  if (input.visibility === 'foreground') {
    return { action: 'display-local', reason: 'FOREGROUND' };
  }
  if (input.notificationBlockPresent) {
    return { action: 'system-tray', reason: 'SYSTEM_TRAY' };
  }
  return { action: 'display-local', reason: 'DATA_ONLY' };
}

export function rememberDisplayed(messageKey: string | null | undefined): void {
  const key = messageKey?.trim();
  if (key) {
    displayedKeys.add(key);
  }
}

export function displayedMessageKeys(): ReadonlySet<string> {
  return displayedKeys;
}

export async function ensureAndroidNotificationPermission(input: {
  platform: string;
  sdk: number;
  notificationsEnabled: boolean;
  requestPostNotifications: () => Promise<boolean>;
}): Promise<{ enabled: boolean; reason: 'GRANTED' | 'DENIED' | 'NOT_ANDROID' }> {
  if (input.platform !== 'android') {
    return { enabled: true, reason: 'NOT_ANDROID' };
  }
  if (input.sdk < 33) {
    return { enabled: input.notificationsEnabled, reason: input.notificationsEnabled ? 'GRANTED' : 'DENIED' };
  }
  if (input.notificationsEnabled) {
    return { enabled: true, reason: 'GRANTED' };
  }
  const granted = await input.requestPostNotifications();
  return { enabled: granted, reason: granted ? 'GRANTED' : 'DENIED' };
}

export async function requestAndroidPostNotifications(): Promise<boolean> {
  if (Platform.OS !== 'android') {
    return true;
  }
  const permission = PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS;
  if (!permission) {
    return true;
  }
  const result = await PermissionsAndroid.request(permission);
  return result === PermissionsAndroid.RESULTS.GRANTED;
}

type DisplayStatus = 'DISPLAYED' | 'PERMISSION_BLOCKED' | 'UNAVAILABLE' | 'EMPTY';

export async function displayLocalNotification(input: {
  title: string;
  body: string;
  messageKey?: string | null;
  data?: Record<string, string>;
}): Promise<DisplayStatus> {
  const native = NativeModules.AcomiNotifications as
    | { display?: (title: string, body: string, messageKey: string, payloadJson: string) => Promise<DisplayStatus> }
    | undefined;
  if (!native?.display) {
    return 'UNAVAILABLE';
  }
  const status = await native.display(
    input.title,
    input.body,
    input.messageKey ?? '',
    JSON.stringify({ ...(input.data ?? {}), title: input.title, body: input.body }),
  );
  if (status === 'DISPLAYED') {
    rememberDisplayed(input.messageKey);
  }
  return status;
}

export function subscribeNotificationOpens(
  onOpen: (payload: PushNotificationPayload) => void,
): () => void {
  const native = NativeModules.AcomiNotifications as
    | { consumeOpened?: () => Promise<string | null> }
    | undefined;
  if (!native) {
    return () => undefined;
  }
  const emit = (json: string | null | undefined) => {
    if (!json) return;
    try {
      const data = JSON.parse(json) as Record<string, string>;
      onOpen(parsePushData(data, { title: data.title, body: data.body }));
    } catch {
      // Ignore a malformed tap payload. It must not affect other notifications.
    }
  };
  const emitter = new NativeEventEmitter(NativeModules.AcomiNotifications);
  const subscription = emitter.addListener('AcomiNotificationOpened', emit);
  void native.consumeOpened?.().then(emit).catch(() => undefined);
  return () => subscription.remove();
}
