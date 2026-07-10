import { shouldShowDashboardMealOperations } from '../dashboardMealOperations';

describe('shouldShowDashboardMealOperations', () => {
  it('shows for Mess when manager can manage meals even without messOperations summary', () => {
    expect(
      shouldShowDashboardMealOperations({
        showOwnerDashboard: true,
        canManageMeals: true,
        isMess: true,
        accommodationApplicable: false,
        hasMessOperationsSummary: false,
      }),
    ).toBe(true);
  });

  it('shows for Mess when summary includes messOperations', () => {
    expect(
      shouldShowDashboardMealOperations({
        showOwnerDashboard: true,
        canManageMeals: true,
        isMess: true,
        accommodationApplicable: false,
        hasMessOperationsSummary: true,
      }),
    ).toBe(true);
  });

  it('shows for PG when manager can manage meals', () => {
    expect(
      shouldShowDashboardMealOperations({
        showOwnerDashboard: true,
        canManageMeals: true,
        isMess: false,
        accommodationApplicable: true,
        hasMessOperationsSummary: false,
      }),
    ).toBe(true);
  });

  it('hides for PG when accommodation does not apply', () => {
    expect(
      shouldShowDashboardMealOperations({
        showOwnerDashboard: true,
        canManageMeals: true,
        isMess: false,
        accommodationApplicable: false,
        hasMessOperationsSummary: false,
      }),
    ).toBe(false);
  });

  it('hides when user cannot manage meals', () => {
    expect(
      shouldShowDashboardMealOperations({
        showOwnerDashboard: true,
        canManageMeals: false,
        isMess: false,
        accommodationApplicable: true,
        hasMessOperationsSummary: false,
      }),
    ).toBe(false);
  });
});
