import { readFileSync } from 'fs';
import { join } from 'path';
import {
  BED_CAROUSEL_CARD,
  BED_CAROUSEL_GAP,
  bedCarouselEndInset,
  bedCarouselLayout,
} from '../bedCarouselLayout';

function contentWidth(cardWidth: number, itemCount: number): number {
  return cardWidth * itemCount + BED_CAROUSEL_GAP * Math.max(0, itemCount - 1);
}

describe('bedCarouselLayout', () => {
  it('keeps every card at the same compact width on a phone', () => {
    const layout = bedCarouselLayout(334, 3);
    expect(layout.cardWidth).toBe(BED_CAROUSEL_CARD);
    expect(layout.overflows).toBe(true);
    expect(layout.cardWidth).toBeLessThan(layout.scrollerWidth);
    expect(layout.cardWidth * 2).toBeGreaterThan(layout.scrollerWidth * 0.8);
  });

  it('uses that same width on wider rows and shows more cards', () => {
    const tablet = bedCarouselLayout(480, 4);
    const desktop = bedCarouselLayout(960, 6);
    expect(tablet.cardWidth).toBe(BED_CAROUSEL_CARD);
    expect(desktop.cardWidth).toBe(BED_CAROUSEL_CARD);
    expect(tablet.columns).toBeGreaterThanOrEqual(2);
    expect(desktop.columns).toBeGreaterThan(tablet.columns);
    expect(desktop.overflows).toBe(true);
  });

  it('does not stretch a single card to the full row', () => {
    const layout = bedCarouselLayout(960, 1);
    expect(layout.overflows).toBe(false);
    expect(layout.cardWidth).toBe(BED_CAROUSEL_CARD);
  });

  it('hides scrolling when the row has not been measured', () => {
    expect(bedCarouselLayout(0, 3).overflows).toBe(false);
    expect(bedCarouselLayout(640, 0).overflows).toBe(false);
  });

  it('leaves enough trailing space to reach the last card', () => {
    const layout = bedCarouselLayout(334, 4);
    const inset = bedCarouselEndInset(layout.scrollerWidth, layout.cardWidth);
    const maxScroll = contentWidth(layout.cardWidth, 4) + inset - layout.scrollerWidth;
    const lastCardStart = 3 * layout.stride;
    expect(maxScroll).toBeGreaterThanOrEqual(lastCardStart - 1);
    expect(bedCarouselEndInset(0, layout.cardWidth)).toBe(0);
  });
});

describe('bed carousel wiring', () => {
  const room = readFileSync(
    join(__dirname, '../BuildingInventoryRoomSection.tsx'),
    'utf8',
  );
  const card = readFileSync(join(__dirname, '../BuildingInventoryBedCard.tsx'), 'utf8');

  it('scrolls room beds instead of wrapping them into a grid', () => {
    expect(room).toContain('<HorizontalBedCarousel');
    expect(room).not.toContain('bedsGrid');
    expect(card).not.toContain("width: '50%'");
    expect(card).toContain("width: '100%'");
  });
});
