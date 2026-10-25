import type { AdminNotificationTestAttempt, AdminNotificationTestPage } from '../../api/adminNotificationTestApi';

export const TYPE_PREVIEW_COUNT = 5;

export function previewTypes<T>(items: T[], expanded: boolean): T[] {
  if (expanded || items.length <= TYPE_PREVIEW_COUNT) return items;
  return items.slice(0, TYPE_PREVIEW_COUNT);
}

export function statusHeading(page: AdminNotificationTestPage | null): string {
  if (!page) return 'Blocked';
  if (page.reasonCode === 'INIT_FAILED' || page.reasonCode === 'INVALID_CREDENTIAL_JSON') return 'Failed';
  if (!page.pushEnabled || !page.credentialReadable || page.projectStatus === 'MISMATCH' || !page.firebaseReady) {
    return 'Blocked';
  }
  if (!page.fcmSendPossible) return 'Warning';
  return 'Ready';
}

export function statusChecks(page: AdminNotificationTestPage): Array<{ label: string; value: string; ok: boolean }> {
  const credentialsOk = Boolean(page.credentialReadable) && page.projectStatus !== 'MISMATCH';
  return [
    { label: 'Push enabled', value: page.pushEnabled ? 'Yes' : 'No', ok: page.pushEnabled },
    { label: 'Firebase credentials', value: credentialsOk ? 'Readable' : 'Missing', ok: credentialsOk },
    { label: 'Project', value: page.projectStatus === 'MATCH' ? 'acomi-270d0' : page.projectStatus || 'Unknown', ok: page.projectStatus === 'MATCH' },
    { label: 'Firebase initialized', value: page.firebaseReady ? 'Yes' : 'No', ok: page.firebaseReady },
    {
      label: 'Registered devices (this admin)',
      value: `${page.registrations.length} device${page.registrations.length === 1 ? '' : 's'}`,
      ok: page.registrations.length > 0,
    },
    { label: 'FCM send possible', value: page.fcmSendPossible ? 'Yes' : 'No', ok: Boolean(page.fcmSendPossible) },
  ];
}

export function resultCopy(attempt: AdminNotificationTestAttempt): string {
  if (attempt.clientReceiptObserved) {
    return 'The device confirmed that it received this notification.';
  }
  if (attempt.status === 'FCM_ACCEPTED') {
    return "FCM accepted the send. Check your phone's notification bar. This does not confirm that the phone displayed it.";
  }
  if (attempt.status === 'PARTIAL_SUCCESS') {
    return `FCM accepted ${attempt.acceptedCount} and rejected ${attempt.failedCount}. Check the phone for the accepted device only.`;
  }
  if (attempt.status === 'FAILED') {
    return attempt.errorDetail || attempt.errorCode || 'FCM rejected the request. No delivery is confirmed.';
  }
  if (attempt.status === 'IN_APP_SAVED') {
    return 'The in-app row was saved. No FCM request was sent.';
  }
  return attempt.errorDetail || attempt.errorCode || 'The test was blocked. No FCM request was sent.';
}

export function typeLabel(
  types: Array<{ notificationType: string; name: string }>,
  notificationType: string,
): string {
  return types.find(item => item.notificationType === notificationType)?.name || notificationType;
}

export function channelLabel(channel: string): string {
  if (channel === 'PUSH') return 'FCM mobile push';
  if (channel === 'IN_APP') return 'In-app';
  if (channel === 'BROWSER') return 'Browser push';
  return channel;
}

export function maskDevice(deviceId: string): string {
  return deviceId.replace(/[^a-zA-Z0-9]/g, '').slice(0, 8) || 'device';
}
