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
  MealComboResponse,
  MealEligibilitySummaryResponse,
  MealPollSlot,
  MealType,
  UUID,
} from '../../api/types';
import { DailyMenuSlotCard } from '../../components/meals';
import { Button, Screen } from '../../components/ui';
import { navigateToMembersTab } from '../../navigation/navigationRef';
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

function hasPlannedMenu(menu?: DailyMenuResponse | null): boolean {
  return (menu?.options?.filter(option => option.isAvailable) ?? []).length > 0;
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
  const [combos, setCombos] = useState<MealComboResponse[]>([]);
  const [eligibility, setEligibility] = useState<MealEligibilitySummaryResponse | null>(null);
  const [polls, setPolls] = useState<MealPollSlot[]>([]);
  const [pollActionMealType, setPollActionMealType] = useState<MealType | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [menuList, summary, pollDay, comboList] = await Promise.all([
        mealsApi.getDailyMenusByDate(spaceId, menuDate),
        mealsApi.getEligibilitySummary(spaceId, menuDate),
        mealsApi.getMealPolls(spaceId, menuDate).catch(() => ({ pollDate: menuDate, polls: [] })),
        mealsApi.getMealCombos(spaceId).catch(() => []),
      ]);
      setMenus(menuList);
      setCombos(comboList.filter(combo => combo.isActive));
      setEligibility(summary);
      setPolls(pollDay.polls);
    } catch {
      setError(t('meals.errors.loadFailed'));
      setMenus([]);
      setCombos([]);
      setEligibility(null);
      setPolls([]);
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
  const pollMap = useMemo(
    () =>
      polls.reduce<Partial<Record<MealType, MealPollSlot>>>((acc, poll) => {
        acc[poll.mealType] = poll;
        return acc;
      }, {}),
    [polls],
  );
  const eligibilityMap = useMemo(() => eligibilityByType(eligibility), [eligibility]);
  const statusSummary = useMemo(() => dayStatusSummary(menus), [menus]);
  const canShareMenu = MEAL_TYPES.some(type => hasPlannedMenu(menuMap[type]));
  const distinctEligible = useMemo(() => {
    if (!eligibility) {
      return 0;
    }
    if (eligibility.distinctEligibleMemberCount != null) {
      return eligibility.distinctEligibleMemberCount;
    }
    return eligibility.slots.reduce(
      (max, slot) => Math.max(max, slot.eligibleCount),
      0,
    );
  }, [eligibility]);

  const openSelectMenu = useCallback(
    (mealType: MealType) => {
      navigateMain('DailyMenuEdit', { spaceId, menuDate, mealType });
    },
    [menuDate, navigateMain, spaceId],
  );

  const openEdit = useCallback(
    (mealType: MealType) => {
      navigateMain('DailyMenuEdit', { spaceId, menuDate, mealType });
    },
    [menuDate, navigateMain, spaceId],
  );

  const openShare = useCallback(
    (mealType?: MealType) => {
      navigateMain('MenuSharePreview', {
        spaceId,
        menuDate,
        ...(mealType ? { mealType } : {}),
      });
    },
    [menuDate, navigateMain, spaceId],
  );

  const closePoll = useCallback(
    async (mealType: MealType) => {
      setPollActionMealType(mealType);
      try {
        await mealsApi.closeMealPoll(spaceId, menuDate, mealType);
        showToast(t('meals.poll.closeSuccess'));
        await load();
      } catch {
        showToast(t('meals.errors.saveFailed'));
      } finally {
        setPollActionMealType(null);
      }
    },
    [load, menuDate, showToast, spaceId, t],
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

      {!loading && !error ? (
        <Text style={styles.eligibleSummary}>
          {t('meals.planning.eligibleMembers', { count: distinctEligible })}
        </Text>
      ) : null}

      {permissions.canManageMeals && !loading && !error ? (
        <Button
          label={t('meals.planning.shareMenu')}
          disabled={!canShareMenu}
          onPress={() => openShare()}
          style={styles.shareButton}
        />
      ) : null}

      {!loading && !error && permissions.canManageMeals && !canShareMenu ? (
        <Text style={styles.shareDisabledHint}>{t('meals.planning.previewShareDisabled')}</Text>
      ) : null}

      {loading ? <ActivityIndicator color={colors.primary} style={styles.loader} /> : null}
      {error ? <Text style={styles.error}>{error}</Text> : null}

      {!loading && !error && permissions.canManageMeals && distinctEligible === 0 ? (
        <Pressable
          style={styles.enrollBanner}
          onPress={() => navigateToMembersTab(spaceId)}>
          <Text style={styles.enrollBannerTitle}>{t('meals.planning.noEligibleMembersCta')}</Text>
          <Text style={styles.enrollBannerHint}>{t('meals.planning.noEligibleMembersHint')}</Text>
        </Pressable>
      ) : null}

      {MEAL_TYPES.map(mealType => {
        const slotEligibility = eligibilityMap[mealType];
        const slotPoll = pollMap[mealType];
        return (
          <View key={mealType}>
            <DailyMenuSlotCard
              mealType={mealType}
              menu={menuMap[mealType]}
              comboById={comboById}
              onSelectMenu={() => openSelectMenu(mealType)}
              onEdit={() => openEdit(mealType)}
              onShare={
                permissions.canManageMeals && hasPlannedMenu(menuMap[mealType])
                  ? () => openShare(mealType)
                  : undefined
              }
              onClosePoll={
                permissions.canManageMeals && slotPoll?.status === 'OPEN'
                  ? () => void closePoll(mealType)
                  : undefined
              }
              pollStatus={slotPoll?.status ?? null}
              pollResponseCount={slotPoll?.responseCount ?? 0}
              pollActionLoading={pollActionMealType === mealType}
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
            onPress={() => navigateMain('MenuLibrary', { spaceId })}>
            <Text style={styles.linkText}>{t('meals.library.title')}</Text>
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
    marginBottom: spacing.sm,
  },
  eligibleSummary: {
    ...typography.bodyStrong,
    color: colors.primaryDark,
    marginBottom: spacing.sm,
  },
  shareButton: { marginBottom: spacing.md },
  shareDisabledHint: {
    ...typography.caption,
    color: colors.muted,
    marginTop: -spacing.sm,
    marginBottom: spacing.md,
  },
  loader: { marginVertical: spacing.lg },
  error: { ...typography.caption, color: '#DC2626', marginBottom: spacing.md },
  enrollBanner: {
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.primary,
    borderRadius: radius.button,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  enrollBannerTitle: { ...typography.bodyStrong, color: colors.primaryDark, marginBottom: spacing.xxs },
  enrollBannerHint: { ...typography.caption, color: colors.muted },
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
