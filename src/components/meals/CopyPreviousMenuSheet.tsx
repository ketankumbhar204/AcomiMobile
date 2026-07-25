import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { CalendarDays, Check, ChevronRight, Copy, Star } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { mealsApi } from '../../api/mealsApi';
import { ApiError, type DailyMenuResponse, type MealType, type UUID } from '../../api/types';
import { useToastStore } from '../../store/toastStore';
import { colors, radius, shadows, spacing, typography } from '../../theme';
import {
  addDaysIsoDate,
  compareIsoDates,
  formatMenuDate,
} from '../../utils/mealDates';
import { mealTypeLabelKey, MEAL_TYPES } from '../../utils/mealLabels';
import { useConfirmDialog } from '../ui/ConfirmDialog';
import { MenuDatePickerModal } from './MenuDatePickerModal';
import {
  MenuPlanningBottomSheet,
  SheetPrimaryButton,
  SheetSecondaryButton,
} from './MenuPlanningBottomSheet';
import { MealTypeVisual } from './MealTypeVisual';

const HISTORY_DAYS = 90;

type CopyPreviousMenuSheetProps = {
  visible: boolean;
  spaceId: UUID;
  targetDate: string;
  targetMenus: DailyMenuResponse[];
  initialMealType?: MealType;
  onClose: () => void;
  onCopied: () => void | Promise<void>;
};

type HistoryDay = {
  date: string;
  menus: Partial<Record<MealType, DailyMenuResponse>>;
  mealTypes: MealType[];
};

function hasPlannedMenu(menu?: DailyMenuResponse | null): boolean {
  return (menu?.options?.filter(option => option.isAvailable) ?? []).length > 0;
}

function buildHistoryDays(menus: DailyMenuResponse[], targetDate: string): HistoryDay[] {
  const byDate = new Map<string, Partial<Record<MealType, DailyMenuResponse>>>();

  for (const menu of menus) {
    if (compareIsoDates(menu.menuDate, targetDate) >= 0 || !hasPlannedMenu(menu)) {
      continue;
    }
    const day = byDate.get(menu.menuDate) ?? {};
    day[menu.mealType] = menu;
    byDate.set(menu.menuDate, day);
  }

  return [...byDate.entries()]
    .map(([date, dayMenus]) => ({
      date,
      menus: dayMenus,
      mealTypes: MEAL_TYPES.filter(mealType => hasPlannedMenu(dayMenus[mealType])),
    }))
    .filter(day => day.mealTypes.length > 0)
    .sort((a, b) => b.date.localeCompare(a.date));
}

export function CopyPreviousMenuSheet({
  visible,
  spaceId,
  targetDate,
  targetMenus,
  initialMealType,
  onClose,
  onCopied,
}: CopyPreviousMenuSheetProps) {
  const { t, i18n } = useTranslation();
  const showToast = useToastStore(state => state.showToast);
  const { showConfirm } = useConfirmDialog();
  const [history, setHistory] = useState<HistoryDay[]>([]);
  const [loading, setLoading] = useState(false);
  const [copying, setCopying] = useState(false);
  const [selectedDay, setSelectedDay] = useState<HistoryDay | null>(null);
  const [selectedMeals, setSelectedMeals] = useState<Set<MealType>>(new Set());
  const [datePickerOpen, setDatePickerOpen] = useState(false);

  const loadHistory = useCallback(async () => {
    setLoading(true);
    try {
      const menus = await mealsApi.getDailyMenusRange(
        spaceId,
        addDaysIsoDate(targetDate, -HISTORY_DAYS),
        addDaysIsoDate(targetDate, -1),
      );
      setHistory(buildHistoryDays(menus, targetDate));
    } catch {
      setHistory([]);
      showToast(
        t('meals.planning.copyFrom.loadFailed', {
          defaultValue: 'Could not load previous menus.',
        }),
      );
    } finally {
      setLoading(false);
    }
  }, [showToast, spaceId, t, targetDate]);

  useEffect(() => {
    if (!visible) {
      setSelectedDay(null);
      setSelectedMeals(new Set());
      setDatePickerOpen(false);
      return;
    }
    loadHistory().catch(() => undefined);
  }, [loadHistory, visible]);

  const openPreview = useCallback(
    (day: HistoryDay) => {
      const preferred =
        initialMealType && day.mealTypes.includes(initialMealType)
          ? [initialMealType]
          : day.mealTypes;
      setSelectedMeals(new Set(preferred));
      setSelectedDay(day);
    },
    [initialMealType],
  );

  const quickSuggestions = useMemo(() => {
    const suggestions: Array<{ id: string; label: string; day: HistoryDay }> = [];
    const usedDates = new Set<string>();
    const add = (id: string, label: string, day?: HistoryDay) => {
      if (!day || usedDates.has(day.date)) {
        return;
      }
      usedDates.add(day.date);
      suggestions.push({ id, label, day });
    };

    add(
      'yesterday',
      t('meals.planning.copyFrom.yesterday', { defaultValue: 'Yesterday' }),
      history.find(day => day.date === addDaysIsoDate(targetDate, -1)),
    );
    add(
      'last-planned',
      t('meals.planning.copyFrom.lastPlanned', { defaultValue: 'Last planned menu' }),
      history[0],
    );
    add(
      'last-week',
      t('meals.planning.copyFrom.lastWeek', { defaultValue: 'Same day last week' }),
      history.find(day => day.date === addDaysIsoDate(targetDate, -7)),
    );
    return suggestions;
  }, [history, t, targetDate]);

  const targetMenuMap = useMemo(
    () =>
      targetMenus.reduce<Partial<Record<MealType, DailyMenuResponse>>>((map, menu) => {
        map[menu.mealType] = menu;
        return map;
      }, {}),
    [targetMenus],
  );

  const toggleMeal = (mealType: MealType) => {
    setSelectedMeals(current => {
      const next = new Set(current);
      if (next.has(mealType)) {
        next.delete(mealType);
      } else {
        next.add(mealType);
      }
      return next;
    });
  };

  const executeCopy = useCallback(
    async (force: boolean) => {
      if (!selectedDay || selectedMeals.size === 0) {
        return;
      }
      setCopying(true);
      try {
        for (const mealType of MEAL_TYPES) {
          if (!selectedMeals.has(mealType)) {
            continue;
          }
          await mealsApi.copyDailyMenu(
            spaceId,
            targetDate,
            mealType,
            selectedDay.date,
            force ? { force: true } : undefined,
          );
        }
        showToast(
          t('meals.planning.copyFrom.success', {
            count: selectedMeals.size,
            defaultValue: 'Menu copied successfully.',
          }),
        );
        await onCopied();
        onClose();
      } catch (error) {
        if (error instanceof ApiError && error.status === 409 && !force) {
          showConfirm({
            title: t('meals.planning.copyFrom.conflictTitle', {
              defaultValue: 'Replace existing menu?',
            }),
            message: t('meals.planning.copyFrom.conflictMessage', {
              defaultValue:
                'One or more selected meals already have a menu. Copying will replace them.',
            }),
            confirmLabel: t('meals.planning.copyFrom.replace', {
              defaultValue: 'Replace and copy',
            }),
            onConfirm: () => executeCopy(true),
          });
          return;
        }
        showToast(
          error instanceof ApiError && error.message
            ? error.message
            : t('meals.planning.copyFailed'),
        );
      } finally {
        setCopying(false);
      }
    },
    [
      onClose,
      onCopied,
      selectedDay,
      selectedMeals,
      showConfirm,
      showToast,
      spaceId,
      t,
      targetDate,
    ],
  );

  const requestCopy = () => {
    if (!selectedDay || selectedMeals.size === 0) {
      return;
    }
    const conflicts = [...selectedMeals].filter(mealType =>
      hasPlannedMenu(targetMenuMap[mealType]),
    );
    if (conflicts.length === 0) {
      executeCopy(false).catch(() => undefined);
      return;
    }
    showConfirm({
      title: t('meals.planning.copyFrom.conflictTitle', {
        defaultValue: 'Replace existing menu?',
      }),
      message: t('meals.planning.copyFrom.conflictMessage', {
        defaultValue:
          'One or more selected meals already have a menu. Copying will replace them.',
      }),
      confirmLabel: t('meals.planning.copyFrom.replace', {
        defaultValue: 'Replace and copy',
      }),
      onConfirm: () => executeCopy(true),
    });
  };

  const handleCustomDate = async (sourceDate: string) => {
    if (compareIsoDates(sourceDate, targetDate) >= 0) {
      showToast(
        t('meals.planning.copyFrom.previousDateOnly', {
          defaultValue: 'Choose a date before the menu date.',
        }),
      );
      return;
    }
    setLoading(true);
    try {
      const menus = await mealsApi.getDailyMenusByDate(spaceId, sourceDate);
      const day = buildHistoryDays(menus, targetDate)[0];
      if (!day) {
        showToast(
          t('meals.planning.copyFrom.noMenus', {
            defaultValue: 'No planned menus were found on that date.',
          }),
        );
        return;
      }
      openPreview(day);
    } catch {
      showToast(
        t('meals.planning.copyFrom.loadFailed', {
          defaultValue: 'Could not load previous menus.',
        }),
      );
    } finally {
      setLoading(false);
    }
  };

  const mealSummary = (day: HistoryDay) =>
    day.mealTypes.map(mealType => t(mealTypeLabelKey(mealType))).join(', ');

  const footer = selectedDay ? (
    <View style={styles.footer}>
      <SheetSecondaryButton
        label={t('common.cancel')}
        onPress={onClose}
        disabled={copying}
      />
      <SheetPrimaryButton
        label={t('meals.planning.copyFrom.copySelected', {
          defaultValue: 'Copy selected meals',
        })}
        onPress={requestCopy}
        disabled={selectedMeals.size === 0}
        loading={copying}
      />
    </View>
  ) : undefined;

  return (
    <>
      <MenuPlanningBottomSheet
        visible={visible}
        title={t('meals.planning.copyFrom.title', { defaultValue: 'Copy Menu From' })}
        subtitle={
          selectedDay ? formatMenuDate(selectedDay.date, i18n.language) : undefined
        }
        onClose={onClose}
        onBack={selectedDay ? () => setSelectedDay(null) : undefined}
        footer={footer}
        busy={copying}
        minHeightRatio={0.58}
        maxHeightRatio={0.9}
        scrollContentStyle={styles.content}>
        {loading ? (
          <ActivityIndicator color={colors.primary} style={styles.loader} />
        ) : selectedDay ? (
          <View style={styles.preview}>
            <View style={styles.previewHeading}>
              <CalendarDays size={18} color={colors.primaryDark} strokeWidth={2.2} />
              <Text style={styles.previewDate}>
                {formatMenuDate(selectedDay.date, i18n.language)}
              </Text>
            </View>
            <Text style={styles.helper}>
              {t('meals.planning.copyFrom.selectMeals', {
                defaultValue: 'Choose the meals you want to copy.',
              })}
            </Text>

            {MEAL_TYPES.map(mealType => {
              const menu = selectedDay.menus[mealType];
              const planned = hasPlannedMenu(menu);
              const selected = selectedMeals.has(mealType);
              const options =
                menu?.options?.filter(option => option.isAvailable).map(option => option.label) ??
                [];
              return (
                <Pressable
                  key={mealType}
                  onPress={planned ? () => toggleMeal(mealType) : undefined}
                  disabled={!planned}
                  style={[
                    styles.mealPreview,
                    selected && styles.mealPreviewSelected,
                    !planned && styles.mealPreviewDisabled,
                  ]}
                  accessibilityRole="checkbox"
                  accessibilityState={{ checked: selected, disabled: !planned }}>
                  <MealTypeVisual mealType={mealType} size={18} />
                  <View style={styles.mealCopy}>
                    <Text style={styles.mealTitle}>{t(mealTypeLabelKey(mealType))}</Text>
                    <Text style={[styles.optionList, !planned && styles.notPlanned]}>
                      {planned
                        ? options.join(' • ')
                        : t('meals.planning.copyFrom.notPlanned', {
                            defaultValue: 'Not planned',
                          })}
                    </Text>
                  </View>
                  <View style={[styles.checkbox, selected && styles.checkboxSelected]}>
                    {selected ? <Check size={15} color={colors.white} strokeWidth={3} /> : null}
                  </View>
                </Pressable>
              );
            })}

            <Pressable
              style={styles.selectAll}
              onPress={() => setSelectedMeals(new Set(selectedDay.mealTypes))}>
              <Copy size={16} color={colors.primaryDark} strokeWidth={2.2} />
              <Text style={styles.selectAllText}>
                {t('meals.planning.copyFrom.copyEntireDay', {
                  defaultValue: 'Select entire day',
                })}
              </Text>
            </Pressable>
          </View>
        ) : (
          <View style={styles.browser}>
            {quickSuggestions.length > 0 ? (
              <>
                <Text style={styles.sectionLabel}>
                  {t('meals.planning.copyFrom.quickSuggestions', {
                    defaultValue: 'Quick suggestions',
                  })}
                </Text>
                <View style={styles.suggestions}>
                  {quickSuggestions.map(suggestion => (
                    <Pressable
                      key={suggestion.id}
                      onPress={() => openPreview(suggestion.day)}
                      style={({ pressed }) => [
                        styles.suggestion,
                        pressed && styles.pressed,
                      ]}>
                      <Star size={15} color="#D97706" fill="#FEF3C7" strokeWidth={2} />
                      <Text style={styles.suggestionText}>{suggestion.label}</Text>
                    </Pressable>
                  ))}
                </View>
              </>
            ) : null}

            <View style={styles.historyHeader}>
              <Text style={styles.sectionLabel}>
                {t('meals.planning.copyFrom.previousMenus', {
                  defaultValue: 'Previous menus',
                })}
              </Text>
              <Pressable onPress={() => setDatePickerOpen(true)} hitSlop={8}>
                <Text style={styles.chooseDate}>
                  {t('meals.planning.copyFrom.chooseDate', {
                    defaultValue: 'Choose date',
                  })}
                </Text>
              </Pressable>
            </View>

            {history.length === 0 ? (
              <View style={styles.emptyState}>
                <CalendarDays size={28} color={colors.muted} strokeWidth={1.8} />
                <Text style={styles.emptyTitle}>
                  {t('meals.planning.copyFrom.empty', {
                    defaultValue: 'No previous planned menus found.',
                  })}
                </Text>
              </View>
            ) : (
              <View style={styles.historyList}>
                {history.map(day => (
                  <Pressable
                    key={day.date}
                    onPress={() => openPreview(day)}
                    style={({ pressed }) => [styles.historyRow, pressed && styles.pressed]}>
                    <View style={styles.historyIcon}>
                      <CalendarDays
                        size={18}
                        color={colors.primaryDark}
                        strokeWidth={2.2}
                      />
                    </View>
                    <View style={styles.historyCopy}>
                      <Text style={styles.historyDate}>
                        {formatMenuDate(day.date, i18n.language)}
                      </Text>
                      <Text style={styles.historyMeals} numberOfLines={1}>
                        {mealSummary(day)}
                      </Text>
                    </View>
                    <ChevronRight size={18} color={colors.muted} strokeWidth={2.2} />
                  </Pressable>
                ))}
              </View>
            )}
          </View>
        )}
      </MenuPlanningBottomSheet>

      <MenuDatePickerModal
        visible={datePickerOpen}
        value={addDaysIsoDate(targetDate, -1)}
        allowPastDates
        onClose={() => setDatePickerOpen(false)}
        onConfirm={sourceDate => {
          handleCustomDate(sourceDate).catch(() => undefined);
        }}
      />
    </>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.sm,
  },
  loader: {
    marginVertical: spacing.xxl,
  },
  browser: {
    gap: spacing.md,
  },
  sectionLabel: {
    ...typography.caption,
    color: colors.textSecondary,
    fontWeight: '700',
    fontSize: 12,
  },
  suggestions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  suggestion: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.full,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    backgroundColor: colors.surface,
  },
  suggestionText: {
    ...typography.caption,
    color: colors.textPrimary,
    fontWeight: '600',
  },
  historyHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  chooseDate: {
    ...typography.caption,
    color: colors.primaryDark,
    fontWeight: '700',
  },
  historyList: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.card,
    overflow: 'hidden',
    ...shadows.sm,
  },
  historyRow: {
    minHeight: 64,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
    backgroundColor: colors.white,
  },
  pressed: {
    opacity: 0.85,
    backgroundColor: colors.surface,
  },
  historyIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.lightGreen,
  },
  historyCopy: {
    flex: 1,
    minWidth: 0,
    gap: 2,
  },
  historyDate: {
    ...typography.bodyStrong,
    fontSize: 14,
    color: colors.textPrimary,
  },
  historyMeals: {
    ...typography.caption,
    fontSize: 12,
    color: colors.textSecondary,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.xxl,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.card,
    backgroundColor: colors.surface,
  },
  emptyTitle: {
    ...typography.caption,
    color: colors.muted,
    textAlign: 'center',
  },
  preview: {
    gap: spacing.md,
  },
  previewHeading: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
  },
  previewDate: {
    ...typography.bodyStrong,
    fontSize: 16,
    color: colors.textPrimary,
  },
  helper: {
    ...typography.caption,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  mealPreview: {
    minHeight: 76,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.card,
    backgroundColor: colors.white,
  },
  mealPreviewSelected: {
    borderColor: colors.primary,
    backgroundColor: '#F0FDF4',
  },
  mealPreviewDisabled: {
    backgroundColor: colors.surface,
    opacity: 0.75,
  },
  mealCopy: {
    flex: 1,
    minWidth: 0,
    gap: spacing.xs,
  },
  mealTitle: {
    ...typography.bodyStrong,
    fontSize: 14,
    color: colors.textPrimary,
  },
  optionList: {
    ...typography.caption,
    color: colors.textSecondary,
    lineHeight: 16,
  },
  notPlanned: {
    color: colors.muted,
    fontStyle: 'italic',
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 7,
    borderWidth: 2,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxSelected: {
    borderColor: colors.primary,
    backgroundColor: colors.primary,
  },
  selectAll: {
    minHeight: 44,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    borderRadius: radius.button,
    backgroundColor: colors.lightGreen,
  },
  selectAllText: {
    ...typography.bodyStrong,
    color: colors.primaryDark,
    fontSize: 14,
  },
  footer: {
    gap: spacing.sm,
  },
});
