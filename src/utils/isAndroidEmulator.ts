import { Platform } from 'react-native';

/** True when running on the Android emulator (not a physical device). */
export function isAndroidEmulator(): boolean {
  if (Platform.OS !== 'android') {
    return false;
  }

  const { Model, Fingerprint, Brand, Manufacturer } = Platform.constants;

  if (/sdk|emulator|android sdk built for/i.test(Model ?? '')) {
    return true;
  }

  if (/generic|unknown|google_sdk|emulator|android sdk/i.test(Fingerprint ?? '')) {
    return true;
  }

  return (
    Brand === 'google' &&
    Manufacturer === 'Google' &&
    /sdk|emulator/i.test(Model ?? '')
  );
}
