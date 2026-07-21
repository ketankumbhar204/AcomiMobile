import {
  buildSpaceAttentionSummary,
  selectVisibleAttentionGroups,
} from '../spaceAttentionSummary';
import type { PendingActionGroup, PendingActionsSummary } from '../../api/types';

function group(
  actionType: PendingActionGroup['actionType'],
  title: string,
  count = 1,
  message?: string,
): PendingActionGroup {
  return {
    actionType,
    title,
    priority: 'MEDIUM',
    count,
    items: message ? ([{ message }] as never) : [],
  };
}

describe('selectVisibleAttentionGroups', () => {
  it('keeps meal visible alongside a higher-priority payment', () => {
    const visible = selectVisibleAttentionGroups([
      group('MEAL_POLL_PUBLISHED', 'New meal shared'),
      group('PAYMENT_UPDATE_REQUESTED', 'Payment update required'),
      group('COMPLAINT_COMMENTED', 'Complaint updated'),
    ]);

    expect(visible.map(g => g.actionType)).toEqual([
      'PAYMENT_UPDATE_REQUESTED',
      'MEAL_POLL_PUBLISHED',
    ]);
  });

  it('falls back to next priority when no meal exists', () => {
    const visible = selectVisibleAttentionGroups([
      group('PAYMENT_UPDATE_REQUESTED', 'Payment update required'),
      group('TENANT_PROFILE_INCOMPLETE', 'Complete your profile'),
      group('COMPLAINT_COMMENTED', 'Complaint updated'),
    ]);

    expect(visible.map(g => g.actionType)).toEqual([
      'PAYMENT_UPDATE_REQUESTED',
      'TENANT_PROFILE_INCOMPLETE',
    ]);
  });

  it('dedupes duplicate action types', () => {
    const visible = selectVisibleAttentionGroups([
      group('MEAL_POLL_PUBLISHED', 'New meal shared'),
      group('MEAL_POLL_PUBLISHED', 'Another meal'),
      group('PAYMENT_OVERDUE', 'Payment overdue'),
    ]);

    expect(visible.map(g => g.actionType)).toEqual([
      'PAYMENT_OVERDUE',
      'MEAL_POLL_PUBLISHED',
    ]);
  });
});

describe('buildSpaceAttentionSummary', () => {
  it('returns up-to-date empty summary', () => {
    expect(buildSpaceAttentionSummary(null)).toEqual({
      totalCount: 0,
      items: [],
      primary: null,
      moreCount: 0,
    });
  });

  it('shows payment + meal and summarizes the rest', () => {
    const summary: PendingActionsSummary = {
      totalCount: 3,
      groups: [
        group('MEAL_POLL_PUBLISHED', 'New meal shared', 1, 'Respond before 8 PM'),
        group('PAYMENT_UPDATE_REQUESTED', 'Payment update required', 1, 'Update test'),
        group('COMPLAINT_COMMENTED', 'Complaint updated', 1),
      ],
    };

    const result = buildSpaceAttentionSummary(summary);
    expect(result.totalCount).toBe(3);
    expect(result.items.map(i => i.actionType)).toEqual([
      'PAYMENT_UPDATE_REQUESTED',
      'MEAL_POLL_PUBLISHED',
    ]);
    expect(result.primary?.actionType).toBe('PAYMENT_UPDATE_REQUESTED');
    expect(result.moreCount).toBe(1);
  });

  it('shows only two items when exactly two actions exist', () => {
    const summary: PendingActionsSummary = {
      totalCount: 2,
      groups: [
        group('MEAL_POLL_PUBLISHED', "Today's menu shared"),
        group('PAYMENT_UPDATE_REQUESTED', 'Payment update required'),
      ],
    };

    const result = buildSpaceAttentionSummary(summary);
    expect(result.items).toHaveLength(2);
    expect(result.moreCount).toBe(0);
  });
});
