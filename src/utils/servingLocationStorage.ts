import AsyncStorage from '@react-native-async-storage/async-storage';
import type { UUID } from '../api/types';

const storageKey = (spaceId: UUID) => `@acomi/serving-location/${spaceId}`;

export async function loadCustomServingLocationName(spaceId: UUID): Promise<string | null> {
  try {
    const value = await AsyncStorage.getItem(storageKey(spaceId));
    return value?.trim() ? value.trim() : null;
  } catch {
    return null;
  }
}

export async function saveCustomServingLocationName(
  spaceId: UUID,
  name: string,
): Promise<void> {
  const trimmed = name.trim();
  if (!trimmed) {
    await AsyncStorage.removeItem(storageKey(spaceId));
    return;
  }
  await AsyncStorage.setItem(storageKey(spaceId), trimmed);
}
