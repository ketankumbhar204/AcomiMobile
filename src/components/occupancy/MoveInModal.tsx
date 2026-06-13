import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  View,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import type { OccupancyTargetSelection } from '../../utils/occupancyRules';
import { fetchTargetCatalogDefaults } from '../../utils/fetchTargetCatalogDefaults';
import {
  fetchSpaceFoodPolicy,
  type SpaceFoodPolicy,
} from '../../utils/fetchSpaceFoodPolicy';
import {
  buildContractSnapshotPayload,
  emptyContractTermsFormValues,
  validateContractTerms,
  type ContractTermsFormValues,
} from '../../utils/occupancyContract';
import { isMoveInDateInFuture } from '../../utils/occupancyRules';
import { ContractTermsForm } from './ContractTermsForm';
import { Button, FormInput } from '../ui';
import { colors, radius, shadows, spacing, typography } from '../../theme';

export type MoveInFormValues = {
  expectedExitDate?: string;
  agreementSigned: boolean;
  allowEarlyMoveIn: boolean;
  remarks?: string;
  contract: ContractTermsFormValues;
  foodPolicy?: SpaceFoodPolicy;
};

type MoveInModalProps = {
  visible: boolean;
  spaceId: string;
  target: OccupancyTargetSelection;
  moveInDate?: string | null;
  loading?: boolean;
  onClose: () => void;
  onConfirm: (values: MoveInFormValues) => void;
};

type MoveInStep = 'dates' | 'contract';

export function MoveInModal({
  visible,
  spaceId,
  target,
  moveInDate,
  loading = false,
  onClose,
  onConfirm,
}: MoveInModalProps) {
  const { t } = useTranslation();
  const [step, setStep] = useState<MoveInStep>('dates');
  const [expectedExitDate, setExpectedExitDate] = useState('');
  const [agreementSigned, setAgreementSigned] = useState(false);
  const [allowEarlyMoveIn, setAllowEarlyMoveIn] = useState(false);
  const [remarks, setRemarks] = useState('');
  const [contractValues, setContractValues] = useState<ContractTermsFormValues>(
    emptyContractTermsFormValues(),
  );
  const [catalogLoading, setCatalogLoading] = useState(false);
  const [catalogRent, setCatalogRent] = useState<number | null>(null);
  const [foodPolicy, setFoodPolicy] = useState<SpaceFoodPolicy>({
    foodIncludedInRent: false,
    defaultFoodCharge: null,
  });
  const [formError, setFormError] = useState<string | null>(null);

  const needsEarlyMoveIn = isMoveInDateInFuture(moveInDate);

  useEffect(() => {
    if (!visible) {
      return;
    }
    setStep('dates');
    setExpectedExitDate('');
    setAgreementSigned(false);
    setAllowEarlyMoveIn(false);
    setRemarks('');
    setFormError(null);
    setCatalogLoading(true);
    void Promise.all([
      fetchTargetCatalogDefaults(spaceId, target.targetType, {
        bedId: target.bedId,
        roomId: target.roomId,
        unitId: target.unitId,
      }, target.roomId),
      fetchSpaceFoodPolicy(spaceId),
    ])
      .then(([catalog, policy]) => {
        setCatalogRent(catalog.defaultRent ?? null);
        setFoodPolicy(policy);
        setContractValues(emptyContractTermsFormValues(catalog, policy));
      })
      .finally(() => setCatalogLoading(false));
  }, [spaceId, target, visible]);

  function handleDismiss() {
    setStep('dates');
    setExpectedExitDate('');
    setAgreementSigned(false);
    setAllowEarlyMoveIn(false);
    setRemarks('');
    setFormError(null);
    onClose();
  }

  function handleContinueToContract() {
    if (needsEarlyMoveIn && !allowEarlyMoveIn) {
      setFormError(t('occupancy.errors.moveInDateNotReached'));
      return;
    }
    setFormError(null);
    setStep('contract');
  }

  function handleConfirm() {
    const validationError = validateContractTerms(contractValues, {
      rentRequired: true,
      catalogDefaultRent: catalogRent,
      foodPolicy,
    });
    if (validationError) {
      setFormError(t(validationError));
      return;
    }

    onConfirm({
      expectedExitDate: expectedExitDate.trim() || undefined,
      agreementSigned,
      allowEarlyMoveIn: needsEarlyMoveIn ? allowEarlyMoveIn : false,
      remarks: remarks.trim() || undefined,
      contract: contractValues,
      foodPolicy,
    });
  }

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={handleDismiss}>
      <Pressable style={styles.backdrop} onPress={handleDismiss}>
        <Pressable style={styles.sheet} onPress={event => event.stopPropagation()}>
          <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
            <Text style={styles.title}>{t('occupancy.moveIn.title')}</Text>
            {moveInDate ? (
              <Text style={styles.subtitle}>
                {t('occupancy.section.moveInDate')}: {moveInDate}
              </Text>
            ) : null}

            {step === 'dates' ? (
              <>
                {needsEarlyMoveIn ? (
                  <View style={styles.switchRow}>
                    <View style={styles.switchCopy}>
                      <Text style={styles.switchLabel}>{t('occupancy.moveIn.allowEarly')}</Text>
                      <Text style={styles.switchHint}>{t('occupancy.moveIn.allowEarlyHint')}</Text>
                    </View>
                    <Switch
                      value={allowEarlyMoveIn}
                      onValueChange={setAllowEarlyMoveIn}
                      trackColor={{ false: colors.border, true: colors.primary }}
                    />
                  </View>
                ) : null}

                <FormInput
                  label={t('occupancy.fields.expectedExit')}
                  value={expectedExitDate}
                  onChangeText={setExpectedExitDate}
                  placeholder="YYYY-MM-DD"
                />

                <View style={styles.switchRow}>
                  <Text style={styles.switchLabel}>{t('occupancy.fields.agreementSigned')}</Text>
                  <Switch
                    value={agreementSigned}
                    onValueChange={setAgreementSigned}
                    trackColor={{ false: colors.border, true: colors.primary }}
                  />
                </View>

                <FormInput
                  label={t('occupancy.fields.remarks')}
                  value={remarks}
                  onChangeText={setRemarks}
                  placeholder={t('occupancy.fields.remarksPlaceholder')}
                />

                {formError ? <Text style={styles.errorText}>{formError}</Text> : null}

                <View style={styles.actions}>
                  <Button
                    label={t('occupancy.contract.continueToTerms')}
                    onPress={handleContinueToContract}
                    disabled={loading || (needsEarlyMoveIn && !allowEarlyMoveIn)}
                    style={styles.actionBtn}
                  />
                  <Button
                    label={t('common.cancel')}
                    variant="ghost"
                    onPress={handleDismiss}
                    disabled={loading}
                    style={styles.actionBtn}
                  />
                </View>
              </>
            ) : (
              <>
                {catalogLoading ? (
                  <ActivityIndicator color={colors.primary} style={styles.loader} />
                ) : (
                  <ContractTermsForm
                    values={contractValues}
                    onChange={setContractValues}
                    rentRequired
                    catalogRentHint={catalogRent}
                    catalogDepositHint={
                      contractValues.depositSnapshot
                        ? Number(contractValues.depositSnapshot)
                        : null
                    }
                    foodPolicy={foodPolicy}
                  />
                )}

                {formError ? <Text style={styles.errorText}>{formError}</Text> : null}

                <View style={styles.actions}>
                  <Button
                    label={t('occupancy.actions.moveIn')}
                    onPress={handleConfirm}
                    loading={loading}
                    disabled={loading || catalogLoading}
                    style={styles.actionBtn}
                  />
                  <Button
                    label={t('common.back')}
                    variant="ghost"
                    onPress={() => {
                      setFormError(null);
                      setStep('dates');
                    }}
                    disabled={loading}
                    style={styles.actionBtn}
                  />
                </View>
              </>
            )}
          </ScrollView>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'center',
    padding: spacing.xl,
  },
  sheet: {
    backgroundColor: colors.white,
    borderRadius: radius.card,
    padding: spacing.xl,
    maxHeight: '90%',
    ...shadows.md,
  },
  title: {
    ...typography.h3,
    marginBottom: spacing.sm,
  },
  subtitle: {
    ...typography.caption,
    color: colors.muted,
    marginBottom: spacing.md,
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
  loader: {
    marginVertical: spacing.lg,
  },
  actions: {
    marginTop: spacing.md,
    gap: spacing.sm,
  },
  actionBtn: {
    width: '100%',
  },
  errorText: {
    ...typography.caption,
    color: '#DC2626',
    marginBottom: spacing.sm,
  },
});
