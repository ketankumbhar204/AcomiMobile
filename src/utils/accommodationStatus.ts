import type { AccommodationStatus } from '../api/types';

export const ACCOMMODATION_STATUS_OPTIONS: {
  value: AccommodationStatus;
  color: string;
}[] = [
  { value: 'AVAILABLE', color: '#22c55e' },
  { value: 'OCCUPIED', color: '#3b82f6' },
  { value: 'RESERVED', color: '#a855f7' },
  { value: 'MAINTENANCE', color: '#f97316' },
  { value: 'BLOCKED', color: '#ef4444' },
];

export const ROOM_TYPE_OPTIONS = ['PRIVATE', 'SHARED', 'DORMITORY'] as const;

export function getAccommodationStatusColor(status: AccommodationStatus): string {
  return (
    ACCOMMODATION_STATUS_OPTIONS.find(option => option.value === status)?.color ??
    '#6b7280'
  );
}

export function getAccommodationStatusLabelKey(status: AccommodationStatus): string {
  return `accommodation.status.${status}`;
}

export function getRoomTypeLabelKey(roomType: string): string {
  return `accommodation.roomType.${roomType}`;
}
