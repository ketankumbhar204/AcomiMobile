import { canViewOperationalDashboard } from '../dashboardFinancial';

describe('canViewOperationalDashboard', () => {
  it('requires permission flags object (role string alone is never enough)', () => {
    // Regression: Pending Actions used to pass membershipRole string, which made
    // showOwnerDashboard always false and hid MENU_NOT_PLANNED from owners.
    expect(Boolean(canViewOperationalDashboard('OWNER' as never))).toBe(false);
    expect(
      canViewOperationalDashboard({
        canManageMembers: true,
        canManageMeals: true,
        canManageOccupancy: true,
        canViewSpaceOccupancies: true,
      }),
    ).toBe(true);
  });
});
