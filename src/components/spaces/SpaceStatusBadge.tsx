import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { colors, radius, spacing, typography } from '../../theme';

type SpaceStatusBadgeProps = {
  pendingActionCount: number;
};

/** Pending-actions hint for My Spaces cards. Hidden when count is 0. */
export function SpaceStatusBadge({ pendingActionCount }: SpaceStatusBadgeProps) {
  const { t } = useTranslation();
  if (pendingActionCount <= 0) {
    return null;
  }

  return (
    <View style={styles.badge} accessibilityRole="text">
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
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: radius.full,
    backgroundColor: '#FFF7ED',
    borderWidth: 1,
    borderColor: '#FDBA7444',
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#EA580C',
  },
  label: {
    ...typography.caption,
    color: '#C2410C',
    fontWeight: '700',
    fontSize: 13,
  },
});
