import { spaceTabRouteNamesForPermissions } from '../spaceTabRoutes';

describe('spaceTabRouteNamesForPermissions', () => {
  it('omits Accommodation for Mess-like permissions', () => {
    expect(
      spaceTabRouteNamesForPermissions({
        canManageMembers: true,
        canViewAccommodation: false,
      }),
    ).toEqual(['Dashboard', 'Members', 'Meals', 'Payments', 'Complaints']);
  });

  it('includes Accommodation for PG-like permissions', () => {
    expect(
      spaceTabRouteNamesForPermissions({
        canManageMembers: true,
        canViewAccommodation: true,
      }),
    ).toEqual([
      'Dashboard',
      'Members',
      'Accommodation',
      'Meals',
      'Payments',
      'Complaints',
    ]);
  });

  it('omits Members when caller cannot manage members', () => {
    expect(
      spaceTabRouteNamesForPermissions({
        canManageMembers: false,
        canViewAccommodation: false,
      }),
    ).toEqual(['Dashboard', 'Meals', 'Payments', 'Complaints']);
  });
});
