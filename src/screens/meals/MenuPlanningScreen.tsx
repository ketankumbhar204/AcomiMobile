import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  LayoutAnimation,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  UIManager,
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
import { PollCloseAtPickerModal } from '../../components/meals/PollCloseAtPickerModal';
import { navigateToMembersTab } from '../../navigation/navigationRef';
import { PermissionDeniedScreen } from '../../components/ui/PermissionDeniedScreen';
import { useMainStackNavigation } from '../../hooks/useMainStackNavigation';
import { useOwnerMealHeadcount } from '../../hooks/useOwnerMealHeadcount';
import { useSpacePermissions } from '../../hooks/useSpacePermissions';
import { useToastStore } from '../../store/toastStore';
import { formatPollCloseLabel } from '../../utils/pollCloseDisplay';
import { colors, radius, spacing, typography } from '../../theme';
import {
  addDaysIsoDate,
  formatMenuDate,
  isPastMenuDate,
  todayIsoDate,
  tomorrowIsoDate,
} from '../../utils/mealDates';
import { summarizeDailyMenuDay, type DailyMenuDaySummary } from '../../utils/dailyMenuDayStatus';
import { buildDashboardMealSlotRows } from '../../utils/dashboardMealSlotDisplay';
import { fetchSpaceMenuCatalog } from '../../utils/fetchSpaceMenuCatalog';
import { MEAL_TYPES } from '../../utils/mealLabels';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

type MenuPlanningScreenProps = {
  spaceId: UUID;
  initialDate?: string;
  initialMealType?: MealType;
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

function dayStatusSummary(menus: DailyMenuResponse[]): DailyMenuDaySummary {
  return summarizeDailyMenuDay(menus);
}

export function MenuPlanningScreen({
  spaceId,
  initialDate,
  initialMealType,
}: MenuPlanningScreenProps) {
  const { t, i18n } = useTranslation();
  const insets = useSafeAreaInsets();
  const { navigate: navigateMain } = useMainStackNavigation();
  const permissions = useSpacePermissions(spaceId);
  const showToast = useToastStore(state => state.showToast);
  const canManage = permissions.canManageMeals === true;

  const [menuDate, setMenuDate] = useState(initialDate ?? todayIsoDate());
  const headcount = useOwnerMealHeadcount(spaceId, menuDate, canManage);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [menus, setMenus] = useState<DailyMenuResponse[]>([]);
  const [combos, setCombos] = useState<MealComboResponse[]>([]);
  const [eligibility, setEligibility] = useState<MealEligibilitySummaryResponse | null>(null);
  const [polls, setPolls] = useState<MealPollSlot[]>([]);
  const [pollActionMealType, setPollActionMealType] = useState<MealType | null>(null);
  const [headcountMealType, setHeadcountMealType] = useState<MealType | null>(null);
  const [datePickerOpen, setDatePickerOpen] = useState(false);
  const [closeAtEditMealType, setCloseAtEditMealType] = useState<MealType | null>(null);
  const [closeAtSaving, setCloseAtSaving] = useState(false);
  const [copyYesterdayLoading, setCopyYesterdayLoading] = useState(false);
  /** Remembers the active meal while this screen stays mounted. */
  const [selectedMealType, setSelectedMealType] = useState<MealType>(
    initialMealType ?? 'BREAKFAST',
  );

  useEffect(() => {
    if (initialMealType) {
      setSelectedMealType(initialMealType);
    }
  }, [initialMealType]);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [menuList, summary, pollDay, catalog] = await Promise.all([
        mealsApi.getDailyMenusByDate(spaceId, menuDate),
        mealsApi.getEligibilitySummary(spaceId, menuDate),
        mealsApi.getMealPolls(spaceId, menuDate).catch(() => ({ pollDate: menuDate, polls: [] })),
        fetchSpaceMenuCatalog(spaceId).catch(() => ({
          categories: [],
          items: [],
          combos: [],
        })),
      ]);
      setMenus(menuList);
      setCombos(catalog.combos.filter(combo => combo.isActive));
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
  const eligibleCountByMeal = useMemo(() => {
    const map: Partial<Record<MealType, number>> = {};
    for (const mealType of MEAL_TYPES) {
      map[mealType] = eligibilityMap[mealType]?.eligibleCount ?? 0;
    }
    return map;
  }, [eligibilityMap]);
  const platesByMeal = useMemo(() => {
    const map: Partial<Record<MealType, number>> = {};
    for (const slot of headcount.slots) {
      map[slot.mealType] = slot.mealsToPrepare;
    }
    return map;
  }, [headcount.slots]);
  const statusSummary = useMemo(() => dayStatusSummary(menus), [menus]);
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
  const headcountSlotRows = useMemo(
    () =>
      buildDashboardMealSlotRows(
        menuMap,
        pollMap,
        eligibleCountByMeal,
        platesByMeal,
        distinctEligible,
      ),
    [distinctEligible, eligibleCountByMeal, menuMap, platesByMeal, pollMap],
  );

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

  const savePollCloseAt = useCallback(
    async (pollCloseAt: string) => {
      if (!closeAtEditMealType || !guardEditable()) {
        return;
      }
      setCloseAtSaving(true);
      try {
        await mealsApi.updateMealPollCloseAt(spaceId, menuDate, closeAtEditMealType, pollCloseAt);
        showToast(t('meals.poll.closeAtSaved'));
        setCloseAtEditMealType(null);
        await load();
      } catch {
        showToast(t('meals.errors.saveFailed'));
      } finally {
        setCloseAtSaving(false);
      }
    },
    [closeAtEditMealType, guardEditable, load, menuDate, showToast, spaceId, t],
  );

  const openHeadcount = useCallback((mealType: MealType) => {
    setHeadcountMealType(mealType);
  }, []);

  const closeHeadcount = useCallback(() => {
    setHeadcountMealType(null);
    void headcount.reload();
  }, [headcount]);

  const selectMealType = useCallback((mealType: MealType) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setSelectedMealType(mealType);
  }, []);

  const copyYesterdayForSelected = useCallback(async () => {
    if (!guardEditable()) {
      return;
    }
    setCopyYesterdayLoading(true);
    try {
      await mealsApi.copyDailyMenu(
        spaceId,
        menuDate,
        selectedMealType,
        addDaysIsoDate(menuDate, -1),
      );
      showToast(t('meals.planning.copySuccess'));
      await load();
    } catch {
      showToast(t('meals.planning.copyFailed'));
    } finally {
      setCopyYesterdayLoading(false);
    }
  }, [guardEditable, load, menuDate, selectedMealType, showToast, spaceId, t]);

  const openPolls = useMemo(
    () => polls.filter(poll => poll.status === 'OPEN'),
    [polls],
  );
  const hasOpenPolls = openPolls.length > 0;
  const respondedCount = useMemo(() => {
    if (openPolls.length === 0) {
      return 0;
    }
    return Math.max(...openPolls.map(poll => poll.responseCount));
  }, [openPolls]);

  const selectedPoll = pollMap[selectedMealType];
  const selectedEligibility = eligibilityMap[selectedMealType];

  if (!canManage) {
    return <PermissionDeniedScreen spaceId={spaceId} />;
  }

  return (
    <View style={styles.root}>
      <View style={styles.stickyHeader}>
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
            eligibilityByMeal={eligibleCountByMeal}
            statusSummary={statusSummary}
            eligibleCount={distinctEligible}
            selectedMealType={selectedMealType}
            onSelectMealType={selectMealType}
            shareDisabled={!canShareMenu}
            onShare={permissions.canManageMeals ? () => openShare() : undefined}
            dateReadOnly={dateReadOnly}
            hasOpenPolls={hasOpenPolls}
            respondedCount={respondedCount}
          />
        ) : null}
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[
          styles.content,
          { paddingBottom: spacing.section + Math.max(insets.bottom, spacing.md) },
        ]}
        keyboardShouldPersistTaps="handled"
        nestedScrollEnabled
        showsVerticalScrollIndicator={false}>
        {loading ? <ActivityIndicator color={colors.primary} style={styles.loader} /> : null}
        {error ? (
          <View style={styles.errorBlock}>
            <Text style={styles.error}>{error}</Text>
            <Pressable
              style={({ pressed }) => [styles.retryButton, pressed && styles.retryButtonPressed]}
              onPress={() => void load()}
              accessibilityRole="button">
              <Text style={styles.retryButtonText}>{t('common.retry')}</Text>
            </Pressable>
          </View>
        ) : null}

        {!loading && !error && permissions.canManageMeals && distinctEligible === 0 ? (
          <Pressable
            style={styles.enrollBanner}
            onPress={() => navigateToMembersTab(spaceId)}>
            <Text style={styles.enrollBannerTitle}>{t('meals.planning.noEligibleMembersCta')}</Text>
            <Text style={styles.enrollBannerHint}>{t('meals.planning.noEligibleMembersHint')}</Text>
          </Pressable>
        ) : null}

        {!loading && !error ? (
          <View style={styles.detailPanel}>
            <DailyMenuSlotCard
              mealType={selectedMealType}
              menu={menuMap[selectedMealType]}
              spaceId={spaceId}
              comboById={comboById}
              readOnly={dateReadOnly}
              onSelectMenu={() => openSelectMenu(selectedMealType)}
              onEdit={() => openEdit(selectedMealType)}
              onCopyYesterday={
                !dateReadOnly && permissions.canManageMeals
                  ? () => void copyYesterdayForSelected()
                  : undefined
              }
              copyYesterdayLoading={copyYesterdayLoading}
              onShare={
                permissions.canManageMeals && hasPlannedMenu(menuMap[selectedMealType])
                  ? () => openShare(selectedMealType)
                  : undefined
              }
              onClosePoll={
                permissions.canManageMeals && selectedPoll?.status === 'OPEN'
                  ? () => void closePoll(selectedMealType)
                  : undefined
              }
              onEditPollCloseAt={
                permissions.canManageMeals && selectedPoll?.status === 'OPEN' && !dateReadOnly
                  ? () => setCloseAtEditMealType(selectedMealType)
                  : undefined
              }
              onViewHeadcount={
                permissions.canManageMeals && selectedPoll
                  ? () => openHeadcount(selectedMealType)
                  : undefined
              }
              pollStatus={selectedPoll?.status ?? null}
              pollResponseCount={selectedPoll?.responseCount ?? 0}
              pollActionLoading={pollActionMealType === selectedMealType}
              pollCloseAtLabel={
                selectedPoll?.pollCloseAt
                  ? formatPollCloseLabel(
                      selectedPoll.pollCloseAt,
                      selectedPoll.timezone,
                      i18n.language,
                    )
                  : null
              }
              pollClosedAtLabel={
                selectedPoll?.closedAt
                  ? formatPollCloseLabel(
                      selectedPoll.closedAt,
                      selectedPoll.timezone,
                      i18n.language,
                    )
                  : null
              }
              pollCloseSource={selectedPoll?.closeSource ?? null}
            />
            {selectedEligibility ? (
              <Text style={styles.eligibleLine}>
                {t('meals.planning.eligibleSlot', {
                  count: selectedEligibility.eligibleCount,
                })}
              </Text>
            ) : null}
          </View>
        ) : null}

        {permissions.canManageMeals ? (
          <View style={styles.actions}>
            <Pressable
              style={styles.linkRow}
              onPress={() => navigateMain('MenuLibrary', { spaceId })}>
              <Text style={styles.linkText}>{t('meals.library.title')}</Text>
            </Pressable>
            <Pressable
              style={styles.linkRow}
              onPress={() =>
                navigateMain('DailyMenuToday', { spaceId, menuDate })
              }>
              <Text style={styles.linkText}>
                {menuDate === todayIsoDate()
                  ? t('meals.todayMenu')
                  : t('meals.menuDetails.heading')}
              </Text>
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
          slotRows={headcountSlotRows}
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

      <PollCloseAtPickerModal
        visible={closeAtEditMealType != null}
        initialCloseAt={
          closeAtEditMealType
            ? pollMap[closeAtEditMealType]?.pollCloseAt ?? null
            : null
        }
        saving={closeAtSaving}
        onCancel={() => setCloseAtEditMealType(null)}
        onSave={value => void savePollCloseAt(value)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  stickyHeader: {
    paddingHorizontal: spacing.xxl,
    paddingTop: spacing.lg,
    paddingBottom: spacing.sm,
    backgroundColor: colors.background,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
    gap: spacing.sm,
  },
  scroll: { flex: 1 },
  content: { paddingHorizontal: spacing.xxl, paddingTop: spacing.md },
  subtitle: { ...typography.body, color: colors.muted },
  dateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
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
  error: { ...typography.caption, color: '#DC2626', marginBottom: spacing.sm },
  errorBlock: {
    marginBottom: spacing.md,
    alignItems: 'flex-start',
    gap: spacing.sm,
  },
  retryButton: {
    alignSelf: 'flex-start',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: radius.button,
    borderWidth: 1,
    borderColor: colors.primary,
    backgroundColor: colors.lightGreen,
  },
  retryButtonPressed: {
    opacity: 0.85,
  },
  retryButtonText: {
    ...typography.caption,
    color: colors.primaryDark,
    fontWeight: '700',
  },
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
  detailPanel: {
    marginBottom: spacing.sm,
  },
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
