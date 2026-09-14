import AsyncStorage from '@react-native-async-storage/async-storage';

const ACCOUNT_INTENT_KEY = '@acomi/account_intent';

export type AccountIntent = 'member' | 'owner';

export async function getAccountIntent(): Promise<AccountIntent | null> {
  try {
    const value = await AsyncStorage.getItem(ACCOUNT_INTENT_KEY);
    return value === 'member' || value === 'owner' ? value : null;
  } catch {
    return null;
  }
}

export async function setAccountIntent(intent: AccountIntent): Promise<void> {
  try {
    await AsyncStorage.setItem(ACCOUNT_INTENT_KEY, intent);
  } catch {
    // ignore
  }
}

export async function clearAccountIntent(): Promise<void> {
  try {
    await AsyncStorage.removeItem(ACCOUNT_INTENT_KEY);
  } catch {
    // ignore
  }
}
