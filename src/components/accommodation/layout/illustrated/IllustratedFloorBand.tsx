import React from 'react';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import type { AccommodationStatus } from '../../../../api/types';
import { colors, spacing, typography } from '../../../../theme';
import { StatusDot } from '../StatusDot';
import { synthesizeStatusDots } from './layoutStatusUtils';

type IllustratedFloorBandProps = {
  label: string;
  roomCount: number;
  occupied: number;
  available: number;
  bedCount: number;
  highlighted?: boolean;
  onPress: () => void;
  onLongPress?: () => void;
  menu?: React.ReactNode;
};

export function IllustratedFloorBand({
  label,
  roomCount,
  occupied,
  available,
  bedCount,
  highlighted = false,
  onPress,
  onLongPress,
  menu,
}: IllustratedFloorBandProps) {
  const slotCount = Math.max(roomCount, 1);
  const dots = synthesizeStatusDots({
    total: slotCount,
    occupied,
    available: available || Math.max(0, bedCount - occupied),
    maxDots: 10,
  });

  return (
    <Pressable
      onPress={onPress}
      onLongPress={onLongPress}
      style={({ pressed }) => [
        styles.row,
        highlighted && styles.rowHighlight,
        pressed && styles.pressed,
      ]}>
      <Text style={styles.label}>{label}</Text>
      <View style={styles.dots}>
        {dots.map((status, index) => (
          <StatusDot key={`${label}-dot-${index}`} status={status} size={10} />
        ))}
        {slotCount > dots.length ? (
          <Text style={styles.more}>+{slotCount - dots.length}</Text>
        ) : null}
      </View>
      {menu ? <View style={styles.menu}>{menu}</View> : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    gap: spacing.sm,
    minHeight: 44,
  },
  rowHighlight: {
    backgroundColor: `${colors.primary}10`,
  },
  pressed: {
    opacity: 0.9,
  },
  label: {
    ...typography.bodyStrong,
    width: 72,
    fontSize: 13,
  },
  dots: {
    flex: 1,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 5,
    alignItems: 'center',
  },
  more: {
    ...typography.caption,
    color: colors.muted,
    fontSize: 10,
  },
  menu: {
    marginLeft: spacing.xs,
  },
});
