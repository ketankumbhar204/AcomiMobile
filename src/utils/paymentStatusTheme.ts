import type {
  MealPollPaymentStatus,
  MemberPaymentStatus,
  UniversalPaymentStatus,
} from '../api/types';
import type { DayMealPaymentDisplayStatus } from './dayMealPayments';
import { colors } from '../theme';

export type PaymentStatusVariant =
  | 'pending'
  | 'underReview'
  | 'needsUpdate'
  | 'paid'
  | 'rejected'
  | 'partial'
  | 'overdue'
  | 'neutral';

export type PaymentStatusSource =
  | UniversalPaymentStatus
  | MemberPaymentStatus
  | MealPollPaymentStatus
  | DayMealPaymentDisplayStatus
  | 'OVERDUE';

export type PaymentStatusTheme = {
  background: string;
  border: string;
  text: string;
  accent: string;
};

/** Distinct status colors: amber pending, orange partial/needs-update, blue review, green paid, red rejected/overdue. */
export const PAYMENT_STATUS_THEME: Record<PaymentStatusVariant, PaymentStatusTheme> = {
  pending: {
    background: '#FEF3C7',
    border: '#F59E0B',
    text: '#92400E',
    accent: '#D97706',
  },
  partial: {
    background: '#FFEDD5',
    border: '#F97316',
    text: '#9A3412',
    accent: '#EA580C',
  },
  underReview: {
    background: '#DBEAFE',
    border: '#3B82F6',
    text: '#1E3A8A',
    accent: '#2563EB',
  },
  needsUpdate: {
    background: '#FFF7ED',
    border: '#F97316',
    text: '#C2410C',
    accent: '#EA580C',
  },
  paid: {
    background: '#D1FAE5',
    border: '#10B981',
    text: '#065F46',
    accent: '#059669',
  },
  rejected: {
    background: '#FEE2E2',
    border: '#EF4444',
    text: '#991B1B',
    accent: '#DC2626',
  },
  overdue: {
    background: '#FEE2E2',
    border: '#EF4444',
    text: '#991B1B',
    accent: '#DC2626',
  },
  neutral: {
    background: colors.surfaceSecondary,
    border: colors.border,
    text: '#475569',
    accent: '#94A3B8',
  },
};

export function resolvePaymentStatusVariant(
  status: PaymentStatusSource | null | undefined,
): PaymentStatusVariant {
  switch (status) {
    case 'PAID':
      return 'paid';
    case 'REJECTED':
      return 'rejected';
    case 'OVERDUE':
      return 'overdue';
    case 'UPDATE_REQUESTED':
      return 'needsUpdate';
    case 'UNDER_REVIEW':
    case 'PROOF_UPLOADED':
    case 'PENDING_APPROVAL':
      return 'underReview';
    case 'PARTIAL':
      return 'partial';
    case 'PENDING':
      return 'pending';
    default:
      return 'neutral';
  }
}

export function getPaymentStatusLabelKey(status: PaymentStatusSource | null | undefined): string {
  switch (status) {
    case 'PAID':
      return 'payments.status.paid';
    case 'REJECTED':
      return 'payments.status.rejected';
    case 'OVERDUE':
      return 'paymentCollection.dayMeals.status.overdue';
    case 'UPDATE_REQUESTED':
      return 'payments.status.needsUpdate';
    case 'UNDER_REVIEW':
      return 'payments.status.underReview';
    case 'PENDING_APPROVAL':
      return 'paymentCollection.dayMeals.status.underReview';
    case 'PROOF_UPLOADED':
      return 'payments.status.submitted';
    case 'PARTIAL':
      return 'payments.status.partial';
    case 'PENDING':
      return 'payments.status.pending';
    default:
      return 'payments.status.none';
  }
}

export function getPaymentStatusTheme(
  status: PaymentStatusSource | null | undefined,
): PaymentStatusTheme {
  return PAYMENT_STATUS_THEME[resolvePaymentStatusVariant(status)];
}

export function resolveTimelineEventVariant(eventType: string): PaymentStatusVariant {
  switch (eventType) {
    case 'PAID':
    case 'APPROVED':
      return 'paid';
    case 'REJECTED':
      return 'rejected';
    case 'UPDATE_REQUESTED':
      return 'needsUpdate';
    case 'UNDER_REVIEW':
    case 'PROOF_UPLOADED':
    case 'RESUBMITTED':
      return 'underReview';
    case 'CREATED':
      return 'pending';
    default:
      return 'neutral';
  }
}
