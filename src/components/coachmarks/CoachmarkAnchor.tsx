import React, { useCallback, useEffect, useRef } from 'react';
import { View, type StyleProp, type ViewStyle } from 'react-native';
import { useCoachmarksOptional } from '../../coachmarks/CoachmarkProvider';
import type { CoachmarkAnchorId } from '../../coachmarks/types';

type CoachmarkAnchorProps = {
  id: CoachmarkAnchorId;
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  /** When false, unregister and skip measurement (e.g. gate not ready). */
  active?: boolean;
};

/**
 * Registers a layout rect for spotlight targeting.
 * Measures only while a tour is active — no work after completion.
 *
 * Depends on stable register/unregister callbacks and tour step index only.
 * Must not re-measure on every layoutVersion bump (that caused max update depth).
 */
export function CoachmarkAnchor({
  id,
  children,
  style,
  active = true,
}: CoachmarkAnchorProps) {
  const coachmarks = useCoachmarksOptional();
  const viewRef = useRef<View>(null);

  const registerAnchor = coachmarks?.registerAnchor;
  const unregisterAnchor = coachmarks?.unregisterAnchor;
  const stepIndex = coachmarks?.active?.stepIndex ?? -1;
  const tourActive = coachmarks?.active != null;
  const shouldMeasure = Boolean(registerAnchor && active && tourActive);

  const measure = useCallback(() => {
    if (!registerAnchor || !shouldMeasure) {
      return;
    }
    viewRef.current?.measureInWindow((x, y, width, height) => {
      registerAnchor(id, { x, y, width, height });
    });
  }, [id, registerAnchor, shouldMeasure]);

  useEffect(() => {
    if (!registerAnchor || !unregisterAnchor) {
      return;
    }
    if (!shouldMeasure) {
      unregisterAnchor(id);
      return;
    }
    const handle = requestAnimationFrame(() => {
      measure();
    });
    return () => {
      cancelAnimationFrame(handle);
    };
  }, [
    id,
    measure,
    registerAnchor,
    shouldMeasure,
    stepIndex,
    unregisterAnchor,
  ]);

  useEffect(() => {
    return () => {
      unregisterAnchor?.(id);
    };
  }, [id, unregisterAnchor]);

  return (
    <View
      ref={viewRef}
      style={style}
      collapsable={false}
      onLayout={() => {
        if (shouldMeasure) {
          measure();
        }
      }}>
      {children}
    </View>
  );
}
