/**
 * Shared module lifecycle primitives for Payments (reference), Complaints, Members, etc.
 *
 * Pattern:
 *   useXxxMonth() orchestrator → Summary / Tabs / Filters / Lists / Counts (local only)
 *
 * Lifecycle: load on month key · guard races · cache by month · invalidate after mutations only
 * Error: initial → full page · background → keep data + refreshError
 */
export type { ModuleFetchMode, ModuleLoadState } from './types';
export { createEmptyModuleLoadState } from './types';
export { createRequestGuard, type RequestGuard } from './requestGuard';
export { createMonthCache, type MonthCache, type MonthCacheEntry } from './monthCache';
