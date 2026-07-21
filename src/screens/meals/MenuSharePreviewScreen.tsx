import React, { useCallback, useEffect, useLayoutEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  Share,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useTranslation } from 'react-i18next';
import { mealsApi } from '../../api/mealsApi';
import type { DailyMenuResponse, MealPollSlot, MealType, UUID } from '../../api/types';
import { ShareMealSlotCheckbox } from '../../components/meals/ShareMealSlotCheckbox';
import { ChevronRightIcon } from '../../components/ui/icons/ChevronRightIcon';
import { Screen } from '../../components/ui/Screen';
import { resetToDashboard } from '../../navigation/navigationRef';
import type { MainStackParamList } from '../../navigation/types';
import { useSpaceStore } from '../../store/spaceStore';
import { useToastStore } from '../../store/toastStore';
import { colors, radius, spacing, typography } from '../../theme';
import { formatMenuDate, isPastMenuDate } from '../../utils/mealDates';
import { MEAL_TYPES } from '../../utils/mealLabels';
import { invalidateDashboardQueries } from '../../utils/dashboardQueryCache';
import {
  buildShareMessageForSelection,
  defaultSelectedMealTypes,
  getSlotShareState,
  menusByMealType,
  openPollsForMealTypes,
  publishDraftMenusForTypes,
} from '../../utils/shareMenuSelection';
import {
  listOtherShareTargetSpaces,
  shareMenusToSpace,
  validateShareMenusToSpace,
} from '../../utils/shareMenuToSpaces';
import { formatSpaceDisplayName } from '../../utils/spaceLabels';

type MenuSharePreviewScreenProps = {
  spaceId: UUID;
  menuDate: string;
  mealType?: MealType;
};

type Nav = NativeStackNavigationProp<MainStackParamList>;

export function MenuSharePreviewScreen({
  spaceId,
  menuDate,
  mealType: initialMealType,
}: MenuSharePreviewScreenProps) {
  const { t, i18n } = useTranslation();
  const navigation = useNavigation<Nav>();
  const showToast = useToastStore(state => state.showToast);
  const mySpaces = useSpaceStore(state => state.mySpaces);
  const loadMySpaces = useSpaceStore(state => state.loadMySpaces);
  const spacesLoading = useSpaceStore(state => state.loading);
  const dateReadOnly = isPastMenuDate(menuDate);

  const [loadingMenus, setLoadingMenus] = useState(true);
  const [loadingPreview, setLoadingPreview] = useState(false);
  const [menus, setMenus] = useState<DailyMenuResponse[]>([]);
  const [polls, setPolls] = useState<MealPollSlot[]>([]);
  const [selectedTypes, setSelectedTypes] = useState<MealType[]>([]);
  const [messageText, setMessageText] = useState('');
  const [initialized, setInitialized] = useState(false);
  const [sharing, setSharing] = useState(false);
  const [otherSpaceIds, setOtherSpaceIds] = useState<UUID[]>([]);
  const [showOtherSpaces, setShowOtherSpaces] = useState(false);

  const menuMap = useMemo(() => menusByMealType(menus), [menus]);
  const pollMap = useMemo(() => {
    const map: Partial<Record<MealType, MealPollSlot>> = {};
    for (const poll of polls) {
      map[poll.mealType] = poll;
    }
    return map;
  }, [polls]);
  const hasShareableSlot = MEAL_TYPES.some(
    type => getSlotShareState(menuMap[type]) === 'shareable',
  );
  const otherTargets = useMemo(
    () => listOtherShareTargetSpaces(mySpaces, spaceId),
    [mySpaces, spaceId],
  );
  const currentSpace = useMemo(
    () => mySpaces.find(space => space.spaceId === spaceId),
    [mySpaces, spaceId],
  );

  useLayoutEffect(() => {
    navigation.setOptions({ title: t('meals.planning.shareTitle') });
  }, [navigation, t]);

  const loadMenus = useCallback(async () => {
    setLoadingMenus(true);
    try {
      const [rows, pollDay] = await Promise.all([
        mealsApi.getDailyMenusByDate(spaceId, menuDate),
        mealsApi.getMealPolls(spaceId, menuDate).catch(() => ({ pollDate: menuDate, polls: [] })),
      ]);
      setMenus(rows);
      setPolls(pollDay.polls);
      const map = menusByMealType(rows);
      setSelectedTypes(defaultSelectedMealTypes(map, initialMealType));
      setInitialized(true);
    } catch {
      setMenus([]);
      setPolls([]);
      setSelectedTypes([]);
      showToast(t('meals.errors.loadFailed'));
    } finally {
      setLoadingMenus(false);
    }
  }, [initialMealType, menuDate, showToast, spaceId, t]);

  useFocusEffect(
    useCallback(() => {
      void loadMenus();
    }, [loadMenus]),
  );

  const handleToggleOtherSpaces = useCallback(() => {
    setShowOtherSpaces(prev => {
      const next = !prev;
      if (next) {
        void loadMySpaces();
      }
      return next;
    });
  }, [loadMySpaces]);

  useEffect(() => {
    if (!initialized || selectedTypes.length === 0) {
      setMessageText('');
      return;
    }

    let active = true;
    setLoadingPreview(true);
    void buildShareMessageForSelection(spaceId, menuDate, selectedTypes, menuMap)
      .then(text => {
        if (active) {
          setMessageText(text);
        }
      })
      .catch(() => {
        if (active) {
          setMessageText('');
          showToast(t('meals.errors.loadFailed'));
        }
      })
      .finally(() => {
        if (active) {
          setLoadingPreview(false);
        }
      });

    return () => {
      active = false;
    };
  }, [initialized, menuDate, menuMap, selectedTypes, showToast, spaceId, t]);

  const toggleMealType = (type: MealType) => {
    setSelectedTypes(prev => {
      const next = prev.includes(type)
        ? prev.filter(row => row !== type)
        : [...prev, type];
      return MEAL_TYPES.filter(meal => next.includes(meal));
    });
  };

  const toggleOtherSpace = (targetId: UUID) => {
    setOtherSpaceIds(prev =>
      prev.includes(targetId)
        ? prev.filter(id => id !== targetId)
        : [...prev, targetId],
    );
  };

  const leaveAfterShare = useCallback(() => {
    // Prefer Menu Planning (where share usually starts). Soft-navigate to avoid Fabric reset crashes.
    if (navigation.canGoBack()) {
      navigation.navigate('MenuPlanning', { spaceId, menuDate });
      return;
    }
    resetToDashboard(spaceId);
  }, [menuDate, navigation, spaceId]);

  const shareMessage = async () => {
    if (dateReadOnly) {
      showToast(t('meals.errors.pastDateReadOnly'));
      return;
    }
    if (!messageText || selectedTypes.length === 0) {
      showToast(t('meals.planning.shareSelectAtLeastOne'));
      return;
    }
    setSharing(true);
    try {
      const selectedOthers = otherTargets.filter(space =>
        otherSpaceIds.includes(space.spaceId),
      );

      // Validate additional spaces before mutating the current space share flow.
      const validations = await Promise.all(
        selectedOthers.map(async space => ({
          space,
          result: await validateShareMenusToSpace(menuMap, selectedTypes, space),
        })),
      );
      const failed = validations.find(row => !row.result.ok);
      if (failed && !failed.result.ok) {
        showToast(
          t('meals.planning.shareToSpaceIncompatible', {
            space: failed.result.spaceName,
            items: failed.result.missingLabels.slice(0, 3).join(', '),
          }),
        );
        return;
      }

      await publishDraftMenusForTypes(spaceId, menuDate, selectedTypes, menuMap);
      invalidateDashboardQueries();
      const refreshed = await mealsApi.getDailyMenusByDate(spaceId, menuDate);
      setMenus(refreshed);
      const latestMessage = await buildShareMessageForSelection(
        spaceId,
        menuDate,
        selectedTypes,
        menusByMealType(refreshed),
      );
      const opened = await openPollsForMealTypes(spaceId, menuDate, selectedTypes);
      if (opened > 0) {
        showToast(t('meals.poll.autoOpened', { count: opened }));
      }

      let extraShared = 0;
      for (const row of validations) {
        if (!row.result.ok) {
          continue;
        }
        try {
          await shareMenusToSpace(row.space.spaceId, menuDate, selectedTypes, row.result);
          extraShared += 1;
        } catch {
          showToast(
            t('meals.planning.shareToSpaceFailed', {
              space: formatSpaceDisplayName(row.space),
            }),
          );
        }
      }
      if (extraShared > 0) {
        showToast(
          t('meals.planning.shareToSpacesSuccess', {
            count: extraShared,
          }),
        );
      }

      // Native share sheet dismiss must not block leaving this screen (iOS throws on cancel).
      try {
        await Share.share({ message: latestMessage || messageText });
      } catch {
        // ignored — user cancelled the system share sheet
      }

      leaveAfterShare();
    } catch {
      showToast(t('meals.errors.actionFailed'));
    } finally {
      setSharing(false);
    }
  };

  const loading = loadingMenus || loadingPreview;
  const shareDisabled = dateReadOnly || !messageText || loading || sharing;

  return (
    <Screen scrollable contentStyle={styles.content}>
      <Text style={styles.title}>{t('meals.planning.previewShare')}</Text>
      <Text style={styles.date}>{formatMenuDate(menuDate, i18n.language)}</Text>
      {dateReadOnly ? (
        <Text style={styles.readOnlyHint}>{t('meals.planning.pastDateReadOnly')}</Text>
      ) : (
        <Text style={styles.hint}>{t('meals.planning.shareHint')}</Text>
      )}

      {loadingMenus ? <ActivityIndicator color={colors.primary} style={styles.loader} /> : null}

      {!loadingMenus && !hasShareableSlot ? (
        <Text style={styles.empty}>{t('meals.planning.shareEmpty')}</Text>
      ) : null}

      {!loadingMenus && hasShareableSlot ? (
        <>
          <Text style={styles.sectionLabel}>{t('meals.planning.shareSelectMeals')}</Text>
          {MEAL_TYPES.map(type => (
            <ShareMealSlotCheckbox
              key={type}
              mealType={type}
              state={getSlotShareState(menuMap[type])}
              selected={selectedTypes.includes(type)}
              onToggle={() => toggleMealType(type)}
              menu={menuMap[type]}
              poll={pollMap[type]}
              disabled={dateReadOnly}
            />
          ))}

          {selectedTypes.length === 0 ? (
            <Text style={styles.selectHint}>{t('meals.planning.shareSelectAtLeastOne')}</Text>
          ) : null}

          {!dateReadOnly ? (
            <View style={styles.otherSpacesBlock}>
              <Pressable
                onPress={handleToggleOtherSpaces}
                style={({ pressed }) => [
                  styles.otherSpacesRow,
                  showOtherSpaces && styles.otherSpacesRowExpanded,
                  pressed && styles.otherSpacesRowPressed,
                ]}
                accessibilityRole="button"
                accessibilityState={{ expanded: showOtherSpaces }}
                accessibilityLabel={t(
                  showOtherSpaces
                    ? 'meals.planning.shareToOtherSpacesHide'
                    : 'meals.planning.shareToOtherSpacesShow',
                )}
                accessibilityHint={t('meals.planning.shareToOtherSpacesHint')}>
                <Text style={styles.otherSpacesPlus}>{showOtherSpaces ? '−' : '+'}</Text>
                <View style={styles.otherSpacesTextCol}>
                  <Text style={styles.otherSpacesTitle}>
                    {t(
                      showOtherSpaces
                        ? 'meals.planning.shareToOtherSpacesHide'
                        : 'meals.planning.shareToOtherSpacesShow',
                    )}
                  </Text>
                  <Text style={styles.otherSpacesSubtitle}>
                    {showOtherSpaces
                      ? otherSpaceIds.length > 0
                        ? t('meals.planning.shareToOtherSpacesSelected', {
                            count: otherSpaceIds.length,
                          })
                        : t('meals.planning.shareToOtherSpacesOpenHint')
                      : t('meals.planning.shareToOtherSpacesHint')}
                  </Text>
                </View>
                <View
                  style={[
                    styles.otherSpacesChevron,
                    showOtherSpaces && styles.otherSpacesChevronExpanded,
                  ]}>
                  <ChevronRightIcon
                    size={18}
                    color={colors.primaryDark}
                    strokeWidth={2.5}
                  />
                </View>
              </Pressable>

              {showOtherSpaces ? (
                <>
                  <Text style={[styles.sectionLabel, styles.shareToSectionLabel]}>
                    {t('meals.planning.shareToSection')}
                  </Text>
                  <Text style={styles.shareToHint}>{t('meals.planning.shareToHint')}</Text>

                  <View style={styles.spaceRowLocked}>
                    <View style={[styles.checkbox, styles.checkboxSelected]}>
                      <Text style={styles.checkmark}>✓</Text>
                    </View>
                    <Text style={styles.spaceLabel}>
                      {currentSpace
                        ? formatSpaceDisplayName(currentSpace)
                        : t('meals.planning.shareToCurrentSpace')}
                    </Text>
                    <Text style={styles.currentTag}>{t('meals.planning.shareToCurrent')}</Text>
                  </View>

                  {spacesLoading && otherTargets.length === 0 ? (
                    <ActivityIndicator color={colors.primary} style={styles.loader} />
                  ) : null}

                  {!spacesLoading && otherTargets.length === 0 ? (
                    <Text style={styles.selectHint}>
                      {t('meals.planning.shareToNoOtherSpaces')}
                    </Text>
                  ) : null}

                  {otherTargets.map(space => {
                    const selected = otherSpaceIds.includes(space.spaceId);
                    return (
                      <Pressable
                        key={space.spaceId}
                        style={styles.spaceRow}
                        onPress={() => toggleOtherSpace(space.spaceId)}
                        accessibilityRole="checkbox"
                        accessibilityState={{ checked: selected }}>
                        <View
                          style={[
                            styles.checkbox,
                            selected && styles.checkboxSelected,
                          ]}>
                          {selected ? <Text style={styles.checkmark}>✓</Text> : null}
                        </View>
                        <Text style={styles.spaceLabel}>{formatSpaceDisplayName(space)}</Text>
                      </Pressable>
                    );
                  })}
                </>
              ) : null}
            </View>
          ) : null}

          {loadingPreview ? (
            <ActivityIndicator color={colors.primary} style={styles.loader} />
          ) : null}

          {messageText && !loadingPreview ? (
            <View style={styles.messageBox}>
              <Text style={styles.message} selectable>
                {messageText}
              </Text>
            </View>
          ) : null}

          {!dateReadOnly ? (
            <Pressable
              style={[styles.shareBtn, shareDisabled && styles.shareBtnDisabled]}
              disabled={shareDisabled}
              onPress={() => void shareMessage()}>
              <Text style={styles.shareBtnText}>
                {sharing ? t('meals.poll.openingPolls') : t('meals.planning.copyMessage')}
              </Text>
            </Pressable>
          ) : null}
        </>
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { paddingBottom: spacing.section },
  title: { ...typography.h2, marginBottom: spacing.xs },
  date: { ...typography.bodyStrong, marginBottom: spacing.sm },
  hint: { ...typography.caption, color: colors.muted, marginBottom: spacing.lg },
  readOnlyHint: {
    ...typography.caption,
    color: colors.muted,
    marginBottom: spacing.lg,
    lineHeight: 18,
  },
  sectionLabel: { ...typography.bodyStrong, marginBottom: spacing.sm },
  selectHint: {
    ...typography.caption,
    color: colors.muted,
    marginBottom: spacing.md,
  },
  otherSpacesBlock: {
    marginTop: spacing.md,
    marginBottom: spacing.sm,
  },
  otherSpacesRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.card,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
    marginBottom: spacing.sm,
  },
  otherSpacesRowExpanded: {
    backgroundColor: colors.lightGreen,
    borderColor: colors.primary,
  },
  otherSpacesRowPressed: {
    opacity: 0.92,
  },
  otherSpacesPlus: {
    ...typography.bodyStrong,
    color: colors.primaryDark,
    fontSize: 20,
    lineHeight: 24,
    width: 20,
    textAlign: 'center',
  },
  otherSpacesTextCol: {
    flex: 1,
    minWidth: 0,
    gap: 2,
  },
  otherSpacesTitle: {
    ...typography.bodyStrong,
    color: colors.textPrimary,
  },
  otherSpacesSubtitle: {
    ...typography.caption,
    color: colors.muted,
  },
  otherSpacesChevron: {
    transform: [{ rotate: '0deg' }],
  },
  otherSpacesChevronExpanded: {
    transform: [{ rotate: '90deg' }],
  },
  shareToSectionLabel: {
    marginTop: spacing.xs,
  },
  shareToHint: {
    ...typography.caption,
    color: colors.muted,
    marginBottom: spacing.sm,
    lineHeight: 18,
  },
  spaceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.card,
    padding: spacing.md,
    marginBottom: spacing.sm,
  },
  spaceRowLocked: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: colors.lightGreen,
    borderWidth: 1,
    borderColor: colors.primary,
    borderRadius: radius.card,
    padding: spacing.md,
    marginBottom: spacing.sm,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxSelected: {
    backgroundColor: colors.primary,
  },
  checkmark: {
    color: colors.white,
    fontSize: 14,
    fontWeight: '700',
  },
  spaceLabel: {
    ...typography.bodyStrong,
    flex: 1,
  },
  currentTag: {
    ...typography.caption,
    color: colors.primaryDark,
    fontWeight: '700',
  },
  loader: { marginVertical: spacing.lg },
  empty: { ...typography.body, color: colors.muted },
  messageBox: {
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    padding: spacing.lg,
    marginTop: spacing.md,
    marginBottom: spacing.lg,
  },
  message: { ...typography.body, lineHeight: 22 },
  shareBtn: {
    backgroundColor: colors.primary,
    borderRadius: 12,
    paddingVertical: spacing.md,
    alignItems: 'center',
  },
  shareBtnDisabled: { opacity: 0.5 },
  shareBtnText: { ...typography.bodyStrong, color: colors.white },
});
