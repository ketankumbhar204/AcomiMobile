import React, { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  NativeScrollEvent,
  NativeSyntheticEvent,
  Pressable,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Check, ChevronDown, ChevronUp, Minus, Share2, UtensilsCrossed } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { mealsApi } from '../../api/mealsApi';
import type { DailyMenuResponse, MealPollSlot, MealType, UUID } from '../../api/types';
import { MealFormHero } from '../../components/meals';
import { ShareMealSlotCheckbox } from '../../components/meals/ShareMealSlotCheckbox';
import {
  ProgressiveWorkflowFooter,
  progressiveSectionHighlightStyle,
} from '../../components/progressive';
import { EmptyState } from '../../components/ui';
import { useProgressiveSectionReview } from '../../hooks/useProgressiveSectionReview';
import { mealShareExitAction, shouldBlockMealShareExit } from '../../navigation/mealShareExit';
import { resetToDashboard } from '../../navigation/navigationRef';
import type { MainStackParamList } from '../../navigation/types';
import { useSpaceStore } from '../../store/spaceStore';
import { useToastStore } from '../../store/toastStore';
import { colors, radius, spacing, typography } from '../../theme';
import { formatMenuDate, isPastMenuDate } from '../../utils/mealDates';
import { MEAL_TYPES } from '../../utils/mealLabels';
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
  mapWithConcurrency,
  SHARE_SPACE_CONCURRENCY,
  shareMenusToSpace,
  validateShareMenusToSpace,
} from '../../utils/shareMenuToSpaces';
import {
  defaultOtherSpaceIds,
  nextOtherSpaceSelection,
  otherSpaceSelectAllState,
  selectedShareDestinations,
  shouldOfferOtherSpaceShare,
} from '../../utils/otherSpaceShareSelection';
import { formatSpaceDisplayName } from '../../utils/spaceLabels';
import { clearDayShareFailed, markDayShareFailed } from '../../utils/dayShareFailure';
import {
  resolveSharePreviewStep,
  sharePreviewFooterCopy,
  SHARE_PREVIEW_STEP_TOTAL,
} from '../../utils/sharePreviewStep';
import {
  resolveMealReviewIntent,
  shouldOpenExternalShare,
  shouldPublishMenu,
  type MealReviewIntent,
} from '../../utils/mealReviewIntent';

type MenuSharePreviewScreenProps = {
  spaceId: UUID;
  menuDate: string;
  mealType?: MealType;
  intent?: MealReviewIntent;
};

type Nav = NativeStackNavigationProp<MainStackParamList>;

function beginShareProgress(
  total: number,
  setProgress: (value: { completed: number; total: number } | null) => void,
): () => void {
  if (total <= 0) {
    setProgress(null);
    return () => undefined;
  }
  let completed = 0;
  setProgress({ completed, total });
  return () => {
    completed += 1;
    setProgress({ completed, total });
  };
}

export function MenuSharePreviewScreen({
  spaceId,
  menuDate,
  mealType: initialMealType,
  intent: intentParam,
}: MenuSharePreviewScreenProps) {
  const { t, i18n } = useTranslation();
  const navigation = useNavigation<Nav>();
  const showToast = useToastStore(state => state.showToast);
  const mySpaces = useSpaceStore(state => state.mySpaces);
  const loadMySpaces = useSpaceStore(state => state.loadMySpaces);
  const spacesLoading = useSpaceStore(state => state.loading);
  const dateReadOnly = isPastMenuDate(menuDate);
  const intent = resolveMealReviewIntent(intentParam);
  const externalShare = shouldOpenExternalShare(intent);
  const publishMenu = shouldPublishMenu(intent);
  const saveAndShareFlow = intent === 'save';
  const scrollRef = useRef<ScrollView>(null);

  const [loadingMenus, setLoadingMenus] = useState(true);
  const [loadingPreview, setLoadingPreview] = useState(false);
  const [menus, setMenus] = useState<DailyMenuResponse[]>([]);
  const [polls, setPolls] = useState<MealPollSlot[]>([]);
  const [selectedTypes, setSelectedTypes] = useState<MealType[]>([]);
  const [messageText, setMessageText] = useState('');
  const [initialized, setInitialized] = useState(false);
  const [sharing, setSharing] = useState(false);
  const [sharePhase, setSharePhase] = useState<'saving' | 'checking' | 'opening' | 'sharing' | null>(
    null,
  );
  const [shareProgress, setShareProgress] = useState<{ completed: number; total: number } | null>(
    null,
  );
  const sharingRef = useRef(false);
  const openedCurrentMeals = useRef(new Set<MealType>());
  const openedBySpace = useRef(new Map<string, MealType[]>());
  const [otherSpaceIds, setOtherSpaceIds] = useState<UUID[]>([]);
  const [showOtherSpaces, setShowOtherSpaces] = useState(true);
  const [spaceQuery, setSpaceQuery] = useState('');

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
  const offerOtherSpaces = shouldOfferOtherSpaceShare(otherTargets.length);
  const otherTargetKey = otherTargets.map(space => space.spaceId).join('|');
  const eligibleOtherIds = useMemo(() => otherTargets.map(space => space.spaceId), [otherTargets]);
  const selectedOtherCount = useMemo(
    () => otherSpaceIds.filter(id => eligibleOtherIds.includes(id)).length,
    [eligibleOtherIds, otherSpaceIds],
  );
  const selectAllState = otherSpaceSelectAllState(eligibleOtherIds, otherSpaceIds);
  const visibleOtherTargets = useMemo(() => {
    const query = spaceQuery.trim().toLowerCase();
    if (!query) {
      return otherTargets;
    }
    return otherTargets.filter(space =>
      `${space.spaceName} ${space.address ?? ''}`.toLowerCase().includes(query),
    );
  }, [otherTargets, spaceQuery]);
  const currentSpace = useMemo(
    () => mySpaces.find(space => space.spaceId === spaceId),
    [mySpaces, spaceId],
  );

  const hasSlots = selectedTypes.length > 0;
  const progressiveEnabled = !dateReadOnly && hasShareableSlot;

  const {
    reviewed: recipientsReviewed,
    highlighted: recipientsHighlighted,
    onSectionLayout: onRecipientsLayout,
    onScroll: onRecipientsScroll,
    onScrollBeginDrag: onRecipientsScrollBeginDrag,
    continueToSection: continueToRecipients,
    clearReviewed: clearRecipientsReviewed,
    markReviewed: markRecipientsReviewed,
  } = useProgressiveSectionReview({
    enabled: progressiveEnabled,
  });

  const {
    reviewed: messageReviewed,
    highlighted: messageHighlighted,
    onSectionLayout: onMessageLayout,
    onScroll: onMessageScroll,
    onScrollBeginDrag: onMessageScrollBeginDrag,
    continueToSection: continueToMessage,
    clearReviewed: clearMessageReviewed,
  } = useProgressiveSectionReview({
    enabled: progressiveEnabled,
  });

  useEffect(() => {
    if (!hasSlots) {
      clearRecipientsReviewed();
      clearMessageReviewed();
    }
  }, [clearMessageReviewed, clearRecipientsReviewed, hasSlots]);

  useEffect(() => {
    if (!recipientsReviewed) {
      clearMessageReviewed();
    }
  }, [clearMessageReviewed, recipientsReviewed]);

  const { step: shareStep, phase: progressivePhase } = resolveSharePreviewStep({
    hasSlots,
    recipientsReviewed,
    messageReviewed,
  });
  const shareFooterCopy = shareStep === 0 ? null : sharePreviewFooterCopy(shareStep);

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
      setSelectedTypes(
        defaultSelectedMealTypes(map, initialMealType, {
          includePublished: intent === 'reshare',
        }),
      );
      setInitialized(true);
    } catch {
      setMenus([]);
      setPolls([]);
      setSelectedTypes([]);
      showToast(t('meals.errors.loadFailed'));
    } finally {
      setLoadingMenus(false);
    }
  }, [initialMealType, intent, menuDate, showToast, spaceId, t]);

  useFocusEffect(
    useCallback(() => {
      setShowOtherSpaces(true);
      void loadMenus();
      void loadMySpaces();
    }, [loadMenus, loadMySpaces]),
  );

  useEffect(() => {
    const ids = otherTargetKey ? otherTargetKey.split('|') : [];
    setOtherSpaceIds(defaultOtherSpaceIds(ids.map(id => ({ spaceId: id }))));
    setShowOtherSpaces(true);
    setSpaceQuery('');
    if (!sharingRef.current) {
      openedCurrentMeals.current = new Set();
      openedBySpace.current = new Map();
    }
  }, [menuDate, otherTargetKey, spaceId]);

  const handleToggleOtherSpaces = useCallback(() => {
    setShowOtherSpaces(prev => {
      const next = !prev;
      if (next) {
        void loadMySpaces();
        markRecipientsReviewed();
      }
      return next;
    });
  }, [loadMySpaces, markRecipientsReviewed]);

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
    if (sharingRef.current) {
      return;
    }
    markRecipientsReviewed();
    setOtherSpaceIds(prev =>
      prev.includes(targetId)
        ? prev.filter(id => id !== targetId)
        : [...prev, targetId],
    );
  };

  const toggleSelectAllSpaces = () => {
    if (sharingRef.current) {
      return;
    }
    markRecipientsReviewed();
    setOtherSpaceIds(nextOtherSpaceSelection(eligibleOtherIds, otherSpaceIds));
  };

  const leaveAfterShare = useCallback(() => {
    clearDayShareFailed(spaceId, menuDate);
    const state = navigation.getState();
    if (!state) {
      resetToDashboard(spaceId);
      return;
    }
    sharingRef.current = false;
    navigation.dispatch(mealShareExitAction({ spaceId, menuDate }));
  }, [menuDate, navigation, spaceId]);

  useEffect(() => {
    const unsubscribe = navigation.addListener('beforeRemove', event => {
      if (shouldBlockMealShareExit(event.data.action, sharingRef.current)) {
        event.preventDefault();
      }
    });
    return unsubscribe;
  }, [navigation]);

  const shareMessage = async () => {
    if (sharingRef.current) {
      return;
    }
    if (dateReadOnly) {
      showToast(t('meals.errors.pastDateReadOnly'));
      return;
    }
    if (!messageText || selectedTypes.length === 0) {
      showToast(t('meals.planning.shareSelectAtLeastOne'));
      return;
    }
    sharingRef.current = true;
    setSharing(true);
    setSharePhase('saving');
    setShareProgress(null);
    try {
      const selectedOthers = selectedShareDestinations(otherTargets, otherSpaceIds);

      const markSpaceChecked = beginShareProgress(selectedOthers.length, setShareProgress);
      if (selectedOthers.length > 0) {
        setSharePhase('checking');
      }
      const validations = await mapWithConcurrency(
        selectedOthers,
        SHARE_SPACE_CONCURRENCY,
        async space => {
          try {
            return {
              space,
              result: await validateShareMenusToSpace(
                menuMap,
                selectedTypes,
                space,
                mySpaces.find(row => row.spaceId === spaceId),
              ),
            };
          } finally {
            markSpaceChecked();
          }
        },
      );
      const failed = validations.find(row => !row.result.ok);
      if (failed && !failed.result.ok) {
        const blocked = failed.result;
        const message =
          blocked.reason === 'cross-owner'
            ? t('meals.planning.shareCrossOwner', {
                space: blocked.spaceName,
                defaultValue:
                  '{{space}} belongs to a different owner. Menus can only be shared between spaces of the same owner.',
              })
            : blocked.reason === 'hidden'
              ? t('meals.planning.shareComboHidden', {
                  space: blocked.spaceName,
                  items: blocked.missingLabels.slice(0, 3).join(', '),
                  defaultValue:
                    '{{space}} has hidden: {{items}}. Turn the combo on in that space’s menu library, then try again.',
                })
              : t('meals.planning.shareToSpaceIncompatible', {
                  space: blocked.spaceName,
                  items: blocked.missingLabels.slice(0, 3).join(', '),
                });
        showToast(message);
        return;
      }

      if (publishMenu) {
        await publishDraftMenusForTypes(spaceId, menuDate, selectedTypes, menuMap);
        const pendingPolls = selectedTypes.filter(type => !openedCurrentMeals.current.has(type));
        if (pendingPolls.length > 0) {
          setSharePhase('opening');
          const pollResult = await openPollsForMealTypes(spaceId, menuDate, pendingPolls);
          pollResult.opened.forEach(type => openedCurrentMeals.current.add(type));
          const opened = pollResult.opened.length;
          if (opened === 0) {
            showToast(t('meals.errors.saveFailed'));
            return;
          }
          if (pollResult.failed.length > 0) {
            showToast(t('meals.errors.saveFailed'));
            return;
          }
        }
        showToast(t('meals.poll.autoOpened', { count: selectedTypes.length }));
      }

      const readyTargets = validations.filter(
        (row): row is typeof row & { result: Extract<(typeof row)['result'], { ok: true }> } =>
          row.result.ok,
      );
      const pendingTargets = readyTargets.filter(row =>
        selectedTypes.some(type => {
          const options = row.result.optionsByMeal[type];
          const opened = openedBySpace.current.get(row.space.spaceId) ?? [];
          return Boolean(options && options.length > 0) && !opened.includes(type);
        }),
      );

      let extraShared = 0;
      let extraFailed = false;
      if (pendingTargets.length > 0) {
        setSharePhase('sharing');
        const markSpaceShared = beginShareProgress(pendingTargets.length, setShareProgress);
        const shareResults = await mapWithConcurrency(
          pendingTargets,
          SHARE_SPACE_CONCURRENCY,
          async row => {
            try {
              const shared = await shareMenusToSpace(
                row.space.spaceId,
                menuDate,
                selectedTypes,
                row.result,
                openedBySpace.current.get(row.space.spaceId) ?? [],
              );
              openedBySpace.current.set(row.space.spaceId, shared.opened);
              return shared.failed.length === 0;
            } catch {
              return false;
            } finally {
              markSpaceShared();
            }
          },
        );
        shareResults.forEach((ok, index) => {
          if (ok) {
            extraShared += 1;
            return;
          }
          extraFailed = true;
          showToast(
            t('meals.planning.shareToSpaceFailed', {
              space: formatSpaceDisplayName(pendingTargets[index].space),
            }),
          );
        });
      }
      if (extraFailed) {
        return;
      }
      if (extraShared > 0) {
        showToast(
          t('meals.planning.shareToSpacesSuccess', {
            count: extraShared,
          }),
        );
        const extrasOmitted = readyTargets.filter(
          row => (row.result.skippedExtras?.length ?? 0) > 0,
        ).length;
        if (extrasOmitted > 0) {
          showToast(t('meals.planning.shareExtrasOmitted', { count: extrasOmitted }));
        }
      }

      if (externalShare) {
        try {
          const latestMessage = await buildShareMessageForSelection(
            spaceId,
            menuDate,
            selectedTypes,
            menuMap,
          );
          await Share.share({ message: latestMessage || messageText });
        } catch {
          // Cancelled or unavailable. The meal and poll stay published.
        }
      }

      leaveAfterShare();
    } catch {
      markDayShareFailed(spaceId, menuDate);
      showToast(t('meals.errors.saveFailed'));
    } finally {
      sharingRef.current = false;
      setSharing(false);
      setSharePhase(null);
      setShareProgress(null);
    }
  };

  const loading = loadingMenus || loadingPreview;
  const shareDisabled = dateReadOnly || !messageText || loading || sharing || !hasSlots;

  const handleScroll = useCallback(
    (event: NativeSyntheticEvent<NativeScrollEvent>) => {
      const { contentOffset, layoutMeasurement } = event.nativeEvent;
      onRecipientsScroll(contentOffset.y, layoutMeasurement.height);
      onMessageScroll(contentOffset.y, layoutMeasurement.height);
    },
    [onMessageScroll, onRecipientsScroll],
  );

  const continueShareStep = useCallback(() => {
    if (!recipientsReviewed) {
      clearMessageReviewed();
      continueToRecipients(scrollRef);
      return;
    }
    continueToMessage(scrollRef);
  }, [clearMessageReviewed, continueToMessage, continueToRecipients, recipientsReviewed]);

  return (
    <View style={styles.screen}>
      <ScrollView
        ref={scrollRef}
        style={styles.scroll}
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        scrollEventThrottle={16}
        onScrollBeginDrag={() => {
          onRecipientsScrollBeginDrag();
          onMessageScrollBeginDrag();
        }}
        onScroll={handleScroll}>
        <MealFormHero
          icon={Share2}
          eyebrow={formatMenuDate(menuDate, i18n.language)}
          heading={t(
            saveAndShareFlow
              ? 'meals.planning.reviewSaveTitle'
              : 'meals.planning.previewShare',
          )}
          subheading={t(
            saveAndShareFlow ? 'meals.planning.reviewSaveHint' : 'meals.planning.shareHint',
          )}
        />
        {dateReadOnly ? (
          <View style={styles.readOnlyBanner}>
            <Text style={styles.readOnlyHint}>{t('meals.planning.pastDateReadOnly')}</Text>
          </View>
        ) : null}

        {loadingMenus ? <ActivityIndicator color={colors.primary} style={styles.loader} /> : null}

        {!loadingMenus && !hasShareableSlot ? (
          <EmptyState
            title={t('meals.planning.shareEmpty')}
            Icon={UtensilsCrossed}
          />
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
                disabled={dateReadOnly || sharing}
              />
            ))}

            {selectedTypes.length === 0 ? (
              <Text style={styles.selectHint}>{t('meals.planning.shareSelectAtLeastOne')}</Text>
            ) : null}

            <View
              collapsable={false}
              style={[
                styles.messageSection,
                recipientsHighlighted ? styles.messageHighlight : null,
              ]}
              onLayout={event => {
                const { y, height } = event.nativeEvent.layout;
                onRecipientsLayout(y, height);
              }}>
              {!dateReadOnly ? (
                <View style={styles.otherSpacesBlock}>
                  <View style={styles.shareToHead}>
                    <Text style={[styles.sectionLabel, styles.shareToHeading]}>
                      {t('meals.planning.shareToSection')}
                    </Text>
                    {offerOtherSpaces ? (
                      <Pressable
                        onPress={handleToggleOtherSpaces}
                        style={({ pressed }) => [
                          styles.countPill,
                          pressed && styles.countPillPressed,
                        ]}
                        accessibilityRole="button"
                        accessibilityState={{ expanded: showOtherSpaces }}
                        accessibilityLabel={
                          selectedOtherCount === 0
                            ? t('meals.planning.shareToOtherNone')
                            : t('meals.planning.shareToOtherCount', { count: selectedOtherCount })
                        }>
                        <Text style={styles.countPillText} numberOfLines={1}>
                          {selectedOtherCount === 0
                            ? t('meals.planning.shareToOtherNone')
                            : t('meals.planning.shareToOtherCount', { count: selectedOtherCount })}
                        </Text>
                        {showOtherSpaces ? (
                          <ChevronUp size={16} color={colors.tealDark} strokeWidth={2.4} />
                        ) : (
                          <ChevronDown size={16} color={colors.tealDark} strokeWidth={2.4} />
                        )}
                      </Pressable>
                    ) : null}
                  </View>

                  <View style={styles.spaceRowLocked}>
                    <View style={[styles.checkbox, styles.checkboxSelected]}>
                      <Check size={14} color={colors.white} strokeWidth={2.6} />
                    </View>
                    <View style={styles.spaceTextCol}>
                      <Text style={styles.spaceLabel} numberOfLines={2}>
                        {currentSpace?.spaceName ?? t('meals.planning.shareToCurrentSpace')}
                      </Text>
                      {currentSpace?.address?.trim() ? (
                        <Text style={styles.spaceAddress} numberOfLines={1}>
                          {currentSpace.address.trim()}
                        </Text>
                      ) : null}
                    </View>
                    <Text style={styles.currentTag}>{t('meals.planning.shareToCurrent')}</Text>
                  </View>

                  {offerOtherSpaces && showOtherSpaces ? (
                    <>
                      <Pressable
                        style={styles.spaceRow}
                        onPress={toggleSelectAllSpaces}
                        accessibilityRole="checkbox"
                        accessibilityState={{
                          checked: selectAllState === 'some' ? 'mixed' : selectAllState === 'all',
                        }}>
                        <View
                          style={[
                            styles.checkbox,
                            selectAllState !== 'none' && styles.checkboxSelected,
                          ]}>
                          {selectAllState === 'all' ? (
                            <Check size={14} color={colors.white} strokeWidth={2.6} />
                          ) : selectAllState === 'some' ? (
                            <Minus size={14} color={colors.white} strokeWidth={2.6} />
                          ) : null}
                        </View>
                        <Text style={styles.spaceLabel} numberOfLines={1}>
                          {t('meals.planning.shareToSelectAll', { count: otherTargets.length })}
                        </Text>
                      </Pressable>

                      {otherTargets.length > 6 ? (
                        <TextInput
                          value={spaceQuery}
                          onChangeText={setSpaceQuery}
                          placeholder={t('meals.planning.shareToSearch')}
                          placeholderTextColor={colors.muted}
                          style={styles.searchInput}
                          autoCorrect={false}
                          autoCapitalize="none"
                        />
                      ) : null}

                      {spacesLoading && otherTargets.length === 0 ? (
                        <ActivityIndicator color={colors.primary} style={styles.loader} />
                      ) : null}

                      {visibleOtherTargets.map(space => {
                        const selected = otherSpaceIds.includes(space.spaceId);
                        return (
                          <Pressable
                            key={space.spaceId}
                            style={styles.spaceRow}
                            onPress={() => toggleOtherSpace(space.spaceId)}
                            accessibilityRole="checkbox"
                            accessibilityState={{ checked: selected }}>
                            <View style={[styles.checkbox, selected && styles.checkboxSelected]}>
                              {selected ? (
                                <Check size={14} color={colors.white} strokeWidth={2.6} />
                              ) : null}
                            </View>
                            <View style={styles.spaceTextCol}>
                              <Text style={styles.spaceLabel} numberOfLines={2}>
                                {space.spaceName}
                              </Text>
                              {space.address?.trim() ? (
                                <Text style={styles.spaceAddress} numberOfLines={1}>
                                  {space.address.trim()}
                                </Text>
                              ) : null}
                            </View>
                          </Pressable>
                        );
                      })}
                    </>
                  ) : null}
                </View>
              ) : null}
            </View>

            <View
              collapsable={false}
              style={[
                styles.messageSection,
                messageHighlighted ? styles.messageHighlight : null,
              ]}
              onLayout={event => {
                const { y, height } = event.nativeEvent.layout;
                onMessageLayout(y, height);
              }}>
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
            </View>
          </>
        ) : null}
      </ScrollView>

      {!dateReadOnly && hasShareableSlot ? (
        <ProgressiveWorkflowFooter
          phase={progressivePhase}
          stepLabel={
            shareStep > 0
              ? t('progressiveWorkflow.stepOf', {
                  current: shareStep,
                  total: SHARE_PREVIEW_STEP_TOTAL,
                })
              : undefined
          }
          stepCurrent={shareStep > 0 ? shareStep : undefined}
          stepTotal={shareStep > 0 ? SHARE_PREVIEW_STEP_TOTAL : undefined}
          progressLine={
            shareFooterCopy ? t(shareFooterCopy.progressKey) : undefined
          }
          continueEyebrow={t('progressiveWorkflow.nextStep')}
          continueTitle={
            shareFooterCopy?.titleKey ? t(shareFooterCopy.titleKey) : undefined
          }
          continueHint={shareFooterCopy?.hintKey ? t(shareFooterCopy.hintKey) : undefined}
          continueLabel={
            shareFooterCopy?.continueKey ? t(shareFooterCopy.continueKey) : undefined
          }
          onContinue={continueShareStep}
          primaryAction={{
            label: sharing
              ? sharePhase === 'opening'
                ? t('meals.poll.openingPolls')
                : sharePhase === 'checking' && shareProgress
                  ? t('meals.planning.checkingSpacesProgress', shareProgress)
                  : sharePhase === 'sharing' && shareProgress
                    ? t('meals.planning.sharingToSpacesProgress', shareProgress)
                    : sharePhase === 'sharing'
                      ? t('meals.planning.sharingToSpaces')
                      : saveAndShareFlow
                        ? t('meals.planning.saveAndShareBusy')
                        : t('meals.planning.savingMenu')
              : saveAndShareFlow
                ? t('meals.planning.saveAndShare')
                : t('meals.planning.copyMessage'),
            onPress: () => void shareMessage(),
            disabled: shareDisabled,
            loading: sharing,
          }}
          meter={
            sharing &&
            shareProgress &&
            shareProgress.total > 0 &&
            (sharePhase === 'checking' || sharePhase === 'sharing')
              ? shareProgress
              : undefined
          }
        />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  scroll: { flex: 1 },
  content: { padding: spacing.lg, paddingBottom: spacing.section },
  readOnlyBanner: {
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FECACA',
    borderRadius: radius.card,
    padding: spacing.md,
    marginBottom: spacing.lg,
  },
  readOnlyHint: {
    ...typography.caption,
    color: '#991B1B',
    lineHeight: 18,
  },
  sectionLabel: { ...typography.bodyStrong, marginBottom: spacing.sm },
  selectHint: {
    ...typography.caption,
    color: colors.muted,
    marginBottom: spacing.md,
  },
  messageSection: {
    marginTop: spacing.sm,
    borderRadius: radius.card,
  },
  messageHighlight: {
    ...progressiveSectionHighlightStyle,
    borderWidth: 1,
    borderRadius: radius.card,
    padding: spacing.sm,
  },
  otherSpacesBlock: {
    marginTop: spacing.md,
    marginBottom: spacing.sm,
  },
  shareToHead: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  shareToHeading: {
    marginBottom: 0,
    flexShrink: 1,
  },
  countPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    maxWidth: '62%',
    backgroundColor: colors.lightGreen,
    borderWidth: 1,
    borderColor: colors.primary,
    borderRadius: radius.full,
    paddingHorizontal: spacing.sm,
    paddingVertical: 6,
    minHeight: 32,
  },
  countPillPressed: {
    opacity: 0.88,
  },
  countPillText: {
    ...typography.caption,
    color: colors.tealDark,
    fontWeight: '700',
    flexShrink: 1,
  },
  searchInput: {
    ...typography.body,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.card,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    marginBottom: spacing.sm,
    color: colors.textPrimary,
    minHeight: 44,
  },
  spaceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.card,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    marginBottom: spacing.sm,
    minHeight: 48,
  },
  spaceRowLocked: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.lightGreen,
    borderWidth: 1,
    borderColor: colors.primary,
    borderRadius: radius.card,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    marginBottom: spacing.sm,
    minHeight: 48,
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
  spaceTextCol: {
    flex: 1,
    minWidth: 0,
  },
  spaceLabel: {
    ...typography.bodyStrong,
  },
  spaceAddress: {
    ...typography.caption,
    color: colors.muted,
    marginTop: 2,
  },
  currentTag: {
    ...typography.caption,
    color: colors.primaryDark,
    fontWeight: '700',
  },
  loader: { marginVertical: spacing.lg },
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
});
