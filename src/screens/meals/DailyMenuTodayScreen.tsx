import React, { useCallback, useLayoutEffect, useMemo, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text } from 'react-native';
import { useFocusEffect, useNavigation, useRoute } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useTranslation } from 'react-i18next';
import { mealsApi } from '../../api/mealsApi';
import type { DailyMenuResponse, MealComboResponse, MealType, UUID } from '../../api/types';
import { DailyMenuSlotCard } from '../../components/meals';
import { Screen } from '../../components/ui/Screen';
import type { MainStackParamList } from '../../navigation/types';
import { colors, spacing, typography } from '../../theme';
import { formatMenuDate, todayIsoDate } from '../../utils/mealDates';
import { MEAL_TYPES } from '../../utils/mealLabels';

type DailyMenuTodayScreenProps = {
  spaceId: UUID;
  /** ISO date (YYYY-MM-DD). Defaults to today when omitted. */
  menuDate?: string;
};

type Nav = NativeStackNavigationProp<MainStackParamList, 'DailyMenuToday'>;

function menusByType(menus: DailyMenuResponse[]): Partial<Record<MealType, DailyMenuResponse>> {
  return menus.reduce<Partial<Record<MealType, DailyMenuResponse>>>((acc, menu) => {
    acc[menu.mealType] = menu;
    return acc;
  }, {});
}

export function DailyMenuTodayScreen({
  spaceId,
  menuDate: menuDateProp,
}: DailyMenuTodayScreenProps) {
  const { t, i18n } = useTranslation();
  const navigation = useNavigation<Nav>();
  const route = useRoute();
  const menuDate = menuDateProp?.trim() || todayIsoDate();
  const isToday = menuDate === todayIsoDate();
  const isStackRoute = route.name === 'DailyMenuToday';

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [menus, setMenus] = useState<DailyMenuResponse[]>([]);
  const [combos, setCombos] = useState<MealComboResponse[]>([]);

  const dateLabel = useMemo(
    () => formatMenuDate(menuDate, i18n.language),
    [i18n.language, menuDate],
  );

  const heading = isToday ? t('meals.menuDetails.headingToday') : t('meals.menuDetails.heading');
  const subtitle = isToday
    ? t('meals.menuDetails.subtitleToday', { date: dateLabel })
    : t('meals.menuDetails.subtitle', { date: dateLabel });
  const emptyLabel = isToday
    ? t('meals.menu.nothingToday')
    : t('meals.menu.nothingForDate');

  useLayoutEffect(() => {
    if (!isStackRoute) {
      return;
    }
    navigation.setOptions({
      title: isToday
        ? t('meals.menuDetails.navTitleToday')
        : t('meals.menuDetails.navTitle'),
    });
  }, [isStackRoute, isToday, navigation, t, i18n.language]);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [dayMenus, comboList] = await Promise.all([
        isToday
          ? mealsApi.getDailyMenusToday(spaceId)
          : mealsApi.getDailyMenusByDate(spaceId, menuDate),
        mealsApi.getMealCombos(spaceId).catch(() => []),
      ]);
      setMenus(dayMenus);
      setCombos(comboList.filter(combo => combo.isActive));
    } catch {
      setError(t('meals.errors.loadFailed'));
    } finally {
      setLoading(false);
    }
  }, [isToday, menuDate, spaceId, t]);

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

  return (
    <Screen scrollable contentStyle={styles.content}>
      <Text style={styles.title}>{heading}</Text>
      <Text style={styles.subtitle}>{subtitle}</Text>
      {loading ? <ActivityIndicator color={colors.primary} /> : null}
      {error ? <Text style={styles.error}>{error}</Text> : null}
      {MEAL_TYPES.map(mealType => (
        <DailyMenuSlotCard
          key={mealType}
          mealType={mealType}
          menu={menuMap[mealType]}
          spaceId={spaceId}
          comboById={comboById}
        />
      ))}
      {!loading && !error && menus.length === 0 ? (
        <Text style={styles.empty}>{emptyLabel}</Text>
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { paddingBottom: spacing.section },
  title: { ...typography.h2, marginBottom: spacing.xs },
  subtitle: {
    ...typography.body,
    color: colors.textSecondary,
    marginBottom: spacing.lg,
  },
  error: { ...typography.caption, color: '#DC2626', marginBottom: spacing.md },
  empty: { ...typography.body, color: colors.muted, marginTop: spacing.lg },
});
