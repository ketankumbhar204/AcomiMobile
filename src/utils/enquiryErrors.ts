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

export function enquiryErrorMessage(
  error: unknown,
  fallback: string,
  listingUnavailable: string,
): string {
  if (isListingUnavailableError(error)) {
    return listingUnavailable;
  }
  if (error instanceof ApiError && error.message.trim()) {
    return error.message;
  }
  return fallback;
}
