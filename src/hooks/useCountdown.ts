import { useEffect, useState } from 'react';

export function useCountdown(deadlineMs: number | null): number {
  const [, setTick] = useState(0);

  useEffect(() => {
    if (deadlineMs == null) {
      return;
    }

    const id = setInterval(() => {
      setTick(value => value + 1);
    }, 1000);
    return () => clearInterval(id);
  }, [deadlineMs]);

  if (deadlineMs == null) {
    return 0;
  }

  return Math.max(0, Math.ceil((deadlineMs - Date.now()) / 1000));
}
