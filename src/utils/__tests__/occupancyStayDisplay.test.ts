import {
  formatOccupancyLocationHierarchy,
  getOccupiedDayCount,
} from '../occupancyRules';
import type { CurrentOccupancySummaryResponse } from '../../api/types';

describe('formatOccupancyLocationHierarchy', () => {
  it('splits building/floor from unit/room/bed', () => {
    const summary = {
      buildingName: 'Building 1',
      floorName: 'Floor 1',
      unitName: 'Unit 101',
      roomName: 'Room A',
      bedName: 'A',
    } as CurrentOccupancySummaryResponse;

    expect(formatOccupancyLocationHierarchy(summary)).toEqual({
      primary: 'Building 1 • Floor 1',
      secondary: 'Unit 101 • Room A • A',
    });
  });

  it('handles missing lower levels', () => {
    const summary = {
      buildingName: 'Building 1',
      floorName: null,
      unitName: 'Unit 101',
    } as CurrentOccupancySummaryResponse;

    expect(formatOccupancyLocationHierarchy(summary)).toEqual({
      primary: 'Building 1',
      secondary: 'Unit 101',
    });
  });
});

describe('getOccupiedDayCount', () => {
  it('returns inclusive days from move-in through today', () => {
    const today = new Date();
    today.setHours(12, 0, 0, 0);
    const fiveDaysAgo = new Date(today);
    fiveDaysAgo.setDate(today.getDate() - 5);
    const iso = fiveDaysAgo.toISOString().slice(0, 10);
    expect(getOccupiedDayCount(iso)).toBe(6);
  });

  it('returns 1 for move-in today', () => {
    const today = new Date();
    const iso = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
    expect(getOccupiedDayCount(iso)).toBe(1);
  });

  it('returns null for missing or future dates', () => {
    expect(getOccupiedDayCount(null)).toBeNull();
    expect(getOccupiedDayCount('2099-01-01')).toBeNull();
  });
});
