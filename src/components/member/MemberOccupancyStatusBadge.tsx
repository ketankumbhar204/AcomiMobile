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
};

export function MemberOccupancyStatusBadge({ status }: MemberOccupancyStatusBadgeProps) {
  const { t } = useTranslation();
  const resolved = resolveMemberOccupancyStatus(status);
  const color = getMemberOccupancyStatusColor(resolved);

  return (
    <View style={[styles.badge, { borderColor: `${color}44`, backgroundColor: `${color}14` }]}>
      <View style={[styles.dot, { backgroundColor: color }]} />
      <Text style={[styles.label, { color }]}>
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
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  label: {
    ...typography.caption,
    fontWeight: '600',
  },
});
