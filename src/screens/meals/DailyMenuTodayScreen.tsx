import React, { useCallback, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import { mealsApi } from '../../api/mealsApi';
import type { DailyMenuResponse, MealType, UUID } from '../../api/types';
import { DailyMenuSlotCard } from '../../components/meals';
import { Screen } from '../../components/ui/Screen';
import { colors, spacing, typography } from '../../theme';
import { MEAL_TYPES } from '../../utils/mealLabels';

type DailyMenuTodayScreenProps = {
  spaceId: UUID;
};

function menusByType(menus: DailyMenuResponse[]): Partial<Record<MealType, DailyMenuResponse>> {
  return menus.reduce<Partial<Record<MealType, DailyMenuResponse>>>((acc, menu) => {
    acc[menu.mealType] = menu;
    return acc;
  }, {});
}

export function DailyMenuTodayScreen({ spaceId }: DailyMenuTodayScreenProps) {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [menus, setMenus] = useState<DailyMenuResponse[]>([]);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setMenus(await mealsApi.getDailyMenusToday(spaceId));
    } catch {
      setError(t('meals.errors.loadFailed'));
    } finally {
      setLoading(false);
    }
  }, [spaceId, t]);

  useFocusEffect(
    useCallback(() => {
      void load();
    }, [load]),
  );

  const menuMap = menusByType(menus);

  return (
    <Screen scrollable contentStyle={styles.content}>
      <Text style={styles.title}>{t('meals.todayMenu')}</Text>
      {loading ? <ActivityIndicator color={colors.primary} /> : null}
      {error ? <Text style={styles.error}>{error}</Text> : null}
      {MEAL_TYPES.map(mealType => (
        <DailyMenuSlotCard key={mealType} mealType={mealType} menu={menuMap[mealType]} />
      ))}
      {!loading && !error && menus.length === 0 ? (
        <Text style={styles.empty}>{t('meals.menu.nothingToday')}</Text>
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { paddingBottom: spacing.section },
  title: { ...typography.h2, marginBottom: spacing.lg },
  error: { ...typography.caption, color: '#DC2626', marginBottom: spacing.md },
  empty: { ...typography.body, color: colors.muted, marginTop: spacing.lg },
});
