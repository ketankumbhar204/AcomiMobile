/**
 * Shared module lifecycle contract for Payments, Complaints, Members, etc.
 *
 * Initial load failed  → full-page error (hasData === false)
 * Initial load succeeded → never destroy content on background failure
 * Background refresh failed → keep data + refreshError (inline retry)
 */

export type ModuleFetchMode = 'initial' | 'refresh' | 'soft';

export type ModuleLoadState<T> = {
  data: T | null;
  /** True while the first payload (or month switch with no retained data) is loading. */
  loading: boolean;
  /** True while a refresh is in flight and previous data is still shown. */
  refreshing: boolean;
  /** Fatal error when there is no usable data to show. */
  error: string | null;
  /** Non-destructive error when data is still on screen. */
  refreshError: string | null;
  /** True once at least one successful payload has been applied for the current key. */
  hasData: boolean;
};

export function createEmptyModuleLoadState<T>(): ModuleLoadState<T> {
  return {
    data: null,
    loading: false,
    refreshing: false,
    error: null,
    refreshError: null,
    hasData: false,
  };
}
