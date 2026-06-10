import { useCallback, useState } from 'react';
import { authApi } from '../api/authApi';
import { ApiError, UserResponse, UUID } from '../api/types';
import { i18n } from '../i18n';
import { useAuthStore } from '../store/authStore';

export function getAuthRequiredMessage(): string {
  return i18n.t('common.errors.authRequired');
}

export function useAuthenticatedUser(): UserResponse | null {
  return useAuthStore(state => state.user);
}

export function useAuthenticatedUserId(): UUID | null {
  return useAuthStore(state => state.userId);
}

// ─── Send OTP ───────────────────────────────────────────────────────────────

type UseSendOtpResult = {
  sendOtp: (mobileNumber: string) => Promise<boolean>;
  isLoading: boolean;
  error: string | null;
  clearError: () => void;
};

export function useSendOtp(): UseSendOtpResult {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const sendOtp = useCallback(async (mobileNumber: string): Promise<boolean> => {
    setIsLoading(true);
    setError(null);
    try {
      await authApi.sendOtp({ mobileNumber });
      return true;
    } catch (err) {
      const message =
        err instanceof ApiError
          ? err.message
          : i18n.t('common.errors.sendOtp');
      setError(message);
      return false;
    } finally {
      setIsLoading(false);
    }
  }, []);

  return { sendOtp, isLoading, error, clearError: () => setError(null) };
}

// ─── Verify OTP ─────────────────────────────────────────────────────────────

type UseVerifyOtpResult = {
  verifyOtp: (mobileNumber: string, otp: string) => Promise<boolean>;
  isLoading: boolean;
  error: string | null;
  clearError: () => void;
};

export function useVerifyOtp(): UseVerifyOtpResult {
  const setSession = useAuthStore(state => state.setSession);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const verifyOtp = useCallback(
    async (mobileNumber: string, otp: string): Promise<boolean> => {
      setIsLoading(true);
      setError(null);
      try {
        const result = await authApi.verifyOtp({ mobileNumber, otp });
        await setSession(result.user, result.accessToken);
        return true;
      } catch (err) {
        let message = i18n.t('common.errors.generic');
        if (err instanceof ApiError) {
          if (err.status === 400) {
            message =
              err.message.toLowerCase().includes('inactive')
                ? i18n.t('common.errors.accountDisabled')
                : i18n.t('common.errors.incorrectOtp');
          } else if (err.isNetworkError) {
            message = i18n.t('common.errors.network');
          } else {
            message = err.message;
          }
        }
        setError(message);
        return false;
      } finally {
        setIsLoading(false);
      }
    },
    [setSession],
  );

  return { verifyOtp, isLoading, error, clearError: () => setError(null) };
}
