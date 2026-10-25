import {
  maskDevice,
  previewTypes,
  resultCopy,
  statusChecks,
  statusHeading,
} from '../notificationTestingView';
import type { AdminNotificationTestPage } from '../../../api/adminNotificationTestApi';

const ready: AdminNotificationTestPage = {
  pushEnabled: true,
  firebaseReady: true,
  browserPushImplemented: false,
  credentialReadable: true,
  projectStatus: 'MATCH',
  fcmSendPossible: true,
  reasonCode: 'READY',
  types: [],
  registrations: [{ deviceTokenId: 'device-1', deviceId: '1a126d5f-full', platform: 'ANDROID', active: true }],
  history: [],
};

describe('notification testing view', () => {
  it('labels a ready configuration and masks the device id', () => {
    expect(statusHeading(ready)).toBe('Ready');
    expect(statusChecks(ready).find(row => row.label === 'Project')?.value).toBe('acomi-270d0');
    expect(maskDevice('1a126d5f-full-token')).toBe('1a126d5f');
  });

  it('previews five types until expanded', () => {
    expect(previewTypes(['a', 'b', 'c', 'd', 'e', 'f'], false)).toHaveLength(5);
    expect(previewTypes(['a', 'b', 'c', 'd', 'e', 'f'], true)).toHaveLength(6);
  });

  it('does not describe FCM acceptance as a displayed notification', () => {
    const message = resultCopy({
      attemptId: '1',
      notificationType: 'PAYMENT_NEEDS_REVIEW',
      channel: 'PUSH',
      status: 'FCM_ACCEPTED',
      targetedCount: 1,
      acceptedCount: 1,
      failedCount: 0,
      clientReceiptObserved: false,
    });
    expect(message).toMatch(/does not confirm/);
    expect(message).not.toMatch(/displayed it successfully|delivered to the phone/);
  });
});
