import { ApiError } from '../api/types';
import { i18n } from '../i18n';

const MESSAGE_PATTERNS: Array<{ pattern: RegExp; key: string }> = [
  {
    pattern: /active or reserved occupancy/i,
    key: 'occupancy.errors.alreadyOccupied',
  },
  {
    pattern: /move-in date has not been reached/i,
    key: 'occupancy.errors.moveInDateNotReached',
  },
  {
    pattern: /male-only/i,
    key: 'occupancy.errors.genderMaleOnly',
  },
  {
    pattern: /female-only/i,
    key: 'occupancy.errors.genderFemaleOnly',
  },
  {
    pattern: /gender does not match/i,
    key: 'occupancy.errors.genderMismatch',
  },
  {
    pattern: /not available|status:\s*MAINTENANCE/i,
    key: 'occupancy.errors.targetMaintenance',
  },
  {
    pattern: /status:\s*BLOCKED|blocked/i,
    key: 'occupancy.errors.targetBlocked',
  },
  {
    pattern: /not available|occupied|reserved/i,
    key: 'occupancy.errors.targetUnavailable',
  },
];

function mapKnownMessage(message: string): string | null {
  const normalized = message.toLowerCase();
  for (const { pattern, key } of MESSAGE_PATTERNS) {
    if (pattern.test(normalized)) {
      return i18n.t(key);
    }
  }
  return null;
}

export function getOccupancyErrorMessage(
  error: unknown,
  fallbackKey = 'occupancy.errors.generic',
): string {
  if (!(error instanceof ApiError)) {
    return i18n.t(fallbackKey);
  }

  if (error.message) {
    return mapKnownMessage(error.message) ?? error.message;
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
