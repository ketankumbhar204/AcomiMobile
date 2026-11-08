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

  it('RENTAL building scope asks only for a unit', () => {
    expect(
      getHierarchySteps('RENTAL', 'RENTAL', {
        buildingId: 'b1',
        buildingName: 'Test Rental',
        layoutMode: 'RENTAL',
      }),
    ).toEqual(['unit']);
  });

  it('RENTAL unit scope has no hierarchy steps', () => {
    expect(
      getHierarchySteps('RENTAL', 'RENTAL', {
        buildingId: 'b1',
        buildingName: 'Test Rental',
        layoutMode: 'RENTAL',
        unitId: 'u1',
        unitName: '101',
      }),
    ).toEqual([]);
  });

  it('CORPORATE_STAY uses the rental unit flow', () => {
    expect(
      getHierarchySteps('CORPORATE_STAY', 'RENTAL', {
        buildingId: 'b1',
        buildingName: 'Test CS1',
        layoutMode: 'RENTAL',
      }),
    ).toEqual(['unit']);
    expect(
      getHierarchySteps('CORPORATE_STAY', 'RENTAL', {
        buildingId: 'b1',
        buildingName: 'Test CS1',
        layoutMode: 'RENTAL',
        unitId: 'u1',
        unitName: '101',
      }),
    ).toEqual([]);
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
  it('allocate puts stay type before member, then contract and review', () => {
    expect(getPostHierarchyWizardSteps('ALLOCATE')).toEqual([
      'stay_type',
      'member',
      'contract',
      'review',
    ]);
  });

  it('ignores shortStayEnabled flag and always inserts stay type first', () => {
    expect(
      getPostHierarchyWizardSteps('ALLOCATE', { shortStayEnabled: false }),
    ).toEqual(['stay_type', 'member', 'contract', 'review']);
    expect(
      getPostHierarchyWizardSteps('RESERVE', { shortStayEnabled: false }),
    ).toEqual(['stay_type', 'member', 'reserve_dates', 'contract', 'review']);
  });

  it('reserve puts stay type before member, then dates, contract and review', () => {
    expect(getPostHierarchyWizardSteps('RESERVE')).toEqual([
      'stay_type',
      'member',
      'reserve_dates',
      'contract',
      'review',
    ]);
  });

  it('total steps for floor allocate in APARTMENT_PG', () => {
    const hierarchy = getHierarchySteps('PG', 'APARTMENT_PG', {
      ...buildingScope,
      floorId: 'f1',
      floorName: 'Floor 1',
    });
    // hierarchy: unit → room → bed (3) + stay_type, member, contract, review (4) = 7
    expect(getTotalAllocationFlowSteps(hierarchy, 'ALLOCATE')).toBe(7);
  });
});
