import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import type { AccommodationStatus } from '../../api/types';
import { radius, spacing, typography } from '../../theme';
import {
  getAccommodationStatusColor,
  getAccommodationStatusLabelKey,
} from '../../utils/accommodationStatus';

type AccommodationStatusBadgeProps = {
  status: AccommodationStatus;
};

export function AccommodationStatusBadge({ status }: AccommodationStatusBadgeProps) {
  const { t } = useTranslation();
  const color = getAccommodationStatusColor(status);

  return (
    <View style={[styles.badge, { borderColor: `${color}44`, backgroundColor: `${color}14` }]}>
      <View style={[styles.dot, { backgroundColor: color }]} />
      <Text style={[styles.label, { color }]}>{t(getAccommodationStatusLabelKey(status))}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: spacing.xs,
    borderWidth: 1,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: radius.full,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  label: {
    ...typography.caption,
    fontSize: 11,
    lineHeight: 14,
    fontWeight: '600',
  },
});
