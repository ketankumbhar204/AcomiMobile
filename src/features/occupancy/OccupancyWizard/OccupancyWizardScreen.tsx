import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useTranslation } from 'react-i18next';
import { memberApi } from '../../../api/memberApi';
import { occupancyApi } from '../../../api/occupancyApi';
import type {
  AllocationTargetSearchResponse,
  MemberResponse,
  OccupancyResponse,
  TransferRentPolicy,
} from '../../../api/types';
import { Button } from '../../../components/ui';
import { Screen } from '../../../components/ui/Screen';
import { useMemberSearch } from '../../../hooks/useMemberSearch';
import type { MainStackParamList } from '../../../navigation/types';
import { useSpaceStore } from '../../../store/spaceStore';
import { colors, spacing, typography } from '../../../theme';
import {
  allocationTargetToSelection,
} from '../../../utils/allocationTargetSearch';
import { fetchSpaceFoodPolicy, type SpaceFoodPolicy } from '../../../utils/fetchSpaceFoodPolicy';
import { fetchPrefilledAllocationTarget } from '../../../utils/fetchPrefilledAllocationTarget';
import {
  emptyContractTermsFormValues,
  type ContractTermsFormValues,
} from '../../../utils/occupancyContract';
import { formatOccupancyTargetLines } from '../../../utils/occupancyBrowse';
import type { OccupancyTargetSelection } from '../../../utils/occupancyRules';
import { getWizardSteps, getWizardTitleKey } from './occupancyWizardSteps';
import { ContractTermsStep } from './steps/ContractTermsStep';
import { getMembershipErrorMessage } from '../../../utils/membershipErrors';
import {
  hasFieldErrors,
  validateNewMemberFields,
  type NewMemberFieldErrors,
} from '../../../utils/validateNewMemberFields';
import { WizardContextBanner } from './components/WizardContextBanner';
import { MemberPickerStep, type MemberPickerMode } from './steps/MemberPickerStep';
import { ReserveDatesStep } from './steps/ReserveDatesStep';
import { ReviewStep } from './steps/ReviewStep';
import { TargetPickerStep } from './steps/TargetPickerStep';
import { TransferCurrentStep } from './steps/TransferCurrentStep';
import { VacateConfirmStep } from './steps/VacateConfirmStep';
import { useOccupancyWizardSubmit } from './useOccupancyWizardSubmit';
import type { OccupancyWizardStep } from './types';

type Props = NativeStackScreenProps<MainStackParamList, 'OccupancyWizard'>;

export function OccupancyWizardScreen({ navigation, route }: Props) {
  const { t } = useTranslation();
  const {
    spaceId,
    mode,
    memberId: initialMemberId,
    bedId,
    roomId,
    unitId,
    buildingId,
    occupancyId: initialOccupancyId,
  } = route.params;

  const mySpaces = useSpaceStore(state => state.mySpaces);
  const spaceType = useMemo(
    () => mySpaces.find(space => space.spaceId === spaceId)?.spaceType,
    [mySpaces, spaceId],
  );

  const steps = useMemo(
    () =>
      getWizardSteps(mode, {
        memberId: initialMemberId,
        bedId,
        roomId,
        unitId,
        occupancyId: initialOccupancyId,
      }),
    [bedId, initialMemberId, initialOccupancyId, mode, roomId, unitId],
  );

  const [stepIndex, setStepIndex] = useState(0);
  const currentStep: OccupancyWizardStep = steps[stepIndex] ?? 'review';

  const [member, setMember] = useState<MemberResponse | null>(null);
  const [memberQuery, setMemberQuery] = useState('');
  const [targetRow, setTargetRow] = useState<AllocationTargetSearchResponse | null>(null);
  const [targetSelection, setTargetSelection] = useState<OccupancyTargetSelection | null>(null);
  const [catalogRent, setCatalogRent] = useState<number | null>(null);
  const [catalogDeposit, setCatalogDeposit] = useState<number | null>(null);
  const [contractValues, setContractValues] = useState<ContractTermsFormValues>(
    emptyContractTermsFormValues(),
  );
  const [foodPolicy, setFoodPolicy] = useState<SpaceFoodPolicy>({
    foodIncludedInRent: false,
    defaultFoodCharge: null,
  });
  const [rentPolicy, setRentPolicy] = useState<TransferRentPolicy>('APPLY_NEW');
  const [moveInDate, setMoveInDate] = useState('');
  const [expectedExitDate, setExpectedExitDate] = useState('');
  const [remarks, setRemarks] = useState('');
  const [agreementSigned, setAgreementSigned] = useState(false);
  const [allowEarlyMoveIn, setAllowEarlyMoveIn] = useState(false);
  const [currentOccupancy, setCurrentOccupancy] = useState<OccupancyResponse | null>(null);
  const [occupancyId, setOccupancyId] = useState(initialOccupancyId);
  const [bootLoading, setBootLoading] = useState(true);
  const [formError, setFormError] = useState<string | null>(null);
  const [memberPickerMode, setMemberPickerMode] = useState<MemberPickerMode>('search');
  const [newMemberName, setNewMemberName] = useState('');
  const [newMemberMobile, setNewMemberMobile] = useState('');
  const [newMemberErrors, setNewMemberErrors] = useState<NewMemberFieldErrors>({});
  const [enrollInMeals, setEnrollInMeals] = useState(false);
  const [creatingMember, setCreatingMember] = useState(false);

  useEffect(() => {
    const foodOn =
      foodPolicy.foodIncludedInRent ||
      contractValues.foodEnabled;
    if (foodOn) {
      setEnrollInMeals(true);
    }
  }, [contractValues.foodEnabled, foodPolicy.foodIncludedInRent]);

  const allowAddNewMember = mode === 'ALLOCATE' || mode === 'RESERVE';

  const memberSearchStatus =
    mode === 'VACATE' || mode === 'TRANSFER' ? 'ALLOCATED' : 'VACATED';

  const { members, loading: membersLoading, error: membersError } = useMemberSearch(
    spaceId,
    memberQuery,
    {
      occupancyStatus: memberSearchStatus,
      enabled: currentStep === 'member',
    },
  );

  const { submit, loading: submitting } = useOccupancyWizardSubmit(spaceId);

  const displayPath = useMemo(() => {
    if (targetRow?.displayPath) {
      return targetRow.displayPath;
    }
    if (targetSelection) {
      return formatOccupancyTargetLines(targetSelection).join(' · ');
    }
    if (currentOccupancy) {
      return formatOccupancyTargetLines({
        targetType: currentOccupancy.targetType,
        buildingId: currentOccupancy.buildingId,
        buildingName: currentOccupancy.buildingName,
        floorId: currentOccupancy.floorId ?? undefined,
        floorName: currentOccupancy.floorName ?? undefined,
        unitId: currentOccupancy.unitId ?? undefined,
        unitName: currentOccupancy.unitName ?? undefined,
        roomId: currentOccupancy.roomId ?? undefined,
        roomName: currentOccupancy.roomName ?? undefined,
        bedId: currentOccupancy.bedId ?? undefined,
        bedName: currentOccupancy.bedName ?? undefined,
      }).join(' · ');
    }
    return undefined;
  }, [currentOccupancy, targetRow, targetSelection]);

  const showContextBanner = Boolean(member && currentStep !== 'member');
  const showAccommodationInBanner = Boolean(
    displayPath &&
      (currentStep === 'reserve_dates' ||
        currentStep === 'contract' ||
        currentStep === 'review' ||
        currentStep === 'vacate_confirm'),
  );

  useEffect(() => {
    let cancelled = false;
    async function bootstrap() {
      setBootLoading(true);
      try {
        const [policy] = await Promise.all([fetchSpaceFoodPolicy(spaceId)]);
        if (cancelled) {
          return;
        }
        setFoodPolicy(policy);

        if (initialMemberId) {
          const details = await memberApi.getMember(spaceId, initialMemberId);
          if (!cancelled) {
            setMember({
              memberId: details.memberId,
              fullName: details.fullName,
              mobileNumber: details.mobileNumber,
              role: details.role,
              linkedUser: details.linkedUser,
              status: details.status,
              occupancyStatus: details.occupancyStatus,
              createdAt: details.createdAt,
            });
          }
        }

        if (initialOccupancyId) {
          const occ = await occupancyApi.getOccupancy(spaceId, initialOccupancyId);
          if (!cancelled) {
            setCurrentOccupancy(occ);
            setOccupancyId(occ.occupancyId);
            if (!initialMemberId) {
              setMember({
                memberId: occ.memberId,
                fullName: occ.memberName,
                mobileNumber: '',
                role: 'TENANT',
                linkedUser: false,
                status: 'ACTIVE',
                createdAt: '',
              });
            }
            if (mode === 'MOVE_IN') {
              setTargetSelection({
                targetType: occ.targetType,
                buildingId: occ.buildingId,
                buildingName: occ.buildingName,
                floorId: occ.floorId ?? undefined,
                floorName: occ.floorName ?? undefined,
                unitId: occ.unitId ?? undefined,
                unitName: occ.unitName ?? undefined,
                roomId: occ.roomId ?? undefined,
                roomName: occ.roomName ?? undefined,
                bedId: occ.bedId ?? undefined,
                bedName: occ.bedName ?? undefined,
              });
              setCatalogRent(occ.rentSnapshot ?? null);
              setContractValues(
                emptyContractTermsFormValues(
                  {
                    defaultRent: occ.rentSnapshot,
                    defaultDeposit: occ.depositSnapshot,
                  },
                  policy,
                ),
              );
            }
          }
        }

        if (bedId || unitId) {
          const prefilled = await fetchPrefilledAllocationTarget(spaceId, {
            bedId,
            roomId,
            unitId,
            buildingId,
          });
          if (!cancelled && prefilled) {
            setTargetRow(prefilled.row);
            setTargetSelection(prefilled.selection);
            setCatalogRent(prefilled.row.defaultRent ?? null);
            setCatalogDeposit(prefilled.row.defaultDeposit ?? null);
            setContractValues(
              emptyContractTermsFormValues(
                {
                  defaultRent: prefilled.row.defaultRent,
                  defaultDeposit: prefilled.row.defaultDeposit,
                },
                policy,
              ),
            );
          }
        }
      } finally {
        if (!cancelled) {
          setBootLoading(false);
        }
      }
    }
    void bootstrap();
    return () => {
      cancelled = true;
    };
  }, [
    bedId,
    buildingId,
    initialMemberId,
    initialOccupancyId,
    mode,
    roomId,
    spaceId,
    unitId,
  ]);

  const goNext = useCallback(() => {
    setFormError(null);
    if (stepIndex < steps.length - 1) {
      setStepIndex(stepIndex + 1);
    }
  }, [stepIndex, steps.length]);

  const goBack = useCallback(() => {
    setFormError(null);
    if (stepIndex > 0) {
      setStepIndex(stepIndex - 1);
    } else {
      navigation.goBack();
    }
  }, [navigation, stepIndex]);

  const handleMemberSelect = useCallback(
    async (selected: MemberResponse) => {
      setMember(selected);
      if (mode === 'TRANSFER' || mode === 'VACATE') {
        const bundle = await occupancyApi.getMemberOccupancies(spaceId, selected.memberId);
        const active =
          bundle.currentOccupancy ??
          bundle.occupancies?.find(o => o.status === 'ACTIVE') ??
          null;
        if (!active) {
          setFormError(t('occupancy.errors.noActive'));
          return;
        }
        setCurrentOccupancy(active);
        setOccupancyId(active.occupancyId);
      }
      goNext();
    },
    [goNext, mode, spaceId, t],
  );

  const handleTargetSelect = useCallback(
    (row: AllocationTargetSearchResponse) => {
      setTargetRow(row);
      setTargetSelection(allocationTargetToSelection(row));
      setCatalogRent(row.defaultRent ?? null);
      setCatalogDeposit(row.defaultDeposit ?? null);
      setContractValues(
        emptyContractTermsFormValues(
          { defaultRent: row.defaultRent, defaultDeposit: row.defaultDeposit },
          foodPolicy,
        ),
      );
      goNext();
    },
    [foodPolicy, goNext],
  );

  const handleCreateNewMember = useCallback(async () => {
    const errors = validateNewMemberFields(newMemberName, newMemberMobile);
    if (hasFieldErrors(errors)) {
      setNewMemberErrors(errors);
      return;
    }

    setNewMemberErrors({});
    setFormError(null);
    setCreatingMember(true);
    try {
      const created = await memberApi.createMember(spaceId, {
        fullName: newMemberName.trim(),
        mobileNumber: newMemberMobile.trim(),
        role: 'TENANT',
      });
      setMember(created);
      setMemberPickerMode('search');
      setNewMemberName('');
      setNewMemberMobile('');
      goNext();
    } catch (err) {
      setFormError(getMembershipErrorMessage(err, 'membership.errors.add'));
    } finally {
      setCreatingMember(false);
    }
  }, [goNext, newMemberMobile, newMemberName, spaceId]);

  const handleConfirm = useCallback(async () => {
    if (!spaceType || !member || !targetSelection) {
      if (mode === 'VACATE' && member && occupancyId) {
        await submit({
          mode,
          spaceType: spaceType!,
          memberId: member.memberId,
          target: targetSelection ?? {
            targetType: 'BED',
            buildingId: '',
            buildingName: '',
          },
          occupancyId,
          remarks,
          onSuccess: () => navigation.goBack(),
        });
        return;
      }
      setFormError(t('occupancy.errors.generic'));
      return;
    }

    await submit({
      mode,
      spaceType,
      memberId: member.memberId,
      target: targetSelection,
      catalogRent,
      contractValues,
      foodPolicy,
      rentPolicy,
      moveInDate,
      expectedExitDate,
      remarks,
      agreementSigned,
      allowEarlyMoveIn,
      occupancyId,
      currentOccupancy,
      enrollInMeals,
      onSuccess: () => navigation.goBack(),
    });
  }, [
    catalogRent,
    contractValues,
    enrollInMeals,
    expectedExitDate,
    foodPolicy,
    member,
    mode,
    moveInDate,
    navigation,
    occupancyId,
    currentOccupancy,
    remarks,
    agreementSigned,
    allowEarlyMoveIn,
    rentPolicy,
    spaceType,
    submit,
    t,
    targetSelection,
  ]);

  const handlePrimary = useCallback(() => {
    if (currentStep === 'review' || currentStep === 'vacate_confirm') {
      void handleConfirm();
      return;
    }
    if (currentStep === 'member') {
      if (memberPickerMode === 'new') {
        void handleCreateNewMember();
        return;
      }
      if (!member) {
        setFormError(t('occupancyWizard.errors.memberRequired'));
        return;
      }
      setFormError(null);
      goNext();
      return;
    }
    if (currentStep === 'reserve_dates' && !moveInDate.trim()) {
      setFormError(t('occupancy.errors.moveInDateRequired'));
      return;
    }
    setFormError(null);
    goNext();
  }, [
    currentStep,
    goNext,
    handleConfirm,
    handleCreateNewMember,
    member,
    memberPickerMode,
    moveInDate,
    t,
  ]);

  if (!spaceType || bootLoading) {
    return (
      <Screen>
        <ActivityIndicator color={colors.primary} />
      </Screen>
    );
  }

  const primaryLabel =
    currentStep === 'review' || currentStep === 'vacate_confirm'
      ? mode === 'VACATE'
        ? t('occupancy.vacate.confirm')
        : mode === 'RESERVE'
          ? t('occupancy.actions.reserve')
          : mode === 'MOVE_IN'
            ? t('occupancy.actions.moveIn')
            : mode === 'TRANSFER'
              ? t('occupancy.actions.transfer')
              : t('occupancy.actions.allocate')
      : t('common.continue');

  const usesListStep = currentStep === 'member' || currentStep === 'target';

  return (
    <Screen
      scrollable={!usesListStep}
      contentStyle={usesListStep ? styles.listScreenContent : styles.content}>
      <Text style={styles.heading}>{t(getWizardTitleKey(mode))}</Text>
      <Text style={styles.stepIndicator}>
        {t('occupancyWizard.stepProgress', {
          current: stepIndex + 1,
          total: steps.length,
        })}
      </Text>

      {showContextBanner && member ? (
        <WizardContextBanner
          member={member}
          accommodationPath={showAccommodationInBanner ? displayPath : undefined}
        />
      ) : null}

      {currentStep === 'member' ? (
        <MemberPickerStep
          query={memberQuery}
          onQueryChange={setMemberQuery}
          members={members}
          loading={membersLoading}
          error={membersError}
          preferredStatus={memberSearchStatus}
          allowAddNew={allowAddNewMember}
          pickerMode={memberPickerMode}
          onPickerModeChange={mode => {
            setMemberPickerMode(mode);
            setFormError(null);
            setNewMemberErrors({});
          }}
          newMemberName={newMemberName}
          newMemberMobile={newMemberMobile}
          onNewMemberNameChange={value => {
            setNewMemberName(value);
            if (newMemberErrors.fullName) {
              setNewMemberErrors(prev => ({ ...prev, fullName: undefined }));
            }
          }}
          onNewMemberMobileChange={value => {
            setNewMemberMobile(value);
            if (newMemberErrors.mobileNumber) {
              setNewMemberErrors(prev => ({ ...prev, mobileNumber: undefined }));
            }
          }}
          newMemberErrors={newMemberErrors}
          creatingMember={creatingMember}
          onSelect={handleMemberSelect}
        />
      ) : null}

      {currentStep === 'target' ? (
        <TargetPickerStep
          spaceId={spaceId}
          selectableOnly={mode === 'ALLOCATE' || mode === 'RESERVE'}
          onSelect={handleTargetSelect}
        />
      ) : null}

      {currentStep === 'reserve_dates' ? (
        <ReserveDatesStep
          moveInDate={moveInDate}
          expectedExitDate={expectedExitDate}
          remarks={remarks}
          displayPath={displayPath}
          onMoveInDateChange={setMoveInDate}
          onExpectedExitDateChange={setExpectedExitDate}
          onRemarksChange={setRemarks}
        />
      ) : null}

      {currentStep === 'transfer_current' && member && currentOccupancy ? (
        <TransferCurrentStep
          memberName={member.fullName}
          memberMobile={member.mobileNumber}
          occupancy={currentOccupancy}
        />
      ) : null}

      {currentStep === 'contract' ? (
        <ContractTermsStep
          spaceId={spaceId}
          mode={mode === 'TRANSFER' ? 'TRANSFER' : mode === 'MOVE_IN' ? 'MOVE_IN' : 'ALLOCATE'}
          values={contractValues}
          onChange={setContractValues}
          catalogRent={catalogRent}
          catalogDeposit={catalogDeposit}
          rentPolicy={rentPolicy}
          onRentPolicyChange={setRentPolicy}
          currentOccupancy={currentOccupancy}
          displayPath={displayPath}
          moveInDate={currentOccupancy?.moveInDate}
          agreementSigned={agreementSigned}
          onAgreementSignedChange={setAgreementSigned}
          allowEarlyMoveIn={allowEarlyMoveIn}
          onAllowEarlyMoveInChange={setAllowEarlyMoveIn}
        />
      ) : null}

      {currentStep === 'review' && mode !== 'VACATE' ? (
        <ReviewStep
          mode={mode === 'MOVE_IN' ? 'MOVE_IN' : mode === 'TRANSFER' ? 'TRANSFER' : mode}
          member={member}
          displayPath={displayPath}
          contractValues={contractValues}
          foodPolicy={foodPolicy}
          rentPolicy={mode === 'TRANSFER' ? rentPolicy : undefined}
          moveInDate={moveInDate}
          expectedExitDate={expectedExitDate}
          remarks={remarks}
          enrollInMeals={enrollInMeals}
          onEnrollInMealsChange={setEnrollInMeals}
          showMealEnrollment={
            (mode === 'ALLOCATE' || mode === 'MOVE_IN') &&
            (contractValues.foodEnabled || foodPolicy.foodIncludedInRent)
          }
        />
      ) : null}

      {currentStep === 'vacate_confirm' && member && currentOccupancy ? (
        <VacateConfirmStep
          memberName={member.fullName}
          memberMobile={member.mobileNumber}
          occupancy={currentOccupancy}
          remarks={remarks}
          onRemarksChange={setRemarks}
        />
      ) : null}

      {formError ? <Text style={styles.error}>{formError}</Text> : null}

      <View style={styles.actions}>
        <Button
          label={primaryLabel}
          onPress={handlePrimary}
          loading={submitting || creatingMember}
          disabled={submitting || creatingMember}
        />
        <Button label={t('common.back')} variant="ghost" onPress={goBack} disabled={submitting} />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { paddingBottom: spacing.section },
  listScreenContent: { paddingBottom: spacing.section, flex: 1 },
  heading: { ...typography.h2, marginBottom: spacing.xs },
  stepIndicator: { ...typography.caption, color: colors.muted, marginBottom: spacing.lg },
  error: { ...typography.caption, color: '#DC2626', marginVertical: spacing.sm },
  actions: { marginTop: spacing.lg, gap: spacing.sm },
});
