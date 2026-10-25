import React from 'react';
import {
  Image,
  StyleSheet,
  View,
  type ImageStyle,
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

/**
 * Width and height are set on the image itself. A percentage-sized image
 * inside a centered frame collapses to a blank gap on Android.
 */
const ART: Record<LayoutIllustrationSize, { frame: ViewStyle; image: ImageStyle }> = {
  building: {
    frame: { width: '100%', height: 160 },
    image: { width: '100%', height: 160 },
  },
  floor: {
    frame: { width: '100%', height: 96 },
    image: { width: '100%', height: 96 },
  },
  unit: {
    frame: { width: '100%', height: 100 },
    image: { width: '100%', height: 100 },
  },
  room: {
    frame: { width: '100%', height: 112 },
    image: { width: '100%', height: 112 },
  },
  bed: {
    frame: { width: 72, height: 72, alignSelf: 'center' },
    image: { width: 72, height: 72 },
  },
  bedHero: {
    frame: { width: 112, height: 112, alignSelf: 'center' },
    image: { width: 112, height: 112 },
  },
};

export function LayoutIllustration({
  source,
  size = 'unit',
  style,
}: LayoutIllustrationProps) {
  const art = ART[size];
  return (
    <View collapsable={false} style={[styles.frame, art.frame, style]}>
      <Image
        source={source}
        style={[art.image, styles.image]}
        resizeMode="contain"
        fadeDuration={0}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  frame: {
    alignSelf: 'stretch',
  },
  image: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
  },
});
