import type { ServiceContactDuplicateMatch } from '../api/serviceContactsApi';
import { ApiError } from '../api/types';

export function readDuplicate(
  error: unknown,
): { strong: boolean; matches: ServiceContactDuplicateMatch[] } | null {
  if (!(error instanceof ApiError) || error.body?.errorCode !== 'DUPLICATE_SERVICE_CONTACT') {
    return null;
  }
  const data = error.body?.data as unknown;
  if (!data || typeof data !== 'object') {
    return { strong: false, matches: [] };
  }
  const record = data as {
    strongMatch?: boolean;
    matches?: ServiceContactDuplicateMatch[];
  };
  return {
    strong: Boolean(record.strongMatch),
    matches: Array.isArray(record.matches) ? record.matches : [],
  };
}
