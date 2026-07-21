import type { MealDeliveryLocation, UUID } from '../api/types';

/**
 * MVP: prefer last selected when still active; otherwise first active catalog location.
 */
export function resolvePreferredDeliveryLocationId(
  locations: MealDeliveryLocation[],
  lastSelectedId?: UUID | null,
): UUID | undefined {
  if (!locations.length) {
    return undefined;
  }
  if (lastSelectedId && locations.some(location => location.id === lastSelectedId)) {
    return lastSelectedId;
  }
  return locations[0]?.id;
}
