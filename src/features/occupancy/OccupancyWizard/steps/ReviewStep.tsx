import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import type { MemberResponse, TransferRentPolicy, AmenityAssignment } from '../../../../api/types';
import { Card } from '../../../../components/ui';
import { HierarchyBreadcrumbCard } from '../../../../components/occupancy/HierarchyBreadcrumbCard';
import type { OccupancyHierarchyContext } from '../../../../components/occupancy/HierarchyBreadcrumbCard';
import { colors, spacing, typography } from '../../../../theme';
import {
  computeMonthlyRentFoodTotal,
  formatContractAmount,
  monthlyTotalIncludesFoodFromForm,
  monthlyTotalLabelKey,
  type ContractTermsFormValues,
} from '../../../../utils/occupancyContract';
import type { SpaceFoodPolicy } from '../../../../utils/fetchSpaceFoodPolicy';

type ReviewStepProps = {
  mode: 'ALLOCATE' | 'RESERVE' | 'MOVE_IN' | 'TRANSFER';
  member: MemberResponse | null;
  hierarchyContext?: OccupancyHierarchyContext;
  hideTitle?: boolean;
  contractValues?: ContractTermsFormValues;
  foodPolicy?: SpaceFoodPolicy;
  rentPolicy?: TransferRentPolicy;
  moveInDate?: string;
  expectedExitDate?: string;
  remarks?: string;
};

export function ReviewStep({
  mode,
  member,
  hierarchyContext,
  hideTitle = false,
  contractValues,
  foodPolicy,
  rentPolicy,
  moveInDate,
  expectedExitDate,
  remarks,
}: ReviewStepProps) {
  const { t } = useTranslation();
  const monthlyTotal =
    contractValues && foodPolicy
      ? computeMonthlyRentFoodTotal(contractValues, foodPolicy)
      : null;
  const monthlyTotalLabel =
    contractValues && foodPolicy
      ? monthlyTotalLabelKey(
          monthlyTotalIncludesFoodFromForm(contractValues, foodPolicy),
        )
      : 'occupancy.contract.monthlyTotal';

  const foodIncludedLabel = foodPolicy?.foodIncludedInRent
    ? t('common.yes')
    : contractValues?.foodEnabled
      ? t('common.yes')
      : t('common.no');

  return (
    <View style={styles.wrap}>
      {!hideTitle ? <Text style={styles.title}>{t('occupancyWizard.steps.review')}</Text> : null}

      {hierarchyContext && !hideTitle ? (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('occupancyWizard.review.accommodation')}</Text>
          <HierarchyBreadcrumbCard context={hierarchyContext} compact />
        </View>
      ) : null}

      <Card style={styles.card}>
        <Text style={styles.sectionTitle}>{t('occupancyWizard.review.member')}</Text>
        <Text style={styles.value}>
          {member ? `${member.fullName} · ${member.mobileNumber}` : '—'}
        </Text>
      </Card>

      {mode === 'RESERVE' ? (
        <Card style={styles.card}>
          <Text style={styles.sectionTitle}>{t('occupancy.section.moveInDate')}</Text>
          <Text style={styles.value}>{moveInDate || '—'}</Text>
          {expectedExitDate ? (
            <>
              <Text style={[styles.sectionTitle, styles.gap]}>
                {t('occupancy.fields.expectedExit')}
              </Text>
              <Text style={styles.value}>{expectedExitDate}</Text>
            </>
          ) : null}
          {remarks ? (
            <>
              <Text style={[styles.sectionTitle, styles.gap]}>{t('occupancy.fields.remarks')}</Text>
              <Text style={styles.value}>{remarks}</Text>
            </>
          ) : null}
        </Card>
      ) : null}

      {contractValues && mode !== 'RESERVE' ? (
        <Card style={styles.card}>
          <Text style={styles.sectionTitle}>{t('occupancy.contract.title')}</Text>
          {contractValues.rentSnapshot ? (
            <View style={styles.lineRow}>
              <Text style={styles.lineLabel}>{t('occupancy.contract.rent')}</Text>
              <Text style={styles.lineValue}>
                {formatContractAmount(Number(contractValues.rentSnapshot))}
              </Text>
            </View>
          ) : null}
          <View style={styles.lineRow}>
            <Text style={styles.lineLabel}>{t('occupancy.contract.deposit')}</Text>
            <Text style={styles.lineValue}>
              {formatContractAmount(Number(contractValues.depositSnapshot || 0))}
            </Text>
          </View>
          <View style={styles.lineRow}>
            <Text style={styles.lineLabel}>{t('occupancy.contract.foodEnabled')}</Text>
            <Text style={styles.lineValue}>{foodIncludedLabel}</Text>
          </View>
          {monthlyTotal != null ? (
            <View style={[styles.lineRow, styles.totalRow]}>
              <Text style={styles.totalLabel}>{t(monthlyTotalLabel)}</Text>
              <Text style={styles.totalValue}>{formatContractAmount(monthlyTotal)}</Text>
            </View>
          ) : null}
          {rentPolicy ? (
            <View style={styles.lineRow}>
              <Text style={styles.lineLabel}>{t('occupancy.contract.rentPolicy')}</Text>
              <Text style={styles.lineValue}>
                {t(`occupancy.contract.rentPolicyOption.${rentPolicy}`)}
              </Text>
            </View>
          ) : null}
        </Card>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: spacing.md },
  title: { ...typography.h3 },
  section: { gap: spacing.xs },
  card: { gap: spacing.sm },
  sectionTitle: { ...typography.caption, color: colors.muted, fontWeight: '600' },
  gap: { marginTop: spacing.sm },
  value: { ...typography.bodyStrong },
  lineRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.md,
  },
  lineLabel: { ...typography.body, color: colors.textSecondary, flex: 1 },
  lineValue: { ...typography.bodyStrong, textAlign: 'right' },
  totalRow: {
    marginTop: spacing.xs,
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  totalLabel: { ...typography.bodyStrong },
  totalValue: { ...typography.bodyStrong, color: colors.primaryDark },
});
