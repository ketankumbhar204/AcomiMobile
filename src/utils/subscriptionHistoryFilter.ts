import type { MemberMealBalanceActivityEvent } from '../api/types';
import {
  compareByCreatedAt,
  CREATED_DATE_SORT_OPTIONS,
  DEFAULT_CREATED_DATE_SORT,
  type CreatedDateSortOption,
} from './listSort';

export type SubscriptionEventTypeFilter = 'created' | 'added_meals' | 'ended';

export type SubscriptionMonthFilter = 'current' | 'previous';

export type SubscriptionHistorySortOption = CreatedDateSortOption;

export const SUBSCRIPTION_HISTORY_SORT_OPTIONS = CREATED_DATE_SORT_OPTIONS;

export const DEFAULT_SUBSCRIPTION_HISTORY_SORT = DEFAULT_CREATED_DATE_SORT;

export const SUBSCRIPTION_EVENT_TYPES: SubscriptionEventTypeFilter[] = [
  'created',
  'added_meals',
  'ended',
];

export const SUBSCRIPTION_MONTH_FILTERS: SubscriptionMonthFilter[] = ['current', 'previous'];

export const SUBSCRIPTION_HISTORY_FILTER_OPTION_COUNT =
  SUBSCRIPTION_EVENT_TYPES.length +
  SUBSCRIPTION_MONTH_FILTERS.length +
  SUBSCRIPTION_HISTORY_SORT_OPTIONS.length;

export type SubscriptionHistoryFilterState = {
  eventTypes: Set<SubscriptionEventTypeFilter>;
  months: Set<SubscriptionMonthFilter>;
  sort: SubscriptionHistorySortOption;
};

export function defaultSubscriptionHistoryFilters(): SubscriptionHistoryFilterState {
  return {
    eventTypes: new Set(),
    months: new Set(),
    sort: DEFAULT_SUBSCRIPTION_HISTORY_SORT,
  };
}

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
    sort?: SubscriptionHistorySortOption;
  },
): MemberMealBalanceActivityEvent[] {
  const current = currentMonthKey();
  const previous = previousMonthKey();
  const sort = options.sort ?? DEFAULT_SUBSCRIPTION_HISTORY_SORT;

  const filtered = events.filter(event => {
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

  return [...filtered].sort((a, b) => compareByCreatedAt(a.createdAt, b.createdAt, sort));
}

export function countSubscriptionHistoryFilters(
  filters: SubscriptionHistoryFilterState,
): number {
  let count = 0;
  if (filters.eventTypes.size > 0 && filters.eventTypes.size < SUBSCRIPTION_EVENT_TYPES.length) {
    count += 1;
  }
  if (filters.months.size === 1) {
    count += 1;
  }
  if (filters.sort !== DEFAULT_SUBSCRIPTION_HISTORY_SORT) {
    count += 1;
  }
  return count;
}
