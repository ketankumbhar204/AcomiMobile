import type { AccommodationStatus } from '../../../../api/types';

export type OccupancyLevel = 'available' | 'nearlyFull' | 'full';

export function calcOccupancyPercent(occupied: number, total: number): number {
  if (total <= 0) {
    return 0;
  }
  return Math.min(100, Math.round((occupied / total) * 100));
}

export function getOccupancyLevel(percent: number): OccupancyLevel {
  if (percent >= 95) {
    return 'full';
  }
  if (percent >= 70) {
    return 'nearlyFull';
  }
  return 'available';
}

export function getOccupancyLevelColor(level: OccupancyLevel): string {
  switch (level) {
    case 'full':
      return '#ef4444';
    case 'nearlyFull':
      return '#f97316';
    default:
      return '#22c55e';
  }
}

export function occupancyLevelFromStatus(status: AccommodationStatus): OccupancyLevel {
  switch (status) {
    case 'OCCUPIED':
      return 'full';
    case 'RESERVED':
    case 'MAINTENANCE':
    case 'BLOCKED':
      return 'nearlyFull';
    default:
      return 'available';
  }
}

export function occupancyPercentFromStatus(status: AccommodationStatus): number {
  switch (status) {
    case 'OCCUPIED':
      return 100;
    case 'RESERVED':
      return 75;
    case 'MAINTENANCE':
    case 'BLOCKED':
      return 50;
    default:
      return 0;
  }
}
