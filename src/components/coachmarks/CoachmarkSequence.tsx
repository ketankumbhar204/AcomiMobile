import React, { useEffect, useRef } from 'react';
import type { UUID } from '../../api/types';
import type { LifecycleState } from '../../spaceLifecycle/types';
import {
  isCoachmarkFinished,
  type CoachmarkTourId,
} from '../../utils/coachmarkStorage';
import { useCoachmarks } from '../../coachmarks/CoachmarkProvider';
import { isCoachmarkLifecycleEligible } from '../../coachmarks/visibility';

export type CoachmarkSequenceProps = {
  spaceId: UUID | null | undefined;
  tourId: CoachmarkTourId;
  lifecycle: LifecycleState | null | undefined;
  /** Gate UI readiness (anchors mounted, setup card visible, etc.). */
  enabled?: boolean;
  children?: React.ReactNode;
};

/**
 * Starts a coachmark tour once when eligible. Does not navigate.
 * Children typically include CoachmarkAnchor targets.
 */
export function CoachmarkSequence({
  spaceId,
  tourId,
  lifecycle,
  enabled = true,
  children,
}: CoachmarkSequenceProps) {
  const { maybeStart, active } = useCoachmarks();
  const settledRef = useRef<string | null>(null);

  useEffect(() => {
    if (!spaceId || !enabled) {
      return;
    }

    const settleKey = `${spaceId}:${tourId}`;
    if (settledRef.current === settleKey) {
      return;
    }
    if (active?.tourId === tourId && active.spaceId === spaceId) {
      settledRef.current = settleKey;
      return;
    }

    let cancelled = false;
    const timer = setTimeout(() => {
      void (async () => {
        const finished = await isCoachmarkFinished(spaceId, tourId);
        if (cancelled) {
          return;
        }
        if (finished) {
          settledRef.current = settleKey;
          return;
        }
        if (lifecycle == null) {
          // Still loading — retry when lifecycle arrives.
          return;
        }
        if (!isCoachmarkLifecycleEligible(lifecycle)) {
          settledRef.current = settleKey;
          return;
        }

        const started = await maybeStart({
          spaceId,
          tourId,
          lifecycle,
          enabled,
        });
        if (cancelled) {
          return;
        }
        if (started) {
          settledRef.current = settleKey;
        }
      })();
    }, 450);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [active, enabled, lifecycle, maybeStart, spaceId, tourId]);

  // New space or tour → allow another attempt.
  const identity = spaceId && tourId ? `${spaceId}:${tourId}` : null;
  useEffect(() => {
    if (settledRef.current != null && settledRef.current !== identity) {
      settledRef.current = null;
    }
  }, [identity]);

  return <>{children}</>;
}
