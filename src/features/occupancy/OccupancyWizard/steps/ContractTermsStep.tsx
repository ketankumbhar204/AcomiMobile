import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Switch,
  Text,
  View,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import type { OccupancyResponse, TransferRentPolicy } from '../../../../api/types';
import { ContractTermsForm } from '../../../../components/occupancy/ContractTermsForm';
import { fetchSpaceFoodPolicy, type SpaceFoodPolicy } from '../../../../utils/fetchSpaceFoodPolicy';
import {
  contractTermsFromOccupancy,
  emptyContractTermsFormValues,
  resolveContractFoodPolicy,
  type ContractTermsFormValues,
} from '../../../../utils/occupancyContract';
import { isMoveInDateInFuture } from '../../../../utils/occupancyRules';
import { colors, radius, spacing, typography } from '../../../../theme';

type ContractTermsStepProps = {
  spaceId: string;
  mode: 'ALLOCATE' | 'TRANSFER' | 'MOVE_IN';
  values: ContractTermsFormValues;
  onChange: (values: ContractTermsFormValues) => void;
  catalogRent?: number | null;
  catalogDeposit?: number | null;
  rentPolicy?: TransferRentPolicy;
  onRentPolicyChange?: (policy: TransferRentPolicy) => void;
  currentOccupancy?: OccupancyResponse | null;
  displayPath?: string;
  moveInDate?: string | null;
  agreementSigned?: boolean;
  onAgreementSignedChange?: (value: boolean) => void;
  allowEarlyMoveIn?: boolean;
  onAllowEarlyMoveInChange?: (value: boolean) => void;
};

export function ContractTermsStep({
  spaceId,
  mode,
  values,
  onChange,
  catalogRent,
  catalogDeposit,
  rentPolicy = 'APPLY_NEW',
  onRentPolicyChange,
  currentOccupancy,
  displayPath,
  moveInDate,
  agreementSigned = false,
  onAgreementSignedChange,
  allowEarlyMoveIn = false,
  onAllowEarlyMoveInChange,
}: ContractTermsStepProps) {
  const { t } = useTranslation();
  const needsEarlyMoveIn = mode === 'MOVE_IN' && isMoveInDateInFuture(moveInDate);
  const [foodPolicy, setFoodPolicy] = useState<SpaceFoodPolicy>({
    foodIncludedInRent: false,
    defaultFoodCharge: null,
  });
  const [loading, setLoading] = useState(true);

  const effectiveFoodPolicy = resolveContractFoodPolicy(
    foodPolicy,
    mode === 'TRANSFER' && rentPolicy === 'KEEP' ? currentOccupancy : null,
  );

  useEffect(() => {
    setLoading(true);
    void fetchSpaceFoodPolicy(spaceId)
      .then(setFoodPolicy)
      .finally(() => setLoading(false));
  }, [spaceId]);

  if (loading) {
    return <ActivityIndicator color={colors.primary} style={styles.loader} />;
  }

  return (
    <View style={styles.wrap}>
      <Text style={styles.title}>{t('occupancyWizard.steps.contract')}</Text>
      {displayPath ? <Text style={styles.path}>{displayPath}</Text> : null}

      {mode === 'MOVE_IN' && needsEarlyMoveIn && onAllowEarlyMoveInChange ? (
        <View style={styles.switchRow}>
          <View style={styles.switchCopy}>
            <Text style={styles.switchLabel}>{t('occupancy.moveIn.allowEarly')}</Text>
            <Text style={styles.switchHint}>{t('occupancy.moveIn.allowEarlyHint')}</Text>
          </View>
          <Switch
            value={allowEarlyMoveIn}
            onValueChange={onAllowEarlyMoveInChange}
            trackColor={{ false: colors.border, true: colors.primary }}
          />
        </View>
      ) : null}

      {mode === 'MOVE_IN' && onAgreementSignedChange ? (
        <View style={styles.switchRow}>
          <Text style={styles.switchLabel}>{t('occupancy.fields.agreementSigned')}</Text>
          <Switch
            value={agreementSigned}
            onValueChange={onAgreementSignedChange}
            trackColor={{ false: colors.border, true: colors.primary }}
          />
        </View>
      ) : null}

      {mode === 'TRANSFER' && onRentPolicyChange ? (
        <>
          <Text style={styles.policyLabel}>{t('occupancy.contract.rentPolicy')}</Text>
          <View style={styles.policyRow}>
            {(['APPLY_NEW', 'KEEP', 'CUSTOM'] as TransferRentPolicy[]).map(policy => (
              <Pressable
                key={policy}
                style={[styles.chip, rentPolicy === policy && styles.chipSelected]}
                onPress={() => {
                  onRentPolicyChange(policy);
                  if (policy === 'KEEP' && currentOccupancy) {
                    onChange(contractTermsFromOccupancy(currentOccupancy));
                  } else if (policy === 'APPLY_NEW') {
                    onChange(
                      emptyContractTermsFormValues(
                        { defaultRent: catalogRent, defaultDeposit: catalogDeposit },
                        foodPolicy,
                      ),
                    );
                  } else {
                    onChange(emptyContractTermsFormValues(undefined, foodPolicy));
                  }
                }}>
                <Text
                  style={[styles.chipText, rentPolicy === policy && styles.chipTextSelected]}>
                  {t(`occupancy.contract.rentPolicyOption.${policy}`)}
                </Text>
              </Pressable>
            ))}
          </View>
        </>
      ) : null}

      <ContractTermsForm
        values={values}
        onChange={onChange}
        showRentDeposit={
          mode !== 'TRANSFER' || rentPolicy === 'APPLY_NEW' || rentPolicy === 'CUSTOM'
        }
        rentRequired={
          mode === 'ALLOCATE' ||
          mode === 'MOVE_IN' ||
          rentPolicy === 'CUSTOM' ||
          (mode === 'TRANSFER' && rentPolicy === 'APPLY_NEW')
        }
        readOnlyRent={
          mode === 'TRANSFER' && rentPolicy === 'KEEP'
            ? currentOccupancy?.rentSnapshot ?? null
            : undefined
        }
        readOnlyDeposit={
          mode === 'TRANSFER' && rentPolicy === 'KEEP'
            ? currentOccupancy?.depositSnapshot ?? 0
            : undefined
        }
        catalogRentHint={catalogRent}
        catalogDepositHint={catalogDeposit}
        foodPolicy={effectiveFoodPolicy}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: spacing.xs },
  title: { ...typography.h3, marginBottom: spacing.xs },
  path: { ...typography.caption, color: colors.muted, marginBottom: spacing.md },
  loader: { marginVertical: spacing.lg },
  policyLabel: { ...typography.bodyStrong, marginBottom: spacing.sm },
  policyRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs, marginBottom: spacing.md },
  chip: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.full,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
  },
  chipSelected: {
    borderColor: colors.primary,
    backgroundColor: `${colors.primary}14`,
  },
  chipText: { ...typography.caption, color: colors.textSecondary },
  chipTextSelected: { color: colors.primaryDark, fontWeight: '600' },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
    gap: spacing.md,
  },
  switchCopy: { flex: 1 },
  switchLabel: { ...typography.bodyStrong },
  switchHint: { ...typography.caption, color: colors.muted, marginTop: spacing.xs },
});
