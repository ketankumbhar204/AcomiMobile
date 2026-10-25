import AsyncStorage from '@react-native-async-storage/async-storage';

const MAX_RECENT = 4;

function storageKey(spaceId: string): string {
  return `acomi.recentChargeTypes.${spaceId}`;
}

export async function readRecentChargeTypeIds(spaceId: string): Promise<string[]> {
  if (!spaceId) {
    return [];
  }
  try {
    const raw = await AsyncStorage.getItem(storageKey(spaceId));
    const parsed: unknown = raw ? JSON.parse(raw) : [];
    if (!Array.isArray(parsed)) {
      return [];
    }
    return parsed.filter((id): id is string => typeof id === 'string').slice(0, MAX_RECENT);
  } catch {
    return [];
  }
}

export async function rememberChargeType(spaceId: string, typeId: string): Promise<void> {
  if (!spaceId || !typeId) {
    return;
  }
  const next = [typeId, ...(await readRecentChargeTypeIds(spaceId)).filter(id => id !== typeId)].slice(
    0,
    MAX_RECENT,
  );
  await AsyncStorage.setItem(storageKey(spaceId), JSON.stringify(next));
}
