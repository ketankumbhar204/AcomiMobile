import {
  buildMemberListStayDateInfo,
  type MemberListStayDateSource,
} from '../memberListStayDates';

const t = (key: string, options?: { defaultValue?: string }) =>
  options?.defaultValue ?? key;

function source(
  partial: Partial<MemberListStayDateSource> & Pick<MemberListStayDateSource, 'status'>,
): MemberListStayDateSource {
  return partial;
}

describe('buildMemberListStayDateInfo', () => {
  it('uses planned move-in for reserved with fixed exit', () => {
    const info = buildMemberListStayDateInfo(
      source({
        status: 'RESERVED',
        stayKind: 'MONTHLY',
        moveInDate: '2026-11-10',
        actualMoveInAt: '2026-11-01T00:00:00Z',
        expectedExitDate: '2026-12-10',
      }),
      t,
    );
    expect(info?.tone).toBe('reserved');
    expect(info?.moveInLabelKey).toBe('occupancy.section.plannedMoveIn');
    expect(info?.moveInValue).toContain('Nov');
    expect(info?.moveOutValue).toContain('Dec');
  });

  it('shows no fixed date for reserved open-ended stays', () => {
    const info = buildMemberListStayDateInfo(
      source({
        status: 'RESERVED',
        stayKind: 'OPEN_ENDED',
        moveInDate: '2026-11-10',
        expectedExitDate: null,
      }),
      t,
    );
    expect(info?.moveOutValue).toBe('No fixed date');
  });

  it('prefers actual move-in for moved-in members', () => {
    const info = buildMemberListStayDateInfo(
      source({
        status: 'ACTIVE',
        stayKind: 'SHORT',
        moveInDate: '2026-11-01',
        actualMoveInAt: '2026-11-08T10:00:00Z',
        expectedExitDate: '2026-11-15',
      }),
      t,
    );
    expect(info?.tone).toBe('movedIn');
    expect(info?.moveInLabelKey).toBe('occupancy.section.moveInDate');
    expect(info?.moveInValue).toContain('08');
    expect(info?.moveOutValue).toContain('15');
  });

  it('shows no fixed date for open-ended moved-in members', () => {
    const info = buildMemberListStayDateInfo(
      source({
        status: 'ACTIVE',
        stayKind: 'OPEN_ENDED',
        actualMoveInAt: '2026-11-08',
        expectedExitDate: '2099-01-01',
      }),
      t,
    );
    expect(info?.moveOutValue).toBe('No fixed date');
  });

  it('falls back safely when dates are missing', () => {
    const info = buildMemberListStayDateInfo(
      source({
        status: 'ACTIVE',
        stayKind: 'MONTHLY',
      }),
      t,
    );
    expect(info?.moveInValue).toBe('—');
    expect(info?.moveOutValue).toBe('No fixed date');
  });

  it('returns null when source is missing', () => {
    expect(buildMemberListStayDateInfo(null, t)).toBeNull();
  });
});
