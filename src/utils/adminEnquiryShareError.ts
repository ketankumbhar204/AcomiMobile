import { ApiError } from '../api/types';

export type AdminShareErrorCopy = {
  alreadyShared: string;
  notPending: string;
  notFound: string;
  forbidden: string;
  fallback: string;
};

/**
 * User-facing share failure. Prefers the API message, then known enquiry codes.
 */
export function adminEnquiryShareErrorMessage(
  error: unknown,
  copy: AdminShareErrorCopy,
): string {
  const apiMessage = error instanceof ApiError ? error.message.trim() : '';
  const code = error instanceof ApiError ? error.body?.errorCode : undefined;
  const status = error instanceof ApiError ? error.status : 0;

  if (code === 'ENQUIRY_ALREADY_SHARED') {
    return apiMessage || copy.alreadyShared;
  }
  if (code === 'ENQUIRY_NOT_PENDING') {
    return apiMessage || copy.notPending;
  }
  if (status === 404) {
    return apiMessage || copy.notFound;
  }
  if (status === 403) {
    return apiMessage || copy.forbidden;
  }
  if (
    apiMessage &&
    apiMessage !== 'An unexpected error occurred. Please try again later.'
  ) {
    return apiMessage;
  }
  return copy.fallback;
}
