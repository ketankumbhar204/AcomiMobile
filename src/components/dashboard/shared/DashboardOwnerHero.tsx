import React, { useMemo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import {
  ChevronRight,
  Hand,
  HeartPulse,
  type LucideIcon,
} from 'lucide-react-native';
import type { HealthBandId, SpaceHealthResult } from '../../../spaceLifecycle/health';
import { colors, radius, shadows, spacing, typography } from '../../../theme';
import { HealthScoreRing } from '../HealthScoreRing';

const RING_SIZE = 46;
const RING_STROKE = 4;

type DashboardOwnerHeroProps = {
  spaceName: string;
  spaceTypeLabel?: string;
  /** Optional override; defaults to operations overview copy. */
  subtitle?: string;
  /** Hide time-of-day greeting (e.g. Quick Setup preview). Default true. */
  showGreeting?: boolean;
  /** Leading icon; defaults to Hand. */
  icon?: LucideIcon;
  /** When set, embeds Space Health in a second equal-width column. */
  health?: SpaceHealthResult | null;
  /** Entire left half → Space Details (or similar). */
  onWelcomePress?: () => void;
  /** Entire right half → Space Health screen. */
  onHealthPress?: () => void;
};

function greetingKey(hour: number): string {
  if (hour < 12) {
    return 'dashboard.owner.greetingMorning';
  }
  if (hour < 17) {
    return 'dashboard.owner.greetingAfternoon';
  }
  return 'dashboard.owner.greetingEvening';
}

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
 * Owner dashboard hero. When health is provided, uses a strict 50:50 split:
 * welcome (left) + Space Health (right). Each half is one tap target.
 */
export function DashboardOwnerHero({
  spaceName,
  spaceTypeLabel: _spaceTypeLabel,
  subtitle,
  showGreeting = true,
  icon: Icon = Hand,
  health = null,
  onWelcomePress,
  onHealthPress,
}: DashboardOwnerHeroProps) {
  const { t } = useTranslation();
  const greeting = useMemo(() => t(greetingKey(new Date().getHours())), [t]);
  const subtitleText = subtitle ?? t('dashboard.owner.heroSubtitle');
  const showHealth = health != null;

  const welcomeInner = (
    <>
      <View style={styles.greetingRow}>
        <View style={styles.iconWrap} accessibilityElementsHidden>
          <Icon size={16} color={colors.primaryDark} strokeWidth={2.2} />
        </View>
        {showGreeting ? <Text style={styles.greeting}>{greeting}</Text> : null}
      </View>

      <Text style={styles.spaceName} numberOfLines={2}>
        {spaceName}
      </Text>

      <Text style={styles.subtitle} numberOfLines={2}>
        {subtitleText}
      </Text>
    </>
  );

  const welcome = onWelcomePress ? (
    <Pressable
      onPress={onWelcomePress}
      style={({ pressed }) => [
        styles.column,
        styles.welcomeCol,
        pressed && styles.pressed,
      ]}
      accessibilityRole="button"
      accessibilityLabel={`${greeting}. ${spaceName}. ${subtitleText}`}>
      {welcomeInner}
    </Pressable>
  ) : (
    <View style={[styles.column, styles.welcomeCol]}>{welcomeInner}</View>
  );

  return (
    <View
      style={[styles.wrap, showHealth && styles.wrapSplit]}
      accessibilityRole="header">
      <View
        style={[styles.decorClip, showHealth && styles.decorClipHalf]}
        pointerEvents="none">
        <View style={styles.decorBlobPrimary} />
        <View style={styles.decorBlobSecondary} />
        <View style={styles.decorRing} />
      </View>

      {showHealth && health ? (
        <View style={styles.splitRow}>
          {welcome}
          <View style={styles.divider} />
          <HealthColumn health={health} onPress={onHealthPress} />
        </View>
      ) : (
        welcome
      )}
    </View>
  );
}

function HealthColumn({
  health,
  onPress,
}: {
  health: SpaceHealthResult;
  onPress?: () => void;
}) {
  const { t } = useTranslation();

  const issueCount = useMemo(
    () => health.topFactors.filter(factor => factor.tone !== 'positive').length,
    [health.topFactors],
  );

  const accent = health.available ? bandColor(health.band) : colors.primaryDark;
  const a11y = health.available
    ? t('dashboard.health.a11y.banner', {
        score: health.score,
        band: t(health.bandLabelKey),
      })
    : t('dashboard.health.emptyTitle');

  const issueSummary =
    issueCount > 0
      ? t('dashboard.health.banner.issuesShort', { count: issueCount })
      : t(health.summaryKey);

  const inner = (
    <View style={styles.healthInner}>
      <View style={styles.healthHeader}>
        <View style={styles.healthIconWrap}>
          <HeartPulse size={14} color={colors.primaryDark} strokeWidth={2.2} />
        </View>
        <Text style={styles.healthTitle} numberOfLines={1}>
          {t('dashboard.health.title')}
        </Text>
        {onPress ? (
          <ChevronRight size={16} color={colors.muted} strokeWidth={2.4} />
        ) : null}
      </View>

      {!health.available ? (
        <Text style={styles.healthEmpty} numberOfLines={3}>
          {t('dashboard.health.emptyBody')}
        </Text>
      ) : (
        <View style={styles.healthBody}>
          <View style={styles.ringSlot}>
            <HealthScoreRing
              score={health.score}
              color={accent}
              size={RING_SIZE}
              strokeWidth={RING_STROKE}
            />
          </View>
          <View style={styles.healthCopy}>
            <View style={styles.bandRow}>
              <View style={[styles.bandDot, { backgroundColor: accent }]} />
              <Text style={[styles.band, { color: accent }]} numberOfLines={1}>
                {t(health.bandLabelKey)}
              </Text>
            </View>
            <Text style={styles.healthSummary} numberOfLines={2}>
              {issueSummary}
            </Text>
          </View>
        </View>
      )}
    </View>
  );

  if (!onPress) {
    return (
      <View
        style={styles.column}
        accessibilityRole="summary"
        accessibilityLabel={a11y}>
        {inner}
      </View>
    );
  }

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.column, pressed && styles.pressed]}
      accessibilityRole="button"
      accessibilityLabel={a11y}
      accessibilityHint={t('dashboard.health.a11y.openDetails')}>
      {inner}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  wrap: {
    marginBottom: spacing.lg,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.sm,
    borderRadius: radius.section,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: `${colors.primary}33`,
    overflow: 'hidden',
    position: 'relative',
    ...shadows.sm,
  },
  wrapSplit: {
    // Keep compact — no extra height for a CTA button.
    minHeight: 132,
  },
  decorClip: {
    ...StyleSheet.absoluteFillObject,
    overflow: 'hidden',
  },
  decorClipHalf: {
    right: '50%',
  },
  decorBlobPrimary: {
    position: 'absolute',
    width: 110,
    height: 110,
    borderRadius: 55,
    backgroundColor: `${colors.primary}28`,
    top: -40,
    right: -24,
  },
  decorBlobSecondary: {
    position: 'absolute',
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: `${colors.primaryDark}18`,
    bottom: -20,
    right: 20,
  },
  decorRing: {
    position: 'absolute',
    width: 48,
    height: 48,
    borderRadius: 24,
    borderWidth: 6,
    borderColor: `${colors.primary}22`,
    top: 8,
    right: 64,
  },
  splitRow: {
    flexDirection: 'row',
    alignItems: 'stretch',
    zIndex: 1,
  },
  column: {
    flex: 1,
    flexBasis: 0,
    minWidth: 0,
    paddingHorizontal: spacing.sm,
    justifyContent: 'center',
  },
  welcomeCol: {
    gap: spacing.xs,
  },
  divider: {
    width: 1,
    backgroundColor: colors.border,
    alignSelf: 'stretch',
    marginVertical: 2,
  },
  greetingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  iconWrap: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.lightGreen,
    borderWidth: 1,
    borderColor: `${colors.primary}33`,
    alignItems: 'center',
    justifyContent: 'center',
  },
  greeting: {
    ...typography.caption,
    color: colors.textPrimary,
    fontWeight: '600',
  },
  spaceName: {
    ...typography.h2,
    fontSize: 22,
    lineHeight: 26,
    color: colors.primaryDark,
    fontWeight: '800',
  },
  subtitle: {
    ...typography.caption,
    fontSize: 11,
    lineHeight: 14,
    color: colors.muted,
    fontWeight: '500',
  },
  healthInner: {
    gap: spacing.sm,
    width: '100%',
  },
  healthHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    width: '100%',
  },
  healthIconWrap: {
    width: 26,
    height: 26,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.lightGreen,
    flexShrink: 0,
  },
  healthTitle: {
    ...typography.caption,
    color: colors.textPrimary,
    fontWeight: '700',
    flex: 1,
    minWidth: 0,
  },
  healthBody: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    width: '100%',
  },
  ringSlot: {
    width: RING_SIZE,
    height: RING_SIZE,
    flexShrink: 0,
  },
  healthCopy: {
    flex: 1,
    minWidth: 0,
    gap: 2,
    justifyContent: 'center',
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
    flexShrink: 0,
  },
  band: {
    ...typography.bodyStrong,
    fontSize: 13,
    fontWeight: '700',
    flexShrink: 1,
  },
  healthSummary: {
    ...typography.caption,
    fontSize: 11,
    lineHeight: 14,
    color: colors.muted,
  },
  healthEmpty: {
    ...typography.caption,
    fontSize: 11,
    color: colors.muted,
  },
  pressed: {
    opacity: 0.9,
  },
});
