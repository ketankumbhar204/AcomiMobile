import type { MemberPaymentStatus, UniversalPaymentStatus } from '../api/types';

export type PaymentStatusVariant =
  | 'pending'
  | 'underReview'
  | 'needsUpdate'
  | 'paid'
  | 'rejected'
  | 'partial'
  | 'neutral';

export type PaymentStatusSource = UniversalPaymentStatus | MemberPaymentStatus;

export type PaymentStatusTheme = {
  background: string;
  border: string;
  text: string;
  accent: string;
};

/** Distinct status colors: amber pending, orange partial/needs-update, blue review, green paid, red rejected. */
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
  neutral: {
    background: '#F8FAFC',
    border: '#CBD5E1',
    text: '#475569',
    accent: '#94A3B8',
  },
};

export function resolvePaymentStatusVariant(status: PaymentStatusSource | null | undefined): PaymentStatusVariant {
  switch (status) {
    case 'PAID':
      return 'paid';
    case 'REJECTED':
      return 'rejected';
    case 'UPDATE_REQUESTED':
      return 'needsUpdate';
    case 'UNDER_REVIEW':
    case 'PROOF_UPLOADED':
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
    case 'UPDATE_REQUESTED':
      return 'payments.status.needsUpdate';
    case 'UNDER_REVIEW':
      return 'payments.status.underReview';
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

export function getPaymentStatusTheme(status: PaymentStatusSource | null | undefined): PaymentStatusTheme {
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
