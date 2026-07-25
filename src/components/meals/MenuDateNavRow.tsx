import React, { useMemo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { colors, radius, spacing, typography } from '../../theme';
import {
  addDaysIsoDate,
  formatMenuDate,
  formatMenuDateShort,
  relativeMenuDateKind,
  relativeMenuDateLabelKey,
} from '../../utils/mealDates';
import { MenuDateContextHints } from './MenuDateContextHints';

type MenuDateNavRowProps = {
  menuDate: string;
  onMenuDateChange: (nextDate: string) => void;
  onOpenCalendar?: () => void;
  onJumpToToday?: () => void;
  onJumpToTomorrow?: () => void;
  /** Compact density for dashboard / sheet headers. */
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
  const relativeKind = relativeMenuDateKind(menuDate);

  const compactLabel = useMemo(() => {
    const datePart = formatMenuDateShort(menuDate, i18n.language);
    if (relativeKind == null) {
      return datePart;
    }
    return `${datePart} · ${t(relativeMenuDateLabelKey(relativeKind))}`;
  }, [i18n.language, menuDate, relativeKind, t]);

  const fullLabel = formatMenuDate(menuDate, i18n.language);

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
          compact && styles.dateCenterCompact,
          pressed && styles.dateCenterPressed,
          !onOpenCalendar && styles.dateCenterStatic,
        ]}
        onPress={onOpenCalendar}
        disabled={!onOpenCalendar}
        accessibilityRole={onOpenCalendar ? 'button' : undefined}
        accessibilityLabel={fullLabel}
        accessibilityHint={onOpenCalendar ? t('meals.planning.openCalendar') : undefined}>
        <Text
          style={[
            styles.dateLabel,
            compact && styles.dateLabelCompact,
            onOpenCalendar && styles.dateLabelLink,
          ]}
          numberOfLines={1}>
          {compact ? compactLabel : fullLabel}
        </Text>
        {!compact || relativeKind == null ? (
          <MenuDateContextHints
            menuDate={menuDate}
            onJumpToToday={onJumpToToday}
            onJumpToTomorrow={onJumpToTomorrow}
            showJumpLinks={!compact || relativeKind == null}
          />
        ) : null}
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
    gap: spacing.xs,
    minHeight: 36,
  },
  dateNavBtn: {
    width: 36,
    height: 36,
    borderRadius: radius.button,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.white,
  },
  dateNavBtnCompact: {
    width: 32,
    height: 32,
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
  dateCenterCompact: {
    paddingVertical: 0,
    minHeight: 32,
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
  dateLabelCompact: {
    fontSize: 13,
    lineHeight: 16,
    fontWeight: '600',
  },
  dateLabelLink: {
    textDecorationLine: 'underline',
  },
});
