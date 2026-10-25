import { Platform, StatusBar } from 'react-native';

type EdgeInsets = { top: number; bottom: number };

/**
 * React Native padding is in dp, and StatusBar.currentHeight is already in dp.
 * Use the reported height, and never a smaller floor.
 */
export function androidInsetFloorDp(
  dp: number,
  currentHeight: number | null | undefined,
): number {
  return Math.max(currentHeight ?? 0, dp);
}

/**
 * Android modals with a translucent status bar draw underneath it, while the
 * activity's safe-area insets stay 0 when the rest of the app is not edge-to-edge.
 * StatusBar.currentHeight is also 0 on some devices, so keep a 24dp floor.
 */
export function androidModalStatusBarInset(): number {
  if (Platform.OS !== 'android') return 0;
  return androidInsetFloorDp(24, StatusBar.currentHeight);
}

/** Keeps the drawer footer above the system navigation bar when insets are 0. */
export function androidModalNavigationInset(): number {
  if (Platform.OS !== 'android') return 0;
  return androidInsetFloorDp(48, 0);
}

/** Modal content often sees zero insets while the status bar still covers the header. */
export function resolveModalSafeInsets(
  live: EdgeInsets,
  initial: EdgeInsets | null | undefined,
  androidStatusBarHeight: number,
): EdgeInsets {
  return {
    top: Math.max(live.top, initial?.top ?? 0, androidStatusBarHeight),
    bottom: Math.max(live.bottom, initial?.bottom ?? 0),
  };
}
