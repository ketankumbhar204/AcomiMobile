import { shouldShowDashboardMealOperations } from '../dashboardMealOperations';

describe('shouldShowDashboardMealOperations', () => {
  it('shows for Mess when manager can manage meals', () => {
    expect(
      shouldShowDashboardMealOperations({
        showOwnerDashboard: true,
        canManageMeals: true,
        isMess: true,
        accommodationApplicable: false,
      }),
    ).toBe(true);
  });

  it('hides for Mess when meals cannot be managed', () => {
    expect(
      shouldShowDashboardMealOperations({
        showOwnerDashboard: true,
        canManageMeals: false,
        isMess: true,
        accommodationApplicable: false,
      }),
    ).toBe(false);
  });

  it('shows for accommodation when meals can be managed', () => {
    expect(
      shouldShowDashboardMealOperations({
        showOwnerDashboard: true,
        canManageMeals: true,
        isMess: false,
        accommodationApplicable: true,
      }),
    ).toBe(true);
  });

  it('hides when owner dashboard is off', () => {
    expect(
      shouldShowDashboardMealOperations({
        showOwnerDashboard: false,
        canManageMeals: true,
        isMess: true,
        accommodationApplicable: false,
      }),
    ).toBe(false);
  });

  it('hides for non-mess when accommodation is not applicable', () => {
    expect(
      shouldShowDashboardMealOperations({
        showOwnerDashboard: true,
        canManageMeals: true,
        isMess: false,
        accommodationApplicable: false,
      }),
    ).toBe(false);
  });
});
