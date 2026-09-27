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
