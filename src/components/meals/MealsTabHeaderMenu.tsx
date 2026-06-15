import React, { useCallback } from 'react';
import { StyleSheet, Text, TouchableOpacity } from 'react-native';
import { useTranslation } from 'react-i18next';
import type { UUID } from '../../api/types';
import { navigateMainStack } from '../../navigation/mainStackNavigation';
import { useAccommodationActionSheetStore } from '../../store/accommodationActionSheetStore';
import { colors, spacing } from '../../theme';

type MealsTabHeaderMenuProps = {
  spaceId: UUID;
};

export function MealsTabHeaderMenu({ spaceId }: MealsTabHeaderMenuProps) {
  const { t } = useTranslation();
  const openActionSheet = useAccommodationActionSheetStore(state => state.open);

  const handlePress = useCallback(() => {
    openActionSheet(t('navigation.meals'), [
      {
        label: t('meals.library.title'),
        action: () => navigateMainStack('MenuLibrary', { spaceId }),
      },
      {
        label: t('meals.todayMenu'),
        action: () => navigateMainStack('DailyMenuToday', { spaceId }),
      },
    ]);
  }, [openActionSheet, spaceId, t]);

  return (
    <TouchableOpacity
      activeOpacity={0.6}
      onPress={handlePress}
      style={styles.trigger}
      hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
      accessibilityRole="button"
      accessibilityLabel={t('meals.planning.overflowMenu')}>
      <Text style={styles.triggerIcon}>⋮</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  trigger: {
    marginRight: spacing.md,
    minWidth: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.sm,
  },
  triggerIcon: {
    fontSize: 22,
    fontWeight: '700',
    color: colors.textPrimary,
    lineHeight: 24,
  },
});
