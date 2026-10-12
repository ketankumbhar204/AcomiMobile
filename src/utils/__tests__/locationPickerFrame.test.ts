import { keyboardOverlap, locationPickerFrame } from '../locationPickerFrame';

describe('locationPickerFrame', () => {
  it('anchors a bottom sheet and leaves the top of the page dimmed', () => {
    const frame = locationPickerFrame({
      windowHeight: 800,
      topInset: 44,
      bottomInset: 34,
      keyboardHeight: 0,
    });

    expect(frame.marginTop).toBe(78);
    expect(frame.maxHeight).toBe(688);
    expect(frame.marginTop + frame.maxHeight + 34).toBe(800);
    expect(frame.maxHeight).toBeGreaterThan(800 * 0.7);
  });

  it('shrinks to stay above the keyboard', () => {
    const frame = locationPickerFrame({
      windowHeight: 800,
      topInset: 44,
      bottomInset: 34,
      keyboardHeight: 420,
    });

    expect(frame.marginTop).toBe(52);
    expect(frame.maxHeight).toBe(328);
    expect(frame.marginTop + frame.maxHeight + 420).toBe(800);
    expect(frame.maxHeight).toBeLessThan(Math.round(800 * 0.86));
  });

  it('does not subtract the keyboard twice when the window already resized', () => {
    expect(
      keyboardOverlap({ restingHeight: 800, windowHeight: 800, keyboardHeight: 320 }),
    ).toBe(320);
    expect(
      keyboardOverlap({ restingHeight: 800, windowHeight: 480, keyboardHeight: 320 }),
    ).toBe(0);
  });

  it('does not grow past the viewport on a short screen', () => {
    const frame = locationPickerFrame({
      windowHeight: 500,
      topInset: 20,
      bottomInset: 0,
      keyboardHeight: 0,
    });

    expect(frame.marginTop + frame.maxHeight).toBeLessThanOrEqual(500);
    expect(frame.maxHeight).toBeGreaterThan(0);
  });
});
