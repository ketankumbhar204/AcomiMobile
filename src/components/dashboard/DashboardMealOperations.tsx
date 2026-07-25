import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { ChevronRight } from 'lucide-react-native';
import type { MealType, UUID } from '../../api/types';
import { useDashboardMealDay } from '../../hooks/useDashboardMealDay';
import { useOwnerMealHeadcount } from '../../hooks/useOwnerMealHeadcount';
import { navigateMainStack } from '../../navigation/mainStackNavigation';
import { colors, radius, shadows, spacing, typography } from '../../theme';
import { isPastMenuDate, todayIsoDate } from '../../utils/mealDates';
import { buildDashboardMealSlotRows } from '../../utils/dashboardMealSlotDisplay';
import { mealTypeLabelKey } from '../../utils/mealLabels';
import { MENU_PLANNING_POLL_OPEN_COLOR } from '../../utils/menuPlanningStatusVisual';
import type { MenuPlanningStatusFilter } from '../../utils/menuPlanningFilter';
import type { MealStatusKind } from '../../utils/mealStatusTheme';
import { MealHeadcountBottomSheet } from '../meals/MealHeadcountBottomSheet';
import { MealOperationSlotCard } from '../meals/MealOperationSlotCard';
import { MenuDateNavRow } from '../meals/MenuDateNavRow';
import { MenuDatePickerModal } from '../meals/MenuDatePickerModal';
import { Skeleton } from '../ui/Skeleton';
import { DashboardSectionTitle } from './DashboardSectionTitle';

type DashboardMealOperationsProps = {
  spaceId: UUID;
  enabled?: boolean;
  /** Mess guided setup: stronger empty copy when no menu is planned. */
  guidedEmpty?: boolean;
};

export function DashboardMealOperations({
  spaceId,
  enabled = true,
  guidedEmpty = false,
}: DashboardMealOperationsProps) {
  const { t } = useTranslation();
  const [menuDate, setMenuDate] = useState(todayIsoDate());
  const mealFetchEnabled = enabled;
  const [sheetOpen, setSheetOpen] = useState(false);
  const [datePickerOpen, setDatePickerOpen] = useState(false);
  const [initialMealType, setInitialMealType] = useState<MealType>('BREAKFAST');
  const dateReadOnly = isPastMenuDate(menuDate);

  // One coordinated load for menus + polls + eligibility (not 3 separate focus hooks).
  const mealDay = useDashboardMealDay(spaceId, menuDate, mealFetchEnabled);
  const hasSharedMeals = mealDay.summary.published > 0;
  // Prefetch headcount whenever shared meals exist so Shared-card taps open instantly.
  const headcount = useOwnerMealHeadcount(
    spaceId,
    menuDate,
    mealFetchEnabled && (sheetOpen || hasSharedMeals),
  );

  useEffect(() => {
    setMenuDate(todayIsoDate());
  }, [spaceId]);

  const loading = mealDay.loading;

  const pollStatusLine = useMemo(() => {
    if (mealDay.hasOpenPolls) {
      return t('dashboard.operations.pollOpenLine', {
        responded: mealDay.respondedCount,
        eligible: mealDay.eligibleCount,
      });
    }
    if (mealDay.summary.modified > 0) {
      return t('meals.planning.dayHintNeedsReshare', {
        count: mealDay.summary.modified,
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

  const handleOpenMenuPlanning = useCallback(
    (mealType?: MealType) => {
      navigateMainStack('MenuPlanning', {
        spaceId,
        menuDate,
        ...(mealType ? { mealType } : {}),
      });
    },
    [menuDate, spaceId],
  );

  const mealSlotRows = useMemo(
    () =>
      buildDashboardMealSlotRows(
        mealDay.menuMap,
        mealDay.pollMap,
        mealDay.eligibleByMeal,
        mealDay.platesByMeal,
        mealDay.eligibleCount,
      ),
    [
      mealDay.eligibleByMeal,
      mealDay.eligibleCount,
      mealDay.menuMap,
      mealDay.platesByMeal,
      mealDay.pollMap,
    ],
  );

  const handleSlotPress = useCallback(
    (mealType: MealType, status: MenuPlanningStatusFilter, statusKind: MealStatusKind) => {
      if (status === 'published' || statusKind === 'shared') {
        handleOpenMeal(mealType);
        return;
      }
      handleOpenMenuPlanning(mealType);
    },
    [handleOpenMeal, handleOpenMenuPlanning],
  );

  const handleCloseSheet = useCallback(() => {
    setSheetOpen(false);
    void mealDay.reload();
  }, [mealDay]);

  const orderedPrefetchedSlots = useMemo(
    () =>
      (['BREAKFAST', 'LUNCH', 'DINNER'] as MealType[])
        .map(mealType => mealDay.headcountSlots.find(slot => slot.mealType === mealType))
        .filter((slot): slot is NonNullable<typeof slot> => slot != null),
    [mealDay.headcountSlots],
  );

  /** If headcount day is empty but polls exist, still open the drawer with poll-backed slots. */
  const fallbackSlotsFromPolls = useMemo(() => {
    return (['BREAKFAST', 'LUNCH', 'DINNER'] as MealType[])
      .map(mealType => {
        const poll = mealDay.pollMap[mealType];
        if (!poll) {
          return null;
        }
        return {
          mealType,
          pollId: poll.id,
          pollStatus: poll.status,
          mealsToPrepare: mealDay.platesByMeal[mealType] ?? poll.responseCount ?? 0,
        };
      })
      .filter((slot): slot is NonNullable<typeof slot> => slot != null);
  }, [mealDay.platesByMeal, mealDay.pollMap]);

  const sheetSlots =
    headcount.slots.length > 0
      ? headcount.slots
      : orderedPrefetchedSlots.length > 0
        ? orderedPrefetchedSlots
        : fallbackSlotsFromPolls;

  const sheetSlotsLoading =
    sheetOpen && sheetSlots.length === 0 && (!headcount.ready || headcount.loading);

  return (
    <View style={styles.wrap}>
      <DashboardSectionTitle title={t('dashboard.operations.title')} />

      <View style={styles.body}>
        {loading ? (
          <View style={styles.mealSkeleton}>
            <Skeleton width="100%" height={36} borderRadius={radius.button} />
            <View style={styles.mealSkeletonRow}>
              {[0, 1, 2].map(key => (
                <View key={key} style={styles.mealSkeletonCard}>
                  <Skeleton width={32} height={32} borderRadius={16} />
                  <Skeleton width="70%" height={12} style={styles.mealSkeletonGap} />
                  <Skeleton
                    width="80%"
                    height={20}
                    borderRadius={radius.full}
                    style={styles.mealSkeletonGap}
                  />
                  <Skeleton width="55%" height={11} style={styles.mealSkeletonGap} />
                </View>
              ))}
            </View>
          </View>
        ) : (
          <>
            {!sheetOpen ? (
              <MenuDateNavRow
                compact
                menuDate={menuDate}
                onMenuDateChange={setMenuDate}
                onOpenCalendar={() => setDatePickerOpen(true)}
                onJumpToToday={() => setMenuDate(todayIsoDate())}
              />
            ) : null}

            <View style={styles.statusBar}>
              <View style={styles.statusTextBlock}>
                {guidedEmpty && mealDay.emptyKind === 'all_not_planned' ? (
                  <>
                    <Text style={styles.guidedEmptyTitle}>
                      {t('dashboard.operations.guidedEmptyTitle')}
                    </Text>
                    <Text style={styles.guidedEmptyBody}>
                      {t('dashboard.operations.guidedEmptyBody')}
                    </Text>
                  </>
                ) : (
                  <>
                    <Text style={styles.dayStatusLine}>
                      {t('meals.planning.dayStatusVisual', {
                        shared: mealDay.summary.published,
                        notShared: mealDay.summary.draft + mealDay.summary.modified,
                        empty: mealDay.summary.notPlanned,
                      })}
                    </Text>
                    <Text
                      style={[
                        styles.pollStatusLine,
                        mealDay.hasOpenPolls && styles.pollStatusLineOpen,
                      ]}>
                      {pollStatusLine}
                    </Text>
                  </>
                )}
              </View>
              {!dateReadOnly ? (
                <Pressable
                  style={({ pressed }) => [styles.planLink, pressed && styles.planLinkPressed]}
                  onPress={() => handleOpenMenuPlanning()}
                  accessibilityRole="button">
                  <Text style={styles.planLinkText}>{t('dashboard.operations.planMenuCta')}</Text>
                  <ChevronRight size={14} color={colors.primaryDark} strokeWidth={2.6} />
                </Pressable>
              ) : null}
            </View>

            <View style={styles.mealSlotRow}>
              {mealSlotRows.map(row => (
                <MealOperationSlotCard
                  key={row.mealType}
                  mealType={row.mealType}
                  mealLabel={t(mealTypeLabelKey(row.mealType))}
                  caption={t(row.captionKey, row.captionParams)}
                  countPrimary={row.countPrimary}
                  countUnit={row.countUnitKey ? t(row.countUnitKey) : undefined}
                  captionTone={row.captionTone}
                  statusKind={row.statusKind}
                  onPress={() => handleSlotPress(row.mealType, row.status, row.statusKind)}
                />
              ))}
            </View>

            {mealDay.summary.published > 0 || mealDay.summary.modified > 0 ? (
              <Text style={styles.hint}>{t('dashboard.headcount.toggleMealHint')}</Text>
            ) : null}
          </>
        )}
      </View>

      <MealHeadcountBottomSheet
        visible={sheetOpen}
        spaceId={spaceId}
        menuDate={menuDate}
        openSlots={sheetSlots}
        slotRows={mealSlotRows}
        initialMealType={initialMealType}
        onClose={handleCloseSheet}
        readOnly={dateReadOnly}
        slotsLoading={sheetSlotsLoading}
        onReload={() => {
          void headcount.reload();
          void mealDay.reload();
        }}
      />

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
  },
  body: {
    gap: spacing.sm,
  },
  mealSkeleton: {
    gap: spacing.sm,
  },
  mealSkeletonRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  mealSkeletonCard: {
    flex: 1,
    minWidth: 0,
    minHeight: 110,
    alignItems: 'center',
    backgroundColor: colors.white,
    borderRadius: radius.card,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.sm,
  },
  mealSkeletonGap: {
    marginTop: spacing.xs,
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
    ...shadows.sm,
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
  guidedEmptyTitle: {
    ...typography.bodyStrong,
    color: colors.textPrimary,
    fontSize: 14,
  },
  guidedEmptyBody: {
    ...typography.caption,
    color: colors.textSecondary,
    lineHeight: 18,
  },
  pollStatusLine: {
    ...typography.caption,
    color: colors.textSecondary,
    lineHeight: 18,
  },
  pollStatusLineOpen: {
    color: MENU_PLANNING_POLL_OPEN_COLOR,
    fontWeight: '600',
  },
  planLink: {
    flexShrink: 0,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
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
  hint: {
    ...typography.caption,
    color: colors.muted,
    textAlign: 'center',
    lineHeight: 18,
  },
});
