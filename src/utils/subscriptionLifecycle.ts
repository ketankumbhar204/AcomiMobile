import type { MemberMealBalance } from '../api/types';

export type SubscriptionLifecycleStatus =
  | 'none'
  | 'active'
  | 'expiring_soon'
  | 'expired'
  | 'ended';

export type SubscriptionFlowAction = 'create' | 'add';

const EXPIRING_SOON_DAYS = 7;

export function resolveSubscriptionValidTill(subscription: MemberMealBalance | null): string | null {
  if (!subscription) {
    return null;
  }
  if (subscription.validTill) {
    return subscription.validTill.slice(0, 10);
  }
  if (!subscription.lastPurchaseAt) {
    return null;
  }
  const start = new Date(subscription.lastPurchaseAt);
  const end = new Date(start.getFullYear(), start.getMonth() + 1, 0);
  return end.toISOString().slice(0, 10);
}

function endOfDayMs(isoDate: string): number {
  const date = new Date(isoDate);
  date.setHours(23, 59, 59, 999);
  return date.getTime();
}

export function getSubscriptionLifecycleStatus(
  subscription: MemberMealBalance | null,
): SubscriptionLifecycleStatus {
  if (subscription?.endedAt) {
    return 'ended';
  }
  if (!subscription?.lastPurchaseAt) {
    return 'none';
  }
  const validTill = resolveSubscriptionValidTill(subscription);
  if (!validTill) {
    return 'active';
  }
  const now = Date.now();
  const expiryMs = endOfDayMs(validTill);
  if (expiryMs < now) {
    return 'expired';
  }
  const daysLeft = (expiryMs - now) / (1000 * 60 * 60 * 24);
  if (daysLeft <= EXPIRING_SOON_DAYS) {
    return 'expiring_soon';
  }
  return 'active';
}

export function shouldOpenSubscriptionSetupDrawer(
  balance: MemberMealBalance | null,
): boolean {
  const status = getSubscriptionLifecycleStatus(balance);
  return status === 'none' || status === 'ended' || status === 'expired';
}

export function resolveSubscriptionFlowAction(
  subscription: MemberMealBalance | null,
): SubscriptionFlowAction {
  const status = getSubscriptionLifecycleStatus(subscription);
  if (status === 'none' || status === 'ended') {
    return 'create';
  }
  return 'add';
}

export function resolveTotalAmountPaid(subscription: MemberMealBalance | null): number | null {
  if (!subscription) {
    return null;
  }
  return subscription.currentAmountPaid ?? subscription.lastPurchasePaidAmount ?? null;
}

export function resolveMealsRemaining(subscription: MemberMealBalance | null): number | null {
  if (!subscription) {
    return null;
  }
  return subscription.mealsRemaining ?? subscription.balance ?? null;
}

export function defaultSubscriptionValidTillIso(reference = new Date()): string {
  const end = new Date(reference.getFullYear(), reference.getMonth() + 1, 0);
  return end.toISOString().slice(0, 10);
}

/** Default valid-till for a renewal cycle (same calendar-month end rule as create). */
export function defaultRenewalValidTillIso(reference = new Date()): string {
  return defaultSubscriptionValidTillIso(reference);
}

export function parseValidTillInput(value: string): string | null {
  const trimmed = value.trim();
  if (!trimmed) {
    return null;
  }
  if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
    return trimmed;
  }
  const parsed = new Date(trimmed);
  if (Number.isNaN(parsed.getTime())) {
    return null;
  }
  return parsed.toISOString().slice(0, 10);
}

export function formatSubscriptionDate(
  value: string | null | undefined,
  locale: string,
): string {
  if (!value) {
    return '—';
  }
  return new Date(value).toLocaleDateString(locale, {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}
