import {
  formatOccupancyInventoryPath,
  formatOccupancyInventoryTitle,
} from '../formatOccupancyInventoryTitle';

const t = ((key: string, opts?: { label?: string }) => {
  if (key === 'occupancy.section.bed') {
    return 'Bed';
  }
  if (key === 'occupancy.section.room') {
    return 'Room';
  }
  if (key === 'occupancy.section.unit') {
    return 'Unit';
  }
  if (key === 'accommodation.listItem.bed') {
    return `Bed ${opts?.label ?? ''}`;
  }
  return key;
}) as never;

describe('formatOccupancyInventoryTitle', () => {
  it('formats bare bed letters as Bed A', () => {
    expect(formatOccupancyInventoryTitle({ bedName: 'A', roomName: 'Room B' }, t)).toBe('Bed A');
    expect(formatOccupancyInventoryTitle({ bedName: 'Bed A' }, t)).toBe('Bed A');
  });

  it('formats rooms and units with type prefix when missing', () => {
    expect(formatOccupancyInventoryTitle({ roomName: '1' }, t)).toBe('Room 1');
    expect(formatOccupancyInventoryTitle({ roomName: 'Room 1' }, t)).toBe('Room 1');
    expect(formatOccupancyInventoryTitle({ unitName: '101' }, t)).toBe('Unit 101');
    expect(formatOccupancyInventoryTitle({ unitName: 'Apartment 101' }, t)).toBe('Apartment 101');
  });

  it('prefers bed over room/unit', () => {
    expect(
      formatOccupancyInventoryTitle(
        { bedName: 'A', roomName: 'B', unitName: '101', spaceName: 'Sunrise PG' },
        t,
      ),
    ).toBe('Bed A');
  });
});

describe('formatOccupancyInventoryPath', () => {
  it('keeps room under a bed title', () => {
    expect(
      formatOccupancyInventoryPath({
        spaceName: 'Sunrise PG',
        buildingName: 'PG 1',
        floorName: 'Floor 1',
        unitName: 'Unit 101',
        roomName: 'Room B',
        bedName: 'A',
      }),
    ).toBe('Sunrise PG · PG 1 · Floor 1 · Unit 101 · Room B');
  });

  it('drops the leaf when title is the room', () => {
    expect(
      formatOccupancyInventoryPath({
        spaceName: 'Sunrise PG',
        buildingName: 'PG 1',
        roomName: '1',
      }),
    ).toBe('Sunrise PG · PG 1');
  });
});
