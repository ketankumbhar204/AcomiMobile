import { memberApi } from '../api/memberApi';
import { mySpacesApi } from '../api/mySpacesApi';
import type { DefaultSpaceResponse, MyInvitationResponse, MySpaceResponse, UUID } from '../api/types';

export type StartupSpaceResolution =
  | { kind: 'dashboard'; spaceId: UUID; space: DefaultSpaceResponse }
  | { kind: 'picker'; spaces: MySpaceResponse[] }
  | { kind: 'invitations'; invitations: MyInvitationResponse[] }
  | { kind: 'onboardingChoice' };

/**
 * Resolves where to send the user after auth based on default space and membership count.
 *
 * 1. GET /spaces/default → dashboard
 * 2. Else GET /spaces/my:
 *    - 0 spaces → GET /invitations/my; if pending → accept-invitations screen
 *    - 0 spaces, no invites → onboarding choice (manage vs join)
 *    - 1 → PUT /spaces/{id}/default, then dashboard
 *    - 2+ → space picker
 */
export async function resolveStartupSpace(): Promise<StartupSpaceResolution> {
  const defaultSpace = await mySpacesApi.getDefaultSpace();
  if (defaultSpace) {
    return {
      kind: 'dashboard',
      spaceId: defaultSpace.spaceId,
      space: defaultSpace,
    };
  }

  const spaces = await mySpacesApi.getMySpaces();
  if (spaces.length === 0) {
    const invitations = await memberApi.getMyInvitations().catch(() => []);
    if (invitations.length > 0) {
      return { kind: 'invitations', invitations };
    }
    return { kind: 'onboardingChoice' };
  }

  if (spaces.length === 1) {
    const only = spaces[0];
    let space: DefaultSpaceResponse = {
      spaceId: only.spaceId,
      spaceName: only.spaceName,
      spaceType: only.spaceType,
    };

    try {
      const result = await mySpacesApi.setDefaultSpace(only.spaceId);
      space = {
        spaceId: result.spaceId,
        spaceName: result.spaceName,
        spaceType: only.spaceType,
      };
    } catch {
      // Open dashboard even if default persistence fails; retry on next launch.
    }

    return { kind: 'dashboard', spaceId: space.spaceId, space };
  }

  return { kind: 'picker', spaces };
}
