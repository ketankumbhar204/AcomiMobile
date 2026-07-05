import React from 'react';
import { Image, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import { colors, radius, shadows } from '../../../../theme';
import {
  getPlanBgAsset,
  type AccommodationPlanBgKey,
} from './accommodationLayoutAssets';

type PlanImageFrameProps = {
  plan: AccommodationPlanBgKey;
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  minHeight?: number;
};

export function PlanImageFrame({
  plan,
  children,
  style,
  minHeight = 200,
}: PlanImageFrameProps) {
  return (
    <View style={[styles.frame, { minHeight }, style]}>
      <Image
        source={getPlanBgAsset(plan)}
        style={styles.background}
        resizeMode="cover"
        accessibilityIgnoresInvertColors
      />
      <View style={styles.scrim} />
      <View style={styles.content}>{children}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  frame: {
    borderRadius: radius.card,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.border,
    ...shadows.md,
  },
  background: {
    ...StyleSheet.absoluteFill,
    width: '100%',
    height: '100%',
  },
  scrim: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(255, 255, 255, 0.72)',
  },
  content: {
    flex: 1,
    padding: 12,
  },
});
