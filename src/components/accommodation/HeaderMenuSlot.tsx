import React from 'react';
import { StyleSheet, View } from 'react-native';
import { spacing } from '../../theme';

type HeaderMenuSlotProps = {
  children: React.ReactNode;
};

/** Wraps header overflow menus so they align inside the nav bar. */
export function HeaderMenuSlot({ children }: HeaderMenuSlotProps) {
  return <View style={styles.slot}>{children}</View>;
}

const styles = StyleSheet.create({
  slot: {
    marginRight: spacing.md,
    minWidth: 40,
    minHeight: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
