import type { PushNotificationPayload } from './pushPayload';

let pending: PushNotificationPayload | null = null;

export function setPendingPushPayload(payload: PushNotificationPayload | null): void {
  pending = payload;
}

export function consumePendingPushPayload(): PushNotificationPayload | null {
  const current = pending;
  pending = null;
  return current;
}

export function peekPendingPushPayload(): PushNotificationPayload | null {
  return pending;
}
