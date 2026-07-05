import React from 'react';
import {
  Image,
  StyleSheet,
  View,
  type ImageSourcePropType,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import { colors, radius } from '../../../../theme';

export type LayoutIllustrationSize = 'building' | 'floor' | 'unit' | 'room' | 'bed' | 'bedHero';

type LayoutIllustrationProps = {
  source: ImageSourcePropType;
  size?: LayoutIllustrationSize;
  style?: StyleProp<ViewStyle>;
};

const SIZES: Record<
  LayoutIllustrationSize,
  { width: number | `${number}%`; height: number }
> = {
  building: { width: '100%', height: 180 },
  floor: { width: 90, height: 90 },
  unit: { width: '100%', height: 100 },
  room: { width: '100%', height: 110 },
  bed: { width: 60, height: 80 },
  bedHero: { width: 120, height: 140 },
};

export function LayoutIllustration({
  source,
  size = 'unit',
  style,
}: LayoutIllustrationProps) {
  const dim = SIZES[size];

  return (
    <View
      style={[
        styles.frame,
        size === 'building' && styles.buildingFrame,
        size === 'unit' && styles.unitFrame,
        size === 'room' && styles.roomFrame,
        style,
      ]}>
      <Image source={source} style={[styles.image, dim]} resizeMode="contain" />
    </View>
  );
}

const styles = StyleSheet.create({
  frame: {
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  buildingFrame: {
    width: '100%',
    minHeight: 180,
    marginBottom: 12,
  },
  unitFrame: {
    width: '100%',
    marginBottom: 8,
  },
  roomFrame: {
    width: '100%',
    marginBottom: 8,
  },
  image: {
    width: '100%',
    height: 100,
  },
});
