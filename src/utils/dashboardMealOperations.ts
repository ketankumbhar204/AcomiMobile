/**
 * Whether the owner/manager dashboard should render the Meal operations block.
 * Mess and accommodation spaces: show when the caller can manage meals.
 */
export function shouldShowDashboardMealOperations(input: {
  showOwnerDashboard: boolean;
  canManageMeals: boolean;
  isMess: boolean;
  accommodationApplicable: boolean;
}): boolean {
  if (!input.showOwnerDashboard || !input.canManageMeals) {
    return false;
  }

  if (input.isMess) {
    return true;
  }

  return input.accommodationApplicable;
}
