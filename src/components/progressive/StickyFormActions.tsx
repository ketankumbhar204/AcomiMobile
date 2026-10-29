import React from 'react';
import { StyleSheet, View, type ViewStyle } from 'react-native';
import { spacing } from '../../theme';
import { Button } from '../ui';
import type { ProgressiveWorkflowAction } from './ProgressiveWorkflowFooter';
import {
  stickyBarChrome,
  stickyBarKeyboardDock,
  stickyBarKeyboardSlot,
  stickyBarStackStyle,
  useKeyboardScreenLift,
  useStickyBarPaddingBottom,
} from './stickyBarStyles';

type StickyFormActionsProps = {
  /** Primary CTA (Create / Save / Submit / Next). */
  primary?: ProgressiveWorkflowAction;
  /** Secondary / cancel / previous. */
  secondary?: ProgressiveWorkflowAction;
  /** `stack` = vertical (default); `row` = side-by-side (wizards). */
  layout?: 'stack' | 'row';
  /** Custom action row (e.g. Approve / Reject). Overrides primary/secondary. */
  children?: React.ReactNode;
  /** Optional content below actions (logout link, hint). */
  footerExtra?: React.ReactNode;
  style?: ViewStyle;
  accessibilityLabel?: string;
  /**
   * Keep the bar in the screen column. The form scrolls above it, and the
   * keyboard resizes the window instead of lifting the buttons over the fields.
   */
  anchorToScreen?: boolean;
};

/**
 * Shared sticky action bar for forms and detail decision screens.
 * Matches ProgressiveWorkflowFooter chrome + safe-area padding.
 */
export function StickyFormActions({
  primary,
  secondary,
  layout = 'stack',
  children,
  footerExtra,
  style,
  accessibilityLabel,
  anchorToScreen = false,
}: StickyFormActionsProps) {
  const paddingBottom = useStickyBarPaddingBottom();
  const keyboardLift = useKeyboardScreenLift();
  const keyboardOpen = !anchorToScreen && keyboardLift > 0;

  return (
    <View pointerEvents={keyboardOpen ? 'none' : 'auto'} style={keyboardOpen ? stickyBarKeyboardSlot : undefined}>
    <View
      style={[styles.bar, { paddingBottom }, stickyBarKeyboardDock(keyboardLift), style]}
      accessibilityRole="summary"
      accessibilityLabel={accessibilityLabel}>
      {children ? (
        <View style={stickyBarStackStyle.stack}>{children}</View>
      ) : layout === 'row' ? (
        <View style={stickyBarStackStyle.row}>
          {secondary ? (
            <Button
              label={secondary.label}
              variant="ghost"
              onPress={secondary.onPress}
              loading={secondary.loading}
              disabled={secondary.disabled}
              numberOfLines={1}
              style={StyleSheet.flatten([stickyBarStackStyle.rowButton, styles.rowButton])}
            />
          ) : null}
          {primary ? (
            <Button
              label={primary.label}
              onPress={primary.onPress}
              loading={primary.loading}
              disabled={primary.disabled}
              numberOfLines={1}
              style={StyleSheet.flatten([
                stickyBarStackStyle.rowButton,
                styles.rowButton,
                primary.style,
              ])}
            />
          ) : null}
        </View>
      ) : (
        <View style={stickyBarStackStyle.stack}>
          {primary ? (
            <Button
              label={primary.label}
              onPress={primary.onPress}
              loading={primary.loading}
              disabled={primary.disabled}
              style={primary.style}
            />
          ) : null}
          {secondary ? (
            <Button
              label={secondary.label}
              variant="ghost"
              onPress={secondary.onPress}
              loading={secondary.loading}
              disabled={secondary.disabled}
            />
          ) : null}
        </View>
      )}
      {footerExtra}
    </View>
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    ...stickyBarChrome,
  },
  rowButton: {
    paddingHorizontal: spacing.sm,
  },
});
