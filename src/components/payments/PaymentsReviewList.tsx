import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import type { PaymentRejectionReason, SpacePaymentResponse, SpaceType } from '../../api/types';
import type { HistoryReviewFilter, PendingReviewFilter } from '../../utils/ownerPaymentFilters';
import { colors, spacing, typography } from '../../theme';
import { EmptyState, SkeletonCard } from '../ui';
import { PaymentApprovalCard } from './PaymentApprovalCard';

type ReviewState = {
  queue: 'PENDING' | 'HISTORY';
  pendingFilter: PendingReviewFilter;
  historyFilter: HistoryReviewFilter;
  payments: SpacePaymentResponse[];
  loading: boolean;
  error: string | null;
  serviceUnavailable: boolean;
  reviewingId: string | null;
};

type PaymentsReviewListProps = {
  review: ReviewState;
  showActions: boolean;
  spaceType?: SpaceType;
  onApprove: (paymentId: string) => void;
  onReject: (paymentId: string, code: PaymentRejectionReason, reason?: string) => void;
  onRequestUpdate: (paymentId: string, message: string) => void | Promise<void>;
  onOpenDetail?: (payment: SpacePaymentResponse) => void;
};

function emptyStateKey(review: ReviewState): string {
  if (review.queue === 'PENDING') {
    return `paymentCollection.review.empty.pending.${review.pendingFilter}`;
  }
  return `paymentCollection.review.empty.history.${review.historyFilter}`;
}

export function PaymentsReviewList({
  review,
  showActions,
  spaceType,
  onApprove,
  onReject,
  onRequestUpdate,
  onOpenDetail,
}: PaymentsReviewListProps) {
  const { t } = useTranslation();

  if (review.serviceUnavailable) {
    return (
      <EmptyState
        title={t('paymentCollection.serviceUnavailable.title')}
        description={t('paymentCollection.serviceUnavailable.description')}
        icon="⚠️"
      />
    );
  }

  return (
    <View>
      {review.error ? <Text style={styles.error}>{t(review.error)}</Text> : null}

      {review.loading && review.payments.length === 0 ? (
        <SkeletonCard />
      ) : review.payments.length === 0 ? (
        <EmptyState title={t(emptyStateKey(review))} icon="💳" />
      ) : (
        review.payments.map(payment => (
          <PaymentApprovalCard
            key={payment.paymentId}
            payment={payment}
            reviewing={review.reviewingId === payment.paymentId}
            spaceType={spaceType}
            showActions={
              showActions &&
              (payment.paymentStatus === 'UNDER_REVIEW' ||
                payment.paymentStatus === 'PROOF_UPLOADED' ||
                payment.paymentStatus === 'UPDATE_REQUESTED' ||
                payment.paymentStatus === 'REJECTED')
            }
            onApprove={() => onApprove(payment.paymentId)}
            onReject={(code, reason) => onReject(payment.paymentId, code, reason)}
            onRequestUpdate={message => onRequestUpdate(payment.paymentId, message)}
            onOpenDetail={onOpenDetail ? () => onOpenDetail(payment) : undefined}
          />
        ))
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  error: {
    ...typography.body,
    color: '#DC2626',
    marginBottom: spacing.md,
  },
});
