/**
 * Whether the owner/manager dashboard should render the Meal operations block.
 * Mess and lodging spaces with meals: show when the caller can manage meals.
 * Rental never shows meal operations (capability HIDDEN).
 */
export function shouldShowDashboardMealOperations(input: {
  showOwnerDashboard: boolean;
  canManageMeals: boolean;
  isMess: boolean;
  accommodationApplicable: boolean;
  /** Optional progressive-access override — when HIDDEN, never show. */
  mealOpsHidden?: boolean;
  isRental?: boolean;
}): boolean {
  if (!input.showOwnerDashboard || !input.canManageMeals) {
    return false;
  }
  if (input.mealOpsHidden === true || input.isRental === true) {
    return false;
  }

  if (input.isMess) {
    return true;
  }

  return input.accommodationApplicable;
}
