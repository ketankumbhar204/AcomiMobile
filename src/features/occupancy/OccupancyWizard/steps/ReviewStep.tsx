import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Pencil } from 'lucide-react-native';
import type { MemberResponse, TransferRentPolicy } from '../../../../api/types';
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
  onEditAccommodation?: () => void;
  onEditContract?: () => void;
  onEditMember?: () => void;
};

function SectionHeader({
  title,
  onEdit,
}: {
  title: string;
  onEdit?: () => void;
}) {
  const { t } = useTranslation();
  return (
    <View style={styles.sectionHeader}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {onEdit ? (
        <Pressable
          onPress={onEdit}
          hitSlop={8}
          style={styles.editBtn}
          accessibilityRole="button"
          accessibilityLabel={t('common.edit')}>
          <Pencil size={14} color={colors.primaryDark} strokeWidth={2.2} />
          <Text style={styles.editLabel}>{t('common.edit')}</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

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
  onEditAccommodation,
  onEditContract,
  onEditMember,
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

      {hierarchyContext ? (
        <Card style={styles.card}>
          <SectionHeader
            title={t('occupancyWizard.review.accommodation')}
            onEdit={onEditAccommodation}
          />
          <HierarchyBreadcrumbCard context={hierarchyContext} compact />
        </Card>
      ) : null}

      {contractValues && mode !== 'RESERVE' ? (
        <Card style={styles.card}>
          <SectionHeader title={t('occupancy.contract.title')} onEdit={onEditContract} />
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

      <Card style={styles.card}>
        <SectionHeader title={t('occupancyWizard.review.member')} onEdit={onEditMember} />
        <Text style={styles.value}>
          {member ? `${member.fullName}` : '—'}
        </Text>
        {member?.mobileNumber ? (
          <Text style={styles.meta}>{member.mobileNumber}</Text>
        ) : null}
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
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: spacing.md },
  title: { ...typography.h3, fontSize: 18, lineHeight: 22, fontWeight: '600' },
  card: { gap: spacing.sm, borderRadius: 18 },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  sectionTitle: {
    ...typography.bodyStrong,
    fontSize: 15,
    color: colors.textPrimary,
    fontWeight: '700',
  },
  editBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  editLabel: {
    ...typography.caption,
    color: colors.primaryDark,
    fontWeight: '700',
  },
  gap: { marginTop: spacing.sm },
  value: { ...typography.bodyStrong },
  meta: { ...typography.caption, color: colors.textSecondary },
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
