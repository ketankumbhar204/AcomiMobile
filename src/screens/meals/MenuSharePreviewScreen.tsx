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
import { Screen } from '../../components/ui/Screen';
import type { MainStackParamList } from '../../navigation/types';
import { useToastStore } from '../../store/toastStore';
import { colors, spacing, typography } from '../../theme';
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
  const dateReadOnly = isPastMenuDate(menuDate);

  const [loadingMenus, setLoadingMenus] = useState(true);
  const [loadingPreview, setLoadingPreview] = useState(false);
  const [menus, setMenus] = useState<DailyMenuResponse[]>([]);
  const [polls, setPolls] = useState<MealPollSlot[]>([]);
  const [selectedTypes, setSelectedTypes] = useState<MealType[]>([]);
  const [messageText, setMessageText] = useState('');
  const [initialized, setInitialized] = useState(false);
  const [sharing, setSharing] = useState(false);

  const menuMap = useMemo(() => menusByMealType(menus), [menus]);
  const sharedMealTypes = useMemo(
    () =>
      new Set(
        polls.filter(poll => poll.status === 'OPEN').map(poll => poll.mealType),
      ),
    [polls],
  );
  const hasShareableSlot = MEAL_TYPES.some(
    type => getSlotShareState(menuMap[type]) === 'shareable',
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

  useEffect(() => {
    if (!initialized || selectedTypes.length === 0) {
      setMessageText('');
      return;
    }

    let active = true;
    setLoadingPreview(true);
    void buildShareMessageForSelection(spaceId, menuDate, selectedTypes)
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
  }, [initialized, menuDate, selectedTypes, showToast, spaceId, t]);

  const toggleMealType = (type: MealType) => {
    setSelectedTypes(prev => {
      const next = prev.includes(type)
        ? prev.filter(row => row !== type)
        : [...prev, type];
      return MEAL_TYPES.filter(meal => next.includes(meal));
    });
  };

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
      await publishDraftMenusForTypes(spaceId, menuDate, selectedTypes, menuMap);
      const refreshed = await mealsApi.getDailyMenusByDate(spaceId, menuDate);
      setMenus(refreshed);
      const latestMessage = await buildShareMessageForSelection(
        spaceId,
        menuDate,
        selectedTypes,
      );
      const opened = await openPollsForMealTypes(spaceId, menuDate, selectedTypes);
      if (opened > 0) {
        showToast(t('meals.poll.autoOpened', { count: opened }));
      }
      await Share.share({ message: latestMessage || messageText });
      const pollDay = await mealsApi.getMealPolls(spaceId, menuDate).catch(() => null);
      if (pollDay) {
        setPolls(pollDay.polls);
      }
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
              alreadyShared={sharedMealTypes.has(type)}
              disabled={dateReadOnly}
            />
          ))}

          {selectedTypes.length === 0 ? (
            <Text style={styles.selectHint}>{t('meals.planning.shareSelectAtLeastOne')}</Text>
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
