import React, { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Switch,
  Text,
  View,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { FileText } from 'lucide-react-native';
import type { OccupancyResponse, TransferRentPolicy, AmenityAssignment } from '../../../../api/types';
import { ContractTermsForm } from '../../../../components/occupancy/ContractTermsForm';
import { OccupancyAmenitiesSection } from '../../../../components/occupancy/OccupancyAmenitiesSection';
import { progressiveSectionHighlightStyle } from '../../../../components/progressive';
import { fetchSpaceFoodPolicy, type SpaceFoodPolicy } from '../../../../utils/fetchSpaceFoodPolicy';
import {
  contractTermsFromOccupancy,
  emptyContractTermsFormValues,
  resolveContractFoodPolicy,
  type ContractTermsFormValues,
} from '../../../../utils/occupancyContract';
import { isMoveInDateInFuture } from '../../../../utils/occupancyRules';
import type { StayChoice } from '../../../../utils/shortStay';
import { colors, radius, spacing, typography } from '../../../../theme';

type ContractTermsStepProps = {
  spaceId: string;
  mode: 'ALLOCATE' | 'RESERVE' | 'TRANSFER' | 'MOVE_IN';
  values: ContractTermsFormValues;
  onChange: (values: ContractTermsFormValues) => void;
  rentError?: string | null;
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
  spaceAmenities?: AmenityAssignment[];
  assignedAmenities?: AmenityAssignment[];
  onAssignedAmenitiesChange?: (value: AmenityAssignment[]) => void;
  /** Progressive Guided Workflow — deposit/charges/amenities scroll target (ScrollView content Y). */
  onAddonsLayout?: (y: number, height: number) => void;
  addonsHighlighted?: boolean;
  /** @deprecated Prefer stayKind === 'SHORT'. */
  hideMonthlyRent?: boolean;
  /** @deprecated Prefer stayKind === 'OPEN_ENDED'. */
  dailyRentMode?: boolean;
  stayKind?: StayChoice;
  shortStayNights?: number | null;
  /** Hide food toggle when meals are not applicable (e.g. Rental). */
  showFoodToggle?: boolean;
};

export function ContractTermsStep({
  spaceId,
  mode,
  values,
  onChange,
  rentError,
  catalogRent,
  catalogDeposit,
  rentPolicy = 'APPLY_NEW',
  onRentPolicyChange,
  currentOccupancy,
  moveInDate,
  agreementSigned = false,
  onAgreementSignedChange,
  allowEarlyMoveIn = false,
  onAllowEarlyMoveInChange,
  spaceAmenities = [],
  assignedAmenities = [],
  onAssignedAmenitiesChange,
  onAddonsLayout,
  addonsHighlighted = false,
  hideMonthlyRent = false,
  dailyRentMode = false,
  stayKind,
  shortStayNights = null,
  showFoodToggle = true,
}: ContractTermsStepProps) {
  const { t } = useTranslation();
  const needsEarlyMoveIn = mode === 'MOVE_IN' && isMoveInDateInFuture(moveInDate);
  const [foodPolicy, setFoodPolicy] = useState<SpaceFoodPolicy>({
    foodIncludedInRent: false,
    defaultFoodCharge: null,
  });
  const [loading, setLoading] = useState(true);
  const stepOffsetRef = useRef(0);
  const formOffsetRef = useRef(0);

  const resolvedStayKind: StayChoice =
    stayKind ??
    (hideMonthlyRent ? 'SHORT' : dailyRentMode ? 'OPEN_ENDED' : 'MONTHLY');

  const effectiveFoodPolicy = resolveContractFoodPolicy(
    foodPolicy,
    mode === 'TRANSFER' && rentPolicy === 'KEEP' ? currentOccupancy : null,
  );

  const showRentDeposit =
    mode !== 'TRANSFER' || rentPolicy === 'APPLY_NEW' || rentPolicy === 'CUSTOM';

  const reportAddonsLayout = (localY: number, height: number) => {
    onAddonsLayout?.(stepOffsetRef.current + formOffsetRef.current + localY, height);
  };

  const amenitiesSection =
    spaceAmenities.length > 0 && onAssignedAmenitiesChange ? (
      <OccupancyAmenitiesSection
        available={spaceAmenities}
        assigned={assignedAmenities}
        onChange={onAssignedAmenitiesChange}
      />
    ) : null;

  const stepSubtitle =
    resolvedStayKind === 'SHORT'
      ? t('occupancy.contract.stepHintDaily', {
          defaultValue: 'Set daily rent, deposit and applicable charges for this stay.',
        })
      : resolvedStayKind === 'OPEN_ENDED'
        ? t('occupancy.contract.stepHintOpenEnded', {
            defaultValue: 'Set daily rent, deposit and applicable charges until vacate.',
          })
        : t('occupancy.contract.stepHintMonthly', {
            defaultValue: 'Set rent, deposit and applicable charges for this stay.',
          });

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
    <View
      collapsable={false}
      style={styles.wrap}
      onLayout={event => {
        stepOffsetRef.current = event.nativeEvent.layout.y;
      }}>
      <View style={styles.pageHeader}>
        <View style={styles.pageIcon}>
          <FileText size={18} color={colors.primaryDark} strokeWidth={2.2} />
        </View>
        <View style={styles.pageHeaderText}>
          <Text style={styles.title}>{t('occupancyWizard.steps.contract')}</Text>
          <Text style={styles.subtitle}>{stepSubtitle}</Text>
        </View>
      </View>

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
                    if (currentOccupancy.amenities?.length && onAssignedAmenitiesChange) {
                      onAssignedAmenitiesChange(currentOccupancy.amenities);
                    }
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

      <View
        collapsable={false}
        onLayout={event => {
          formOffsetRef.current = event.nativeEvent.layout.y;
        }}>
        <ContractTermsForm
          values={values}
          onChange={onChange}
          showRentDeposit={showRentDeposit}
          stayKind={resolvedStayKind}
          shortStayNights={shortStayNights}
          dailyRentMode={resolvedStayKind === 'OPEN_ENDED'}
          hideMonthlyRent={false}
          showFoodToggle={showFoodToggle}
          showPricingHeading
          showBookingAdvance={mode === 'RESERVE'}
          rentError={rentError}
          rentRequired={
            mode === 'ALLOCATE' ||
            mode === 'RESERVE' ||
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
          catalogRentHint={resolvedStayKind === 'MONTHLY' ? catalogRent : null}
          catalogDepositHint={catalogDeposit}
          foodPolicy={effectiveFoodPolicy}
          onAddonsLayout={showRentDeposit ? reportAddonsLayout : undefined}
          addonsHighlighted={showRentDeposit ? addonsHighlighted : false}
          addonsFooter={showRentDeposit ? amenitiesSection : undefined}
        />
      </View>

      {!showRentDeposit && amenitiesSection ? (
        <View
          collapsable={false}
          style={addonsHighlighted ? styles.addonsHighlight : undefined}
          onLayout={event => {
            const { y, height } = event.nativeEvent.layout;
            formOffsetRef.current = 0;
            reportAddonsLayout(y, height);
          }}>
          {amenitiesSection}
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: spacing.sm },
  pageHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
    marginBottom: spacing.xs,
  },
  pageIcon: {
    width: 36,
    height: 36,
    borderRadius: radius.sm,
    backgroundColor: colors.successTint,
    borderWidth: 1,
    borderColor: `${colors.primary}33`,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  pageHeaderText: { flex: 1, minWidth: 0, gap: 2 },
  title: {
    ...typography.h3,
    fontSize: 20,
    lineHeight: 26,
    fontWeight: '700',
  },
  subtitle: {
    ...typography.caption,
    color: colors.muted,
    lineHeight: 17,
  },
  loader: { marginVertical: spacing.lg },
  policyLabel: { ...typography.bodyStrong, marginBottom: spacing.sm },
  policyRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs, marginBottom: spacing.sm },
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
    marginBottom: spacing.sm,
    gap: spacing.md,
  },
  switchCopy: { flex: 1 },
  switchLabel: { ...typography.bodyStrong },
  switchHint: { ...typography.caption, color: colors.muted, marginTop: spacing.xs },
  addonsHighlight: {
    ...progressiveSectionHighlightStyle,
    borderWidth: 1,
    borderRadius: radius.card,
    padding: spacing.sm,
    marginBottom: spacing.sm,
  },
});
