import React from 'react';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import type { AccommodationStatus } from '../../../../api/types';
import { colors, spacing, typography } from '../../../../theme';
import { StatusDot } from '../StatusDot';
import { getAccommodationSprite } from './spriteAssets';
import { statusBorderColor, statusTintColor } from './layoutStatusUtils';

type IllustratedRoomSlotProps = {
  label: string;
  status?: AccommodationStatus | null;
  ratioLabel?: string;
  highlighted?: boolean;
  onPress: () => void;
  onLongPress?: () => void;
  menu?: React.ReactNode;
};

export function IllustratedRoomSlot({
  label,
  status,
  ratioLabel,
  highlighted = false,
  onPress,
  onLongPress,
  menu,
}: IllustratedRoomSlotProps) {
  const border = statusBorderColor(status);

  return (
    <Pressable
      onPress={onPress}
      onLongPress={onLongPress}
      style={({ pressed }) => [styles.wrap, pressed && styles.pressed]}>
      <View
        style={[
          styles.slot,
          {
            borderColor: highlighted ? colors.primary : border,
            backgroundColor: statusTintColor(status, '18'),
          },
        ]}>
        <Image
          source={getAccommodationSprite('roomSlot')}
          style={styles.plan}
          resizeMode="contain"
        />
        <Text style={styles.label} numberOfLines={1}>
          {label}
        </Text>
        {ratioLabel ? (
          <View style={styles.ratioRow}>
            {status ? <StatusDot status={status} size={7} /> : null}
            <Text style={styles.ratio}>{ratioLabel}</Text>
          </View>
        ) : null}
      </View>
      {menu ? <View style={styles.menu}>{menu}</View> : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  wrap: {
    width: 96,
    marginHorizontal: 2,
    position: 'relative',
  },
  pressed: {
    opacity: 0.9,
  },
  slot: {
    borderWidth: 2,
    borderRadius: 8,
    overflow: 'hidden',
    alignItems: 'center',
    padding: 4,
    paddingBottom: 6,
  },
  plan: {
    width: '100%',
    height: 72,
  },
  label: {
    ...typography.caption,
    fontWeight: '700',
    fontSize: 11,
    marginTop: 4,
    paddingHorizontal: 4,
  },
  ratioRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    marginTop: 2,
  },
  ratio: {
    ...typography.caption,
    fontSize: 9,
    fontWeight: '600',
  },
  menu: {
    position: 'absolute',
    top: 2,
    right: 2,
    zIndex: 2,
  },
});
