import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import type { LucideIcon } from 'lucide-react-native';
import {
  CalendarDays,
  IndianRupee,
  Pencil,
  Shield,
  Tag,
  UserRound,
  UtensilsCrossed,
} from 'lucide-react-native';
import type { MemberResponse, TransferRentPolicy } from '../../../../api/types';
import { Card } from '../../../../components/ui';
import type { OccupancyHierarchyContext } from '../../../../components/occupancy/HierarchyBreadcrumbCard';
import { SelectedInventorySummaryCard } from '../../../../components/occupancy/SelectedInventorySummaryCard';
import { ContactNumberLine } from '../../../../components/member/ContactAndStayMeta';
import { colors, radius, spacing, typography } from '../../../../theme';
import {
  computeMonthlyRentFoodTotal,
  computeMoveInTotalToPayThisMonth,
  formatContractAmount,
  monthlyTotalIncludesFoodFromForm,
  monthlyTotalLabelKey,
  type ContractTermsFormValues,
} from '../../../../utils/occupancyContract';
import { shortStayNightCount, type StayChoice } from '../../../../utils/shortStay';
import { resolveBookingAdvanceSplit } from '../../../../utils/bookingAdvance';
import { formatMenuDate } from '../../../../utils/mealDates';
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
  /**
   * When set, review shows Short Stay pricing.
   * Value is the owner daily rent (₹/night); stay rent = daily × nights.
   */
  agreedTotalPreview?: string;
  /** Until I Leave: rent_snapshot is ₹/day. */
  dailyRentMode?: boolean;
  stayChoice?: 'MONTHLY' | 'SHORT' | 'OPEN_ENDED';
  remarks?: string;
  onEditAccommodation?: () => void;
  onEditContract?: () => void;
  onEditMember?: () => void;
};

function isShortStayReview(agreedTotalPreview?: string): boolean {
  return agreedTotalPreview !== undefined;
}

function formatReviewDate(iso: string | undefined, locale: string): string {
  if (!iso?.trim()) {
    return '—';
  }
  try {
    return formatMenuDate(iso.trim(), locale);
  } catch {
    return iso;
  }
}

function SectionHeader({
  title,
  Icon,
  onEdit,
}: {
  title: string;
  Icon?: LucideIcon;
  onEdit?: () => void;
}) {
  const { t } = useTranslation();
  return (
    <View style={styles.sectionHeader}>
      <View style={styles.sectionTitleRow}>
        {Icon ? (
          <View style={styles.sectionIcon} accessibilityElementsHidden>
            <Icon size={16} color={colors.primaryDark} strokeWidth={2.2} />
          </View>
        ) : null}
        <Text style={styles.sectionTitle}>{title}</Text>
      </View>
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

function ReviewLine({
  label,
  value,
  Icon,
  emphasize,
}: {
  label: string;
  value: string;
  Icon?: LucideIcon;
  emphasize?: boolean;
}) {
  return (
    <View style={[styles.lineRow, emphasize && styles.totalRow]}>
      <View style={styles.lineLabelRow}>
        {Icon ? (
          <Icon
            size={14}
            color={emphasize ? colors.primaryDark : colors.textSecondary}
            strokeWidth={2.2}
          />
        ) : null}
        <Text style={[styles.lineLabel, emphasize && styles.totalLabel]}>{label}</Text>
      </View>
      <Text style={[styles.lineValue, emphasize && styles.totalValue]}>{value}</Text>
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
  agreedTotalPreview,
  dailyRentMode = false,
  stayChoice,
  remarks,
  onEditAccommodation,
  onEditContract,
  onEditMember,
}: ReviewStepProps) {
  const { t, i18n } = useTranslation();
  const shortStay = isShortStayReview(agreedTotalPreview);
  const nights =
    shortStay && moveInDate && expectedExitDate
      ? shortStayNightCount(moveInDate, expectedExitDate)
      : null;
  const dailyRent = shortStay ? Number(agreedTotalPreview) : NaN;
  const stayRent =
    shortStay && Number.isFinite(dailyRent) && nights != null && nights > 0
      ? dailyRent * nights
      : null;
  const monthlyTotal =
    !shortStay && !dailyRentMode && contractValues && foodPolicy
      ? computeMonthlyRentFoodTotal(contractValues, foodPolicy)
      : null;
  const monthlyTotalLabel =
    !shortStay && contractValues && foodPolicy
      ? monthlyTotalLabelKey(
          monthlyTotalIncludesFoodFromForm(contractValues, foodPolicy),
        )
      : 'occupancy.contract.monthlyTotal';

  // Owner "Include food charges" toggle — not space Food amenity / catalog foodIncludedInRent.
  const foodIncludedLabel = contractValues?.foodEnabled
    ? t('common.yes')
    : t('common.no');

  const stayTypeLabel =
    stayChoice === 'OPEN_ENDED'
      ? t('occupancy.section.openEndedStayChoice', {
          defaultValue: 'No Fixed Move-Out Date',
        })
      : stayChoice === 'SHORT'
        ? t('occupancy.section.shortStayChoice', { defaultValue: 'Daily' })
        : t('occupancy.section.monthlyStayChoice', { defaultValue: 'Monthly' });

  return (
    <View style={styles.wrap}>
      {!hideTitle ? <Text style={styles.title}>{t('occupancyWizard.steps.review')}</Text> : null}

      {hierarchyContext ? (
        <Card style={styles.card}>
          <SectionHeader
            title={t('occupancyWizard.review.accommodation')}
            onEdit={onEditAccommodation}
          />
          <SelectedInventorySummaryCard context={hierarchyContext} embedded />
        </Card>
      ) : null}

      <Card style={styles.card}>
        <SectionHeader
          title={t('occupancyWizard.review.member')}
          Icon={UserRound}
          onEdit={onEditMember}
        />
        <Text style={styles.value}>{member ? member.fullName : '—'}</Text>
        {member?.mobileNumber ? (
          <ContactNumberLine
            value={member.mobileNumber}
            name={member.fullName}
            textStyle={styles.meta}
          />
        ) : null}
      </Card>

      {shortStay ? (
        <Card style={styles.card}>
          <SectionHeader
            title={t('occupancyWizard.review.chargesSummary', {
              defaultValue: 'Charges Summary',
            })}
            Icon={Tag}
            onEdit={onEditContract}
          />
          {stayChoice ? (
            <ReviewLine label={t('occupancyWizard.steps.stayType', { defaultValue: 'Stay type' })} value={stayTypeLabel} Icon={Tag} />
          ) : null}
          <ReviewLine
            label={t('occupancy.contract.dailyRent', { defaultValue: 'Daily rent' })}
            value={
              Number.isFinite(dailyRent) && dailyRent > 0
                ? `${formatContractAmount(dailyRent)} / night`
                : t('occupancy.contract.notSet', { defaultValue: 'Not set' })
            }
            Icon={IndianRupee}
          />
          {nights != null ? (
            <ReviewLine
              label={t('occupancy.section.stayDuration', { defaultValue: 'Duration' })}
              value={t('occupancy.section.stayDurationNightsCount', {
                count: nights,
                defaultValue: '{{count}} nights',
              })}
              Icon={CalendarDays}
            />
          ) : null}
          {stayRent != null ? (
            <ReviewLine
              label={t('occupancy.contract.stayRent', { defaultValue: 'Stay rent' })}
              value={
                nights != null
                  ? `${formatContractAmount(dailyRent)} × ${nights} = ${formatContractAmount(stayRent)}`
                  : formatContractAmount(stayRent)
              }
              Icon={IndianRupee}
            />
          ) : null}
          {contractValues ? (
            <ReviewLine
              label={t('occupancy.contract.paymentSummary.deposit', {
                defaultValue: 'Security deposit (one-time)',
              })}
              value={formatContractAmount(Number(contractValues.depositSnapshot || 0))}
              Icon={Shield}
            />
          ) : null}
          {contractValues && foodPolicy ? (
            <ReviewLine
              label={t('occupancy.contract.foodEnabled')}
              value={foodIncludedLabel}
              Icon={UtensilsCrossed}
            />
          ) : null}
          {rentPolicy ? (
            <ReviewLine
              label={t('occupancy.contract.rentPolicy')}
              value={t(`occupancy.contract.rentPolicyOption.${rentPolicy}`)}
            />
          ) : null}
          {mode !== 'RESERVE' && stayRent != null ? (
            <ReviewLine
              label={t('occupancy.contract.paymentSummary.totalOnAllocation', {
                defaultValue: 'Total on allocation',
              })}
              value={formatContractAmount(
                stayRent + Math.max(0, Number(contractValues?.depositSnapshot || 0)),
              )}
              Icon={IndianRupee}
              emphasize
            />
          ) : null}
        </Card>
      ) : null}

      {!shortStay && contractValues ? (
        <Card style={styles.card}>
          <SectionHeader title={t('occupancy.contract.title')} Icon={Tag} onEdit={onEditContract} />
          {stayChoice ? (
            <ReviewLine
              label={t('occupancyWizard.steps.stayType', { defaultValue: 'Stay type' })}
              value={stayTypeLabel}
              Icon={Tag}
            />
          ) : null}
          <ReviewLine
            label={
              dailyRentMode
                ? t('occupancy.contract.dailyRent', { defaultValue: 'Daily rent' })
                : t('occupancy.contract.rent')
            }
            value={
              contractValues.rentSnapshot
                ? dailyRentMode
                  ? `${formatContractAmount(Number(contractValues.rentSnapshot))} / day`
                  : formatContractAmount(Number(contractValues.rentSnapshot))
                : t('occupancy.contract.notSet', { defaultValue: 'Not set' })
            }
            Icon={IndianRupee}
          />
          <ReviewLine
            label={t('occupancy.contract.paymentSummary.deposit', {
              defaultValue: 'Security deposit (one-time)',
            })}
            value={formatContractAmount(Number(contractValues.depositSnapshot || 0))}
            Icon={Shield}
          />
          {foodPolicy ? (
            <ReviewLine
              label={t('occupancy.contract.foodEnabled')}
              value={foodIncludedLabel}
              Icon={UtensilsCrossed}
            />
          ) : null}
          {monthlyTotal != null ? (
            <ReviewLine label={t(monthlyTotalLabel)} value={formatContractAmount(monthlyTotal)} emphasize />
          ) : null}
          {rentPolicy ? (
            <ReviewLine
              label={t('occupancy.contract.rentPolicy')}
              value={t(`occupancy.contract.rentPolicyOption.${rentPolicy}`)}
            />
          ) : null}
        </Card>
      ) : null}

      {mode === 'RESERVE' && contractValues ? (
        <ReservationPaymentSummaryCard
          values={contractValues}
          stayChoice={stayChoice}
          firstPeriodRent={
            stayChoice === 'SHORT' && stayRent != null ? stayRent : undefined
          }
        />
      ) : null}

      {mode !== 'RESERVE' && !shortStay && !dailyRentMode && contractValues ? (
        <PaymentSummaryCard values={contractValues} foodPolicy={foodPolicy} />
      ) : null}

      {dailyRentMode && mode !== 'RESERVE' && contractValues ? (
        <Card style={styles.card}>
          <SectionHeader
            title={t('occupancy.contract.paymentSummary.title', { defaultValue: 'Payment summary' })}
            Icon={IndianRupee}
          />
          <ReviewLine
            label={t('occupancy.contract.dailyRent', { defaultValue: 'Daily rent' })}
            value={
              contractValues.rentSnapshot
                ? `${formatContractAmount(Number(contractValues.rentSnapshot))} / day`
                : '—'
            }
            Icon={IndianRupee}
          />
          {Number(contractValues.depositSnapshot || 0) > 0 ? (
            <ReviewLine
              label={t('occupancy.contract.paymentSummary.deposit', {
                defaultValue: 'Security deposit (one-time)',
              })}
              value={formatContractAmount(Number(contractValues.depositSnapshot || 0))}
              Icon={Shield}
            />
          ) : null}
          <Text style={[styles.meta, styles.gap]}>
            {t('occupancy.contract.dailyRentBillingNote', {
              defaultValue:
                'Daily rent accumulates into one rent charge per calendar month until vacate. Deposit is collected once on allocation.',
            })}
          </Text>
        </Card>
      ) : null}

      {mode !== 'RESERVE' && (moveInDate || expectedExitDate) ? (
        <Card style={styles.card}>
          <SectionHeader
            title={t('occupancyWizard.review.dates', { defaultValue: 'Stay dates' })}
            Icon={CalendarDays}
          />
          {moveInDate ? (
            <ReviewLine
              label={t('occupancy.section.moveInDate')}
              value={formatReviewDate(moveInDate, i18n.language)}
              Icon={CalendarDays}
            />
          ) : null}
          {expectedExitDate ? (
            <ReviewLine
              label={t('occupancy.section.expectedMoveOut', { defaultValue: 'Expected move-out' })}
              value={formatReviewDate(expectedExitDate, i18n.language)}
              Icon={CalendarDays}
            />
          ) : null}
        </Card>
      ) : null}

      {mode === 'RESERVE' ? (
        <Card style={styles.card}>
          <SectionHeader
            title={t('occupancyWizard.steps.reserveDates', { defaultValue: 'Reservation details' })}
            Icon={CalendarDays}
          />
          <ReviewLine
            label={t('occupancy.section.moveInDate')}
            value={formatReviewDate(moveInDate, i18n.language)}
            Icon={CalendarDays}
          />
          {expectedExitDate ? (
            <ReviewLine
              label={t('occupancy.fields.expectedExit')}
              value={formatReviewDate(expectedExitDate, i18n.language)}
              Icon={CalendarDays}
            />
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

function ReservationPaymentSummaryCard({
  values,
  stayChoice,
  firstPeriodRent,
}: {
  values: ContractTermsFormValues;
  stayChoice?: StayChoice;
  /** Override when SHORT stay rent = daily × nights. */
  firstPeriodRent?: number;
}) {
  const { t } = useTranslation();
  const rent = firstPeriodRent ?? Number(values.rentSnapshot);
  if (!Number.isFinite(rent) || rent <= 0) {
    return null;
  }
  const { split } = resolveBookingAdvanceSplit({
    firstPeriodRent: rent,
    bookingAdvanceText: values.bookingAdvanceAmount,
  });
  const deposit = Math.max(0, Number(values.depositSnapshot || 0));

  return (
    <Card style={styles.card}>
      <SectionHeader
        title={t('occupancy.contract.paymentSummary.title', { defaultValue: 'Payment summary' })}
        Icon={IndianRupee}
      />
      <ReviewLine
        label={t('occupancy.bookingAdvance.firstPeriodRent', {
          defaultValue: 'First-period rent',
        })}
        value={formatContractAmount(rent)}
        Icon={IndianRupee}
      />
      {split ? (
        <>
          <ReviewLine
            label={t('occupancy.bookingAdvance.label', {
              defaultValue: 'Booking advance',
            })}
            value={`${formatContractAmount(split.bookingAdvance)}${
              values.bookingAdvanceCollected
                ? ` (${t('occupancy.bookingAdvance.collectedShort', { defaultValue: 'collected' })})`
                : ` (${t('occupancy.bookingAdvance.pendingShort', { defaultValue: 'pending' })})`
            }`}
            Icon={IndianRupee}
          />
          <ReviewLine
            label={t('occupancy.bookingAdvance.remainingLabel', {
              defaultValue: 'Remaining rent',
            })}
            value={formatContractAmount(split.remainingRent)}
            Icon={IndianRupee}
          />
        </>
      ) : (
        <ReviewLine
          label={t('occupancy.bookingAdvance.noAdvance', {
            defaultValue: 'Booking advance',
          })}
          value={t('occupancy.bookingAdvance.none', { defaultValue: 'None — rent due at move-in' })}
          Icon={IndianRupee}
        />
      )}
      {deposit > 0 ? (
        <ReviewLine
          label={t('occupancy.contract.paymentSummary.deposit')}
          value={formatContractAmount(deposit)}
          Icon={Shield}
        />
      ) : null}
    </Card>
  );
}

function PaymentSummaryCard({
  values,
  foodPolicy,
}: {
  values: ContractTermsFormValues;
  foodPolicy?: SpaceFoodPolicy;
}) {
  const { t } = useTranslation();
  const breakdown = computeMoveInTotalToPayThisMonth(values, foodPolicy);
  if (breakdown.total == null) {
    return null;
  }
  const rentLabel = monthlyTotalIncludesFoodFromForm(values, foodPolicy)
    ? t('occupancy.contract.paymentSummary.rentWithFood')
    : t('occupancy.contract.paymentSummary.rent');

  return (
    <Card style={styles.card}>
      <SectionHeader
        title={t('occupancy.contract.paymentSummary.title')}
        Icon={IndianRupee}
      />
      <ReviewLine label={rentLabel} value={formatContractAmount(breakdown.rent ?? 0)} Icon={IndianRupee} />
      {breakdown.deposit > 0 ? (
        <ReviewLine
          label={t('occupancy.contract.paymentSummary.deposit')}
          value={formatContractAmount(breakdown.deposit)}
          Icon={Shield}
        />
      ) : null}
      <ReviewLine
        label={t('occupancy.contract.paymentSummary.totalThisMonth')}
        value={formatContractAmount(breakdown.total)}
        Icon={IndianRupee}
        emphasize
      />
    </Card>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: spacing.md },
  title: { ...typography.h3, fontSize: 18, lineHeight: 22, fontWeight: '600' },
  card: { gap: spacing.sm, borderRadius: radius.card },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  sectionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    flex: 1,
    minWidth: 0,
  },
  sectionIcon: {
    width: 28,
    height: 28,
    borderRadius: radius.sm,
    backgroundColor: colors.successTint,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  sectionTitle: {
    ...typography.bodyStrong,
    fontSize: 15,
    color: colors.textPrimary,
    fontWeight: '700',
    flexShrink: 1,
  },
  editBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    flexShrink: 0,
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
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: spacing.md,
  },
  lineLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flex: 1,
    minWidth: 0,
  },
  lineLabel: { ...typography.body, color: colors.textSecondary, flexShrink: 1 },
  lineValue: {
    ...typography.bodyStrong,
    textAlign: 'right',
    flexShrink: 1,
    maxWidth: '52%',
  },
  totalRow: {
    marginTop: spacing.xs,
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  totalLabel: { ...typography.bodyStrong, color: colors.textPrimary },
  totalValue: { ...typography.bodyStrong, color: colors.primaryDark },
});
