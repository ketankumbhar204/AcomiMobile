import React from 'react';
import { StyleSheet, View } from 'react-native';
import { spacing } from '../../theme';
import { SpaceTabBackButton } from './SpaceTabBackButton';
import { SpaceTabHomeButton } from './SpaceTabHomeButton';

/** Back stays on the left. Home sits beside it and exits the space. */
export function SpaceTabHeaderLeading() {
  return (
    <View style={styles.row}>
      <SpaceTabBackButton />
      <SpaceTabHomeButton />
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    flexShrink: 0,
    gap: spacing.xxs,
  },
});
