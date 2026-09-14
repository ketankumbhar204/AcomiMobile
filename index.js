/**
 * @format
 */

import 'react-native-gesture-handler';
import { AppRegistry } from 'react-native';
import App from './App';
import { name as appName } from './app.json';
import { getMessagingSafe } from './src/notifications/push/firebaseMessaging';

const messaging = getMessagingSafe();
if (messaging) {
  messaging.setBackgroundMessageHandler(async () => {
    // Data-only / background delivery is handled by the OS notification tray.
  });
}

AppRegistry.registerComponent(appName, () => App);
