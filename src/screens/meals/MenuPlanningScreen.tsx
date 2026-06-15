import React, { useCallback, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import { mealsApi } from '../../api/mealsApi';
import type {
  DailyMenuResponse,
  MealEligibilitySummaryResponse,
  MealType,
  UUID,
} from '../../api/types';
import { DailyMenuSlotCard } from '../../components/meals';
import { Screen } from '../../components/ui/Screen';
import { useMainStackNavigation } from '../../hooks/useMainStackNavigation';
import { useSpacePermissions } from '../../hooks/useSpacePermissions';
import { useToastStore } from '../../store/toastStore';
import { colors, radius, spacing, typography } from '../../theme';
import {
  addDaysIsoDate,
  formatMenuDate,
  tomorrowIsoDate,
} from '../../utils/mealDates';
import { MEAL_TYPES } from '../../utils/mealLabels';

type MenuPlanningScreenProps = {
  spaceId: UUID;
  initialDate?: string;
};

function menusByType(menus: DailyMenuResponse[]): Partial<Record<MealType, DailyMenuResponse>> {
  return menus.reduce<Partial<Record<MealType, DailyMenuResponse>>>((acc, menu) => {
    acc[menu.mealType] = menu;
    return acc;
  }, {});
}

function eligibilityByType(summary: MealEligibilitySummaryResponse | null) {
  return (summary?.slots ?? []).reduce<
    Partial<Record<MealType, { eligibleCount: number; published: boolean }>>
  >((acc, slot) => {
    acc[slot.mealType] = {
      eligibleCount: slot.eligibleCount,
      published: slot.published,
    };
    return acc;
  }, {});
}

function dayStatusSummary(menus: DailyMenuResponse[]): {
  published: number;
  draft: number;
  notPlanned: number;
} {
  let published = 0;
  let draft = 0;
  for (const mealType of MEAL_TYPES) {
    const menu = menus.find(row => row.mealType === mealType);
    if (!menu) {
      continue;
    }
    if (menu.status === 'PUBLISHED') {
      published += 1;
    } else {
      draft += 1;
    }
  }
  return {
    published,
    draft,
    notPlanned: MEAL_TYPES.length - published - draft,
  };
}

export function MenuPlanningScreen({ spaceId, initialDate }: MenuPlanningScreenProps) {
  const { t, i18n } = useTranslation();
  const { navigate: navigateMain } = useMainStackNavigation();
  const permissions = useSpacePermissions(spaceId);
  const showToast = useToastStore(state => state.showToast);

  const [menuDate, setMenuDate] = useState(initialDate ?? tomorrowIsoDate());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [menus, setMenus] = useState<DailyMenuResponse[]>([]);
  const [eligibility, setEligibility] = useState<MealEligibilitySummaryResponse | null>(null);
  const [publishingMealType, setPublishingMealType] = useState<MealType | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [menuList, summary] = await Promise.all([
        mealsApi.getDailyMenusByDate(spaceId, menuDate),
        mealsApi.getEligibilitySummary(spaceId, menuDate),
      ]);
      setMenus(menuList);
      setEligibility(summary);
    } catch {
      setError(t('meals.errors.loadFailed'));
      setMenus([]);
      setEligibility(null);
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
  const eligibilityMap = useMemo(() => eligibilityByType(eligibility), [eligibility]);
  const statusSummary = useMemo(() => dayStatusSummary(menus), [menus]);

  const openAddCombo = useCallback(
    (mealType: MealType) => {
      navigateMain('DailyMenuSelectCombo', { spaceId, menuDate, mealType });
    },
    [menuDate, navigateMain, spaceId],
  );

  const openAddItems = useCallback(
    (mealType: MealType) => {
      navigateMain('DailyMenuSelectItems', { spaceId, menuDate, mealType });
    },
    [menuDate, navigateMain, spaceId],
  );

  const openEdit = useCallback(
    (mealType: MealType) => {
      navigateMain('DailyMenuEdit', { spaceId, menuDate, mealType });
    },
    [menuDate, navigateMain, spaceId],
  );

  const publishSlot = useCallback(
    async (mealType: MealType) => {
      const menu = menus.find(row => row.mealType === mealType);
      if (!menu || menu.status !== 'DRAFT') {
        return;
      }
      const options = menu.options?.filter(option => option.isAvailable) ?? [];
      if (options.length === 0) {
        showToast(t('meals.errors.optionsRequired'));
        return;
      }
      setPublishingMealType(mealType);
      try {
        await mealsApi.publishDailyMenu(spaceId, menuDate, mealType);
        showToast(t('meals.success.published'));
        await load();
      } catch {
        showToast(t('meals.errors.saveFailed'));
      } finally {
        setPublishingMealType(null);
      }
    },
    [load, menuDate, menus, showToast, spaceId, t],
  );

  return (
    <Screen scrollable contentStyle={styles.content}>
      <Text style={styles.title}>{t('meals.planning.title')}</Text>
      <Text style={styles.subtitle}>{t('meals.planning.subtitle')}</Text>

      <View style={styles.dateRow}>
        <Pressable
          style={styles.dateNavBtn}
          onPress={() => setMenuDate(prev => addDaysIsoDate(prev, -1))}>
          <Text style={styles.dateNavText}>◀</Text>
        </Pressable>
        <View style={styles.dateCenter}>
          <Text style={styles.dateLabel}>{formatMenuDate(menuDate, i18n.language)}</Text>
          <View style={styles.dateShortcuts}>
            <Pressable onPress={() => setMenuDate(tomorrowIsoDate())}>
              <Text style={styles.shortcut}>{t('meals.planning.tomorrow')}</Text>
            </Pressable>
          </View>
        </View>
        <Pressable
          style={styles.dateNavBtn}
          onPress={() => setMenuDate(prev => addDaysIsoDate(prev, 1))}>
          <Text style={styles.dateNavText}>▶</Text>
        </Pressable>
      </View>

      {!loading && !error ? (
        <Text style={styles.statusSummary}>
          {t('meals.planning.dayStatus', {
            published: statusSummary.published,
            draft: statusSummary.draft,
            notPlanned: statusSummary.notPlanned,
          })}
        </Text>
      ) : null}

      {loading ? <ActivityIndicator color={colors.primary} style={styles.loader} /> : null}
      {error ? <Text style={styles.error}>{error}</Text> : null}

      {MEAL_TYPES.map(mealType => {
        const slotEligibility = eligibilityMap[mealType];
        return (
          <View key={mealType}>
            <DailyMenuSlotCard
              mealType={mealType}
              menu={menuMap[mealType]}
              onAddCombo={() => openAddCombo(mealType)}
              onAddItems={() => openAddItems(mealType)}
              onEdit={() => openEdit(mealType)}
              onPublish={
                permissions.canManageMeals ? () => void publishSlot(mealType) : undefined
              }
              publishing={publishingMealType === mealType}
            />
            {slotEligibility ? (
              <Text style={styles.eligibleLine}>
                {t('meals.planning.eligibleSlot', { count: slotEligibility.eligibleCount })}
              </Text>
            ) : null}
          </View>
        );
      })}

      {permissions.canManageMeals ? (
        <View style={styles.actions}>
          <Pressable
            style={styles.linkRow}
            onPress={() => navigateMain('MenuSharePreview', { spaceId, menuDate })}>
            <Text style={styles.linkText}>{t('meals.planning.previewShare')}</Text>
          </Pressable>
          <Pressable
            style={styles.linkRow}
            onPress={() => navigateMain('MenuLibrary', { spaceId })}>
            <Text style={styles.linkText}>{t('meals.library.title')}</Text>
          </Pressable>
          <Pressable
            style={styles.linkRow}
            onPress={() => navigateMain('MealParticipantList', { spaceId })}>
            <Text style={styles.linkText}>{t('meals.participants')}</Text>
          </Pressable>
          <Pressable
            style={styles.linkRow}
            onPress={() => navigateMain('DailyMenuToday', { spaceId })}>
            <Text style={styles.linkText}>{t('meals.todayMenu')}</Text>
          </Pressable>
        </View>
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { paddingBottom: spacing.section },
  title: { ...typography.h2, marginBottom: spacing.xs },
  subtitle: { ...typography.body, color: colors.muted, marginBottom: spacing.lg },
  dateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  dateNavBtn: {
    width: 40,
    height: 40,
    borderRadius: radius.button,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.white,
  },
  dateNavText: { ...typography.bodyStrong, color: colors.primaryDark },
  dateCenter: { flex: 1, alignItems: 'center' },
  dateLabel: { ...typography.bodyStrong },
  dateShortcuts: { flexDirection: 'row', gap: spacing.md, marginTop: spacing.xs },
  shortcut: { ...typography.caption, color: colors.primary, fontWeight: '600' },
  statusSummary: {
    ...typography.caption,
    color: colors.textSecondary,
    marginBottom: spacing.md,
  },
  loader: { marginVertical: spacing.lg },
  error: { ...typography.caption, color: '#DC2626', marginBottom: spacing.md },
  eligibleLine: {
    ...typography.caption,
    color: colors.muted,
    marginTop: -spacing.sm,
    marginBottom: spacing.md,
    marginLeft: spacing.xs,
  },
  actions: {
    marginTop: spacing.lg,
    gap: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingTop: spacing.md,
  },
  linkRow: { paddingVertical: spacing.sm },
  linkText: { ...typography.body, color: colors.primaryDark, fontWeight: '600' },
});
