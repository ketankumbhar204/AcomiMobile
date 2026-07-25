import type { SetupNavigationTarget } from './types';

/**
 * Maps engine navigation targets to existing app destinations.
 * Phase 2: consumed by Dashboard — no new routes.
 */
export type SetupNavDestination =
  | { kind: 'tab'; tab: 'Accommodation' | 'Members' | 'Meals' | 'Dashboard' }
  | {
      kind: 'stack';
      screen:
        | 'QuickSetupWizard'
        | 'BuildingForm'
        | 'AddMember'
        | 'AddCustomersHub'
        | 'ImportExistingPeople'
        | 'MenuLibrary'
        | 'MenuPlanning'
        | 'MenuSharePreview'
        | 'MealDeliveryLocations'
        | 'DashboardPendingActions';
    };

export function mapSetupNavigationTarget(
  target: SetupNavigationTarget,
  options?: { spaceType?: string | null },
): SetupNavDestination {
  switch (target) {
    case 'QUICK_SETUP':
      return { kind: 'stack', screen: 'QuickSetupWizard' };
    case 'ACCOMMODATION_HOME':
      return { kind: 'tab', tab: 'Accommodation' };
    case 'BUILDING_FORM':
      return { kind: 'stack', screen: 'BuildingForm' };
    case 'MEMBERS':
      return { kind: 'tab', tab: 'Members' };
    case 'ADD_MEMBER':
      return options?.spaceType === 'MESS'
        ? { kind: 'stack', screen: 'AddCustomersHub' }
        : { kind: 'stack', screen: 'AddMember' };
    case 'MENU_LIBRARY':
      return { kind: 'stack', screen: 'MenuLibrary' };
    case 'MENU_PLANNING':
      return { kind: 'stack', screen: 'MenuPlanning' };
    case 'MENU_SHARE':
      return { kind: 'stack', screen: 'MenuSharePreview' };
    case 'DELIVERY_LOCATIONS':
      return { kind: 'stack', screen: 'MealDeliveryLocations' };
    case 'PENDING_ACTIONS':
      return { kind: 'stack', screen: 'DashboardPendingActions' };
    case 'DASHBOARD':
      return { kind: 'tab', tab: 'Dashboard' };
    default: {
      const _exhaustive: never = target;
      return _exhaustive;
    }
  }
}
