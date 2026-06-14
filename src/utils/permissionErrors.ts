import { ApiError } from '../api/types';
import { i18n } from '../i18n';

const MESSAGE_KEYS: Array<{ pattern: RegExp; key: string }> = [
  {
    pattern: /not a member of this space/i,
    key: 'permissions.errors.notAMember',
  },
  {
    pattern: /only view your own stay|own occupancy|own-scope/i,
    key: 'permissions.errors.ownScopeOnly',
  },
  {
    pattern: /permission to view accommodation structure/i,
    key: 'permissions.errors.noAccommodationAccess',
  },
  {
    pattern: /only owner or manager can perform/i,
    key: 'permissions.errors.ownerOrManagerOnly',
  },
  {
    pattern: /only the space owner can perform/i,
    key: 'permissions.errors.ownerOnly',
  },
  {
    pattern: /customers cannot access occupancy/i,
    key: 'permissions.errors.customerNoOccupancy',
  },
  {
    pattern: /member-specific occupancy endpoints/i,
    key: 'permissions.errors.useMemberOccupancyEndpoint',
  },
  {
    pattern: /owner and manager members cannot be allocated/i,
    key: 'permissions.errors.nonResidentMember',
  },
  {
    pattern: /not applicable for mess spaces/i,
    key: 'permissions.errors.messNoAccommodation',
  },
];

const ERROR_CODE_KEYS: Record<string, string> = {
  NOT_A_MEMBER: 'permissions.errors.notAMember',
  OWN_SCOPE_ONLY: 'permissions.errors.ownScopeOnly',
};

export function getPermissionErrorMessage(error: unknown, fallbackKey?: string): string {
  if (!(error instanceof ApiError)) {
    return i18n.t(fallbackKey ?? 'common.errors.generic');
  }

  const errorCode = error.body?.errorCode;
  if (errorCode && ERROR_CODE_KEYS[errorCode]) {
    return i18n.t(ERROR_CODE_KEYS[errorCode]);
  }

  const message = error.message ?? '';
  for (const { pattern, key } of MESSAGE_KEYS) {
    if (pattern.test(message)) {
      return i18n.t(key);
    }
  }

  if (error.status === 403) {
    return i18n.t('permissions.errors.forbidden');
  }

  return message || i18n.t(fallbackKey ?? 'common.errors.generic');
}

/** Returns true when the error was a permission denial and should stop retries. */
export function isPermissionDeniedError(error: unknown): boolean {
  return error instanceof ApiError && error.status === 403;
}

export function shouldRedirectOnPermissionError(error: unknown): boolean {
  if (!(error instanceof ApiError) || error.status !== 403) {
    return false;
  }
  const code = error.body?.errorCode;
  return code === 'NOT_A_MEMBER' || /view accommodation structure/i.test(error.message ?? '');
}
