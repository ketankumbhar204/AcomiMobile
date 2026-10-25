import { spaceTabRouteNamesForPermissions } from '../spaceTabRoutes';
import {
  focusedSpaceTabRouteName,
  spaceDashboardHeaderDestination,
  spaceHeaderLeadingForRoute,
  spaceHeaderLines,
  spaceTabHeaderBackAncestorIndex,
} from '../spaceHeaderNav';

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

  it('shows the home icon only on the Dashboard tab', () => {
    expect(spaceHeaderLeadingForRoute('Dashboard')).toBe('home');
    expect(spaceHeaderLeadingForRoute('Members')).toBe('back');
    expect(spaceHeaderLeadingForRoute('Accommodation')).toBe('back');
    expect(spaceHeaderLeadingForRoute('Meals')).toBe('back');
    expect(spaceHeaderLeadingForRoute('Payments')).toBe('back');
    expect(spaceHeaderLeadingForRoute('Complaints')).toBe('back');
    expect(spaceHeaderLeadingForRoute(undefined)).toBe('back');
  });

  it('uses the same leading rule for every role tab set', () => {
    const profiles = [
      { canManageMembers: true, canViewAccommodation: true },
      { canManageMembers: true, canViewAccommodation: false },
      { canManageMembers: false, canViewAccommodation: true },
      { canManageMembers: false, canViewAccommodation: false },
    ];

    for (const profile of profiles) {
      for (const routeName of spaceTabRouteNamesForPermissions(profile)) {
        expect(spaceHeaderLeadingForRoute(routeName)).toBe(
          routeName === 'Dashboard' ? 'home' : 'back',
        );
      }
    }
  });

  it('reads the focused space tab from tab state and from a parent stack', () => {
    expect(
      focusedSpaceTabRouteName({
        type: 'tab',
        index: 0,
        routes: [{ name: 'Dashboard' }, { name: 'Members' }, { name: 'Payments' }],
      }),
    ).toBe('Dashboard');

    expect(
      focusedSpaceTabRouteName({
        type: 'tab',
        index: 1,
        routes: [{ name: 'Dashboard' }, { name: 'Members' }, { name: 'Payments' }],
      }),
    ).toBe('Members');

    expect(
      focusedSpaceTabRouteName({
        type: 'stack',
        index: 1,
        routes: [
          { name: 'MemberTabs' },
          {
            name: 'SpaceTabs',
            state: {
              type: 'tab',
              index: 3,
              routes: [
                { name: 'Dashboard' },
                { name: 'Members' },
                { name: 'Accommodation' },
                { name: 'Meals' },
                { name: 'Payments' },
              ],
            },
          },
        ],
      }),
    ).toBe('Meals');
  });

  it('does not treat a non-space stack screen as a space tab', () => {
    expect(
      focusedSpaceTabRouteName({
        type: 'stack',
        index: 1,
        routes: [{ name: 'MemberTabs' }, { name: 'MemberDetails' }],
      }),
    ).toBeUndefined();
  });

  it('pops the previous stack screen and skips the tab navigator', () => {
    expect(
      spaceTabHeaderBackAncestorIndex([
        { type: 'tab', index: 3 },
        { type: 'stack', index: 1 },
        { type: 'stack', index: 0 },
      ]),
    ).toBe(1);
  });

  it('uses the account-home fallback when the space tab is the root screen', () => {
    expect(
      spaceTabHeaderBackAncestorIndex([
        { type: 'tab', index: 2 },
        { type: 'stack', index: 0 },
        { type: 'stack', index: 0 },
      ]),
    ).toBeNull();
    expect(spaceTabHeaderBackAncestorIndex([])).toBeNull();
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
