import React from 'react';
import {
  Image,
  Pressable,
  StyleSheet,
  Text,
  View,
  type ImageStyle,
  type StyleProp,
} from 'react-native';
import type { AccommodationStatus } from '../../../../api/types';
import { colors, radius, spacing, typography } from '../../../../theme';
import { getAccommodationStatusColor } from '../../../../utils/accommodationStatus';
import { StatusDot } from '../StatusDot';
import {
  getSpriteAsset,
  type AccommodationSpriteKey,
} from './accommodationLayoutAssets';

export type ImageEntityTileProps = {
  sprite: AccommodationSpriteKey;
  label: string;
  status?: AccommodationStatus | null;
  ratioLabel?: string;
  subtitle?: string;
  highlighted?: boolean;
  compact?: boolean;
  wide?: boolean;
  onPress: () => void;
  onLongPress?: () => void;
  menu?: React.ReactNode;
  imageStyle?: StyleProp<ImageStyle>;
};

export function ImageEntityTile({
  sprite,
  label,
  status,
  ratioLabel,
  subtitle,
  highlighted = false,
  compact = false,
  wide = false,
  onPress,
  onLongPress,
  menu,
  imageStyle,
}: ImageEntityTileProps) {
  const statusColor = status ? getAccommodationStatusColor(status) : colors.border;

  return (
    <Pressable
      onPress={onPress}
      onLongPress={onLongPress}
      style={({ pressed }) => [
        styles.root,
        wide && styles.rootWide,
        compact && styles.rootCompact,
        {
          borderColor: highlighted ? colors.primary : `${statusColor}cc`,
          backgroundColor: highlighted ? `${colors.primary}10` : `${statusColor}12`,
        },
        pressed && styles.pressed,
      ]}>
      <Image
        source={getSpriteAsset(sprite)}
        style={[
          styles.sprite,
          compact && styles.spriteCompact,
          wide && styles.spriteWide,
          imageStyle,
        ]}
        resizeMode="cover"
        accessibilityIgnoresInvertColors
      />
      <View style={styles.meta}>
        {menu ? <View style={styles.menu}>{menu}</View> : null}
        <Text
          style={[styles.label, compact && styles.labelCompact]}
          numberOfLines={2}>
          {label}
        </Text>
        {subtitle ? (
          <Text style={styles.subtitle} numberOfLines={1}>
            {subtitle}
          </Text>
        ) : null}
        {ratioLabel ? (
          <View style={styles.ratioRow}>
            {status ? <StatusDot status={status} size={7} /> : null}
            <Text style={styles.ratio}>{ratioLabel}</Text>
          </View>
        ) : null}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  root: {
    borderWidth: 2,
    borderRadius: radius.card,
    overflow: 'hidden',
    backgroundColor: colors.white,
    minHeight: 108,
  },
  rootCompact: {
    minHeight: 92,
    width: 84,
  },
  rootWide: {
    minHeight: 88,
  },
  pressed: {
    opacity: 0.9,
  },
  sprite: {
    width: '100%',
    height: 56,
    backgroundColor: colors.surface,
  },
  spriteCompact: {
    height: 44,
  },
  spriteWide: {
    height: 52,
  },
  meta: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    alignItems: 'center',
    position: 'relative',
  },
  menu: {
    position: 'absolute',
    top: -44,
    right: 2,
    zIndex: 2,
  },
  label: {
    ...typography.bodyStrong,
    fontSize: 13,
    textAlign: 'center',
  },
  labelCompact: {
    fontSize: 11,
  },
  subtitle: {
    ...typography.caption,
    color: colors.muted,
    marginTop: 2,
    textAlign: 'center',
  },
  ratioRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xxs,
    marginTop: spacing.xxs,
  },
  ratio: {
    ...typography.caption,
    fontSize: 10,
    fontWeight: '600',
    color: colors.textSecondary,
  },
});
