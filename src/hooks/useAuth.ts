import { useCallback, useState } from 'react';
import { authApi } from '../api/authApi';
import { ApiError, SendOtpResponse, UserResponse, UUID, VerifyOtpResponse } from '../api/types';
import { i18n } from '../i18n';
import { useAuthStore } from '../store/authStore';
import { useRegistrationDraftStore } from '../store/registrationDraftStore';
import {
  mapOtpRequestError,
  mapOtpVerifyError,
  mapRegistrationTokenError,
} from '../utils/otpAuthErrors';

export function getAuthRequiredMessage(): string {
  return i18n.t('common.errors.authRequired');
}

export function useAuthenticatedUser(): UserResponse | null {
  return useAuthStore(state => state.user);
}

export function useAuthenticatedUserId(): UUID | null {
  return useAuthStore(state => state.userId);
}

type UseSendOtpResult = {
  sendOtp: (mobileNumber: string) => Promise<SendOtpResponse | null>;
  isLoading: boolean;
  error: string | null;
  clearError: () => void;
};

export function useSendOtp(): UseSendOtpResult {
  const beginOtp = useRegistrationDraftStore(state => state.beginOtp);
  const markResent = useRegistrationDraftStore(state => state.markResent);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const sendOtp = useCallback(
    async (mobileNumber: string): Promise<SendOtpResponse | null> => {
      setIsLoading(true);
      setError(null);
      try {
        const result = await authApi.sendOtp({
          mobileNumber,
          purpose: 'REGISTER',
        });
        const currentMobile = useRegistrationDraftStore.getState().mobileNumber;
        if (currentMobile === mobileNumber) {
          markResent(result.expiresIn, result.resendAfter);
        } else {
          beginOtp(mobileNumber, result.expiresIn, result.resendAfter);
        }
        return result;
      } catch (err) {
        setError(mapOtpRequestError(err));
        return null;
      } finally {
        setIsLoading(false);
      }
    },
    [beginOtp, markResent],
  );

  return { sendOtp, isLoading, error, clearError: () => setError(null) };
}

type UseVerifyOtpResult = {
  verifyOtp: (mobileNumber: string, otp: string) => Promise<VerifyOtpResponse | null>;
  isLoading: boolean;
  error: string | null;
  clearError: () => void;
};

export function useVerifyOtp(): UseVerifyOtpResult {
  const setVerified = useRegistrationDraftStore(state => state.setVerified);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const verifyOtp = useCallback(
    async (mobileNumber: string, otp: string): Promise<VerifyOtpResponse | null> => {
      setIsLoading(true);
      setError(null);
      try {
        const result = await authApi.verifyOtp({
          mobileNumber,
          otp,
          purpose: 'REGISTER',
        });
        setVerified(result.verificationToken, result.expiresIn);
        return result;
      } catch (err) {
        setError(mapOtpVerifyError(err));
        return null;
      } finally {
        setIsLoading(false);
      }
    },
    [setVerified],
  );

  return { verifyOtp, isLoading, error, clearError: () => setError(null) };
}

type UsePasswordAuthResult = {
  submit: (mobileNumber: string, password: string) => Promise<boolean>;
  isLoading: boolean;
  error: string | null;
  clearError: () => void;
};

export function useLogin(): UsePasswordAuthResult {
  const setSession = useAuthStore(state => state.setSession);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = useCallback(
    async (mobileNumber: string, password: string): Promise<boolean> => {
      setIsLoading(true);
      setError(null);
      try {
        const result = await authApi.login({ mobileNumber, password });
        await setSession(result.user, result.accessToken);
        return true;
      } catch (err) {
        setError(mapPasswordAuthError(err, 'login'));
        return false;
      } finally {
        setIsLoading(false);
      }
    },
    [setSession],
  );

  return { submit, isLoading, error, clearError: () => setError(null) };
}

type UseRegisterResult = {
  submit: (payload: {
    fullName: string;
    mobileNumber: string;
    password: string;
    confirmPassword: string;
    verificationToken?: string;
  }) => Promise<boolean>;
  isLoading: boolean;
  error: string | null;
  clearError: () => void;
};

export function useRegister(): UseRegisterResult {
  const setSession = useAuthStore(state => state.setSession);
  const clearDraft = useRegistrationDraftStore(state => state.clear);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = useCallback(
    async (payload: {
      fullName: string;
      mobileNumber: string;
      password: string;
      confirmPassword: string;
      verificationToken?: string;
    }): Promise<boolean> => {
      setIsLoading(true);
      setError(null);
      try {
        const result = await authApi.register(payload);
        clearDraft();
        await setSession(result.user, result.accessToken);
        return true;
      } catch (err) {
        setError(mapPasswordAuthError(err, 'register'));
        return false;
      } finally {
        setIsLoading(false);
      }
    },
    [clearDraft, setSession],
  );

  return { submit, isLoading, error, clearError: () => setError(null) };
}

function mapPasswordAuthError(err: unknown, mode: 'login' | 'register'): string {
  if (err instanceof ApiError) {
    if (err.isNetworkError) {
      return i18n.t('common.errors.network');
    }
    if (mode === 'login' && err.status === 401) {
      return i18n.t('common.errors.invalidCredentials');
    }
    if (mode === 'register') {
      return mapRegistrationTokenError(err);
    }
    if (err.message.toLowerCase().includes('inactive')) {
      return i18n.t('common.errors.accountDisabled');
    }
    return err.message;
  }
  return i18n.t('common.errors.generic');
}
