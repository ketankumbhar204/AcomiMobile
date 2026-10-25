export type PropertyOpsFocus = 'occupied' | 'vacant' | 'moveIns';

export function propertyOpsFocusFromInventory(
  status: string | null | undefined,
  focus?: string | null,
): PropertyOpsFocus | null {
  if (focus === 'moveIns') {
    return 'moveIns';
  }
  if (status === 'AVAILABLE') {
    return 'vacant';
  }
  if (status === 'OCCUPIED') {
    return 'occupied';
  }
  return null;
}

export function bedStatusForPropertyOpsFocus(
  focus: PropertyOpsFocus,
): 'AVAILABLE' | 'OCCUPIED' {
  return focus === 'vacant' ? 'AVAILABLE' : 'OCCUPIED';
}

export function filterBedsById<T extends { bedId: string }>(
  beds: readonly T[],
  allow: ReadonlySet<string> | null | undefined,
): T[] {
  if (!allow) {
    return [...beds];
  }
  return beds.filter(bed => allow.has(bed.bedId));
}
