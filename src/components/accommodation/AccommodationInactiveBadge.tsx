import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { colors, radius, spacing, typography } from '../../theme';

export function AccommodationInactiveBadge() {
  const { t } = useTranslation();

  return (
    <View style={styles.badge}>
      <View style={styles.dot} />
      <Text style={styles.label}>{t('accommodation.inactive.deactivated')}</Text>
    </View>
  );
}

export const accommodationInactiveCardStyle = {
  backgroundColor: '#F3F4F6',
  opacity: 0.92,
} as const;

export const accommodationInactiveIllustrationStyle = {
  opacity: 0.45,
} as const;

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: spacing.sm,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    backgroundColor: '#E5E7EB',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: radius.full,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.muted,
  },
  label: {
    ...typography.caption,
    fontWeight: '600',
    color: '#4B5563',
  },
});
