import React from 'react';
import { Alert, StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import type { MealComboResponse } from '../../../api/types';
import { spacing, typography } from '../../../theme';
import { formatComboNameWithPrice } from '../../../utils/comboPrice';
import { MenuChip } from './MenuChip';
import { ScrollableChipRail } from './ScrollableChipRail';

type ComboChipRailProps = {
  combos: MealComboResponse[];
  selectedComboId: string | null;
  onSelect: (comboId: string) => void;
  canManage?: boolean;
  hideTitle?: boolean;
  onAddCombo?: () => void;
  onEditCombo?: (combo: MealComboResponse) => void;
  onRemoveCombo?: (combo: MealComboResponse) => void;
};

export function ComboChipRail({
  combos,
  selectedComboId,
  onSelect,
  canManage = false,
  hideTitle = false,
  onAddCombo,
  onEditCombo,
  onRemoveCombo,
}: ComboChipRailProps) {
  const { t } = useTranslation();
  const activeCombos = combos
    .filter(combo => combo.isActive)
    .sort((a, b) => a.name.localeCompare(b.name));

  const openComboActions = (combo: MealComboResponse) => {
    if (!canManage) {
      return;
    }

    const buttons: Array<{ text: string; style?: 'destructive' | 'cancel'; onPress?: () => void }> =
      [];

    if (onEditCombo) {
      buttons.push({
        text: t('meals.library.editCombo'),
        onPress: () => onEditCombo(combo),
      });
    }

    if (onRemoveCombo) {
      buttons.push({
        text: t('meals.library.removeCombo'),
        style: 'destructive',
        onPress: () => onRemoveCombo(combo),
      });
    }

    buttons.push({ text: t('common.cancel'), style: 'cancel' });

    Alert.alert(combo.name, t('meals.library.comboActionsHint'), buttons);
  };

  const handleComboPress = (combo: MealComboResponse) => {
    if (canManage && selectedComboId === combo.comboId && onEditCombo) {
      onEditCombo(combo);
      return;
    }
    onSelect(combo.comboId);
  };

  if (activeCombos.length === 0 && !canManage) {
    return (
      <View style={styles.wrapper}>
        {!hideTitle ? <Text style={styles.sectionLabel}>{t('meals.library.combos')}</Text> : null}
        <Text style={styles.empty}>{t('meals.library.combosEmpty')}</Text>
      </View>
    );
  }

  return (
    <View style={styles.wrapper}>
      {!hideTitle ? <Text style={styles.sectionLabel}>{t('meals.library.combos')}</Text> : null}

      {activeCombos.length > 0 ? (
        <ScrollableChipRail>
            {activeCombos.map(combo => (
            <MenuChip
              key={combo.comboId}
              label={formatComboNameWithPrice(combo.name, combo.price, combo.currencyCode)}
              variant="combo"
              selected={selectedComboId === combo.comboId}
              foodType={combo.foodType ?? 'VEG'}
              onPress={() => handleComboPress(combo)}
              onLongPress={() => openComboActions(combo)}
            />
            ))}
        </ScrollableChipRail>
      ) : (
        <Text style={styles.empty}>{t('meals.library.combosEmpty')}</Text>
      )}

      {canManage && onAddCombo ? (
        <MenuChip
          label={t('meals.library.chipAddCombo')}
          variant="add"
          onPress={onAddCombo}
          style={styles.addChip}
        />
      ) : null}

      {canManage ? (
        <Text style={styles.hint}>{t('meals.library.comboManageHint')}</Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    marginBottom: spacing.sm,
    gap: spacing.sm,
  },
  sectionLabel: {
    ...typography.bodyStrong,
  },
  empty: {
    ...typography.caption,
    color: '#6B7280',
  },
  addChip: {
    alignSelf: 'flex-start',
  },
  hint: {
    ...typography.caption,
    color: '#6B7280',
  },
});
