import { groupBedsByRoom, dedupeBedsById, groupBedsByUnit } from '../groupBedsByRoom';
import type { BedSpaceListItemResponse } from '../../api/types';

function bed(partial: Partial<BedSpaceListItemResponse> & Pick<BedSpaceListItemResponse, 'bedId' | 'roomId'>): BedSpaceListItemResponse {
  return {
    bedId: partial.bedId,
    label: partial.label ?? 'A',
    status: partial.status ?? 'AVAILABLE',
    buildingId: partial.buildingId ?? 'b1',
    buildingName: partial.buildingName ?? 'Building 1',
    floorId: partial.floorId ?? 'f1',
    floorName: partial.floorName ?? 'Floor 1',
    unitId: partial.unitId ?? 'u1',
    unitName: partial.unitName ?? 'Unit 101',
    roomId: partial.roomId,
    roomName: partial.roomName ?? 'Room A',
  };
}

describe('groupBedsByRoom', () => {
  it('dedupes beds by bedId', () => {
    const items = [bed({ bedId: '1', roomId: 'r1' }), bed({ bedId: '1', roomId: 'r1', label: 'B' })];
    expect(dedupeBedsById(items)).toHaveLength(1);
  });

  it('groups beds under the same room', () => {
    const groups = groupBedsByRoom([
      bed({ bedId: '1', roomId: 'r1', label: 'A' }),
      bed({ bedId: '2', roomId: 'r1', label: 'B' }),
      bed({ bedId: '3', roomId: 'r2', label: 'A' }),
    ]);

    expect(groups).toHaveLength(2);
    expect(groups[0].beds).toHaveLength(2);
    expect(groups[1].beds).toHaveLength(1);
    expect(groups[0].key).toContain('r1');
  });

  it('groups rooms under units', () => {
    const units = groupBedsByUnit([
      bed({ bedId: '1', roomId: 'r1', unitId: 'u1', unitName: 'Unit 101', label: 'A' }),
      bed({ bedId: '2', roomId: 'r1', unitId: 'u1', unitName: 'Unit 101', label: 'B' }),
      bed({ bedId: '3', roomId: 'r2', unitId: 'u1', unitName: 'Unit 101', label: 'A' }),
    ]);

    expect(units).toHaveLength(1);
    expect(units[0].rooms).toHaveLength(2);
    expect(units[0].unitName).toBe('Unit 101');
  });
});
