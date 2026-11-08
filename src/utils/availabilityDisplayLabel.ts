/**
 * Shared user-facing availability terminology.
 *
 * Internal ops focus (`vacant`), API fields (`vacantBeds`), and bed status
 * (`AVAILABLE`) stay unchanged. Only display copy maps vacant inventory to
 * "Available" for owners and users.
 */

export type AvailabilityDisplayNoun = 'short' | 'beds' | 'units';

/** i18n keys that resolve to Available* display strings (not Vacant*). */
export function availabilityDisplayLabelKey(
  noun: AvailabilityDisplayNoun = 'beds',
): string {
  switch (noun) {
    case 'short':
      return 'dashboard.accommodationOperations.vacantBedsShort';
    case 'units':
      return 'dashboard.accommodationOperations.availableUnits';
    case 'beds':
    default:
      return 'dashboard.accommodationOperations.vacantBeds';
  }
}

export function availabilityDrilldownTitleKey(): string {
  return 'dashboard.drilldown.vacantBedsTitle';
}

export function availabilityDrilldownEmptyKey(): string {
  return 'dashboard.drilldown.emptyVacantBeds';
}

/** English fallbacks when i18n is unavailable. */
export const AVAILABILITY_DISPLAY_FALLBACK = {
  short: 'Available',
  beds: 'Available beds',
  units: 'Available units',
  title: 'Available beds',
  empty: 'No available beds',
  improveOccupancy: 'Improve occupancy by allocating available beds',
} as const;
