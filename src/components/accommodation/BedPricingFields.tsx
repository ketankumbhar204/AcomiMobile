import React, { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { FormInput } from '../ui';
import { parseOptionalMoney } from './setup-preview/setupPricingAutofill';
import { spacing } from '../../theme';

export type BedPricingField = 'defaultRent' | 'defaultDeposit';

type BedPricingFieldsProps = {
  rent?: number | null;
  deposit?: number | null;
  editable?: boolean;
  /** Side-by-side (wide cards) or stacked (compact mock bed tiles). */
  layout?: 'row' | 'stack';
  onCommit?: (field: BedPricingField, value: number | null) => Promise<void> | void;
};

function moneyText(value: number | null | undefined): string {
  return value == null ? '' : String(value);
}

export function BedPricingFields({
  rent,
  deposit,
  editable = false,
  layout = 'row',
  onCommit,
}: BedPricingFieldsProps) {
  const { t } = useTranslation();
  const [rentEdit, setRentEdit] = useState<string | null>(null);
  const [depositEdit, setDepositEdit] = useState<string | null>(null);
  const rentText = rentEdit ?? moneyText(rent);
  const depositText = depositEdit ?? moneyText(deposit);
  const stacked = layout === 'stack';

  async function commit(field: BedPricingField, raw: string, current?: number | null) {
    const parsed = parseOptionalMoney(raw);
    const existing = current ?? null;
    if (field === 'defaultRent') {
      setRentEdit(null);
    } else {
      setDepositEdit(null);
    }
    if (parsed === existing || !onCommit) {
      return;
    }
    await onCommit(field, parsed);
  }

  return (
    <View
      style={[styles.pricingRow, stacked ? styles.pricingStack : null]}
      onStartShouldSetResponder={() => true}>
      <View style={[styles.pricingField, stacked ? styles.pricingFieldStack : null]}>
        <FormInput
          size="compact"
          label={t('accommodation.fields.rent')}
          prefix="₹"
          value={rentText}
          onChangeText={setRentEdit}
          onBlur={() => {
            void commit('defaultRent', rentText, rent);
          }}
          keyboardType="numeric"
          placeholder={t('accommodation.fields.enterRent')}
          editable={editable}
        />
      </View>
      <View style={[styles.pricingField, stacked ? styles.pricingFieldStack : null]}>
        <FormInput
          size="compact"
          label={t('accommodation.fields.deposit')}
          prefix="₹"
          value={depositText}
          onChangeText={setDepositEdit}
          onBlur={() => {
            void commit('defaultDeposit', depositText, deposit);
          }}
          keyboardType="numeric"
          placeholder={t('accommodation.fields.enterDeposit')}
          editable={editable}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  pricingRow: {
    width: '100%',
    flexDirection: 'row',
    gap: spacing.xs,
  },
  pricingStack: {
    flexDirection: 'column',
    gap: 2,
  },
  pricingField: {
    flex: 1,
    minWidth: 0,
  },
  pricingFieldStack: {
    flex: 0,
    width: '100%',
  },
});
