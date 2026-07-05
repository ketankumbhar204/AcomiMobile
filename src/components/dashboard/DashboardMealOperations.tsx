import React, { useCallback, useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import type { MealType, UUID } from '../../api/types';
import { useMealDayMenuStatus } from '../../hooks/useMealDayMenuStatus';
import { useOwnerMealHeadcount } from '../../hooks/useOwnerMealHeadcount';
import { useOwnerMealPollStatus } from '../../hooks/useOwnerMealPollStatus';
import { navigateMainStack } from '../../navigation/mainStackNavigation';
import { colors, radius, spacing, typography } from '../../theme';
import { addDaysIsoDate, formatMenuDate, isPastMenuDate, todayIsoDate } from '../../utils/mealDates';
import type { MealOperationsEmptyKind } from '../../utils/dailyMenuDayStatus';
import { mealTypeLabelKey } from '../../utils/mealLabels';
import { MealHeadcountBottomSheet } from '../meals/MealHeadcountBottomSheet';
import { MenuDateContextHints } from '../meals/MenuDateContextHints';
import { MenuDatePickerModal } from '../meals/MenuDatePickerModal';
import { DashboardSectionTitle } from './DashboardSectionTitle';

type DashboardMealOperationsProps = {
  spaceId: UUID;
  enabled?: boolean;
};

function MealSlotChip({
  label,
  value,
  onPress,
}: {
  label: string;
  value: string;
  onPress: () => void;
}) {
  return (
    <Pressable
      style={({ pressed }) => [styles.mealChip, pressed && styles.mealChipPressed]}
      onPress={onPress}
      accessibilityRole="button">
      <Text style={styles.mealChipLabel}>{label}</Text>
      <Text style={styles.mealChipValue}>{value}</Text>
    </Pressable>
  );
}

function emptyMessageKey(kind: MealOperationsEmptyKind): string {
  switch (kind) {
    case 'all_not_planned':
      return 'dashboard.operations.emptyAllNotPlanned';
    case 'none_published':
      return 'dashboard.operations.emptyNonePublished';
    default:
      return 'dashboard.operations.emptyNoResponses';
  }
}

export function DashboardMealOperations({ spaceId, enabled = true }: DashboardMealOperationsProps) {
  const { t, i18n } = useTranslation();
  const [menuDate, setMenuDate] = useState(todayIsoDate());
  const headcount = useOwnerMealHeadcount(spaceId, menuDate, enabled);
  const menuStatus = useMealDayMenuStatus(spaceId, menuDate, enabled);
  const pollStatus = useOwnerMealPollStatus(spaceId, menuDate, enabled);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [datePickerOpen, setDatePickerOpen] = useState(false);
  const [initialMealType, setInitialMealType] = useState<MealType>('BREAKFAST');
  const dateReadOnly = isPastMenuDate(menuDate);

  const loading = headcount.loading || menuStatus.loading || pollStatus.loading;

  const pollStatusLine = useMemo(() => {
    if (pollStatus.hasOpenPolls) {
      return t('dashboard.operations.pollOpenLine', {
        responded: pollStatus.respondedCount,
        eligible: pollStatus.eligibleCount,
      });
    }
    if (menuStatus.summary.published > 0) {
      return t('dashboard.operations.pollClosed');
    }
    if (menuStatus.summary.draft > 0) {
      return t('dashboard.operations.pollNotOpenDraft');
    }
    return t('dashboard.operations.pollNotOpen');
  }, [menuStatus.summary, pollStatus.eligibleCount, pollStatus.hasOpenPolls, pollStatus.respondedCount, t]);

  const handleOpenMeal = useCallback((mealType: MealType) => {
    setInitialMealType(mealType);
    setSheetOpen(true);
  }, []);

  const handleOpenMenuPlanning = useCallback(() => {
    navigateMainStack('MenuPlanning', { spaceId, menuDate });
  }, [menuDate, spaceId]);

  const handleCloseSheet = useCallback(() => {
    setSheetOpen(false);
    void headcount.reload();
    void menuStatus.reload();
    void pollStatus.reload();
  }, [headcount, menuStatus, pollStatus]);

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
              {t('meals.planning.dayStatus', menuStatus.summary)}
            </Text>
            <Text
              style={[
                styles.pollStatusLine,
                pollStatus.hasOpenPolls && styles.pollStatusLineOpen,
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

      {!loading && headcount.slots.length === 0 ? (
        <View style={styles.emptyCard}>
          <Text style={styles.emptyText}>{t(emptyMessageKey(menuStatus.emptyKind))}</Text>
        </View>
      ) : !loading ? (
        <>
          <View style={styles.mealChipRow}>
            {headcount.slots.map(slot => (
              <MealSlotChip
                key={slot.pollId}
                label={t(mealTypeLabelKey(slot.mealType))}
                value={String(slot.mealsToPrepare)}
                onPress={() => handleOpenMeal(slot.mealType)}
              />
            ))}
          </View>

          <Text style={styles.hint}>{t('dashboard.headcount.toggleMealHint')}</Text>
        </>
      ) : null}

      {sheetOpen && headcount.slots.length > 0 ? (
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
            void menuStatus.reload();
            void pollStatus.reload();
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
  emptyCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.card,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
  },
  mealChipRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  mealChip: {
    flex: 1,
    alignItems: 'center',
    backgroundColor: colors.lightGreen,
    borderRadius: radius.card,
    borderWidth: 1,
    borderColor: `${colors.primary}22`,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.xs,
    gap: 2,
  },
  mealChipPressed: {
    opacity: 0.92,
  },
  mealChipLabel: {
    ...typography.caption,
    color: colors.muted,
    textAlign: 'center',
    fontWeight: '600',
    fontSize: 11,
  },
  mealChipValue: {
    ...typography.bodyStrong,
    color: colors.textPrimary,
    fontSize: 18,
  },
  hint: {
    ...typography.caption,
    color: colors.muted,
    textAlign: 'center',
    marginTop: spacing.sm,
    lineHeight: 18,
  },
  emptyText: {
    ...typography.body,
    color: colors.textPrimary,
    textAlign: 'center',
    lineHeight: 22,
  },
});
