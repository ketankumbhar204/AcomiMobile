/**
 * Sample combos seeded by MealSpaceSetupService.ensureSampleCombos.
 * Used for soft Menu Library guidance — they DO count toward planning readiness.
 */
export const SYSTEM_SAMPLE_COMBO_NAMES = [
  'Standard Lunch Thali',
  'Dal Rice Combo',
  'Chicken Thali',
  'Egg Combo',
] as const;

const SAMPLE_NAME_SET = new Set(
  SYSTEM_SAMPLE_COMBO_NAMES.map(name => name.trim().toLowerCase()),
);

export function isSystemSampleComboName(name: string | null | undefined): boolean {
  if (!name) {
    return false;
  }
  return SAMPLE_NAME_SET.has(name.trim().toLowerCase());
}

/**
 * True when the catalog has at least one owner-created (non-sample) combo,
 * or an item-only catalog with no combos. Used for soft tips only —
 * planning readiness uses catalogHasAnyMealLibrary / hasMealLibrary.
 */
export function catalogHasCuratedMealLibrary(catalog: {
  items: Array<{ isActive: boolean }>;
  combos: Array<{ isActive: boolean; name?: string | null }>;
} | null): boolean {
  if (!catalog) {
    return false;
  }
  const activeCombos = catalog.combos.filter(combo => combo.isActive);
  const hasNonSampleCombo = activeCombos.some(
    combo => !isSystemSampleComboName(combo.name),
  );
  if (hasNonSampleCombo) {
    return true;
  }
  if (activeCombos.length > 0) {
    return false;
  }
  return catalog.items.some(item => item.isActive);
}

/** Raw catalog presence including samples — unlocks menu planning. */
export function catalogHasAnyMealLibrary(catalog: {
  items: Array<{ isActive: boolean }>;
  combos: Array<{ isActive: boolean }>;
} | null): boolean {
  if (!catalog) {
    return false;
  }
  return (
    catalog.items.some(item => item.isActive) ||
    catalog.combos.some(combo => combo.isActive)
  );
}
