import {
  displayedMessageKeys,
  ensureAndroidNotificationPermission,
  planNotificationDisplay,
  rememberDisplayed,
} from '../notificationDisplay';

const enabled = {
  notificationsEnabled: true,
  displayedKeys: new Set<string>(),
};

describe('planNotificationDisplay', () => {
  it('shows a local status-bar notification while the app is in the foreground', () => {
    expect(
      planNotificationDisplay({
        ...enabled,
        visibility: 'foreground',
        notificationBlockPresent: true,
        title: 'ACOMI FCM Test',
        body: 'Local Firebase push notification test.',
        messageKey: 'm1',
      }),
    ).toEqual({ action: 'display-local', reason: 'FOREGROUND' });
  });

  it('lets Android show a notification payload in the background without a second local notification', () => {
    expect(
      planNotificationDisplay({
        ...enabled,
        visibility: 'background',
        notificationBlockPresent: true,
        title: 'ACOMI FCM Test',
        body: 'Local Firebase push notification test.',
        messageKey: 'm1',
      }),
    ).toEqual({ action: 'system-tray', reason: 'SYSTEM_TRAY' });
  });

  it('lets Android show a notification payload when the app is terminated', () => {
    expect(
      planNotificationDisplay({
        ...enabled,
        visibility: 'terminated',
        notificationBlockPresent: true,
        title: 'ACOMI FCM Test',
        body: 'Local Firebase push notification test.',
        messageKey: 'm1',
      }),
    ).toEqual({ action: 'system-tray', reason: 'SYSTEM_TRAY' });
  });

  it('creates a local notification for a data-only background message', () => {
    expect(
      planNotificationDisplay({
        ...enabled,
        visibility: 'background',
        notificationBlockPresent: false,
        title: 'ACOMI FCM Test',
        body: 'Local Firebase push notification test.',
        messageKey: 'data-1',
      }),
    ).toEqual({ action: 'display-local', reason: 'DATA_ONLY' });
  });

  it('does not display when Android notifications are denied', () => {
    expect(
      planNotificationDisplay({
        ...enabled,
        notificationsEnabled: false,
        visibility: 'background',
        notificationBlockPresent: true,
        title: 'ACOMI FCM Test',
        body: 'Body',
        messageKey: 'm1',
      }),
    ).toEqual({ action: 'skip', reason: 'PERMISSION_DENIED' });
  });

  it('does not display the same message twice', () => {
    expect(
      planNotificationDisplay({
        ...enabled,
        visibility: 'foreground',
        notificationBlockPresent: true,
        title: 'ACOMI FCM Test',
        body: 'Body',
        messageKey: 'm1',
        displayedKeys: new Set(['m1']),
      }),
    ).toEqual({ action: 'skip', reason: 'DUPLICATE' });
  });

  it('skips an empty payload', () => {
    expect(
      planNotificationDisplay({
        ...enabled,
        visibility: 'foreground',
        notificationBlockPresent: false,
        title: ' ',
        body: '',
        messageKey: 'empty',
      }),
    ).toEqual({ action: 'skip', reason: 'EMPTY' });
  });
});

describe('ensureAndroidNotificationPermission', () => {
  it('requests Android 13 permission when notifications are currently off', async () => {
    const requestPostNotifications = jest.fn(async () => false);
    const decision = await ensureAndroidNotificationPermission({
      platform: 'android',
      sdk: 33,
      notificationsEnabled: false,
      requestPostNotifications,
    });
    expect(requestPostNotifications).toHaveBeenCalledTimes(1);
    expect(decision).toEqual({ enabled: false, reason: 'DENIED' });
  });

  it('does not treat a fake granted result as Android 13 consent when already enabled', async () => {
    const requestPostNotifications = jest.fn(async () => true);
    const decision = await ensureAndroidNotificationPermission({
      platform: 'android',
      sdk: 34,
      notificationsEnabled: true,
      requestPostNotifications,
    });
    expect(requestPostNotifications).not.toHaveBeenCalled();
    expect(decision.reason).toBe('GRANTED');
  });

  it('uses the system setting on Android 12 and below', async () => {
    const decision = await ensureAndroidNotificationPermission({
      platform: 'android',
      sdk: 31,
      notificationsEnabled: false,
      requestPostNotifications: async () => true,
    });
    expect(decision).toEqual({ enabled: false, reason: 'DENIED' });
  });
});

describe('rememberDisplayed', () => {
  it('records a message key without storing a token', () => {
    rememberDisplayed('msg-1');
    expect(displayedMessageKeys().has('msg-1')).toBe(true);
    expect([...displayedMessageKeys()].join(' ')).not.toMatch(/fcm|token/i);
  });
});
