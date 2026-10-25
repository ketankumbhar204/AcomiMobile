import {
  formatMemberStayLine,
  memberListStayLabel,
  stayLabelForMember,
} from '../memberListStay';

describe('formatMemberStayLine', () => {
  it('matches the payment trail and prefixes a bare bed name', () => {
    expect(
      formatMemberStayLine({
        buildingName: 'PG 1',
        floorName: 'Floor 1',
        unitName: 'Unit 101',
        roomName: 'Room A',
        bedName: 'B',
      }),
    ).toBe('PG 1 • Floor 1 • Unit 101 • Room A • Bed B');
  });

  it('puts the building name before the floor, then unit, room, and bed', () => {
    expect(
      formatMemberStayLine(
        {
          buildingId: 'b1',
          buildingName: 'A Block',
          floorName: '1',
          unitName: 'Unit 101',
          roomName: 'Room A',
          bedName: 'B',
        },
        {
          multipleBuildings: true,
          layoutByBuildingId: new Map([['b1', 'APARTMENT_PG']]),
        },
      ),
    ).toBe('A Block • Floor 1 • Unit 101 • Room A • Bed B');
  });

  it('omits missing levels and does not invent them', () => {
    expect(
      formatMemberStayLine({
        buildingName: 'PG 1',
        floorName: 'Floor 1',
        roomName: 'Room A',
        bedName: 'Bed A',
      }),
    ).toBe('PG 1 • Floor 1 • Room A • Bed A');
    expect(formatMemberStayLine({ buildingName: '  ', floorName: null })).toBeNull();
  });
});

describe('stayLabelForMember', () => {
  const rows = [
    {
      memberId: 'moved',
      status: 'ACTIVE',
      buildingName: 'PG 1',
      floorName: 'Floor 1',
      unitName: 'Unit 101',
      roomName: 'Room A',
      bedName: 'B',
    },
    {
      memberId: 'left',
      status: 'VACATED',
      vacatedAt: '2026-10-01T00:00:00',
      buildingName: 'PG 1',
      floorName: 'Floor 1',
      roomName: 'Room B',
      bedName: 'A',
    },
    {
      memberId: 'left',
      status: 'VACATED',
      vacatedAt: '2026-09-01T00:00:00',
      buildingName: 'Old',
      roomName: 'Room Z',
    },
  ];

  it('uses the active stay for a moved-in tenant', () => {
    expect(stayLabelForMember('moved', rows)).toBe('PG 1 • Floor 1 • Unit 101 • Room A • Bed B');
  });

  it('uses the latest vacated stay and ignores members with no occupancy', () => {
    expect(stayLabelForMember('left', rows)).toBe('PG 1 • Floor 1 • Room B • Bed A');
    expect(stayLabelForMember('none', rows)).toBeNull();
  });
});

describe('memberListStayLabel', () => {
  const trail = 'PG 1 · Floor 1 · Room A · B';

  it('shows the stay for moved-in and vacated tenants', () => {
    expect(
      memberListStayLabel(
        { role: 'TENANT', occupancyStatus: 'ALLOCATED' },
        trail,
      ),
    ).toBe(trail);
    expect(
      memberListStayLabel(
        { role: 'TENANT', occupancyStatus: 'VACATED', stayLabel: trail },
      ),
    ).toBe(trail);
  });

  it('hides reserved tenants, other roles, and blank locations', () => {
    expect(
      memberListStayLabel(
        { role: 'TENANT', occupancyStatus: 'RESERVED' },
        trail,
      ),
    ).toBeNull();
    expect(
      memberListStayLabel(
        { role: 'OWNER', occupancyStatus: 'ALLOCATED' },
        trail,
      ),
    ).toBeNull();
    expect(
      memberListStayLabel({ role: 'TENANT', occupancyStatus: 'ALLOCATED' }, '  '),
    ).toBeNull();
  });
});
