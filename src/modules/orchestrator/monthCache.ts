/**
 * Simple in-memory month-scoped module cache.
 * Invalidate only after mutations or explicit month/policy changes — never on tab switches.
 */

export type MonthCacheEntry<T> = {
  data: T;
  fetchedAt: number;
};

export function createMonthCache<T>(options?: { ttlMs?: number }) {
  const ttlMs = options?.ttlMs ?? 60_000;
  const store = new Map<string, MonthCacheEntry<T>>();

  return {
    key(parts: Array<string | null | undefined>): string {
      return parts.map(part => part ?? '').join('|');
    },

    get(key: string): T | null {
      const entry = store.get(key);
      if (!entry) {
        return null;
      }
      if (Date.now() - entry.fetchedAt > ttlMs) {
        store.delete(key);
        return null;
      }
      return entry.data;
    },

    set(key: string, data: T): void {
      store.set(key, { data, fetchedAt: Date.now() });
    },

    invalidate(keyPrefix?: string): void {
      if (!keyPrefix) {
        store.clear();
        return;
      }
      for (const key of [...store.keys()]) {
        if (key === keyPrefix || key.startsWith(`${keyPrefix}|`) || key.startsWith(keyPrefix)) {
          store.delete(key);
        }
      }
    },

    clear(): void {
      store.clear();
    },
  };
}

export type MonthCache<T> = ReturnType<typeof createMonthCache<T>>;
