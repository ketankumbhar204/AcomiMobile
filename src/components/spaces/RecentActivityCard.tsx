import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { ChevronRight, Clock } from 'lucide-react-native';
import type { GlobalActivityItem } from '../../api/types';
import { colors, radius, shadows, spacing, typography } from '../../theme';

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
        <View style={styles.iconWrap}>
          <Clock size={18} color={colors.muted} strokeWidth={2.2} />
        </View>
        <View style={styles.textCol}>
          <Text style={styles.title}>{t('spaces.globalDashboard.activityTitle')}</Text>
          <Text style={styles.empty}>{t('spaces.globalDashboard.activityEmptyTitle')}</Text>
        </View>
      </View>
    );
  }

  const summary = latest.title || t('spaces.globalDashboard.activityNewUpdates', { count });

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`${t('spaces.globalDashboard.activityTitle')}. ${summary}`}
      style={({ pressed }) => [styles.card, styles.pressable, pressed && styles.pressed]}>
      <View style={styles.iconWrap}>
        <Clock size={18} color={colors.primaryDark} strokeWidth={2.2} />
      </View>
      <View style={styles.textCol}>
        <Text style={styles.title}>{t('spaces.globalDashboard.activityTitle')}</Text>
        <Text style={styles.summary} numberOfLines={1}>
          {summary}
        </Text>
      </View>
      <ChevronRight size={18} color={colors.muted} strokeWidth={2.4} />
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
    paddingHorizontal: spacing.md,
    gap: spacing.md,
    minHeight: 68,
    flexDirection: 'row',
    alignItems: 'center',
    ...shadows.sm,
  },
  pressable: {},
  pressed: {
    opacity: 0.8,
    backgroundColor: colors.surface,
  },
  iconWrap: {
    width: 36,
    height: 36,
    borderRadius: radius.button,
    backgroundColor: colors.lightGreen,
    alignItems: 'center',
    justifyContent: 'center',
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
    fontSize: 11,
  },
  summary: {
    ...typography.body,
    fontWeight: '600',
    color: colors.textPrimary,
    fontSize: 15,
  },
  empty: {
    ...typography.body,
    color: colors.textSecondary,
    fontSize: 14,
  },
});
