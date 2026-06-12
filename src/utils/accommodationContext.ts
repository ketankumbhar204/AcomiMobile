import type { PropertyLayoutMode, UUID } from '../api/types';

export type AccommodationTrailLevel = 'building' | 'floor' | 'unit' | 'room' | 'bed';

export type AccommodationTrailSegment = {
  label: string;
  level: AccommodationTrailLevel;
  navigable: boolean;
};

export type AccommodationTrailContext = {
  spaceId: UUID;
  buildingId: UUID;
  buildingName?: string;
  layoutMode?: PropertyLayoutMode;
  floorId?: UUID;
  floorName?: string;
  unitId?: UUID;
  unitName?: string;
  roomId?: UUID;
  roomName?: string;
  bedLabel?: string;
};

/** @deprecated Use buildAccommodationTrail */
export type AccommodationTrailInput = {
  buildingName?: string;
  parentName?: string;
  unitName?: string;
  roomName?: string;
  bedLabel?: string;
};

export function parentFieldsForTrail(
  parentType: 'floor' | 'unit',
  parentId: UUID,
  parentName?: string,
): Pick<AccommodationTrailContext, 'floorId' | 'floorName' | 'unitId' | 'unitName'> {
  if (parentType === 'floor') {
    return { floorId: parentId, floorName: parentName };
  }
  return { unitId: parentId, unitName: parentName };
}

export function buildAccommodationTrail(
  context: AccommodationTrailContext,
  current: AccommodationTrailLevel,
): AccommodationTrailSegment[] {
  const segments: AccommodationTrailSegment[] = [];

  const add = (label: string | undefined, level: AccommodationTrailLevel) => {
    if (!label?.trim()) {
      return;
    }
    segments.push({
      label: label.trim(),
      level,
      navigable: level !== current,
    });
  };

  add(context.buildingName, 'building');
  add(context.floorName, 'floor');
  add(context.unitName, 'unit');
  add(context.roomName, 'room');
  add(context.bedLabel, 'bed');

  return segments;
}

/** @deprecated Use buildAccommodationTrail */
export function buildAccommodationTrailSegments(input: AccommodationTrailInput): string[] {
  const segments: string[] = [];

  if (input.buildingName?.trim()) {
    segments.push(input.buildingName.trim());
  }
  if (input.parentName?.trim()) {
    segments.push(input.parentName.trim());
  }
  if (input.unitName?.trim()) {
    segments.push(input.unitName.trim());
  }
  if (input.roomName?.trim()) {
    segments.push(input.roomName.trim());
  }
  if (input.bedLabel?.trim()) {
    segments.push(input.bedLabel.trim());
  }

  return segments;
}

export function formatAccommodationTrail(segments: string[]): string {
  return segments.join(' › ');
}
