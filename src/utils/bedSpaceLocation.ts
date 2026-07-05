import type { BedSpaceListItemResponse } from '../api/types';

export function formatBedSpaceLocation(bed: BedSpaceListItemResponse): string {
  return [
    bed.buildingName,
    bed.floorName,
    bed.unitName,
    bed.roomName,
    bed.label ? `Bed ${bed.label}` : null,
  ]
    .filter(Boolean)
    .join(' · ');
}
