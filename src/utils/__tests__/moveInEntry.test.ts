import { allocateNeedsVacantBedPick, bedIsSelectableForMoveIn } from '../moveInEntry';

describe('moveInEntry', () => {
  it('sends a new move-in to vacant beds until a bed is chosen', () => {
    expect(allocateNeedsVacantBedPick('ALLOCATE')).toBe(true);
    expect(allocateNeedsVacantBedPick('ALLOCATE', {})).toBe(true);
    expect(allocateNeedsVacantBedPick('ALLOCATE', { bedId: 'bed-1' })).toBe(false);
    expect(allocateNeedsVacantBedPick('ALLOCATE', { unitId: 'unit-1' })).toBe(false);
  });

  it('does not redirect reserve, transfer, or vacate', () => {
    expect(allocateNeedsVacantBedPick('RESERVE')).toBe(false);
    expect(allocateNeedsVacantBedPick('TRANSFER')).toBe(false);
    expect(allocateNeedsVacantBedPick('VACATE')).toBe(false);
    expect(allocateNeedsVacantBedPick('MOVE_IN')).toBe(false);
  });

  it('allows only available beds for a new move-in', () => {
    expect(bedIsSelectableForMoveIn('AVAILABLE')).toBe(true);
    expect(bedIsSelectableForMoveIn('OCCUPIED')).toBe(false);
    expect(bedIsSelectableForMoveIn('RESERVED')).toBe(false);
    expect(bedIsSelectableForMoveIn('MAINTENANCE')).toBe(false);
    expect(bedIsSelectableForMoveIn(null)).toBe(false);
  });
});
