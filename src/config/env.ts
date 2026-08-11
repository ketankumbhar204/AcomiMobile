import { Platform } from 'react-native';
import { ANDROID_PHYSICAL_LAN_HOST } from './devApiHost';
import { isAndroidEmulator } from '../utils/isAndroidEmulator';

type Environment = 'development' | 'staging' | 'production';

const CURRENT_ENV: Environment =
  (__DEV__ ? 'development' : 'production') as Environment;

function androidDevelopmentHost(): string {
  if (isAndroidEmulator()) {
    // Emulator alias for the dev machine's localhost.
    return 'http://10.0.2.2:8080';
  }

  // Physical device over USB: `adb reverse tcp:8080 tcp:8080` maps localhost → PC.
  // Set useLanHostForPhysicalDevice to true for Wi‑Fi-only debugging (backend must bind 0.0.0.0).
  const useLanHostForPhysicalDevice = false;
  if (useLanHostForPhysicalDevice) {
    return `http://${ANDROID_PHYSICAL_LAN_HOST}:8080`;
  }

  return 'http://localhost:8080';
}

const API_HOSTS: Record<Environment, string> = {
  development: Platform.select({
    android: androidDevelopmentHost(),
    ios: 'http://localhost:8080',
    default: 'http://localhost:8080',
  })!,
  staging: 'https://staging-api.amico.app',
  production: 'https://api.amico.app',
};

export const env = {
  environment: CURRENT_ENV,
  apiBaseUrl: `${API_HOSTS[CURRENT_ENV]}/api/v1`,
  apiTimeoutMs: 30_000,
} as const;
