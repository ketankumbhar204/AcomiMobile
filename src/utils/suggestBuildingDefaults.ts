/**
 * Suggest default building name/code for create flows.
 * Most single-building properties reuse the space name.
 */
export function suggestBuildingName(spaceName: string | null | undefined): string {
  return (spaceName ?? '').trim();
}

/** Next code like "BLD 1", "BLD 2" based on how many buildings already exist. */
export function suggestBuildingCode(existingBuildingCount: number): string {
  const next = Math.max(1, Math.floor(existingBuildingCount) + 1);
  return `BLD ${next}`;
}

export function isDuplicateSpaceName(
  candidate: string,
  spaces: Array<{ spaceId?: string; spaceName?: string; name?: string; id?: string }>,
  options?: { excludeSpaceId?: string },
): boolean {
  const normalized = candidate.trim().toLowerCase();
  if (!normalized) {
    return false;
  }
  return spaces.some(space => {
    const id = space.spaceId ?? space.id;
    if (options?.excludeSpaceId && id === options.excludeSpaceId) {
      return false;
    }
    const name = (space.spaceName ?? space.name ?? '').trim().toLowerCase();
    return name === normalized;
  });
}
