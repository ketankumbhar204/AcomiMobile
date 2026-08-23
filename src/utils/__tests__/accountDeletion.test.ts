import en from '../../i18n/locales/en.json';
import { ApiError } from '../../api/types';
import {
  resolveDeleteAccountFailure,
  shouldClearSessionAfterDeleteFailure,
} from '../accountDeletion';

describe('accountDeletion', () => {
  it('exposes a Delete account option in Profile copy', () => {
    expect(en.settings.profile.deleteAccount).toBe('Delete account');
    expect(en.settings.profile.deleteAccountTitle).toContain('account');
    expect(en.settings.profile.deleteAccountMessage).toContain('permanently deletes');
    expect(en.settings.profile.deleteAccountMessage).toContain('cannot be undone');
    expect(en.settings.profile.privacyPolicy).toBe('Privacy Policy');
    expect(en.settings.profile.deleteAccountConfirm).toBe('Delete account');
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
});
