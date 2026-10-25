import {
  bedCarouselActiveDot,
  bedCarouselAtEnd,
  bedCarouselAtStart,
  bedCarouselDotCount,
  bedCarouselHasOverflow,
  bedCarouselScrollTarget,
} from '../bedCarouselNav';

describe('bedCarouselNav', () => {
  const stride = 180;

  it('hides navigation when every card fits', () => {
    expect(bedCarouselHasOverflow(348, 360)).toBe(false);
    expect(bedCarouselDotCount(2, false)).toBe(0);
  });

  it('steps one card and stops at each end', () => {
    expect(bedCarouselHasOverflow(528, 334)).toBe(true);
    expect(bedCarouselDotCount(3, true)).toBe(3);
    expect(bedCarouselAtStart(0)).toBe(true);
    expect(bedCarouselAtEnd(0, 194)).toBe(false);

    const next = bedCarouselScrollTarget(0, 1, stride, 194);
    expect(next).toBe(stride);
    expect(bedCarouselActiveDot(next, 194, stride, 3, 3)).toBe(1);

    const end = bedCarouselScrollTarget(next, 1, stride, 194);
    expect(end).toBe(194);
    expect(bedCarouselAtEnd(end, 194)).toBe(true);
    expect(bedCarouselScrollTarget(end, 1, stride, 194)).toBe(194);
  });

  it('keeps two rooms independent by using only the offset it is given', () => {
    expect(bedCarouselScrollTarget(0, 1, stride, 400)).toBe(stride);
    expect(bedCarouselScrollTarget(360, -1, stride, 400)).toBe(stride);
  });
});
