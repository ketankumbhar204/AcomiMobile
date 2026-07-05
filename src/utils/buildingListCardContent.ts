import type { TFunction } from 'i18next';
import type {
  BuildingSummaryResponse,
  PropertyLayoutMode,
  SpaceType,
} from '../api/types';
import { getLayoutModeLabelKey } from './propertyLayoutMode';

export type BuildingLayoutBadgeVariant =
  | 'apartment'
  | 'corridor'
  | 'hostel'
  | 'coLiving'
  | 'rental';

export function getBuildingLayoutBadgeVariant(
  layoutMode: PropertyLayoutMode,
  spaceType?: SpaceType,
): BuildingLayoutBadgeVariant {
  if (spaceType === 'HOSTEL') {
    return 'hostel';
  }
  switch (layoutMode) {
    case 'APARTMENT_PG':
      return 'apartment';
    case 'CORRIDOR_PG':
      return 'corridor';
    case 'CO_LIVING':
      return 'coLiving';
    case 'RENTAL':
      return 'rental';
    default:
      return 'corridor';
  }
}

export function getBuildingLayoutBadgeLabelKey(variant: BuildingLayoutBadgeVariant): string {
  return `accommodation.home.buildingCard.badge.${variant}`;
}

export function getBuildingLayoutTypeLabelKey(layoutMode: PropertyLayoutMode): string {
  return getLayoutModeLabelKey(layoutMode);
}

export type BuildingCardStatColumn = {
  value: number;
  labelKey: string;
};

export type BuildingCardStats = {
  columns: BuildingCardStatColumn[];
  rooms?: number;
  available: number;
  occupied: number;
};

const STAT_LABEL = {
  floors: 'accommodation.home.buildingCard.statLabel.floors',
  units: 'accommodation.home.buildingCard.statLabel.units',
  rooms: 'accommodation.home.buildingCard.statLabel.rooms',
  beds: 'accommodation.home.buildingCard.statLabel.beds',
} as const;

function hasAnyStatValue(columns: BuildingCardStatColumn[]): boolean {
  return columns.some(column => column.value > 0);
}

function countPart(
  value: number,
  key: string,
  t: TFunction,
): string | null {
  if (value <= 0) {
    return null;
  }
  return t(key, { count: value });
}

function joinCountParts(parts: (string | null)[]): string | undefined {
  const line = parts.filter((part): part is string => part != null).join(' · ');
  return line.length > 0 ? line : undefined;
}

export function resolveBuildingOccupancyCounts(
  layoutMode: PropertyLayoutMode,
  summary: BuildingSummaryResponse,
): { available: number; occupied: number } {
  switch (layoutMode) {
    case 'RENTAL':
      return {
        available: summary.availableUnits ?? summary.available,
        occupied: summary.occupiedUnits ?? summary.occupied,
      };
    case 'APARTMENT_PG':
    case 'CORRIDOR_PG':
    case 'CO_LIVING':
      if (summary.beds > 0) {
        const occupied = summary.occupiedBeds ?? 0;
        const available =
          summary.availableBeds ??
          Math.max(0, summary.beds - occupied - (summary.reservedBeds ?? 0));
        return { available, occupied };
      }
      if (summary.rooms > 0) {
        return {
          available: summary.availableRooms ?? 0,
          occupied: summary.occupiedRooms ?? 0,
        };
      }
      return {
        available: summary.availableUnits ?? summary.available,
        occupied: summary.occupiedUnits ?? summary.occupied,
      };
    default:
      return {
        available: summary.availableBeds ?? summary.available,
        occupied: summary.occupiedBeds ?? summary.occupied,
      };
  }
}

export function formatBuildingStructureLines(
  layoutMode: PropertyLayoutMode,
  summary: BuildingSummaryResponse,
  t: TFunction,
): string[] {
  const floors = summary.floors;
  const units = summary.visibleUnitCount > 0 ? summary.visibleUnitCount : summary.units;
  const rooms = summary.rooms;
  const beds = summary.beds;

  switch (layoutMode) {
    case 'APARTMENT_PG': {
      const lines = [
        joinCountParts([
          countPart(floors, 'accommodation.home.buildingCard.floorsCount', t),
          countPart(units, 'accommodation.home.buildingCard.unitsCount', t),
        ]),
        joinCountParts([
          countPart(rooms, 'accommodation.home.buildingCard.roomsCount', t),
          countPart(beds, 'accommodation.home.buildingCard.bedsCount', t),
        ]),
      ].filter((line): line is string => line != null);
      return lines.length > 0 ? lines : [];
    }
    case 'CORRIDOR_PG': {
      const lines = [
        joinCountParts([
          countPart(floors, 'accommodation.home.buildingCard.floorsCount', t),
          countPart(rooms, 'accommodation.home.buildingCard.roomsCount', t),
        ]),
        joinCountParts([countPart(beds, 'accommodation.home.buildingCard.bedsCount', t)]),
      ].filter((line): line is string => line != null);
      return lines.length > 0 ? lines : [];
    }
    case 'CO_LIVING':
      return [
        joinCountParts([
          countPart(units, 'accommodation.home.buildingCard.unitsCount', t),
          countPart(rooms, 'accommodation.home.buildingCard.roomsCount', t),
          countPart(beds, 'accommodation.home.buildingCard.bedsCount', t),
        ]),
      ].filter((line): line is string => line != null);
    case 'RENTAL':
      return [
        joinCountParts([countPart(units, 'accommodation.home.buildingCard.unitsCount', t)]),
      ].filter((line): line is string => line != null);
    default:
      return [];
  }
}

/** @deprecated Prefer formatBuildingStructureLines for multi-line layout cards. */
export function formatBuildingStructureLine(
  layoutMode: PropertyLayoutMode,
  summary: BuildingSummaryResponse,
  t: TFunction,
): string | undefined {
  const lines = formatBuildingStructureLines(layoutMode, summary, t);
  return lines.length > 0 ? lines.join('\n') : undefined;
}

export function formatBuildingOccupancyLine(
  layoutMode: PropertyLayoutMode,
  summary: BuildingSummaryResponse,
  t: TFunction,
): string {
  const { available, occupied } = resolveBuildingOccupancyCounts(layoutMode, summary);
  const usesBeds =
    layoutMode === 'APARTMENT_PG' ||
    layoutMode === 'CORRIDOR_PG' ||
    layoutMode === 'CO_LIVING';

  if (usesBeds && summary.beds > 0) {
    return t('accommodation.home.buildingCard.occupancyBeds', { available, occupied });
  }

  return t('accommodation.home.buildingCard.occupancy', { available, occupied });
}

export function resolveBuildingCardStats(
  layoutMode: PropertyLayoutMode,
  summary: BuildingSummaryResponse,
  t: TFunction,
): BuildingCardStats | null {
  const floors = summary.floors;
  const units = summary.visibleUnitCount > 0 ? summary.visibleUnitCount : summary.units;
  const rooms = summary.rooms;
  const beds = summary.beds;
  const { available, occupied } = resolveBuildingOccupancyCounts(layoutMode, summary);

  let stats: BuildingCardStats | null = null;

  switch (layoutMode) {
    case 'APARTMENT_PG':
      stats = {
        columns: [
          { value: floors, labelKey: STAT_LABEL.floors },
          { value: units, labelKey: STAT_LABEL.units },
          { value: beds, labelKey: STAT_LABEL.beds },
        ],
        rooms: rooms > 0 ? rooms : undefined,
        available,
        occupied,
      };
      break;
    case 'CORRIDOR_PG':
      stats = {
        columns: [
          { value: floors, labelKey: STAT_LABEL.floors },
          { value: rooms, labelKey: STAT_LABEL.rooms },
          { value: beds, labelKey: STAT_LABEL.beds },
        ],
        available,
        occupied,
      };
      break;
    case 'CO_LIVING':
      stats = {
        columns: [
          { value: units, labelKey: STAT_LABEL.units },
          { value: rooms, labelKey: STAT_LABEL.rooms },
          { value: beds, labelKey: STAT_LABEL.beds },
        ],
        available,
        occupied,
      };
      break;
    case 'RENTAL':
      stats = {
        columns: [{ value: units, labelKey: STAT_LABEL.units }],
        available,
        occupied,
      };
      break;
    default:
      return null;
  }

  return stats && hasAnyStatValue(stats.columns) ? stats : null;
}
