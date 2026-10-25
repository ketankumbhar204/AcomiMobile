import type { SpaceType } from '../../api/types';
import {
  showsMemberMealSelectionCard,
  showsMessDashboardWidgets,
} from '../accommodationProfile';

const MESS_ONLY = ['totalMenuItems', 'yourOrders', 'recentOrders', 'myOrders'] as const;
const SHARED = ['dueAmount', 'upcomingPayments', 'payments', 'complaints'] as const;

function visible(widget: string, spaceType: SpaceType | null | undefined): boolean {
  if ((SHARED as readonly string[]).includes(widget)) {
    return true;
  }
  return showsMessDashboardWidgets(spaceType);
}

describe('showsMessDashboardWidgets', () => {
  it('hides mess order widgets on a PG dashboard and keeps the meal card', () => {
    expect(showsMemberMealSelectionCard('PG')).toBe(true);
    expect(showsMemberMealSelectionCard('MESS')).toBe(true);
    expect(showsMemberMealSelectionCard('HOSTEL')).toBe(false);
    for (const widget of MESS_ONLY) {
      expect(visible(widget, 'PG')).toBe(false);
    }
    for (const widget of SHARED) {
      expect(visible(widget, 'PG')).toBe(true);
    }
  });

  it('keeps mess widgets on a Mess dashboard', () => {
    for (const widget of [...MESS_ONLY, ...SHARED]) {
      expect(visible(widget, 'MESS')).toBe(true);
    }
  });

  it('hides mess widgets for hostel, co-living, and rental', () => {
    for (const spaceType of ['HOSTEL', 'CO_LIVING', 'RENTAL'] as const) {
      expect(showsMessDashboardWidgets(spaceType)).toBe(false);
      expect(visible('myOrders', spaceType)).toBe(false);
      expect(visible('payments', spaceType)).toBe(true);
    }
  });

  it('does not assume a missing space type is a mess', () => {
    expect(showsMessDashboardWidgets(undefined)).toBe(false);
    expect(showsMessDashboardWidgets(null)).toBe(false);
    expect(visible('recentOrders', undefined)).toBe(false);
  });

  it('follows the selected space when switching between PG and Mess', () => {
    expect(showsMessDashboardWidgets('PG')).toBe(false);
    expect(showsMessDashboardWidgets('MESS')).toBe(true);
    expect(showsMessDashboardWidgets('PG')).toBe(false);
  });
});
