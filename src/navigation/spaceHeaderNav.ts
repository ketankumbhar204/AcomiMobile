/**
 * Space dashboard header actions.
 * Home always leaves the space for the account landing (Member tabs → Home).
 * Back returns to the previous screen when one exists.
 */
export type SpaceHeaderDestination = 'previous' | 'account-home';

export function spaceDashboardHeaderDestination(
  action: 'back' | 'home',
  canGoBack: boolean,
): SpaceHeaderDestination {
  if (action === 'home') {
    return 'account-home';
  }
  return canGoBack ? 'previous' : 'account-home';
}

/** Name stays on its own line. Location is shown only when the space has one. */
export function spaceHeaderLines(
  name: string,
  address?: string | null,
): { title: string; location: string | null } {
  const title = name.trim();
  const location = address?.trim() ?? '';
  return { title, location: location.length > 0 ? location : null };
}
