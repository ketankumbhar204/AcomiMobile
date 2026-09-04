import {
  spaceMoreItemsForPermissions,
  spacePrimaryTabRouteNamesForPermissions,
  spaceTabRouteNamesForPermissions,
} from '../spaceTabRoutes';

describe('spacePrimaryTabRouteNamesForPermissions', () => {
  it('omits Accommodation for Mess-like permissions and stays within 5 tabs', () => {
    expect(
      spacePrimaryTabRouteNamesForPermissions({
        canManageMembers: true,
        canViewAccommodation: false,
      }),
    ).toEqual(['Dashboard', 'Members', 'Meals', 'Payments']);
  });

  it('includes Accommodation for PG-like permissions (exactly 5 primary)', () => {
    expect(
      spacePrimaryTabRouteNamesForPermissions({
        canManageMembers: true,
        canViewAccommodation: true,
      }),
    ).toEqual([
      'Dashboard',
      'Members',
      'Accommodation',
      'Meals',
      'Payments',
    ]);
  });

  it('omits Members when caller cannot manage members', () => {
    expect(
      spacePrimaryTabRouteNamesForPermissions({
        canManageMembers: false,
        canViewAccommodation: false,
      }),
    ).toEqual(['Dashboard', 'Meals', 'Payments']);
  });
});

describe('spaceTabRouteNamesForPermissions', () => {
  it('registers hidden Complaints after primary tabs', () => {
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

  it('omits Accommodation for Mess-like permissions', () => {
    expect(
      spaceTabRouteNamesForPermissions({
        canManageMembers: true,
        canViewAccommodation: false,
      }),
    ).toEqual(['Dashboard', 'Members', 'Meals', 'Payments', 'Complaints']);
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

describe('spaceMoreItemsForPermissions', () => {
  it('always includes Complaints', () => {
    expect(spaceMoreItemsForPermissions({ canManageMeals: false })).toEqual([
      { id: 'complaints' },
    ]);
  });

  it('adds meal library and subscription plans for meal managers', () => {
    expect(spaceMoreItemsForPermissions({ canManageMeals: true })).toEqual([
      { id: 'complaints' },
      { id: 'menuLibrary' },
      { id: 'mealSubscriptionPlans' },
    ]);
  });
});
