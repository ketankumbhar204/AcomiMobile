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
  /** When true, lodging meal config/ops cards may show during NEW/SETUP. */
  mealConfigOpen?: boolean;
  /** When false, hide accommodation ops even if lifecycle would show them. */
  accommodationOpen?: boolean;
};

/**
 * Dashboard widget visibility by lifecycle — design doc Decision Table.
 * Pure helper; no I/O. Mess shows meal ops earlier during setup.
 *
 * Progressive Guided Access: optional capability overrides refine coarse
 * NEW/SETUP hiding so meal config can appear once MEAL_CONFIG is open.
 */
export function dashboardVisibilityForLifecycle(
  lifecycle: LifecycleState | null,
  options?: DashboardVisibilityOptions,
): DashboardLifecycleVisibility {
  const isMess = options?.spaceType === 'MESS';
  const mealConfigOpen = options?.mealConfigOpen === true;
  // Default false during setup unless caller opts in (capability AVAILABLE).
  const accommodationOpen = options?.accommodationOpen === true;

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
        showAccommodationOps: accommodationOpen,
        showMealOps: isMess || mealConfigOpen,
        showFullQuickActions: false,
        showMessSetupQuickActions: isMess,
        elevatePendingActions: false,
      };
    case 'SETUP_IN_PROGRESS':
      return {
        showSetupChrome: true,
        showFinancial: true,
        softenFinancial: true,
        showAccommodationOps: accommodationOpen,
        showMealOps: isMess || mealConfigOpen,
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
