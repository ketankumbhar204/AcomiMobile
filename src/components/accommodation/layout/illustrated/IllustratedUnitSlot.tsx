import React from 'react';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import type { AccommodationStatus } from '../../../../api/types';
import { colors, typography } from '../../../../theme';
import { StatusDot } from '../StatusDot';
import { getAccommodationSprite } from './spriteAssets';
import { statusBorderColor, statusTintColor } from './layoutStatusUtils';

type IllustratedUnitSlotProps = {
  label: string;
  status?: AccommodationStatus | null;
  subtitle?: string;
  ratioLabel?: string;
  highlighted?: boolean;
  onPress: () => void;
  onLongPress?: () => void;
  menu?: React.ReactNode;
};

export function IllustratedUnitSlot({
  label,
  status,
  subtitle,
  ratioLabel,
  highlighted = false,
  onPress,
  onLongPress,
  menu,
}: IllustratedUnitSlotProps) {
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
          source={getAccommodationSprite('unitSlot')}
          style={styles.plan}
          resizeMode="contain"
        />
        <Text style={styles.label} numberOfLines={1}>
          {label}
        </Text>
        {subtitle ? (
          <Text style={styles.subtitle} numberOfLines={1}>
            {subtitle}
          </Text>
        ) : null}
        {ratioLabel ? (
          <View style={styles.ratioRow}>
            {status ? <StatusDot status={status} size={8} /> : null}
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
    flex: 1,
    minWidth: 0,
    margin: 4,
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
    padding: 6,
    paddingBottom: 8,
  },
  plan: {
    width: '100%',
    height: 88,
  },
  label: {
    ...typography.bodyStrong,
    fontSize: 13,
    marginTop: 4,
    paddingHorizontal: 6,
  },
  subtitle: {
    ...typography.caption,
    fontSize: 10,
    color: colors.muted,
    marginTop: 1,
  },
  ratioRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 2,
  },
  ratio: {
    ...typography.caption,
    fontSize: 10,
    fontWeight: '700',
  },
  menu: {
    position: 'absolute',
    top: 4,
    right: 4,
    zIndex: 2,
  },
});
