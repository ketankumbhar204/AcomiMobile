import { ApiError } from '../../api/types';
import { mealPollSaveErrorMessage } from '../mealPollSaveError';

const fallback = 'Could not save menu.';

describe('mealPollSaveErrorMessage', () => {
  it('shows a poll-closed message from the API', () => {
    const error = new ApiError('Poll is closed for Breakfast', 400);
    expect(mealPollSaveErrorMessage(error, fallback)).toBe('Poll is closed for Breakfast');
  });

  it('shows authorization and validation messages', () => {
    expect(
      mealPollSaveErrorMessage(
        new ApiError('You are not eligible for Lunch', 403),
        fallback,
      ),
    ).toBe('You are not eligible for Lunch');
    expect(
      mealPollSaveErrorMessage(new ApiError('Invalid menu option', 400), fallback),
    ).toBe('Invalid menu option');
    expect(
      mealPollSaveErrorMessage(
        new ApiError('Select a payment option to continue', 400),
        fallback,
      ),
    ).toBe('Select a payment option to continue');
  });

  it('keeps the generic copy for unexpected server errors', () => {
    const error = new ApiError(
      'An unexpected error occurred. Please try again later.',
      500,
    );
    expect(mealPollSaveErrorMessage(error, fallback)).toBe(fallback);
  });

  it('hides internal database details', () => {
    const error = new ApiError(
      'could not execute statement; SQL [insert into meal_poll_responses]',
      500,
    );
    expect(mealPollSaveErrorMessage(error, fallback)).toBe(fallback);
  });

  it('uses the network message and falls back for unknown errors', () => {
    expect(
      mealPollSaveErrorMessage(
        new ApiError('Network error. Please check your connection and try again.', 0, undefined, true),
        fallback,
      ),
    ).toBe('Network error. Please check your connection and try again.');
    expect(mealPollSaveErrorMessage(new Error('boom'), fallback)).toBe(fallback);
  });
});
