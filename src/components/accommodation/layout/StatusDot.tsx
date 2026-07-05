import React from 'react';
import { StyleSheet, View } from 'react-native';
import type { AccommodationStatus } from '../../../api/types';
import { getAccommodationStatusColor } from '../../../utils/accommodationStatus';

type StatusDotProps = {
  status: AccommodationStatus | null;
  size?: number;
};

export function StatusDot({ status, size = 10 }: StatusDotProps) {
  if (!status) {
    return null;
  }

  const color = getAccommodationStatusColor(status);

  return (
    <View
      style={[
        styles.dot,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: color,
        },
      ]}
    />
  );
}

const styles = StyleSheet.create({
  dot: {
    flexShrink: 0,
  },
});
