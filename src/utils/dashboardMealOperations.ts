/**
 * Whether the owner/manager dashboard should render the Meal operations block.
 *
 * Mess: unchanged — requires summary.messOperations from dashboard-summary.
 * PG / accommodation: same meal-management permission as the Meals quick action.
 */
export function shouldShowDashboardMealOperations(input: {
  showOwnerDashboard: boolean;
  canManageMeals: boolean;
  isMess: boolean;
  accommodationApplicable: boolean;
  hasMessOperationsSummary: boolean;
}): boolean {
  if (!input.showOwnerDashboard || !input.canManageMeals) {
    return false;
  }

  if (input.isMess) {
    return input.hasMessOperationsSummary;
  }

  return input.accommodationApplicable;
}
