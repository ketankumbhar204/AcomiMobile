import type { SpaceType } from '../api/types';
import type { LifecycleState } from './types';

export type DashboardLifecycleVisibility = {
  showSetupChrome: boolean;
  showFinancial: boolean;
  /** Soften financial (still visible) during early setup. */
  softenFinancial: boolean;
  showAccommodationOps: boolean;
  showMealOps: boolean;
  showFullQuickActions: boolean;
  /**
   * Mess-only: show setup-prioritized quick actions while required milestones
   * are incomplete (Create Menu Library / Plan Menu / Add Customers).
   */
  showMessSetupQuickActions: boolean;
  /** Elevate pending card to top of quick actions. */
  elevatePendingActions: boolean;
};

export type DashboardVisibilityOptions = {
  spaceType?: SpaceType | null;
};

/**
 * Dashboard widget visibility by lifecycle — design doc Decision Table.
 * Pure helper; no I/O. Mess shows meal ops earlier during setup.
 */
export function dashboardVisibilityForLifecycle(
  lifecycle: LifecycleState | null,
  options?: DashboardVisibilityOptions,
): DashboardLifecycleVisibility {
  const isMess = options?.spaceType === 'MESS';

  if (lifecycle == null) {
    return {
      showSetupChrome: false,
      showFinancial: true,
      softenFinancial: false,
      showAccommodationOps: true,
      showMealOps: true,
      showFullQuickActions: true,
      showMessSetupQuickActions: false,
      elevatePendingActions: false,
    };
  }

  switch (lifecycle) {
    case 'NEW':
      return {
        showSetupChrome: true,
        showFinancial: true,
        softenFinancial: true,
        showAccommodationOps: false,
        showMealOps: isMess,
        showFullQuickActions: false,
        showMessSetupQuickActions: isMess,
        elevatePendingActions: false,
      };
    case 'SETUP_IN_PROGRESS':
      return {
        showSetupChrome: true,
        showFinancial: true,
        softenFinancial: true,
        showAccommodationOps: false,
        showMealOps: isMess,
        showFullQuickActions: false,
        showMessSetupQuickActions: isMess,
        elevatePendingActions: false,
      };
    case 'READY':
    case 'ACTIVE':
      return {
        showSetupChrome: false,
        showFinancial: true,
        softenFinancial: false,
        showAccommodationOps: true,
        showMealOps: true,
        showFullQuickActions: true,
        showMessSetupQuickActions: false,
        elevatePendingActions: false,
      };
    case 'NEEDS_ATTENTION':
      return {
        showSetupChrome: false,
        showFinancial: true,
        softenFinancial: false,
        showAccommodationOps: true,
        showMealOps: true,
        showFullQuickActions: true,
        showMessSetupQuickActions: false,
        elevatePendingActions: true,
      };
    default: {
      const _exhaustive: never = lifecycle;
      return _exhaustive;
    }
  }
}

/** Setup chrome visible only while required milestones incomplete. */
export function shouldShowSetupChrome(lifecycle: LifecycleState | null): boolean {
  return lifecycle === 'NEW' || lifecycle === 'SETUP_IN_PROGRESS';
}
