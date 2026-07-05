import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { typography } from '../../../../theme';
import { getOccupancyLevel, getOccupancyLevelColor } from './occupancyUtils';

type CircularOccupancyIndicatorProps = {
  percent: number;
  size?: number;
};

export function CircularOccupancyIndicator({
  percent,
  size = 52,
}: CircularOccupancyIndicatorProps) {
  const level = getOccupancyLevel(percent);
  const color = getOccupancyLevelColor(level);
  const clamped = Math.min(100, Math.max(0, percent));

  return (
    <View
      style={[
        styles.ring,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          borderColor: color,
        },
      ]}>
      <Text style={[styles.percent, { fontSize: size < 48 ? 11 : 13 }]}>{clamped}%</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  ring: {
    borderWidth: 4,
    backgroundColor: '#ffffff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  percent: {
    ...typography.bodyStrong,
    color: '#0f172a',
  },
});
