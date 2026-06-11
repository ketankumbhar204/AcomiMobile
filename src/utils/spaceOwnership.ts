import type { Space, UUID } from '../api/types';

export function isSpaceOwner(
  space: Space | null | undefined,
  userId: UUID | null | undefined,
): boolean {
  if (!space || !userId) {
    return false;
  }

  if (space.ownerId && space.ownerId === userId) {
    return true;
  }

  return space.role === 'OWNER';
}
