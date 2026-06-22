/** Count how many filter dimensions differ from their defaults (for badge display). */
export function countFilterDimensions(
  checks: Array<{ active: boolean }>,
): number {
  return checks.filter(check => check.active).length;
}

export function countSetFilter<T>(
  selected: ReadonlySet<T> | T[],
  allOptions: readonly T[],
): number {
  const size = selected instanceof Set ? selected.size : selected.length;
  if (size === 0 || size >= allOptions.length) {
    return 0;
  }
  return 1;
}

export function toggleSetValue<T>(set: Set<T>, value: T): Set<T> {
  const next = new Set(set);
  if (next.has(value)) {
    next.delete(value);
  } else {
    next.add(value);
  }
  return next;
}
