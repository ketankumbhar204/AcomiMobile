import type { MealDeliveryLocation } from '../api/types';

/** Secondary line: address and/or details when present. Never returns N/A. */
export function formatDeliveryLocationSecondary(
  location: Pick<MealDeliveryLocation, 'address' | 'description'>,
): string | null {
  const parts = [location.address?.trim(), location.description?.trim()].filter(
    (part): part is string => Boolean(part),
  );
  return parts.length > 0 ? parts.join(', ') : null;
}

/** Single-line label for compact summaries. Omits brackets when no secondary info. */
export function formatDeliveryLocationLabel(
  location: Pick<MealDeliveryLocation, 'name' | 'address' | 'description'>,
): string {
  const secondary = formatDeliveryLocationSecondary(location);
  return secondary ? `${location.name} (${secondary})` : location.name;
}
