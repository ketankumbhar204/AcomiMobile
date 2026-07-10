export type CreatedDateSortOption = 'created_desc' | 'created_asc';

export const CREATED_DATE_SORT_OPTIONS: CreatedDateSortOption[] = [
  'created_desc',
  'created_asc',
];

export const DEFAULT_CREATED_DATE_SORT: CreatedDateSortOption = 'created_desc';

export function compareByCreatedAt(
  left: string,
  right: string,
  sort: CreatedDateSortOption,
): number {
  const diff = new Date(left).getTime() - new Date(right).getTime();
  return sort === 'created_asc' ? diff : -diff;
}

export function createdDateSortLabelKey(sort: CreatedDateSortOption): string {
  return sort === 'created_asc' ? 'list.sort.createdAsc' : 'list.sort.createdDesc';
}
