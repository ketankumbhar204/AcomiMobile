import { buildSetupRequest } from '../accommodationSetup';

const building = { name: 'Block A' };
const units = { count: 10, startNumber: '101' };

describe('buildSetupRequest', () => {
  it('sends unit configuration for Corporate Stay the same way as Rental', () => {
    const rental = buildSetupRequest('RENTAL', building, undefined, units);
    const corporate = buildSetupRequest('CORPORATE_STAY', building, undefined, units);

    expect(corporate.units).toEqual(units);
    expect(corporate.floors).toBeUndefined();
    expect(corporate.layoutMode).toBe('RENTAL');
    expect(corporate.spaceType).toBe('CORPORATE_STAY');
    expect(rental.layoutMode).toBe('RENTAL');
    expect(rental.units).toEqual(corporate.units);
  });

  it('keeps PG on floors and does not attach units', () => {
    const floors = {
      count: 2,
      includeGroundFloor: false,
      roomsPerFloor: 4,
      bedsPerRoom: 2,
      defaultRoomType: 'SHARED' as const,
      capacityPerRoom: 2,
    };
    const request = buildSetupRequest('PG', building, floors, units, 'CORRIDOR_PG');
    expect(request.floors).toEqual(floors);
    expect(request.units).toBeUndefined();
    expect(request.layoutMode).toBe('CORRIDOR_PG');
  });

  it('still sends Co-living units with the Co-living layout', () => {
    const request = buildSetupRequest('CO_LIVING', building, undefined, {
      ...units,
      roomsPerUnit: 2,
      bedsPerRoom: 1,
    });
    expect(request.layoutMode).toBe('CO_LIVING');
    expect(request.units?.roomsPerUnit).toBe(2);
  });
});
