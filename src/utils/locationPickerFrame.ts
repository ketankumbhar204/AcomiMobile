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

/** Resting location sheet. Tall enough for search + actions, short of a full page. */
const RESTING_SHEET_RATIO = 0.5;
const RESTING_SHEET_MIN = 300;

/**
 * Bottom-sheet frame for the location picker.
 * Closed keyboard: a half-height sheet so the page stays visible behind it.
 * Open keyboard: the sheet fills the space above the keyboard so suggestions
 * can scroll and the actions stay reachable.
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
  const restingCap = Math.min(
    available,
    Math.max(RESTING_SHEET_MIN, Math.round(input.windowHeight * RESTING_SHEET_RATIO)),
  );
  const cap = input.keyboardHeight > 0 ? available : restingCap;
  const maxHeight = Math.min(available, cap);
  const marginTop = Math.max(topGap, input.windowHeight - bottomGap - maxHeight);
  return { marginTop, maxHeight };
}
