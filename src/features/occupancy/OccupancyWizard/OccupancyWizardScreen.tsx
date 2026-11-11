import React, { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { LucideIcon } from 'lucide-react-native';
import {
  ArrowRightLeft,
  BedDouble,
  CalendarDays,
  ClipboardCheck,
  FileText,
  Home,
  LogOut,
  Tag,
  UserRound,
} from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { memberApi } from '../../../api/memberApi';
import { occupancyApi } from '../../../api/occupancyApi';
import type {
  AmenityAssignment,
  BedSpaceListItemResponse,
  MemberResponse,
  OccupancyResponse,
  TransferRentPolicy,
} from '../../../api/types';
import { AllocationSuccessModal } from '../../../components/occupancy/AllocationSuccessModal';
import { ContactNumberLine } from '../../../components/member/ContactAndStayMeta';
import { StickyFormActions } from '../../../components/progressive';
import { DateField } from '../../../components/ui';
import { Screen } from '../../../components/ui/Screen';
import {
  formatOccupancyInventoryPath,
  formatOccupancyInventoryTitle,
} from '../../../utils/formatOccupancyInventoryTitle';
import { useMemberSearch } from '../../../hooks/useMemberSearch';
import {
  useResidentImportSearch,
  type ResidentPickerItem,
} from '../../../hooks/useResidentImportSearch';
import type { MainStackParamList } from '../../../navigation/types';
import { useSpaceStore } from '../../../store/spaceStore';
import { colors, pageContentGutter, radius, spacing, typography } from '../../../theme';
import { buildBedOccupancyTarget } from '../../../utils/buildOccupancyTarget';
import { fetchTargetCatalogDefaults } from '../../../utils/fetchTargetCatalogDefaults';
import {
  fetchSpaceOccupancyContext,
  type SpaceFoodPolicy,
} from '../../../utils/fetchSpaceFoodPolicy';
import {
  shouldBlockOccupancyWizardBoot,
  shouldRefetchAllocationTarget,
} from '../../../utils/occupancyWizardBoot';
import {
  defaultAssignedAmenities,
} from '../../../utils/amenities';
import { fetchPrefilledAllocationTarget } from '../../../utils/fetchPrefilledAllocationTarget';
import {
  emptyContractTermsFormValues,
  parseContractAmount,
  resolveContractFoodPolicy,
  validateContractTerms,
  type ContractTermsFormValues,
} from '../../../utils/occupancyContract';
import {
  formatTodayIsoDate,
  type OccupancyTargetSelection,
} from '../../../utils/occupancyRules';
import { hierarchyContextFromTarget, resolveOccupancySpaceTypeLabel, withSpaceHierarchyContext } from '../../../utils/occupancyHierarchyContext';
import { HeaderBackButton } from '../../../components/ui/HeaderBackButton';
import { useBuildings } from '../../../hooks/useBuildings';
import { OccupancyWizardStepHeader } from '../../../components/occupancy/OccupancyWizardStepHeader';
import { OccupancyWizardHeroBanner } from '../../../components/occupancy/OccupancyWizardHeroBanner';
import { getWizardSteps, getWizardStepTitleKey, getWizardTitleKey } from './occupancyWizardSteps';
import { navigateToMemberDetailsAfterOccupancy } from './navigation';
import { ContractTermsStep } from './steps/ContractTermsStep';
import { getMembershipErrorMessage } from '../../../utils/membershipErrors';
import { getOccupancyErrorMessage } from '../../../utils/occupancyErrors';
import {
  hasFieldErrors,
  validateNewMemberFields,
  type NewMemberFieldErrors,
} from '../../../utils/validateNewMemberFields';
import { MemberPickerStep, type MemberPickerMode } from './steps/MemberPickerStep';
import { ReserveDatesStep } from './steps/ReserveDatesStep';
import { ShortStayChoice } from './ShortStayChoice';
import { stayTypesAvailableForSpace } from '../../../utils/accommodationStaySupport';
import {
  pricingDefaultsForStayChoice,
  shortStayNightCount,
  stayChoiceDefaultLabel,
  stayChoiceLabelKey,
  type StayChoice,
} from '../../../utils/shortStay';
import { mealsApplicableForSpace } from '../../../utils/mealAccess';
import { ReviewStep } from './steps/ReviewStep';
import { TargetPickerStep } from './steps/TargetPickerStep';
import { TransferCurrentStep } from './steps/TransferCurrentStep';
import { VacateConfirmStep } from './steps/VacateConfirmStep';
import { useOccupancyWizardSubmit } from './useOccupancyWizardSubmit';
import type { OccupancyWizardStep } from './types';

type Props = NativeStackScreenProps<MainStackParamList, 'OccupancyWizard'>;

function getWizardModeIcon(mode: Props['route']['params']['mode']): LucideIcon {
  switch (mode) {
    case 'ALLOCATE':
      return Home;
    case 'RESERVE':
      return CalendarDays;
    case 'MOVE_IN':
      return Home;
    case 'TRANSFER':
      return ArrowRightLeft;
    case 'VACATE':
      return LogOut;
    default:
      return Home;
  }
}

function getWizardStepIcon(step: OccupancyWizardStep): LucideIcon {
  switch (step) {
    case 'member':
      return UserRound;
    case 'target':
      return BedDouble;
    case 'stay_type':
      return Tag;
    case 'stay_details':
      return CalendarDays;
    case 'contract':
      return FileText;
    case 'reserve_dates':
      return CalendarDays;
    case 'transfer_current':
      return ArrowRightLeft;
    case 'vacate_confirm':
      return LogOut;
    case 'review':
      return ClipboardCheck;
    default:
      return ClipboardCheck;
  }
}

function locationLabelFromHierarchy(
  context: {
    spaceName?: string;
    buildingName?: string;
    floorName?: string;
    unitName?: string;
    roomName?: string;
    bedName?: string;
  },
  translate: (key: string, opts?: { label?: string; defaultValue?: string }) => string,
): string {
  const title = formatOccupancyInventoryTitle(context, translate as never);
  const path = formatOccupancyInventoryPath(context);
  return [title, path].filter(Boolean).join(' · ');
}

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
    floorId,
    filterUnitId,
    occupancyId: initialOccupancyId,
  } = route.params;

  const mySpaces = useSpaceStore(state => state.mySpaces);
  const spaceType = useMemo(
    () => mySpaces.find(space => space.spaceId === spaceId)?.spaceType,
    [mySpaces, spaceId],
  );
  const spaceName = useMemo(
    () => mySpaces.find(space => space.spaceId === spaceId)?.spaceName,
    [mySpaces, spaceId],
  );

  // Stay types are stay-level (not space.shortStayEnabled). Available for all accommodation types.
  const stayTypesAvailable = stayTypesAvailableForSpace(spaceType);
  const steps = useMemo(
    () =>
      getWizardSteps(
        mode,
        {
          memberId: initialMemberId,
          bedId,
          roomId,
          unitId,
          occupancyId: initialOccupancyId,
        },
        { spaceType },
      ),
    [bedId, initialMemberId, initialOccupancyId, mode, roomId, spaceType, unitId],
  );

  const [stepIndex, setStepIndex] = useState(0);
  useEffect(() => {
    if (stepIndex >= steps.length) {
      setStepIndex(Math.max(0, steps.length - 1));
    }
  }, [stepIndex, steps.length]);
  const currentStep: OccupancyWizardStep = steps[stepIndex] ?? 'review';

  const [member, setMember] = useState<MemberResponse | null>(null);
  const [memberQuery, setMemberQuery] = useState('');
  const prefilledTarget = route.params.prefilledTarget ?? null;
  const [targetSelection, setTargetSelection] = useState<OccupancyTargetSelection | null>(
    prefilledTarget,
  );
  const [catalogRent, setCatalogRent] = useState<number | null>(
    route.params.catalogKnown ? route.params.catalogRent ?? null : null,
  );
  const [catalogDeposit, setCatalogDeposit] = useState<number | null>(
    route.params.catalogKnown ? route.params.catalogDeposit ?? null : null,
  );
  const [contractValues, setContractValues] = useState<ContractTermsFormValues>(
    emptyContractTermsFormValues(
      route.params.catalogKnown
        ? {
            defaultRent: route.params.catalogRent,
            defaultDeposit: route.params.catalogDeposit,
          }
        : undefined,
    ),
  );
  const [foodPolicy, setFoodPolicy] = useState<SpaceFoodPolicy>({
    foodIncludedInRent: false,
    defaultFoodCharge: null,
  });
  const [rentPolicy, setRentPolicy] = useState<TransferRentPolicy>('APPLY_NEW');
  const [moveInDate, setMoveInDate] = useState(() => formatTodayIsoDate());
  const [expectedExitDate, setExpectedExitDate] = useState('');
  const [stayChoice, setStayChoice] = useState<StayChoice>('MONTHLY');
  const [agreedTotalText, setAgreedTotalText] = useState('');
  const [moveInDateError, setMoveInDateError] = useState<string | null>(null);
  const [expectedExitError, setExpectedExitError] = useState<string | null>(null);
  const [agreedTotalError, setAgreedTotalError] = useState<string | null>(null);
  const moveInDateAnchorRef = useRef<View>(null);
  const expectedExitAnchorRef = useRef<View>(null);
  const contractRentAnchorRef = useRef<View>(null);
  const handleStayChoiceChange = useCallback(
    (next: StayChoice) => {
      setStayChoice(prev => {
        if (prev === next) {
          return prev;
        }
        const defaults = pricingDefaultsForStayChoice({
          choice: next,
          catalogRent,
          catalogDeposit,
        });
        setAgreedTotalText(defaults.agreedTotal);
        setAgreedTotalError(null);
        setExpectedExitError(null);
        setContractValues(current => ({
          ...current,
          rentSnapshot: defaults.rentSnapshot,
          depositSnapshot: defaults.depositSnapshot,
        }));
        if (defaults.clearExpectedExit) {
          setExpectedExitDate('');
        }
        return next;
      });
    },
    [catalogDeposit, catalogRent],
  );
  const [remarks, setRemarks] = useState('');
  const [agreementSigned, setAgreementSigned] = useState(false);
  const [allowEarlyMoveIn, setAllowEarlyMoveIn] = useState(false);
  const [currentOccupancy, setCurrentOccupancy] = useState<OccupancyResponse | null>(null);
  const [successPayload, setSuccessPayload] = useState<{
    operation: 'ALLOCATE' | 'RESERVE' | 'TRANSFER' | 'MOVE_IN';
    memberId: string;
    memberName: string;
    locationLabel: string;
  } | null>(null);

  useEffect(() => {
    if (!currentOccupancy || (mode !== 'TRANSFER' && mode !== 'MOVE_IN')) {
      return;
    }
    if (currentOccupancy.stayKind === 'SHORT' || currentOccupancy.stayKind === 'OPEN_ENDED') {
      setStayChoice(currentOccupancy.stayKind);
    } else {
      setStayChoice('MONTHLY');
    }
    if (currentOccupancy.agreedTotal != null) {
      setAgreedTotalText(String(currentOccupancy.agreedTotal));
    }
    const exit =
      currentOccupancy.expectedExitDate ?? currentOccupancy.expectedCheckoutDate ?? '';
    if (exit) {
      setExpectedExitDate(exit);
    }
  }, [currentOccupancy, mode]);
  const [occupancyId, setOccupancyId] = useState(initialOccupancyId);
  const [bootLoading, setBootLoading] = useState(() =>
    shouldBlockOccupancyWizardBoot({
      memberId: route.params.memberId,
      occupancyId: route.params.occupancyId,
    }),
  );
  const [formError, setFormError] = useState<string | null>(null);
  const [contractRentError, setContractRentError] = useState<string | null>(null);
  const [memberPickerMode, setMemberPickerMode] = useState<MemberPickerMode>('search');
  const [newMemberName, setNewMemberName] = useState('');
  const [newMemberMobile, setNewMemberMobile] = useState('');
  const [newMemberErrors, setNewMemberErrors] = useState<NewMemberFieldErrors>({});
  const [creatingMember, setCreatingMember] = useState(false);
  const [applyingTarget, setApplyingTarget] = useState(false);
  const [spaceAmenities, setSpaceAmenities] = useState<AmenityAssignment[]>([]);
  const [assignedAmenities, setAssignedAmenities] = useState<AmenityAssignment[]>([]);
  const memberAutoSelectSuppressRef = useRef(false);
  const memberAutoSelectKeyRef = useRef<string | null>(null);
  const scrollRef = useRef<ScrollView>(null);

  const scrollToAnchor = useCallback((anchor: View | null) => {
    if (!scrollRef.current) {
      return;
    }
    if (!anchor) {
      scrollRef.current.scrollTo({ y: 0, animated: true });
      return;
    }
    anchor.measureLayout(
      scrollRef.current as unknown as number,
      (_x, y) => {
        scrollRef.current?.scrollTo({ y: Math.max(0, y - 24), animated: true });
      },
      () => {
        scrollRef.current?.scrollTo({ y: 0, animated: true });
      },
    );
  }, []);

  const allowAddNewMember = mode === 'ALLOCATE' || mode === 'RESERVE';

  const memberSearchStatus =
    mode === 'VACATE' || mode === 'TRANSFER' ? 'ALLOCATED' : 'VACATED';

  const localMemberSearch = useMemberSearch(spaceId, memberQuery, {
    occupancyStatus: memberSearchStatus,
    enabled: currentStep === 'member' && !allowAddNewMember,
  });

  const importMemberSearch = useResidentImportSearch(spaceId, memberQuery, {
    enabled: currentStep === 'member' && allowAddNewMember && memberPickerMode === 'search',
  });

  const members: ResidentPickerItem[] = allowAddNewMember
    ? importMemberSearch.members
    : localMemberSearch.members;
  const membersLoading = allowAddNewMember
    ? importMemberSearch.loading
    : localMemberSearch.loading;
  const membersError = allowAddNewMember ? importMemberSearch.error : localMemberSearch.error;

  const { submit, loading: submitting } = useOccupancyWizardSubmit(spaceId);
  const { buildings } = useBuildings(spaceId, { enabled: currentStep === 'target' });
  const effectiveFoodPolicy = useMemo(
    () =>
      resolveContractFoodPolicy(
        foodPolicy,
        mode === 'TRANSFER' && rentPolicy === 'KEEP'
          ? currentOccupancy
          : mode === 'MOVE_IN'
            ? currentOccupancy
            : null,
      ),
    [currentOccupancy, foodPolicy, mode, rentPolicy],
  );
  const layoutMode = useMemo(() => {
    const resolvedBuildingId =
      targetSelection?.buildingId ?? buildingId ?? currentOccupancy?.buildingId;
    return buildings.find(item => item.buildingId === resolvedBuildingId)?.layoutMode;
  }, [buildingId, buildings, currentOccupancy?.buildingId, targetSelection?.buildingId]);
  const spaceTypeLabel = useMemo(() => {
    if (!spaceType) {
      return undefined;
    }
    return resolveOccupancySpaceTypeLabel(spaceType, layoutMode, t);
  }, [layoutMode, spaceType, t]);

  const hierarchyContext = useMemo(() => {
    let base;
    if (targetSelection) {
      base = hierarchyContextFromTarget(targetSelection);
    } else if (currentOccupancy) {
      base = hierarchyContextFromTarget({
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
      });
    } else {
      base = {};
    }
    return withSpaceHierarchyContext(base, spaceName, spaceTypeLabel);
  }, [currentOccupancy, spaceName, spaceTypeLabel, targetSelection]);

  // Tenant strip removed — member appears in compact inventory summary when needed
  // (avoids repeating name/mobile above the stepper on every step).
  const showMemberContext = false;
  const isTargetStep = currentStep === 'target';
  const stepTitle = t(getWizardStepTitleKey(currentStep));
  const stepLabels = useMemo(
    () => steps.map(step => t(getWizardStepTitleKey(step))),
    [steps, t],
  );
  const showStepHeader = currentStep !== 'vacate_confirm' && !isTargetStep;
  const ModeIcon = getWizardModeIcon(mode);
  const StepIcon = getWizardStepIcon(currentStep);
  const wizardTitle = t(getWizardTitleKey(mode));
  const stayTypeBannerLabel = stayTypesAvailable
    ? t(stayChoiceLabelKey(stayChoice), {
        defaultValue: stayChoiceDefaultLabel(stayChoice),
      })
    : null;

  const spaceContextLine = useMemo(() => {
    const parts = [spaceName, spaceTypeLabel].filter(Boolean);
    return parts.length > 0 ? parts.join(' · ') : null;
  }, [spaceName, spaceTypeLabel]);

  useEffect(() => {
    let cancelled = false;
    const blockForBoot = shouldBlockOccupancyWizardBoot({
      memberId: initialMemberId,
      occupancyId: initialOccupancyId,
    });
    const refetchTarget = shouldRefetchAllocationTarget({
      bedId,
      unitId,
      catalogKnown: route.params.catalogKnown,
    });
    async function bootstrap() {
      if (blockForBoot) {
        setBootLoading(true);
      }
      try {
        const occupancyContext = await fetchSpaceOccupancyContext(spaceId);
        if (cancelled) {
          return;
        }
        const policy = occupancyContext.foodPolicy;
        setFoodPolicy(policy);
        setSpaceAmenities(occupancyContext.amenities);
        setAssignedAmenities(current =>
          current.length > 0 ? current : defaultAssignedAmenities(occupancyContext.amenities),
        );

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

        const applyLoadedOccupancy = (occ: OccupancyResponse) => {
          setCurrentOccupancy(occ);
          setOccupancyId(occ.occupancyId);
          if (occ.amenities?.length) {
            setAssignedAmenities(occ.amenities);
          }
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
        };

        if (initialOccupancyId) {
          const occ = await occupancyApi.getOccupancy(spaceId, initialOccupancyId);
          if (!cancelled) {
            applyLoadedOccupancy(occ);
          }
        } else if (mode === 'MOVE_IN' && initialMemberId) {
          // Member profile can open Complete move-in with memberId only; resolve RESERVED row.
          const bundle = await occupancyApi.getMemberOccupancies(spaceId, initialMemberId);
          const reserved =
            bundle.reservedOccupancy ??
            bundle.occupancies?.find(item => item.status === 'RESERVED') ??
            null;
          if (!cancelled) {
            if (reserved) {
              applyLoadedOccupancy(reserved);
            } else {
              setFormError(t('occupancy.errors.noReserved'));
            }
          }
        }

        if (refetchTarget) {
          const prefilled = await fetchPrefilledAllocationTarget(spaceId, {
            bedId,
            roomId,
            unitId,
            buildingId,
          });
          if (!cancelled && prefilled) {
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
      } catch (err) {
        if (!cancelled && blockForBoot) {
          setFormError(getOccupancyErrorMessage(err));
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
    route.params.catalogKnown,
    spaceId,
    t,
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
      const prevStep = steps[stepIndex - 1];
      if (currentStep === 'target') {
        setApplyingTarget(false);
      }
      if (prevStep === 'member') {
        memberAutoSelectSuppressRef.current = true;
      }
      setStepIndex(stepIndex - 1);
    } else {
      navigation.goBack();
    }
  }, [currentStep, navigation, stepIndex, steps]);

  useLayoutEffect(() => {
    navigation.setOptions({
      headerBackVisible: false,
      title: t(getWizardTitleKey(mode)),
      headerLeft: () => <HeaderBackButton onPress={goBack} />,
    });
  }, [goBack, mode, navigation, t]);

  const handleMemberSelect = useCallback(
    async (selected: ResidentPickerItem) => {
      memberAutoSelectSuppressRef.current = false;
      setFormError(null);

      let resolved: MemberResponse = selected;
      if (allowAddNewMember && selected.needsImport && selected.memberId) {
        setCreatingMember(true);
        try {
          resolved = await memberApi.importMember(spaceId, {
            sourceMemberId: selected.memberId,
          });
        } catch (err) {
          setFormError(getMembershipErrorMessage(err, 'occupancyWizard.errors.importMember'));
          return;
        } finally {
          setCreatingMember(false);
        }
      }

      setMember(resolved);
      if (mode === 'TRANSFER' || mode === 'VACATE') {
        const bundle = await occupancyApi.getMemberOccupancies(spaceId, resolved.memberId);
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
        if (active.amenities?.length) {
          setAssignedAmenities(active.amenities);
        } else {
          setAssignedAmenities(defaultAssignedAmenities(spaceAmenities));
        }
      }
      goNext();
    },
    [allowAddNewMember, goNext, mode, spaceAmenities, spaceId, t],
  );

  useEffect(() => {
    if (currentStep !== 'member' || memberPickerMode !== 'search' || membersLoading) {
      return;
    }
    if (memberAutoSelectSuppressRef.current || members.length !== 1) {
      return;
    }
    const candidate = members[0];
    // Never auto-import across spaces — require an explicit tap.
    if (candidate.needsImport) {
      return;
    }
    const autoKey = `${candidate.memberId}:${memberQuery}`;
    if (memberAutoSelectKeyRef.current === autoKey) {
      return;
    }
    memberAutoSelectKeyRef.current = autoKey;
    void handleMemberSelect(candidate);
  }, [
    currentStep,
    handleMemberSelect,
    memberPickerMode,
    memberQuery,
    members,
    membersLoading,
  ]);

  const applyBedSelection = useCallback(
    async (bed: BedSpaceListItemResponse) => {
      if (applyingTarget) {
        return;
      }
      setFormError(null);
      setApplyingTarget(true);
      try {
        const selection = buildBedOccupancyTarget({
          buildingId: bed.buildingId,
          buildingName: bed.buildingName,
          floorId: bed.floorId ?? undefined,
          floorName: bed.floorName ?? undefined,
          unitId: bed.unitId ?? undefined,
          unitName: bed.unitName ?? undefined,
          roomId: bed.roomId,
          roomName: bed.roomName,
          bedId: bed.bedId,
          bedName: bed.label,
        });
        const catalog = await fetchTargetCatalogDefaults(
          spaceId,
          'BED',
          { bedId: bed.bedId },
          bed.roomId,
        );
        setTargetSelection(selection);
        setCatalogRent(catalog.defaultRent ?? null);
        setCatalogDeposit(catalog.defaultDeposit ?? null);
        setContractValues(
          emptyContractTermsFormValues(
            { defaultRent: catalog.defaultRent, defaultDeposit: catalog.defaultDeposit },
            foodPolicy,
          ),
        );
        goNext();
      } catch {
        setFormError(t('occupancy.errors.generic'));
      } finally {
        setApplyingTarget(false);
      }
    },
    [applyingTarget, foodPolicy, goNext, spaceId, t],
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

  const handleOccupancySuccess = useCallback(() => {
    if (
      (mode === 'ALLOCATE' || mode === 'RESERVE' || mode === 'TRANSFER' || mode === 'MOVE_IN') &&
      member
    ) {
      setSuccessPayload({
        operation: mode,
        memberId: member.memberId,
        memberName: member.fullName,
        locationLabel: locationLabelFromHierarchy(hierarchyContext, t) || spaceName || '',
      });
      return;
    }
    navigation.goBack();
  }, [hierarchyContext, member, mode, navigation, spaceName]);

  const handleConfirm = useCallback(async () => {
    setFormError(null);

    // Complete move-in activates an existing RESERVED row — never walk-in allocate.
    if (mode === 'MOVE_IN' && !occupancyId) {
      setFormError(t('occupancy.errors.noReserved'));
      return;
    }

    if (!spaceType || !member) {
      if (mode === 'VACATE' && member && occupancyId) {
        try {
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
        } catch (err) {
          setFormError(getOccupancyErrorMessage(err));
        }
        return;
      }
      setFormError(t('occupancy.errors.generic'));
      return;
    }

    let resolvedTarget = targetSelection;
    if (
      !resolvedTarget &&
      (mode === 'ALLOCATE' || mode === 'RESERVE' || mode === 'TRANSFER' || mode === 'MOVE_IN') &&
      (bedId || unitId)
    ) {
      try {
        const prefilled = await fetchPrefilledAllocationTarget(spaceId, {
          bedId,
          roomId,
          unitId,
          buildingId,
        });
        if (prefilled) {
          resolvedTarget = prefilled.selection;
          setTargetSelection(prefilled.selection);
          if (catalogRent == null && prefilled.row.defaultRent != null) {
            setCatalogRent(prefilled.row.defaultRent);
          }
        }
      } catch {
        // Fall through to target-required error below.
      }
    }

    if (
      (mode === 'ALLOCATE' || mode === 'RESERVE' || mode === 'TRANSFER') &&
      !resolvedTarget
    ) {
      setFormError(t('occupancy.errors.targetRequired'));
      return;
    }

    if (mode === 'ALLOCATE' && resolvedTarget?.bedId) {
      try {
        const fresh = await fetchPrefilledAllocationTarget(spaceId, {
          bedId: resolvedTarget.bedId,
          roomId: resolvedTarget.roomId,
          unitId: resolvedTarget.unitId,
          buildingId: resolvedTarget.buildingId,
        });
        if (!fresh?.row.selectable) {
          setFormError(t('occupancy.errors.targetUnavailable'));
          return;
        }
        resolvedTarget = fresh.selection;
        setTargetSelection(fresh.selection);
      } catch (err) {
        setFormError(getOccupancyErrorMessage(err));
        return;
      }
    }

    try {
      await submit({
        mode,
        spaceType,
        memberId: member.memberId,
        target: resolvedTarget!,
        catalogRent,
        contractValues,
        foodPolicy: effectiveFoodPolicy,
        rentPolicy,
        moveInDate,
        expectedExitDate,
        stayChoice,
        agreedTotal: parseContractAmount(agreedTotalText),
        shortStayEnabled: stayTypesAvailable,
        remarks,
        agreementSigned,
        allowEarlyMoveIn,
        occupancyId,
        currentOccupancy,
        assignedAmenities,
        onSuccess: handleOccupancySuccess,
        onInvalidContract: errorKey => {
          const message = t(errorKey);
          setFormError(message);
          if (errorKey === 'occupancy.contract.errors.rentRequired') {
            setContractRentError(message);
          }
          const contractIndex = steps.indexOf('contract');
          if (contractIndex >= 0) {
            setStepIndex(contractIndex);
          }
        },
      });
    } catch (err) {
      setFormError(getOccupancyErrorMessage(err));
    }
  }, [
    agreedTotalText,
    bedId,
    buildingId,
    catalogRent,
    contractValues,
    effectiveFoodPolicy,
    expectedExitDate,
    handleOccupancySuccess,
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
    assignedAmenities,
    roomId,
    spaceId,
    spaceType,
    stayChoice,
    stayTypesAvailable,
    steps,
    submit,
    t,
    targetSelection,
    unitId,
  ]);

  const contractRentRequired =
    mode === 'ALLOCATE' ||
    mode === 'MOVE_IN' ||
    rentPolicy === 'CUSTOM' ||
    (mode === 'TRANSFER' && rentPolicy === 'APPLY_NEW');

  const rejectInvalidContract = useCallback(() => {
    const validationError = validateContractTerms(contractValues, {
      rentRequired: contractRentRequired,
      foodPolicy: effectiveFoodPolicy,
    });
    if (!validationError) {
      setContractRentError(null);
      return false;
    }
    const message = t(validationError);
    setContractRentError(
      validationError === 'occupancy.contract.errors.rentRequired' ? message : null,
    );
    setFormError(message);
    const contractIndex = steps.indexOf('contract');
    if (contractIndex >= 0) {
      setStepIndex(contractIndex);
    }
    requestAnimationFrame(() => scrollToAnchor(contractRentAnchorRef.current));
    return true;
  }, [contractRentRequired, contractValues, effectiveFoodPolicy, scrollToAnchor, steps, t]);

  const handlePrimary = useCallback(() => {
    // Do not let Complete move-in advance/submit without a reserved occupancy id.
    if (mode === 'MOVE_IN' && !occupancyId) {
      setFormError(t('occupancy.errors.noReserved'));
      return;
    }
    if (currentStep === 'review' || currentStep === 'vacate_confirm') {
      const skipRentCheck = stayTypesAvailable && stayChoice === 'SHORT';
      if (currentStep === 'review' && !skipRentCheck && rejectInvalidContract()) {
        return;
      }
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
    if (currentStep === 'stay_details' || currentStep === 'reserve_dates') {
      setMoveInDateError(null);
      setExpectedExitError(null);
      setAgreedTotalError(null);
      if (!moveInDate.trim()) {
        const message = t('occupancy.errors.moveInDateRequired', {
          defaultValue: 'Please select a move-in date.',
        });
        setMoveInDateError(message);
        setFormError(message);
        requestAnimationFrame(() => scrollToAnchor(moveInDateAnchorRef.current));
        return;
      }
      if (stayTypesAvailable && stayChoice === 'SHORT' && !expectedExitDate.trim()) {
        const message = t('occupancy.errors.checkoutRequired', {
          defaultValue: 'Checkout date must be set for short stay.',
        });
        setExpectedExitError(message);
        setFormError(message);
        requestAnimationFrame(() => scrollToAnchor(expectedExitAnchorRef.current));
        return;
      }
      if (
        stayTypesAvailable &&
        stayChoice === 'SHORT' &&
        expectedExitDate.trim() &&
        moveInDate.trim() &&
        expectedExitDate.trim() <= moveInDate.trim()
      ) {
        const message = t('occupancy.errors.checkoutAfterMoveIn', {
          defaultValue:
            'A short stay checkout must be after the check-in date. The same date is not a stay.',
        });
        setExpectedExitError(message);
        setFormError(message);
        requestAnimationFrame(() => scrollToAnchor(expectedExitAnchorRef.current));
        return;
      }
      // Daily rent is collected on Contract Terms (not Reservation details).
    }
    if (currentStep === 'contract') {
      if (stayTypesAvailable && stayChoice === 'SHORT') {
        if (parseContractAmount(contractValues.rentSnapshot) == null) {
          const message = t('occupancy.errors.dailyRentRequired', {
            defaultValue: 'Please enter the daily rent.',
          });
          setAgreedTotalError(message);
          setContractRentError(message);
          setFormError(message);
          requestAnimationFrame(() => scrollToAnchor(contractRentAnchorRef.current));
          return;
        }
      } else if (rejectInvalidContract()) {
        return;
      }
    }
    setFormError(null);
    setContractRentError(null);
    setMoveInDateError(null);
    setExpectedExitError(null);
    setAgreedTotalError(null);
    goNext();
  }, [
    agreedTotalText,
    contractValues.rentSnapshot,
    currentStep,
    expectedExitDate,
    goNext,
    handleConfirm,
    handleCreateNewMember,
    member,
    memberPickerMode,
    mode,
    moveInDate,
    occupancyId,
    rejectInvalidContract,
    scrollToAnchor,
    stayTypesAvailable,
    stayChoice,
    t,
  ]);

  const usesListStep = currentStep === 'member' || currentStep === 'target';
  // Always show Continue on intermediate steps (mock design). Member search still auto-advances on tap.
  const showPrimaryButton = currentStep !== 'target';

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

  return (
    <Screen
      scrollable={false}
      style={usesListStep ? styles.listScreen : undefined}
      contentStyle={
        usesListStep
          ? isTargetStep
            ? styles.targetScreenContent
            : styles.listScreenContent
          : styles.stickyScreenContent
      }>
      {isTargetStep ? (
        <View style={styles.targetStepRoot}>
          <View style={styles.targetStepHeader}>
            <OccupancyWizardHeroBanner
              title={wizardTitle}
              Icon={ModeIcon}
              stayTypeLabel={stayTypeBannerLabel}
            />
            {member ? (
              <View style={styles.memberContext}>
                <Text style={styles.memberLabel}>{t('occupancyWizard.context.member')}</Text>
                <Text style={styles.memberValue}>{member.fullName}</Text>
                {member.mobileNumber ? (
                  <ContactNumberLine
                    value={member.mobileNumber}
                    name={member.fullName}
                    textStyle={styles.memberMobile}
                    showIcon={false}
                  />
                ) : null}
              </View>
            ) : null}
          </View>

          <View style={styles.targetStepBody}>
            <TargetPickerStep
              spaceId={spaceId}
              spaceType={spaceType}
              mode={mode}
              spaceContextLine={spaceContextLine}
              scopeFilters={{
                buildingId: buildingId ?? undefined,
                floorId: floorId ?? undefined,
                unitId: filterUnitId ?? (unitId && !bedId ? unitId : undefined),
              }}
              onBedAction={bed => {
                void applyBedSelection(bed);
              }}
            />
          </View>

          {formError ? (
            <View style={styles.errorBanner}>
              <Text style={styles.errorBannerText}>{formError}</Text>
            </View>
          ) : null}

          <StickyFormActions
            style={styles.wizardFooter}
            secondary={{
              label: t('common.back'),
              onPress: goBack,
              disabled: submitting || applyingTarget,
            }}
          />
        </View>
      ) : usesListStep ? (
        <View style={styles.listStepRoot}>
          <ScrollView
            style={styles.listStepScroll}
            contentContainerStyle={styles.listStepScrollContent}
            keyboardShouldPersistTaps="handled"
            keyboardDismissMode="on-drag"
            showsVerticalScrollIndicator={false}>
            <OccupancyWizardHeroBanner
              title={wizardTitle}
              Icon={ModeIcon}
              stayTypeLabel={stayTypeBannerLabel}
            />

            {showMemberContext && member ? (
              <View style={styles.memberContext}>
                <Text style={styles.memberLabel}>{t('occupancyWizard.context.member')}</Text>
                <Text style={styles.memberValue}>{member.fullName}</Text>
                {member.mobileNumber ? (
                  <ContactNumberLine
                    value={member.mobileNumber}
                    name={member.fullName}
                    textStyle={styles.memberMobile}
                    showIcon={false}
                  />
                ) : null}
              </View>
            ) : null}

            {showStepHeader ? (
              <OccupancyWizardStepHeader
                stepProgress={{ current: stepIndex + 1, total: steps.length }}
                stepLabels={stepLabels}
                stepTitle={stepTitle}
                stepHint={
                  currentStep === 'stay_type'
                    ? t('occupancyWizard.hints.chooseStayType', {
                        defaultValue:
                          'Select how long the member will stay and the pricing basis.',
                      })
                    : undefined
                }
                Icon={StepIcon}
                hierarchyContext={hierarchyContext}
                compactInventory={currentStep !== 'review'}
                showMemberSummary={
                  Boolean(member) &&
                  (currentStep === 'stay_details' ||
                    currentStep === 'contract' ||
                    currentStep === 'reserve_dates')
                }
                memberName={member?.fullName}
                memberMobile={member?.mobileNumber}
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
                crossSpaceReuse={allowAddNewMember}
                hideTitle
                embedInParentScroll
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
                selectedMemberId={member?.memberId}
                selectionError={formError}
                onSelect={handleMemberSelect}
              />
            ) : null}

            {formError && currentStep !== 'member' ? (
              <View style={styles.errorBanner}>
                <Text style={styles.errorBannerText}>{formError}</Text>
              </View>
            ) : null}
          </ScrollView>

          {showPrimaryButton ? (
            <StickyFormActions
              layout="row"
              style={styles.wizardFooter}
              primary={{
                label: primaryLabel,
                onPress: handlePrimary,
                loading: submitting || creatingMember,
                disabled: submitting || creatingMember,
              }}
              secondary={{
                label: t('common.back'),
                onPress: goBack,
                disabled: submitting || applyingTarget,
              }}
            />
          ) : (
            <StickyFormActions
              layout="row"
              style={styles.wizardFooter}
              secondary={{
                label: t('common.back'),
                onPress: goBack,
                disabled: submitting || applyingTarget,
              }}
            />
          )}
        </View>
      ) : (
        <View style={styles.formStepRoot}>
          <ScrollView
            ref={scrollRef}
            style={styles.formStepScroll}
            contentContainerStyle={styles.formStepScrollContent}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}>
            <OccupancyWizardHeroBanner
              title={wizardTitle}
              Icon={ModeIcon}
              stayTypeLabel={stayTypeBannerLabel}
            />

            {showMemberContext && member ? (
              <View style={styles.memberContext}>
                <Text style={styles.memberLabel}>{t('occupancyWizard.context.member')}</Text>
                <Text style={styles.memberValue}>{member.fullName}</Text>
                {member.mobileNumber ? (
                  <ContactNumberLine
                    value={member.mobileNumber}
                    name={member.fullName}
                    textStyle={styles.memberMobile}
                    showIcon={false}
                  />
                ) : null}
              </View>
            ) : null}

            {showStepHeader ? (
              <OccupancyWizardStepHeader
                stepProgress={{ current: stepIndex + 1, total: steps.length }}
                stepLabels={stepLabels}
                stepTitle={stepTitle}
                stepHint={
                  currentStep === 'stay_type'
                    ? t('occupancyWizard.hints.chooseStayType', {
                        defaultValue:
                          'Select how long the member will stay and the pricing basis.',
                      })
                    : undefined
                }
                Icon={StepIcon}
                hierarchyContext={hierarchyContext}
                compactInventory={currentStep !== 'review'}
                hideStepTitle={currentStep === 'contract' || currentStep === 'review'}
                showMemberSummary={
                  Boolean(member) &&
                  (currentStep === 'stay_details' ||
                    currentStep === 'contract' ||
                    currentStep === 'reserve_dates')
                }
                memberName={member?.fullName}
                memberMobile={member?.mobileNumber}
              />
            ) : null}

            {currentStep === 'stay_type' && stayTypesAvailable ? (
              <ShortStayChoice
                section="type"
                choice={stayChoice}
                agreedTotal={agreedTotalText}
                expectedExitDate={expectedExitDate}
                checkInDate={moveInDate}
                showCheckout={false}
                catalogRent={catalogRent}
                onChoiceChange={handleStayChoiceChange}
                onAgreedTotalChange={value => {
                  setAgreedTotalText(value);
                  if (agreedTotalError) {
                    setAgreedTotalError(null);
                  }
                }}
                onExpectedExitDateChange={value => {
                  setExpectedExitDate(value);
                  if (expectedExitError) {
                    setExpectedExitError(null);
                  }
                }}
              />
            ) : null}

            {currentStep === 'stay_details' ? (
              <>
                <View ref={moveInDateAnchorRef}>
                  <DateField
                    label={t('occupancy.section.moveInDate', { defaultValue: 'Move-in date' })}
                    value={moveInDate}
                    onChange={value => {
                      setMoveInDate(value);
                      setMoveInDateError(null);
                      setFormError(null);
                    }}
                    allowPastDates
                    error={moveInDateError ?? undefined}
                  />
                </View>
                {stayTypesAvailable ? (
                  <View ref={expectedExitAnchorRef}>
                    <ShortStayChoice
                      section="details"
                      choice={stayChoice}
                      agreedTotal={agreedTotalText}
                      expectedExitDate={expectedExitDate}
                      checkInDate={moveInDate}
                      showCheckout
                      catalogRent={catalogRent}
                      expectedExitError={expectedExitError}
                      onChoiceChange={handleStayChoiceChange}
                      onAgreedTotalChange={setAgreedTotalText}
                      onExpectedExitDateChange={value => {
                        setExpectedExitDate(value);
                        setExpectedExitError(null);
                        setFormError(null);
                      }}
                    />
                  </View>
                ) : null}
              </>
            ) : null}

            {currentStep === 'reserve_dates' ? (
              stayTypesAvailable && stayChoice === 'SHORT' ? (
                <View ref={moveInDateAnchorRef}>
                  <ReserveDatesStep
                    moveInDate={moveInDate}
                    expectedExitDate={expectedExitDate}
                    remarks={remarks}
                    showExpectedExit={false}
                    showTitle={false}
                    afterMoveIn={
                      <View ref={expectedExitAnchorRef}>
                        <ShortStayChoice
                          section="details"
                          choice={stayChoice}
                          agreedTotal={agreedTotalText}
                          expectedExitDate={expectedExitDate}
                          checkInDate={moveInDate}
                          showCheckout
                          catalogRent={catalogRent}
                          expectedExitError={expectedExitError}
                          onChoiceChange={handleStayChoiceChange}
                          onAgreedTotalChange={setAgreedTotalText}
                          onExpectedExitDateChange={value => {
                            setExpectedExitDate(value);
                            setExpectedExitError(null);
                            setFormError(null);
                          }}
                        />
                      </View>
                    }
                    onMoveInDateChange={value => {
                      setMoveInDate(value);
                      setMoveInDateError(null);
                      setFormError(null);
                    }}
                    onExpectedExitDateChange={value => {
                      setExpectedExitDate(value);
                      setExpectedExitError(null);
                      setFormError(null);
                    }}
                    onRemarksChange={setRemarks}
                  />
                </View>
              ) : (
                <>
                  {stayTypesAvailable ? (
                    <ShortStayChoice
                      section="details"
                      choice={stayChoice}
                      agreedTotal={agreedTotalText}
                      expectedExitDate={expectedExitDate}
                      checkInDate={moveInDate}
                      showCheckout={false}
                      catalogRent={catalogRent}
                      expectedExitError={expectedExitError}
                      onChoiceChange={handleStayChoiceChange}
                      onAgreedTotalChange={setAgreedTotalText}
                      onExpectedExitDateChange={value => {
                        setExpectedExitDate(value);
                        setExpectedExitError(null);
                        setFormError(null);
                      }}
                    />
                  ) : null}
                  <View ref={moveInDateAnchorRef}>
                    <ReserveDatesStep
                      moveInDate={moveInDate}
                      expectedExitDate={expectedExitDate}
                      remarks={remarks}
                      onMoveInDateChange={value => {
                        setMoveInDate(value);
                        if (moveInDateError) {
                          setMoveInDateError(null);
                        }
                      }}
                      onExpectedExitDateChange={value => {
                        setExpectedExitDate(value);
                        setExpectedExitError(null);
                        setFormError(null);
                      }}
                      onRemarksChange={setRemarks}
                    />
                  </View>
                </>
              )
            ) : null}

            {currentStep === 'transfer_current' && member && currentOccupancy ? (
              <TransferCurrentStep
                memberName={member.fullName}
                memberMobile={member.mobileNumber}
                occupancy={currentOccupancy}
              />
            ) : null}

            {currentStep === 'contract' ? (
              <View ref={contractRentAnchorRef}>
                <ContractTermsStep
                  spaceId={spaceId}
                  mode={
                    mode === 'TRANSFER'
                      ? 'TRANSFER'
                      : mode === 'MOVE_IN'
                        ? 'MOVE_IN'
                        : mode === 'RESERVE'
                          ? 'RESERVE'
                          : 'ALLOCATE'
                  }
                  values={contractValues}
                  rentError={contractRentError ?? agreedTotalError}
                  onChange={next => {
                    setContractValues(next);
                    if (stayChoice === 'SHORT') {
                      setAgreedTotalText(next.rentSnapshot);
                    }
                    if (parseContractAmount(next.rentSnapshot) != null) {
                      setContractRentError(null);
                      setAgreedTotalError(null);
                    }
                  }}
                  catalogRent={catalogRent}
                  catalogDeposit={catalogDeposit}
                  rentPolicy={rentPolicy}
                  onRentPolicyChange={setRentPolicy}
                  currentOccupancy={currentOccupancy}
                  moveInDate={
                    mode === 'ALLOCATE' || mode === 'MOVE_IN'
                      ? moveInDate
                      : currentOccupancy?.moveInDate
                  }
                  agreementSigned={agreementSigned}
                  onAgreementSignedChange={setAgreementSigned}
                  allowEarlyMoveIn={allowEarlyMoveIn}
                  onAllowEarlyMoveInChange={setAllowEarlyMoveIn}
                  spaceAmenities={spaceAmenities}
                  assignedAmenities={assignedAmenities}
                  onAssignedAmenitiesChange={setAssignedAmenities}
                  stayKind={stayTypesAvailable ? stayChoice : 'MONTHLY'}
                  shortStayNights={
                    stayChoice === 'SHORT' && moveInDate && expectedExitDate
                      ? shortStayNightCount(moveInDate, expectedExitDate)
                      : null
                  }
                  showFoodToggle={mealsApplicableForSpace(spaceType)}
                />
              </View>
            ) : null}

            {currentStep === 'review' && mode !== 'VACATE' ? (
              <ReviewStep
                mode={mode === 'MOVE_IN' ? 'MOVE_IN' : mode === 'TRANSFER' ? 'TRANSFER' : mode}
                member={member}
                hierarchyContext={hierarchyContext}
                hideTitle
                contractValues={contractValues}
                foodPolicy={
                  mealsApplicableForSpace(spaceType) ? effectiveFoodPolicy : undefined
                }
                rentPolicy={mode === 'TRANSFER' ? rentPolicy : undefined}
                moveInDate={moveInDate}
                expectedExitDate={expectedExitDate}
                agreedTotalPreview={
                  stayTypesAvailable && stayChoice === 'SHORT'
                    ? contractValues.rentSnapshot
                    : undefined
                }
                dailyRentMode={stayTypesAvailable && stayChoice === 'OPEN_ENDED'}
                stayChoice={stayTypesAvailable ? stayChoice : undefined}
                remarks={remarks}
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

            {formError ? (
              <View style={styles.errorBanner}>
                <Text style={styles.errorBannerText}>{formError}</Text>
              </View>
            ) : null}
          </ScrollView>

          {showPrimaryButton ? (
            <StickyFormActions
              layout="row"
              style={styles.wizardFooter}
              primary={{
                label: primaryLabel,
                onPress: handlePrimary,
                loading: submitting || creatingMember,
                disabled: submitting || creatingMember,
              }}
              secondary={{
                label: t('common.back'),
                onPress: goBack,
                disabled: submitting || applyingTarget,
              }}
            />
          ) : null}
        </View>
      )}

      <AllocationSuccessModal
        visible={successPayload != null}
        operation={successPayload?.operation ?? 'ALLOCATE'}
        memberName={successPayload?.memberName ?? ''}
        locationLabel={successPayload?.locationLabel ?? ''}
        onViewDetails={() => {
          const payload = successPayload;
          setSuccessPayload(null);
          if (payload) {
            navigateToMemberDetailsAfterOccupancy(navigation, spaceId, payload.memberId);
          } else {
            navigation.goBack();
          }
        }}
        onDone={() => {
          setSuccessPayload(null);
          navigation.goBack();
        }}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  listScreen: {
    // Explicit zeros — RN shorthand `padding: 0` can fail to clear Screen's
    // paddingHorizontal from an earlier style entry.
    paddingHorizontal: 0,
    paddingVertical: 0,
  },
  content: { paddingBottom: spacing.section },
  /**
   * Single page gutter at Screen (Member Details / Rooms). Children must not
   * add another horizontal inset. Sticky footer chrome is zeroed via wizardFooter.
   */
  stickyScreenContent: {
    flex: 1,
    paddingHorizontal: pageContentGutter,
    paddingTop: spacing.md,
    paddingBottom: 0,
    minHeight: 0,
  },
  formStepRoot: {
    flex: 1,
    minHeight: 0,
  },
  formStepScroll: {
    flex: 1,
  },
  formStepScrollContent: {
    paddingTop: 0,
    paddingBottom: spacing.xl,
  },
  listStepRoot: {
    flex: 1,
    minHeight: 0,
  },
  listStepScroll: {
    flex: 1,
  },
  listStepScrollContent: {
    flexGrow: 1,
    paddingTop: 0,
    paddingBottom: spacing.md,
  },
  listScreenContent: {
    flex: 1,
    paddingHorizontal: pageContentGutter,
    paddingTop: spacing.md,
    paddingBottom: 0,
    minHeight: 0,
  },
  targetScreenContent: {
    flex: 1,
    paddingHorizontal: pageContentGutter,
    paddingTop: spacing.md,
    paddingBottom: 0,
    minHeight: 0,
  },
  // Cancel stickyBarChrome horizontal — Screen already owns pageContentGutter.
  wizardFooter: {
    paddingHorizontal: 0,
  },
  targetStepRoot: {
    flex: 1,
    minHeight: 0,
  },
  targetStepHeader: {
    marginBottom: spacing.sm,
  },
  targetStepBody: {
    flex: 1,
    minHeight: 0,
  },
  memberContext: {
    marginBottom: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.card,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.border,
  },
  memberLabel: {
    ...typography.caption,
    color: colors.muted,
    marginBottom: 2,
  },
  memberValue: {
    ...typography.bodyStrong,
    color: colors.textPrimary,
  },
  memberMobile: {
    ...typography.caption,
    color: colors.textSecondary,
    marginTop: 2,
  },
  errorBanner: {
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FECACA',
    borderRadius: radius.button,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    marginTop: spacing.sm,
    marginBottom: spacing.sm,
  },
  errorBannerText: {
    ...typography.body,
    fontSize: 14,
    color: '#DC2626',
  },
});
