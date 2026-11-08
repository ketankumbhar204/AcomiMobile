import {
  computeAvailabilityPercent,
  resolveInventoryTotal,
} from '../dashboardAvailability';

describe('dashboardAvailability', () => {
  it('computes availability percent from available ÷ total', () => {
    expect(computeAvailabilityPercent(92, 96)).toBe(96);
    expect(computeAvailabilityPercent(0, 10)).toBe(0);
    expect(computeAvailabilityPercent(10, 10)).toBe(100);
  });

  it('returns 0 for empty or invalid inventory', () => {
    expect(computeAvailabilityPercent(5, 0)).toBe(0);
    expect(computeAvailabilityPercent(Number.NaN, 10)).toBe(0);
  });

  it('prefers structure total over status sum', () => {
    expect(
      resolveInventoryTotal({
        structureTotal: 96,
        occupied: 3,
        available: 92,
        reserved: 1,
      }),
    ).toBe(96);
  });

  it('falls back to status sum when structure is zero', () => {
    expect(
      resolveInventoryTotal({
        structureTotal: 0,
        occupied: 3,
        available: 92,
        reserved: 1,
      }),
    ).toBe(96);
  });
});
