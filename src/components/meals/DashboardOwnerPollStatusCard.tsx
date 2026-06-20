import React, { useCallback, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import type { MealHeadcountSlot, MealType, UUID } from '../../api/types';
import { useOwnerMealHeadcount } from '../../hooks/useOwnerMealHeadcount';
import { navigateMainStack } from '../../navigation/mainStackNavigation';
import { colors, radius, spacing, typography } from '../../theme';
import { formatMenuDate, tomorrowIsoDate } from '../../utils/mealDates';
import { mealTypeLabelKey } from '../../utils/mealLabels';
import { Card } from '../ui/Card';
import { MealHeadcountBottomSheet } from './MealHeadcountBottomSheet';

type DashboardOwnerPollStatusCardProps = {
  spaceId: UUID;
};

function MealHeadcountRow({
  slots,
  onSelectMeal,
}: {
  slots: MealHeadcountSlot[];
  onSelectMeal: (mealType: MealType) => void;
}) {
  const { t } = useTranslation();

  return (
    <View style={styles.headcountRow}>
      {slots.map(slot => (
        <Pressable
          key={slot.pollId}
          style={({ pressed }) => [styles.headcountChip, pressed && styles.headcountChipPressed]}
          onPress={() => onSelectMeal(slot.mealType)}
          accessibilityRole="button">
          <Text style={styles.headcountLabel}>{t(mealTypeLabelKey(slot.mealType))}</Text>
          <Text style={styles.headcountValue}>{slot.mealsToPrepare}</Text>
        </Pressable>
      ))}
    </View>
  );
}

export function DashboardOwnerPollStatusCard({ spaceId }: DashboardOwnerPollStatusCardProps) {
  const { t, i18n } = useTranslation();
  const menuDate = tomorrowIsoDate();
  const headcount = useOwnerMealHeadcount(spaceId, menuDate, true);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [initialMealType, setInitialMealType] = useState<MealType>('LUNCH');

  const handleSelectMeal = useCallback((mealType: MealType) => {
    setInitialMealType(mealType);
    // Defer opening so the chip tap does not hit the sheet backdrop (same fix as meal poll).
    requestAnimationFrame(() => {
      setSheetOpen(true);
    });
  }, []);

  const handleCloseSheet = useCallback(() => {
    setSheetOpen(false);
    void headcount.reload();
  }, [headcount.reload]);

  const handleRemindMembers = useCallback(() => {
    navigateMainStack('MenuSharePreview', { spaceId, menuDate });
  }, [menuDate, spaceId]);

  const showCard = !headcount.loading && headcount.hasOpenPolls;

  return (
    <>
      {showCard ? (
        <Card style={styles.card}>
          <Text style={styles.title}>{t('dashboard.headcount.title')}</Text>
          <Text style={styles.date}>{formatMenuDate(menuDate, i18n.language)}</Text>
          <Text style={styles.hint}>{t('dashboard.headcount.toggleMealHint')}</Text>

          <MealHeadcountRow slots={headcount.openSlots} onSelectMeal={handleSelectMeal} />

          <Pressable style={styles.remindLink} onPress={handleRemindMembers}>
            <Text style={styles.remindLinkText}>{t('dashboard.headcount.remindMembers')}</Text>
          </Pressable>
        </Card>
      ) : null}

      {sheetOpen ? (
        <MealHeadcountBottomSheet
          visible={sheetOpen}
          spaceId={spaceId}
          menuDate={menuDate}
          openSlots={headcount.openSlots}
          initialMealType={initialMealType}
          onClose={handleCloseSheet}
        />
      ) : null}
    </>
  );
}

const styles = StyleSheet.create({
  card: { marginBottom: spacing.lg },
  title: { ...typography.h3, marginBottom: spacing.xs },
  date: { ...typography.body, color: colors.muted, marginBottom: spacing.xs },
  hint: {
    ...typography.caption,
    color: colors.muted,
    marginBottom: spacing.lg,
  },
  headcountRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  headcountChip: {
    flex: 1,
    alignItems: 'center',
    backgroundColor: colors.lightGreen,
    borderRadius: radius.card,
    borderWidth: 1,
    borderColor: `${colors.primary}22`,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.sm,
    gap: spacing.xs,
  },
  headcountChipPressed: {
    opacity: 0.92,
  },
  headcountLabel: {
    ...typography.caption,
    color: colors.muted,
    textAlign: 'center',
    fontWeight: '600',
  },
  headcountValue: {
    ...typography.h1,
    color: colors.textPrimary,
    lineHeight: 36,
  },
  remindLink: {
    alignSelf: 'flex-start',
    paddingVertical: spacing.xs,
  },
  remindLinkText: {
    ...typography.bodyStrong,
    color: colors.primaryDark,
  },
});
