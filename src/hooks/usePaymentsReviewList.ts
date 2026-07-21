import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { paymentsApi } from '../api/paymentsApi';
import type {
  PaymentRejectionReason,
  PaymentReviewAction,
  PaymentsReviewQueueParam,
  SpacePaymentResponse,
  UUID,
} from '../api/types';
import { createRequestGuard } from '../modules/orchestrator';
import type { HistoryReviewFilter, PendingReviewFilter } from '../utils/ownerPaymentFilters';

const PAGE_SIZE = 20;

function queueForPending(filter: PendingReviewFilter): PaymentsReviewQueueParam {
  return filter === 'NEEDS_UPDATE' ? 'NEEDS_UPDATE' : 'SUBMITTED';
}

function queueForHistory(filter: HistoryReviewFilter): PaymentsReviewQueueParam {
  return filter === 'REJECTED' ? 'REJECTED' : 'PAID';
}

function paymentMatchesReviewQueue(
  status: SpacePaymentResponse['paymentStatus'],
  queue: PaymentsReviewQueueParam,
): boolean {
  switch (queue) {
    case 'SUBMITTED':
      return status === 'UNDER_REVIEW' || status === 'PROOF_UPLOADED';
    case 'NEEDS_UPDATE':
      return status === 'UPDATE_REQUESTED';
    case 'PAID':
      return status === 'PAID';
    case 'REJECTED':
      return status === 'REJECTED';
    case 'PENDING_REVIEW':
      return (
        status === 'UNDER_REVIEW' ||
        status === 'PROOF_UPLOADED' ||
        status === 'UPDATE_REQUESTED'
      );
    case 'HISTORY':
      return status === 'PAID' || status === 'REJECTED';
    default:
      return true;
  }
}

/** Expected status after a successful review action (when response status is briefly stale). */
function expectedStatusAfterAction(
  action: PaymentReviewAction,
): SpacePaymentResponse['paymentStatus'] {
  switch (action) {
    case 'APPROVE':
      return 'PAID';
    case 'REJECT':
      return 'REJECTED';
    case 'REQUEST_UPDATE':
      return 'UPDATE_REQUESTED';
    default:
      return 'UNDER_REVIEW';
  }
}

/**
 * Paginated Pending Review or History cards. Loads only when enabled.
 * After Approve / Reject / Needs Update, the list is patched from the review API
 * response — callers should not soft-refetch the list immediately (race with BE).
 */
export function usePaymentsReviewList(
  spaceId: UUID,
  month: string,
  section: 'pendingReview' | 'history',
  enabled: boolean,
) {
  const [payments, setPayments] = useState<SpacePaymentResponse[]>([]);
  const [pendingFilter, setPendingFilter] = useState<PendingReviewFilter>('SUBMITTED');
  const [historyFilter, setHistoryFilter] = useState<HistoryReviewFilter>('PAID');
  const [page, setPage] = useState(0);
  const [totalElements, setTotalElements] = useState(0);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [refreshError, setRefreshError] = useState<string | null>(null);
  const [reviewingId, setReviewingId] = useState<string | null>(null);
  const hasDataRef = useRef(false);
  /** IDs removed locally after a successful review until a later refetch confirms. */
  const suppressedIdsRef = useRef(new Set<string>());
  const guard = useMemo(() => createRequestGuard(), []);

  const queue: PaymentsReviewQueueParam =
    section === 'history' ? queueForHistory(historyFilter) : queueForPending(pendingFilter);

  const applyReviewToList = useCallback(
    (paymentId: UUID, action: PaymentReviewAction, updated: SpacePaymentResponse) => {
      const status = updated.paymentStatus || expectedStatusAfterAction(action);
      const patched: SpacePaymentResponse = {
        ...updated,
        paymentStatus: status,
      };

      if (paymentMatchesReviewQueue(status, queue)) {
        setPayments(prev => prev.map(p => (p.paymentId === paymentId ? patched : p)));
        return;
      }

      suppressedIdsRef.current.add(paymentId);
      setPayments(prev => prev.filter(p => p.paymentId !== paymentId));
      setTotalElements(prev => Math.max(0, prev - 1));
    },
    [queue],
  );

  const load = useCallback(
    async (pageIndex: number, options?: { append?: boolean }) => {
      if (!enabled) {
        return;
      }
      const hasData = hasDataRef.current;
      const requestId = guard.next();
      if (hasData && !options?.append) {
        setRefreshing(true);
        setRefreshError(null);
      } else if (!hasData) {
        setLoading(true);
        setError(null);
      }

      try {
        const fetcher =
          section === 'history' ? paymentsApi.getPaymentsHistory : paymentsApi.getPaymentsReview;
        const response = await fetcher(spaceId, {
          month,
          queue,
          page: pageIndex,
          size: PAGE_SIZE,
        });
        if (!guard.isCurrent(requestId)) {
          return;
        }
        const raw = response.page.content ?? [];
        const content = raw.filter(p => !suppressedIdsRef.current.has(p.paymentId));
        const staleSuppressed = [...suppressedIdsRef.current].filter(id =>
          raw.some(p => p.paymentId === id),
        ).length;
        if (!options?.append) {
          for (const id of [...suppressedIdsRef.current]) {
            if (!raw.some(p => p.paymentId === id)) {
              suppressedIdsRef.current.delete(id);
            }
          }
        }
        hasDataRef.current = true;
        setPayments(prev => (options?.append ? [...prev, ...content] : content));
        setPage(response.page.page);
        setTotalElements(Math.max(0, response.page.totalElements - staleSuppressed));
        setError(null);
        setRefreshError(null);
      } catch {
        if (!guard.isCurrent(requestId)) {
          return;
        }
        if (hasData) {
          setRefreshError('paymentCollection.errors.loadReview');
        } else {
          setError('paymentCollection.errors.loadReview');
        }
      } finally {
        if (guard.isCurrent(requestId)) {
          setLoading(false);
          setRefreshing(false);
        }
      }
    },
    [enabled, guard, month, queue, section, spaceId],
  );

  // Reset suppression only when the queue context changes — not on every load identity change.
  useEffect(() => {
    suppressedIdsRef.current.clear();
  }, [enabled, month, queue, section]);

  useEffect(() => {
    if (!enabled) {
      return;
    }
    hasDataRef.current = false;
    setPayments([]);
    setPage(0);
    void load(0);
  }, [enabled, load, month, queue, section]);

  const reload = useCallback(async () => {
    await load(0);
  }, [load]);

  const loadMore = useCallback(async () => {
    if (payments.length >= totalElements) {
      return;
    }
    await load(page + 1, { append: true });
  }, [load, page, payments.length, totalElements]);

  const review = useCallback(
    async (
      paymentId: UUID,
      action: PaymentReviewAction,
      remarks?: string,
      rejectionCode?: PaymentRejectionReason,
    ) => {
      setReviewingId(paymentId);
      try {
        const updated = await paymentsApi.reviewPayment(spaceId, paymentId, {
          action,
          remarks,
          rejectionCode,
        });
        applyReviewToList(paymentId, action, updated);
        return updated;
      } finally {
        setReviewingId(null);
      }
    },
    [applyReviewToList, spaceId],
  );

  return {
    payments,
    pendingFilter,
    setPendingFilter,
    historyFilter,
    setHistoryFilter,
    loading: loading && payments.length === 0,
    refreshing,
    error: payments.length === 0 ? error : null,
    refreshError,
    serviceUnavailable: false,
    reload,
    loadMore,
    hasMore: payments.length < totalElements,
    review,
    reviewingId,
    queue: section === 'history' ? ('HISTORY' as const) : ('PENDING' as const),
    allPayments: payments,
    submittedCount: 0,
    changesRequestedCount: 0,
    pendingReviewCount: 0,
    paidCount: 0,
    rejectedCount: 0,
    historyCount: 0,
  };
}
