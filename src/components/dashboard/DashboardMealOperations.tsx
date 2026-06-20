import React, { useCallback, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import type { DashboardMessOperations, MealType, UUID } from '../../api/types';
import { useOwnerMealHeadcount } from '../../hooks/useOwnerMealHeadcount';
import { colors, radius, spacing, typography } from '../../theme';
import { addDaysIsoDate, formatMenuDate, todayIsoDate } from '../../utils/mealDates';
import { mealTypeLabelKey } from '../../utils/mealLabels';
import { MealHeadcountBottomSheet } from '../meals/MealHeadcountBottomSheet';
import { DashboardSectionTitle } from './DashboardSectionTitle';

type DashboardMealOperationsProps = {
  spaceId: UUID;
  operations: DashboardMessOperations;
};

function OperationCard({
  value,
  label,
  hint,
}: {
  value: string;
  label: string;
  hint?: string;
}) {
  return (
    <View style={styles.card}>
      <Text style={styles.value}>{value}</Text>
      <Text style={styles.label}>{label}</Text>
      {hint ? <Text style={styles.hint}>{hint}</Text> : null}
    </View>
  );
}

function HeadcountChip({
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
      style={({ pressed }) => [styles.headcountChip, pressed && styles.headcountChipPressed]}
      onPress={onPress}
      accessibilityRole="button">
      <Text style={styles.headcountLabel}>{label}</Text>
      <Text style={styles.headcountValue}>{value}</Text>
    </Pressable>
  );
}

export function DashboardMealOperations({ spaceId, operations }: DashboardMealOperationsProps) {
  const { t, i18n } = useTranslation();
  const [menuDate, setMenuDate] = useState(todayIsoDate());
  const headcount = useOwnerMealHeadcount(spaceId, menuDate, true);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [initialMealType, setInitialMealType] = useState<MealType>('BREAKFAST');

  const pollHint =
    operations.openPollsCount > 0
      ? t('dashboard.operations.pollResponses', {
          responded: operations.pollRespondedCount,
          eligible: operations.pollEligibleCount,
        })
      : t('dashboard.operations.noOpenPolls');

  const handleSelectMeal = useCallback((mealType: MealType) => {
    setInitialMealType(mealType);
    requestAnimationFrame(() => {
      setSheetOpen(true);
    });
  }, []);

  const handleCloseSheet = useCallback(() => {
    setSheetOpen(false);
    void headcount.reload();
  }, [headcount]);

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
          style={styles.dateCenter}
          onPress={() => setMenuDate(todayIsoDate())}
          accessibilityRole="button">
          <Text style={styles.dateLabel}>{formatMenuDate(menuDate, i18n.language)}</Text>
          {menuDate !== todayIsoDate() ? (
            <Text style={styles.todayShortcut}>{t('dashboard.operations.today')}</Text>
          ) : null}
        </Pressable>
        <Pressable
          style={styles.dateNavBtn}
          onPress={() => setMenuDate(prev => addDaysIsoDate(prev, 1))}
          accessibilityRole="button">
          <Text style={styles.dateNavText}>▶</Text>
        </Pressable>
      </View>

      <View style={styles.row}>
        <OperationCard
          value={String(operations.membersReceivingMeals)}
          label={t('dashboard.operations.membersReceiving')}
        />
        <OperationCard
          value={String(operations.menusPublishedThisMonth)}
          label={t('dashboard.operations.menusPublished')}
        />
      </View>
      <View style={styles.row}>
        <OperationCard
          value={String(operations.openPollsCount)}
          label={t('dashboard.operations.openPolls')}
          hint={pollHint}
        />
        <OperationCard
          value={
            operations.todaysHeadcount != null ? String(operations.todaysHeadcount) : '—'
          }
          label={t('dashboard.operations.todaysHeadcount')}
        />
      </View>

      {headcount.loading ? (
        <ActivityIndicator color={colors.primary} style={styles.headcountLoader} />
      ) : headcount.slots.length > 0 ? (
        <View style={styles.headcountRow}>
          {headcount.slots.map(slot => (
            <HeadcountChip
              key={slot.pollId}
              label={t(mealTypeLabelKey(slot.mealType))}
              value={String(slot.mealsToPrepare)}
              onPress={() => handleSelectMeal(slot.mealType)}
            />
          ))}
        </View>
      ) : null}

      {sheetOpen && headcount.slots.length > 0 ? (
        <MealHeadcountBottomSheet
          visible={sheetOpen}
          spaceId={spaceId}
          menuDate={menuDate}
          openSlots={headcount.slots}
          initialMealType={initialMealType}
          onClose={handleCloseSheet}
        />
      ) : null}
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
    marginBottom: spacing.xs,
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
  },
  dateLabel: {
    ...typography.caption,
    color: colors.textPrimary,
    fontWeight: '600',
    textAlign: 'center',
  },
  todayShortcut: {
    ...typography.caption,
    color: colors.primaryDark,
    marginTop: 2,
    fontWeight: '600',
  },
  row: {
    flexDirection: 'row',
    gap: spacing.xs,
  },
  card: {
    flex: 1,
    minWidth: 0,
    backgroundColor: colors.white,
    borderRadius: radius.card,
    borderWidth: 1,
    borderColor: colors.border,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.xs,
    alignItems: 'center',
    gap: 2,
  },
  value: {
    ...typography.bodyStrong,
    color: colors.primaryDark,
    fontSize: 18,
  },
  label: {
    ...typography.caption,
    color: colors.muted,
    textAlign: 'center',
    fontWeight: '600',
    fontSize: 11,
  },
  hint: {
    ...typography.caption,
    color: colors.textSecondary,
    textAlign: 'center',
    fontSize: 10,
    marginTop: 2,
  },
  headcountLoader: {
    marginVertical: spacing.sm,
  },
  headcountRow: {
    flexDirection: 'row',
    gap: spacing.xs,
    marginTop: spacing.xs,
  },
  headcountChip: {
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
  headcountChipPressed: {
    opacity: 0.92,
  },
  headcountLabel: {
    ...typography.caption,
    color: colors.muted,
    textAlign: 'center',
    fontWeight: '600',
    fontSize: 11,
  },
  headcountValue: {
    ...typography.bodyStrong,
    color: colors.textPrimary,
    fontSize: 18,
  },
});
