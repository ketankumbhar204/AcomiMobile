import { useCallback, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { authApi } from '../api/authApi';
import { useToastStore } from '../store/toastStore';
import {
  resolveDeleteAccountFailure,
  shouldClearSessionAfterDeleteFailure,
} from '../utils/accountDeletion';
import { useLogout } from './useLogout';

type UseDeleteAccountResult = {
  deleteAccount: () => Promise<boolean>;
  isDeleting: boolean;
};

export function useDeleteAccount(): UseDeleteAccountResult {
  const { t } = useTranslation();
  const logout = useLogout();
  const showToast = useToastStore(state => state.showToast);
  const [isDeleting, setIsDeleting] = useState(false);

  const deleteAccount = useCallback(async (): Promise<boolean> => {
    setIsDeleting(true);
    try {
      await authApi.deleteAccount();
      await logout();
      return true;
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
  }, [logout, showToast, t]);

  return { deleteAccount, isDeleting };
}
