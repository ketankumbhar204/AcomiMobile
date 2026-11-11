import { findNodeHandle, type ScrollView, type View } from 'react-native';

/** Scroll a descendant into view near the top of a parent ScrollView. */
export function scrollFieldIntoView(
  scroll: ScrollView | null,
  target: View | null,
  offset = 24,
): void {
  if (!scroll || !target) {
    return;
  }
  const scrollHandle = findNodeHandle(scroll);
  if (scrollHandle == null) {
    return;
  }
  target.measureLayout(
    scrollHandle,
    (_x, y) => {
      scroll.scrollTo({ y: Math.max(0, y - offset), animated: true });
    },
    () => undefined,
  );
}

/** Retry until the row has mounted after a tab or section change. */
export function scrollFieldIntoViewWhenReady(
  scroll: ScrollView | null,
  resolveTarget: () => View | null,
  offset = 24,
): void {
  const attempt = (triesLeft: number) => {
    const target = resolveTarget();
    if (scroll && target) {
      scrollFieldIntoView(scroll, target, offset);
      return;
    }
    if (triesLeft > 0) {
      setTimeout(() => attempt(triesLeft - 1), 120);
    }
  };
  setTimeout(() => attempt(4), 60);
}
