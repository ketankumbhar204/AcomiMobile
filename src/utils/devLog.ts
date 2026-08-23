/**
 * Development-only console.log. No-op in release (`__DEV__ === false`).
 * Not a logging framework — a single gate for existing debug traces.
 */
export function devLog(...args: Parameters<typeof console.log>): void {
  if (__DEV__) {
    console.log(...args);
  }
}
