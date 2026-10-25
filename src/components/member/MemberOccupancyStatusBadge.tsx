import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import type { MemberOccupancyStatus } from '../../api/types';
import { radius, spacing, typography } from '../../theme';
import {
  getMemberOccupancyStatusColor,
  getMemberOccupancyStatusLabelKey,
  resolveMemberOccupancyStatus,
} from '../../utils/memberOccupancyStatus';

type MemberOccupancyStatusBadgeProps = {
  status?: MemberOccupancyStatus | null;
  compact?: boolean;
};

export function MemberOccupancyStatusBadge({
  status,
  compact = false,
}: MemberOccupancyStatusBadgeProps) {
  const { t } = useTranslation();
  const resolved = resolveMemberOccupancyStatus(status);
  const color = getMemberOccupancyStatusColor(resolved);

  return (
    <View
      style={[
        styles.badge,
        compact && styles.badgeCompact,
        { borderColor: `${color}44`, backgroundColor: `${color}14` },
      ]}>
      <View style={[styles.dot, compact && styles.dotCompact, { backgroundColor: color }]} />
      <Text style={[styles.label, compact && styles.labelCompact, { color }]}>
        {t(getMemberOccupancyStatusLabelKey(resolved))}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: spacing.sm,
    borderWidth: 1,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: radius.full,
  },
  badgeCompact: {
    gap: 4,
    paddingHorizontal: 6,
    paddingVertical: 1,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  dotCompact: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  label: {
    ...typography.caption,
    fontWeight: '600',
  },
  labelCompact: {
    fontSize: 11,
    lineHeight: 14,
  },
});
