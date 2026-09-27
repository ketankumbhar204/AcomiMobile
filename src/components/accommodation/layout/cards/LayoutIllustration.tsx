import React from 'react';
import {
  Image,
  StyleSheet,
  View,
  type ImageSourcePropType,
  type StyleProp,
  type ViewStyle,
} from 'react-native';

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
  bedHero: { width: 112, height: 112 },
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
        size === 'bed' && styles.bedFrame,
        size === 'bedHero' && styles.bedHeroFrame,
        style,
      ]}>
      <Image
        source={source}
        style={[
          styles.image,
          dim,
          (size === 'bed' || size === 'bedHero') && styles.containedImage,
        ]}
        resizeMode="contain"
      />
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
  bedFrame: {
    width: 60,
    height: 80,
  },
  bedHeroFrame: {
    width: 112,
    height: 112,
  },
  image: {
    width: '100%',
    height: 100,
  },
  containedImage: {
    width: '100%',
    height: '100%',
  },
});
