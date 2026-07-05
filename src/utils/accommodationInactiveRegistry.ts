export type AccommodationInactiveEntityType =
  | 'building'
  | 'floor'
  | 'unit'
  | 'room'
  | 'bed';

type InactiveEntry = {
  entityType: AccommodationInactiveEntityType;
  entityId: string;
  scopeKey: string;
  snapshot: Record<string, unknown>;
};

const inactiveByScope = new Map<string, Map<string, InactiveEntry>>();

function scopeMap(scopeKey: string): Map<string, InactiveEntry> {
  let map = inactiveByScope.get(scopeKey);
  if (!map) {
    map = new Map();
    inactiveByScope.set(scopeKey, map);
  }
  return map;
}

export function accommodationInactiveScopeKey(
  entityType: AccommodationInactiveEntityType,
  context: {
    spaceId: string;
    buildingId?: string;
    parentType?: 'floor' | 'unit';
    parentId?: string;
    roomId?: string;
  },
): string {
  switch (entityType) {
    case 'building':
      return `building:${context.spaceId}`;
    case 'floor':
    case 'unit':
      return `${entityType}:${context.spaceId}:${context.buildingId ?? ''}`;
    case 'room':
      return `room:${context.spaceId}:${context.parentType ?? ''}:${context.parentId ?? ''}`;
    case 'bed':
      return `bed:${context.spaceId}:${context.roomId ?? ''}`;
    default:
      return `${entityType}:${context.spaceId}`;
  }
}

export function registerInactiveEntity(
  scopeKey: string,
  entityType: AccommodationInactiveEntityType,
  entityId: string,
  snapshot: Record<string, unknown>,
): void {
  scopeMap(scopeKey).set(entityId, { entityType, entityId, scopeKey, snapshot });
}

export function unregisterInactiveEntity(scopeKey: string, entityId: string): void {
  scopeMap(scopeKey).delete(entityId);
}

export function getInactiveEntitiesForScope<T extends Record<string, unknown>>(
  scopeKey: string,
): T[] {
  const map = inactiveByScope.get(scopeKey);
  if (!map) {
    return [];
  }
  return Array.from(map.values()).map(entry => entry.snapshot as T);
}

export function mergeInactiveListItems<T extends { active?: boolean }>(
  itemsFromApi: T[],
  scopeKey: string,
  getId: (item: T) => string,
): T[] {
  const inactiveSnapshots = getInactiveEntitiesForScope<T>(scopeKey);
  const merged = new Map<string, T>();

  for (const snapshot of inactiveSnapshots) {
    merged.set(getId(snapshot), { ...snapshot, active: false });
  }

  for (const item of itemsFromApi) {
    const id = getId(item);
    if (item.active === false) {
      merged.set(id, item);
      continue;
    }
    merged.set(id, item.active == null ? item : { ...item, active: true });
  }

  return Array.from(merged.values());
}
