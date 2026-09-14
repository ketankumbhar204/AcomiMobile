import AsyncStorage from '@react-native-async-storage/async-storage';

const DEVICE_ID_KEY = '@acomi/device_id';

function createDeviceId(): string {
  const random = `${Date.now().toString(16)}-${Math.random().toString(16).slice(2)}`;
  return random.replace(/[^a-zA-Z0-9-]/g, '').slice(0, 64);
}

export async function getOrCreateDeviceId(): Promise<string> {
  const existing = await AsyncStorage.getItem(DEVICE_ID_KEY);
  if (existing) {
    return existing;
  }
  const created = createDeviceId();
  await AsyncStorage.setItem(DEVICE_ID_KEY, created);
  return created;
}
