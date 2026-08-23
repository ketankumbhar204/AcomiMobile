import { Platform } from 'react-native';
import { ANDROID_PHYSICAL_LAN_HOST } from './devApiHost';
import { isAndroidEmulator } from '../utils/isAndroidEmulator';

type Environment = 'development' | 'staging' | 'production';

const CURRENT_ENV: Environment =
  (__DEV__ ? 'development' : 'production') as Environment;

/**
 * Production branch: `__DEV__` Metro sessions use the Render develop host, not
 * this machine. Release builds never use this flag — they always use the
 * production host map (`https://api.acomi.in`).
 */
const USE_LOCAL_DEV_BACKEND = false;

/** Render develop Backend host (no `/api/v1` — appended once in `env.apiBaseUrl`). */
const RENDER_DEV_API_HOST = 'https://acomibackend.onrender.com';

function androidLocalDevelopmentHost(): string {
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

function developmentApiHost(): string {
  if (!USE_LOCAL_DEV_BACKEND) {
    return RENDER_DEV_API_HOST;
  }

  return Platform.select({
    android: androidLocalDevelopmentHost(),
    ios: 'http://localhost:8080',
    default: 'http://localhost:8080',
  })!;
}

const API_HOSTS: Record<Environment, string> = {
  development: developmentApiHost(),
  staging: 'https://staging-api.acomi.app',
  production: 'https://api.acomi.in',
};

export const env = {
  environment: CURRENT_ENV,
  apiBaseUrl: `${API_HOSTS[CURRENT_ENV]}/api/v1`,
  apiTimeoutMs: 30_000,
  privacyPolicyUrl: 'https://app.acomi.in/privacy',
  accountDeletionUrl: 'https://app.acomi.in/delete-account',
} as const;
