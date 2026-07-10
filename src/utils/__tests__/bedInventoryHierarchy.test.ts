import type { BuildingResponse } from '../../api/types';
import {
  bedInventoryUsesUnitGrouping,
  getBedInventoryFilterLevels,
  getBedInventoryFilterLevelsForContext,
  getBedInventoryUnitFilterParent,
  groupBedsForInventoryBrowse,
  resolveBedInventoryProfile,
  sanitizeBedInventoryFilters,
} from '../bedInventoryHierarchy';
import { getAccommodationUiProfile } from '../accommodationProfile';

const buildings: BuildingResponse[] = [
  {
    buildingId: 'b-apartment',
    name: 'Building 2',
    layoutMode: 'APARTMENT_PG',
    active: true,
    spaceId: 'space-1',
    createdAt: '',
    updatedAt: '',
  },
  {
    buildingId: 'b-corridor',
    name: 'Building 4',
    layoutMode: 'CORRIDOR_PG',
    active: true,
    spaceId: 'space-1',
    createdAt: '',
    updatedAt: '',
  },
];

describe('getBedInventoryFilterLevels', () => {
  it('APARTMENT_PG includes building, floor, and unit', () => {
    expect(getBedInventoryFilterLevels(getAccommodationUiProfile('PG', 'APARTMENT_PG'))).toEqual([
      'building',
      'floor',
      'unit',
    ]);
  });

  it('CORRIDOR_PG includes building and floor only', () => {
    expect(getBedInventoryFilterLevels(getAccommodationUiProfile('PG', 'CORRIDOR_PG'))).toEqual([
      'building',
      'floor',
    ]);
  });

  it('CO_LIVING includes building and unit without floor', () => {
    expect(getBedInventoryFilterLevels(getAccommodationUiProfile('CO_LIVING', 'CO_LIVING'))).toEqual(
      ['building', 'unit'],
    );
  });
});

describe('resolveBedInventoryProfile', () => {
  it('uses selected building layout mode', () => {
    expect(
      resolveBedInventoryProfile('PG', buildings, 'b-corridor')?.layoutMode,
    ).toBe('CORRIDOR_PG');
  });

  it('falls back to space default when no building selected', () => {
    expect(resolveBedInventoryProfile('PG', buildings)?.layoutMode).toBe('CORRIDOR_PG');
  });
});

describe('getBedInventoryFilterLevelsForContext', () => {
  it('hides unit for selected corridor building', () => {
    expect(
      getBedInventoryFilterLevelsForContext('PG', buildings, 'b-corridor'),
    ).toEqual(['building', 'floor']);
  });

  it('shows unit for selected apartment building', () => {
    expect(
      getBedInventoryFilterLevelsForContext('PG', buildings, 'b-apartment'),
    ).toEqual(['building', 'floor', 'unit']);
  });
});

describe('bedInventoryUsesUnitGrouping', () => {
  it('uses unit grouping for apartment layouts', () => {
    expect(bedInventoryUsesUnitGrouping(getAccommodationUiProfile('PG', 'APARTMENT_PG'))).toBe(
      true,
    );
  });

  it('uses room grouping for corridor layouts', () => {
    expect(bedInventoryUsesUnitGrouping(getAccommodationUiProfile('PG', 'CORRIDOR_PG'))).toBe(
      false,
    );
  });
});

describe('getBedInventoryUnitFilterParent', () => {
  it('requires floor before unit for apartment PG', () => {
    expect(getBedInventoryUnitFilterParent(getAccommodationUiProfile('PG', 'APARTMENT_PG'))).toBe(
      'floor',
    );
  });

  it('requires building before unit for co-living', () => {
    expect(
      getBedInventoryUnitFilterParent(getAccommodationUiProfile('CO_LIVING', 'CO_LIVING')),
    ).toBe('building');
  });
});

describe('sanitizeBedInventoryFilters', () => {
  it('clears unit when unit level is hidden', () => {
    expect(
      sanitizeBedInventoryFilters(
        { buildingId: 'b1', floorId: 'f1', unitId: 'u1' },
        ['building', 'floor'],
      ),
    ).toEqual({ buildingId: 'b1', floorId: 'f1', unitId: undefined });
  });
});

describe('groupBedsForInventoryBrowse', () => {
  it('groups corridor beds by room', () => {
    const groups = groupBedsForInventoryBrowse(
      [
        {
          bedId: 'bed-1',
          label: 'A',
          status: 'AVAILABLE',
          buildingId: 'b-corridor',
          buildingName: 'Building 4',
          floorId: 'f1',
          floorName: 'Floor 1',
          unitId: 'u1',
          unitName: 'Unit 101',
          roomId: 'r1',
          roomName: 'Room 101',
        },
      ],
      'PG',
      buildings,
      'b-corridor',
    );

    expect(groups).toHaveLength(1);
    expect(groups[0]?.type).toBe('room');
    if (groups[0]?.type === 'room') {
      expect(groups[0].group.roomName).toBe('Room 101');
    }
  });
});
