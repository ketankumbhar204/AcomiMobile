import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import type { GlobalActivityItem } from '../../api/types';
import { colors, radius, spacing, typography } from '../../theme';

type RecentActivityCardProps = {
  items: GlobalActivityItem[];
  onPress: () => void;
};

/**
 * Low-priority recent activity strip for My Spaces.
 * Shows at most one line — full history opens on tap.
 */
export function RecentActivityCard({ items, onPress }: RecentActivityCardProps) {
  const { t } = useTranslation();
  const latest = items[0];
  const count = items.length;

  if (count === 0) {
    return (
      <View style={styles.card} accessibilityRole="summary">
        <Text style={styles.title}>{t('spaces.globalDashboard.activityTitle')}</Text>
        <Text style={styles.empty}>{t('spaces.globalDashboard.activityEmptyTitle')}</Text>
      </View>
    );
  }

  // Prefer the concrete latest title — easier to glance than a count alone.
  const summary = latest.title || t('spaces.globalDashboard.activityNewUpdates', { count });

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`${t('spaces.globalDashboard.activityTitle')}. ${summary}`}
      style={({ pressed }) => [styles.card, styles.pressable, pressed && styles.pressed]}>
      <View style={styles.textCol}>
        <Text style={styles.title}>{t('spaces.globalDashboard.activityTitle')}</Text>
        <Text style={styles.summary} numberOfLines={1}>
          {summary}
        </Text>
      </View>
      <Text style={styles.cta}>{t('spaces.globalDashboard.viewArrow')}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.white,
    borderRadius: radius.card,
    borderWidth: 1,
    borderColor: colors.border,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    gap: spacing.xs,
    minHeight: 64,
  },
  pressable: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  pressed: {
    opacity: 0.8,
    backgroundColor: colors.surface,
  },
  textCol: {
    flex: 1,
    minWidth: 0,
    gap: 2,
  },
  title: {
    ...typography.caption,
    fontWeight: '700',
    color: colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
    fontSize: 12,
  },
  summary: {
    ...typography.body,
    fontWeight: '600',
    color: colors.textPrimary,
    fontSize: 16,
  },
  empty: {
    ...typography.body,
    color: colors.textSecondary,
    fontSize: 15,
  },
  cta: {
    ...typography.body,
    fontWeight: '700',
    color: colors.primaryDark,
    fontSize: 15,
  },
});
