import type { MemberHistoryAction, MemberHistoryResponse } from '../api/types';

export const HISTORY_ACTION_LABEL_KEYS: Record<MemberHistoryAction, string> = {
  STATUS_CHANGED: 'membership.history.actions.statusChanged',
  DEPOSIT_UPDATED: 'membership.history.actions.depositUpdated',
  EMERGENCY_CONTACT_UPDATED: 'membership.history.actions.emergencyContactUpdated',
};

export function formatHistoryValue(entry: MemberHistoryResponse): string {
  if (entry.action === 'STATUS_CHANGED') {
    return `${entry.oldValue ?? '—'} → ${entry.newValue ?? '—'}`;
  }
  return entry.newValue ?? entry.oldValue ?? '—';
}
