import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet, View, ViewStyle } from 'react-native';
import { colors, radius, spacing } from '../../theme';

type SkeletonProps = {
  width?: number | `${number}%`;
  height?: number;
  style?: ViewStyle;
  borderRadius?: number;
};

export function Skeleton({
  width = '100%',
  height = 16,
  style,
  borderRadius = radius.sm,
}: SkeletonProps) {
  const opacity = useRef(new Animated.Value(0.4)).current;

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, {
          toValue: 1,
          duration: 700,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 0.4,
          duration: 700,
          useNativeDriver: true,
        }),
      ]),
    );
    animation.start();
    return () => animation.stop();
  }, [opacity]);

  return (
    <Animated.View
      style={[
        styles.base,
        { width, height, borderRadius, opacity },
        style,
      ]}
    />
  );
}

export function SkeletonCard() {
  return (
    <View style={styles.card}>
      <View style={styles.row}>
        <Skeleton width={48} height={48} borderRadius={radius.button} />
        <View style={styles.textGroup}>
          <Skeleton width="70%" height={14} />
          <Skeleton width="40%" height={12} style={styles.gap} />
        </View>
      </View>
    </View>
  );
}

/** Room + bed placeholders for inventory lists (replaces a spinner). */
export function InventoryListSkeleton({ cards = 2 }: { cards?: number }) {
  return (
    <View style={styles.inventoryStack}>
      {Array.from({ length: cards }, (_, index) => (
        <View key={index} style={styles.inventoryCard}>
          <Skeleton width="42%" height={14} />
          <Skeleton width="68%" height={12} style={styles.gap} />
          <View style={styles.bedRow}>
            <Skeleton width={72} height={72} borderRadius={radius.card} />
            <Skeleton width={72} height={72} borderRadius={radius.card} />
            <Skeleton width={72} height={72} borderRadius={radius.card} />
          </View>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  base: {
    backgroundColor: colors.border,
  },
  card: {
    backgroundColor: colors.white,
    borderRadius: radius.card,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  textGroup: {
    flex: 1,
  },
  gap: {
    marginTop: spacing.sm,
  },
  inventoryStack: {
    gap: spacing.md,
  },
  inventoryCard: {
    backgroundColor: colors.white,
    borderRadius: radius.card,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
  },
  bedRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.md,
  },
});
