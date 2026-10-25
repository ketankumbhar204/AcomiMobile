import { inferRoomListStatus } from '../inferRoomListStatus';

describe('inferRoomListStatus', () => {
  it('stays available while any bed is free', () => {
    expect(
      inferRoomListStatus({
        roomId: 'room',
        name: 'Room B',
        roomType: 'SHARED',
        bedCount: 3,
        availableBeds: 2,
        occupiedBeds: 1,
        photoFileId: null,
      }),
    ).toBe('AVAILABLE');
  });

  it('is occupied only when every bed is occupied', () => {
    expect(
      inferRoomListStatus({
        roomId: 'room',
        name: 'Room A',
        roomType: 'SHARED',
        bedCount: 3,
        availableBeds: 0,
        occupiedBeds: 3,
        photoFileId: null,
      }),
    ).toBe('OCCUPIED');
  });
});
