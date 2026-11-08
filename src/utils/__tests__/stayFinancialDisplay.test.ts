import {
  buildStayFinancialPresentation,
  formatOccupancyRentRate,
  resolveOccupancyStayKind,
} from '../stayFinancialDisplay';
import type { OccupancyResponse } from '../../api/types';

function baseOccupancy(
  patch: Partial<OccupancyResponse>,
): OccupancyResponse {
  return {
    occupancyId: 'o1',
    spaceId: 's1',
    memberId: 'm1',
    memberName: 'Customer 1',
    status: 'ACTIVE',
    targetType: 'BED',
    ...patch,
  } as OccupancyResponse;
}

describe('stayFinancialDisplay', () => {
  it('resolves SHORT stayKind and never labels monthly total', () => {
    const presentation = buildStayFinancialPresentation(
      baseOccupancy({
        stayKind: 'SHORT',
        rentSnapshot: 400,
        agreedTotal: 2800,
        depositSnapshot: 0,
        foodEnabled: false,
        moveInDate: '2026-11-05',
        expectedExitDate: '2026-11-12',
      }),
    );
    expect(presentation.stayKind).toBe('SHORT');
    expect(presentation.rows.some(r => r.labelDefault.includes('Monthly'))).toBe(false);
    expect(presentation.rows.find(r => r.key === 'dailyRent')?.value).toContain('/ night');
    expect(presentation.rows.find(r => r.key === 'stayRent')?.value).toContain('2,800');
    expect(presentation.rows.find(r => r.key === 'food')?.value).toBe('no');
  });

  it('uses OPEN_ENDED daily rent without inventing a stay total', () => {
    const presentation = buildStayFinancialPresentation(
      baseOccupancy({
        stayKind: 'OPEN_ENDED',
        rentSnapshot: 400,
        depositSnapshot: 3000,
        foodEnabled: true,
      }),
    );
    expect(presentation.stayKind).toBe('OPEN_ENDED');
    expect(presentation.rows.find(r => r.key === 'dailyRent')?.value).toContain('/ day');
    expect(presentation.rows.some(r => r.key === 'stayRent' || r.key === 'monthlyTotal')).toBe(
      false,
    );
  });

  it('keeps MONTHLY rent and monthly total labels', () => {
    const presentation = buildStayFinancialPresentation(
      baseOccupancy({
        stayKind: 'MONTHLY',
        rentSnapshot: 12000,
        depositSnapshot: 12000,
        foodEnabled: true,
        foodIncludedInRent: true,
      }),
    );
    expect(presentation.stayKind).toBe('MONTHLY');
    expect(presentation.rows.find(r => r.key === 'monthlyRent')?.labelDefault).toBe('Monthly rent');
    expect(presentation.rows.find(r => r.key === 'monthlyTotal')?.value).toContain('12,000');
  });

  it('formats compact occupancy rent rates by stay kind', () => {
    expect(
      formatOccupancyRentRate({ stayKind: 'SHORT', rentSnapshot: 400 }).value,
    ).toContain('/ night');
    expect(
      formatOccupancyRentRate({ stayKind: 'OPEN_ENDED', rentSnapshot: 400 }).value,
    ).toContain('/ day');
    expect(resolveOccupancyStayKind({ pricingBasis: 'FIXED_TOTAL' })).toBe('SHORT');
  });
});
