import type { OccupancyResponse } from '../../api/types';
import {
  computeOccupancyMonthlyTotal,
  computeOccupancyMonthlyTotalForMonth,
  computeOpenEndedAccruedRentForMonth,
  isOccupancyBillableInMonth,
  isOpenEndedDailyRate,
} from '../occupancyContract';

function occupancy(overrides: Partial<OccupancyResponse>): OccupancyResponse {
  return {
    occupancyId: 'occ-1',
    spaceId: 'space-1',
    memberId: 'member-1',
    memberName: 'Tenant One',
    targetType: 'BED',
    buildingId: 'building-1',
    buildingName: 'Block A',
    allocatedAt: '2026-07-01T00:00:00Z',
    allocatedBy: 'user-1',
    status: 'ACTIVE',
    moveInDate: '2026-07-01',
    rentSnapshot: 10000,
    ...overrides,
  };
}

describe('occupancy month billing', () => {
  it('excludes tenants before their move-in month', () => {
    const row = occupancy({ moveInDate: '2026-07-01' });

    expect(isOccupancyBillableInMonth(row, '2026-05')).toBe(false);
    expect(computeOccupancyMonthlyTotalForMonth(row, '2026-05')).toBeNull();
    expect(isOccupancyBillableInMonth(row, '2026-07')).toBe(true);
    expect(computeOccupancyMonthlyTotalForMonth(row, '2026-07')).toBe(10000);
  });

  it('prorates mid-month move-in for display helpers', () => {
    const row = occupancy({ moveInDate: '2026-09-15', rentSnapshot: 10000 });

    expect(computeOccupancyMonthlyTotalForMonth(row, '2026-09')).toBe(5333.33);
  });

  describe('OPEN_ENDED DAILY_RATE', () => {
    const openEnded = (overrides: Partial<OccupancyResponse> = {}) =>
      occupancy({
        stayKind: 'OPEN_ENDED',
        pricingBasis: 'DAILY_RATE',
        rentSnapshot: 300,
        moveInDate: '2026-09-10',
        ...overrides,
      });

    it('detects open-ended daily-rate stays only', () => {
      expect(isOpenEndedDailyRate(openEnded())).toBe(true);
      expect(isOpenEndedDailyRate(openEnded({ pricingBasis: null }))).toBe(false);
      expect(isOpenEndedDailyRate(occupancy({ stayKind: 'SHORT', pricingBasis: 'FIXED_TOTAL' }))).toBe(
        false,
      );
      expect(isOpenEndedDailyRate(occupancy({ stayKind: 'MONTHLY' }))).toBe(false);
      expect(isOpenEndedDailyRate(null)).toBe(false);
    });

    it('never treats the daily rate as a monthly total', () => {
      expect(computeOccupancyMonthlyTotal(openEnded())).toBeNull();
      expect(computeOccupancyMonthlyTotalForMonth(openEnded(), '2026-09')).toBeNull();
      expect(computeOccupancyMonthlyTotalForMonth(openEnded(), '2026-10')).toBeNull();
    });

    it('computes accrued rent as daily x inclusive billable days', () => {
      // 10..30 Sep inclusive = 21 days.
      expect(computeOpenEndedAccruedRentForMonth(openEnded(), '2026-09')).toBe(6300);
      // Full month.
      expect(computeOpenEndedAccruedRentForMonth(openEnded(), '2026-10')).toBe(9300);
      // Before move-in.
      expect(computeOpenEndedAccruedRentForMonth(openEnded(), '2026-08')).toBeNull();
    });

    it('caps accrued rent at the vacate date', () => {
      const row = openEnded({ status: 'VACATED', vacatedAt: '2026-09-14T08:00:00Z' });
      // 10..14 Sep inclusive = 5 days.
      expect(computeOpenEndedAccruedRentForMonth(row, '2026-09')).toBe(1500);
    });

    it('returns no accrued rent for non open-ended stays', () => {
      expect(computeOpenEndedAccruedRentForMonth(occupancy({}), '2026-07')).toBeNull();
    });
  });

  it('keeps MONTHLY and SHORT totals unchanged', () => {
    expect(
      computeOccupancyMonthlyTotalForMonth(occupancy({ stayKind: 'MONTHLY' }), '2026-07'),
    ).toBe(10000);
    expect(
      computeOccupancyMonthlyTotalForMonth(
        occupancy({ stayKind: 'SHORT', pricingBasis: 'FIXED_TOTAL' }),
        '2026-07',
      ),
    ).toBe(10000);
  });

  it('excludes reserved occupancies', () => {
    const row = occupancy({ status: 'RESERVED', moveInDate: '2026-07-01' });

    expect(isOccupancyBillableInMonth(row, '2026-07')).toBe(false);
  });

  it('excludes vacated tenants after their vacated month', () => {
    const row = occupancy({
      status: 'VACATED',
      moveInDate: '2026-03-01',
      vacatedAt: '2026-04-30T10:00:00Z',
    });

    expect(isOccupancyBillableInMonth(row, '2026-05')).toBe(false);
    expect(isOccupancyBillableInMonth(row, '2026-04')).toBe(true);
  });
});
