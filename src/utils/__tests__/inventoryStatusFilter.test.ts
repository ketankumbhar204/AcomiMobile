import {
  countBedsByInventoryStatus,
  filterBedsByInventoryStatus,
  filterRoomGroupsByInventoryStatus,
} from '../inventoryStatusFilter';
import type { BedSpaceListItemResponse } from '../../api/types';

function bed(
  bedId: string,
  status: BedSpaceListItemResponse['status'],
  roomId = 'room-1',
): BedSpaceListItemResponse {
  return {
    bedId,
    label: bedId,
    status,
    buildingId: 'b1',
    buildingName: 'B',
    floorId: 'f1',
    floorName: 'Floor 1',
    unitId: 'u1',
    unitName: 'Unit 101',
    roomId,
    roomName: roomId === 'room-1' ? 'Room 1' : 'Room 2',
  };
}

describe('inventoryStatusFilter', () => {
  const beds = [
    bed('1', 'OCCUPIED', 'room-1'),
    bed('2', 'OCCUPIED', 'room-1'),
    bed('3', 'RESERVED', 'room-2'),
    bed('4', 'AVAILABLE', 'room-2'),
  ];

  it('counts beds by status within scope', () => {
    expect(countBedsByInventoryStatus(beds)).toEqual({
      all: 4,
      available: 1,
      occupied: 2,
      reserved: 1,
    });
  });

  it('filters beds without treating reserved as occupied or available', () => {
    expect(filterBedsByInventoryStatus(beds, 'RESERVED').map(b => b.bedId)).toEqual(['3']);
    expect(filterBedsByInventoryStatus(beds, 'AVAILABLE').map(b => b.bedId)).toEqual(['4']);
    expect(filterBedsByInventoryStatus(beds, 'OCCUPIED').map(b => b.bedId)).toEqual([
      '1',
      '2',
    ]);
  });

  it('hides rooms with no matching beds', () => {
    const reservedRooms = filterRoomGroupsByInventoryStatus(beds, 'RESERVED');
    expect(reservedRooms).toHaveLength(1);
    expect(reservedRooms[0].roomId).toBe('room-2');
    expect(reservedRooms[0].beds).toHaveLength(1);
    expect(reservedRooms[0].beds[0].status).toBe('RESERVED');
  });
});
