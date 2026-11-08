import { ApiError } from '../../api/types';
import { getOccupancyErrorMessage } from '../occupancyErrors';

jest.mock('../../i18n', () => ({
  i18n: {
    t: (key: string) => key,
  },
}));

describe('getOccupancyErrorMessage', () => {
  it('maps room and bed availability conflicts to unavailable', () => {
    expect(getOccupancyErrorMessage(new ApiError('Bed is not available', 400))).toBe(
      'occupancy.errors.targetUnavailable',
    );
    expect(getOccupancyErrorMessage(new ApiError('Room is not available', 400))).toBe(
      'occupancy.errors.targetUnavailable',
    );
    expect(getOccupancyErrorMessage(new ApiError('Unit is not available', 400))).toBe(
      'occupancy.errors.targetUnavailable',
    );
  });

  it('keeps maintenance and blocked status messages', () => {
    expect(
      getOccupancyErrorMessage(new ApiError('Bed is not available (status: MAINTENANCE)', 400)),
    ).toBe('occupancy.errors.targetMaintenance');
    expect(
      getOccupancyErrorMessage(new ApiError('Room is not available (status: BLOCKED)', 400)),
    ).toBe('occupancy.errors.targetBlocked');
  });

  it('maps unequal planned end dates and hides unrelated server text', () => {
    expect(
      getOccupancyErrorMessage(
        new ApiError(
          'expectedExitDate and expectedCheckoutDate must be the same planned end date',
          400,
        ),
      ),
    ).toBe('occupancy.errors.plannedEndMismatch');
    expect(getOccupancyErrorMessage(new ApiError('column occupancies.secret failed', 500))).toBe(
      'occupancy.errors.generic',
    );
  });

  it('maps a date-range overlap and does not treat it as success', () => {
    const message = 'This stay overlaps another stay on that bed, room, or unit.';
    expect(getOccupancyErrorMessage(new ApiError(message, 400))).toBe('occupancy.errors.stayOverlap');
    expect(getOccupancyErrorMessage(new ApiError(message, 400))).not.toBe('occupancy.errors.generic');
  });

  it('still maps known rent validation', () => {
    expect(
      getOccupancyErrorMessage(new ApiError('Rent is required when activating occupancy', 400)),
    ).toBe('occupancy.contract.errors.rentRequired');
  });
});
