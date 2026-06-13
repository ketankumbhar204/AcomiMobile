import { ApiError } from '../api/types';
import { i18n } from '../i18n';

export function getOccupancyErrorMessage(
  error: unknown,
  fallbackKey = 'occupancy.errors.generic',
): string {
  if (!(error instanceof ApiError)) {
    return i18n.t(fallbackKey);
  }

  if (error.message) {
    return error.message;
  }

  switch (error.status) {
    case 403:
      return i18n.t('occupancy.errors.forbidden');
    case 404:
      return i18n.t('occupancy.errors.notFound');
    default:
      return i18n.t(fallbackKey);
  }
}
