import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import type { AccommodationStatus } from '../../../api/types';
import { colors, radius, shadows, spacing, typography } from '../../../theme';
import { getAccommodationStatusColor } from '../../../utils/accommodationStatus';
import { StatusDot } from './StatusDot';

type LayoutTileProps = {
  title: string;
  subtitle?: string;
  status?: AccommodationStatus | null;
  highlighted?: boolean;
  embedded?: boolean;
  onPress: () => void;
  onLongPress?: () => void;
  menu?: React.ReactNode;
  footer?: React.ReactNode;
  minHeight?: number;
};

export function LayoutTile({
  title,
  subtitle,
  status,
  highlighted = false,
  embedded = false,
  onPress,
  onLongPress,
  menu,
  footer,
  minHeight = 72,
}: LayoutTileProps) {
  const borderColor = highlighted
    ? colors.primary
    : status
      ? `${getAccommodationStatusColor(status)}66`
      : colors.border;

  return (
    <View style={[styles.wrap, embedded && styles.embedded, highlighted && styles.highlighted]}>
      <Pressable
        onPress={onPress}
        onLongPress={onLongPress}
        style={({ pressed }) => [
          styles.tile,
          embedded && styles.tileEmbedded,
          { minHeight, borderColor },
          pressed && styles.pressed,
        ]}>
        <View style={styles.body}>
          <View style={styles.titleRow}>
            <Text style={styles.title} numberOfLines={2}>
              {title}
            </Text>
            {status ? <StatusDot status={status} /> : null}
          </View>
          {subtitle ? (
            <Text style={styles.subtitle} numberOfLines={2}>
              {subtitle}
            </Text>
          ) : null}
          {footer}
        </View>
        {menu ? <View style={styles.menu}>{menu}</View> : null}
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    marginBottom: spacing.md,
  },
  embedded: {
    marginBottom: 0,
  },
  highlighted: {
    borderRadius: radius.card,
  },
  tile: {
    flexDirection: 'row',
    alignItems: 'stretch',
    backgroundColor: colors.white,
    borderRadius: radius.card,
    borderWidth: 2,
    overflow: 'hidden',
    ...shadows.sm,
  },
  tileEmbedded: {
    borderWidth: 0,
    borderRadius: 0,
    shadowOpacity: 0,
    elevation: 0,
  },
  pressed: {
    backgroundColor: colors.surface,
  },
  body: {
    flex: 1,
    padding: spacing.md,
    minWidth: 0,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  title: {
    ...typography.bodyStrong,
    flex: 1,
  },
  subtitle: {
    ...typography.caption,
    color: colors.textSecondary,
    marginTop: spacing.xs,
  },
  menu: {
    justifyContent: 'center',
    borderLeftWidth: 1,
    borderLeftColor: colors.border,
  },
});
