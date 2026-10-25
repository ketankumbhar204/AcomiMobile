export type PendingActionsCardState = 'hidden' | 'loading' | 'error' | 'ready';

/**
 * Dashboard Pending Actions visibility.
 * A missing or in-flight summary is not the same as zero actions.
 * A successful zero stays hidden — that is the existing mobile empty behavior.
 */
export function resolvePendingActionsCount(input: {
  /** Null until the pending-actions query has produced a summary. */
  liveCount: number | null;
  liveSettled: boolean;
  liveError: boolean;
  /** Owner dashboard summary, used only as a positive placeholder while the live query is in flight. */
  fallbackCount: number | null;
}): number | null {
  if (input.liveCount != null) {
    return input.liveCount;
  }
  if (input.fallbackCount != null && input.fallbackCount > 0) {
    return input.fallbackCount;
  }
  if (input.liveSettled && !input.liveError) {
    return input.fallbackCount ?? 0;
  }
  return null;
}

export function resolvePendingActionsCardState(input: {
  error: boolean;
  /** Null while the count is still unknown. Zero means the query resolved empty. */
  totalCount: number | null;
}): PendingActionsCardState {
  if (input.totalCount != null && input.totalCount > 0) {
    return 'ready';
  }
  if (input.error && input.totalCount == null) {
    return 'error';
  }
  if (input.totalCount == null) {
    return 'loading';
  }
  if (input.totalCount === 0 && input.error) {
    return 'error';
  }
  return 'hidden';
}
