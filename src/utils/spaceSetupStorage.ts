import AsyncStorage from '@react-native-async-storage/async-storage';
import type { UUID } from '../api/types';

const autoOpenKey = (spaceId: UUID) =>
  `@countin/setup/auto_accommodation/${spaceId}`;

/** Whether we already auto-switched this space to Accommodation once. */
export async function hasAutoOpenedAccommodation(spaceId: UUID): Promise<boolean> {
  try {
    const value = await AsyncStorage.getItem(autoOpenKey(spaceId));
    return value === '1';
  } catch {
    return false;
  }
}

export async function markAutoOpenedAccommodation(spaceId: UUID): Promise<void> {
  try {
    await AsyncStorage.setItem(autoOpenKey(spaceId), '1');
  } catch {
    // Non-blocking preference — ignore storage failures.
  }
}
