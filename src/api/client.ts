import axios, {
  AxiosError,
  AxiosInstance,
  InternalAxiosRequestConfig,
} from 'axios';
import { env } from '../config/env';
import { ApiError, ApiErrorBody } from './types';

const LOG_TAG = '[Acomi API]';

let authToken: string | null = null;

export function setAuthToken(token: string | null): void {
  authToken = token;
}

export function getAuthToken(): string | null {
  return authToken;
}

function logRequest(config: InternalAxiosRequestConfig): void {
  if (!__DEV__) {
    return;
  }

  const method = config.method?.toUpperCase() ?? 'GET';
  const url = `${config.baseURL ?? ''}${config.url ?? ''}`;

  console.log(`${LOG_TAG} → ${method} ${url}`);

  if (config.params) {
    console.log(`${LOG_TAG}   Params:`, JSON.stringify(config.params, null, 2));
  }

  if (config.data) {
    console.log(`${LOG_TAG}   Request body:`, JSON.stringify(config.data, null, 2));
  }
}

function logResponse(
  status: number,
  method: string | undefined,
  url: string | undefined,
  data: unknown,
): void {
  if (!__DEV__) {
    return;
  }

  console.log(
    `${LOG_TAG} ← ${status} ${method?.toUpperCase() ?? 'GET'} ${url ?? ''}`,
  );
  try {
    const serialized = JSON.stringify(data);
    const maxLen = 2500;
    console.log(
      `${LOG_TAG}   Response:`,
      serialized != null && serialized.length > maxLen
        ? `${serialized.slice(0, maxLen)}…[truncated ${serialized.length} chars]`
        : serialized,
    );
  } catch {
    console.log(`${LOG_TAG}   Response: [unserializable]`);
  }
}

function logError(error: AxiosError<ApiErrorBody>): void {
  if (!__DEV__) {
    return;
  }

  const method = error.config?.method?.toUpperCase() ?? 'GET';
  const url = `${error.config?.baseURL ?? ''}${error.config?.url ?? ''}`;

  if (error.response) {
    console.error(`${LOG_TAG} ✗ ${error.response.status} ${method} ${url}`);
    console.error(
      `${LOG_TAG}   Error body:`,
      JSON.stringify(error.response.data, null, 2),
    );
  } else {
    console.error(`${LOG_TAG} ✗ Network error ${method} ${url}`);
    console.error(`${LOG_TAG}   Message:`, error.message);
  }
}

function attachAuthHeader(
  config: InternalAxiosRequestConfig,
): InternalAxiosRequestConfig {
  if (authToken) {
    config.headers.Authorization = `Bearer ${authToken}`;
  }
  return config;
}

function normalizeApiError(error: AxiosError<ApiErrorBody>): ApiError {
  if (!error.response) {
    return new ApiError(
      'Network error. Please check your connection and try again.',
      0,
      undefined,
      true,
    );
  }

  const { status, data } = error.response;
  const message =
    data?.message ??
    data?.error ??
    error.message ??
    'An unexpected error occurred.';

  return new ApiError(message, status, data);
}

const apiClient: AxiosInstance = axios.create({
  baseURL: env.apiBaseUrl,
  timeout: env.apiTimeoutMs,
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
});

apiClient.interceptors.request.use(
  config => {
    logRequest(config);
    return attachAuthHeader(config);
  },
  error => {
    if (__DEV__) {
      console.error(`${LOG_TAG} ✗ Request setup error:`, error);
    }
    return Promise.reject(error);
  },
);

apiClient.interceptors.response.use(
  response => {
    logResponse(
      response.status,
      response.config.method,
      `${response.config.baseURL ?? ''}${response.config.url ?? ''}`,
      response.data,
    );
    return response;
  },
  (error: AxiosError<ApiErrorBody>) => {
    logError(error);
    const apiError = normalizeApiError(error);

    if (apiError.status === 401) {
      setAuthToken(null);
    }

    return Promise.reject(apiError);
  },
);

export default apiClient;
