import React, { useMemo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { colors, radius, shadows, spacing, typography } from '../../theme';
import { formatComboPrice } from '../../utils/comboPrice';
import { formatMenuDate } from '../../utils/mealDates';
import { mealTypeLabelKey } from '../../utils/mealLabels';
import {
  ensureDayMealSections,
  sumMealDaySections,
  type MealSelectionSummaryModel,
  type MealSummarySection,
} from '../../utils/mealSelectionSummary';

type MealSelectionSummaryProps = {
  model: MealSelectionSummaryModel;
  /** detailed = payment screens; compact = dashboard card body */
  variant?: 'detailed' | 'compact';
  showTotals?: boolean;
  title?: string;
  /** When set, each dated day header opens the same day detail used from Payments. */
  onDayPress?: (isoDate: string) => void;
};

function sectionKey(section: MealSummarySection, index: number): string {
  return `${section.date ?? 'nodate'}-${section.mealType}-${index}`;
}

export function MealSelectionSummary({
  model,
  variant = 'detailed',
  showTotals = true,
  title,
  onDayPress,
}: MealSelectionSummaryProps) {
  const { t, i18n } = useTranslation();
  const isCompact = variant === 'compact';
  const notSelected = t('dashboard.pollCard.notSelected');

  const groupedByDate = useMemo(() => {
    const hasDates = model.sections.some(section => Boolean(section.date));
    if (!hasDates) {
      return [{ date: null as string | null, sections: model.sections }];
    }
    const map = new Map<string, MealSummarySection[]>();
    for (const section of model.sections) {
      const key = section.date ?? '';
      const list = map.get(key) ?? [];
      list.push(section);
      map.set(key, list);
    }
    return [...map.entries()].map(([date, sections]) => ({
      date: date || null,
      sections: date ? ensureDayMealSections(sections, date) : sections,
    }));
  }, [model.sections]);

  return (
    <View style={styles.wrap}>
      {title ? <Text style={styles.title}>{title}</Text> : null}

      {groupedByDate.map(group => {
        const dayTotal = sumMealDaySections(group.sections);
        const dayTotalLabel = formatComboPrice(dayTotal, model.currencyCode);
        const useDayCards = !isCompact && Boolean(group.date);
        const dayPressable = Boolean(useDayCards && group.date && onDayPress);

        const dayHeader = group.date ? (
          <View style={[styles.dayHeader, useDayCards && styles.dayHeaderInCard]}>
            <Text style={styles.dateLabel} numberOfLines={1}>
              {formatMenuDate(group.date, i18n.language)}
            </Text>
            <View style={styles.dayHeaderTrailing}>
              {dayTotalLabel ? <Text style={styles.dayTotal}>{dayTotalLabel}</Text> : null}
              {dayPressable ? <Text style={styles.dayChevron}>›</Text> : null}
            </View>
          </View>
        ) : null;

        return (
          <View
            key={group.date ?? 'single'}
            style={[styles.dayBlock, useDayCards && styles.dayCard]}>
            {dayPressable && group.date ? (
              <Pressable
                onPress={() => onDayPress?.(group.date!)}
                accessibilityRole="button"
                accessibilityLabel={formatMenuDate(group.date, i18n.language)}
                style={({ pressed }) => pressed && styles.dayHeaderPressed}>
                {dayHeader}
              </Pressable>
            ) : (
              dayHeader
            )}

            <View style={useDayCards ? styles.dayBody : undefined}>
              {group.sections.map((section, index) => {
                const mealLabel = t(mealTypeLabelKey(section.mealType));
                const subtotalLabel = formatComboPrice(section.subtotal, section.currencyCode);

                if (isCompact) {
                  return (
                    <View key={sectionKey(section, index)} style={styles.compactSection}>
                      <View style={styles.compactHeader}>
                        <Text style={styles.mealLabel}>{mealLabel}</Text>
                        {section.items.length > 0 && subtotalLabel ? (
                          <Text style={styles.subtotal}>{subtotalLabel}</Text>
                        ) : null}
                      </View>
                      {section.items.length === 0 ? (
                        <Text style={styles.notSelected}>{notSelected}</Text>
                      ) : (
                        section.items.map((item, itemIndex) => {
                          const unitLabel = formatComboPrice(item.unitPrice, item.currencyCode);
                          const lineLabel = formatComboPrice(item.lineAmount, item.currencyCode);
                          const priceHint = unitLabel ?? lineLabel;
                          return (
                            <Text
                              key={`${item.label}-${itemIndex}`}
                              style={styles.compactItem}
                              numberOfLines={2}>
                              • {item.label}
                              {priceHint ? ` ${priceHint}` : ''} × {item.quantity}
                            </Text>
                          );
                        })
                      )}
                    </View>
                  );
                }

                const hasPerLineAmounts = section.items.some(
                  item => item.lineAmount != null || item.unitPrice != null,
                );
                return (
                  <View key={sectionKey(section, index)} style={styles.section}>
                    <Text style={styles.mealLabel}>{mealLabel}</Text>
                    {section.items.length === 0 ? (
                      <Text style={styles.notSelected}>{notSelected}</Text>
                    ) : (
                      <>
                        {section.items.map((item, itemIndex) => {
                          const unitLabel = formatComboPrice(item.unitPrice, item.currencyCode);
                          const lineLabel = formatComboPrice(item.lineAmount, item.currencyCode);
                          const amountLabel =
                            item.unitPrice != null && item.quantity > 1 && unitLabel
                              ? `${unitLabel} × ${item.quantity}`
                              : (lineLabel ?? unitLabel);
                          return (
                            <View key={`${item.label}-${itemIndex}`} style={styles.lineRow}>
                              <Text style={styles.lineLabel} numberOfLines={2}>
                                • {item.label} × {item.quantity}
                              </Text>
                              {amountLabel ? (
                                <Text style={styles.lineAmount}>{amountLabel}</Text>
                              ) : null}
                            </View>
                          );
                        })}
                        {!hasPerLineAmounts && subtotalLabel ? (
                          <View style={styles.lineRow}>
                            <Text style={styles.sectionSubtotalSpacer} />
                            <Text style={styles.lineAmount}>{subtotalLabel}</Text>
                          </View>
                        ) : null}
                        {section.deliveryLocationName ? (
                          <Text style={styles.deliveryLine}>
                            {t('meals.summary.deliverTo', {
                              location: section.deliveryLocationName,
                            })}
                          </Text>
                        ) : null}
                      </>
                    )}
                  </View>
                );
              })}
            </View>
          </View>
        );
      })}

      {showTotals ? (
        <View style={styles.totals}>
          {isCompact ? (
            <View style={styles.totalRow}>
              <Text style={styles.totalLabelStrong}>{t('meals.summary.total')}</Text>
              <Text style={styles.totalValueStrong}>
                {formatComboPrice(model.totalAmount, model.currencyCode) ?? `₹${model.totalAmount}`}
              </Text>
            </View>
          ) : (
            <>
              <View style={styles.totalRow}>
                <Text style={styles.totalLabel}>{t('meals.summary.totalPlates')}</Text>
                <Text style={styles.totalValue}>{model.totalPlates}</Text>
              </View>
              <View style={styles.totalRow}>
                <Text style={styles.totalLabelStrong}>{t('meals.summary.totalAmount')}</Text>
                <Text style={styles.totalValueStrong}>
                  {formatComboPrice(model.totalAmount, model.currencyCode) ??
                    `₹${model.totalAmount}`}
                </Text>
              </View>
            </>
          )}
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    gap: spacing.md,
  },
  title: {
    ...typography.bodyStrong,
    color: colors.textPrimary,
    marginBottom: spacing.xxs,
  },
  dayBlock: {
    gap: 0,
  },
  dayCard: {
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.card,
    padding: 0,
    overflow: 'hidden',
    ...shadows.sm,
  },
  dayHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
    marginBottom: spacing.xxs,
    paddingBottom: spacing.xs,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  dayHeaderInCard: {
    marginBottom: 0,
    paddingBottom: 0,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    backgroundColor: colors.lightGreen,
    borderBottomWidth: 1,
    borderBottomColor: colors.primary,
  },
  dayHeaderPressed: {
    opacity: 0.92,
  },
  dayHeaderTrailing: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  dayBody: {
    padding: spacing.md,
    gap: spacing.sm,
  },
  dateLabel: {
    ...typography.bodyStrong,
    color: colors.textPrimary,
    fontSize: 16,
    fontWeight: '700',
    flex: 1,
  },
  dayTotal: {
    ...typography.bodyStrong,
    color: colors.primaryDark,
    fontSize: 16,
    fontWeight: '700',
  },
  dayChevron: {
    fontSize: 22,
    fontWeight: '300',
    color: colors.muted,
    marginTop: -2,
  },
  section: {
    gap: spacing.xxs,
  },
  compactSection: {
    gap: 2,
    marginBottom: spacing.xs,
  },
  compactHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  mealLabel: {
    ...typography.bodyStrong,
    color: colors.textPrimary,
    fontSize: 14,
    fontWeight: '600',
  },
  notSelected: {
    ...typography.caption,
    color: colors.muted,
    fontStyle: 'italic',
  },
  lineRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  lineLabel: {
    ...typography.body,
    color: colors.textSecondary,
    flex: 1,
    fontSize: 14,
  },
  lineAmount: {
    ...typography.bodyStrong,
    color: colors.textPrimary,
    fontSize: 14,
  },
  deliveryLine: {
    ...typography.caption,
    color: colors.muted,
    marginTop: spacing.xxs,
  },
  sectionSubtotalSpacer: {
    flex: 1,
  },
  compactItem: {
    ...typography.caption,
    color: colors.textSecondary,
    lineHeight: 18,
  },
  subtotal: {
    ...typography.bodyStrong,
    color: colors.primaryDark,
    fontSize: 13,
  },
  totals: {
    marginTop: spacing.xs,
    paddingTop: spacing.sm,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
    gap: spacing.xs,
  },
  totalRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  totalLabel: {
    ...typography.body,
    color: colors.textSecondary,
  },
  totalValue: {
    ...typography.bodyStrong,
    color: colors.textPrimary,
  },
  totalLabelStrong: {
    ...typography.bodyStrong,
    color: colors.textPrimary,
  },
  totalValueStrong: {
    ...typography.bodyStrong,
    color: colors.textPrimary,
    fontSize: 16,
  },
});
