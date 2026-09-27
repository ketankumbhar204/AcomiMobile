import type { RoomsOpsFocus } from '../components/accommodation/AccommodationOpsFocusInventory';

/** Rooms filters that reveal an inline results section below Property operations. */
export function isInlineOpsResultsFocus(
  focus: RoomsOpsFocus | null,
): focus is 'OCCUPIED' | 'VACANT' | 'MOVE_INS_THIS_MONTH' {
  return focus === 'OCCUPIED' || focus === 'VACANT' || focus === 'MOVE_INS_THIS_MONTH';
}

/** Scroll to results only when applying/switching an inline filter, not when clearing. */
export function shouldAutoScrollToOpsResults(
  previous: RoomsOpsFocus | null,
  next: RoomsOpsFocus | null,
): boolean {
  if (!isInlineOpsResultsFocus(next)) {
    return false;
  }
  return previous !== next;
}
