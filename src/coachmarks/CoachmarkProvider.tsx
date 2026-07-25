import React, {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
} from 'react';
import type { UUID } from '../api/types';
import type { LifecycleState } from '../spaceLifecycle/types';
import {
  isCoachmarkFinished,
  saveCoachmarkRecord,
  type CoachmarkTourId,
} from '../utils/coachmarkStorage';
import { sequenceForTourId } from './sequences';
import type {
  ActiveCoachmarkState,
  CoachmarkAnchorId,
  CoachmarkAnchorLayout,
} from './types';
import { canStartCoachmark } from './visibility';
import { CoachmarkOverlay } from '../components/coachmarks/CoachmarkOverlay';

export type MaybeStartCoachmarkArgs = {
  spaceId: UUID;
  tourId: CoachmarkTourId;
  lifecycle: LifecycleState | null | undefined;
  enabled?: boolean;
  forceReplay?: boolean;
};

type CoachmarkContextValue = {
  active: ActiveCoachmarkState | null;
  registerAnchor: (
    id: CoachmarkAnchorId,
    layout: CoachmarkAnchorLayout | null,
  ) => void;
  unregisterAnchor: (id: CoachmarkAnchorId) => void;
  getAnchorLayout: (id: CoachmarkAnchorId) => CoachmarkAnchorLayout | null;
  maybeStart: (args: MaybeStartCoachmarkArgs) => Promise<boolean>;
  next: () => void;
  dismiss: (reason: 'skipped' | 'completed' | 'outside' | 'back') => void;
};

/** Overlay-only: bumps when anchor rects change without re-rendering anchors. */
type CoachmarkLayoutContextValue = {
  layoutVersion: number;
};

const CoachmarkContext = createContext<CoachmarkContextValue | null>(null);
const CoachmarkLayoutContext = createContext<CoachmarkLayoutContextValue>({
  layoutVersion: 0,
});

function roundLayout(layout: CoachmarkAnchorLayout): CoachmarkAnchorLayout {
  return {
    x: Math.round(layout.x),
    y: Math.round(layout.y),
    width: Math.round(layout.width),
    height: Math.round(layout.height),
  };
}

function layoutsEqual(
  a: CoachmarkAnchorLayout,
  b: CoachmarkAnchorLayout,
): boolean {
  return (
    a.x === b.x && a.y === b.y && a.width === b.width && a.height === b.height
  );
}

export function CoachmarkProvider({ children }: { children: React.ReactNode }) {
  const [active, setActive] = useState<ActiveCoachmarkState | null>(null);
  const [layoutVersion, setLayoutVersion] = useState(0);
  const anchorsRef = useRef<Map<CoachmarkAnchorId, CoachmarkAnchorLayout>>(
    new Map(),
  );
  const startingRef = useRef(false);

  const registerAnchor = useCallback(
    (id: CoachmarkAnchorId, layout: CoachmarkAnchorLayout | null) => {
      if (layout == null || layout.width <= 0 || layout.height <= 0) {
        if (anchorsRef.current.has(id)) {
          anchorsRef.current.delete(id);
          setLayoutVersion(v => v + 1);
        }
        return;
      }
      const nextLayout = roundLayout(layout);
      const prev = anchorsRef.current.get(id);
      if (prev && layoutsEqual(prev, nextLayout)) {
        return;
      }
      anchorsRef.current.set(id, nextLayout);
      setLayoutVersion(v => v + 1);
    },
    [],
  );

  const unregisterAnchor = useCallback((id: CoachmarkAnchorId) => {
    if (anchorsRef.current.delete(id)) {
      setLayoutVersion(v => v + 1);
    }
  }, []);

  const getAnchorLayout = useCallback((id: CoachmarkAnchorId) => {
    return anchorsRef.current.get(id) ?? null;
  }, []);

  const dismiss = useCallback(
    (reason: 'skipped' | 'completed' | 'outside' | 'back') => {
      setActive(current => {
        if (!current) {
          return null;
        }
        const status = reason === 'completed' ? 'completed' : 'skipped';
        void saveCoachmarkRecord(current.spaceId, current.tourId, status);
        return null;
      });
    },
    [],
  );

  const next = useCallback(() => {
    setActive(current => {
      if (!current) {
        return null;
      }
      const nextIndex = current.stepIndex + 1;
      if (nextIndex >= current.steps.length) {
        void saveCoachmarkRecord(
          current.spaceId,
          current.tourId,
          'completed',
        );
        return null;
      }
      return { ...current, stepIndex: nextIndex };
    });
  }, []);

  const maybeStart = useCallback(
    async ({
      spaceId,
      tourId,
      lifecycle,
      enabled = true,
      forceReplay = false,
    }: MaybeStartCoachmarkArgs): Promise<boolean> => {
      if (startingRef.current) {
        return false;
      }
      startingRef.current = true;
      try {
        const finished = forceReplay
          ? false
          : await isCoachmarkFinished(spaceId, tourId);
        if (
          !canStartCoachmark({
            enabled,
            lifecycle,
            alreadyFinished: finished,
            forceReplay,
          })
        ) {
          return false;
        }
        const sequence = sequenceForTourId(tourId);
        setActive(current => {
          if (current) {
            return current;
          }
          return {
            tourId,
            spaceId,
            stepIndex: 0,
            steps: sequence.steps,
          };
        });
        return true;
      } finally {
        startingRef.current = false;
      }
    },
    [],
  );

  const value = useMemo(
    () => ({
      active,
      registerAnchor,
      unregisterAnchor,
      getAnchorLayout,
      maybeStart,
      next,
      dismiss,
    }),
    [
      active,
      dismiss,
      getAnchorLayout,
      maybeStart,
      next,
      registerAnchor,
      unregisterAnchor,
    ],
  );

  const layoutValue = useMemo(
    () => ({ layoutVersion }),
    [layoutVersion],
  );

  return (
    <CoachmarkContext.Provider value={value}>
      <CoachmarkLayoutContext.Provider value={layoutValue}>
        {children}
        <CoachmarkOverlay />
      </CoachmarkLayoutContext.Provider>
    </CoachmarkContext.Provider>
  );
}

export function useCoachmarks(): CoachmarkContextValue {
  const ctx = useContext(CoachmarkContext);
  if (!ctx) {
    throw new Error('useCoachmarks must be used within CoachmarkProvider');
  }
  return ctx;
}

/** Overlay-only subscription for anchor layout invalidation. */
export function useCoachmarkLayoutVersion(): number {
  return useContext(CoachmarkLayoutContext).layoutVersion;
}

/** Safe for optional screens that may render outside provider in tests. */
export function useCoachmarksOptional(): CoachmarkContextValue | null {
  return useContext(CoachmarkContext);
}
