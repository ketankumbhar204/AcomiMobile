/** Scroll math for the bed-row arrows and dots. Card size is not involved. */

export const BED_CAROUSEL_MAX_DOTS = 7;

export function bedCarouselMaxScroll(contentWidth: number, viewportWidth: number): number {
  return Math.max(0, contentWidth - viewportWidth);
}

export function bedCarouselHasOverflow(contentWidth: number, viewportWidth: number): boolean {
  return viewportWidth > 0 && bedCarouselMaxScroll(contentWidth, viewportWidth) > 1;
}

export function bedCarouselAtStart(scrollX: number): boolean {
  return scrollX <= 2;
}

export function bedCarouselAtEnd(scrollX: number, maxScroll: number): boolean {
  return maxScroll <= 1 || scrollX >= maxScroll - 2;
}

/** One dot per bed when the row overflows, capped so the dots stay between the arrows. */
export function bedCarouselDotCount(itemCount: number, overflows: boolean): number {
  if (!overflows || itemCount <= 1) {
    return 0;
  }
  return Math.min(itemCount, BED_CAROUSEL_MAX_DOTS);
}

export function bedCarouselActiveDot(
  scrollX: number,
  maxScroll: number,
  stride: number,
  dotCount: number,
  itemCount: number,
): number {
  if (dotCount <= 1) {
    return 0;
  }
  if (dotCount === itemCount && stride > 0) {
    return Math.min(dotCount - 1, Math.max(0, Math.round(Math.max(0, scrollX) / stride)));
  }
  if (maxScroll <= 0) {
    return 0;
  }
  return Math.min(dotCount - 1, Math.round((Math.max(0, scrollX) / maxScroll) * (dotCount - 1)));
}

/** Next snap position, clamped so the last card can sit fully in view. */
export function bedCarouselScrollTarget(
  scrollX: number,
  direction: -1 | 1,
  stride: number,
  maxScroll: number,
): number {
  if (stride <= 0) {
    return Math.min(maxScroll, Math.max(0, scrollX));
  }
  const snapped = Math.round((scrollX + direction * stride) / stride) * stride;
  return Math.min(maxScroll, Math.max(0, snapped));
}
