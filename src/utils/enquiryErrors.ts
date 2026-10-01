import { ApiError } from '../api/types';

const LISTING_UNAVAILABLE =
  /space not found|not available for contact enquiry|listing is not available/i;

export function isListingUnavailableError(error: unknown): boolean {
  const message = error instanceof Error ? error.message : '';
  if (LISTING_UNAVAILABLE.test(message)) {
    return true;
  }
  if (error instanceof ApiError && error.status === 404 && /space/i.test(message)) {
    return true;
  }
  return false;
}

export function isInquiryCreditsRequiredError(error: unknown): boolean {
  return (
    error instanceof ApiError &&
    (error.body?.errorCode === 'WEB_FREE_LIMIT_REACHED' ||
      error.body?.errorCode === 'INQUIRY_CREDITS_REQUIRED')
  );
}

export function enquiryErrorMessage(
  error: unknown,
  fallback: string,
  listingUnavailable: string,
): string {
  if (isListingUnavailableError(error)) {
    return listingUnavailable;
  }
  if (error instanceof ApiError) {
    if (isInquiryCreditsRequiredError(error)) {
      return (
        error.message.trim() ||
        'Your free enquiries are used. Buy credits or wait until tomorrow.'
      );
    }
    if (error.body?.errorCode === 'INQUIRY_PAYMENT_DISABLED') {
      return error.message.trim() || 'Credit purchases are temporarily unavailable.';
    }
    if (error.body?.errorCode === 'RATE_LIMITED') {
      return error.message.trim() || 'Too many enquiries recently. Please try again later.';
    }
    if (error.message.trim()) {
      return error.message;
    }
  }
  return fallback;
}
