import { ApiError } from '../../api/types';
import { isStartupConnectionFailure } from '../spaceErrors';

jest.mock('../../i18n', () => ({
  i18n: { t: (key: string) => key },
}));

describe('isStartupConnectionFailure', () => {
  it('treats a dropped connection and a downed server as offline', () => {
    expect(isStartupConnectionFailure(new ApiError('Network error', 0, undefined, true))).toBe(
      true,
    );
    expect(isStartupConnectionFailure(new ApiError('down', 503))).toBe(true);
    expect(isStartupConnectionFailure(new ApiError('down', 500))).toBe(true);
  });

  it('leaves a real empty account and auth errors on their existing paths', () => {
    expect(isStartupConnectionFailure(new ApiError('missing', 404))).toBe(false);
    expect(isStartupConnectionFailure(new ApiError('nope', 401))).toBe(false);
    expect(isStartupConnectionFailure(new Error('other'))).toBe(false);
  });
});