import type { AccommodationStatus } from '../api/types';

export const ACCOMMODATION_STATUS_OPTIONS: {
  value: AccommodationStatus;
  color: string;
}[] = [
  { value: 'AVAILABLE', color: '#22c55e' },
  { value: 'RESERVED', color: '#eab308' },
  { value: 'OCCUPIED', color: '#ef4444' },
  { value: 'MAINTENANCE', color: '#6b7280' },
  { value: 'BLOCKED', color: '#9ca3af' },
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
