import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import { useTranslation } from 'react-i18next';
import { ChevronRight } from 'lucide-react-native';
import type { MealType, UUID } from '../../api/types';
import { useDashboardMealDay } from '../../hooks/useDashboardMealDay';
import { navigateMainStack } from '../../navigation/mainStackNavigation';
import type { SpaceTabParamList } from '../../navigation/types';
import { colors, radius, shadows, spacing, typography } from '../../theme';
import { isPastMenuDate, todayIsoDate } from '../../utils/mealDates';
import { buildDashboardMealSlotRows } from '../../utils/dashboardMealSlotDisplay';
import { mealTypeLabelKey } from '../../utils/mealLabels';
import { MENU_PLANNING_POLL_OPEN_COLOR } from '../../utils/menuPlanningStatusVisual';
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
  const navigation = useNavigation<BottomTabNavigationProp<SpaceTabParamList>>();
  const [menuDate, setMenuDate] = useState(todayIsoDate());
  const mealFetchEnabled = enabled;
  const [datePickerOpen, setDatePickerOpen] = useState(false);
  const dateReadOnly = isPastMenuDate(menuDate);

  // One coordinated load for menus + polls + eligibility (not 3 separate focus hooks).
  const mealDay = useDashboardMealDay(spaceId, menuDate, mealFetchEnabled);

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

  const handleOpenDailyMenuEdit = useCallback(
    (mealType: MealType) => {
      navigateMainStack('DailyMenuEdit', { spaceId, menuDate, mealType });
    },
    [menuDate, spaceId],
  );

  /** Meals tab = Menu Planning overview for managers. */
  const handleOpenMealsTab = useCallback(() => {
    navigation.navigate('Meals', { spaceId });
  }, [navigation, spaceId]);

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

  const handlePlanMenuCta = useCallback(() => {
    handleOpenMealsTab();
  }, [handleOpenMealsTab]);

  const handleSlotPress = useCallback(
    (mealType: MealType) => {
      if (dateReadOnly) {
        handleOpenMealsTab();
        return;
      }
      handleOpenDailyMenuEdit(mealType);
    },
    [dateReadOnly, handleOpenDailyMenuEdit, handleOpenMealsTab],
  );

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
            <MenuDateNavRow
              compact
              menuDate={menuDate}
              onMenuDateChange={setMenuDate}
              onOpenCalendar={() => setDatePickerOpen(true)}
              onJumpToToday={() => setMenuDate(todayIsoDate())}
            />

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
                  onPress={handlePlanMenuCta}
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
                  onPress={() => handleSlotPress(row.mealType)}
                />
              ))}
            </View>
          </>
        )}
      </View>

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
});
