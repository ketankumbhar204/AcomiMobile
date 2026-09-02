import type { EditableBed, EditableSetupStructure } from '../setupStructureTypes';
import { parseOptionalMoney, propagateBedPricing } from '../setupPricingAutofill';

function bed(id: string, rent?: number, deposit?: number): EditableBed {
  return { id, label: id, number: id, defaultRent: rent, defaultDeposit: deposit };
}

function corridorStructure(rooms: EditableBed[][]): EditableSetupStructure {
  return {
    building: { name: 'B1', code: 'B1' },
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
        rooms: rooms.map((beds, index) => ({
          id: `r${index + 1}`,
          name: `Room ${index + 1}`,
          number: String(index + 1),
          capacity: beds.length,
          beds,
        })),
      },
    ],
    units: [],
  };
}

function apartmentStructure(units: EditableBed[][]): EditableSetupStructure {
  return {
    building: { name: 'B1', code: 'B1' },
    kind: 'floors_with_units',
    layoutMode: 'APARTMENT_PG',
    spaceType: 'PG',
    roomType: 'SHARED',
    floors: [
      {
        id: 'f1',
        name: 'Floor 1',
        number: 1,
        rooms: [],
        units: units.map((beds, index) => ({
          id: `u${index + 1}`,
          name: `Unit ${index + 1}`,
          number: String(index + 1),
          rooms: [
            {
              id: `r${index + 1}`,
              name: 'Room 1',
              number: '1',
              capacity: beds.length,
              beds,
            },
          ],
        })),
      },
    ],
    units: [],
  };
}

function rents(structure: EditableSetupStructure): Array<number | null | undefined> {
  if (structure.kind === 'floors_with_units') {
    return structure.floors[0].units.map(unit => unit.rooms[0].beds[0].defaultRent);
  }
  return structure.floors[0].rooms.map(room => room.beds[0].defaultRent);
}

function deposits(structure: EditableSetupStructure): Array<number | null | undefined> {
  if (structure.kind === 'floors_with_units') {
    return structure.floors[0].units.map(unit => unit.rooms[0].beds[0].defaultDeposit);
  }
  return structure.floors[0].rooms.map(room => room.beds[0].defaultDeposit);
}

describe('parseOptionalMoney', () => {
  it('treats empty values as null', () => {
    expect(parseOptionalMoney('')).toBeNull();
    expect(parseOptionalMoney('   ')).toBeNull();
    expect(parseOptionalMoney(null)).toBeNull();
    expect(parseOptionalMoney(undefined)).toBeNull();
  });

  it('rejects invalid numbers', () => {
    expect(parseOptionalMoney('abc')).toBeNull();
    expect(parseOptionalMoney(-1)).toBeNull();
  });

  it('parses valid amounts', () => {
    expect(parseOptionalMoney('5000')).toBe(5000);
    expect(parseOptionalMoney(10000)).toBe(10000);
  });
});

describe('propagateBedPricing', () => {
  it('fills empty corridor beds at the same bed position', () => {
    const structure = corridorStructure([
      [bed('r1b1', 5000, 10000), bed('r1b2')],
      [bed('r2b1'), bed('r2b2')],
      [bed('r3b1'), bed('r3b2')],
    ]);

    const next = propagateBedPricing(structure, 'r1b1', 'defaultRent');
    expect(rents(next)).toEqual([5000, 5000, 5000]);
    expect(next.floors[0].rooms[1].beds[1].defaultRent).toBeUndefined();
  });

  it('fills empty apartment beds across equivalent units', () => {
    const structure = apartmentStructure([
      [bed('u1b1', 5000, 10000), bed('u1b2')],
      [bed('u2b1'), bed('u2b2')],
      [bed('u3b1'), bed('u3b2')],
    ]);

    const next = propagateBedPricing(structure, 'u1b1', 'defaultRent');
    expect(rents(next)).toEqual([5000, 5000, 5000]);
    expect(next.floors[0].units[1].rooms[0].beds[1].defaultRent).toBeUndefined();
  });

  it('never overwrites an existing rent', () => {
    const structure = apartmentStructure([
      [bed('u1b1', 5000)],
      [bed('u2b1')],
      [bed('u3b1', 6000)],
    ]);

    const next = propagateBedPricing(structure, 'u1b1', 'defaultRent');
    expect(rents(next)).toEqual([5000, 5000, 6000]);
  });

  it('propagates rent independently from deposit', () => {
    const structure = corridorStructure([
      [bed('r1b1', 5000)],
      [bed('r2b1')],
    ]);

    const next = propagateBedPricing(structure, 'r1b1', 'defaultRent');
    expect(rents(next)).toEqual([5000, 5000]);
    expect(deposits(next)).toEqual([undefined, undefined]);
  });

  it('propagates deposit independently from rent', () => {
    const structure = corridorStructure([
      [bed('r1b1', undefined, 10000)],
      [bed('r2b1')],
    ]);

    const next = propagateBedPricing(structure, 'r1b1', 'defaultDeposit');
    expect(rents(next)).toEqual([undefined, undefined]);
    expect(deposits(next)).toEqual([10000, 10000]);
  });

  it('does not copy values back onto the source bed or other positions', () => {
    const structure = corridorStructure([
      [bed('r1b1', 5000), bed('r1b2')],
      [bed('r2b1', 7000), bed('r2b2')],
    ]);

    const next = propagateBedPricing(structure, 'r2b1', 'defaultRent');
    expect(rents(next)).toEqual([5000, 7000]);
    expect(next.floors[0].rooms[0].beds[1].defaultRent).toBeUndefined();
  });

  it('does not propagate empty source values', () => {
    const structure = corridorStructure([[bed('r1b1')], [bed('r2b1')]]);
    const next = propagateBedPricing(structure, 'r1b1', 'defaultRent');
    expect(rents(next)).toEqual([undefined, undefined]);
  });
});
