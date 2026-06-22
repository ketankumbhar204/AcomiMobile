import type {
  MemberMealBalanceActivityEvent,
  MemberSubscriptionHistoryResponse,
  MemberSubscriptionLifetimeSummary,
} from '../api/types';

function isPurchaseEvent(event: MemberMealBalanceActivityEvent): boolean {
  return event.eventType === 'PURCHASE';
}

export function computeLifetimeSummaryFromEvents(
  events: MemberMealBalanceActivityEvent[],
): MemberSubscriptionLifetimeSummary {
  let totalMealsPurchased = 0;
  let totalAmountPaid = 0;

  for (const event of events) {
    if (!isPurchaseEvent(event)) {
      continue;
    }
    if (event.meals != null) {
      totalMealsPurchased += event.meals;
    }
    if (event.paidAmount != null) {
      totalAmountPaid += event.paidAmount;
    }
  }

  let runningBalance = 0;
  let totalMealsConsumed = 0;
  const chronological = [...events].sort(
    (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
  );
  for (const event of chronological) {
    if (event.eventType === 'PURCHASE' && event.meals != null) {
      runningBalance += event.meals;
    } else if (event.eventType === 'ENDED') {
      totalMealsConsumed += runningBalance;
      runningBalance = 0;
    }
  }
  if (runningBalance > 0) {
    const lastEvent = chronological[chronological.length - 1];
    const remaining =
      lastEvent?.balanceAfter != null ? Math.round(lastEvent.balanceAfter) : runningBalance;
    totalMealsConsumed += Math.max(runningBalance - remaining, 0);
  }

  return {
    totalMealsPurchased,
    totalMealsConsumed,
    totalAmountPaid,
    totalActivities: events.length,
  };
}

/** Supports both wrapped `{ summary, events }` and legacy bare event arrays. */
export function normalizeSubscriptionHistoryResponse(
  data: MemberSubscriptionHistoryResponse | MemberMealBalanceActivityEvent[] | null | undefined,
): MemberSubscriptionHistoryResponse {
  if (!data) {
    return {
      events: [],
      summary: {
        totalMealsPurchased: 0,
        totalMealsConsumed: 0,
        totalAmountPaid: 0,
        totalActivities: 0,
      },
    };
  }

  if (Array.isArray(data)) {
    const events = data;
    return {
      events,
      summary: computeLifetimeSummaryFromEvents(events),
    };
  }

  const events = Array.isArray(data.events) ? data.events : [];
  return {
    events,
    summary: data.summary ?? computeLifetimeSummaryFromEvents(events),
  };
}
