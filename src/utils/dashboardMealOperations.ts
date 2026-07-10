/**
 * Whether the owner/manager dashboard should render the Meal operations block.
 *
 * Mess and accommodation spaces: show when the caller can manage meals.
 * (Mess previously required summary.messOperations, which hid the whole block
 * when the summary payload was empty/failed — leaving only Quick Actions.)
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
    return true;
  }

  return input.accommodationApplicable;
}
