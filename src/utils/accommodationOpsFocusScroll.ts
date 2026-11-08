import type { RoomsOpsFocus } from '../components/accommodation/AccommodationOpsFocusInventory';

/** Rooms filters that reveal an inline results section below Property operations. */
export function isInlineOpsResultsFocus(
  focus: RoomsOpsFocus | null,
): focus is 'OCCUPIED' | 'VACANT' | 'RESERVED' | 'MOVE_INS_THIS_MONTH' | 'PENDING_PAYMENTS' {
  return (
    focus === 'OCCUPIED' ||
    focus === 'VACANT' ||
    focus === 'RESERVED' ||
    focus === 'MOVE_INS_THIS_MONTH' ||
    focus === 'PENDING_PAYMENTS'
  );
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
