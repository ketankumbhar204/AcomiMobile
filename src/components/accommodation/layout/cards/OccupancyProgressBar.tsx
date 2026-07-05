import React from 'react';
import { StyleSheet, View } from 'react-native';
import { radius, spacing } from '../../../../theme';
import { getOccupancyLevel, getOccupancyLevelColor } from './occupancyUtils';

type OccupancyProgressBarProps = {
  percent: number;
  height?: number;
};

export function OccupancyProgressBar({ percent, height = 8 }: OccupancyProgressBarProps) {
  const level = getOccupancyLevel(percent);
  const fillColor = getOccupancyLevelColor(level);
  const clamped = Math.min(100, Math.max(0, percent));

  return (
    <View style={[styles.track, { height }]}>
      <View style={[styles.fill, { width: `${clamped}%`, backgroundColor: fillColor }]} />
    </View>
  );
}

const styles = StyleSheet.create({
  track: {
    width: '100%',
    backgroundColor: '#e2e8f0',
    borderRadius: radius.full,
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
    borderRadius: radius.full,
  },
});
