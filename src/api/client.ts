import axios, {
  AxiosError,
  AxiosInstance,
  InternalAxiosRequestConfig,
} from 'axios';
import { env } from '../config/env';
import { ApiError, ApiErrorBody } from './types';

let authToken: string | null = null;

export function setAuthToken(token: string | null): void {
  authToken = token;
}

export function getAuthToken(): string | null {
  return authToken;
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
  config => attachAuthHeader(config),
  error => Promise.reject(error),
);

apiClient.interceptors.response.use(
  response => response,
  (error: AxiosError<ApiErrorBody>) => {
    const apiError = normalizeApiError(error);

    if (apiError.status === 401) {
      setAuthToken(null);
    }

    return Promise.reject(apiError);
  },
);

export default apiClient;
