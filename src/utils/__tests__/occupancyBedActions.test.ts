import { occupancyActionsForBedStatus } from '../occupancyBedActions';

describe('occupancyActionsForBedStatus', () => {
  it('shows allocate and reserve for available beds', () => {
    expect(occupancyActionsForBedStatus('AVAILABLE')).toBe('allocate-reserve');
  });

  it('shows move-in and cancel for reserved beds', () => {
    expect(occupancyActionsForBedStatus('RESERVED')).toBe('moveIn-cancel');
  });

  it('shows transfer and vacate for occupied beds', () => {
    expect(occupancyActionsForBedStatus('OCCUPIED')).toBe('transfer-vacate');
  });

  it('hides occupancy actions for maintenance, blocked, and inactive beds', () => {
    expect(occupancyActionsForBedStatus('MAINTENANCE')).toBe('none');
    expect(occupancyActionsForBedStatus('BLOCKED')).toBe('none');
    expect(occupancyActionsForBedStatus('AVAILABLE', true)).toBe('none');
  });
});
