import React, { useEffect, useRef } from 'react';
import { Animated, Easing, StyleSheet, Text, View } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import { colors, typography } from '../../theme';

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

export type HealthScoreRingProps = {
  score: number;
  color: string;
  size?: number;
  strokeWidth?: number;
  /** Optional node centered under the score (e.g. shield icon). */
  footer?: React.ReactNode;
};

/**
 * Animated circular progress for Space Health (0–100%).
 */
export function HealthScoreRing({
  score,
  color,
  size = 96,
  strokeWidth = 8,
  footer,
}: HealthScoreRingProps) {
  const progress = useRef(new Animated.Value(0)).current;
  const clamped = Math.max(0, Math.min(100, Math.round(score)));
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;

  useEffect(() => {
    progress.setValue(0);
    Animated.timing(progress, {
      toValue: clamped / 100,
      duration: 750,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false,
    }).start();
  }, [clamped, progress]);

  const strokeDashoffset = progress.interpolate({
    inputRange: [0, 1],
    outputRange: [circumference, 0],
  });

  return (
    <View style={{ width: size, height: size }}>
      <Svg width={size} height={size} style={StyleSheet.absoluteFill}>
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={colors.border}
          strokeWidth={strokeWidth}
          fill="none"
        />
        <AnimatedCircle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={color}
          strokeWidth={strokeWidth}
          fill="none"
          strokeLinecap="round"
          strokeDasharray={`${circumference} ${circumference}`}
          strokeDashoffset={strokeDashoffset}
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
        />
      </Svg>
      <View style={[StyleSheet.absoluteFill, styles.center]} pointerEvents="none">
        <Text
          style={[styles.score, { color, fontSize: size >= 88 ? 22 : 12 }]}
          allowFontScaling={false}>
          {`${clamped}%`}
        </Text>
        {footer}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  center: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  score: {
    ...typography.bodyStrong,
    fontWeight: '800',
    textAlign: 'center',
    includeFontPadding: false,
  },
});
