/**
 * Keyboard overlap that is not already reflected in a resized window.
 * Android adjustResize shrinks the window; iOS usually does not.
 */
export function keyboardOverlap(input: {
  restingHeight: number;
  windowHeight: number;
  keyboardHeight: number;
}): number {
  const shrink = Math.max(0, input.restingHeight - input.windowHeight);
  return Math.max(0, input.keyboardHeight - shrink);
}

/**
 * Bottom-sheet frame for the location picker.
 * The sheet sits on the bottom of the visible area. When the keyboard is
 * open, the sheet fills the space above it so the suggestion list can scroll
 * and the actions stay reachable.
 */
export function locationPickerFrame(input: {
  windowHeight: number;
  topInset: number;
  bottomInset: number;
  keyboardHeight: number;
}): { marginTop: number; maxHeight: number } {
  const topGap = Math.max(0, input.topInset) + 8;
  const bottomGap =
    input.keyboardHeight > 0 ? input.keyboardHeight : Math.max(input.bottomInset, 0);
  const available = Math.max(0, input.windowHeight - topGap - bottomGap);
  const cap =
    input.keyboardHeight > 0 ? available : Math.round(input.windowHeight * 0.86);
  const maxHeight = Math.min(available, cap);
  const marginTop = Math.max(topGap, input.windowHeight - bottomGap - maxHeight);
  return { marginTop, maxHeight };
}
