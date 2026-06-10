import React from 'react';
import { Pressable, StyleSheet, Text } from 'react-native';
import { colors, shadows } from '../../theme';

type FABProps = {
  onPress: () => void;
  accessibilityLabel?: string;
};

export function FAB({ onPress, accessibilityLabel = 'Action' }: FABProps) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.fab, pressed && styles.fabPressed]}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}>
      <Text style={styles.icon} allowFontScaling={false}>
        +
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  fab: {
    position: 'absolute',
    bottom: 28,
    right: 24,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadows.lg,
  },
  fabPressed: {
    backgroundColor: colors.primaryHover,
    transform: [{ scale: 0.95 }],
  },
  icon: {
    fontSize: 28,
    lineHeight: 30,
    fontWeight: '300',
    color: colors.white,
    includeFontPadding: false,
    textAlignVertical: 'center',
  },
});
