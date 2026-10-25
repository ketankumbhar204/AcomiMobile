import type { MySpaceResponse } from '../../api/types';

/** Home space list: default first, then spaces with attention, then name. */
export function sortSpacesForHome(
  spaces: MySpaceResponse[],
  attentionCount: (space: MySpaceResponse) => number,
): MySpaceResponse[] {
  return [...spaces].sort((a, b) => {
    if (a.isDefault !== b.isDefault) {
      return a.isDefault ? -1 : 1;
    }
    const pendingA = attentionCount(a);
    const pendingB = attentionCount(b);
    if (pendingA > 0 !== pendingB > 0) {
      return pendingA > 0 ? -1 : 1;
    }
    if (pendingA !== pendingB) {
      return pendingB - pendingA;
    }
    return a.spaceName.localeCompare(b.spaceName);
  });
}
