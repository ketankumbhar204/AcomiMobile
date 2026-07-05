import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { mealsApi } from '../../api/mealsApi';
import type {
  DailyMenuResponse,
  MealComboResponse,
  MealEligibilitySummaryResponse,
  MealPollSlot,
  MealType,
  UUID,
} from '../../api/types';
import { DailyMenuSlotCard, MealHeadcountBottomSheet, MenuPlanningDayOverview } from '../../components/meals';
import { MenuDateContextHints } from '../../components/meals/MenuDateContextHints';
import { MenuDatePickerModal } from '../../components/meals/MenuDatePickerModal';
import { navigateToMembersTab } from '../../navigation/navigationRef';
import { useMainStackNavigation } from '../../hooks/useMainStackNavigation';
import { useOwnerMealHeadcount } from '../../hooks/useOwnerMealHeadcount';
import { useSpacePermissions } from '../../hooks/useSpacePermissions';
import { useToastStore } from '../../store/toastStore';
import { colors, radius, spacing, typography } from '../../theme';
import {
  addDaysIsoDate,
  formatMenuDate,
  isPastMenuDate,
  todayIsoDate,
  tomorrowIsoDate,
} from '../../utils/mealDates';
import { summarizeDailyMenuDay } from '../../utils/dailyMenuDayStatus';
import {
  filterMealTypesByPlanningStatus,
  type MenuPlanningStatusFilter,
} from '../../utils/menuPlanningFilter';
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
  return summarizeDailyMenuDay(menus);
}

export function MenuPlanningScreen({ spaceId, initialDate }: MenuPlanningScreenProps) {
  const { t, i18n } = useTranslation();
  const insets = useSafeAreaInsets();
  const { navigate: navigateMain } = useMainStackNavigation();
  const permissions = useSpacePermissions(spaceId);
  const showToast = useToastStore(state => state.showToast);

  const [menuDate, setMenuDate] = useState(initialDate ?? todayIsoDate());
  const headcount = useOwnerMealHeadcount(spaceId, menuDate, permissions.canManageMeals);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [menus, setMenus] = useState<DailyMenuResponse[]>([]);
  const [combos, setCombos] = useState<MealComboResponse[]>([]);
  const [eligibility, setEligibility] = useState<MealEligibilitySummaryResponse | null>(null);
  const [polls, setPolls] = useState<MealPollSlot[]>([]);
  const [pollActionMealType, setPollActionMealType] = useState<MealType | null>(null);
  const [headcountMealType, setHeadcountMealType] = useState<MealType | null>(null);
  const [datePickerOpen, setDatePickerOpen] = useState(false);
  const [planningStatusFilters, setPlanningStatusFilters] = useState<
    Set<MenuPlanningStatusFilter>
  >(new Set());

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

  useEffect(() => {
    setHeadcountMealType(null);
  }, [menuDate]);

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
  const visibleMealTypes = useMemo(
    () => filterMealTypesByPlanningStatus(MEAL_TYPES, menuMap, planningStatusFilters),
    [menuMap, planningStatusFilters],
  );
  const dateReadOnly = isPastMenuDate(menuDate);
  const canShareMenu = !dateReadOnly && MEAL_TYPES.some(type => hasPlannedMenu(menuMap[type]));
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

  const guardEditable = useCallback(() => {
    if (!dateReadOnly) {
      return true;
    }
    showToast(t('meals.errors.pastDateReadOnly'));
    return false;
  }, [dateReadOnly, showToast, t]);

  const openSelectMenu = useCallback(
    (mealType: MealType) => {
      if (!guardEditable()) {
        return;
      }
      navigateMain('DailyMenuEdit', { spaceId, menuDate, mealType });
    },
    [guardEditable, menuDate, navigateMain, spaceId],
  );

  const openEdit = useCallback(
    (mealType: MealType) => {
      if (!guardEditable()) {
        return;
      }
      navigateMain('DailyMenuEdit', { spaceId, menuDate, mealType });
    },
    [guardEditable, menuDate, navigateMain, spaceId],
  );

  const openShare = useCallback(
    (mealType?: MealType) => {
      if (!guardEditable()) {
        return;
      }
      navigateMain('MenuSharePreview', {
        spaceId,
        menuDate,
        ...(mealType ? { mealType } : {}),
      });
    },
    [guardEditable, menuDate, navigateMain, spaceId],
  );

  const closePoll = useCallback(
    async (mealType: MealType) => {
      if (!guardEditable()) {
        return;
      }
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
    [guardEditable, load, menuDate, showToast, spaceId, t],
  );

  const openHeadcount = useCallback((mealType: MealType) => {
    setHeadcountMealType(mealType);
  }, []);

  const closeHeadcount = useCallback(() => {
    setHeadcountMealType(null);
    void headcount.reload();
  }, [headcount]);

  return (
    <View style={styles.root}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[
          styles.content,
          { paddingBottom: spacing.section + Math.max(insets.bottom, spacing.md) },
        ]}
        keyboardShouldPersistTaps="handled"
        nestedScrollEnabled
        showsVerticalScrollIndicator={false}>
      <Text style={styles.subtitle}>{t('meals.planning.subtitle')}</Text>

      <View style={styles.dateRow}>
        <Pressable
          style={styles.dateNavBtn}
          onPress={() => setMenuDate(prev => addDaysIsoDate(prev, -1))}>
          <Text style={styles.dateNavText}>◀</Text>
        </Pressable>
        <Pressable
          style={({ pressed }) => [styles.dateCenter, pressed && styles.dateCenterPressed]}
          onPress={() => setDatePickerOpen(true)}
          accessibilityRole="button"
          accessibilityLabel={formatMenuDate(menuDate, i18n.language)}
          accessibilityHint={t('meals.planning.openCalendar')}>
          <Text style={styles.dateLabel}>{formatMenuDate(menuDate, i18n.language)}</Text>
          <MenuDateContextHints
            menuDate={menuDate}
            onJumpToToday={() => setMenuDate(todayIsoDate())}
            onJumpToTomorrow={() => setMenuDate(tomorrowIsoDate())}
          />
        </Pressable>
        <Pressable
          style={styles.dateNavBtn}
          onPress={() => setMenuDate(prev => addDaysIsoDate(prev, 1))}>
          <Text style={styles.dateNavText}>▶</Text>
        </Pressable>
      </View>

      {dateReadOnly ? (
        <View style={styles.readOnlyBanner}>
          <Text style={styles.readOnlyBannerText}>{t('meals.planning.pastDateReadOnly')}</Text>
        </View>
      ) : null}

      {!loading && !error ? (
        <MenuPlanningDayOverview
          menuMap={menuMap}
          pollMap={pollMap}
          statusSummary={statusSummary}
          eligibleCount={distinctEligible}
          selectedFilters={planningStatusFilters}
          onFilterChange={setPlanningStatusFilters}
          shareDisabled={!canShareMenu}
          onShare={permissions.canManageMeals ? () => openShare() : undefined}
          dateReadOnly={dateReadOnly}
        />
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

      {visibleMealTypes.map(mealType => {
        const slotEligibility = eligibilityMap[mealType];
        const slotPoll = pollMap[mealType];
        return (
          <View key={mealType}>
            <DailyMenuSlotCard
              mealType={mealType}
              menu={menuMap[mealType]}
              spaceId={spaceId}
              comboById={comboById}
              readOnly={dateReadOnly}
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
              onViewHeadcount={
                permissions.canManageMeals && slotPoll ? () => openHeadcount(mealType) : undefined
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
          {permissions.spaceType === 'MESS' ? (
            <Pressable
              style={styles.linkRow}
              onPress={() => navigateMain('MealDeliveryLocations', { spaceId })}>
              <Text style={styles.linkText}>{t('meals.deliveryLocations.manage')}</Text>
            </Pressable>
          ) : null}
          <Pressable
            style={styles.linkRow}
            onPress={() => navigateMain('SubscriptionPlans', { spaceId })}>
            <Text style={styles.linkText}>{t('meals.subscriptionPlans.title')}</Text>
          </Pressable>
        </View>
      ) : null}
      </ScrollView>

      {headcountMealType && headcount.openSlots.length > 0 ? (
        <MealHeadcountBottomSheet
          visible
          spaceId={spaceId}
          menuDate={menuDate}
          openSlots={headcount.openSlots}
          initialMealType={headcountMealType}
          onClose={closeHeadcount}
          readOnly={dateReadOnly}
        />
      ) : null}

      <MenuDatePickerModal
        visible={datePickerOpen}
        value={menuDate}
        allowPastDates
        onClose={() => setDatePickerOpen(false)}
        onConfirm={setMenuDate}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  scroll: { flex: 1 },
  content: { padding: spacing.xxl },
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
  readOnlyBanner: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.button,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  readOnlyBannerText: { ...typography.caption, color: colors.muted, lineHeight: 18 },
  dateCenter: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: spacing.xs,
    borderRadius: radius.button,
  },
  dateCenterPressed: {
    backgroundColor: colors.surface,
  },
  dateLabel: {
    ...typography.bodyStrong,
    color: colors.primaryDark,
    textDecorationLine: 'underline',
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
