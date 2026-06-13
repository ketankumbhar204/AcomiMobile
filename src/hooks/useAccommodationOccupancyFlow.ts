import { useCallback, useState } from 'react';
import { useTranslation } from 'react-i18next';
import type {
  AccommodationStatus,
  MemberResponse,
  OccupancyResponse,
  SpaceType,
} from '../api/types';
import { useConfirmDialog } from '../components/ui';
import { useOccupancyMutations } from './useOccupancyMutations';
import { useToastStore } from '../store/toastStore';
import { fetchTargetOccupancy } from '../utils/fetchTargetOccupancy';
import { isOccupancyTargetSupported } from '../utils/buildOccupancyTarget';
import {
  buildAllocateRequest,
  buildReserveRequest,
  buildTransferRequest,
  type OccupancyTargetSelection,
} from '../utils/occupancyRules';
import type { MoveInFormValues } from '../components/occupancy/MoveInModal';
import type {
  OccupancyPickerExtras,
  OccupancyPickerMode,
} from '../components/occupancy/OccupancyTargetPickerModal';

export type OccupancyFlowContext = {
  target: OccupancyTargetSelection;
  accommodationStatus: AccommodationStatus;
  occupancy?: OccupancyResponse | null;
};

type UseAccommodationOccupancyFlowOptions = {
  spaceId: string;
  spaceType: SpaceType;
  canManage?: boolean;
  onSuccess?: () => void;
};

export function useAccommodationOccupancyFlow({
  spaceId,
  spaceType,
  canManage = true,
  onSuccess,
}: UseAccommodationOccupancyFlowOptions) {
  const { t } = useTranslation();
  const showToast = useToastStore(state => state.showToast);
  const { showConfirm } = useConfirmDialog();
  const {
    allocate,
    reserve,
    moveIn,
    cancelReservation,
    transfer,
    vacate,
    loading,
    error,
    clearError,
  } = useOccupancyMutations(spaceId);

  const [flowContext, setFlowContext] = useState<OccupancyFlowContext | null>(null);
  const [memberPickerVisible, setMemberPickerVisible] = useState(false);
  const [allocationMode, setAllocationMode] = useState<OccupancyPickerMode>('WALK_IN');
  const [allocationVisible, setAllocationVisible] = useState(false);
  const [selectedMember, setSelectedMember] = useState<MemberResponse | null>(null);
  const [transferVisible, setTransferVisible] = useState(false);
  const [moveInVisible, setMoveInVisible] = useState(false);
  const [resolvingOccupancy, setResolvingOccupancy] = useState(false);

  const target = flowContext?.target ?? null;
  const accommodationStatus = flowContext?.accommodationStatus ?? null;
  const occupancy = flowContext?.occupancy ?? null;

  const isEnabled = Boolean(
    canManage && target && isOccupancyTargetSupported(spaceType, target.targetType),
  );

  const ensureContext = useCallback(
    async (context: OccupancyFlowContext) => {
      setFlowContext(context);
      if (
        (context.accommodationStatus === 'OCCUPIED' ||
          context.accommodationStatus === 'RESERVED') &&
        !context.occupancy
      ) {
        setResolvingOccupancy(true);
        try {
          const resolved = await fetchTargetOccupancy(spaceId, {
            bedId: context.target.bedId,
            roomId: context.target.roomId,
            unitId: context.target.unitId,
          });
          setFlowContext({ ...context, occupancy: resolved });
          return { ...context, occupancy: resolved };
        } finally {
          setResolvingOccupancy(false);
        }
      }
      return context;
    },
    [spaceId],
  );

  const closeAllocationFlow = useCallback(() => {
    setAllocationVisible(false);
    setMemberPickerVisible(false);
    setSelectedMember(null);
  }, []);

  const afterMutation = useCallback(async () => {
    showToast(t('occupancy.success.updated'));
    onSuccess?.();
  }, [onSuccess, showToast, t]);

  const openMemberPicker = useCallback(
    async (context: OccupancyFlowContext, mode: OccupancyPickerMode) => {
      clearError();
      await ensureContext(context);
      setAllocationMode(mode);
      setMemberPickerVisible(true);
    },
    [clearError, ensureContext],
  );

  const handleMemberSelected = useCallback((member: MemberResponse) => {
    setSelectedMember(member);
    setMemberPickerVisible(false);
    setAllocationVisible(true);
  }, []);

  const handleReserve = useCallback(
    async (extras?: OccupancyPickerExtras) => {
      if (!selectedMember || !target) {
        return;
      }
      clearError();
      const { body, errorKey } = buildReserveRequest(
        selectedMember.memberId,
        spaceType,
        target.targetType,
        {
          bedId: target.bedId,
          roomId: target.roomId,
          unitId: target.unitId,
        },
        {
          moveInDate: extras?.moveInDate ?? '',
          expectedExitDate: extras?.expectedExitDate,
          expectedCheckoutDate: extras?.expectedCheckoutDate,
          memberCategory: extras?.memberCategory,
          remarks: extras?.remarks,
        },
      );
      if (!body || errorKey) {
        showToast(t(errorKey ?? 'occupancy.errors.generic'));
        return;
      }
      try {
        await reserve(body);
        closeAllocationFlow();
        await afterMutation();
      } catch {
        // surfaced via hook
      }
    },
    [
      afterMutation,
      clearError,
      closeAllocationFlow,
      reserve,
      selectedMember,
      showToast,
      spaceType,
      t,
      target,
    ],
  );

  const handleWalkIn = useCallback(
    async (extras?: OccupancyPickerExtras) => {
      if (!selectedMember || !target) {
        return;
      }
      clearError();
      const { body, errorKey } = buildAllocateRequest(
        selectedMember.memberId,
        spaceType,
        target.targetType,
        {
          bedId: target.bedId,
          roomId: target.roomId,
          unitId: target.unitId,
        },
        extras,
      );
      if (!body || errorKey) {
        showToast(t(errorKey ?? 'occupancy.errors.generic'));
        return;
      }
      try {
        await allocate(body);
        closeAllocationFlow();
        await afterMutation();
      } catch {
        // surfaced via hook
      }
    },
    [
      afterMutation,
      allocate,
      clearError,
      closeAllocationFlow,
      selectedMember,
      showToast,
      spaceType,
      t,
      target,
    ],
  );

  const handleTransfer = useCallback(
    async (selection: OccupancyTargetSelection, extras?: OccupancyPickerExtras) => {
      const occupancyId = occupancy?.occupancyId;
      if (!occupancyId) {
        showToast(t('occupancy.errors.noActive'));
        return;
      }
      clearError();
      const { body, errorKey } = buildTransferRequest(
        spaceType,
        selection.targetType,
        {
          bedId: selection.bedId,
          roomId: selection.roomId,
          unitId: selection.unitId,
        },
        extras?.remarks,
      );
      if (!body || errorKey) {
        showToast(t(errorKey ?? 'occupancy.errors.generic'));
        return;
      }
      try {
        await transfer(occupancyId, body);
        setTransferVisible(false);
        await afterMutation();
      } catch {
        // surfaced via hook
      }
    },
    [afterMutation, clearError, occupancy?.occupancyId, showToast, spaceType, t, transfer],
  );

  const handleMoveIn = useCallback(
    async (values: MoveInFormValues) => {
      const occupancyId = occupancy?.occupancyId;
      if (!occupancyId) {
        showToast(t('occupancy.errors.noReserved'));
        return;
      }
      clearError();
      try {
        await moveIn(occupancyId, {
          expectedExitDate: values.expectedExitDate ?? null,
          allowEarlyMoveIn: values.allowEarlyMoveIn,
          agreementSigned: values.agreementSigned,
          remarks: values.remarks ?? null,
        });
        setMoveInVisible(false);
        await afterMutation();
      } catch {
        // surfaced via hook
      }
    },
    [afterMutation, clearError, moveIn, occupancy?.occupancyId, showToast, t],
  );

  const confirmCancelReservation = useCallback(() => {
    showConfirm({
      title: t('occupancy.cancelReservation.title'),
      message: t('occupancy.cancelReservation.message'),
      confirmLabel: t('occupancy.actions.cancelReservation'),
      destructive: true,
      onConfirm: async () => {
        const occupancyId = occupancy?.occupancyId;
        if (!occupancyId) {
          showToast(t('occupancy.errors.noReserved'));
          return;
        }
        try {
          await cancelReservation(occupancyId);
          await afterMutation();
        } catch {
          // surfaced via hook
        }
      },
    });
  }, [afterMutation, cancelReservation, occupancy?.occupancyId, showConfirm, showToast, t]);

  const confirmVacate = useCallback(() => {
    showConfirm({
      title: t('occupancy.vacate.title'),
      message: t('occupancy.vacate.message'),
      confirmLabel: t('occupancy.vacate.confirm'),
      destructive: true,
      onConfirm: async () => {
        const occupancyId = occupancy?.occupancyId;
        if (!occupancyId) {
          showToast(t('occupancy.errors.noActive'));
          return;
        }
        try {
          await vacate(occupancyId);
          await afterMutation();
        } catch {
          // surfaced via hook
        }
      },
    });
  }, [afterMutation, occupancy?.occupancyId, showConfirm, showToast, t, vacate]);

  const startReserve = useCallback(
    (context: OccupancyFlowContext) => {
      void openMemberPicker(context, 'RESERVE');
    },
    [openMemberPicker],
  );

  const startWalkIn = useCallback(
    (context: OccupancyFlowContext) => {
      void openMemberPicker(context, 'WALK_IN');
    },
    [openMemberPicker],
  );

  const startMoveIn = useCallback(
    async (context: OccupancyFlowContext) => {
      const resolved = await ensureContext(context);
      if (!resolved.occupancy?.occupancyId) {
        showToast(t('occupancy.errors.noReserved'));
        return;
      }
      setMoveInVisible(true);
    },
    [ensureContext, showToast, t],
  );

  const startTransfer = useCallback(
    async (context: OccupancyFlowContext) => {
      const resolved = await ensureContext(context);
      if (!resolved.occupancy?.occupancyId) {
        showToast(t('occupancy.errors.noActive'));
        return;
      }
      setTransferVisible(true);
    },
    [ensureContext, showToast, t],
  );

  const startCancelReservation = useCallback(
    async (context: OccupancyFlowContext) => {
      await ensureContext(context);
      confirmCancelReservation();
    },
    [confirmCancelReservation, ensureContext],
  );

  const startVacate = useCallback(
    async (context: OccupancyFlowContext) => {
      await ensureContext(context);
      confirmVacate();
    },
    [confirmVacate, ensureContext],
  );

  return {
    isEnabled,
    loading: loading || resolvingOccupancy,
    error,
    target,
    accommodationStatus,
    occupancy,
    selectedMember,
    memberPickerVisible,
    allocationVisible,
    allocationMode,
    transferVisible,
    moveInVisible,
    setMemberPickerVisible,
    closeAllocationFlow,
    handleMemberSelected,
    handleReserve,
    handleWalkIn,
    handleTransfer,
    handleMoveIn,
    setTransferVisible,
    setMoveInVisible,
    startReserve,
    startWalkIn,
    startMoveIn,
    startTransfer,
    startCancelReservation,
    startVacate,
  };
}
