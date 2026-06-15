import type { MemberMealParticipationSummary } from '../api/types';

export function isReceivingMeals(
  participation?: MemberMealParticipationSummary | null,
): boolean {
  return participation?.status === 'ACTIVE';
}

export function shouldCreateMealParticipationFromContract(contract?: {
  foodEnabled?: boolean;
  foodIncludedInRent?: boolean;
}): boolean {
  return Boolean(contract?.foodEnabled || contract?.foodIncludedInRent);
}
