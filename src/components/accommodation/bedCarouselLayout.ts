/**
 * Shared sizing for a room's bed row.
 * Every bed card uses the same width. Extra beds scroll; they do not wrap
 * and they do not grow to fill the row.
 */

/** Matches the earlier half-width bed card on a phone. */
export const BED_CAROUSEL_CARD = 168;
export const BED_CAROUSEL_GAP = 12;

export type BedCarouselLayout = {
  cardWidth: number;
  columns: number;
  overflows: boolean;
  stride: number;
  /** Width of the scrolling row. */
  scrollerWidth: number;
};

export function bedCarouselLayout(containerWidth: number, itemCount: number): BedCarouselLayout {
  const width = Math.max(0, containerWidth);
  const count = Math.max(0, itemCount);
  const cardWidth = width > 0 ? Math.min(BED_CAROUSEL_CARD, width) : BED_CAROUSEL_CARD;
  const stride = cardWidth + BED_CAROUSEL_GAP;
  const contentWidth = count === 0 ? 0 : cardWidth * count + BED_CAROUSEL_GAP * Math.max(0, count - 1);
  const fitted =
    width <= 0 || stride <= 0 ? 1 : Math.max(1, Math.floor((width + BED_CAROUSEL_GAP) / stride));
  return {
    cardWidth,
    columns: count === 0 ? 1 : Math.min(count, fitted),
    overflows: width > 0 && contentWidth > width + 1,
    stride,
    scrollerWidth: width,
  };
}

/** Trailing space so the last card can snap fully into the viewport. */
export function bedCarouselEndInset(viewportWidth: number, cardWidth: number): number {
  if (viewportWidth <= 0 || cardWidth <= 0 || viewportWidth <= cardWidth) {
    return 0;
  }
  return Math.round(viewportWidth - cardWidth);
}
