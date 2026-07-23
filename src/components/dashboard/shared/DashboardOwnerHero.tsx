import React, { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Hand } from 'lucide-react-native';
import { colors, radius, shadows, spacing, typography } from '../../../theme';

type DashboardOwnerHeroProps = {
  spaceName: string;
  spaceTypeLabel?: string;
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

/** Compact Design A hero for Mess / PG owner dashboards. */
export function DashboardOwnerHero({ spaceName, spaceTypeLabel }: DashboardOwnerHeroProps) {
  const { t } = useTranslation();
  const greeting = useMemo(() => t(greetingKey(new Date().getHours())), [t]);

  return (
    <View style={styles.wrap} accessibilityRole="header">
      <View style={styles.decorBlobPrimary} pointerEvents="none" />
      <View style={styles.decorBlobSecondary} pointerEvents="none" />
      <View style={styles.decorRing} pointerEvents="none" />

      <View style={styles.row}>
        <View style={styles.iconWrap} accessibilityElementsHidden>
          <Hand size={16} color={colors.primaryDark} strokeWidth={2.2} />
        </View>

        <View style={styles.copy}>
          <View style={styles.titleRow}>
            <View style={styles.titleCopy}>
              <Text style={styles.greeting}>{greeting}</Text>
              <Text style={styles.spaceName} numberOfLines={1}>
                {spaceName}
              </Text>
            </View>
            {spaceTypeLabel ? (
              <View style={styles.badge}>
                <Text style={styles.badgeText} numberOfLines={1}>
                  {spaceTypeLabel}
                </Text>
              </View>
            ) : null}
          </View>
          <Text style={styles.subtitle} numberOfLines={2}>
            {t('dashboard.owner.heroSubtitle')}
          </Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    marginBottom: spacing.md,
    paddingTop: spacing.sm,
    paddingBottom: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: radius.section,
    backgroundColor: '#ECFDF5',
    borderWidth: 1,
    borderColor: `${colors.primary}33`,
    overflow: 'hidden',
    position: 'relative',
    ...shadows.sm,
  },
  decorBlobPrimary: {
    position: 'absolute',
    width: 110,
    height: 110,
    borderRadius: 55,
    backgroundColor: `${colors.primary}1A`,
    top: -42,
    right: -28,
  },
  decorBlobSecondary: {
    position: 'absolute',
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: `${colors.primaryDark}10`,
    bottom: -22,
    right: 18,
  },
  decorRing: {
    position: 'absolute',
    width: 48,
    height: 48,
    borderRadius: 24,
    borderWidth: 6,
    borderColor: `${colors.primary}14`,
    top: 6,
    right: 72,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    zIndex: 1,
  },
  iconWrap: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: `${colors.primary}33`,
    alignItems: 'center',
    justifyContent: 'center',
  },
  copy: {
    flex: 1,
    minWidth: 0,
    gap: 2,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
  },
  titleCopy: {
    flex: 1,
    minWidth: 0,
  },
  greeting: {
    ...typography.caption,
    color: colors.textPrimary,
    fontWeight: '600',
    marginBottom: 1,
  },
  spaceName: {
    ...typography.h2,
    fontSize: 20,
    lineHeight: 24,
    color: colors.primaryDark,
    fontWeight: '800',
  },
  badge: {
    flexShrink: 0,
    marginTop: 1,
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
    borderRadius: radius.full,
    backgroundColor: colors.lightGreen,
    borderWidth: 1,
    borderColor: `${colors.primary}44`,
  },
  badgeText: {
    ...typography.caption,
    color: colors.primaryDark,
    fontWeight: '700',
    fontSize: 11,
  },
  subtitle: {
    ...typography.caption,
    color: colors.muted,
    fontWeight: '500',
    marginTop: 2,
  },
});
