import React from 'react';
import { Pressable, StyleSheet, Text } from 'react-native';
import { colors, typography } from '../../theme';
import { copyTextToClipboard } from '../../utils/copyTextToClipboard';

type Props = {
  value?: string | null;
};

/** Compact copyable business reference returned by the API. */
export function ReferenceCode({ value }: Props) {
  if (!value) {
    return null;
  }
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={value}
      onPress={() => {
        try {
          copyTextToClipboard(value);
        } catch {
          // Clipboard is optional on this device.
        }
      }}
      hitSlop={6}
    >
      <Text style={styles.code}>{value}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  code: {
    ...typography.caption,
    color: colors.textSecondary,
    fontVariant: ['tabular-nums'],
  },
});
