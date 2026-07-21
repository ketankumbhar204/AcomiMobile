import React, { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import type { MealDeliveryLocation, MealPollSlot, MealType, UUID } from '../../api/types';
import { Button } from '../ui';
import { colors, spacing, typography } from '../../theme';
import { formatComboNameWithPrice } from '../../utils/comboPrice';
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
            {showExtrasSection ? (
              <Text style={styles.optionGroupLabel}>{t('meals.poll.menuSection')}</Text>
            ) : null}
            {renderQuantityRows(mainOptions)}
            {showExtrasSection ? (
              <View style={styles.extrasPanel}>
                <View style={styles.extrasPanelHeader}>
                  <View style={styles.extrasPanelAccent} />
                  <View style={styles.extrasPanelHeaderText}>
                    <Text style={styles.extrasPanelTitle}>{t('meals.poll.extrasSection')}</Text>
                    <Text style={styles.extrasPanelHint}>{t('meals.poll.extrasSectionHint')}</Text>
                  </View>
                </View>
                {renderQuantityRows(extraOptions, 'extra')}
              </View>
            ) : null}
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

      {!showSummary && multiQuantity && totalPlates > 0 ? (
        <View style={styles.footerTotals}>
          <View style={styles.divider} />
          <Text style={styles.totalPlatesAll}>
            {t('meals.poll.totalPlatesAll', { count: totalPlates })}
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
  optionGroupLabel: {
    ...typography.caption,
    color: colors.muted,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
    marginBottom: spacing.sm,
  },
  deliveryBelowTabs: {
    marginBottom: spacing.md,
  },
  extrasPanel: {
    marginTop: spacing.md,
    padding: spacing.md,
    borderRadius: 12,
    backgroundColor: '#EEF6F1',
    borderWidth: 1,
    borderColor: colors.primaryDark,
  },
  extrasPanelHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  extrasPanelAccent: {
    width: 3,
    alignSelf: 'stretch',
    minHeight: 28,
    borderRadius: 2,
    backgroundColor: colors.primaryDark,
  },
  extrasPanelHeaderText: {
    flex: 1,
    minWidth: 0,
    gap: 2,
  },
  extrasPanelTitle: {
    ...typography.bodyStrong,
    color: colors.primaryDark,
  },
  extrasPanelHint: {
    ...typography.caption,
    color: colors.muted,
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
  footerTotals: {
    marginBottom: spacing.md,
  },
  submit: { marginTop: spacing.sm },
});
