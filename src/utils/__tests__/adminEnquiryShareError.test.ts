import { ApiError } from '../../api/types';
import { adminEnquiryShareErrorMessage } from '../adminEnquiryShareError';

const copy = {
  alreadyShared: 'already',
  notPending: 'not pending',
  notFound: 'missing',
  forbidden: 'forbidden',
  fallback: 'Could not share this enquiry.',
};

describe('adminEnquiryShareErrorMessage', () => {
  it('shows the API reason for an ineligible enquiry', () => {
    const error = new ApiError('Only pending enquiries can be shared.', 409, {
      success: false,
      message: 'Only pending enquiries can be shared.',
      errorCode: 'ENQUIRY_NOT_PENDING',
    });
    expect(adminEnquiryShareErrorMessage(error, copy)).toBe(
      'Only pending enquiries can be shared.',
    );
  });

  it('rejects sharing without admin permission', () => {
    const error = new ApiError('Access denied', 403);
    expect(adminEnquiryShareErrorMessage(error, copy)).toBe('Access denied');
  });

  it('keeps a generic message when the server hides the cause', () => {
    const error = new ApiError(
      'An unexpected error occurred. Please try again later.',
      500,
    );
    expect(adminEnquiryShareErrorMessage(error, copy)).toBe(copy.fallback);
  });
});
