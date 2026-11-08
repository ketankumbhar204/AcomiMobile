import React, { memo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import {
  CalendarCheck2,
  ChevronRight,
  LogOut,
  UserPlus,
  type LucideIcon,
} from 'lucide-react-native';
import { colors, pastels, radius, shadows, spacing, typography } from '../../theme';
import { DashboardSectionTitle } from './DashboardSectionTitle';

export type DashboardRecentActivityProps = {
  moveInsThisMonth: number;
  reservedCount: number;
  moveOutsThisMonth: number | null;
  lastMoveInDate?: string | null;
  nextReservationDate?: string | null;
  lastMoveOutDate?: string | null;
  onMoveInsPress?: () => void;
  onReservationsPress?: () => void;
  onMoveOutsPress?: () => void;
  onViewAllPress?: () => void;
};

type ActivityRowProps = {
  icon: LucideIcon;
  accent: string;
  well: string;
  title: string;
  subtitle?: string | null;
  onPress?: () => void;
  showDivider?: boolean;
};

function ActivityRow({
  icon: Icon,
  accent,
  well,
  title,
  subtitle,
  onPress,
  showDivider,
}: ActivityRowProps) {
  return (
    <>
      <Pressable
        onPress={onPress}
        disabled={!onPress}
        style={({ pressed }) => [styles.row, pressed && onPress ? styles.pressed : null]}
        accessibilityRole="button"
        accessibilityLabel={title}>
        <View style={[styles.iconWrap, { backgroundColor: well }]}>
          <Icon size={18} color={accent} strokeWidth={2.2} />
        </View>
        <View style={styles.copy}>
          <Text style={styles.rowTitle} numberOfLines={1}>
            {title}
          </Text>
          {subtitle ? (
            <Text style={styles.rowSubtitle} numberOfLines={1}>
              {subtitle}
            </Text>
          ) : null}
        </View>
        {onPress ? (
          <ChevronRight size={18} color={colors.muted} strokeWidth={2.4} />
        ) : null}
      </Pressable>
      {showDivider ? <View style={styles.divider} /> : null}
    </>
  );
}

export const DashboardRecentActivity = memo(function DashboardRecentActivity({
  moveInsThisMonth,
  reservedCount,
  moveOutsThisMonth,
  lastMoveInDate,
  nextReservationDate,
  lastMoveOutDate,
  onMoveInsPress,
  onReservationsPress,
  onMoveOutsPress,
  onViewAllPress,
}: DashboardRecentActivityProps) {
  const { t } = useTranslation();
  const hasAny =
    moveInsThisMonth > 0 ||
    reservedCount > 0 ||
    (moveOutsThisMonth != null && moveOutsThisMonth > 0);

  return (
    <View style={styles.wrap}>
      <View style={styles.headerRow}>
        <View style={styles.headerTitle}>
          <DashboardSectionTitle
            title={t('dashboard.recentActivity.title', {
              defaultValue: 'Recent Activity',
            })}
          />
        </View>
        {onViewAllPress ? (
          <Pressable
            onPress={onViewAllPress}
            hitSlop={8}
            accessibilityRole="button"
            accessibilityLabel={t('dashboard.recentActivity.viewAll', {
              defaultValue: 'View all',
            })}>
            <Text style={styles.viewAll}>
              {t('dashboard.recentActivity.viewAll', { defaultValue: 'View all' })}
              {' >'}
            </Text>
          </Pressable>
        ) : null}
      </View>

      {!hasAny ? (
        <View style={styles.emptyCard}>
          <Text style={styles.emptyText}>
            {t('dashboard.recentActivity.empty', {
              defaultValue: 'No recent occupancy activity yet.',
            })}
          </Text>
        </View>
      ) : (
        <View style={styles.card}>
          <ActivityRow
            icon={UserPlus}
            accent={pastels.green.fg}
            well={pastels.green.bg}
            title={t('dashboard.recentActivity.moveIns', {
              count: moveInsThisMonth,
              defaultValue: '{{count}} Move-ins this month',
            })}
            subtitle={
              lastMoveInDate
                ? t('dashboard.recentActivity.lastMoveIn', {
                    date: lastMoveInDate,
                    defaultValue: 'Last move-in: {{date}}',
                  })
                : t('dashboard.recentActivity.thisMonth', {
                    defaultValue: 'This calendar month',
                  })
            }
            onPress={onMoveInsPress}
            showDivider
          />
          <ActivityRow
            icon={CalendarCheck2}
            accent={pastels.purple.fg}
            well={pastels.purple.bg}
            title={t('dashboard.recentActivity.reservations', {
              count: reservedCount,
              defaultValue: '{{count}} New reservation',
            })}
            subtitle={
              nextReservationDate
                ? t('dashboard.recentActivity.arriving', {
                    date: nextReservationDate,
                    defaultValue: 'Arriving: {{date}}',
                  })
                : reservedCount > 0
                  ? t('dashboard.recentActivity.activeReservations', {
                      defaultValue: 'Active reservations',
                    })
                  : t('dashboard.recentActivity.noReservations', {
                      defaultValue: 'No active reservations',
                    })
            }
            onPress={onReservationsPress}
            showDivider
          />
          <ActivityRow
            icon={LogOut}
            accent="#DC2626"
            well="#FEE2E2"
            title={
              moveOutsThisMonth == null
                ? t('dashboard.recentActivity.moveOutsUnavailable', {
                    defaultValue: 'Move-outs this month',
                  })
                : t('dashboard.recentActivity.moveOuts', {
                    count: moveOutsThisMonth,
                    defaultValue: '{{count}} Move-outs this month',
                  })
            }
            subtitle={
              lastMoveOutDate
                ? t('dashboard.recentActivity.lastMoveOut', {
                    date: lastMoveOutDate,
                    defaultValue: 'Last move-out: {{date}}',
                  })
                : moveOutsThisMonth == null
                  ? t('dashboard.recentActivity.moveOutsApiGap', {
                      defaultValue: 'Count unavailable from API',
                    })
                  : t('dashboard.recentActivity.thisMonth', {
                      defaultValue: 'This calendar month',
                    })
            }
            onPress={onMoveOutsPress}
          />
        </View>
      )}
    </View>
  );
});

const styles = StyleSheet.create({
  wrap: {
    marginBottom: spacing.lg,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  headerTitle: {
    flex: 1,
    minWidth: 0,
  },
  viewAll: {
    ...typography.caption,
    fontSize: 13,
    lineHeight: 16,
    color: colors.primaryDark,
    fontWeight: '700',
    marginBottom: spacing.md,
  },
  card: {
    backgroundColor: colors.white,
    borderRadius: radius.section,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.md,
    ...shadows.sm,
  },
  emptyCard: {
    backgroundColor: colors.white,
    borderRadius: radius.card,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
  },
  emptyText: {
    ...typography.caption,
    color: colors.muted,
    fontSize: 13,
    lineHeight: 18,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.md,
    minHeight: 64,
  },
  pressed: {
    opacity: 0.9,
  },
  iconWrap: {
    width: 36,
    height: 36,
    borderRadius: radius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  copy: {
    flex: 1,
    minWidth: 0,
    gap: 2,
  },
  rowTitle: {
    ...typography.bodyStrong,
    fontSize: 14,
    lineHeight: 18,
    color: colors.textPrimary,
  },
  rowSubtitle: {
    ...typography.caption,
    fontSize: 12,
    lineHeight: 15,
    color: colors.textSecondary,
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: colors.border,
  },
});
