import en from '../../i18n/locales/en.json';
import { ApiError } from '../../api/types';
import {
  canStartAccountDeletion,
  isVerificationTokenInvalidated,
  resolveDeleteAccountFailure,
  shouldClearSessionAfterDeleteFailure,
} from '../accountDeletion';

function extractFunction(source: string, signature: string): string {
  const start = source.indexOf(signature);
  if (start < 0) {
    throw new Error(`Missing ${signature}`);
  }
  const brace = source.indexOf('{', start);
  let depth = 0;
  for (let index = brace; index < source.length; index += 1) {
    const char = source[index];
    if (char === '{') {
      depth += 1;
    } else if (char === '}') {
      depth -= 1;
      if (depth === 0) {
        return source.slice(start, index + 1);
      }
    }
  }
  throw new Error(`Unclosed ${signature}`);
}

describe('accountDeletion', () => {
  it('exposes a Delete account option in Profile copy', () => {
    expect(en.settings.profile.deleteAccount).toBe('Delete account');
    expect(en.settings.profile.accountManagement).toBe('Account management');
    expect(en.settings.profile.deleteAccountSubtitle).toContain('Permanently delete');
    expect(en.settings.profile.deleteAccountLinkHint).toContain('Nothing is deleted');
    expect(en.settings.profile.logoutHint).toContain('not deleted');
    expect(en.settings.profile.deleteAccountTitle).toContain('account');
    expect(en.settings.profile.deleteAccountMessage).toContain('permanently deletes');
    expect(en.settings.profile.deleteAccountMessage).toContain('cannot be undone');
    expect(en.settings.profile.privacyPolicy).toBe('Privacy Policy');
    expect(en.settings.profile.deleteAccountConfirm).toBe('Delete account');
    expect(en.settings.profile.deleteAccountSendOtp).toBe('Send OTP');
    expect(en.settings.profile.deleteAccountOtpInstead).toBe('Delete with OTP instead');
    expect(en.settings.profile.deleteAccountUsePassword).toBe('Use password instead');
    expect(en.settings.profile.deleteAccountFinalConfirm).toContain('Delete');
    expect(en.settings.profile.deleteAccountSuccess).toBe('Account deleted successfully.');
    expect(en.settings.profile.deleteAccountUnderstand).toContain('cannot be undone');
  });

  it('requires OTP verification before calling delete, then confirms in a modal', () => {
    const profileScreen = require('fs').readFileSync(
      require('path').join(__dirname, '../../screens/ProfileScreen.tsx'),
      'utf8',
    );
    const deleteScreen = require('fs').readFileSync(
      require('path').join(__dirname, '../../screens/auth/DeleteAccountScreen.tsx'),
      'utf8',
    );
    const otpScreen = require('fs').readFileSync(
      require('path').join(__dirname, '../../screens/auth/OtpScreen.tsx'),
      'utf8',
    );
    const authApi = require('fs').readFileSync(
      require('path').join(__dirname, '../../api/authApi.ts'),
      'utf8',
    );

    expect(profileScreen).toContain("navigate('DeleteAccount')");
    expect(profileScreen).not.toContain('deleteAccount()');
    expect(profileScreen).toContain('testID="profile-delete-account"');
    expect(profileScreen).toContain('testID="profile-logout"');
    expect(profileScreen).not.toContain('deleteAccountButton');

    const deleteLinkAt = profileScreen.indexOf('testID="profile-delete-account"');
    const logoutAt = profileScreen.indexOf('testID="profile-logout"');
    expect(deleteLinkAt).toBeGreaterThan(-1);
    expect(logoutAt).toBeGreaterThan(deleteLinkAt);

    const logoutHandler = extractFunction(profileScreen, 'const handleLogout = ');
    expect(logoutHandler).toContain('logout()');
    expect(logoutHandler).not.toContain('DeleteAccount');
    expect(logoutHandler).not.toContain('deleteAccount');
    expect(logoutHandler).not.toContain('authApi');

    const deleteHandler = extractFunction(profileScreen, 'const handleDeleteAccount = ');
    expect(deleteHandler).toContain("navigate('DeleteAccount')");
    expect(deleteHandler).not.toContain('deleteAccount(');
    expect(deleteHandler).not.toContain('logout(');
    expect(deleteScreen).toContain("'ACCOUNT_DELETION'");
    expect(deleteScreen).toContain('deleteAccountByPassword');
    expect(deleteScreen).toContain('deleteAccountOtpInstead');
    expect(deleteScreen).not.toContain('deleteAccountByOtp');
    expect(otpScreen).toContain('ACCOUNT_DELETION');
    expect(otpScreen).toContain('deleteAccountByOtp');
    expect(otpScreen).toContain('DeleteAccountConfirmModal');
    expect(otpScreen).not.toContain("navigate('DeleteAccount', { otpVerified: true })");
    expect(authApi).toContain('/auth/account-deletion');
    expect(authApi).toContain('/auth/account-deletion/password');

    const cancelHandler = extractFunction(deleteScreen, 'function handleCancel()');
    expect(cancelHandler).toContain('goBack()');
    expect(cancelHandler).not.toContain('deleteAccount');
    expect(cancelHandler).not.toContain('sendOtp');
    expect(cancelHandler).not.toContain('logout');
    expect(deleteScreen).toContain("t('common.cancel')");

    const passwordDelete = extractFunction(deleteScreen, 'async function handleDeletePassword()');
    const passwordGate = passwordDelete.indexOf('canStartAccountDeletion');
    const passwordApi = passwordDelete.indexOf('deleteAccountByPassword');
    expect(passwordGate).toBeGreaterThan(-1);
    expect(passwordApi).toBeGreaterThan(passwordGate);

    const otpDelete = extractFunction(otpScreen, 'async function handleConfirmDelete()');
    const otpGate = otpDelete.indexOf('canStartAccountDeletion');
    const otpApi = otpDelete.indexOf('deleteAccountByOtp');
    expect(otpGate).toBeGreaterThan(-1);
    expect(otpApi).toBeGreaterThan(otpGate);
    expect(otpScreen).toContain('setConfirmOpen(false)');
  });

  it('refuses to start deletion until consequences are acknowledged and the user re-authenticates', () => {
    expect(
      canStartAccountDeletion({ acknowledged: false, reauthenticated: false }),
    ).toBe(false);
    expect(
      canStartAccountDeletion({ acknowledged: true, reauthenticated: false }),
    ).toBe(false);
    expect(
      canStartAccountDeletion({ acknowledged: false, reauthenticated: true }),
    ).toBe(false);
    expect(
      canStartAccountDeletion({ acknowledged: true, reauthenticated: true }),
    ).toBe(true);
  });

  it('does not clear the session on cancel-equivalent network failure', () => {
    const networkError = new ApiError('Network error', 0, undefined, true);

    expect(shouldClearSessionAfterDeleteFailure(networkError)).toBe(false);
    expect(resolveDeleteAccountFailure(networkError).messageKey).toBe(
      'common.errors.network',
    );
  });

  it('clears the session when the account is already gone', () => {
    expect(
      shouldClearSessionAfterDeleteFailure(new ApiError('Authentication required', 401)),
    ).toBe(true);
    expect(shouldClearSessionAfterDeleteFailure(new ApiError('User not found', 404))).toBe(
      true,
    );
  });

  it('does not clear the session on server or forbidden errors', () => {
    expect(shouldClearSessionAfterDeleteFailure(new ApiError('Access denied', 403))).toBe(
      false,
    );
    expect(
      shouldClearSessionAfterDeleteFailure(new ApiError('Unexpected error', 500)),
    ).toBe(false);
    expect(resolveDeleteAccountFailure(new ApiError('Access denied', 403)).messageKey).toBe(
      'settings.profile.deleteAccountForbidden',
    );
  });

  it('treats verification-token failures as invalidated deletion state', () => {
    expect(
      isVerificationTokenInvalidated(
        new ApiError('Invalid or expired verification token.', 400),
      ),
    ).toBe(true);
    expect(
      isVerificationTokenInvalidated(
        new ApiError('This verification token has already been used.', 400),
      ),
    ).toBe(true);
    expect(isVerificationTokenInvalidated(new ApiError('Network error', 0, undefined, true))).toBe(
      false,
    );
  });
});
