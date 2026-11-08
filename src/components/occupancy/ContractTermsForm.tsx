import React from 'react';
import { Pressable, StyleSheet, Switch, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { CalendarRange, IndianRupee, UtensilsCrossed } from 'lucide-react-native';
import type { OccupancyChargeCode } from '../../api/types';
import { FormInput } from '../ui';
import { colors, radius, spacing, typography } from '../../theme';
import type { SpaceFoodPolicy } from '../../utils/fetchSpaceFoodPolicy';
import {
  MAX_OTHER_CHARGES,
  OCCUPANCY_CHARGE_CODES,
  computeMonthlyRentFoodTotal,
  formatContractAmount,
  monthlyTotalIncludesFoodFromForm,
  monthlyTotalLabelKey,
  parseContractAmount,
  type ContractTermsFormValues,
} from '../../utils/occupancyContract';
import { resolveBookingAdvanceSplit } from '../../utils/bookingAdvance';
import type { StayChoice } from '../../utils/shortStay';

type ContractTermsFormProps = {
  values: ContractTermsFormValues;
  onChange: (values: ContractTermsFormValues) => void;
  showRentDeposit?: boolean;
  /** Rental spaces hide meal participation; food toggle follows the same rule. */
  showFoodToggle?: boolean;
  /**
   * @deprecated Prefer `stayKind`. When true without stayKind, hides monthly rent
   * (legacy Short Stay split layout).
   */
  hideMonthlyRent?: boolean;
  /** Until I Leave / Daily: rent_snapshot is owner-entered ₹/day (not monthly catalog). */
  dailyRentMode?: boolean;
  /** Selected stay type — drives labels, hints and field layout. */
  stayKind?: StayChoice;
  /** Nights for Daily (SHORT) stay-rent calculation. */
  shortStayNights?: number | null;
  rentRequired?: boolean;
  rentError?: string | null;
  readOnlyRent?: number | null;
  readOnlyDeposit?: number | null;
  catalogRentHint?: number | null;
  catalogDepositHint?: number | null;
  foodPolicy?: SpaceFoodPolicy;
  /** Wrap additional charges for progressive scroll targeting. */
  onAddonsLayout?: (y: number, height: number) => void;
  addonsHighlighted?: boolean;
  /** Rendered after additional charges (e.g. amenities). */
  addonsFooter?: React.ReactNode;
  /** When false, Pricing Details heading is omitted (parent already titled the step). */
  showPricingHeading?: boolean;
  /**
   * Reservation-only: optional booking advance (portion of first-period rent).
   * Hidden for allocate / move-in. Shown for all stay kinds when reserving.
   */
  showBookingAdvance?: boolean;
};

function ChargeCodePicker({
  value,
  onChange,
}: {
  value: OccupancyChargeCode;
  onChange: (code: OccupancyChargeCode) => void;
}) {
  const { t } = useTranslation();

  return (
    <View style={styles.chargeCodeRow}>
      {OCCUPANCY_CHARGE_CODES.map(code => (
        <Pressable
          key={code}
          style={[styles.chargeCodeChip, value === code && styles.chargeCodeChipSelected]}
          onPress={() => onChange(code)}>
          <Text
            style={[
              styles.chargeCodeText,
              value === code && styles.chargeCodeTextSelected,
            ]}>
            {t(`occupancy.contract.chargeCode.${code}`)}
          </Text>
        </Pressable>
      ))}
    </View>
  );
}

export function ContractTermsForm({
  values,
  onChange,
  showRentDeposit = true,
  showFoodToggle = true,
  hideMonthlyRent = false,
  dailyRentMode = false,
  stayKind,
  shortStayNights = null,
  rentRequired = true,
  rentError,
  readOnlyRent,
  readOnlyDeposit,
  catalogRentHint,
  catalogDepositHint,
  foodPolicy,
  onAddonsLayout,
  addonsHighlighted = false,
  addonsFooter,
  showPricingHeading = true,
  showBookingAdvance = false,
}: ContractTermsFormProps) {
  const { t } = useTranslation();
  const isShort = stayKind === 'SHORT' || (hideMonthlyRent && !dailyRentMode);
  const isOpenEnded = stayKind === 'OPEN_ENDED' || dailyRentMode;
  const isDailyRate = isShort || isOpenEnded;
  const showRentField = !hideMonthlyRent || isShort || isOpenEnded;
  const bookingAdvanceEnabled = showBookingAdvance;

  const monthlyTotal =
    isDailyRate ? null : computeMonthlyRentFoodTotal(values, foodPolicy);
  const monthlyTotalLabel = monthlyTotalLabelKey(
    monthlyTotalIncludesFoodFromForm(values, foodPolicy),
  );

  const dailyAmount = parseContractAmount(values.rentSnapshot);
  const depositAmount = parseContractAmount(values.depositSnapshot) ?? 0;
  const stayRent =
    isShort && dailyAmount != null && shortStayNights != null && shortStayNights > 0
      ? dailyAmount * shortStayNights
      : null;
  const totalPayableAtMoveIn =
    stayRent != null ? stayRent + Math.max(0, depositAmount) : null;

  const rentLabel = isShort
    ? t('occupancy.contract.dailyRentPerNight', {
        defaultValue: 'Daily rent (per night)',
      })
    : isOpenEnded
      ? rentRequired
        ? t('occupancy.contract.dailyRentRequired', { defaultValue: 'Daily rent (required)' })
        : t('occupancy.contract.dailyRent', { defaultValue: 'Daily rent' })
      : rentRequired
        ? t('occupancy.contract.rentRequired')
        : t('occupancy.contract.rent');

  const rentHint = isShort
    ? t('occupancy.contract.dailyRentPerNightHint', {
        defaultValue: 'Amount charged for each night of the stay.',
      })
    : isOpenEnded
      ? t('occupancy.contract.dailyRentHint', {
          defaultValue: 'Owner-entered ₹/day. Not derived from monthly catalog rent.',
        })
      : catalogRentHint != null
        ? t('occupancy.contract.catalogRentHint', {
            amount: catalogRentHint.toLocaleString('en-IN'),
          })
        : undefined;

  const pricingHint = isShort
    ? t('occupancy.contract.hintDaily', {
        defaultValue: 'Daily rent and deposit for this stay. Not monthly billing.',
      })
    : isOpenEnded
      ? t('occupancy.contract.hintOpenEnded', {
          defaultValue:
            'Daily rent accumulates into one rent charge per calendar month until vacate.',
        })
      : t('occupancy.contract.hintMonthly', {
          defaultValue: 'Agreed monthly rent and charges at activation. Not billing or payments.',
        });

  const foodBundledHint = isShort
    ? t('occupancy.contract.foodBundledHintShortStay', {
        defaultValue: 'Food is included in the stay rent. There is no separate food line.',
      })
    : isOpenEnded
      ? t('occupancy.contract.foodBundledHintDaily', {
          defaultValue:
            'Food is included in the daily rent amount above. There is no separate food line.',
        })
      : t('occupancy.contract.foodBundledHint');

  function updateCharge(index: number, patch: Partial<ContractTermsFormValues['otherCharges'][0]>) {
    const next = values.otherCharges.map((charge, i) => {
      if (i !== index) {
        return charge;
      }
      const merged = { ...charge, ...patch };
      if (patch.code && patch.code !== 'OTHER') {
        merged.label = t(`occupancy.contract.chargeCode.${patch.code}`);
      }
      return merged;
    });
    onChange({ ...values, otherCharges: next });
  }

  function addCharge() {
    if (values.otherCharges.length >= MAX_OTHER_CHARGES) {
      return;
    }
    onChange({
      ...values,
      otherCharges: [...values.otherCharges, { code: 'OTHER', label: '', amount: 0 }],
    });
  }

  function removeCharge(index: number) {
    onChange({
      ...values,
      otherCharges: values.otherCharges.filter((_, i) => i !== index),
    });
  }

  const rentField =
    !showRentDeposit || !showRentField ? null : readOnlyRent != null ? (
      <View style={styles.readonlyField}>
        <Text style={styles.readonlyLabel}>{rentLabel}</Text>
        <Text style={styles.readonlyValue}>
          {t('occupancy.contract.keepCurrent', {
            amount: readOnlyRent.toLocaleString('en-IN'),
          })}
        </Text>
      </View>
    ) : (
      <FormInput
        label={rentLabel}
        value={values.rentSnapshot}
        onChangeText={rentSnapshot => onChange({ ...values, rentSnapshot })}
        placeholder={
          isDailyRate
            ? t('occupancy.contract.dailyRentPlaceholder', {
                defaultValue: 'Enter rent per night, e.g. 500',
              })
            : t('occupancy.contract.amountPlaceholder')
        }
        keyboardType="numeric"
        error={rentError}
      />
    );

  const depositField = !showRentDeposit ? null : readOnlyDeposit != null ? (
    <View style={styles.readonlyField}>
      <Text style={styles.readonlyLabel}>{t('occupancy.contract.deposit')}</Text>
      <Text style={styles.readonlyValue}>
        {t('occupancy.contract.keepCurrent', {
          amount: readOnlyDeposit.toLocaleString('en-IN'),
        })}
      </Text>
    </View>
  ) : (
    <FormInput
      label={t('occupancy.contract.depositOptional')}
      value={values.depositSnapshot}
      onChangeText={depositSnapshot => onChange({ ...values, depositSnapshot })}
      placeholder="0"
      keyboardType="numeric"
    />
  );

  const firstPeriodRentForAdvance = isShort
    ? stayRent
    : parseContractAmount(values.rentSnapshot);
  const advanceSplit = bookingAdvanceEnabled
    ? resolveBookingAdvanceSplit({
        firstPeriodRent: firstPeriodRentForAdvance,
        bookingAdvanceText: values.bookingAdvanceAmount,
      })
    : { split: null, errorKey: null };

  const bookingAdvanceField = !bookingAdvanceEnabled ? null : (
    <View style={styles.advanceBlock}>
      <FormInput
        label={t('occupancy.bookingAdvance.label', { defaultValue: 'Booking advance (optional)' })}
        value={values.bookingAdvanceAmount}
        onChangeText={bookingAdvanceAmount => onChange({ ...values, bookingAdvanceAmount })}
        placeholder="0"
        keyboardType="numeric"
        error={
          advanceSplit.errorKey
            ? t(advanceSplit.errorKey, {
                defaultValue:
                  advanceSplit.errorKey === 'occupancy.bookingAdvance.errors.exceedsRent'
                    ? 'Booking advance cannot exceed the first-period rent.'
                    : advanceSplit.errorKey === 'occupancy.bookingAdvance.errors.rentRequired'
                      ? 'Enter the first-period rent before recording a booking advance.'
                      : 'Booking advance cannot be negative.',
              })
            : null
        }
      />
      <Text style={styles.advanceHint}>
        {t('occupancy.bookingAdvance.hint', {
          defaultValue:
            'Part of the first-period rent, not an extra charge. Leave 0 to keep existing reservation behaviour.',
        })}
      </Text>
      {advanceSplit.split ? (
        <View style={styles.advanceSummary}>
          <Text style={styles.advanceSummaryLine}>
            {t('occupancy.bookingAdvance.remaining', {
              defaultValue: 'Remaining rent: ₹{{amount}}',
              amount: advanceSplit.split.remainingRent.toLocaleString('en-IN'),
            })}
          </Text>
          <View style={styles.advanceCollectedRow}>
            <Text style={styles.advanceCollectedLabel}>
              {t('occupancy.bookingAdvance.collected', {
                defaultValue: 'Advance already collected',
              })}
            </Text>
            <Switch
              value={values.bookingAdvanceCollected}
              onValueChange={bookingAdvanceCollected =>
                onChange({ ...values, bookingAdvanceCollected })
              }
              trackColor={{ false: colors.border, true: colors.primary }}
            />
          </View>
        </View>
      ) : null}
    </View>
  );

  const catalogRefs: string[] = [];
  if (!isDailyRate && catalogRentHint != null) {
    catalogRefs.push(
      t('occupancy.contract.catalogRentHint', {
        amount: catalogRentHint.toLocaleString('en-IN'),
      }),
    );
  }
  if (catalogDepositHint != null) {
    catalogRefs.push(
      t('occupancy.contract.catalogDepositHint', {
        amount: catalogDepositHint.toLocaleString('en-IN'),
      }),
    );
  } else if (showRentDeposit && readOnlyDeposit == null) {
    catalogRefs.push(t('occupancy.contract.depositDefaultHint'));
  }
  // Daily / open-ended rate helpers belong after both inputs (not between them).
  if (isDailyRate && rentHint) {
    catalogRefs.push(rentHint);
  }

  const chargesBlock = (
    <>
      <View style={styles.chargesHeader}>
        <Text style={styles.sectionHeading}>{t('occupancy.contract.otherCharges')}</Text>
        <Pressable
          onPress={addCharge}
          disabled={values.otherCharges.length >= MAX_OTHER_CHARGES}
          hitSlop={8}>
          <Text
            style={[
              styles.addChargeText,
              values.otherCharges.length >= MAX_OTHER_CHARGES && styles.addChargeDisabled,
            ]}>
            + {t('occupancy.contract.addCharge')}
          </Text>
        </Pressable>
      </View>

      {values.otherCharges.map((charge, index) => (
        <View key={`charge-${index}`} style={styles.chargeCard}>
          <View style={styles.chargeCardHeader}>
            <Text style={styles.chargeTitle}>
              {charge.code === 'OTHER'
                ? t('occupancy.contract.chargeCode.OTHER')
                : t(`occupancy.contract.chargeCode.${charge.code}`)}
            </Text>
            <Pressable onPress={() => removeCharge(index)} hitSlop={8}>
              <Text style={styles.removeCharge}>{t('occupancy.contract.removeCharge')}</Text>
            </Pressable>
          </View>
          <ChargeCodePicker value={charge.code} onChange={code => updateCharge(index, { code })} />
          {charge.code === 'OTHER' ? (
            <FormInput
              label={t('occupancy.contract.chargeLabel')}
              value={charge.label}
              onChangeText={label => updateCharge(index, { label })}
              placeholder={t('occupancy.contract.chargeLabelPlaceholder')}
            />
          ) : null}
          <FormInput
            label={t('occupancy.contract.chargeAmount')}
            value={String(charge.amount)}
            onChangeText={text => {
              const parsed = Number(text);
              updateCharge(index, {
                amount: Number.isFinite(parsed) && parsed >= 0 ? parsed : 0,
              });
            }}
            keyboardType="numeric"
            placeholder="0"
          />
        </View>
      ))}
    </>
  );

  return (
    <View style={styles.wrap}>
      {isShort && shortStayNights != null && shortStayNights > 0 ? (
        <View style={styles.stayBanner}>
          <CalendarRange size={16} color="#6D28D9" strokeWidth={2.2} />
          <Text style={styles.stayBannerText}>
            {t('occupancy.section.shortStayContractBanner', {
              count: shortStayNights,
              defaultValue: 'Daily · {{count}} nights',
            })}
          </Text>
        </View>
      ) : null}

      {showRentDeposit ? (
        <View style={styles.card}>
          {showPricingHeading ? (
            <View style={styles.cardHeader}>
              <View style={styles.cardIcon}>
                <IndianRupee size={16} color={colors.primaryDark} strokeWidth={2.2} />
              </View>
              <View style={styles.cardHeaderText}>
                <Text style={styles.sectionHeading}>
                  {t('occupancy.contract.pricingDetails', { defaultValue: 'Pricing Details' })}
                </Text>
                <Text style={styles.sectionHint}>{pricingHint}</Text>
              </View>
            </View>
          ) : (
            <Text style={styles.sectionHintCompact}>{pricingHint}</Text>
          )}

          {rentField}
          {depositField}
          {bookingAdvanceField}

          {catalogRefs.length > 0 ? (
            <View style={styles.catalogRefs}>
              {catalogRefs.map(line => (
                <Text key={line} style={styles.catalogRefText}>
                  {line}
                </Text>
              ))}
            </View>
          ) : null}

          {stayRent != null && shortStayNights != null ? (
            <View style={styles.calcRow}>
              <View style={styles.calcCopy}>
                <Text style={styles.calcLabel}>
                  {t('occupancy.contract.stayRent', { defaultValue: 'Total stay rent' })}
                </Text>
                <Text style={styles.calcMeta}>
                  {t('occupancy.contract.stayRentCalc', {
                    daily: formatContractAmount(dailyAmount ?? 0),
                    count: shortStayNights,
                    defaultValue: '{{daily}} × {{count}} nights',
                  })}
                </Text>
              </View>
              <Text style={styles.calcValue}>{formatContractAmount(stayRent)}</Text>
            </View>
          ) : null}

          {totalPayableAtMoveIn != null && stayRent != null ? (
            <View style={[styles.calcRow, styles.calcRowEmphasis]}>
              <View style={styles.calcCopy}>
                <Text style={styles.calcLabel}>
                  {t('occupancy.contract.totalPayableAtMoveIn', {
                    defaultValue: 'Total payable at move-in',
                  })}
                </Text>
                <Text style={styles.calcMeta}>
                  {t('occupancy.contract.totalPayableBreakdown', {
                    defaultValue: 'Stay rent + Deposit',
                  })}
                  {' · '}
                  {t('occupancy.contract.totalPayableCalc', {
                    stayRent: formatContractAmount(stayRent),
                    deposit: formatContractAmount(depositAmount),
                    defaultValue: '{{stayRent}} + {{deposit}}',
                  })}
                </Text>
              </View>
              <Text style={styles.calcValue}>{formatContractAmount(totalPayableAtMoveIn)}</Text>
            </View>
          ) : null}

          {!isDailyRate && monthlyTotal != null ? (
            <View style={styles.calcRow}>
              <Text style={styles.calcLabel}>{t(monthlyTotalLabel)}</Text>
              <Text style={styles.calcValue}>
                {formatContractAmount(monthlyTotal, t('occupancy.contract.notRecorded'))}
              </Text>
            </View>
          ) : null}
        </View>
      ) : null}

      {showRentDeposit && showFoodToggle ? (
        <View style={styles.card}>
          <View style={styles.switchRow}>
            <View style={styles.cardIcon}>
              <UtensilsCrossed size={16} color={colors.primaryDark} strokeWidth={2.2} />
            </View>
            <View style={styles.switchCopy}>
              <Text style={styles.switchLabel}>{t('occupancy.contract.foodEnabled')}</Text>
              <Text style={styles.switchHint}>
                {values.foodEnabled ? foodBundledHint : t('occupancy.contract.foodEnabledHint')}
              </Text>
            </View>
            <Switch
              value={values.foodEnabled}
              onValueChange={foodEnabled =>
                onChange({
                  ...values,
                  foodEnabled,
                  foodChargeSnapshot: '',
                })
              }
              trackColor={{ false: colors.border, true: colors.primary }}
            />
          </View>
        </View>
      ) : null}

      {showRentDeposit ? (
        <View
          collapsable={false}
          style={[styles.card, addonsHighlighted && styles.addonsHighlight]}
          onLayout={event => {
            const { y, height } = event.nativeEvent.layout;
            onAddonsLayout?.(y, height);
          }}>
          {chargesBlock}
          {addonsFooter}
        </View>
      ) : (
        <View style={styles.card}>{chargesBlock}</View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    gap: spacing.sm,
  },
  stayBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.card,
    backgroundColor: '#F3E8FF',
    borderWidth: 1,
    borderColor: '#E9D5FF',
  },
  stayBannerText: {
    ...typography.caption,
    flex: 1,
    fontWeight: '700',
    color: '#6D28D9',
  },
  card: {
    gap: spacing.sm,
    padding: spacing.md,
    borderRadius: radius.card,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.white,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
    marginBottom: spacing.xs,
  },
  cardHeaderText: {
    flex: 1,
    minWidth: 0,
    gap: 2,
  },
  cardIcon: {
    width: 32,
    height: 32,
    borderRadius: radius.sm,
    backgroundColor: colors.successTint,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  sectionHeading: {
    ...typography.bodyStrong,
    fontSize: 15,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  sectionHint: {
    ...typography.caption,
    color: colors.muted,
    lineHeight: 16,
  },
  sectionHintCompact: {
    ...typography.caption,
    color: colors.muted,
    lineHeight: 16,
    marginBottom: spacing.xs,
  },
  catalogRefs: {
    gap: 2,
    marginTop: -spacing.xs,
  },
  catalogRefText: {
    ...typography.caption,
    color: colors.muted,
    lineHeight: 16,
  },
  advanceBlock: {
    gap: spacing.xs,
  },
  advanceHint: {
    ...typography.caption,
    color: colors.muted,
    lineHeight: 16,
    marginTop: -spacing.xs,
  },
  advanceSummary: {
    gap: spacing.sm,
    padding: spacing.sm,
    borderRadius: radius.input,
    backgroundColor: colors.successTint,
    borderWidth: 1,
    borderColor: `${colors.primary}22`,
  },
  advanceSummaryLine: {
    ...typography.bodyStrong,
    fontSize: 14,
    color: colors.primaryDark,
  },
  advanceCollectedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  advanceCollectedLabel: {
    ...typography.caption,
    color: colors.textSecondary,
    flex: 1,
  },
  calcRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.md,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: radius.input,
    backgroundColor: colors.successTint,
    borderWidth: 1,
    borderColor: `${colors.primary}22`,
  },
  calcRowEmphasis: {
    backgroundColor: `${colors.primary}12`,
    borderColor: `${colors.primary}33`,
  },
  calcCopy: { flex: 1, minWidth: 0, gap: 2 },
  calcLabel: { ...typography.bodyStrong, fontSize: 14 },
  calcMeta: { ...typography.caption, color: colors.textSecondary },
  calcValue: { ...typography.bodyStrong, color: colors.primaryDark, fontSize: 16 },
  addonsHighlight: {
    borderColor: '#F59E0B',
    backgroundColor: colors.warningTint,
  },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  switchCopy: {
    flex: 1,
    minWidth: 0,
  },
  switchLabel: {
    ...typography.bodyStrong,
    fontSize: 14,
  },
  switchHint: {
    ...typography.caption,
    color: colors.muted,
    marginTop: 2,
    lineHeight: 16,
  },
  readonlyField: {
    marginBottom: spacing.xs,
  },
  readonlyLabel: {
    ...typography.caption,
    color: colors.muted,
    marginBottom: spacing.xs,
  },
  readonlyValue: {
    ...typography.body,
    color: colors.textSecondary,
  },
  chargesHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.xs,
  },
  addChargeText: {
    ...typography.caption,
    color: colors.primary,
    fontWeight: '600',
  },
  addChargeDisabled: {
    color: colors.muted,
  },
  chargeCard: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.input,
    padding: spacing.sm,
    marginBottom: spacing.sm,
    gap: spacing.xs,
  },
  chargeCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  chargeTitle: {
    ...typography.bodyStrong,
    fontSize: 13,
  },
  removeCharge: {
    ...typography.caption,
    color: '#DC2626',
    fontWeight: '600',
  },
  chargeCodeRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
    marginBottom: spacing.xs,
  },
  chargeCodeChip: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.full,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
  },
  chargeCodeChipSelected: {
    borderColor: colors.primary,
    backgroundColor: `${colors.primary}14`,
  },
  chargeCodeText: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  chargeCodeTextSelected: {
    color: colors.primaryDark,
    fontWeight: '600',
  },
});
