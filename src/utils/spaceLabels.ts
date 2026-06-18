import type { MySpaceResponse } from '../api/types';

export function formatSpaceDisplayName(space: MySpaceResponse | string): string {
  if (typeof space === 'string') {
    return space;
  }

  const address = space.address?.trim();
  if (address) {
    return `${space.spaceName} · ${address}`;
  }
  return space.spaceName;
}
