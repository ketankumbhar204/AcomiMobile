jest.mock('../../api/spaceTypes', () => ({
  getSpaceTypeLabel: (type: string) => type,
}));

import { buildConfirmedHierarchyContext } from '../occupancyHierarchyContext';

const buildingScope = {
  buildingId: 'b1',
  buildingName: 'Building 1',
  layoutMode: 'APARTMENT_PG' as const,
};

describe('buildConfirmedHierarchyContext', () => {
  it('floor step shows building only', () => {
    expect(
      buildConfirmedHierarchyContext(buildingScope, 'Building 1', {}, {
        phase: 'hierarchy',
        currentHierarchyStep: 'floor',
      }),
    ).toEqual({ buildingName: 'Building 1' });
  });

  it('unit step shows building and floor', () => {
    expect(
      buildConfirmedHierarchyContext(
        buildingScope,
        'Building 1',
        { floor: { floorId: 'f1', name: 'Floor 1' } as never },
        { phase: 'hierarchy', currentHierarchyStep: 'unit' },
      ),
    ).toEqual({ buildingName: 'Building 1', floorName: 'Floor 1' });
  });

  it('bed step excludes bed from breadcrumb', () => {
    expect(
      buildConfirmedHierarchyContext(
        buildingScope,
        'Building 1',
        {
          floor: { floorId: 'f1', name: 'Floor 1' } as never,
          unit: { unitId: 'u1', name: 'Unit 101' } as never,
          room: { roomId: 'r1', roomName: 'Room A', beds: [], bedCount: 1, availableCount: 1 } as never,
        },
        { phase: 'hierarchy', currentHierarchyStep: 'bed' },
      ),
    ).toEqual({
      buildingName: 'Building 1',
      floorName: 'Floor 1',
      unitName: 'Unit 101',
      roomName: 'Room A',
    });
  });

  it('member phase shows full target including bed', () => {
    expect(
      buildConfirmedHierarchyContext(
        buildingScope,
        'Building 1',
        {},
        {
          phase: 'member',
          activeTarget: {
            targetType: 'BED',
            buildingId: 'b1',
            buildingName: 'Building 1',
            floorName: 'Floor 1',
            unitName: 'Unit 101',
            roomName: 'Room A',
            bedId: 'bed1',
            bedName: 'A',
          },
        },
      ),
    ).toEqual({
      buildingName: 'Building 1',
      floorName: 'Floor 1',
      unitName: 'Unit 101',
      roomName: 'Room A',
      bedName: 'A',
    });
  });
});
