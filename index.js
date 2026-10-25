/**
 * @format
 */

import 'react-native-gesture-handler';
import { AppRegistry } from 'react-native';
import App from './App';
import { name as appName } from './app.json';
import { getMessagingSafe } from './src/notifications/push/firebaseMessaging';
import { displayLocalNotification, planNotificationDisplay, displayedMessageKeys } from './src/notifications/push/notificationDisplay';

const messaging = getMessagingSafe();
if (messaging) {
  messaging.setBackgroundMessageHandler(async remote => {
    const title = remote?.notification?.title ?? remote?.data?.title ?? '';
    const body = remote?.notification?.body ?? remote?.data?.body ?? '';
    const messageKey = remote?.messageId ?? remote?.data?.notificationId ?? null;
    const plan = planNotificationDisplay({
      visibility: 'background',
      notificationBlockPresent: Boolean(remote?.notification?.title || remote?.notification?.body),
      title,
      body,
      messageKey,
      displayedKeys: displayedMessageKeys(),
      notificationsEnabled: true,
    });
    if (plan.action !== 'display-local') {
      return;
    }
    await displayLocalNotification({
      title: String(title).trim(),
      body: String(body).trim(),
      messageKey,
      data: remote?.data,
    });
  });
}

AppRegistry.registerComponent(appName, () => App);
