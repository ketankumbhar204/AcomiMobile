export type ProfileCompletionExitRoute = 'MemberTabs' | 'Profile';

/**
 * After onboarding is saved, Profile is the focused screen and home sits
 * underneath it. Complete Profile is not part of this stack, so Back cannot
 * reopen the finished form.
 */
export function profileCompletionExitStack(): {
  index: number;
  routes: Array<{ name: ProfileCompletionExitRoute }>;
} {
  return {
    index: 1,
    routes: [{ name: 'MemberTabs' }, { name: 'Profile' }],
  };
}

export function backTargetAfterProfileCompletion(
  stack: { index: number; routes: Array<{ name: string }> },
): string | null {
  if (stack.index <= 0) {
    return null;
  }
  return stack.routes[stack.index - 1]?.name ?? null;
}
