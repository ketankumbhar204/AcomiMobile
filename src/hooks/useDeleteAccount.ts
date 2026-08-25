import { useCallback, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { authApi } from '../api/authApi';
import { useToastStore } from '../store/toastStore';
import {
  isVerificationTokenInvalidated,
  resolveDeleteAccountFailure,
  shouldClearSessionAfterDeleteFailure,
} from '../utils/accountDeletion';
import { useLogout } from './useLogout';

export type DeleteAccountByOtpResult =
  | { ok: true }
  | { ok: false; error: string; tokenInvalidated: boolean };

type UseDeleteAccountResult = {
  deleteAccount: () => Promise<boolean>;
  deleteAccountByPassword: (
    mobileNumber: string,
    password: string,
  ) => Promise<DeleteAccountByOtpResult>;
  deleteAccountByOtp: (
    mobileNumber: string,
    verificationToken: string,
  ) => Promise<DeleteAccountByOtpResult>;
  isDeleting: boolean;
};

export function useDeleteAccount(): UseDeleteAccountResult {
  const { t } = useTranslation();
  const logout = useLogout();
  const showToast = useToastStore(state => state.showToast);
  const [isDeleting, setIsDeleting] = useState(false);

  const finishAfterDelete = useCallback(async () => {
    await logout();
    return true;
  }, [logout]);

  const deleteAccount = useCallback(async (): Promise<boolean> => {
    setIsDeleting(true);
    try {
      await authApi.deleteAccount();
      return await finishAfterDelete();
    } catch (error) {
      if (shouldClearSessionAfterDeleteFailure(error)) {
        await logout();
        return true;
      }
      const failure = resolveDeleteAccountFailure(error);
      showToast(
        failure.serverMessage ||
          t(failure.messageKey, {
            defaultValue: 'Could not delete your account. Please try again.',
          }),
      );
      return false;
    } finally {
      setIsDeleting(false);
    }
  }, [finishAfterDelete, logout, showToast, t]);

  const deleteAccountByPassword = useCallback(
    async (mobileNumber: string, password: string): Promise<DeleteAccountByOtpResult> => {
      setIsDeleting(true);
      try {
        await authApi.deleteAccountByPassword({ mobileNumber, password });
        await finishAfterDelete();
        return { ok: true };
      } catch (error) {
        const failure = resolveDeleteAccountFailure(error);
        return {
          ok: false,
          error:
            failure.serverMessage ||
            t(failure.messageKey, {
              defaultValue: 'Could not delete your account. Please try again.',
            }),
          tokenInvalidated: false,
        };
      } finally {
        setIsDeleting(false);
      }
    },
    [finishAfterDelete, t],
  );

  const deleteAccountByOtp = useCallback(
    async (
      mobileNumber: string,
      verificationToken: string,
    ): Promise<DeleteAccountByOtpResult> => {
      if (isDeleting) {
        return {
          ok: false,
          error: t('settings.profile.deleteAccountFailed', {
            defaultValue: 'Could not delete your account. Please try again.',
          }),
          tokenInvalidated: false,
        };
      }
      setIsDeleting(true);
      try {
        await authApi.deleteAccountByOtp({ mobileNumber, verificationToken });
        await finishAfterDelete();
        return { ok: true };
      } catch (error) {
        const tokenInvalidated = isVerificationTokenInvalidated(error);
        const failure = resolveDeleteAccountFailure(error);
        return {
          ok: false,
          error:
            failure.serverMessage ||
            t(failure.messageKey, {
              defaultValue: 'Could not delete your account. Please try again.',
            }),
          tokenInvalidated,
        };
      } finally {
        setIsDeleting(false);
      }
    },
    [finishAfterDelete, isDeleting, t],
  );

  return { deleteAccount, deleteAccountByPassword, deleteAccountByOtp, isDeleting };
}
