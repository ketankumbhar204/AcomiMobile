import { ApiError } from '../api/types';
import { i18n } from '../i18n';
import { getPermissionErrorMessage } from './permissionErrors';

/** Network loss or a downed server. These must not be treated as "no spaces". */
export function isStartupConnectionFailure(error: unknown): boolean {
  if (!(error instanceof ApiError)) {
    return false;
  }
  return error.isNetworkError || error.status === 0 || error.status >= 500;
}

export function getSpaceErrorMessage(error: unknown, fallbackKey?: string): string {
  if (!(error instanceof ApiError)) {
    return i18n.t(fallbackKey ?? 'common.errors.generic');
  }

  switch (error.status) {
    case 401:
      return i18n.t('spaces.errors.unauthorized');
    case 403:
      return getPermissionErrorMessage(error, 'spaces.errors.forbidden');
    case 404:
      return i18n.t('spaces.errors.notFound');
    case 500:
      return i18n.t('spaces.errors.server');
    default:
      return error.message || i18n.t(fallbackKey ?? 'common.errors.generic');
  }
}
