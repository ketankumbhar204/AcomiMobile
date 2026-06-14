import { useMemo } from 'react';
import type { MembershipRole, SpacePermissionsResponse, SpaceType, UUID } from '../api/types';
import { useSpaceStore } from '../store/spaceStore';
import { findMySpaceEntry, resolveSpacePermissions } from '../utils/spacePermissions';

export type SpacePermissionsContext = SpacePermissionsResponse & {
  membershipRole: MembershipRole | undefined;
  spaceType: SpaceType | undefined;
  spaceId: UUID | undefined;
};

export function useSpacePermissions(spaceId?: UUID | null): SpacePermissionsContext {
  const mySpaces = useSpaceStore(state => state.mySpaces);

  return useMemo(() => {
    const entry = findMySpaceEntry(mySpaces, spaceId ?? undefined);
    const permissions = resolveSpacePermissions(entry);

    return {
      ...permissions,
      membershipRole: entry?.membershipRole,
      spaceType: entry?.spaceType,
      spaceId: spaceId ?? undefined,
    };
  }, [mySpaces, spaceId]);
}
