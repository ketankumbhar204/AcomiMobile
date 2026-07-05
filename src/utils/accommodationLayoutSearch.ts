export function matchesAccommodationSearch(
  haystack: string | undefined | null,
  query: string,
): boolean {
  const needle = query.trim().toLowerCase();
  if (!needle) {
    return false;
  }
  return (haystack ?? '').toLowerCase().includes(needle);
}

export function findFirstSearchMatchIndex<T>(
  items: T[],
  query: string,
  getLabel: (item: T) => string,
): number {
  const needle = query.trim().toLowerCase();
  if (!needle) {
    return -1;
  }
  return items.findIndex(item => getLabel(item).toLowerCase().includes(needle));
}
