/** Use a filter drawer when a screen has more than this many filter options. */
export const FILTER_DRAWER_OPTION_THRESHOLD = 3;

export function shouldUseFilterDrawer(optionCount: number): boolean {
  return optionCount > FILTER_DRAWER_OPTION_THRESHOLD;
}
