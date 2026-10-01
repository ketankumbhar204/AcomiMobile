import { ApiError } from '../../api/types';
import {
  enquiryErrorMessage,
  isInquiryCreditsRequiredError,
  isListingUnavailableError,
} from '../enquiryErrors';

describe('enquiryErrors', () => {
  it('maps raw space-not-found UUID messages to the listing copy', () => {
    const error = new ApiError(
      "Space not found with id: 'a46d2def-1376-442f-8152-f84f4dfaa9dd'",
      404,
    );
    expect(isListingUnavailableError(error)).toBe(true);
    expect(
      enquiryErrorMessage(error, 'fallback', 'This listing is not available.'),
    ).toBe('This listing is not available.');
  });

  it('keeps other API errors', () => {
    const error = new ApiError('Enter a valid email address.', 400);
    expect(isListingUnavailableError(error)).toBe(false);
    expect(enquiryErrorMessage(error, 'fallback', 'unavailable')).toBe(
      'Enter a valid email address.',
    );
  });

  it('maps credit-limit errors to a clear fallback when message is empty', () => {
    const error = new ApiError('  ', 402, { errorCode: 'WEB_FREE_LIMIT_REACHED' });
    expect(isInquiryCreditsRequiredError(error)).toBe(true);
    expect(enquiryErrorMessage(error, 'fallback', 'unavailable')).toBe(
      'Your free enquiries are used. Buy credits or wait until tomorrow.',
    );
  });
});
