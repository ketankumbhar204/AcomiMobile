import {
  dashboardVisibilityForLifecycle,
  shouldShowSetupChrome,
} from '../dashboardVisibility';
import { mapSetupNavigationTarget } from '../navigation';

describe('dashboardVisibilityForLifecycle', () => {
  it('shows setup chrome and hides ops for NEW / SETUP (lodging)', () => {
    for (const state of ['NEW', 'SETUP_IN_PROGRESS'] as const) {
      const v = dashboardVisibilityForLifecycle(state);
      expect(v.showSetupChrome).toBe(true);
      expect(v.showAccommodationOps).toBe(false);
      expect(v.showMealOps).toBe(false);
      expect(v.showFullQuickActions).toBe(false);
      expect(v.showMessSetupQuickActions).toBe(false);
      expect(v.softenFinancial).toBe(true);
      expect(shouldShowSetupChrome(state)).toBe(true);
    }
  });

  it('Mess shows meal ops + setup quick actions during NEW / SETUP', () => {
    for (const state of ['NEW', 'SETUP_IN_PROGRESS'] as const) {
      const v = dashboardVisibilityForLifecycle(state, { spaceType: 'MESS' });
      expect(v.showSetupChrome).toBe(true);
      expect(v.showMealOps).toBe(true);
      expect(v.showMessSetupQuickActions).toBe(true);
      expect(v.showFullQuickActions).toBe(false);
      expect(v.showAccommodationOps).toBe(false);
    }
  });

  it('hides setup chrome and shows ops for READY / ACTIVE', () => {
    for (const state of ['READY', 'ACTIVE'] as const) {
      const v = dashboardVisibilityForLifecycle(state);
      expect(v.showSetupChrome).toBe(false);
      expect(v.showAccommodationOps).toBe(true);
      expect(v.showMealOps).toBe(true);
      expect(v.showFullQuickActions).toBe(true);
      expect(v.showMessSetupQuickActions).toBe(false);
      expect(shouldShowSetupChrome(state)).toBe(false);
    }
  });

  it('elevates pending actions for NEEDS_ATTENTION without setup chrome', () => {
    const v = dashboardVisibilityForLifecycle('NEEDS_ATTENTION');
    expect(v.showSetupChrome).toBe(false);
    expect(v.elevatePendingActions).toBe(true);
    expect(v.showFullQuickActions).toBe(true);
  });
});

describe('mapSetupNavigationTarget', () => {
  it('maps engine targets to existing destinations', () => {
    expect(mapSetupNavigationTarget('QUICK_SETUP')).toEqual({
      kind: 'stack',
      screen: 'QuickSetupWizard',
    });
    expect(mapSetupNavigationTarget('ADD_MEMBER')).toEqual({
      kind: 'stack',
      screen: 'AddMember',
    });
    expect(mapSetupNavigationTarget('ADD_MEMBER', { spaceType: 'MESS' })).toEqual({
      kind: 'stack',
      screen: 'AddCustomersHub',
    });
    expect(mapSetupNavigationTarget('MENU_LIBRARY')).toEqual({
      kind: 'stack',
      screen: 'MenuLibrary',
    });
    expect(mapSetupNavigationTarget('MENU_SHARE')).toEqual({
      kind: 'stack',
      screen: 'MenuSharePreview',
    });
    expect(mapSetupNavigationTarget('DELIVERY_LOCATIONS')).toEqual({
      kind: 'stack',
      screen: 'MealDeliveryLocations',
    });
    expect(mapSetupNavigationTarget('ACCOMMODATION_HOME')).toEqual({
      kind: 'tab',
      tab: 'Accommodation',
    });
    expect(mapSetupNavigationTarget('MEMBERS')).toEqual({
      kind: 'tab',
      tab: 'Members',
    });
  });
});
