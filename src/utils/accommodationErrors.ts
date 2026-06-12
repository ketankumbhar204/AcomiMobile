import { ApiError } from '../api/types';
import { i18n } from '../i18n';

export function isAccommodationNotFoundError(error: unknown): boolean {
  return error instanceof ApiError && error.status === 404;
}

export function getAccommodationErrorMessage(
  error: unknown,
  fallbackKey = 'accommodation.errors.generic',
): string {
  if (!(error instanceof ApiError)) {
    return i18n.t(fallbackKey);
  }

  if (error.status === 400 && error.message) {
    return error.message;
  }

  const fieldData = error.body?.data;
  if (
    fieldData &&
    typeof fieldData === 'object' &&
    !Array.isArray(fieldData)
  ) {
    return Object.values(fieldData as Record<string, string>).join('\n');
  }

  switch (error.status) {
    case 403:
      return i18n.t('accommodation.errors.forbidden');
    case 404:
      return i18n.t(
        fallbackKey === 'accommodation.errors.generic'
          ? 'accommodation.errors.notFound'
          : fallbackKey,
      );
    default:
      return error.message || i18n.t(fallbackKey);
  }
}
