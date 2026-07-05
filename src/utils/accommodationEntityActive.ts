export function isAccommodationEntityActive(
  entity: { active?: boolean } | null | undefined,
): boolean {
  return entity?.active !== false;
}

export function countInactiveEntities<T extends { active?: boolean }>(items: T[]): number {
  return items.filter(item => !isAccommodationEntityActive(item)).length;
}

export function filterActiveEntities<T extends { active?: boolean }>(items: T[]): T[] {
  return items.filter(isAccommodationEntityActive);
}

export function markAccommodationEntityInactive<T extends { active?: boolean }>(entity: T): T {
  return { ...entity, active: false };
}

export function markAccommodationEntityActive<T extends { active?: boolean }>(entity: T): T {
  return { ...entity, active: true };
}
