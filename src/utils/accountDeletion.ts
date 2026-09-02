import { ApiError } from '../api/types';

export type DeleteAccountFailure = {
  clearSession: boolean;
  messageKey:
    | 'common.errors.network'
    | 'settings.profile.deleteAccountForbidden'
    | 'settings.profile.deleteAccountFailed';
  serverMessage?: string;
};

export function isVerificationTokenInvalidated(error: unknown): boolean {
  if (!(error instanceof ApiError)) {
    return false;
  }
  const message = error.message.toLowerCase();
  return (
    message.includes('verification token') ||
    message.includes('already been used') ||
    message.includes('verification is required')
  );
}

/** 401/404 mean the login is already gone; clear the local session. */
export function shouldClearSessionAfterDeleteFailure(error: unknown): boolean {
  return error instanceof ApiError && (error.status === 401 || error.status === 404);
}

export function resolveDeleteAccountFailure(error: unknown): DeleteAccountFailure {
  if (error instanceof ApiError) {
    if (error.isNetworkError || error.status === 0) {
      return { clearSession: false, messageKey: 'common.errors.network' };
    }
    if (error.status === 403) {
      return {
        clearSession: false,
        messageKey: 'settings.profile.deleteAccountForbidden',
      };
    }
    if (error.status >= 500) {
      return {
        clearSession: false,
        messageKey: 'settings.profile.deleteAccountFailed',
      };
    }
    return {
      clearSession: false,
      messageKey: 'settings.profile.deleteAccountFailed',
      serverMessage: error.message,
    };
  }

  return {
    clearSession: false,
    messageKey: 'settings.profile.deleteAccountFailed',
  };
}
