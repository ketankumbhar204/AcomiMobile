import { useEffect, useState } from 'react';
import { Keyboard, Platform, StyleSheet, type ViewStyle } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, spacing } from '../../theme';

/** Shared sticky bar chrome — ProgressiveWorkflowFooter + StickyFormActions. */
export const stickyBarChrome = {
  borderTopWidth: 1,
  borderTopColor: colors.border,
  backgroundColor: colors.white,
  paddingHorizontal: spacing.xxl,
  paddingTop: spacing.sm,
} as const;

/** Base bottom padding before safe-area inset. */
export const STICKY_BAR_PADDING_BOTTOM_BASE = spacing.md;

/**
 * Safe-area-aware bottom padding for sticky footers (home indicator / nav bar).
 */
export function useStickyBarPaddingBottom(): number {
  const insets = useSafeAreaInsets();
  return STICKY_BAR_PADDING_BOTTOM_BASE + Math.max(insets.bottom, spacing.sm);
}

/**
 * Height of the software keyboard. Used so sticky bars stay on the screen's
 * bottom edge instead of riding up and covering the form.
 */
export function useKeyboardScreenLift(): number {
  const [lift, setLift] = useState(0);

  useEffect(() => {
    const showEvent = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
    const hideEvent = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';
    const showSub = Keyboard.addListener(showEvent, event => {
      setLift(event.endCoordinates.height);
    });
    const hideSub = Keyboard.addListener(hideEvent, () => {
      setLift(0);
    });
    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, []);

  return lift;
}

/** Keeps a sticky bar in normal flow, and docks it under the keyboard while typing. */
export function stickyBarKeyboardDock(keyboardLift: number): ViewStyle | undefined {
  if (keyboardLift <= 0) {
    return undefined;
  }
  return {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: -keyboardLift,
  };
}

export const stickyBarKeyboardSlot: ViewStyle = {
  height: 0,
  overflow: 'visible',
};

export const stickyBarStackStyle = StyleSheet.create({
  stack: {
    gap: spacing.sm,
  },
  row: {
    flexDirection: 'row',
    gap: spacing.sm,
    alignItems: 'stretch',
  },
  rowButton: {
    flex: 1,
  },
});
