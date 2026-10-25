import React, { useCallback, useLayoutEffect, useMemo, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { useFocusEffect, useNavigation, useRoute } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { CalendarDays, UtensilsCrossed } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { mealsApi } from '../../api/mealsApi';
import type { DailyMenuResponse, MealComboResponse, MealType, UUID } from '../../api/types';
import { DailyMenuSlotCard, MealFormHero } from '../../components/meals';
import { EmptyState } from '../../components/ui';
import { Screen } from '../../components/ui/Screen';
import { useSpacePermissions } from '../../hooks/useSpacePermissions';
import type { MainStackParamList } from '../../navigation/types';
import { colors, spacing, typography } from '../../theme';
import { formatMenuDate, todayIsoDate } from '../../utils/mealDates';
import { MEAL_TYPES } from '../../utils/mealLabels';

type DailyMenuTodayScreenProps = {
  spaceId: UUID;
  /** ISO date (YYYY-MM-DD). Defaults to today when omitted. */
  menuDate?: string;
  /** Meal from a notification. Shown first when that menu exists. */
  mealType?: MealType;
};

type Nav = NativeStackNavigationProp<MainStackParamList, 'DailyMenuToday'>;

function menusByType(menus: DailyMenuResponse[]): Partial<Record<MealType, DailyMenuResponse>> {
  return menus.reduce<Partial<Record<MealType, DailyMenuResponse>>>((acc, menu) => {
    acc[menu.mealType] = menu;
    return acc;
  }, {});
}

function menuHasChoices(menu: DailyMenuResponse | undefined): boolean {
  return Boolean(menu?.options?.some(option => option.isAvailable));
}

export function DailyMenuTodayScreen({
  spaceId,
  menuDate: menuDateProp,
  mealType: focusMealType,
}: DailyMenuTodayScreenProps) {
  const { t, i18n } = useTranslation();
  const navigation = useNavigation<Nav>();
  const route = useRoute();
  const permissions = useSpacePermissions(spaceId);
  const canManage = permissions.canManageMeals === true;
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
        mealsApi.getDailyMenusByDate(spaceId, menuDate),
        mealsApi.getMealCombos(spaceId).catch(() => []),
      ]);
      setMenus(dayMenus);
      setCombos(comboList.filter(combo => combo.isActive));
    } catch {
      setError(t('meals.errors.loadFailed'));
    } finally {
      setLoading(false);
    }
  }, [menuDate, spaceId, t]);

  useFocusEffect(
    useCallback(() => {
      void load();
    }, [load]),
  );

  const menuMap = useMemo(() => menusByType(menus), [menus]);
  const comboById = useMemo(
    () => new Map(combos.map(combo => [combo.comboId, combo])),
    [combos],
  );
  const visibleMealTypes = useMemo(() => {
    const planned = canManage
      ? [...MEAL_TYPES]
      : MEAL_TYPES.filter(type => menuHasChoices(menuMap[type]));
    if (!focusMealType || !planned.includes(focusMealType)) {
      return planned;
    }
    return [focusMealType, ...planned.filter(type => type !== focusMealType)];
  }, [canManage, focusMealType, menuMap]);

  const openPlanner = useCallback(
    (mealType: MealType) => {
      navigation.navigate('SelectMenuHub', { spaceId, menuDate, mealType });
    },
    [menuDate, navigation, spaceId],
  );
  const openEditor = useCallback(
    (mealType: MealType) => {
      navigation.navigate('DailyMenuEdit', { spaceId, menuDate, mealType });
    },
    [menuDate, navigation, spaceId],
  );
  const openPoll = useCallback(
    (mealType: MealType) => {
      navigation.navigate('MealPollResponse', { spaceId, menuDate, mealType });
    },
    [menuDate, navigation, spaceId],
  );

  return (
    <Screen scrollable contentStyle={styles.content}>
      <MealFormHero
        icon={isToday ? UtensilsCrossed : CalendarDays}
        eyebrow={t('meals.title')}
        heading={heading}
        subheading={subtitle}
      />
      {loading ? <ActivityIndicator color={colors.primary} /> : null}
      {error ? (
        <View style={styles.errorBanner}>
          <Text style={styles.error}>{error}</Text>
        </View>
      ) : null}
      {!loading && !error
        ? visibleMealTypes.map(mealType => (
            <DailyMenuSlotCard
              key={mealType}
              mealType={mealType}
              menu={menuMap[mealType]}
              spaceId={spaceId}
              comboById={comboById}
              readOnly={!canManage}
              onSelectMenu={canManage ? () => openPlanner(mealType) : undefined}
              onEdit={canManage ? () => openEditor(mealType) : undefined}
              onRespond={!canManage ? () => openPoll(mealType) : undefined}
            />
          ))
        : null}
      {!loading && !error && visibleMealTypes.length === 0 ? (
        <EmptyState
          title={canManage ? emptyLabel : t('meals.menu.unavailable')}
          Icon={UtensilsCrossed}
        />
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { padding: spacing.lg, paddingBottom: spacing.section },
  errorBanner: {
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FECACA',
    borderRadius: 12,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  error: { ...typography.caption, color: '#B91C1C' },
});
