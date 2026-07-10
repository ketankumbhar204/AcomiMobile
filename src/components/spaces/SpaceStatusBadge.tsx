import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { colors, radius, spacing, typography } from '../../theme';

type SpaceStatusBadgeProps = {
  pendingActionCount: number;
};

/** Subtle pending-actions hint for My Spaces cards. Hidden when count is 0. */
export function SpaceStatusBadge({ pendingActionCount }: SpaceStatusBadgeProps) {
  const { t } = useTranslation();
  if (pendingActionCount <= 0) {
    return null;
  }

  return (
    <View style={styles.badge}>
      <View style={styles.dot} />
      <Text style={styles.label}>
        {t('spaces.globalDashboard.pendingActions', { count: pendingActionCount })}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: spacing.xs,
    marginTop: spacing.xs,
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
    borderRadius: radius.full,
    backgroundColor: '#FFF7ED',
    borderWidth: 1,
    borderColor: '#FDBA7444',
  },
  dot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: '#EA580C',
  },
  label: {
    ...typography.caption,
    color: '#C2410C',
    fontWeight: '600',
  },
});
