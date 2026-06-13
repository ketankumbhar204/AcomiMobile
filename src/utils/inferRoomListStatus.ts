import type { AccommodationStatus, RoomListItemResponse } from '../api/types';

/** Infer room availability from summary bed counts when full status is not in list DTO. */
export function inferRoomListStatus(
  room: RoomListItemResponse,
): AccommodationStatus | null {
  if (room.bedCount <= 0) {
    return null;
  }
  if (room.availableBeds === room.bedCount) {
    return 'AVAILABLE';
  }
  if (room.availableBeds === 0 && room.occupiedBeds > 0) {
    return 'OCCUPIED';
  }
  return null;
}
