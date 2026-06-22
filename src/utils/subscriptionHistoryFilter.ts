import type { MemberMealBalanceActivityEvent } from '../api/types';

export type SubscriptionEventTypeFilter = 'created' | 'added_meals' | 'ended';

export type SubscriptionMonthFilter = 'current' | 'previous';

export const SUBSCRIPTION_EVENT_TYPES: SubscriptionEventTypeFilter[] = [
  'created',
  'added_meals',
  'ended',
];

function monthKeyFromDate(iso: string): string {
  const date = new Date(iso);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
}

function currentMonthKey(reference = new Date()): string {
  return monthKeyFromDate(reference.toISOString());
}

function previousMonthKey(reference = new Date()): string {
  const date = new Date(reference.getFullYear(), reference.getMonth() - 1, 1);
  return monthKeyFromDate(date.toISOString());
}

function matchesEventType(event: MemberMealBalanceActivityEvent): SubscriptionEventTypeFilter {
  if (event.eventType === 'ENDED' || event.subscriptionAction === 'ENDED') {
    return 'ended';
  }
  if (event.subscriptionAction === 'CREATED') {
    return 'created';
  }
  return 'added_meals';
}

export function filterSubscriptionHistoryEvents(
  events: MemberMealBalanceActivityEvent[],
  options: {
    eventTypes: Set<SubscriptionEventTypeFilter>;
    months: Set<SubscriptionMonthFilter>;
  },
): MemberMealBalanceActivityEvent[] {
  const current = currentMonthKey();
  const previous = previousMonthKey();

  return events.filter(event => {
    if (
      options.eventTypes.size > 0 &&
      options.eventTypes.size < SUBSCRIPTION_EVENT_TYPES.length &&
      !options.eventTypes.has(matchesEventType(event))
    ) {
      return false;
    }

    if (options.months.size === 0 || options.months.size >= 2) {
      return true;
    }

    const eventMonth = monthKeyFromDate(event.createdAt);
    if (options.months.has('current') && eventMonth === current) {
      return true;
    }
    if (options.months.has('previous') && eventMonth === previous) {
      return true;
    }
    return false;
  });
}

export function countSubscriptionHistoryFilters(
  eventTypes: Set<SubscriptionEventTypeFilter>,
  months: Set<SubscriptionMonthFilter>,
): number {
  let count = 0;
  if (eventTypes.size > 0 && eventTypes.size < SUBSCRIPTION_EVENT_TYPES.length) {
    count += 1;
  }
  if (months.size === 1) {
    count += 1;
  }
  return count;
}
