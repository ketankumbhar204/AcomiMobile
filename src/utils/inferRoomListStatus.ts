import type { AccommodationStatus, RoomListItemResponse } from '../api/types';

/** Infer room availability from summary bed counts when full status is not in list DTO. */
export function inferRoomListStatus(
  room: RoomListItemResponse,
): AccommodationStatus | null {
  if (room.bedCount <= 0) {
    return null;
  }
  if (room.occupiedBeds >= room.bedCount) {
    return 'OCCUPIED';
  }
  if (room.availableBeds > 0) {
    return 'AVAILABLE';
  }
  return 'RESERVED';
}
