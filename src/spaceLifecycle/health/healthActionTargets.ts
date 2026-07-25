import type { HealthCategoryId, HealthFactor } from './types';
import type { RecommendedAction, SetupNavigationTarget } from '../types';

export type HealthNavAction =
  | { kind: 'setupTarget'; target: SetupNavigationTarget }
  | { kind: 'pendingActions' }
  | { kind: 'paymentsUnderReview' }
  | { kind: 'vacantBeds' }
  | { kind: 'occupiedBeds' };

/**
 * Maps a health factor / suggestion id to an in-app destination.
 * Does not invent new recommendation logic — only routes known signals.
 */
export function resolveHealthFactorAction(
  factor: HealthFactor,
  recommendation: RecommendedAction | null,
): HealthNavAction | null {
  switch (factor.id) {
    case 'ops.occupancy':
      return { kind: 'vacantBeds' };
    case 'attention.payments':
    case 'attention.reviewPayments':
      return { kind: 'paymentsUnderReview' };
    case 'attention.pending':
    case 'attention.resolvePending':
      return { kind: 'pendingActions' };
    case 'setup.progress':
    case 'setup.completeRemaining':
      return {
        kind: 'setupTarget',
        target: recommendation?.navigationTarget ?? 'QUICK_SETUP',
      };
    case 'ops.needProperty':
      return { kind: 'setupTarget', target: 'ACCOMMODATION_HOME' };
    case 'ops.needResidents':
    case 'ops.needCustomers':
      return { kind: 'setupTarget', target: 'ADD_MEMBER' };
    case 'ops.needMenuLibrary':
      return { kind: 'setupTarget', target: 'MENU_LIBRARY' };
    default:
      if (factor.id.startsWith('setup.rec.') && recommendation) {
        return { kind: 'setupTarget', target: recommendation.navigationTarget };
      }
      return null;
  }
}

/** Category chip / card accent tokens (reuse existing palette hues). */
export function categoryAccent(category: HealthCategoryId): {
  accent: string;
  soft: string;
} {
  switch (category) {
    case 'setup':
      return { accent: '#059669', soft: '#05966918' };
    case 'operations':
      return { accent: '#2563EB', soft: '#2563EB18' };
    case 'attention':
      return { accent: '#D97706', soft: '#D9770618' };
    default:
      return { accent: '#128C7E', soft: '#128C7E18' };
  }
}

export function bandAccent(band: string): string {
  switch (band) {
    case 'excellent':
    case 'healthy':
      return '#059669';
    case 'needsImprovement':
      return '#D97706';
    case 'atRisk':
      return '#EA580C';
    case 'critical':
      return '#DC2626';
    default:
      return '#128C7E';
  }
}
