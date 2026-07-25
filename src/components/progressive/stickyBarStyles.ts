import { StyleSheet } from 'react-native';
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
