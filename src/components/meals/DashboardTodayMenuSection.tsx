import React, { useCallback, useMemo, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import { mealsApi } from '../../api/mealsApi';
import type { DailyMenuResponse, MealComboResponse, MealType, UUID } from '../../api/types';
import { Card } from '../ui/Card';
import { colors, spacing, typography } from '../../theme';
import { MEAL_TYPES } from '../../utils/mealLabels';
import { DailyMenuSlotCard } from './DailyMenuSlotCard';

type DashboardTodayMenuSectionProps = {
  spaceId: UUID;
};

function menusByType(menus: DailyMenuResponse[]): Partial<Record<MealType, DailyMenuResponse>> {
  return menus.reduce<Partial<Record<MealType, DailyMenuResponse>>>((acc, menu) => {
    acc[menu.mealType] = menu;
    return acc;
  }, {});
}

export function DashboardTodayMenuSection({ spaceId }: DashboardTodayMenuSectionProps) {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [menus, setMenus] = useState<DailyMenuResponse[]>([]);
  const [combos, setCombos] = useState<MealComboResponse[]>([]);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [todayMenus, comboList] = await Promise.all([
        mealsApi.getDailyMenusToday(spaceId),
        mealsApi.getMealCombos(spaceId).catch(() => []),
      ]);
      setMenus(todayMenus);
      setCombos(comboList.filter(combo => combo.isActive));
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
  const comboById = useMemo(
    () => new Map(combos.map(combo => [combo.comboId, combo])),
    [combos],
  );

  const hasPublishedMenus = menus.some(menu => menu.status === 'PUBLISHED');

  return (
    <Card style={styles.card}>
      <Text style={styles.title}>{t('meals.todayMenu')}</Text>
      {loading ? <ActivityIndicator color={colors.primary} /> : null}
      {error ? <Text style={styles.error}>{error}</Text> : null}
      {!loading && !error && !hasPublishedMenus ? (
        <Text style={styles.empty}>{t('dashboard.noMealSelectionRequired')}</Text>
      ) : null}
      {!loading && !error && hasPublishedMenus
        ? MEAL_TYPES.map(mealType => (
            <DailyMenuSlotCard
              key={mealType}
              mealType={mealType}
              menu={menuMap[mealType]}
              comboById={comboById}
            />
          ))
        : null}
    </Card>
  );
}

const styles = StyleSheet.create({
  card: { marginBottom: spacing.lg },
  title: { ...typography.h3, marginBottom: spacing.md },
  error: { ...typography.caption, color: '#DC2626', marginBottom: spacing.md },
  empty: { ...typography.body, color: colors.muted },
});
