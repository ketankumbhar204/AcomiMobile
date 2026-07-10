import React from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import type { MealDeliveryLocation, MealPollSlot, MealType, UUID } from '../../api/types';
import { Button } from '../ui';
import { colors, spacing, typography } from '../../theme';
import { formatComboNameWithPrice } from '../../utils/comboPrice';
import { formatMenuDate } from '../../utils/mealDates';
import { MEAL_TYPES, mealTypeLabelKey } from '../../utils/mealLabels';
import { MealDeliveryLocationCompact } from './MealDeliveryLocationCompact';
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

  const showDeliveryForMeal = multiQuantity && deliveryLocations.length > 0 && !showSummary;

  if (loading) {
    return <ActivityIndicator color={colors.primary} style={styles.loader} />;
  }

  if (openPolls.length === 0) {
    return null;
  }

  const title = isDashboard ? t('dashboard.tomorrowMeals') : null;
  const dateLabel = dateLabelProp ?? formatMenuDate(menuDate, i18n.language);
  const sortedPolls = [...openPolls].sort(
    (a, b) => MEAL_TYPES.indexOf(a.mealType) - MEAL_TYPES.indexOf(b.mealType),
  );

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
              return (
                <View key={poll.id} style={styles.section}>
                  <Text style={styles.sectionTitle}>{t(mealTypeLabelKey(poll.mealType))}</Text>
                  {activeSelections.length > 0 ? (
                    activeSelections.map(selection => {
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
                    })
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
        : sortedPolls.map(poll => {
            const mealPlates = totalPlatesForMeal?.(poll.mealType) ?? 0;
            return (
              <View key={poll.id} style={styles.section}>
                <Text style={styles.sectionTitle}>{t(mealTypeLabelKey(poll.mealType))}</Text>
                {multiQuantity
                  ? poll.options
                      .filter(option => option.optionType === 'MENU_ENTRY')
                      .map(option => (
                        <MealPollQuantityRow
                          key={option.id}
                          option={option}
                          quantity={quantitySelections[poll.mealType]?.[option.id] ?? 0}
                          onChange={qty => onQuantityChange?.(poll.mealType, option.id, qty)}
                          readOnly={readOnly}
                          showPrice={showMealPrices}
                        />
                      ))
                  : poll.options.map(option => (
                      <MealPollOptionRadio
                        key={option.id}
                        option={option}
                        selected={selections[poll.mealType] === option.id}
                        onSelect={() => onSelect(poll.mealType, option.id)}
                        readOnly={readOnly}
                        showPrice={showMealPrices}
                      />
                    ))}
                {showDeliveryForMeal && mealPlates > 0 ? (
                  <MealDeliveryLocationCompact
                    locations={deliveryLocations}
                    selectedId={deliverySelections[poll.mealType]}
                    lastUsedLocationId={lastDeliveryLocations[poll.mealType]}
                    onSelect={locationId => onDeliveryLocationChange?.(poll.mealType, locationId)}
                    readOnly={readOnly}
                  />
                ) : null}
              </View>
            );
          })}

      {showSummary && multiQuantity ? (
        <View style={styles.summaryFooter}>
          <View style={styles.divider} />
          <Text style={styles.totalPlatesAll}>
            {t('meals.poll.totalPlatesAll', {
              count: openPolls.reduce(
                (sum, poll) =>
                  sum + (poll.mySelections?.reduce((mealSum, row) => mealSum + row.quantity, 0) ?? 0),
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
