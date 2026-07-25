import React from 'react';
import { StyleSheet, View, type ViewStyle } from 'react-native';
import { Button } from '../ui';
import type { ProgressiveWorkflowAction } from './ProgressiveWorkflowFooter';
import {
  stickyBarChrome,
  stickyBarStackStyle,
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
}: StickyFormActionsProps) {
  const paddingBottom = useStickyBarPaddingBottom();

  return (
    <View
      style={[styles.bar, { paddingBottom }, style]}
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
              style={stickyBarStackStyle.rowButton}
            />
          ) : null}
          {primary ? (
            <Button
              label={primary.label}
              onPress={primary.onPress}
              loading={primary.loading}
              disabled={primary.disabled}
              style={stickyBarStackStyle.rowButton}
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
  );
}

const styles = StyleSheet.create({
  bar: {
    ...stickyBarChrome,
  },
});
