import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { memberApi } from '../../api/memberApi';
import { accommodationApi } from '../../api/accommodationApi';
import type {
  AmenityAssignment,
  BuildingResponse,
  BuildingSummaryResponse,
  FloorListItemResponse,
  MemberResponse,
  SpaceType,
  UnitListItemResponse,
} from '../../api/types';
import { Button } from '../ui';
import { ProgressiveWorkflowFooter } from '../progressive';
import { OccupancyWizardStepHeader } from './OccupancyWizardStepHeader';
import { OccupancyWizardTopBar } from './OccupancyWizardTopBar';
import { useSpaceStore } from '../../store/spaceStore';
import { ContractTermsStep } from '../../features/occupancy/OccupancyWizard/steps/ContractTermsStep';
import {
  MemberPickerStep,
  type MemberPickerMode,
} from '../../features/occupancy/OccupancyWizard/steps/MemberPickerStep';
import { ReserveDatesStep } from '../../features/occupancy/OccupancyWizard/steps/ReserveDatesStep';
import { ReviewStep } from '../../features/occupancy/OccupancyWizard/steps/ReviewStep';
import { useOccupancyWizardSubmit } from '../../features/occupancy/OccupancyWizard/useOccupancyWizardSubmit';
import { navigateToMemberDetailsAfterOccupancyFromRef } from '../../features/occupancy/OccupancyWizard/navigation';
import {
  useResidentImportSearch,
  type ResidentPickerItem,
} from '../../hooks/useResidentImportSearch';
import { useProgressiveSectionReview } from '../../hooks/useProgressiveSectionReview';
import { resolveProgressivePhase } from '../../utils/progressivePhase';
import { colors, radius, spacing, typography } from '../../theme';
import { getAccommodationErrorMessage } from '../../utils/accommodationErrors';
import { getAccommodationUiProfile } from '../../utils/accommodationProfile';
import { defaultAssignedAmenities } from '../../utils/amenities';
import { fetchPrefilledAllocationTarget } from '../../utils/fetchPrefilledAllocationTarget';
import { fetchSpaceAmenities } from '../../utils/fetchSpaceAmenities';
import { fetchSpaceFoodPolicy, type SpaceFoodPolicy } from '../../utils/fetchSpaceFoodPolicy';
import { getMembershipErrorMessage } from '../../utils/membershipErrors';
import { getOccupancyErrorMessage } from '../../utils/occupancyErrors';
import {
  emptyContractTermsFormValues,
  resolveContractFoodPolicy,
  type ContractTermsFormValues,
} from '../../utils/occupancyContract';
import { agentDebugLog } from '../../utils/agentDebugLog';
import {
  getHierarchySteps,
  getPostHierarchyWizardSteps,
  getTotalAllocationFlowSteps,
  hierarchyStepTitleKey,
  type HierarchyOccupancyScope,
  type HierarchyStep,
} from '../../utils/hierarchyOccupancySteps';
import { buildConfirmedHierarchyContext, resolveOccupancySpaceTypeLabel, withSpaceHierarchyContext } from '../../utils/occupancyHierarchyContext';
import {
  loadFloorsForBrowse,
  loadRoomBedGroupsForFloor,
  loadRoomBedGroupsForUnit,
  loadUnitsOnFloor,
  type OccupancyBrowseBedItem,
  type OccupancyBrowseRoomGroup,
} from '../../utils/occupancyBrowse';
import type { OccupancyTargetSelection } from '../../utils/occupancyRules';
import {
  hasFieldErrors,
  validateNewMemberFields,
  type NewMemberFieldErrors,
} from '../../utils/validateNewMemberFields';

type HierarchyOccupancyPickerModalProps = {
  visible: boolean;
  spaceId: string;
  spaceType: SpaceType;
  scope: HierarchyOccupancyScope;
  wizardMode: 'ALLOCATE' | 'RESERVE';
  bulkMode?: boolean;
  onClose: () => void;
};

type FlowPhase = 'hierarchy' | 'member' | 'contract' | 'reserve_dates' | 'review';

/** Occupancy browse only needs id, name, and layoutMode — not action/delete metadata. */
function buildingContextFromSummary(summary: BuildingSummaryResponse): BuildingResponse {
  return {
    buildingId: summary.buildingId,
    spaceId: summary.spaceId,
    name: summary.name,
    code: summary.code,
    layoutMode: summary.layoutMode,
    active: true,
    createdAt: '',
    updatedAt: '',
  };
}

type PendingHierarchySelection = {
  floor: FloorListItemResponse | null;
  unit: UnitListItemResponse | null;
  room: OccupancyBrowseRoomGroup | null;
};

function emptyPendingSelection(): PendingHierarchySelection {
  return { floor: null, unit: null, room: null };
}

type FloorOption = {
  id: string;
  label: string;
  subtitle: string;
  value: FloorListItemResponse;
};

type UnitOption = {
  id: string;
  label: string;
  subtitle: string;
  value: UnitListItemResponse;
};

type RoomOption = {
  id: string;
  label: string;
  subtitle: string;
  group: OccupancyBrowseRoomGroup;
};

function SelectRow({
  label,
  subtitle,
  selected,
  multi,
  onPress,
}: {
  label: string;
  subtitle?: string;
  selected: boolean;
  multi?: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.row,
        selected && styles.rowSelected,
        pressed && !selected && styles.rowPressed,
      ]}>
      <View
        style={[
          multi ? styles.checkboxOuter : styles.radioOuter,
          selected && (multi ? styles.checkboxOuterSelected : styles.radioOuterSelected),
        ]}>
        {selected ? (
          multi ? (
            <Text style={styles.checkboxMark}>✓</Text>
          ) : (
            <View style={styles.radioInner} />
          )
        ) : null}
      </View>
      <View style={styles.rowBody}>
        <Text style={styles.rowLabel}>{label}</Text>
        {subtitle ? <Text style={styles.rowSubtitle}>{subtitle}</Text> : null}
      </View>
    </Pressable>
  );
}

export function HierarchyOccupancyPickerModal({
  visible,
  spaceId,
  spaceType,
  scope,
  wizardMode,
  bulkMode = false,
  onClose,
}: HierarchyOccupancyPickerModalProps) {
  const { t } = useTranslation();
  const [phase, setPhase] = useState<FlowPhase>('hierarchy');
  const [building, setBuilding] = useState<BuildingResponse | null>(null);
  const [stepIndex, setStepIndex] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const pendingSelectionRef = useRef<PendingHierarchySelection>(emptyPendingSelection());
  const loadGenerationRef = useRef(0);
  const suppressAutoSelectRef = useRef(false);
  const memberAutoSelectSuppressRef = useRef(false);
  const memberAutoSelectKeyRef = useRef<string | null>(null);

  const effectiveLayoutMode = building?.layoutMode ?? scope.layoutMode;
  const steps = useMemo(
    () => getHierarchySteps(spaceType, effectiveLayoutMode, scope),
    [effectiveLayoutMode, scope, spaceType],
  );
  const postSteps = useMemo(() => getPostHierarchyWizardSteps(wizardMode), [wizardMode]);
  const totalSteps = useMemo(
    () => getTotalAllocationFlowSteps(steps, wizardMode),
    [steps, wizardMode],
  );

  const [selectedFloor, setSelectedFloor] = useState<FloorListItemResponse | null>(null);
  const [selectedUnit, setSelectedUnit] = useState<UnitListItemResponse | null>(null);
  const [selectedRoom, setSelectedRoom] = useState<OccupancyBrowseRoomGroup | null>(null);
  const [selectedBeds, setSelectedBeds] = useState<OccupancyBrowseBedItem[]>([]);

  const [floorOptions, setFloorOptions] = useState<FloorOption[]>([]);
  const [unitOptions, setUnitOptions] = useState<UnitOption[]>([]);
  const [roomOptions, setRoomOptions] = useState<RoomOption[]>([]);
  const [bedOptions, setBedOptions] = useState<OccupancyBrowseBedItem[]>([]);

  const [bedQueue, setBedQueue] = useState<OccupancyBrowseBedItem[]>([]);
  const [bedQueueIndex, setBedQueueIndex] = useState(0);
  const [activeTarget, setActiveTarget] = useState<OccupancyTargetSelection | null>(null);

  const [member, setMember] = useState<MemberResponse | null>(null);
  const [memberQuery, setMemberQuery] = useState('');
  const [memberPickerMode, setMemberPickerMode] = useState<MemberPickerMode>('search');
  const [newMemberName, setNewMemberName] = useState('');
  const [newMemberMobile, setNewMemberMobile] = useState('');
  const [newMemberErrors, setNewMemberErrors] = useState<NewMemberFieldErrors>({});
  const [creatingMember, setCreatingMember] = useState(false);

  const [catalogRent, setCatalogRent] = useState<number | null>(null);
  const [catalogDeposit, setCatalogDeposit] = useState<number | null>(null);
  const [contractValues, setContractValues] = useState<ContractTermsFormValues>(
    emptyContractTermsFormValues(),
  );
  const [foodPolicy, setFoodPolicy] = useState<SpaceFoodPolicy>({
    foodIncludedInRent: false,
    defaultFoodCharge: null,
  });
  const [spaceAmenities, setSpaceAmenities] = useState<AmenityAssignment[]>([]);
  const [assignedAmenities, setAssignedAmenities] = useState<AmenityAssignment[]>([]);
  const [moveInDate, setMoveInDate] = useState('');
  const [expectedExitDate, setExpectedExitDate] = useState('');
  const [remarks, setRemarks] = useState('');
  const [agreementSigned, setAgreementSigned] = useState(false);
  const contractScrollRef = useRef<ScrollView>(null);

  const currentHierarchyStep = steps[stepIndex] ?? null;
  const profile = getAccommodationUiProfile(spaceType, effectiveLayoutMode ?? 'CORRIDOR_PG');
  const showUnitsOnFloor = profile?.showUnitsOnFloor ?? false;

  const { submit, loading: submitting } = useOccupancyWizardSubmit(spaceId);

  const effectiveFoodPolicy = useMemo(
    () => resolveContractFoodPolicy(foodPolicy, null),
    [foodPolicy],
  );
  const { members, loading: membersLoading, error: membersError } = useResidentImportSearch(
    spaceId,
    memberQuery,
    { enabled: visible && phase === 'member' && memberPickerMode === 'search' },
  );

  const mySpaces = useSpaceStore(state => state.mySpaces);
  const spaceName = useMemo(
    () => mySpaces.find(space => space.spaceId === spaceId)?.spaceName,
    [mySpaces, spaceId],
  );
  const spaceTypeLabel = useMemo(
    () => resolveOccupancySpaceTypeLabel(spaceType, effectiveLayoutMode, t),
    [effectiveLayoutMode, spaceType, t],
  );

  const hierarchyContext = useMemo(
    () =>
      withSpaceHierarchyContext(
        buildConfirmedHierarchyContext(
          scope,
          building?.name,
          {
            floor: selectedFloor,
            unit: selectedUnit,
            room: selectedRoom,
          },
          {
            phase,
            currentHierarchyStep,
            activeTarget,
          },
        ),
        spaceName,
        spaceTypeLabel,
      ),
    [
      activeTarget,
      building?.name,
      currentHierarchyStep,
      phase,
      scope,
      selectedFloor,
      selectedRoom,
      selectedUnit,
      spaceName,
      spaceTypeLabel,
    ],
  );

  const currentStepNumber = useMemo(() => {
    if (phase === 'hierarchy') {
      return stepIndex + 1;
    }
    const postIndex = postSteps.indexOf(phase as (typeof postSteps)[number]);
    return postIndex >= 0 ? steps.length + postIndex + 1 : steps.length + 1;
  }, [phase, postSteps, stepIndex, steps.length]);

  const stepTitle = useMemo(() => {
    if (phase === 'hierarchy' && currentHierarchyStep) {
      return t(hierarchyStepTitleKey(currentHierarchyStep));
    }
    if (phase === 'member') {
      return t('occupancyWizard.steps.member');
    }
    if (phase === 'contract') {
      return t('occupancyWizard.steps.contract');
    }
    if (phase === 'reserve_dates') {
      return t('occupancyWizard.steps.reserveDates');
    }
    return t('occupancyWizard.steps.review');
  }, [currentHierarchyStep, phase, t]);

  const reset = useCallback(() => {
    pendingSelectionRef.current = emptyPendingSelection();
    loadGenerationRef.current += 1;
    suppressAutoSelectRef.current = false;
    memberAutoSelectSuppressRef.current = false;
    memberAutoSelectKeyRef.current = null;
    setPhase('hierarchy');
    setStepIndex(0);
    setError(null);
    setSelectedFloor(null);
    setSelectedUnit(null);
    setSelectedRoom(null);
    setSelectedBeds([]);
    setFloorOptions([]);
    setUnitOptions([]);
    setRoomOptions([]);
    setBedOptions([]);
    setBedQueue([]);
    setBedQueueIndex(0);
    setActiveTarget(null);
    setMember(null);
    setMemberQuery('');
    setMemberPickerMode('search');
    setNewMemberName('');
    setNewMemberMobile('');
    setNewMemberErrors({});
    setCatalogRent(null);
    setCatalogDeposit(null);
    setContractValues(emptyContractTermsFormValues());
    setMoveInDate('');
    setExpectedExitDate('');
    setRemarks('');
    setAgreementSigned(false);
  }, []);

  const applyTargetDefaults = useCallback(
    async (target: OccupancyTargetSelection) => {
      const [prefilled, policy] = await Promise.all([
        fetchPrefilledAllocationTarget(spaceId, {
          bedId: target.bedId,
          roomId: target.roomId,
          unitId: target.unitId,
          buildingId: target.buildingId,
        }),
        fetchSpaceFoodPolicy(spaceId),
      ]);
      setFoodPolicy(policy);
      if (prefilled) {
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
      // #region agent log
      agentDebugLog({
        hypothesisId: 'A',
        location: 'HierarchyOccupancyPickerModal.tsx:applyTargetDefaults',
        message: 'contract defaults seeded with food policy',
        data: {
          foodIncludedInRent: policy.foodIncludedInRent,
          defaultFoodCharge: policy.defaultFoodCharge,
          foodEnabled: emptyContractTermsFormValues(
            prefilled
              ? {
                  defaultRent: prefilled.row.defaultRent,
                  defaultDeposit: prefilled.row.defaultDeposit,
                }
              : undefined,
            policy,
          ).foodEnabled,
        },
        runId: 'movein-food',
      });
      // #endregion
    },
    [spaceId],
  );

  const beginPostHierarchy = useCallback(
    async (target: OccupancyTargetSelection, beds: OccupancyBrowseBedItem[]) => {
      setActiveTarget(target);
      setBedQueue(beds);
      setBedQueueIndex(0);
      setMember(null);
      setSelectedBeds(beds);
      setPhase('member');
      memberAutoSelectSuppressRef.current = false;
      memberAutoSelectKeyRef.current = null;
      void applyTargetDefaults(target).catch(() => {});
    },
    [applyTargetDefaults],
  );

  useEffect(() => {
    if (!visible) {
      reset();
      return;
    }

    setLoading(true);
    setError(null);

    void accommodationApi
      .getBuildingSummary(spaceId, scope.buildingId)
      .then(summary => {
        setBuilding(buildingContextFromSummary(summary));
      })
      .catch(err => {
        setError(getAccommodationErrorMessage(err, 'accommodation.errors.loadBuilding'));
      })
      .finally(() => setLoading(false));

    void fetchSpaceFoodPolicy(spaceId)
      .then(setFoodPolicy)
      .catch(() => {});

    void fetchSpaceAmenities(spaceId)
      .then(amenities => {
        setSpaceAmenities(amenities);
        setAssignedAmenities(defaultAssignedAmenities(amenities));
      })
      .catch(() => {});
  }, [reset, scope.buildingId, spaceId, visible]);

  const loadStepOptions = useCallback(async () => {
    if (!visible || !building || phase !== 'hierarchy' || !currentHierarchyStep) {
      return;
    }

    const loadGeneration = ++loadGenerationRef.current;
    setLoading(true);
    setError(null);

    const resolvedFloor =
      pendingSelectionRef.current.floor ??
      selectedFloor ??
      (scope.floorId
        ? ({ floorId: scope.floorId, name: scope.floorName ?? '' } as FloorListItemResponse)
        : null);
    const resolvedUnit =
      pendingSelectionRef.current.unit ??
      selectedUnit ??
      (scope.unitId
        ? ({
            unitId: scope.unitId,
            name: scope.unitName ?? '',
          } as UnitListItemResponse)
        : null);
    const resolvedRoom = pendingSelectionRef.current.room ?? selectedRoom;

    try {
      if (currentHierarchyStep === 'floor') {
        const floors = await loadFloorsForBrowse(spaceId, building.buildingId);
        if (loadGeneration !== loadGenerationRef.current) {
          return;
        }
        const options = floors
          .filter(floor => floor.available > 0)
          .map(floor => ({
            id: floor.floorId,
            label: floor.name,
            subtitle: t('occupancy.hierarchy.floorAvailability', {
              available: floor.available,
              total: floor.bedCount,
            }),
            value: floor,
          }));
        setFloorOptions(options);
        if (options.length === 1 && !suppressAutoSelectRef.current) {
          pendingSelectionRef.current.floor = options[0].value;
          setSelectedFloor(options[0].value);
          setStepIndex(index => index + 1);
        }
        return;
      }

      if (currentHierarchyStep === 'unit') {
        const floorId = resolvedFloor?.floorId;
        let units: UnitListItemResponse[] = [];
        if (floorId && showUnitsOnFloor) {
          units = await loadUnitsOnFloor(spaceId, building.buildingId, floorId);
        } else {
          const page = await accommodationApi.listUnits(spaceId, building.buildingId, {
            view: 'summary',
            size: 100,
          });
          units = page.content.filter(item => !item.synthetic);
        }
        if (loadGeneration !== loadGenerationRef.current) {
          return;
        }
        const options = units
          .filter(unit => unit.status === 'AVAILABLE' || unit.bedCount > 0)
          .map(unit => ({
            id: unit.unitId,
            label: unit.name,
            subtitle: t('occupancy.hierarchy.unitAvailability', {
              rooms: unit.roomCount,
              beds: unit.bedCount,
            }),
            value: unit,
          }));
        setUnitOptions(options);
        if (options.length === 1 && !suppressAutoSelectRef.current) {
          pendingSelectionRef.current.unit = options[0].value;
          setSelectedUnit(options[0].value);
          if (stepIndex < steps.length - 1) {
            setStepIndex(index => index + 1);
          } else if (spaceType === 'RENTAL') {
            void beginPostHierarchy(
              {
                targetType: 'UNIT',
                buildingId: building.buildingId,
                buildingName: building.name,
                unitId: options[0].value.unitId,
                unitName: options[0].value.name,
              },
              [],
            );
          }
        }
        return;
      }

      if (currentHierarchyStep === 'room') {
        let groups: OccupancyBrowseRoomGroup[] = [];
        const unitId = resolvedUnit?.unitId ?? scope.unitId;
        const floor = resolvedFloor;

        if (unitId) {
          groups = await loadRoomBedGroupsForUnit(
            spaceId,
            building,
            {
              unitId,
              unitName: resolvedUnit?.name ?? scope.unitName ?? '',
            },
            floor ? { floorId: floor.floorId, floorName: floor.name } : undefined,
          );
        } else if (floor) {
          groups = await loadRoomBedGroupsForFloor(spaceId, spaceType, building, floor);
        }
        if (loadGeneration !== loadGenerationRef.current) {
          return;
        }

        const options = groups.map(group => ({
          id: group.roomId,
          label: group.roomName,
          subtitle: t('occupancy.hierarchy.roomAvailability', {
            available: group.availableCount,
            total: group.bedCount,
          }),
          group,
        }));
        setRoomOptions(options);
        if (options.length === 1 && !suppressAutoSelectRef.current) {
          pendingSelectionRef.current.room = options[0].group;
          setSelectedRoom(options[0].group);
          setStepIndex(index => index + 1);
        }
        return;
      }

      if (currentHierarchyStep === 'bed') {
        let beds: OccupancyBrowseBedItem[] = [];
        if (resolvedRoom) {
          beds = resolvedRoom.beds;
        } else if (scope.roomId) {
          const page = await accommodationApi.listBeds(spaceId, scope.roomId, {
            view: 'summary',
            size: 50,
          });
          if (loadGeneration !== loadGenerationRef.current) {
            return;
          }
          beds = page.content
            .filter(bed => bed.status === 'AVAILABLE')
            .map(bed => ({
              bedId: bed.bedId,
              label: bed.label,
              selection: {
                targetType: 'BED' as const,
                buildingId: building.buildingId,
                buildingName: building.name,
                floorId: scope.floorId,
                floorName: scope.floorName,
                unitId: scope.unitId,
                unitName: scope.unitName,
                roomId: scope.roomId!,
                roomName: scope.roomName ?? '',
                bedId: bed.bedId,
                bedName: bed.label,
              },
            }));
        }
        if (loadGeneration !== loadGenerationRef.current) {
          return;
        }
        setBedOptions(beds);
        if (beds.length === 1 && !bulkMode && !suppressAutoSelectRef.current) {
          const bed = beds[0];
          if (loadGeneration === loadGenerationRef.current) {
            void beginPostHierarchy(bed.selection, [bed]);
          }
        }
      }
    } catch (err) {
      if (loadGeneration !== loadGenerationRef.current) {
        return;
      }
      setError(getAccommodationErrorMessage(err, 'occupancy.errors.loadTargets'));
    } finally {
      if (loadGeneration === loadGenerationRef.current) {
        setLoading(false);
      }
    }
  }, [
    building,
    bulkMode,
    currentHierarchyStep,
    phase,
    scope,
    selectedFloor,
    selectedRoom,
    selectedUnit,
    showUnitsOnFloor,
    spaceId,
    spaceType,
    stepIndex,
    steps.length,
    t,
    visible,
    beginPostHierarchy,
  ]);

  useEffect(() => {
    void loadStepOptions();
  }, [loadStepOptions, stepIndex, visible, phase]);

  function handleClose() {
    reset();
    onClose();
  }

  function toggleBed(bed: OccupancyBrowseBedItem) {
    setSelectedBeds(current => {
      const exists = current.some(item => item.bedId === bed.bedId);
      if (exists) {
        return current.filter(item => item.bedId !== bed.bedId);
      }
      return [...current, bed];
    });
  }

  function selectFloor(floor: FloorListItemResponse) {
    suppressAutoSelectRef.current = false;
    pendingSelectionRef.current.floor = floor;
    setSelectedFloor(floor);
    setError(null);
    setStepIndex(index => index + 1);
  }

  function selectUnit(unit: UnitListItemResponse) {
    suppressAutoSelectRef.current = false;
    pendingSelectionRef.current.unit = unit;
    setSelectedUnit(unit);
    setError(null);
    setStepIndex(current => {
      if (current < steps.length - 1) {
        return current + 1;
      }
      if (spaceType === 'RENTAL') {
        queueMicrotask(() => {
          void completeHierarchyForUnit(unit);
        });
      }
      return current;
    });
  }

  function selectRoom(room: OccupancyBrowseRoomGroup) {
    suppressAutoSelectRef.current = false;
    pendingSelectionRef.current.room = room;
    setSelectedRoom(room);
    setError(null);
    setStepIndex(index => index + 1);
  }

  function selectBed(bed: OccupancyBrowseBedItem) {
    suppressAutoSelectRef.current = false;
    setError(null);
    void beginPostHierarchy(bed.selection, [bed]);
  }

  async function completeHierarchyForUnit(unit: UnitListItemResponse) {
    if (!building) {
      return;
    }
    await beginPostHierarchy(
      {
        targetType: 'UNIT',
        buildingId: building.buildingId,
        buildingName: building.name,
        unitId: unit.unitId,
        unitName: unit.name,
      },
      [],
    );
  }

  function canContinueHierarchy(): boolean {
    if (!currentHierarchyStep) {
      return false;
    }
    switch (currentHierarchyStep) {
      case 'floor':
        return Boolean(selectedFloor);
      case 'unit':
        return Boolean(selectedUnit);
      case 'room':
        return Boolean(selectedRoom);
      case 'bed':
        return selectedBeds.length > 0;
      default:
        return false;
    }
  }

  async function completeHierarchy() {
    if (!building) {
      return;
    }

    if (currentHierarchyStep === 'bed') {
      const beds = bulkMode ? selectedBeds : [selectedBeds[0]];
      await beginPostHierarchy(beds[0].selection, beds);
      return;
    }

    if (currentHierarchyStep === 'unit' && spaceType === 'RENTAL' && selectedUnit) {
      await beginPostHierarchy(
        {
          targetType: 'UNIT',
          buildingId: building.buildingId,
          buildingName: building.name,
          unitId: selectedUnit.unitId,
          unitName: selectedUnit.name,
        },
        [],
      );
    }
  }

  function handleContinue() {
    setError(null);

    if (phase === 'hierarchy') {
      if (!canContinueHierarchy()) {
        return;
      }
      if (stepIndex < steps.length - 1) {
        setStepIndex(index => index + 1);
        return;
      }
      void completeHierarchy();
      return;
    }

    if (phase === 'member') {
      if (memberPickerMode === 'new') {
        void handleCreateNewMember();
        return;
      }
      if (!member) {
        setError(t('occupancyWizard.errors.memberRequired'));
        return;
      }
      setPhase(
        wizardMode === 'RESERVE'
          ? 'reserve_dates'
          : wizardMode === 'ALLOCATE'
            ? 'contract'
            : 'review',
      );
      return;
    }

    if (phase === 'contract') {
      setPhase('review');
      return;
    }

    if (phase === 'reserve_dates') {
      if (!moveInDate.trim()) {
        setError(t('occupancy.errors.moveInDateRequired'));
        return;
      }
      setPhase('review');
      return;
    }

    if (phase === 'review') {
      void handleConfirm();
    }
  }

  const handleMemberSelect = useCallback(
    async (selected: ResidentPickerItem) => {
      suppressAutoSelectRef.current = false;
      memberAutoSelectSuppressRef.current = false;
      setError(null);

      let resolved: MemberResponse = selected;
      if (selected.needsImport && selected.memberId) {
        setCreatingMember(true);
        try {
          resolved = await memberApi.importMember(spaceId, {
            sourceMemberId: selected.memberId,
          });
        } catch (err) {
          setError(getMembershipErrorMessage(err, 'occupancyWizard.errors.importMember'));
          return;
        } finally {
          setCreatingMember(false);
        }
      }

      setMember(resolved);
      setPhase(
        wizardMode === 'RESERVE'
          ? 'reserve_dates'
          : wizardMode === 'ALLOCATE'
            ? 'contract'
            : 'review',
      );
    },
    [spaceId, wizardMode],
  );

  useEffect(() => {
    if (phase !== 'member' || memberPickerMode !== 'search' || membersLoading) {
      return;
    }
    if (memberAutoSelectSuppressRef.current || members.length !== 1) {
      return;
    }
    const candidate = members[0];
    if (candidate.needsImport) {
      return;
    }
    const autoKey = `${candidate.memberId}:${memberQuery}`;
    if (memberAutoSelectKeyRef.current === autoKey) {
      return;
    }
    memberAutoSelectKeyRef.current = autoKey;
    void handleMemberSelect(candidate);
  }, [handleMemberSelect, memberPickerMode, memberQuery, members, membersLoading, phase]);

  const handleCreateNewMember = useCallback(async () => {
    const errors = validateNewMemberFields(newMemberName, newMemberMobile);
    if (hasFieldErrors(errors)) {
      setNewMemberErrors(errors);
      return;
    }

    setNewMemberErrors({});
    setError(null);
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
      setPhase(
        wizardMode === 'RESERVE'
          ? 'reserve_dates'
          : wizardMode === 'ALLOCATE'
            ? 'contract'
            : 'review',
      );
    } catch (err) {
      setError(getMembershipErrorMessage(err, 'membership.errors.add'));
    } finally {
      setCreatingMember(false);
    }
  }, [newMemberMobile, newMemberName, spaceId, wizardMode]);

  const handleConfirm = useCallback(async () => {
    if (!member || !activeTarget) {
      setError(t('occupancy.errors.targetRequired'));
      return;
    }

    setError(null);
    try {
      await submit({
        mode: wizardMode,
        spaceType,
        memberId: member.memberId,
        target: activeTarget,
        catalogRent,
        contractValues,
        foodPolicy: effectiveFoodPolicy,
        moveInDate,
        expectedExitDate,
        remarks,
        agreementSigned,
        assignedAmenities,
        onSuccess: async () => {
          const nextIndex = bedQueueIndex + 1;
          if (nextIndex < bedQueue.length) {
            const nextBed = bedQueue[nextIndex];
            setBedQueueIndex(nextIndex);
            setActiveTarget(nextBed.selection);
            setMember(null);
            setMemberQuery('');
            setMoveInDate('');
            setExpectedExitDate('');
            setRemarks('');
            await applyTargetDefaults(nextBed.selection);
            setPhase('member');
            return;
          }
          reset();
          onClose();
          if (wizardMode === 'ALLOCATE' || wizardMode === 'RESERVE') {
            navigateToMemberDetailsAfterOccupancyFromRef(spaceId, member.memberId);
          }
        },
      });
    } catch (err) {
      setError(getOccupancyErrorMessage(err));
    }
  }, [
    activeTarget,
    agreementSigned,
    applyTargetDefaults,
    assignedAmenities,
    bedQueue.length,
    bedQueueIndex,
    catalogRent,
    contractValues,
    expectedExitDate,
    effectiveFoodPolicy,
    member,
    moveInDate,
    onClose,
    remarks,
    reset,
    spaceId,
    spaceType,
    submit,
    t,
    wizardMode,
  ]);

  function handleBack() {
    setError(null);
    if (phase === 'review') {
      setPhase(
        wizardMode === 'RESERVE'
          ? 'reserve_dates'
          : wizardMode === 'ALLOCATE'
            ? 'contract'
            : 'member',
      );
      return;
    }
    if (phase === 'contract') {
      memberAutoSelectSuppressRef.current = true;
      setPhase('member');
      return;
    }
    if (phase === 'reserve_dates') {
      memberAutoSelectSuppressRef.current = true;
      setPhase('member');
      return;
    }
    if (phase === 'member') {
      suppressAutoSelectRef.current = true;
      setPhase('hierarchy');
      setStepIndex(Math.max(steps.length - 1, 0));
      return;
    }
    if (stepIndex > 0) {
      suppressAutoSelectRef.current = true;
      setStepIndex(index => index - 1);
    } else {
      handleClose();
    }
  }

  const title =
    wizardMode === 'RESERVE'
      ? t('occupancy.hierarchy.reserveTitle')
      : t('occupancy.hierarchy.allocateTitle');

  const showContinueButton =
    (phase === 'hierarchy' && bulkMode && currentHierarchyStep === 'bed') ||
    (phase === 'member' && memberPickerMode === 'new') ||
    phase === 'contract' ||
    phase === 'reserve_dates' ||
    phase === 'review';

  const primaryLabel =
    phase === 'review'
      ? wizardMode === 'RESERVE'
        ? t('occupancy.actions.reserve')
        : t('occupancy.actions.allocate')
      : phase === 'member' && memberPickerMode === 'new'
        ? t('occupancyWizard.memberMode.addNew')
        : t('common.continue');

  const contractProgressiveEnabled = phase === 'contract';

  const {
    reviewed: addonsReviewed,
    highlighted: addonsHighlighted,
    onSectionLayout: onAddonsLayout,
    onScroll: onAddonsScroll,
    onScrollBeginDrag: onAddonsScrollBeginDrag,
    continueToSection: continueToAddons,
    clearReviewed: clearAddonsReviewed,
  } = useProgressiveSectionReview({
    enabled: contractProgressiveEnabled,
  });

  useEffect(() => {
    if (phase === 'contract') {
      clearAddonsReviewed();
    }
  }, [clearAddonsReviewed, phase]);

  const contractFooterPhase = resolveProgressivePhase({
    enabled: contractProgressiveEnabled,
    prerequisiteMet: true,
    sectionReviewed: addonsReviewed,
  });

  const canContinue =
    phase === 'hierarchy'
      ? canContinueHierarchy()
      : phase === 'member'
        ? memberPickerMode === 'new' || Boolean(member)
        : phase === 'reserve_dates'
          ? Boolean(moveInDate.trim())
          : phase === 'contract' && contractProgressiveEnabled
            ? addonsReviewed
            : true;

  const bulkProgress =
    bedQueue.length > 1 ? `${bedQueueIndex + 1} / ${bedQueue.length}` : null;

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={handleClose}>
      <View style={styles.container}>
        <OccupancyWizardTopBar
          title={title}
          onBack={handleBack}
          onCancel={handleClose}
        />

        <OccupancyWizardStepHeader
          stepProgress={{ current: currentStepNumber, total: totalSteps }}
          stepTitle={stepTitle}
          hierarchyContext={hierarchyContext}
          bulkProgress={bulkProgress}
          bulkHint={
            phase === 'hierarchy' && currentHierarchyStep === 'bed' && bulkMode
              ? t('occupancy.hierarchy.bulkHint')
              : null
          }
        />

        {error ? (
          <View style={styles.errorBanner}>
            <Text style={styles.errorBannerText}>{error}</Text>
          </View>
        ) : null}

        {phase === 'hierarchy' ? (
          <>
            <ScrollView style={styles.list} contentContainerStyle={styles.listContent}>
              {loading ? <ActivityIndicator color={colors.primary} style={styles.loader} /> : null}
              {currentHierarchyStep === 'floor'
                ? floorOptions.map(option => (
                    <SelectRow
                      key={option.id}
                      label={option.label}
                      subtitle={option.subtitle}
                      selected={selectedFloor?.floorId === option.id}
                      onPress={() => selectFloor(option.value)}
                    />
                  ))
                : null}
              {currentHierarchyStep === 'unit'
                ? unitOptions.map(option => (
                    <SelectRow
                      key={option.id}
                      label={option.label}
                      subtitle={option.subtitle}
                      selected={selectedUnit?.unitId === option.id}
                      onPress={() => selectUnit(option.value)}
                    />
                  ))
                : null}
              {currentHierarchyStep === 'room'
                ? roomOptions.map(option => (
                    <SelectRow
                      key={option.id}
                      label={option.label}
                      subtitle={option.subtitle}
                      selected={selectedRoom?.roomId === option.id}
                      onPress={() => selectRoom(option.group)}
                    />
                  ))
                : null}
              {currentHierarchyStep === 'bed'
                ? bedOptions.map(bed => (
                    <SelectRow
                      key={bed.bedId}
                      label={bed.label}
                      selected={selectedBeds.some(item => item.bedId === bed.bedId)}
                      multi={bulkMode}
                      onPress={() => (bulkMode ? toggleBed(bed) : selectBed(bed))}
                    />
                  ))
                : null}
              {!loading &&
              currentHierarchyStep &&
              ((currentHierarchyStep === 'floor' && floorOptions.length === 0) ||
                (currentHierarchyStep === 'unit' && unitOptions.length === 0) ||
                (currentHierarchyStep === 'room' && roomOptions.length === 0) ||
                (currentHierarchyStep === 'bed' && bedOptions.length === 0)) ? (
                <Text style={styles.empty}>{t('occupancy.hierarchy.noAvailable')}</Text>
              ) : null}
            </ScrollView>
          </>
        ) : null}

        {phase === 'member' ? (
          <View style={styles.flexStep}>
            <MemberPickerStep
              query={memberQuery}
              onQueryChange={setMemberQuery}
              members={members}
              loading={membersLoading}
              error={membersError}
              preferredStatus="VACATED"
              allowAddNew
              crossSpaceReuse
              hideTitle
              pickerMode={memberPickerMode}
              onPickerModeChange={mode => {
                setMemberPickerMode(mode);
                setError(null);
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
              onSelect={handleMemberSelect}
            />
          </View>
        ) : null}

        {phase === 'contract' ? (
          <ScrollView
            ref={contractScrollRef}
            style={styles.list}
            contentContainerStyle={styles.listContent}
            scrollEventThrottle={16}
            onScrollBeginDrag={onAddonsScrollBeginDrag}
            onScroll={event => {
              const { contentOffset, layoutMeasurement } = event.nativeEvent;
              onAddonsScroll(contentOffset.y, layoutMeasurement.height);
            }}>
            <ContractTermsStep
              spaceId={spaceId}
              mode="ALLOCATE"
              values={contractValues}
              onChange={setContractValues}
              catalogRent={catalogRent}
              catalogDeposit={catalogDeposit}
              agreementSigned={agreementSigned}
              onAgreementSignedChange={setAgreementSigned}
              spaceAmenities={spaceAmenities}
              assignedAmenities={assignedAmenities}
              onAssignedAmenitiesChange={setAssignedAmenities}
              onAddonsLayout={onAddonsLayout}
              addonsHighlighted={addonsHighlighted}
            />
          </ScrollView>
        ) : null}

        {phase === 'reserve_dates' ? (
          <ScrollView style={styles.list} contentContainerStyle={styles.listContent}>
            <ReserveDatesStep
              moveInDate={moveInDate}
              expectedExitDate={expectedExitDate}
              remarks={remarks}
              onMoveInDateChange={setMoveInDate}
              onExpectedExitDateChange={setExpectedExitDate}
              onRemarksChange={setRemarks}
            />
          </ScrollView>
        ) : null}

        {phase === 'review' && member ? (
          <ScrollView style={styles.list} contentContainerStyle={styles.listContent}>
            <ReviewStep
              mode={wizardMode}
              member={member}
              hierarchyContext={hierarchyContext}
              hideTitle
              contractValues={wizardMode === 'ALLOCATE' ? contractValues : undefined}
              foodPolicy={effectiveFoodPolicy}
              moveInDate={moveInDate}
              expectedExitDate={expectedExitDate}
              remarks={remarks}
            />
          </ScrollView>
        ) : null}

        <View style={styles.footer}>
          {phase === 'contract' && contractProgressiveEnabled ? (
            <ProgressiveWorkflowFooter
              phase={contractFooterPhase}
              stepLabel={t('progressiveWorkflow.stepOf', {
                current: contractFooterPhase === 'continue' ? 1 : 2,
                total: 2,
              })}
              progressLine={
                contractFooterPhase === 'continue'
                  ? t('progressiveWorkflow.occupancy.progressRentNext')
                  : t('progressiveWorkflow.occupancy.progressReady')
              }
              continueEyebrow={t('progressiveWorkflow.nextStep')}
              continueTitle={t('progressiveWorkflow.occupancy.reviewAddonsTitle')}
              continueHint={t('progressiveWorkflow.occupancy.reviewAddonsHint')}
              continueLabel={t('progressiveWorkflow.occupancy.continueToAddons')}
              onContinue={() => continueToAddons(contractScrollRef)}
              primaryAction={{
                label: primaryLabel,
                onPress: handleContinue,
                disabled: !canContinue || loading || submitting || creatingMember,
                loading: submitting || creatingMember,
              }}
              secondaryAction={{
                label: t('common.back'),
                onPress: handleBack,
                disabled: submitting || creatingMember,
              }}
              style={styles.progressiveFooter}
              minHeight={160}
            />
          ) : (
            <>
              {showContinueButton ? (
                <Button
                  label={primaryLabel}
                  onPress={handleContinue}
                  disabled={!canContinue || loading || submitting || creatingMember}
                  loading={submitting || creatingMember}
                />
              ) : null}
              <Button
                label={t('common.back')}
                variant="ghost"
                onPress={handleBack}
                disabled={submitting || creatingMember}
              />
            </>
          )}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    paddingTop: spacing.xl,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.xl,
    marginBottom: spacing.sm,
  },
  headerTitle: {
    ...typography.h3,
  },
  close: {
    ...typography.bodyStrong,
    color: colors.primary,
  },
  stepTitle: {
    ...typography.bodyStrong,
    paddingHorizontal: spacing.xl,
    marginBottom: spacing.sm,
  },
  errorBanner: {
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FECACA',
    borderRadius: radius.button,
    padding: spacing.md,
    marginHorizontal: spacing.xl,
    marginBottom: spacing.sm,
  },
  errorBannerText: {
    ...typography.body,
    fontSize: 14,
    color: '#DC2626',
  },
  list: {
    flex: 1,
  },
  listContent: {
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.xl,
    gap: spacing.sm,
  },
  flexStep: {
    flex: 1,
    paddingHorizontal: spacing.xl,
  },
  loader: {
    marginVertical: spacing.lg,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.md,
    backgroundColor: colors.white,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.06,
        shadowRadius: 3,
      },
      android: { elevation: 2 },
    }),
  },
  rowSelected: {
    borderColor: colors.primary,
    borderWidth: 2,
    backgroundColor: colors.lightGreen,
  },
  rowPressed: {
    opacity: 0.88,
  },
  radioOuter: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  radioOuterSelected: {
    borderColor: colors.primary,
  },
  radioInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: colors.primary,
  },
  checkboxOuter: {
    width: 20,
    height: 20,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  checkboxOuterSelected: {
    borderColor: colors.primary,
    backgroundColor: colors.primary,
  },
  checkboxMark: {
    color: colors.white,
    fontSize: 12,
    fontWeight: '700',
    lineHeight: 14,
  },
  rowBody: {
    flex: 1,
    gap: 2,
  },
  rowLabel: {
    ...typography.bodyStrong,
  },
  rowSubtitle: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  empty: {
    ...typography.body,
    color: colors.muted,
    textAlign: 'center',
    marginTop: spacing.xl,
  },
  footer: {
    padding: spacing.xl,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    backgroundColor: colors.white,
    gap: spacing.sm,
  },
  progressiveFooter: {
    borderTopWidth: 0,
    marginHorizontal: -spacing.xl,
    marginBottom: -spacing.xl,
    paddingHorizontal: spacing.xl,
  },
});
