import { useCallback, useEffect, useRef, useState } from 'react';
import type { ScrollView } from 'react-native';

type UseProgressiveSectionReviewArgs = {
  enabled: boolean;
  /** When true on enable, skip the Continue gate (e.g. editing existing draft). */
  initiallyReviewed?: boolean;
  highlightMs?: number;
};

type SectionLayout = { y: number; height: number };

/**
 * Shared “section reviewed” detection for Progressive Guided Workflow:
 * Continue scroll + highlight, manual scroll visibility, scroll-past, interact.
 */
export function useProgressiveSectionReview({
  enabled,
  initiallyReviewed = false,
  highlightMs = 1000,
}: UseProgressiveSectionReviewArgs) {
  const [reviewed, setReviewed] = useState(() => !enabled || initiallyReviewed);
  const [highlighted, setHighlighted] = useState(false);
  const layoutRef = useRef<SectionLayout>({ y: 0, height: 0 });
  const allowVisibilityRef = useRef(false);
  const highlightTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const markTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!enabled) {
      setReviewed(true);
      allowVisibilityRef.current = false;
      return;
    }
    setReviewed(initiallyReviewed);
    allowVisibilityRef.current = false;
  }, [enabled, initiallyReviewed]);

  useEffect(() => {
    return () => {
      if (highlightTimerRef.current) {
        clearTimeout(highlightTimerRef.current);
      }
      if (markTimerRef.current) {
        clearTimeout(markTimerRef.current);
      }
    };
  }, []);

  const markReviewed = useCallback(() => {
    setReviewed(true);
  }, []);

  const clearReviewed = useCallback(() => {
    if (!enabled) {
      return;
    }
    setReviewed(false);
    allowVisibilityRef.current = false;
  }, [enabled]);

  const onSectionLayout = useCallback((y: number, height: number) => {
    layoutRef.current = { y, height };
  }, []);

  const onScrollBeginDrag = useCallback(() => {
    allowVisibilityRef.current = true;
  }, []);

  const onScroll = useCallback(
    (scrollY: number, viewportHeight: number) => {
      if (!enabled || reviewed) {
        return;
      }
      if (!allowVisibilityRef.current) {
        return;
      }
      const { y, height } = layoutRef.current;
      if (height <= 0) {
        return;
      }
      const viewTop = scrollY;
      const viewBottom = scrollY + viewportHeight;
      const extrasBottom = y + height;
      const overlap =
        Math.min(viewBottom, extrasBottom) - Math.max(viewTop, y);
      const visibleEnough = overlap >= Math.min(height * 0.35, 72);
      const scrolledPast = extrasBottom < viewTop;
      if (visibleEnough || scrolledPast) {
        markReviewed();
      }
    },
    [enabled, markReviewed, reviewed],
  );

  const continueToSection = useCallback(
    (scrollRef: React.RefObject<ScrollView | null>, offset = 16) => {
      allowVisibilityRef.current = true;
      const y = Math.max(0, layoutRef.current.y - offset);
      scrollRef.current?.scrollTo({ y, animated: true });
      setHighlighted(true);
      if (highlightTimerRef.current) {
        clearTimeout(highlightTimerRef.current);
      }
      highlightTimerRef.current = setTimeout(() => {
        setHighlighted(false);
        highlightTimerRef.current = null;
      }, highlightMs);
      if (markTimerRef.current) {
        clearTimeout(markTimerRef.current);
      }
      markTimerRef.current = setTimeout(() => {
        markReviewed();
        markTimerRef.current = null;
      }, 350);
    },
    [highlightMs, markReviewed],
  );

  return {
    reviewed,
    setReviewed,
    markReviewed,
    clearReviewed,
    highlighted,
    onSectionLayout,
    onScroll,
    onScrollBeginDrag,
    continueToSection,
  };
}
