import { Platform } from 'react-native';

type Environment = 'development' | 'staging' | 'production';

const CURRENT_ENV: Environment =
  (__DEV__ ? 'development' : 'production') as Environment;

const API_HOSTS: Record<Environment, string> = {
  development: Platform.select({
    android: 'http://10.0.2.2:8080',
    ios: 'http://localhost:8080',
    default: 'http://localhost:8080',
  })!,
  staging: 'https://staging-api.countin.app',
  production: 'https://api.countin.app',
};

export const env = {
  environment: CURRENT_ENV,
  apiBaseUrl: `${API_HOSTS[CURRENT_ENV]}/api/v1`,
  apiTimeoutMs: 30_000,
} as const;
