import React from 'react';
import { StyleSheet, View, ViewStyle } from 'react-native';
import { colors, radius, shadows, spacing } from '../../theme';

type CardProps = {
  children: React.ReactNode;
  style?: ViewStyle;
  padded?: boolean;
};

export function Card({ children, style, padded = true }: CardProps) {
  return (
    <View style={[styles.card, padded && styles.padded, style]}>{children}</View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.white,
    borderRadius: radius.card,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadows.sm,
  },
  padded: {
    padding: spacing.lg,
  },
});
