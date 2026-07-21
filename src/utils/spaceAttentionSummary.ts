import type { NotificationType, PendingActionGroup, PendingActionsSummary } from '../api/types';

export type SpaceAttentionItem = {
  actionType: NotificationType;
  title: string;
  detail?: string | null;
  emoji: string;
};

export type SpaceAttentionSummary = {
  totalCount: number;
  /** Up to two highest-priority visible items (meal-aware). */
  items: SpaceAttentionItem[];
  /**
   * @deprecated Prefer `items[0]`. Kept for callers that still read primary.
   */
  primary: SpaceAttentionItem | null;
  /** Actionable items beyond the ones shown on the card. */
  moreCount: number;
};

const MAX_VISIBLE_ITEMS = 2;

/** Lower number = higher priority for customer/tenant cards. */
const TENANT_ATTENTION_PRIORITY: Partial<Record<NotificationType, number>> = {
  PAYMENT_UPDATE_REQUESTED: 10,
  PAYMENT_OVERDUE: 15,
  PAYMENT_NEEDS_UPDATE: 18,
  PAYMENT_REJECTED: 20,
  MEAL_POLL_PUBLISHED: 30,
  MEAL_POLL_REMINDER: 35,
  TENANT_PROFILE_INCOMPLETE: 40,
  MISSING_KYC_DOCUMENTS: 45,
  MISSING_ADDRESS_PROOF: 50,
  COMPLAINT_COMMENTED: 60,
  COMPLAINT_RESOLVED: 65,
  PENDING_INVITATION: 70,
  PAYMENT_APPROVED: 80,
  INVITATION_ACCEPTED: 90,
};

const ATTENTION_EMOJI: Partial<Record<NotificationType, string>> = {
  PAYMENT_UPDATE_REQUESTED: '💳',
  PAYMENT_OVERDUE: '💳',
  PAYMENT_NEEDS_UPDATE: '💳',
  PAYMENT_REJECTED: '💳',
  PAYMENT_APPROVED: '💳',
  MEAL_POLL_PUBLISHED: '🍽',
  MEAL_POLL_REMINDER: '⏰',
  TENANT_PROFILE_INCOMPLETE: '👤',
  MISSING_KYC_DOCUMENTS: '👤',
  MISSING_ADDRESS_PROOF: '👤',
  COMPLAINT_COMMENTED: '🛠',
  COMPLAINT_RESOLVED: '🛠',
  PENDING_INVITATION: '✉️',
};

const MEAL_ATTENTION_TYPES = new Set<NotificationType>([
  'MEAL_POLL_PUBLISHED',
  'MEAL_POLL_REMINDER',
]);

function priorityFor(type: NotificationType): number {
  return TENANT_ATTENTION_PRIORITY[type] ?? 500;
}

function emojiFor(type: NotificationType): string {
  return ATTENTION_EMOJI[type] ?? '🔔';
}

function isMealAttention(type: NotificationType): boolean {
  return MEAL_ATTENTION_TYPES.has(type);
}

function itemDetail(group: PendingActionGroup): string | null {
  const first = group.items?.[0];
  const message = first?.message?.trim();
  if (message) {
    return message;
  }
  const label = group.actionLabel?.trim();
  return label || null;
}

function toItem(group: PendingActionGroup): SpaceAttentionItem {
  return {
    actionType: group.actionType,
    title: group.title,
    detail: itemDetail(group),
    emoji: emojiFor(group.actionType),
  };
}

/** One row per action type; keep the highest-priority / first occurrence. */
function dedupeByActionType(groups: PendingActionGroup[]): PendingActionGroup[] {
  const seen = new Set<NotificationType>();
  const unique: PendingActionGroup[] = [];
  for (const group of groups) {
    if (seen.has(group.actionType)) {
      continue;
    }
    seen.add(group.actionType);
    unique.push(group);
  }
  return unique;
}

/**
 * Pick up to two groups: highest priority first, then either a meal action
 * (so time-sensitive meals are never fully hidden) or the next by priority.
 */
export function selectVisibleAttentionGroups(
  groups: PendingActionGroup[],
  maxVisible = MAX_VISIBLE_ITEMS,
): PendingActionGroup[] {
  if (groups.length === 0 || maxVisible <= 0) {
    return [];
  }

  const sorted = dedupeByActionType(groups).sort(
    (a, b) => priorityFor(a.actionType) - priorityFor(b.actionType),
  );

  if (sorted.length === 1 || maxVisible === 1) {
    return sorted.slice(0, 1);
  }

  const first = sorted[0];
  const remaining = sorted.slice(1);
  const mealInRemaining = remaining.find(group => isMealAttention(group.actionType));
  const second = mealInRemaining ?? remaining[0];
  return [first, second];
}

/**
 * Builds a compact attention summary for a customer/tenant My Spaces card.
 * Expects an already tenant-filtered PendingActionsSummary.
 */
export function buildSpaceAttentionSummary(
  summary: PendingActionsSummary | null | undefined,
): SpaceAttentionSummary {
  if (!summary || summary.totalCount <= 0 || summary.groups.length === 0) {
    return { totalCount: 0, items: [], primary: null, moreCount: 0 };
  }

  const visibleGroups = selectVisibleAttentionGroups(summary.groups);
  const items = visibleGroups.map(toItem);
  const moreCount = Math.max(0, summary.totalCount - items.length);

  return {
    totalCount: summary.totalCount,
    items,
    primary: items[0] ?? null,
    moreCount,
  };
}
