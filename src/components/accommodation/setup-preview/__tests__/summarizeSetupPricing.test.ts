import { summarizeSetupPricing } from '../summarizeSetupPricing';
import type { EditableSetupStructure } from '../setupStructureTypes';

function corridor(): EditableSetupStructure {
  return {
    building: { name: 'PG 1', code: 'PG1' },
    kind: 'floors_with_rooms',
    layoutMode: 'CORRIDOR_PG',
    spaceType: 'PG',
    roomType: 'SHARED',
    floors: [
      {
        id: 'f1',
        name: 'Floor 1',
        number: 1,
        units: [],
        rooms: [
          {
            id: 'r1',
            name: 'Room A',
            number: '101',
            capacity: 2,
            beds: [
              { id: 'b1', label: 'A', number: 'A', defaultRent: 6000, defaultDeposit: 3000 },
              { id: 'b2', label: 'B', number: 'B', defaultRent: 5500, defaultDeposit: 2500 },
            ],
          },
        ],
      },
    ],
    units: [],
  };
}

describe('summarizeSetupPricing', () => {
  it('uses actual generated building name, counts, and pricing groups', () => {
    const summary = summarizeSetupPricing(corridor());

    expect(summary.buildingName).toBe('PG 1');
    expect(summary.totals).toEqual({ floors: 1, units: 0, rooms: 1, beds: 2 });
    expect(summary.pricingGroups).toEqual([
      { key: '6000|3000', rent: 6000, deposit: 3000, bedCount: 1 },
      { key: '5500|2500', rent: 5500, deposit: 2500, bedCount: 1 },
    ]);
  });

  it('ignores beds that have no rent or deposit', () => {
    const structure = corridor();
    structure.floors[0].rooms[0].beds[0].defaultRent = null;
    structure.floors[0].rooms[0].beds[0].defaultDeposit = null;
    structure.floors[0].rooms[0].beds[1].defaultRent = undefined;
    structure.floors[0].rooms[0].beds[1].defaultDeposit = undefined;

    const summary = summarizeSetupPricing(structure);
    expect(summary.pricingSubject).toBe('beds');
    expect(summary.pricingGroups).toEqual([]);
  });

  it('uses unit rent and deposit when the layout has no beds', () => {
    const structure: EditableSetupStructure = {
      building: { name: 'Test Rental', code: 'R1' },
      kind: 'building_units',
      layoutMode: 'RENTAL',
      spaceType: 'RENTAL',
      roomType: 'PRIVATE',
      floors: [],
      units: [
        {
          id: 'u1',
          name: '101',
          number: '101',
          rooms: [],
          defaultRent: 12000,
          defaultDeposit: 24000,
        },
        {
          id: 'u2',
          name: '102',
          number: '102',
          rooms: [],
          defaultRent: 12000,
          defaultDeposit: 24000,
        },
        {
          id: 'u3',
          name: '103',
          number: '103',
          rooms: [],
        },
      ],
    };

    const summary = summarizeSetupPricing(structure);
    expect(summary.pricingSubject).toBe('units');
    expect(summary.totals.units).toBe(3);
    expect(summary.totals.beds).toBe(0);
    expect(summary.pricingGroups).toEqual([
      { key: '12000|24000', rent: 12000, deposit: 24000, bedCount: 2 },
    ]);
  });

  it('reports no unit pricing when rental units are left blank', () => {
    const structure: EditableSetupStructure = {
      building: { name: 'Test CS2', code: 'CS2' },
      kind: 'building_units',
      layoutMode: 'RENTAL',
      spaceType: 'CORPORATE_STAY',
      roomType: 'PRIVATE',
      floors: [],
      units: [
        { id: 'u1', name: '101', number: '101', rooms: [] },
        { id: 'u2', name: '102', number: '102', rooms: [] },
      ],
    };

    const summary = summarizeSetupPricing(structure);
    expect(summary.pricingGroups).toEqual([]);
    expect(summary.pricingSubject).toBe('units');
  });

  it('collapses identical rent/deposit into one group', () => {
    const structure = corridor();
    structure.floors[0].rooms[0].beds[1].defaultRent = 6000;
    structure.floors[0].rooms[0].beds[1].defaultDeposit = 3000;

    const summary = summarizeSetupPricing(structure);
    expect(summary.pricingGroups).toEqual([
      { key: '6000|3000', rent: 6000, deposit: 3000, bedCount: 2 },
    ]);
  });
});
