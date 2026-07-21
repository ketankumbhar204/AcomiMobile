import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import type { DailyMenuResponse, MealPollSlot, MealType } from '../../api/types';
import { colors, radius, spacing, typography } from '../../theme';
import type { SlotShareState } from '../../utils/shareMenuSelection';
import { mealTypeLabelKey } from '../../utils/mealLabels';
import { resolveMealStatusKind } from '../../utils/mealStatusTheme';
import { MealStatusBadge } from './MealStatusBadge';

type ShareMealSlotCheckboxProps = {
  mealType: MealType;
  state: SlotShareState;
  selected: boolean;
  onToggle: () => void;
  menu?: DailyMenuResponse | null;
  poll?: Pick<MealPollSlot, 'status'> | null;
  disabled?: boolean;
};

export function ShareMealSlotCheckbox({
  mealType,
  state,
  selected,
  onToggle,
  menu,
  poll,
  disabled = false,
}: ShareMealSlotCheckboxProps) {
  const { t } = useTranslation();
  const mealLabel = t(mealTypeLabelKey(mealType));
  const shareable = state === 'shareable' && !disabled;
  const statusKind = resolveMealStatusKind(menu, poll);

  const disabledMessage =
    state === 'draft'
      ? t('meals.planning.shareDraft', { meal: mealLabel })
      : state === 'empty'
        ? t('meals.planning.shareEmptySlot', { meal: mealLabel })
        : t('meals.planning.shareNotPublished', { meal: mealLabel });

  return (
    <View style={[styles.row, !shareable && styles.rowDisabled]}>
      <Pressable
        style={styles.checkboxHit}
        onPress={shareable ? onToggle : undefined}
        disabled={!shareable}
        accessibilityRole="checkbox"
        accessibilityState={{ checked: selected, disabled: !shareable }}>
        <View
          style={[
            styles.checkbox,
            selected && shareable && styles.checkboxSelected,
            !shareable && styles.checkboxDisabled,
          ]}>
          {selected && shareable ? <Text style={styles.checkmark}>✓</Text> : null}
        </View>
        <Text style={[styles.label, !shareable && styles.labelDisabled]}>{mealLabel}</Text>
        {shareable || statusKind === 'empty' ? (
          <MealStatusBadge kind={statusKind} size="compact" />
        ) : null}
      </Pressable>
      {shareable && statusKind === 'needs_reshare' ? (
        <Text style={styles.needsReshareHint}>{t('meals.planning.shareNeedsReshareHint')}</Text>
      ) : shareable && statusKind === 'shared' ? (
        <Text style={styles.sharedHint}>{t('meals.planning.shareAlreadySharedHint')}</Text>
      ) : null}
      {!shareable ? <Text style={styles.hint}>{disabledMessage}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.card,
    padding: spacing.md,
    marginBottom: spacing.sm,
    gap: spacing.xs,
  },
  rowDisabled: {
    backgroundColor: colors.surface,
  },
  checkboxHit: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    flexWrap: 'wrap',
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxSelected: {
    backgroundColor: colors.primary,
  },
  checkboxDisabled: {
    borderColor: colors.muted,
    backgroundColor: colors.surface,
  },
  checkmark: {
    color: colors.white,
    fontSize: 14,
    fontWeight: '700',
  },
  label: {
    ...typography.bodyStrong,
  },
  labelDisabled: {
    color: colors.muted,
  },
  hint: {
    ...typography.caption,
    color: colors.muted,
    marginLeft: 36,
  },
  sharedHint: {
    ...typography.caption,
    color: colors.success,
    marginLeft: 36,
  },
  needsReshareHint: {
    ...typography.caption,
    color: '#B45309',
    marginLeft: 36,
  },
});
