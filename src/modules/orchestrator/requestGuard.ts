/**
 * Monotonic request id guard — drop stale async responses.
 * Prefer over AbortController when the HTTP client does not thread signal through unwrap helpers.
 */
export function createRequestGuard() {
  let currentId = 0;

  return {
    next(): number {
      currentId += 1;
      return currentId;
    },
    isCurrent(id: number): boolean {
      return id === currentId;
    },
    invalidate(): void {
      currentId += 1;
    },
  };
}

export type RequestGuard = ReturnType<typeof createRequestGuard>;
