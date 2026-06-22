import type { ListQueryParams } from './types';

export const DEFAULT_LIST_PAGE_SIZE = 20;

export function buildListQuery(params?: ListQueryParams): string {
  const q = new URLSearchParams();
  if (params?.view) {
    q.set('view', params.view);
  }
  if (params?.query) {
    q.set('query', params.query);
  }
  if (params?.page != null) {
    q.set('page', String(params.page));
  }
  if (params?.size != null) {
    q.set('size', String(params.size));
  }
  if (params?.sort) {
    q.set('sort', params.sort);
  }
  if (params?.includeSynthetic != null) {
    q.set('includeSynthetic', String(params.includeSynthetic));
  }
  if (params?.status) {
    q.set('status', params.status);
  }
  const s = q.toString();
  return s ? `?${s}` : '';
}
