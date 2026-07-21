import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { colors, radius, spacing, typography } from '../../theme';
import { addDaysIsoDate, formatMenuDate } from '../../utils/mealDates';
import { MenuDateContextHints } from './MenuDateContextHints';

type MenuDateNavRowProps = {
  menuDate: string;
  onMenuDateChange: (nextDate: string) => void;
  onOpenCalendar?: () => void;
  onJumpToToday?: () => void;
  onJumpToTomorrow?: () => void;
  /** Compact density for bottom-sheet headers. */
  compact?: boolean;
};

/**
 * Shared ◀ date ▶ navigator used by Dashboard meal ops and Headcount drawer.
 */
export function MenuDateNavRow({
  menuDate,
  onMenuDateChange,
  onOpenCalendar,
  onJumpToToday,
  onJumpToTomorrow,
  compact = false,
}: MenuDateNavRowProps) {
  const { t, i18n } = useTranslation();

  return (
    <View style={[styles.dateRow, compact && styles.dateRowCompact]}>
      <Pressable
        style={[styles.dateNavBtn, compact && styles.dateNavBtnCompact]}
        onPress={() => onMenuDateChange(addDaysIsoDate(menuDate, -1))}
        accessibilityRole="button"
        accessibilityLabel={t('common.back')}>
        <Text style={styles.dateNavText}>◀</Text>
      </Pressable>
      <Pressable
        style={({ pressed }) => [
          styles.dateCenter,
          pressed && styles.dateCenterPressed,
          !onOpenCalendar && styles.dateCenterStatic,
        ]}
        onPress={onOpenCalendar}
        disabled={!onOpenCalendar}
        accessibilityRole={onOpenCalendar ? 'button' : undefined}
        accessibilityLabel={formatMenuDate(menuDate, i18n.language)}
        accessibilityHint={onOpenCalendar ? t('meals.planning.openCalendar') : undefined}>
        <Text style={[styles.dateLabel, onOpenCalendar && styles.dateLabelLink]}>
          {formatMenuDate(menuDate, i18n.language)}
        </Text>
        <MenuDateContextHints
          menuDate={menuDate}
          onJumpToToday={onJumpToToday}
          onJumpToTomorrow={onJumpToTomorrow}
        />
      </Pressable>
      <Pressable
        style={[styles.dateNavBtn, compact && styles.dateNavBtnCompact]}
        onPress={() => onMenuDateChange(addDaysIsoDate(menuDate, 1))}
        accessibilityRole="button"
        accessibilityLabel={t('common.next')}>
        <Text style={styles.dateNavText}>▶</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  dateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  dateRowCompact: {
    gap: 2,
  },
  dateNavBtn: {
    width: 32,
    height: 32,
    borderRadius: radius.button,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.white,
  },
  dateNavBtnCompact: {
    width: 28,
    height: 28,
  },
  dateNavText: {
    ...typography.bodyStrong,
    color: colors.primaryDark,
    fontSize: 12,
  },
  dateCenter: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.xs,
    borderRadius: radius.button,
  },
  dateCenterStatic: {
    // non-pressable center still keeps layout
  },
  dateCenterPressed: {
    backgroundColor: colors.surface,
  },
  dateLabel: {
    ...typography.caption,
    color: colors.primaryDark,
    fontWeight: '700',
    textAlign: 'center',
  },
  dateLabelLink: {
    textDecorationLine: 'underline',
  },
});
