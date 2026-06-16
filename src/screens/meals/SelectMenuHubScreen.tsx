import React, { useLayoutEffect } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useTranslation } from 'react-i18next';
import type { MealType, UUID } from '../../api/types';
import { Screen } from '../../components/ui/Screen';
import type { MainStackParamList } from '../../navigation/types';
import { colors, radius, spacing, typography } from '../../theme';
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

  useLayoutEffect(() => {
    navigation.setOptions({
      title: t('meals.menu.selectMenu'),
    });
  }, [mealType, navigation, t]);

  const goCombos = () =>
    navigation.navigate('DailyMenuSelectCombo', { spaceId, menuDate, mealType });

  return (
    <Screen contentStyle={styles.content}>
      <Text style={styles.meal}>{t(mealTypeLabelKey(mealType))}</Text>
      <Text style={styles.heading}>{t('meals.menu.selectMenuHeading')}</Text>
      <Text style={styles.hint}>{t('meals.menu.selectMenuHint')}</Text>

      <Pressable style={styles.optionCard} onPress={goCombos}>
        <Text style={styles.optionIcon}>📦</Text>
        <View style={styles.optionText}>
          <Text style={styles.optionTitle}>{t('meals.menu.hubComboTitle')}</Text>
          <Text style={styles.optionDesc}>{t('meals.menu.hubComboDesc')}</Text>
        </View>
        <Pressable style={styles.optionButton} onPress={goCombos}>
          <Text style={styles.optionButtonText}>{t('meals.menu.hubComboAction')}</Text>
        </Pressable>
      </Pressable>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { paddingBottom: spacing.section },
  meal: {
    ...typography.caption,
    color: colors.muted,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
    marginBottom: spacing.xs,
  },
  heading: { ...typography.h2, marginBottom: spacing.xs },
  hint: { ...typography.body, color: colors.muted, marginBottom: spacing.xl },
  optionCard: {
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.card,
    padding: spacing.md,
    marginBottom: spacing.md,
    gap: spacing.sm,
  },
  optionIcon: { fontSize: 28 },
  optionText: { flex: 1, gap: spacing.xxs },
  optionTitle: { ...typography.bodyStrong },
  optionDesc: { ...typography.caption, color: colors.muted },
  optionButton: {
    alignSelf: 'flex-start',
    borderWidth: 1,
    borderColor: colors.primary,
    borderRadius: radius.button,
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.md,
    marginTop: spacing.xs,
  },
  optionButtonText: { ...typography.bodyStrong, color: colors.primaryDark, fontSize: 13 },
});
