import React, { useCallback, useLayoutEffect } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useTranslation } from 'react-i18next';
import { Package, UtensilsCrossed } from 'lucide-react-native';
import type { MealType, UUID } from '../../api/types';
import { MealFormHero } from '../../components/meals/MealFormHero';
import { MealTypeVisual } from '../../components/meals/MealTypeVisual';
import { DashboardActionRow } from '../../components/dashboard/shared/DashboardActionRow';
import { HeaderBackButton, Screen } from '../../components/ui';
import type { MainStackParamList } from '../../navigation/types';
import { colors, spacing, typography } from '../../theme';
import { mealTypeLabelKey } from '../../utils/mealLabels';

type Nav = NativeStackNavigationProp<MainStackParamList>;

type SelectMenuHubScreenProps = {
  spaceId: UUID;
  menuDate: string;
  mealType: MealType;
};

export function SelectMenuHubScreen({ spaceId, menuDate, mealType }: SelectMenuHubScreenProps) {
  const { t } = useTranslation();
  const navigation = useNavigation<Nav>();

  const headerLeft = useCallback(() => <HeaderBackButton />, []);

  useLayoutEffect(() => {
    navigation.setOptions({
      title: t('meals.menu.selectMenu'),
      headerBackVisible: false,
      headerLeft,
    });
  }, [headerLeft, navigation, t]);

  const goCombos = () =>
    navigation.navigate('DailyMenuSelectCombo', { spaceId, menuDate, mealType });

  return (
    <Screen contentStyle={styles.content}>
      <MealFormHero
        icon={UtensilsCrossed}
        eyebrow={t(mealTypeLabelKey(mealType))}
        heading={t('meals.menu.selectMenuHeading')}
        subheading={t('meals.menu.selectMenuHint')}
      />

      <View style={styles.mealChip}>
        <MealTypeVisual mealType={mealType} size={18} />
        <Text style={styles.mealChipText}>{t(mealTypeLabelKey(mealType))}</Text>
      </View>

      <DashboardActionRow
        icon={Package}
        accent="#D97706"
        title={t('meals.menu.hubComboTitle')}
        subtitle={t('meals.menu.hubComboDesc')}
        onPress={goCombos}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: {
    padding: spacing.lg,
    paddingBottom: spacing.section,
    gap: spacing.sm,
  },
  mealChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    alignSelf: 'flex-start',
    marginBottom: spacing.sm,
  },
  mealChipText: {
    ...typography.bodyStrong,
    fontSize: 14,
    color: colors.textSecondary,
  },
});
