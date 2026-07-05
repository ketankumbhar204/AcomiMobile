import {
  getHierarchySteps,
  getPostHierarchyWizardSteps,
  getTotalAllocationFlowSteps,
} from '../hierarchyOccupancySteps';

const buildingScope = {
  buildingId: 'b1',
  buildingName: 'Building 1',
  layoutMode: 'APARTMENT_PG' as const,
};

describe('getHierarchySteps', () => {
  it('building scope (APARTMENT_PG): floor → unit → room → bed', () => {
    expect(getHierarchySteps('PG', 'APARTMENT_PG', buildingScope)).toEqual([
      'floor',
      'unit',
      'room',
      'bed',
    ]);
  });

  it('floor scope: unit → room → bed', () => {
    expect(
      getHierarchySteps('PG', 'APARTMENT_PG', {
        ...buildingScope,
        floorId: 'f1',
        floorName: 'Floor 1',
      }),
    ).toEqual(['unit', 'room', 'bed']);
  });

  it('unit scope with floor: room → bed (no floor re-selection)', () => {
    expect(
      getHierarchySteps('PG', 'APARTMENT_PG', {
        ...buildingScope,
        floorId: 'f1',
        floorName: 'Floor 1',
        unitId: 'u1',
        unitName: 'Unit 101',
      }),
    ).toEqual(['room', 'bed']);
  });

  it('unit scope without floorId: room → bed (no erroneous floor step)', () => {
    expect(
      getHierarchySteps('PG', 'APARTMENT_PG', {
        ...buildingScope,
        unitId: 'u1',
        unitName: 'Unit 101',
      }),
    ).toEqual(['room', 'bed']);
  });

  it('room scope: bed only', () => {
    expect(
      getHierarchySteps('PG', 'APARTMENT_PG', {
        ...buildingScope,
        floorId: 'f1',
        floorName: 'Floor 1',
        unitId: 'u1',
        unitName: 'Unit 101',
        roomId: 'r1',
        roomName: 'Room A',
      }),
    ).toEqual(['bed']);
  });

  it('CORRIDOR_PG floor scope: room → bed (no units)', () => {
    expect(
      getHierarchySteps('PG', 'CORRIDOR_PG', {
        ...buildingScope,
        layoutMode: 'CORRIDOR_PG',
        floorId: 'f1',
        floorName: 'Floor 1',
      }),
    ).toEqual(['room', 'bed']);
  });
});

describe('post hierarchy wizard steps', () => {
  it('allocate adds member, contract, and review', () => {
    expect(getPostHierarchyWizardSteps('ALLOCATE')).toEqual(['member', 'contract', 'review']);
  });

  it('reserve adds member, dates, and review', () => {
    expect(getPostHierarchyWizardSteps('RESERVE')).toEqual([
      'member',
      'reserve_dates',
      'review',
    ]);
  });

  it('total steps for floor allocate in APARTMENT_PG', () => {
    const hierarchy = getHierarchySteps('PG', 'APARTMENT_PG', {
      ...buildingScope,
      floorId: 'f1',
      floorName: 'Floor 1',
    });
    expect(getTotalAllocationFlowSteps(hierarchy, 'ALLOCATE')).toBe(6);
  });
});
