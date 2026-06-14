import React from 'react';
import { StyleSheet, Switch, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import type { MemberResponse, TransferRentPolicy } from '../../../../api/types';
import { Card } from '../../../../components/ui';
import { colors, spacing, typography } from '../../../../theme';
import {
  computeMonthlyRentFoodTotal,
  formatContractAmount,
  type ContractTermsFormValues,
} from '../../../../utils/occupancyContract';
import type { SpaceFoodPolicy } from '../../../../utils/fetchSpaceFoodPolicy';

type ReviewStepProps = {
  mode: 'ALLOCATE' | 'RESERVE' | 'MOVE_IN' | 'TRANSFER';
  member: MemberResponse | null;
  displayPath?: string;
  contractValues?: ContractTermsFormValues;
  foodPolicy?: SpaceFoodPolicy;
  rentPolicy?: TransferRentPolicy;
  moveInDate?: string;
  expectedExitDate?: string;
  remarks?: string;
  enrollInMeals?: boolean;
  onEnrollInMealsChange?: (value: boolean) => void;
  showMealEnrollment?: boolean;
};

export function ReviewStep({
  mode,
  member,
  displayPath,
  contractValues,
  foodPolicy,
  rentPolicy,
  moveInDate,
  expectedExitDate,
  remarks,
  enrollInMeals = false,
  onEnrollInMealsChange,
  showMealEnrollment = false,
}: ReviewStepProps) {
  const { t } = useTranslation();
  const monthlyTotal =
    contractValues && foodPolicy
      ? computeMonthlyRentFoodTotal(contractValues, foodPolicy)
      : null;

  return (
    <View style={styles.wrap}>
      <Text style={styles.title}>{t('occupancyWizard.steps.review')}</Text>

      <Card style={styles.card}>
        <Text style={styles.section}>{t('occupancyWizard.review.member')}</Text>
        <Text style={styles.value}>
          {member ? `${member.fullName} · ${member.mobileNumber}` : '—'}
        </Text>
      </Card>

      {displayPath ? (
        <Card style={styles.card}>
          <Text style={styles.section}>{t('occupancyWizard.review.accommodation')}</Text>
          <Text style={styles.value}>{displayPath}</Text>
        </Card>
      ) : null}

      {mode === 'RESERVE' ? (
        <Card style={styles.card}>
          <Text style={styles.section}>{t('occupancy.section.moveInDate')}</Text>
          <Text style={styles.value}>{moveInDate || '—'}</Text>
          {expectedExitDate ? (
            <>
              <Text style={[styles.section, styles.gap]}>{t('occupancy.fields.expectedExit')}</Text>
              <Text style={styles.value}>{expectedExitDate}</Text>
            </>
          ) : null}
          {remarks ? (
            <>
              <Text style={[styles.section, styles.gap]}>{t('occupancy.fields.remarks')}</Text>
              <Text style={styles.value}>{remarks}</Text>
            </>
          ) : null}
        </Card>
      ) : null}

      {contractValues && mode !== 'RESERVE' ? (
        <Card style={styles.card}>
          <Text style={styles.section}>{t('occupancy.contract.title')}</Text>
          {contractValues.rentSnapshot ? (
            <Text style={styles.line}>
              {t('occupancy.contract.rent')}:{' '}
              {formatContractAmount(Number(contractValues.rentSnapshot))}
            </Text>
          ) : null}
          {contractValues.depositSnapshot ? (
            <Text style={styles.line}>
              {t('occupancy.contract.deposit')}:{' '}
              {formatContractAmount(Number(contractValues.depositSnapshot))}
            </Text>
          ) : null}
          {foodPolicy?.foodIncludedInRent ? (
            <Text style={styles.line}>{t('occupancy.contract.foodIncludedInRent')}</Text>
          ) : contractValues.foodEnabled ? (
            <Text style={styles.line}>
              {t('occupancy.contract.food')}:{' '}
              {formatContractAmount(
                contractValues.foodChargeSnapshot
                  ? Number(contractValues.foodChargeSnapshot)
                  : foodPolicy?.defaultFoodCharge ?? null,
              )}
            </Text>
          ) : (
            <Text style={styles.line}>{t('occupancy.contract.foodDisabled')}</Text>
          )}
          {monthlyTotal != null ? (
            <Text style={styles.total}>
              {t('occupancy.contract.monthlyTotal')}: {formatContractAmount(monthlyTotal)}
            </Text>
          ) : null}
          {rentPolicy ? (
            <Text style={styles.line}>
              {t('occupancy.contract.rentPolicy')}:{' '}
              {t(`occupancy.contract.rentPolicyOption.${rentPolicy}`)}
            </Text>
          ) : null}
        </Card>
      ) : null}

      {showMealEnrollment && onEnrollInMealsChange ? (
        <Card style={styles.card}>
          <View style={styles.switchRow}>
            <View style={styles.switchText}>
              <Text style={styles.section}>{t('meals.enrollOnMoveIn')}</Text>
              <Text style={styles.line}>{t('meals.enrollOnMoveInHint')}</Text>
            </View>
            <Switch value={enrollInMeals} onValueChange={onEnrollInMealsChange} />
          </View>
        </Card>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: spacing.md },
  title: { ...typography.h3 },
  card: { gap: spacing.xs },
  section: { ...typography.caption, color: colors.muted, fontWeight: '600' },
  gap: { marginTop: spacing.sm },
  value: { ...typography.bodyStrong },
  line: { ...typography.body },
  total: { ...typography.bodyStrong, color: colors.primaryDark, marginTop: spacing.xs },
  switchRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  switchText: { flex: 1 },
});
