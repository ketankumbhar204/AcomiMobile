import { Platform } from 'react-native';
import { deviceTokensApi } from '../../api/deviceTokensApi';
import { getAuthToken } from '../../api/client';
import { getOrCreateDeviceId } from './deviceId';
import { getMessagingSafe } from './firebaseMessaging';
import { devLog } from '../../utils/devLog';

const LOG_TAG = '[PushToken]';

export async function registerCurrentDeviceToken(): Promise<void> {
  if (!getAuthToken()) {
    return;
  }
  const messaging = getMessagingSafe();
  if (!messaging) {
    return;
  }
  try {
    const token = await messaging.getToken();
    if (!token) {
      return;
    }
    const deviceId = await getOrCreateDeviceId();
    await deviceTokensApi.register({
      token,
      platform: Platform.OS === 'ios' ? 'IOS' : 'ANDROID',
      deviceId,
      appVersion: '1.0',
    });
    devLog(`${LOG_TAG} registered`);
  } catch (error) {
    console.warn(`${LOG_TAG} register skipped`, error);
  }
}

export async function unregisterCurrentDeviceToken(): Promise<void> {
  if (!getAuthToken()) {
    return;
  }
  try {
    const deviceId = await getOrCreateDeviceId();
    await deviceTokensApi.deactivate(deviceId);
    devLog(`${LOG_TAG} deactivated`);
  } catch (error) {
    console.warn(`${LOG_TAG} deactivate skipped`, error);
  }
}
