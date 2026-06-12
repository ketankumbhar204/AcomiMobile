import { useCallback, useRef } from 'react';

/** Ignores out-of-order API responses when query keys change mid-flight. */
export function useStaleRequestGuard() {
  const seqRef = useRef(0);

  const nextRequest = useCallback(() => {
    seqRef.current += 1;
    return seqRef.current;
  }, []);

  const isStale = useCallback((seq: number) => seq !== seqRef.current, []);

  const cancelPending = useCallback(() => {
    seqRef.current += 1;
  }, []);

  return { nextRequest, isStale, cancelPending };
}
