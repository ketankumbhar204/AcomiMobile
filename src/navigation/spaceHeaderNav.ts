/**
 * Space dashboard header actions.
 * Home (Dashboard tab only) leaves the space for the account landing.
 * Header back returns to the previous stack screen. It does not jump to the
 * Dashboard tab. Android hardware back stays on the navigator's own history.
 */
export type SpaceHeaderDestination = 'previous' | 'account-home';

export type SpaceHeaderLeading = 'home' | 'back';

/** Only the main space Dashboard tab shows the home icon. */
export const SPACE_DASHBOARD_TAB_ROUTE = 'Dashboard';

/**
 * Tabs that share the space header. Role and space type hide some of these;
 * any tab other than Dashboard still uses the back arrow.
 */
export const SPACE_LEVEL_TAB_ROUTES = [
  'Dashboard',
  'Members',
  'Accommodation',
  'Meals',
  'Payments',
  'Complaints',
] as const;

const SPACE_LEVEL_TAB_ROUTE_SET = new Set<string>(SPACE_LEVEL_TAB_ROUTES);

export function spaceDashboardHeaderDestination(
  action: 'back' | 'home',
  canGoBack: boolean,
): SpaceHeaderDestination {
  if (action === 'home') {
    return 'account-home';
  }
  return canGoBack ? 'previous' : 'account-home';
}

/** Home on the Dashboard tab. Back on every other space tab. */
export function spaceHeaderLeadingForRoute(
  routeName: string | undefined,
): SpaceHeaderLeading {
  return routeName === SPACE_DASHBOARD_TAB_ROUTE ? 'home' : 'back';
}

export type NavigationStateLike = {
  type?: string;
  index?: number;
  routes?: ReadonlyArray<{
    name: string;
    state?: NavigationStateLike;
  }>;
};

/**
 * Active space tab from navigator state.
 * Reads the focused route of the space tab navigator, including when that
 * navigator is nested under the main stack.
 */
export function focusedSpaceTabRouteName(
  state: NavigationStateLike | undefined,
): string | undefined {
  if (!state?.routes?.length) {
    return undefined;
  }

  const index = typeof state.index === 'number' ? state.index : 0;
  const route = state.routes[index];
  if (!route) {
    return undefined;
  }

  if (state.routes.some(item => SPACE_LEVEL_TAB_ROUTE_SET.has(item.name))) {
    return route.name;
  }

  return focusedSpaceTabRouteName(route.state);
}

export type SpaceTabBackAncestor = {
  type?: string;
  index?: number;
};

/**
 * Header back pops the nearest navigator that has a previous screen.
 * Tab navigators are skipped: their default backBehavior is firstRoute,
 * which would switch to Dashboard instead of leaving the space flow.
 * Null means this tab is a root with no previous stack screen.
 */
export function spaceTabHeaderBackAncestorIndex(
  ancestors: readonly SpaceTabBackAncestor[],
): number | null {
  for (let i = 0; i < ancestors.length; i += 1) {
    const ancestor = ancestors[i];
    if (ancestor.type === 'tab') {
      continue;
    }
    if ((ancestor.index ?? 0) > 0) {
      return i;
    }
  }
  return null;
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
