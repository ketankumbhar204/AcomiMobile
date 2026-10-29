import { expandToEditableStructure } from '../setupStructureModel';
import type { ExpandStructureConfig } from '../setupStructureTypes';

describe('expandToEditableStructure unit numbering', () => {
  const config: ExpandStructureConfig = {
    layoutMode: 'APARTMENT_PG',
    spaceType: 'PG',
    roomType: 'SHARED',
    buildingName: 'Building 1',
    buildingCode: '',
    includeGroundFloor: false,
    roomsPerParent: 4,
    bedsPerRoom: 3,
    capacityPerRoom: 3,
  };

  it('numbers units as 1xx / 2xx / 3xx without double floor offset', () => {
    // Backend dry-run sample typically only includes floor 0; preview then
    // expands other floors — expand must not offset those labels again.
    const nodes = [
      {
        type: 'BUILDING',
        label: 'Building 1',
        children: [
          {
            type: 'FLOOR',
            label: 'Floor 1',
            number: '1',
            children: [
              { type: 'UNIT', label: 'Unit 101', number: '101', children: [] },
              { type: 'UNIT', label: 'Unit 102', number: '102', children: [] },
              { type: 'UNIT', label: 'Unit 103', number: '103', children: [] },
              { type: 'UNIT', label: 'Unit 104', number: '104', children: [] },
            ],
          },
        ],
      },
    ];

    const structure = expandToEditableStructure(
      nodes as never,
      { floors: 3, units: 12, rooms: 48, beds: 144 },
      config,
    );

    expect(structure.floors).toHaveLength(3);
    expect(structure.floors[0].units.map(u => u.number)).toEqual(['101', '102', '103', '104']);
    expect(structure.floors[1].units.map(u => u.number)).toEqual(['201', '202', '203', '204']);
    expect(structure.floors[2].units.map(u => u.number)).toEqual(['301', '302', '303', '304']);
    expect(structure.floors[0].units[0].rooms.length).toBeGreaterThan(0);
  });

  it('expands a rental sample unit into every unit and leaves rooms empty', () => {
    const structure = expandToEditableStructure(
      [{ type: 'UNIT', label: 'Unit 101', number: '101', children: [] }] as never,
      { floors: 0, units: 10, rooms: 0, beds: 0 },
      {
        ...config,
        layoutMode: 'RENTAL',
        spaceType: 'RENTAL',
        roomsPerParent: 0,
        bedsPerRoom: 0,
        capacityPerRoom: 0,
      },
    );

    expect(structure.kind).toBe('building_units');
    expect(structure.floors).toEqual([]);
    expect(structure.units.map(unit => unit.number)).toEqual([
      '101',
      '102',
      '103',
      '104',
      '105',
      '106',
      '107',
      '108',
      '109',
      '110',
    ]);
    expect(structure.units.every(unit => unit.rooms.length === 0)).toBe(true);
  });

  it('keeps rooms and beds on a co-living unit preview', () => {
    const structure = expandToEditableStructure(
      [
        {
          type: 'BUILDING',
          label: 'House',
          children: [
            {
              type: 'UNIT',
              label: 'Unit 101',
              number: '101',
              children: [{ type: 'ROOM', label: 'Room 1', number: '1', children: [] }],
            },
          ],
        },
      ] as never,
      { floors: 0, units: 2, rooms: 4, beds: 4 },
      {
        ...config,
        layoutMode: 'CO_LIVING',
        spaceType: 'CO_LIVING',
        roomsPerParent: 2,
        bedsPerRoom: 1,
        capacityPerRoom: 1,
      },
    );

    expect(structure.kind).toBe('building_units');
    expect(structure.units).toHaveLength(2);
    expect(structure.units[0].rooms).toHaveLength(2);
    expect(structure.units[0].rooms[0].beds).toHaveLength(1);
  });

  it('does not double-offset when preview already numbered higher floors', () => {
    const nodes = [
      {
        type: 'BUILDING',
        label: 'Building 1',
        children: [
          {
            type: 'FLOOR',
            label: 'Floor 1',
            number: '1',
            children: [{ type: 'UNIT', label: 'Unit 101', number: '101', children: [] }],
          },
          {
            type: 'FLOOR',
            label: 'Floor 2',
            number: '2',
            children: [{ type: 'UNIT', label: 'Unit 201', number: '201', children: [] }],
          },
          {
            type: 'FLOOR',
            label: 'Floor 3',
            number: '3',
            children: [{ type: 'UNIT', label: 'Unit 301', number: '301', children: [] }],
          },
        ],
      },
    ];

    const structure = expandToEditableStructure(
      nodes as never,
      { floors: 3, units: 3, rooms: 12, beds: 36 },
      config,
    );

    expect(structure.floors[0].units.map(u => u.number)).toEqual(['101']);
    expect(structure.floors[1].units.map(u => u.number)).toEqual(['201']);
    expect(structure.floors[2].units.map(u => u.number)).toEqual(['301']);
  });
});
