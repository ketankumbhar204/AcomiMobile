import React, { useCallback, useEffect, useLayoutEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useTranslation } from 'react-i18next';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  BookOpen,
  Calendar,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Crown,
  MapPin,
} from 'lucide-react-native';
import { mealsApi } from '../../api/mealsApi';
import type {
  DailyMenuResponse,
  MealEligibilitySummaryResponse,
  MealType,
  UUID,
} from '../../api/types';
import {
  CopyPreviousMenuSheet,
  MenuPlanningDayOverview,
} from '../../components/meals';
import { MenuDatePickerModal } from '../../components/meals/MenuDatePickerModal';
import { navigateToMembersTab } from '../../navigation/navigationRef';
import type { MainStackParamList } from '../../navigation/types';
import { HeaderOverflowMenu } from '../../components/ui/HeaderOverflowMenu';
import { PermissionDeniedScreen } from '../../components/ui/PermissionDeniedScreen';
import { Button } from '../../components/ui/Button';
import { StackTitleWithSubtitle } from '../../components/ui/StackTitleWithSubtitle';
import { useMainStackNavigation } from '../../hooks/useMainStackNavigation';
import { useSpacePermissions } from '../../hooks/useSpacePermissions';
import { useSpaceStore } from '../../store/spaceStore';
import { useToastStore } from '../../store/toastStore';
import { colors, radius, shadows, spacing, typography } from '../../theme';
import {
  addDaysIsoDate,
  formatMenuDate,
  isPastMenuDate,
  relativeMenuDateKind,
  relativeMenuDateLabelKey,
  todayIsoDate,
  tomorrowIsoDate,
} from '../../utils/mealDates';
import { summarizeDailyMenuDay } from '../../utils/dailyMenuDayStatus';
import { MEAL_TYPES } from '../../utils/mealLabels';
import { findMySpaceEntry } from '../../utils/spacePermissions';

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

function hasPlannedMenu(menu?: DailyMenuResponse | null): boolean {
  return (menu?.options?.filter(option => option.isAvailable) ?? []).length > 0;
}

export function MenuPlanningScreen({
  spaceId,
  initialDate,
  initialMealType,
}: MenuPlanningScreenProps) {
  const { t, i18n } = useTranslation();
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<NativeStackNavigationProp<MainStackParamList>>();
  const { navigate: navigateMain } = useMainStackNavigation();
  const permissions = useSpacePermissions(spaceId);
  const showToast = useToastStore(state => state.showToast);
  const mySpaces = useSpaceStore(state => state.mySpaces);
  const currentSpace = useSpaceStore(state => state.currentSpace);
  const canManage = permissions.canManageMeals === true;

  const spaceName = useMemo(() => {
    const entry = findMySpaceEntry(mySpaces, spaceId);
    return entry?.spaceName ?? (currentSpace?.spaceId === spaceId ? currentSpace.spaceName : null);
  }, [currentSpace?.spaceId, currentSpace?.spaceName, mySpaces, spaceId]);

  const [menuDate, setMenuDate] = useState(initialDate ?? todayIsoDate());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [menus, setMenus] = useState<DailyMenuResponse[]>([]);
  const [eligibility, setEligibility] = useState<MealEligibilitySummaryResponse | null>(null);
  const [datePickerOpen, setDatePickerOpen] = useState(false);
  const [copyMenuOpen, setCopyMenuOpen] = useState(false);
  const [dismissCustomersHint, setDismissCustomersHint] = useState(false);
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
      load().catch(() => undefined);
    }, [load]),
  );

  const menuMap = useMemo(() => menusByType(menus), [menus]);
  const statusSummary = useMemo(() => summarizeDailyMenuDay(menus), [menus]);
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

  const openPlanner = useCallback(
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
      if (permissions.spaceType === 'MESS' && distinctEligible === 0) {
        Alert.alert(
          t('meals.planning.shareBlockedNoCustomersTitle'),
          t('meals.planning.shareBlockedNoCustomersBody'),
          [
            { text: t('common.cancel'), style: 'cancel' },
            {
              text: t('meals.planning.shareBlockedNoCustomersCta'),
              onPress: () => navigateMain('AddCustomersHub', { spaceId }),
            },
          ],
        );
        return;
      }
      navigateMain('MenuSharePreview', {
        spaceId,
        menuDate,
        ...(mealType ? { mealType } : {}),
      });
    },
    [
      distinctEligible,
      guardEditable,
      menuDate,
      navigateMain,
      permissions.spaceType,
      spaceId,
      t,
    ],
  );

  /** Meal strip only; detail card removed ? tap opens DailyMenuEdit. */
  const selectMealType = useCallback(
    (mealType: MealType) => {
      setSelectedMealType(mealType);
      if (permissions.canManageMeals) {
        openPlanner(mealType);
      }
    },
    [openPlanner, permissions.canManageMeals],
  );
  const relativeKind = relativeMenuDateKind(menuDate);
  const renderHeaderTitle = useCallback(
    () => <StackTitleWithSubtitle title={t('meals.planning.title')} subtitle={spaceName} />,
    [spaceName, t],
  );
  const renderHeaderRight = useCallback(
    () => (
      <HeaderOverflowMenu
        accessibilityLabel={t('spaces.menu.open')}
        items={[
          {
            id: 'view-menu',
            label: t('meals.todayMenu'),
            onPress: () => navigateMain('DailyMenuToday', { spaceId, menuDate }),
          },
          {
            id: 'copy-menu',
            label: t('meals.planning.copyMenu'),
            visible: !dateReadOnly,
            onPress: () => setCopyMenuOpen(true),
          },
        ]}
      />
    ),
    [dateReadOnly, menuDate, navigateMain, spaceId, t],
  );

  useLayoutEffect(() => {
    navigation.setOptions({
      headerTitle: renderHeaderTitle,
      headerRight: renderHeaderRight,
    });
  }, [navigation, renderHeaderRight, renderHeaderTitle]);

  if (!canManage) {
    return <PermissionDeniedScreen spaceId={spaceId} />;
  }

  return (
    <View style={styles.root}>
      <View style={styles.stickyHeader}>
        {!loading &&
        !error &&
        permissions.canManageMeals &&
        distinctEligible === 0 &&
        !dismissCustomersHint ? (
          <View style={styles.enrollBanner}>
            <Text style={styles.enrollBannerTitle}>
              {t(
                permissions.spaceType === 'MESS'
                  ? 'meals.planning.noEligibleMembersTitleMess'
                  : 'meals.planning.noEligibleMembersCta',
              )}
            </Text>
            <Text style={styles.enrollBannerHint}>
              {t(
                permissions.spaceType === 'MESS'
                  ? 'meals.planning.noEligibleMembersHintMess'
                  : 'meals.planning.noEligibleMembersHint',
              )}
            </Text>
            {permissions.spaceType === 'MESS' ? (
              <View style={styles.enrollBannerActions}>
                <Button
                  label={t('meals.planning.noEligibleMembersCtaMess')}
                  onPress={() => navigateMain('AddCustomersHub', { spaceId })}
                  style={styles.enrollBannerPrimary}
                />
                <Button
                  label={t('meals.planning.noEligibleMembersContinueMess')}
                  variant="secondary"
                  onPress={() => setDismissCustomersHint(true)}
                  style={styles.enrollBannerSecondary}
                />
              </View>
            ) : (
              <Pressable
                onPress={() => navigateToMembersTab(spaceId)}
                accessibilityRole="button"
                style={styles.enrollBannerTapArea}>
                <Text style={styles.enrollBannerLink}>
                  {t('meals.planning.noEligibleMembersCta')}
                </Text>
              </Pressable>
            )}
          </View>
        ) : null}

        <View style={styles.planningCard}>
          <View style={styles.dateRow}>
            <Pressable
              style={({ pressed }) => [styles.dateNavBtn, pressed && styles.dateNavBtnPressed]}
              onPress={() => setMenuDate(prev => addDaysIsoDate(prev, -1))}
              android_ripple={{ color: 'rgba(18, 140, 126, 0.12)', borderless: true }}
              accessibilityRole="button"
              accessibilityLabel={t('common.back')}>
              <ChevronLeft size={20} color={colors.primaryDark} strokeWidth={2.4} />
            </Pressable>
            <Pressable
              style={({ pressed }) => [styles.dateCenter, pressed && styles.dateCenterPressed]}
              onPress={() => setDatePickerOpen(true)}
              accessibilityRole="button"
              accessibilityLabel={formatMenuDate(menuDate, i18n.language)}
              accessibilityHint={t('meals.planning.openCalendar')}>
              <View style={styles.dateLabelRow}>
                <Calendar size={16} color={colors.primaryDark} strokeWidth={2.2} />
                <Text style={styles.dateLabel}>{formatMenuDate(menuDate, i18n.language)}</Text>
              </View>
              {relativeKind != null ? (
                <View style={styles.todayChip}>
                  <Text style={styles.todayChipText}>
                    {t(relativeMenuDateLabelKey(relativeKind))}
                  </Text>
                </View>
              ) : (
                <View style={styles.dateJumpRow}>
                  <Pressable
                    onPress={() => setMenuDate(todayIsoDate())}
                    hitSlop={6}
                    accessibilityRole="button">
                    <Text style={styles.dateJumpLink}>{t('meals.dates.goToToday')}</Text>
                  </Pressable>
                  <Pressable
                    onPress={() => setMenuDate(tomorrowIsoDate())}
                    hitSlop={6}
                    accessibilityRole="button">
                    <Text style={styles.dateJumpLink}>{t('meals.dates.goToTomorrow')}</Text>
                  </Pressable>
                </View>
              )}
            </Pressable>
            <Pressable
              style={({ pressed }) => [styles.dateNavBtn, pressed && styles.dateNavBtnPressed]}
              onPress={() => setMenuDate(prev => addDaysIsoDate(prev, 1))}
              android_ripple={{ color: 'rgba(18, 140, 126, 0.12)', borderless: true }}
              accessibilityRole="button"
              accessibilityLabel={t('common.next')}>
              <ChevronRight size={20} color={colors.primaryDark} strokeWidth={2.4} />
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
              statusSummary={statusSummary}
              selectedMealType={selectedMealType}
              onSelectMealType={selectMealType}
              onShareDay={
                permissions.canManageMeals && canShareMenu
                  ? () => openShare()
                  : undefined
              }
              shareDisabled={!canShareMenu}
              dateReadOnly={dateReadOnly}
            />
          ) : null}
        </View>
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
              onPress={() => load().catch(() => undefined)}
              accessibilityRole="button">
              <Text style={styles.retryButtonText}>{t('common.retry')}</Text>
            </Pressable>
          </View>
        ) : null}

        {permissions.canManageMeals ? (
          <View style={styles.linksCard}>
            <Pressable
              style={({ pressed }) => [styles.linkRow, pressed && styles.linkRowPressed]}
              android_ripple={{ color: 'rgba(18, 140, 126, 0.08)' }}
              onPress={() => navigateMain('MenuLibrary', { spaceId })}
              accessibilityRole="button">
              <View style={styles.linkIconWrap}>
                <BookOpen size={18} color={colors.primaryDark} strokeWidth={2.2} />
              </View>
              <View style={styles.linkCopy}>
                <Text style={styles.linkTitle}>{t('meals.library.title')}</Text>
                <Text style={styles.linkSubtitle}>
                  {t('meals.planning.quickAccess.librarySubtitle')}
                </Text>
              </View>
              <ChevronRight size={18} color={colors.muted} strokeWidth={2.4} />
            </Pressable>
            <View style={styles.linkDivider} />
            <Pressable
              style={({ pressed }) => [styles.linkRow, pressed && styles.linkRowPressed]}
              android_ripple={{ color: 'rgba(18, 140, 126, 0.08)' }}
              onPress={() => navigateMain('DailyMenuToday', { spaceId, menuDate })}
              accessibilityRole="button">
              <View style={styles.linkIconWrap}>
                <CalendarDays size={18} color={colors.primaryDark} strokeWidth={2.2} />
              </View>
              <View style={styles.linkCopy}>
                <Text style={styles.linkTitle}>
                  {menuDate === todayIsoDate()
                    ? t('meals.todayMenu')
                    : t('meals.menuDetails.heading')}
                </Text>
                <Text style={styles.linkSubtitle}>
                  {t('meals.planning.quickAccess.todayMenuSubtitle')}
                </Text>
              </View>
              <ChevronRight size={18} color={colors.muted} strokeWidth={2.4} />
            </Pressable>
            {permissions.spaceType === 'MESS' ? (
              <>
                <View style={styles.linkDivider} />
                <Pressable
                  style={({ pressed }) => [styles.linkRow, pressed && styles.linkRowPressed]}
                  android_ripple={{ color: 'rgba(18, 140, 126, 0.08)' }}
                  onPress={() => navigateMain('MealDeliveryLocations', { spaceId })}
                  accessibilityRole="button">
                  <View style={styles.linkIconWrap}>
                    <MapPin size={18} color={colors.primaryDark} strokeWidth={2.2} />
                  </View>
                  <View style={styles.linkCopy}>
                    <Text style={styles.linkTitle}>{t('meals.deliveryLocations.manage')}</Text>
                    <Text style={styles.linkSubtitle}>
                      {t('meals.planning.quickAccess.deliverySubtitle')}
                    </Text>
                  </View>
                  <ChevronRight size={18} color={colors.muted} strokeWidth={2.4} />
                </Pressable>
              </>
            ) : null}
            <View style={styles.linkDivider} />
            <Pressable
              style={({ pressed }) => [styles.linkRow, pressed && styles.linkRowPressed]}
              android_ripple={{ color: 'rgba(18, 140, 126, 0.08)' }}
              onPress={() => navigateMain('SubscriptionPlans', { spaceId })}
              accessibilityRole="button">
              <View style={styles.linkIconWrap}>
                <Crown size={18} color={colors.primaryDark} strokeWidth={2.2} />
              </View>
              <View style={styles.linkCopy}>
                <Text style={styles.linkTitle}>{t('meals.subscriptionPlans.title')}</Text>
                <Text style={styles.linkSubtitle}>
                  {t('meals.planning.quickAccess.subscriptionsSubtitle')}
                </Text>
              </View>
              <ChevronRight size={18} color={colors.muted} strokeWidth={2.4} />
            </Pressable>
          </View>
        ) : null}
      </ScrollView>

      <MenuDatePickerModal
        visible={datePickerOpen}
        value={menuDate}
        allowPastDates
        onClose={() => setDatePickerOpen(false)}
        onConfirm={setMenuDate}
      />

      <CopyPreviousMenuSheet
        visible={copyMenuOpen}
        spaceId={spaceId}
        targetDate={menuDate}
        targetMenus={menus}
        initialMealType={selectedMealType}
        onClose={() => setCopyMenuOpen(false)}
        onCopied={load}
      />
    </View>
  );
}

const CARD_RADIUS = 18;

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  stickyHeader: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
    paddingBottom: 0,
    backgroundColor: colors.background,
    gap: spacing.sm,
  },
  spaceChip: {
    alignSelf: 'flex-start',
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
    borderRadius: radius.full,
    backgroundColor: colors.lightGreen,
    borderWidth: 1,
    borderColor: `${colors.primary}44`,
    maxWidth: '100%',
  },
  spaceChipLabel: {
    ...typography.caption,
    color: colors.primaryDark,
    fontWeight: '700',
    fontSize: 11,
  },
  planningCard: {
    backgroundColor: colors.white,
    borderRadius: CARD_RADIUS,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
    gap: spacing.md,
    ...shadows.sm,
  },
  scroll: { flex: 1 },
  content: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    gap: spacing.lg,
  },
  dateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  dateNavBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surface,
  },
  dateNavBtnPressed: {
    backgroundColor: colors.lightGreen,
  },
  readOnlyBanner: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.button,
    padding: spacing.sm,
  },
  readOnlyBannerText: { ...typography.caption, color: colors.muted, lineHeight: 18 },
  dateCenter: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.xs,
    borderRadius: radius.button,
    gap: spacing.xs,
  },
  dateCenterPressed: {
    backgroundColor: colors.surface,
  },
  dateLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  dateLabel: {
    ...typography.bodyStrong,
    color: colors.primaryDark,
    fontSize: 14,
    fontWeight: '700',
  },
  todayChip: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xxs,
    borderRadius: radius.full,
    backgroundColor: colors.lightGreen,
  },
  todayChipText: {
    ...typography.caption,
    color: colors.primaryDark,
    fontWeight: '700',
    fontSize: 11,
  },
  dateJumpRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  dateJumpLink: {
    ...typography.caption,
    color: colors.primaryDark,
    fontWeight: '600',
    fontSize: 11,
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
    borderRadius: CARD_RADIUS,
    padding: spacing.md,
    ...shadows.sm,
  },
  enrollBannerTitle: { ...typography.bodyStrong, color: colors.primaryDark, marginBottom: spacing.xxs },
  enrollBannerHint: { ...typography.caption, color: colors.muted, marginBottom: spacing.sm },
  enrollBannerActions: {
    gap: spacing.sm,
  },
  enrollBannerPrimary: {
    marginTop: spacing.xxs,
  },
  enrollBannerSecondary: {},
  enrollBannerTapArea: {
    marginTop: spacing.xs,
  },
  enrollBannerLink: {
    ...typography.caption,
    color: colors.primaryDark,
    fontWeight: '700',
  },
  linksCard: {
    backgroundColor: colors.white,
    borderRadius: CARD_RADIUS,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
    ...shadows.sm,
  },
  linkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
    minHeight: 64,
  },
  linkRowPressed: {
    backgroundColor: colors.surface,
  },
  linkIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.lightGreen,
    alignItems: 'center',
    justifyContent: 'center',
  },
  linkCopy: {
    flex: 1,
    minWidth: 0,
    gap: 2,
  },
  linkTitle: {
    ...typography.bodyStrong,
    fontSize: 14,
    color: colors.textPrimary,
  },
  linkSubtitle: {
    ...typography.caption,
    fontSize: 12,
    color: colors.textSecondary,
  },
  linkDivider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: colors.border,
    marginLeft: 64,
  },
});

