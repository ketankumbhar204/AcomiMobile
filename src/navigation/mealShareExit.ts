import { StackActions } from '@react-navigation/native';

export type MealShareExitAction = { type: string };

/** Hardware and header Back are ignored while Save is still talking to the server. */
export function shouldBlockMealShareExit(
  action: MealShareExitAction,
  sharing: boolean,
): boolean {
  if (!sharing) {
    return false;
  }
  return action.type === 'GO_BACK' || action.type === 'POP' || action.type === 'POP_TO_TOP';
}

/**
 * After a successful share, pop to Meals when it is already underneath.
 * Otherwise replace the finished Share route. StackActions.popTo does both
 * without resetting unrelated history such as the space tabs.
 */
export function mealShareExitAction(params: { spaceId: string; menuDate: string }) {
  return StackActions.popTo('MenuPlanning', params, { merge: true });
}
