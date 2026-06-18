import { ApiError } from '../api/types';
import { i18n } from '../i18n';

export function getMembershipErrorMessage(
  error: unknown,
  fallbackKey = 'membership.errors.generic',
): string {
  if (!(error instanceof ApiError)) {
    return i18n.t(fallbackKey);
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
      return i18n.t('membership.errors.forbidden');
    case 404:
      return i18n.t('membership.errors.notFound');
    case 409: {
      const message = error.message ?? '';
      if (message.toLowerCase().includes('account with this mobile')) {
        return i18n.t('membership.errors.accountExistsInSpace');
      }
      if (message.toLowerCase().includes('member with this mobile')) {
        return i18n.t('membership.errors.mobileExists');
      }
      return message || i18n.t('membership.errors.conflict');
    }
    default:
      return error.message || i18n.t(fallbackKey);
  }
}
