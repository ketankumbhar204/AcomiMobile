import { spaceDashboardHeaderDestination, spaceHeaderLines } from '../spaceHeaderNav';

describe('space dashboard header navigation', () => {
  it('sends Home to the account landing even when a previous screen exists', () => {
    expect(spaceDashboardHeaderDestination('home', true)).toBe('account-home');
    expect(spaceDashboardHeaderDestination('home', false)).toBe('account-home');
  });

  it('keeps Back on the previous screen', () => {
    expect(spaceDashboardHeaderDestination('back', true)).toBe('previous');
  });

  it('falls back to the account landing only when Back has nowhere to go', () => {
    expect(spaceDashboardHeaderDestination('back', false)).toBe('account-home');
  });

  it('keeps the space name and location on separate lines', () => {
    expect(spaceHeaderLines('E2E PG 26130', 'E2E location, Pune')).toEqual({
      title: 'E2E PG 26130',
      location: 'E2E location, Pune',
    });
    expect(spaceHeaderLines('  Hostel  ', '   ')).toEqual({
      title: 'Hostel',
      location: null,
    });
  });
});
