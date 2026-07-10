import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import type { MealType, UUID } from '../../api/types';
import { useDashboardMealDay } from '../../hooks/useDashboardMealDay';
import { useOwnerMealHeadcount } from '../../hooks/useOwnerMealHeadcount';
import { navigateMainStack } from '../../navigation/mainStackNavigation';
import { colors, radius, spacing, typography } from '../../theme';
import { addDaysIsoDate, formatMenuDate, isPastMenuDate, todayIsoDate } from '../../utils/mealDates';
import { buildDashboardMealSlotRows } from '../../utils/dashboardMealSlotDisplay';
import { mealTypeLabelKey } from '../../utils/mealLabels';
import {
  MENU_PLANNING_STATUS_BACKGROUNDS,
  MENU_PLANNING_STATUS_COLORS,
} from '../../utils/menuPlanningStatusVisual';
import type { MenuPlanningStatusFilter } from '../../utils/menuPlanningFilter';
import { MealHeadcountBottomSheet } from '../meals/MealHeadcountBottomSheet';
import { MenuDateContextHints } from '../meals/MenuDateContextHints';
import { MenuDatePickerModal } from '../meals/MenuDatePickerModal';
import { DashboardSectionTitle } from './DashboardSectionTitle';

type DashboardMealOperationsProps = {
  spaceId: UUID;
  enabled?: boolean;
};

function MealOperationSlotCard({
  mealLabel,
  statusLabel,
  caption,
  status,
  onPress,
}: {
  mealLabel: string;
  statusLabel: string;
  caption: string;
  status: MenuPlanningStatusFilter;
  onPress: () => void;
}) {
  const statusColor = MENU_PLANNING_STATUS_COLORS[status];
  const backgroundColor = MENU_PLANNING_STATUS_BACKGROUNDS[status];

  return (
    <Pressable
      style={({ pressed }) => [
        styles.slotCard,
        { backgroundColor, borderColor: statusColor },
        pressed && styles.slotCardPressed,
      ]}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`${mealLabel}, ${statusLabel}, ${caption}`}>
      <Text style={styles.slotMealLabel} numberOfLines={1}>
        {mealLabel}
      </Text>
      <Text style={[styles.slotStatusLabel, { color: statusColor }]} numberOfLines={1}>
        {statusLabel}
      </Text>
      <Text style={styles.slotCaption} numberOfLines={2}>
        {caption}
      </Text>
    </Pressable>
  );
}

export function DashboardMealOperations({ spaceId, enabled = true }: DashboardMealOperationsProps) {
  const { t, i18n } = useTranslation();
  const [menuDate, setMenuDate] = useState(todayIsoDate());
  const [deferMealFetch, setDeferMealFetch] = useState(true);
  const mealFetchEnabled = enabled && !deferMealFetch;
  const [sheetOpen, setSheetOpen] = useState(false);
  const [datePickerOpen, setDatePickerOpen] = useState(false);
  const [initialMealType, setInitialMealType] = useState<MealType>('BREAKFAST');
  const dateReadOnly = isPastMenuDate(menuDate);

  // One coordinated load for menus + polls + eligibility (not 3 separate focus hooks).
  const mealDay = useDashboardMealDay(spaceId, menuDate, mealFetchEnabled);
  // Headcount only when the sheet is open — not on every dashboard paint.
  const headcount = useOwnerMealHeadcount(spaceId, menuDate, mealFetchEnabled && sheetOpen);

  useEffect(() => {
    if (!enabled) {
      setDeferMealFetch(true);
      return;
    }
    const timer = setTimeout(() => setDeferMealFetch(false), 400);
    return () => clearTimeout(timer);
  }, [enabled, spaceId]);

  const loading = mealDay.loading;

  const pollStatusLine = useMemo(() => {
    if (mealDay.hasOpenPolls) {
      return t('dashboard.operations.pollOpenLine', {
        responded: mealDay.respondedCount,
        eligible: mealDay.eligibleCount,
      });
    }
    if (mealDay.summary.published > 0) {
      return t('dashboard.operations.pollClosed');
    }
    if (mealDay.summary.draft > 0) {
      return t('dashboard.operations.pollNotOpenDraft');
    }
    return t('dashboard.operations.pollNotOpen');
  }, [
    mealDay.eligibleCount,
    mealDay.hasOpenPolls,
    mealDay.respondedCount,
    mealDay.summary,
    t,
  ]);

  const handleOpenMeal = useCallback((mealType: MealType) => {
    setInitialMealType(mealType);
    setSheetOpen(true);
  }, []);

  const handleOpenMenuPlanning = useCallback(() => {
    navigateMainStack('MenuPlanning', { spaceId, menuDate });
  }, [menuDate, spaceId]);

  const mealSlotRows = useMemo(
    () => buildDashboardMealSlotRows(mealDay.menuMap, mealDay.pollMap),
    [mealDay.menuMap, mealDay.pollMap],
  );

  const handleSlotPress = useCallback(
    (mealType: MealType, status: MenuPlanningStatusFilter) => {
      if (status === 'published') {
        handleOpenMeal(mealType);
        return;
      }
      handleOpenMenuPlanning();
    },
    [handleOpenMeal, handleOpenMenuPlanning],
  );

  const handleCloseSheet = useCallback(() => {
    setSheetOpen(false);
    void mealDay.reload();
  }, [mealDay]);

  useEffect(() => {
    if (!sheetOpen || headcount.loading) {
      return;
    }
    if (headcount.slots.length === 0) {
      setSheetOpen(false);
      handleOpenMenuPlanning();
    }
  }, [handleOpenMenuPlanning, headcount.loading, headcount.slots.length, sheetOpen]);

  return (
    <View style={styles.wrap}>
      <DashboardSectionTitle title={t('dashboard.operations.title')} />

      <View style={styles.dateRow}>
        <Pressable
          style={styles.dateNavBtn}
          onPress={() => setMenuDate(prev => addDaysIsoDate(prev, -1))}
          accessibilityRole="button">
          <Text style={styles.dateNavText}>◀</Text>
        </Pressable>
        <Pressable
          style={({ pressed }) => [styles.dateCenter, pressed && styles.dateCenterPressed]}
          onPress={() => setDatePickerOpen(true)}
          accessibilityRole="button"
          accessibilityLabel={formatMenuDate(menuDate, i18n.language)}
          accessibilityHint={t('meals.planning.openCalendar')}>
          <Text style={styles.dateLabel}>{formatMenuDate(menuDate, i18n.language)}</Text>
          <MenuDateContextHints
            menuDate={menuDate}
            onJumpToToday={() => setMenuDate(todayIsoDate())}
          />
        </Pressable>
        <Pressable
          style={styles.dateNavBtn}
          onPress={() => setMenuDate(prev => addDaysIsoDate(prev, 1))}
          accessibilityRole="button">
          <Text style={styles.dateNavText}>▶</Text>
        </Pressable>
      </View>

      {loading ? (
        <ActivityIndicator color={colors.primary} style={styles.loader} />
      ) : (
        <View style={styles.statusBar}>
          <View style={styles.statusTextBlock}>
            <Text style={styles.dayStatusLine}>
              {t('meals.planning.dayStatus', mealDay.summary)}
            </Text>
            <Text
              style={[
                styles.pollStatusLine,
                mealDay.hasOpenPolls && styles.pollStatusLineOpen,
              ]}>
              {pollStatusLine}
            </Text>
          </View>
          {!dateReadOnly ? (
            <Pressable
              style={({ pressed }) => [styles.planLink, pressed && styles.planLinkPressed]}
              onPress={handleOpenMenuPlanning}
              accessibilityRole="button">
              <Text style={styles.planLinkText}>
                {t('dashboard.operations.planMenuCta')} ›
              </Text>
            </Pressable>
          ) : null}
        </View>
      )}

      {!loading ? (
        <>
          <View style={styles.mealSlotRow}>
            {mealSlotRows.map(row => (
              <MealOperationSlotCard
                key={row.mealType}
                mealLabel={t(mealTypeLabelKey(row.mealType))}
                statusLabel={t(row.statusLabelKey)}
                caption={t(row.captionKey, row.captionParams)}
                status={row.status}
                onPress={() => handleSlotPress(row.mealType, row.status)}
              />
            ))}
          </View>

          {mealDay.summary.published > 0 ? (
            <Text style={styles.hint}>{t('dashboard.headcount.toggleMealHint')}</Text>
          ) : null}
        </>
      ) : null}

      {sheetOpen && !headcount.loading && headcount.slots.length > 0 ? (
        <MealHeadcountBottomSheet
          visible={sheetOpen}
          spaceId={spaceId}
          menuDate={menuDate}
          openSlots={headcount.slots}
          initialMealType={initialMealType}
          onClose={handleCloseSheet}
          readOnly={dateReadOnly}
          onReload={() => {
            void headcount.reload();
            void mealDay.reload();
          }}
        />
      ) : null}

      <MenuDatePickerModal
        visible={datePickerOpen}
        value={menuDate}
        allowPastDates
        onClose={() => setDatePickerOpen(false)}
        onConfirm={setMenuDate}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    marginBottom: spacing.lg,
    gap: spacing.xs,
  },
  dateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginBottom: spacing.sm,
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
  dateCenterPressed: {
    backgroundColor: colors.surface,
  },
  dateLabel: {
    ...typography.caption,
    color: colors.primaryDark,
    fontWeight: '700',
    textAlign: 'center',
    textDecorationLine: 'underline',
  },
  loader: {
    marginVertical: spacing.md,
  },
  statusBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
    backgroundColor: colors.white,
    borderRadius: radius.card,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    marginBottom: spacing.sm,
  },
  statusTextBlock: {
    flex: 1,
    minWidth: 0,
    gap: 2,
  },
  dayStatusLine: {
    ...typography.caption,
    color: colors.muted,
    fontWeight: '600',
  },
  pollStatusLine: {
    ...typography.caption,
    color: colors.textSecondary,
    lineHeight: 18,
  },
  pollStatusLineOpen: {
    color: colors.success,
    fontWeight: '600',
  },
  planLink: {
    flexShrink: 0,
    paddingVertical: spacing.xxs,
    paddingLeft: spacing.xs,
  },
  planLinkPressed: {
    opacity: 0.85,
  },
  planLinkText: {
    ...typography.caption,
    color: colors.primaryDark,
    fontWeight: '700',
  },
  mealSlotRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  slotCard: {
    flex: 1,
    minHeight: 96,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.card,
    borderWidth: 1,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.xs,
    gap: spacing.xxs,
  },
  slotCardPressed: {
    opacity: 0.92,
  },
  slotMealLabel: {
    ...typography.caption,
    color: colors.textPrimary,
    fontWeight: '700',
    textAlign: 'center',
    fontSize: 11,
  },
  slotStatusLabel: {
    ...typography.bodyStrong,
    textAlign: 'center',
    fontSize: 14,
  },
  slotCaption: {
    ...typography.caption,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 16,
    fontSize: 10,
  },
  hint: {
    ...typography.caption,
    color: colors.muted,
    textAlign: 'center',
    marginTop: spacing.sm,
    lineHeight: 18,
  },
});
