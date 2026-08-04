import React, { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { CheckCircle2, Sparkles } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import type { MealDeliveryLocation, MealPollSlot, MealType, UUID } from '../../api/types';
import { Button } from '../ui';
import { colors, spacing, typography } from '../../theme';
import { formatComboNameWithPrice, formatComboPrice } from '../../utils/comboPrice';
import { formatMenuDate } from '../../utils/mealDates';
import { MEAL_TYPES, mealTypeLabelKey } from '../../utils/mealLabels';
import { MealDeliveryLocationCompact } from './MealDeliveryLocationCompact';
import { MealPollMealTypeTabs } from './MealPollMealTypeTabs';
import { MealPollOptionRadio } from './MealPollOptionRadio';
import { MealPollQuantityRow } from './MealPollQuantityRow';

type MealPollDayContentProps = {
  menuDate: string;
  loading: boolean;
  saving: boolean;
  openPolls: MealPollSlot[];
  selections: Partial<Record<MealType, UUID>>;
  quantitySelections?: Partial<Record<MealType, Record<UUID, number>>>;
  multiQuantity?: boolean;
  showSummary: boolean;
  totalPlates?: number;
  totalPlatesForMeal?: (mealType: MealType) => number;
  onSelect: (mealType: MealType, optionId: UUID) => void;
  onQuantityChange?: (mealType: MealType, optionId: UUID, quantity: number) => void;
  deliveryLocations?: MealDeliveryLocation[];
  deliverySelections?: Partial<Record<MealType, UUID>>;
  lastDeliveryLocations?: Partial<Record<MealType, UUID>>;
  onDeliveryLocationChange?: (mealType: MealType, locationId: UUID) => void;
  onSave: () => void | Promise<boolean | void>;
  onUpdateChoices: () => void;
  variant?: 'dashboard' | 'screen' | 'sheet';
  dateLabel?: string;
  hideSubmitButton?: boolean;
  readOnly?: boolean;
  showMealPrices?: boolean;
};

function sortPolls(polls: MealPollSlot[]): MealPollSlot[] {
  return [...polls].sort(
    (a, b) => MEAL_TYPES.indexOf(a.mealType) - MEAL_TYPES.indexOf(b.mealType),
  );
}

export function MealPollDayContent({
  menuDate,
  loading,
  saving,
  openPolls,
  selections,
  quantitySelections = {},
  multiQuantity = false,
  showSummary,
  totalPlates = 0,
  totalPlatesForMeal,
  onSelect,
  onQuantityChange,
  deliveryLocations = [],
  deliverySelections = {},
  lastDeliveryLocations = {},
  onDeliveryLocationChange,
  onSave,
  onUpdateChoices,
  variant = 'screen',
  dateLabel: dateLabelProp,
  hideSubmitButton = false,
  readOnly = false,
  showMealPrices = true,
}: MealPollDayContentProps) {
  const { t, i18n } = useTranslation();
  const isDashboard = variant === 'dashboard';
  const isSheet = variant === 'sheet';

  const showDeliveryForMeal =
    multiQuantity && deliveryLocations.length > 0 && !showSummary;
  const sortedPolls = useMemo(() => sortPolls(openPolls), [openPolls]);

  const [selectedMealType, setSelectedMealType] = useState<MealType | null>(
    () => sortedPolls[0]?.mealType ?? null,
  );

  useEffect(() => {
    if (sortedPolls.length === 0) {
      setSelectedMealType(null);
      return;
    }
    setSelectedMealType(prev => {
      if (prev && sortedPolls.some(poll => poll.mealType === prev)) {
        return prev;
      }
      return sortedPolls[0].mealType;
    });
  }, [sortedPolls]);

  const activePoll = useMemo(() => {
    if (showSummary) {
      return null;
    }
    return (
      sortedPolls.find(poll => poll.mealType === selectedMealType) ?? sortedPolls[0] ?? null
    );
  }, [selectedMealType, showSummary, sortedPolls]);

  if (loading) {
    return <ActivityIndicator color={colors.primary} style={styles.loader} />;
  }

  if (openPolls.length === 0) {
    return null;
  }

  const title = isDashboard ? t('dashboard.tomorrowMeals') : null;
  const dateLabel = dateLabelProp ?? formatMenuDate(menuDate, i18n.language);
  const useTabs = !showSummary && sortedPolls.length > 1;

  const renderPollEditor = (poll: MealPollSlot) => {
    const menuEntries = poll.options.filter(option => option.optionType === 'MENU_ENTRY');
    const mainOptions = menuEntries.filter(option => option.isExtra !== true);
    const extraOptions = menuEntries.filter(option => option.isExtra === true);
    const showExtrasSection = multiQuantity && extraOptions.length > 0;
    const mealPlates =
      totalPlatesForMeal?.(poll.mealType) ??
      Object.values(quantitySelections[poll.mealType] ?? {}).reduce((sum, qty) => sum + qty, 0);
    const mealAmount = showMealPrices
      ? menuEntries.reduce((sum, option) => {
          const qty = quantitySelections[poll.mealType]?.[option.id] ?? 0;
          const price = option.price != null ? Number(option.price) : 0;
          if (qty <= 0 || Number.isNaN(price)) return sum;
          return sum + price * qty;
        }, 0)
      : 0;
    const mealCurrency =
      menuEntries.find(option => option.currencyCode)?.currencyCode ?? 'INR';

    const renderQuantityRows = (
      options: typeof menuEntries,
      rowVariant: 'default' | 'extra' = 'default',
    ) =>
      options.map(option => (
        <MealPollQuantityRow
          key={option.id}
          option={option}
          quantity={quantitySelections[poll.mealType]?.[option.id] ?? 0}
          onChange={qty => onQuantityChange?.(poll.mealType, option.id, qty)}
          readOnly={readOnly}
          showPrice={showMealPrices}
          variant={rowVariant}
        />
      ));

    return (
      <View key={poll.id} style={styles.section}>
        {!useTabs ? (
          <Text style={styles.sectionTitle}>{t(mealTypeLabelKey(poll.mealType))}</Text>
        ) : null}

        {showDeliveryForMeal ? (
          <View style={styles.deliveryBelowTabs}>
            <MealDeliveryLocationCompact
              locations={deliveryLocations}
              selectedId={deliverySelections[poll.mealType]}
              lastUsedLocationId={lastDeliveryLocations[poll.mealType]}
              onSelect={locationId => onDeliveryLocationChange?.(poll.mealType, locationId)}
              readOnly={readOnly}
            />
          </View>
        ) : null}

        {multiQuantity ? (
          <>
            <Text style={styles.mainItemsHeading}>{t('meals.poll.mainItemsSection')}</Text>
            {renderQuantityRows(mainOptions)}
            {showExtrasSection ? (
              <View style={styles.extrasPanel}>
                <View style={styles.extrasPanelHeader}>
                  <Sparkles size={15} color={colors.primaryDark} />
                  <Text style={styles.extrasPanelTitle}>
                    {t('meals.poll.extrasSectionOptional')}
                  </Text>
                </View>
                {renderQuantityRows(extraOptions, 'extra')}
              </View>
            ) : null}
            <View style={[styles.mealSummaryStrip, mealPlates > 0 && styles.mealSummaryStripActive]}>
              <View style={styles.mealSummaryLeft}>
                {mealPlates > 0 ? (
                  <CheckCircle2 size={15} color={colors.primaryDark} />
                ) : null}
                <Text
                  style={[
                    styles.mealSummaryPlates,
                    mealPlates > 0 && styles.mealSummaryPlatesActive,
                  ]}>
                  {mealPlates > 0
                    ? t('meals.poll.platesCount', { count: mealPlates })
                    : t('meals.poll.skipMealHint', {
                        defaultValue: 'No plates — this meal will be skipped',
                      })}
                </Text>
              </View>
              {showMealPrices && mealAmount > 0 ? (
                <Text style={styles.mealSummaryTotal}>
                  {t('meals.poll.mealTotal', {
                    defaultValue: 'Total {{amount}}',
                    amount: formatComboPrice(mealAmount, mealCurrency) ?? '',
                  })}
                </Text>
              ) : null}
            </View>
          </>
        ) : (
          poll.options.map(option => (
            <MealPollOptionRadio
              key={option.id}
              option={option}
              selected={selections[poll.mealType] === option.id}
              onSelect={() => onSelect(poll.mealType, option.id)}
              readOnly={readOnly}
              showPrice={showMealPrices}
            />
          ))
        )}
      </View>
    );
  };

  return (
    <View>
      {title ? <Text style={styles.dashboardTitle}>{title}</Text> : null}
      {!isSheet ? (
        <Text style={isDashboard ? styles.dashboardDate : styles.screenDate}>{dateLabel}</Text>
      ) : (
        <Text style={styles.sheetDate}>{dateLabel}</Text>
      )}
      {isSheet || !isDashboard ? (
        <Text style={styles.subtitle}>
          {readOnly
            ? t('meals.poll.pastDateReadOnly')
            : multiQuantity
              ? t('meals.poll.responseHintMess')
              : t('meals.poll.responseHint')}
        </Text>
      ) : null}

      {showSummary
        ? sortedPolls.map(poll => {
            if (multiQuantity) {
              const activeSelections =
                poll.mySelections?.filter(selection => selection.quantity > 0) ?? [];
              const mainSelections = activeSelections.filter(selection => {
                const option = poll.options.find(row => row.id === selection.optionId);
                return option?.isExtra !== true;
              });
              const extraSelections = activeSelections.filter(selection => {
                const option = poll.options.find(row => row.id === selection.optionId);
                return option?.isExtra === true;
              });
              const renderSelectionLine = (
                selection: (typeof activeSelections)[number],
              ) => {
                const option = poll.options.find(row => row.id === selection.optionId);
                const label = option
                  ? formatComboNameWithPrice(
                      option.label,
                      option.price,
                      option.currencyCode,
                      showMealPrices,
                    )
                  : t('meals.poll.notSelected');
                return (
                  <Text key={selection.optionId} style={styles.summaryChoice}>
                    ✓ {label} × {selection.quantity}
                  </Text>
                );
              };
              return (
                <View key={poll.id} style={styles.section}>
                  <Text style={styles.sectionTitle}>{t(mealTypeLabelKey(poll.mealType))}</Text>
                  {activeSelections.length > 0 ? (
                    <>
                      {mainSelections.map(renderSelectionLine)}
                      {extraSelections.length > 0 ? (
                        <>
                          <Text style={[styles.optionGroupLabel, styles.extrasGroupLabel]}>
                            {t('meals.poll.extrasSection')}
                          </Text>
                          {extraSelections.map(renderSelectionLine)}
                        </>
                      ) : null}
                    </>
                  ) : (
                    <Text style={styles.summaryMissing}>{t('meals.poll.notSelected')}</Text>
                  )}
                  {poll.myDeliveryLocationName ? (
                    <Text style={styles.deliverySummary}>
                      {t('meals.poll.deliverTo')}: {poll.myDeliveryLocationName}
                    </Text>
                  ) : null}
                </View>
              );
            }

            const selected = poll.options.find(option => option.id === poll.mySelectedOptionId);
            return (
              <View key={poll.id} style={styles.section}>
                <Text style={styles.sectionTitle}>{t(mealTypeLabelKey(poll.mealType))}</Text>
                {selected ? (
                  <Text style={styles.summaryChoice}>
                    ✓{' '}
                    {formatComboNameWithPrice(
                      selected.label,
                      selected.price,
                      selected.currencyCode,
                      showMealPrices,
                    )}
                  </Text>
                ) : (
                  <Text style={styles.summaryMissing}>{t('meals.poll.notSelected')}</Text>
                )}
              </View>
            );
          })
        : (
          <>
            {useTabs && selectedMealType ? (
              <MealPollMealTypeTabs
                polls={sortedPolls}
                selectedMealType={selectedMealType}
                onSelectMealType={setSelectedMealType}
                multiQuantity={multiQuantity}
                selections={selections}
                quantitySelections={quantitySelections}
                totalPlatesForMeal={totalPlatesForMeal}
              />
            ) : null}
            {activePoll ? renderPollEditor(activePoll) : null}
          </>
        )}

      {showSummary && multiQuantity ? (
        <View style={styles.summaryFooter}>
          <View style={styles.divider} />
          <Text style={styles.totalPlatesAll}>
            {t('meals.poll.totalPlatesAll', {
              count: openPolls.reduce(
                (sum, poll) =>
                  sum +
                  (poll.mySelections?.reduce((mealSum, row) => mealSum + row.quantity, 0) ?? 0),
                0,
              ),
            })}
          </Text>
        </View>
      ) : null}

      {!hideSubmitButton && !readOnly ? (
        <Button
          label={
            saving
              ? t('meals.poll.submitting')
              : showSummary
                ? t('meals.poll.updateChoices')
                : t('meals.poll.submit')
          }
          onPress={showSummary ? onUpdateChoices : () => void onSave()}
          disabled={saving}
          style={styles.submit}
        />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  loader: { marginVertical: spacing.lg },
  dashboardTitle: { ...typography.h3, marginBottom: spacing.xs },
  dashboardDate: { ...typography.bodyStrong, fontSize: 18, marginBottom: spacing.md },
  sheetDate: { ...typography.bodyStrong, fontSize: 16, marginBottom: spacing.xs },
  screenDate: { ...typography.h2, marginBottom: spacing.xs },
  subtitle: { ...typography.body, color: colors.muted, marginBottom: spacing.lg },
  section: { marginBottom: spacing.lg },
  sectionTitle: { ...typography.bodyStrong, fontSize: 18, marginBottom: spacing.sm },
  mainItemsHeading: {
    ...typography.bodyStrong,
    color: colors.textPrimary,
    marginBottom: spacing.sm,
  },
  optionGroupLabel: {
    ...typography.caption,
    color: colors.muted,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
    marginBottom: spacing.sm,
  },
  deliveryBelowTabs: {
    marginBottom: spacing.lg,
  },
  extrasPanel: {
    marginTop: spacing.md,
    marginBottom: spacing.sm,
    padding: spacing.md,
    borderRadius: 12,
    backgroundColor: '#EEF6F1',
    borderWidth: 1,
    borderColor: `${colors.primaryDark}44`,
    borderStyle: 'dashed',
  },
  extrasPanelHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  extrasPanelTitle: {
    ...typography.bodyStrong,
    color: colors.primaryDark,
  },
  mealSummaryStrip: {
    marginTop: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm + 2,
    borderRadius: 12,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  mealSummaryStripActive: {
    backgroundColor: colors.lightGreen,
    borderColor: `${colors.primaryDark}33`,
  },
  mealSummaryLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    flex: 1,
    minWidth: 0,
  },
  mealSummaryPlates: {
    ...typography.body,
    color: colors.muted,
    flexShrink: 1,
  },
  mealSummaryPlatesActive: {
    ...typography.bodyStrong,
    color: colors.primaryDark,
  },
  mealSummaryTotal: {
    ...typography.bodyStrong,
    color: colors.primaryDark,
    flexShrink: 0,
  },
  extrasGroupLabel: {
    marginTop: spacing.sm,
  },
  summaryChoice: { ...typography.bodyStrong, marginBottom: spacing.xxs },
  summaryMissing: { ...typography.body, color: colors.muted, marginBottom: spacing.xxs },
  deliverySummary: {
    ...typography.body,
    color: colors.muted,
    marginTop: spacing.xs,
  },
  summaryFooter: { gap: spacing.sm, marginBottom: spacing.lg },
  divider: {
    height: 1,
    backgroundColor: colors.border,
    marginBottom: spacing.sm,
  },
  totalPlatesAll: {
    ...typography.bodyStrong,
    fontSize: 18,
    color: colors.primaryDark,
  },
  submit: { marginTop: spacing.sm },
});
