import {
  resolvePendingActionsCardState,
  resolvePendingActionsCount,
} from '../pendingActionsCardState';

describe('resolvePendingActionsCount', () => {
  it('uses the live pending-actions total once the query has a summary', () => {
    expect(
      resolvePendingActionsCount({
        liveCount: 4,
        liveSettled: true,
        liveError: false,
        fallbackCount: 0,
      }),
    ).toBe(4);
  });

  it('keeps a positive dashboard summary visible while the live query is still loading', () => {
    expect(
      resolvePendingActionsCount({
        liveCount: null,
        liveSettled: false,
        liveError: false,
        fallbackCount: 3,
      }),
    ).toBe(3);
  });

  it('does not treat an unresolved request as zero actions', () => {
    expect(
      resolvePendingActionsCount({
        liveCount: null,
        liveSettled: false,
        liveError: false,
        fallbackCount: 0,
      }),
    ).toBeNull();
  });

  it('returns zero only after a successful empty result', () => {
    expect(
      resolvePendingActionsCount({
        liveCount: 0,
        liveSettled: true,
        liveError: false,
        fallbackCount: 2,
      }),
    ).toBe(0);
  });
});

describe('resolvePendingActionsCardState', () => {
  it('shows the section when actions exist', () => {
    expect(resolvePendingActionsCardState({ error: false, totalCount: 2 })).toBe('ready');
  });

  it('shows a loading section until the count is known', () => {
    expect(resolvePendingActionsCardState({ error: false, totalCount: null })).toBe('loading');
  });

  it('shows an error section when the request fails before a count exists', () => {
    expect(resolvePendingActionsCardState({ error: true, totalCount: null })).toBe('error');
  });

  it('hides the section only after a successful zero', () => {
    expect(resolvePendingActionsCardState({ error: false, totalCount: 0 })).toBe('hidden');
  });

  it('keeps the section visible when a refresh fails with no actions to show', () => {
    expect(resolvePendingActionsCardState({ error: true, totalCount: 0 })).toBe('error');
  });

  it('does not hide a known count while a later refresh fails', () => {
    expect(resolvePendingActionsCardState({ error: true, totalCount: 5 })).toBe('ready');
  });
});
