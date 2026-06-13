import React from 'react';
import { Pressable, StyleSheet, Switch, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import type { OccupancyChargeCode } from '../../api/types';
import { FormInput } from '../ui';
import { colors, radius, spacing, typography } from '../../theme';
import type { SpaceFoodPolicy } from '../../utils/fetchSpaceFoodPolicy';
import {
  MAX_OTHER_CHARGES,
  OCCUPANCY_CHARGE_CODES,
  computeMonthlyRentFoodTotal,
  formatContractAmount,
  type ContractTermsFormValues,
} from '../../utils/occupancyContract';

type ContractTermsFormProps = {
  values: ContractTermsFormValues;
  onChange: (values: ContractTermsFormValues) => void;
  showRentDeposit?: boolean;
  rentRequired?: boolean;
  readOnlyRent?: number | null;
  readOnlyDeposit?: number | null;
  catalogRentHint?: number | null;
  catalogDepositHint?: number | null;
  foodPolicy?: SpaceFoodPolicy;
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
  rentRequired = true,
  readOnlyRent,
  readOnlyDeposit,
  catalogRentHint,
  catalogDepositHint,
  foodPolicy,
}: ContractTermsFormProps) {
  const { t } = useTranslation();
  const foodIncludedInRent = foodPolicy?.foodIncludedInRent ?? false;
  const monthlyTotal = computeMonthlyRentFoodTotal(values, foodPolicy);

  function updateCharge(index: number, patch: Partial<ContractTermsFormValues['otherCharges'][0]>) {
    const next = values.otherCharges.map((charge, i) =>
      i === index ? { ...charge, ...patch } : charge,
    );
    onChange({ ...values, otherCharges: next });
  }

  function addCharge() {
    if (values.otherCharges.length >= MAX_OTHER_CHARGES) {
      return;
    }
    onChange({
      ...values,
      otherCharges: [
        ...values.otherCharges,
        { code: 'OTHER', label: '', amount: 0 },
      ],
    });
  }

  function removeCharge(index: number) {
    onChange({
      ...values,
      otherCharges: values.otherCharges.filter((_, i) => i !== index),
    });
  }

  return (
    <View style={styles.wrap}>
      <Text style={styles.sectionTitle}>{t('occupancy.contract.title')}</Text>
      <Text style={styles.sectionHint}>{t('occupancy.contract.hint')}</Text>

      {showRentDeposit ? (
        <View style={styles.rentFoodGroup}>
          {readOnlyRent != null ? (
            <View style={styles.readonlyField}>
              <Text style={styles.readonlyLabel}>{t('occupancy.contract.rent')}</Text>
              <Text style={styles.readonlyValue}>
                {t('occupancy.contract.keepCurrent', {
                  amount: readOnlyRent.toLocaleString('en-IN'),
                })}
              </Text>
            </View>
          ) : (
            <FormInput
              label={
                rentRequired
                  ? t('occupancy.contract.rentRequired')
                  : t('occupancy.contract.rent')
              }
              value={values.rentSnapshot}
              onChangeText={rentSnapshot => onChange({ ...values, rentSnapshot })}
              placeholder={t('occupancy.contract.amountPlaceholder')}
              keyboardType="numeric"
              hint={
                catalogRentHint != null
                  ? t('occupancy.contract.catalogRentHint', {
                      amount: catalogRentHint.toLocaleString('en-IN'),
                    })
                  : undefined
              }
            />
          )}

          {foodIncludedInRent ? (
            <View style={styles.bundledFoodBanner}>
              <Text style={styles.bundledFoodTitle}>
                {t('occupancy.contract.foodBundledTitle')}
              </Text>
              <Text style={styles.bundledFoodHint}>
                {t('occupancy.contract.foodBundledHint')}
              </Text>
            </View>
          ) : (
            <>
              <View style={styles.switchRow}>
                <View style={styles.switchCopy}>
                  <Text style={styles.switchLabel}>{t('occupancy.contract.foodEnabled')}</Text>
                  <Text style={styles.switchHint}>
                    {t('occupancy.contract.foodEnabledHint')}
                  </Text>
                </View>
                <Switch
                  value={values.foodEnabled}
                  onValueChange={foodEnabled =>
                    onChange({
                      ...values,
                      foodEnabled,
                      foodChargeSnapshot: foodEnabled ? values.foodChargeSnapshot : '',
                    })
                  }
                  trackColor={{ false: colors.border, true: colors.primary }}
                />
              </View>

              {values.foodEnabled ? (
                <FormInput
                  label={t('occupancy.contract.foodCharge')}
                  value={values.foodChargeSnapshot}
                  onChangeText={foodChargeSnapshot =>
                    onChange({ ...values, foodChargeSnapshot })
                  }
                  placeholder={t('occupancy.contract.amountPlaceholder')}
                  keyboardType="numeric"
                  hint={
                    foodPolicy?.defaultFoodCharge != null
                      ? t('occupancy.contract.foodChargeDefaultHint', {
                          amount: foodPolicy.defaultFoodCharge.toLocaleString('en-IN'),
                        })
                      : t('occupancy.contract.foodChargeHint')
                  }
                />
              ) : null}
            </>
          )}

          {monthlyTotal != null ? (
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>{t('occupancy.contract.monthlyTotal')}</Text>
              <Text style={styles.totalValue}>
                {formatContractAmount(monthlyTotal, t('occupancy.contract.notRecorded'))}
              </Text>
            </View>
          ) : null}
        </View>
      ) : null}

      {showRentDeposit ? (
        <>
          {readOnlyDeposit != null ? (
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
              hint={
                catalogDepositHint != null
                  ? t('occupancy.contract.catalogDepositHint', {
                      amount: catalogDepositHint.toLocaleString('en-IN'),
                    })
                  : t('occupancy.contract.depositDefaultHint')
              }
            />
          )}
        </>
      ) : null}

      <View style={styles.chargesHeader}>
        <Text style={styles.chargesTitle}>{t('occupancy.contract.otherCharges')}</Text>
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
            <Text style={styles.chargeIndex}>
              {t('occupancy.contract.chargeLine', { index: index + 1 })}
            </Text>
            <Pressable onPress={() => removeCharge(index)} hitSlop={8}>
              <Text style={styles.removeCharge}>{t('occupancy.contract.removeCharge')}</Text>
            </Pressable>
          </View>
          <ChargeCodePicker
            value={charge.code}
            onChange={code => updateCharge(index, { code })}
          />
          <FormInput
            label={t('occupancy.contract.chargeLabel')}
            value={charge.label}
            onChangeText={label => updateCharge(index, { label })}
            placeholder={t('occupancy.contract.chargeLabelPlaceholder')}
          />
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
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    gap: spacing.xs,
  },
  sectionTitle: {
    ...typography.bodyStrong,
    marginBottom: spacing.xs,
  },
  sectionHint: {
    ...typography.caption,
    color: colors.muted,
    marginBottom: spacing.md,
  },
  rentFoodGroup: {
    gap: spacing.xs,
    marginBottom: spacing.sm,
  },
  bundledFoodBanner: {
    borderWidth: 1,
    borderColor: `${colors.primary}33`,
    backgroundColor: `${colors.primary}0D`,
    borderRadius: radius.input,
    padding: spacing.md,
    marginBottom: spacing.sm,
  },
  bundledFoodTitle: {
    ...typography.bodyStrong,
    color: colors.primaryDark,
  },
  bundledFoodHint: {
    ...typography.caption,
    color: colors.muted,
    marginTop: spacing.xs,
  },
  totalRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: radius.input,
    backgroundColor: colors.surface,
    marginTop: spacing.xs,
    marginBottom: spacing.sm,
  },
  totalLabel: {
    ...typography.bodyStrong,
  },
  totalValue: {
    ...typography.h3,
    color: colors.primaryDark,
  },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
    gap: spacing.md,
  },
  switchCopy: {
    flex: 1,
  },
  switchLabel: {
    ...typography.bodyStrong,
  },
  switchHint: {
    ...typography.caption,
    color: colors.muted,
    marginTop: spacing.xs,
  },
  readonlyField: {
    marginBottom: spacing.md,
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
    marginTop: spacing.sm,
    marginBottom: spacing.sm,
  },
  chargesTitle: {
    ...typography.bodyStrong,
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
    padding: spacing.md,
    marginBottom: spacing.md,
    gap: spacing.xs,
  },
  chargeCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  chargeIndex: {
    ...typography.caption,
    color: colors.muted,
    fontWeight: '600',
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
    marginBottom: spacing.sm,
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
