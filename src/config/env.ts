import { NativeModules, Platform } from 'react-native';
import { ANDROID_PHYSICAL_LAN_HOST } from './devApiHost';
import { isAndroidEmulator } from '../utils/isAndroidEmulator';

type Environment = 'development' | 'staging' | 'production';

type AcomiBuildConfigNative = {
  apiMode?: string;
  localApiHost?: string;
  localApiPort?: string;
  allowCleartext?: boolean;
};

const nativeBuildConfig = (NativeModules.AcomiBuildConfig ?? {}) as AcomiBuildConfigNative;

/**
 * Android product-flavor API mode:
 * - `walk`  → always local walk backend (walkDebug / walkRelease)
 * - `auto`  → existing `__DEV__` selection (standardDebug / standardRelease)
 */
const API_MODE = (nativeBuildConfig.apiMode ?? 'auto').toLowerCase();
const IS_WALK_API = API_MODE === 'walk';

const CURRENT_ENV: Environment = IS_WALK_API
  ? 'development'
  : ((__DEV__ ? 'development' : 'production') as Environment);

/**
 * Develop branch / `__DEV__` builds talk to the Backend on this machine (:8080).
 * Set to `false` only when you intentionally want the Render develop host.
 * Release builds (standard) never use this flag — they always use the production host map.
 * Walk builds ignore this flag and always use the local host from BuildConfig.
 */
const USE_LOCAL_DEV_BACKEND = true;

/** Render develop Backend host (no `/api/v1` — appended once in `env.apiBaseUrl`). */
const RENDER_DEV_API_HOST = 'https://acomibackend.onrender.com';

function walkLocalApiHost(): string {
  const host = (nativeBuildConfig.localApiHost ?? '10.0.2.2').trim();
  const port = (nativeBuildConfig.localApiPort ?? '8080').trim();
  if (host.startsWith('http://') || host.startsWith('https://')) {
    return host.replace(/\/$/, '');
  }
  return `http://${host}:${port}`;
}

function androidLocalDevelopmentHost(): string {
  if (IS_WALK_API) {
    return walkLocalApiHost();
  }

  if (isAndroidEmulator()) {
    // Emulator alias for the dev machine's localhost.
    return 'http://10.0.2.2:8080';
  }

  // Physical device: Xiaomi USB `adb reverse` drops whenever the USB transport
  // reconnects, which makes localhost:8080 fail for every API. Wi‑Fi LAN host
  // stays reachable while the backend listens on 0.0.0.0:8080.
  // Keep `adb reverse tcp:8081 tcp:8081` for Metro.
  const useLanHostForPhysicalDevice = true;
  if (useLanHostForPhysicalDevice) {
    return `http://${ANDROID_PHYSICAL_LAN_HOST}:8080`;
  }

  return 'http://localhost:8080';
}

function developmentApiHost(): string {
  if (IS_WALK_API) {
    return walkLocalApiHost();
  }

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
  /** True only for the Android `walk` product flavor. */
  isWalkApi: IS_WALK_API,
} as const;
