const failedKeys = new Set<string>();

function key(spaceId: string, menuDate: string): string {
  return `${spaceId}:${menuDate}`;
}

/** Remember a share attempt the backend did not confirm, for this date only. */
export function markDayShareFailed(spaceId: string, menuDate: string): void {
  failedKeys.add(key(spaceId, menuDate));
}

export function clearDayShareFailed(spaceId: string, menuDate: string): void {
  failedKeys.delete(key(spaceId, menuDate));
}

export function isDayShareFailed(spaceId: string, menuDate: string): boolean {
  return failedKeys.has(key(spaceId, menuDate));
}
