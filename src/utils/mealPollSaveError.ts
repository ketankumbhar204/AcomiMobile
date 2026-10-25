import { ApiError } from '../api/types';

const ACTIONABLE_STATUSES = new Set([400, 403, 404, 409, 422]);

function looksUnsafe(message: string): boolean {
  return /exception|sql|stack trace|org\.springframework|hibernate|constraint |select .* from /i.test(
    message,
  );
}

function isGenericServerMessage(message: string): boolean {
  return /unexpected error occurred/i.test(message);
}

/**
 * User-facing copy for a failed meal-choice save.
 * Business messages from the API are shown as-is. Network failures, generic
 * 500s, and anything that looks like an internal fault stay on the fallback.
 */
export function mealPollSaveErrorMessage(error: unknown, fallback: string): string {
  if (!(error instanceof ApiError)) {
    return fallback;
  }
  if (error.isNetworkError || error.status === 0) {
    const message = error.message?.trim();
    return message || fallback;
  }

  const message = error.message?.trim() ?? '';
  if (!message || isGenericServerMessage(message) || looksUnsafe(message)) {
    return fallback;
  }
  if (ACTIONABLE_STATUSES.has(error.status)) {
    return message;
  }
  return fallback;
}
