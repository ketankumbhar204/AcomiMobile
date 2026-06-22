import type { MealBillingType, MemberDetailsResponse } from '../api/types';
import type { MemberMealBillingSelection } from '../components/member/MemberMealBillingTypeSection';

type MemberBillingFields = Pick<
  MemberDetailsResponse,
  'mealBillingType' | 'effectiveMealBillingType'
>;

export function resolveMemberEffectiveMealBilling(
  member: MemberBillingFields,
  spaceDefault: MealBillingType = 'PAY_PER_MEAL',
): MealBillingType {
  return member.effectiveMealBillingType ?? member.mealBillingType ?? spaceDefault;
}

export function formatMemberMealBillingProfileValue(
  member: MemberBillingFields,
  t: (key: string, options?: Record<string, unknown>) => string,
  spaceDefault: MealBillingType = 'PAY_PER_MEAL',
): string {
  const effective = resolveMemberEffectiveMealBilling(member, spaceDefault);
  const typeLabel = t(`spaces.mealBilling.types.${effective}.label`);
  if (member.mealBillingType == null) {
    return t('members.mealBilling.profileValueDefault', { type: typeLabel });
  }
  return t('members.mealBilling.profileValueOverride', { type: typeLabel });
}

export function resolveEffectiveMemberMealBilling(
  selection: MemberMealBillingSelection,
  spaceDefault: MealBillingType,
): MealBillingType {
  return selection === 'DEFAULT' ? spaceDefault : selection;
}

export function isSubscriptionBilling(
  selection: MemberMealBillingSelection,
  spaceDefault: MealBillingType,
): boolean {
  return resolveEffectiveMemberMealBilling(selection, spaceDefault) === 'PREPAID_BALANCE';
}

export function buildSubscriptionPurchasePayload(
  mealQty: string,
  subscriptionPrice: string,
  unit: 'MEALS' | 'CURRENCY',
): { amount: number; paidAmount: number; remarks?: string } | null {
  const qty = Number(mealQty.trim());
  const price = Number(subscriptionPrice.trim());

  if (unit === 'CURRENCY') {
    if (!Number.isFinite(price) || price <= 0) {
      return null;
    }
    return { amount: price, paidAmount: price };
  }

  if (!Number.isFinite(qty) || qty <= 0) {
    return null;
  }
  if (!Number.isFinite(price) || price <= 0) {
    return null;
  }

  return {
    amount: qty,
    paidAmount: price,
    remarks: undefined,
  };
}
