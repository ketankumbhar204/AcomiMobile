import React from 'react';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import type { AccommodationStatus } from '../../../../api/types';
import { colors, typography } from '../../../../theme';
import { getBedSpriteForStatus } from './spriteAssets';

type IllustratedBedProps = {
  label: string;
  status: AccommodationStatus;
  highlighted?: boolean;
  onPress: () => void;
  onLongPress?: () => void;
  menu?: React.ReactNode;
};

/** Full-size top-down bed illustration with status glow (reference style). */
export function IllustratedBed({
  label,
  status,
  highlighted = false,
  onPress,
  onLongPress,
  menu,
}: IllustratedBedProps) {
  return (
    <Pressable
      onPress={onPress}
      onLongPress={onLongPress}
      style={({ pressed }) => [styles.wrap, pressed && styles.pressed]}>
      <View style={[styles.bedSlot, highlighted && styles.highlighted]}>
        <Image
          source={getBedSpriteForStatus(status)}
          style={styles.bedImg}
          resizeMode="contain"
        />
      </View>
      <Text style={styles.label}>{label}</Text>
      {menu ? <View style={styles.menu}>{menu}</View> : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  wrap: {
    alignItems: 'center',
    minWidth: 72,
    position: 'relative',
    paddingHorizontal: 2,
  },
  pressed: {
    opacity: 0.88,
    transform: [{ scale: 0.97 }],
  },
  bedSlot: {
    width: 76,
    height: 96,
    alignItems: 'center',
    justifyContent: 'center',
  },
  highlighted: {
    transform: [{ scale: 1.06 }],
  },
  bedImg: {
    width: 76,
    height: 96,
  },
  label: {
    ...typography.bodyStrong,
    fontSize: 15,
    marginTop: 2,
    color: colors.textPrimary,
  },
  menu: {
    position: 'absolute',
    top: -2,
    right: -6,
    zIndex: 2,
  },
});
