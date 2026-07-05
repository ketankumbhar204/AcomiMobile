import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { radius, typography } from '../../../../theme';
import type { OccupancyLevel } from './occupancyUtils';
import { getOccupancyLevelColor } from './occupancyUtils';

type OccupancyLevelBadgeProps = {
  level: OccupancyLevel;
};

export function OccupancyLevelBadge({ level }: OccupancyLevelBadgeProps) {
  const { t } = useTranslation();
  const color = getOccupancyLevelColor(level);

  return (
    <View style={[styles.badge, { backgroundColor: `${color}18` }]}>
      <View style={[styles.dot, { backgroundColor: color }]} />
      <Text style={[styles.label, { color }]}>
        {t(`accommodation.layout.dashboard.level.${level}`)}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: radius.full,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  label: {
    ...typography.caption,
    fontWeight: '700',
    fontSize: 11,
  },
});
