import React, { memo, useMemo } from 'react';
import {
  Pressable,
  StyleSheet,
  Text,
  View,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { ChevronRight, HeartPulse } from 'lucide-react-native';
import type { HealthBandId, SpaceHealthResult } from '../../spaceLifecycle/health';
import { colors, radius, shadows, spacing, typography } from '../../theme';
import { HealthScoreRing } from './HealthScoreRing';

export type DashboardSpaceHealthCardProps = {
  health: SpaceHealthResult;
  onPress?: () => void;
  style?: StyleProp<ViewStyle>;
};

function bandColor(band: HealthBandId): string {
  switch (band) {
    case 'excellent':
    case 'healthy':
      return colors.success;
    case 'needsImprovement':
      return '#D97706';
    case 'atRisk':
      return '#EA580C';
    case 'critical':
      return '#DC2626';
    default:
      return colors.primaryDark;
  }
}

/**
 * Compact Space Health banner — secondary insight under the owner hero.
 * Full factor breakdown lives on DashboardSpaceHealthScreen.
 */
export const DashboardSpaceHealthCard = memo(function DashboardSpaceHealthCard({
  health,
  onPress,
  style,
}: DashboardSpaceHealthCardProps) {
  const { t } = useTranslation();

  const issueCount = useMemo(
    () => health.topFactors.filter(factor => factor.tone !== 'positive').length,
    [health.topFactors],
  );

  if (!health.available) {
    const emptyBody = (
      <>
        <View style={styles.headerRow}>
          <View style={styles.iconWrap}>
            <HeartPulse size={16} color={colors.primaryDark} strokeWidth={2.2} />
          </View>
          <Text style={styles.title}>{t('dashboard.health.title')}</Text>
        </View>
        <Text style={styles.emptyBody} numberOfLines={2}>
          {t('dashboard.health.emptyBody')}
        </Text>
      </>
    );

    if (!onPress) {
      return (
        <View
          style={[styles.banner, style]}
          accessibilityRole="summary"
          accessibilityLabel={t('dashboard.health.emptyTitle')}>
          {emptyBody}
        </View>
      );
    }

    return (
      <Pressable
        onPress={onPress}
        style={({ pressed }) => [
          styles.banner,
          style,
          pressed && styles.pressed,
        ]}
        accessibilityRole="button"
        accessibilityLabel={t('dashboard.health.emptyTitle')}
        accessibilityHint={t('dashboard.health.a11y.openDetails')}>
        {emptyBody}
      </Pressable>
    );
  }

  const bandLabel = t(health.bandLabelKey);
  const accent = bandColor(health.band);
  const summary =
    issueCount > 0
      ? t('dashboard.health.banner.issuesAttention', { count: issueCount })
      : t(health.summaryKey);
  const a11y = t('dashboard.health.a11y.banner', {
    score: health.score,
    band: bandLabel,
  });

  const body = (
    <>
      <View style={styles.headerRow}>
        <View style={styles.iconWrap}>
          <HeartPulse size={16} color={colors.primaryDark} strokeWidth={2.2} />
        </View>
        <Text style={styles.title}>{t('dashboard.health.title')}</Text>
        {onPress ? (
          <View style={styles.chevron} pointerEvents="none">
            <ChevronRight size={16} color={colors.muted} strokeWidth={2.4} />
          </View>
        ) : null}
      </View>

      <View style={styles.contentRow}>
        <HealthScoreRing
          score={health.score}
          color={accent}
          size={52}
          strokeWidth={4}
        />
        <View style={styles.copy}>
          <View style={styles.bandRow}>
            <View style={[styles.bandDot, { backgroundColor: accent }]} />
            <Text style={[styles.band, { color: accent }]} numberOfLines={1}>
              {bandLabel}
            </Text>
          </View>
          <Text style={styles.summary} numberOfLines={2}>
            {summary}
          </Text>
        </View>
      </View>
    </>
  );

  if (!onPress) {
    return (
      <View
        style={[styles.banner, style]}
        accessibilityRole="summary"
        accessibilityLabel={a11y}>
        {body}
      </View>
    );
  }

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.banner,
        style,
        pressed && styles.pressed,
      ]}
      accessibilityRole="button"
      accessibilityLabel={a11y}
      accessibilityHint={t('dashboard.health.a11y.openDetails')}>
      {body}
    </Pressable>
  );
});

const styles = StyleSheet.create({
  banner: {
    marginBottom: spacing.md,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: radius.section,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: `${colors.primary}33`,
    ...shadows.sm,
  },
  pressed: {
    opacity: 0.92,
    borderColor: `${colors.primary}66`,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.xs,
  },
  iconWrap: {
    width: 28,
    height: 28,
    borderRadius: radius.button,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: `${colors.primaryDark}14`,
  },
  title: {
    ...typography.bodyStrong,
    color: colors.textPrimary,
    flex: 1,
  },
  chevron: {
    marginLeft: 'auto',
  },
  contentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  copy: {
    flex: 1,
    minWidth: 0,
    gap: 2,
  },
  bandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  bandDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
  },
  band: {
    ...typography.bodyStrong,
    flexShrink: 1,
  },
  summary: {
    ...typography.caption,
    color: colors.muted,
  },
  emptyBody: {
    ...typography.caption,
    color: colors.muted,
  },
});
