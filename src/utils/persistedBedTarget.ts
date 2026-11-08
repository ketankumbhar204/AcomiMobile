import type { AccommodationStatus, BedSpaceListItemResponse } from '../api/types';
import type { PersistedBedTarget } from '../hooks/usePersistedBedInteraction';
import { isAccommodationEntityActive } from './accommodationEntityActive';
import { buildBedOccupancyTarget } from './buildOccupancyTarget';

function locationLine(parts: Array<string | null | undefined>): string | undefined {
  const labels = parts.map(part => part?.trim()).filter(Boolean) as string[];
  return labels.length > 0 ? labels.join(' · ') : undefined;
}

export function persistedTargetFromSpaceBed(
  bed: BedSpaceListItemResponse,
): PersistedBedTarget {
  return {
    roomId: bed.roomId,
    bedId: bed.bedId,
    label: bed.label,
    name: bed.label,
    bedNumber: bed.label,
    status: bed.status,
    rent: bed.defaultRent,
    deposit: bed.defaultDeposit,
    locationLine: locationLine([bed.roomName, bed.unitName, bed.floorName, bed.buildingName]),
    occupancyTarget: buildBedOccupancyTarget({
      buildingId: bed.buildingId,
      buildingName: bed.buildingName,
      floorId: bed.floorId ?? undefined,
      floorName: bed.floorName ?? undefined,
      unitId: bed.unitId ?? undefined,
      unitName: bed.unitName ?? undefined,
      roomId: bed.roomId,
      roomName: bed.roomName,
      bedId: bed.bedId,
      bedName: bed.label,
    }),
  };
}

export function persistedTargetFromRoomBed(input: {
  bedId: string;
  roomId: string;
  label: string;
  name?: string;
  bedNumber?: string;
  status: AccommodationStatus;
  rent?: number | null;
  deposit?: number | null;
  inactive?: boolean;
  buildingId: string;
  buildingName?: string;
  roomName: string;
  floorId?: string;
  unitId?: string;
  parentName?: string;
  parentType?: 'floor' | 'unit';
}): PersistedBedTarget {
  const name = (input.name ?? input.label).trim() || input.label;
  const bedNumber = (input.bedNumber ?? input.label).trim() || input.label;
  return {
    roomId: input.roomId,
    bedId: input.bedId,
    label: name,
    name,
    bedNumber,
    status: input.status,
    rent: input.rent,
    deposit: input.deposit,
    inactive: input.inactive,
    locationLine: locationLine([
      input.roomName,
      input.parentType === 'unit' ? input.parentName : undefined,
      input.parentType === 'floor' ? input.parentName : undefined,
      input.buildingName,
    ]),
    occupancyTarget: buildBedOccupancyTarget({
      buildingId: input.buildingId,
      buildingName: input.buildingName ?? '',
      floorId: input.floorId,
      floorName: input.parentType === 'floor' ? input.parentName : undefined,
      unitId: input.unitId,
      unitName: input.parentType === 'unit' ? input.parentName : undefined,
      roomId: input.roomId,
      roomName: input.roomName,
      bedId: input.bedId,
      bedName: name,
    }),
  };
}

export function isBedInactive(entity: { active?: boolean } | null | undefined): boolean {
  return !isAccommodationEntityActive(entity);
}
