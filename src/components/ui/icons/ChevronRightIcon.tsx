import React from 'react';
import { StyleSheet, View } from 'react-native';
import { colors } from '../../../theme';

type ChevronRightIconProps = {
  size?: number;
  color?: string;
  strokeWidth?: number;
};

const CHEVRON_RATIO = 0.38;

export function ChevronRightIcon({
  size = 22,
  color = colors.textPrimary,
  strokeWidth = 2.5,
}: ChevronRightIconProps) {
  const chevron = size * CHEVRON_RATIO;

  return (
    <View style={[styles.container, { width: size, height: size }]}>
      <View
        style={[
          styles.chevron,
          {
            width: chevron,
            height: chevron,
            borderRightWidth: strokeWidth,
            borderBottomWidth: strokeWidth,
            borderColor: color,
            marginRight: size * 0.2,
          },
        ]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  chevron: {
    transform: [{ rotate: '-45deg' }],
  },
});
