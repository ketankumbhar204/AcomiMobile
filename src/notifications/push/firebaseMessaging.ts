type MessagingLike = {
  requestPermission: () => Promise<number>;
  hasPermission: () => Promise<number>;
  getToken: () => Promise<string>;
  onTokenRefresh: (cb: (token: string) => void) => () => void;
  onMessage: (cb: (message: RemoteMessageLike) => void) => () => void;
  onNotificationOpenedApp: (cb: (message: RemoteMessageLike) => void) => () => void;
  getInitialNotification: () => Promise<RemoteMessageLike | null>;
  setBackgroundMessageHandler: (cb: (message: RemoteMessageLike) => Promise<void>) => void;
};

export type RemoteMessageLike = {
  notification?: { title?: string | null; body?: string | null } | null;
  data?: Record<string, string>;
};

let cached: MessagingLike | null | undefined;

export function getMessagingSafe(): MessagingLike | null {
  if (cached !== undefined) {
    return cached;
  }
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const messagingModule = require('@react-native-firebase/messaging');
    const factory = messagingModule.default ?? messagingModule;
    cached = (typeof factory === 'function' ? factory() : factory) ?? null;
    return cached;
  } catch (error) {
    console.warn('[Push] Firebase Messaging unavailable', error);
    cached = null;
    return null;
  }
}

export const AuthorizationStatus = {
  NOT_DETERMINED: -1,
  DENIED: 0,
  AUTHORIZED: 1,
  PROVISIONAL: 2,
  EPHEMERAL: 3,
};
