import { useCallback, useState } from 'react';
import { useTranslation } from 'react-i18next';
import type {
  AccommodationStatus,
  MemberResponse,
  OccupancyResponse,
  SpaceType,
} from '../api/types';
import { useConfirmDialog } from '../components/ui';
import { openOccupancyWizardFromRef } from '../features/occupancy/OccupancyWizard';
import { useOccupancyMutations } from './useOccupancyMutations';
import { useToastStore } from '../store/toastStore';
import { fetchTargetOccupancy } from '../utils/fetchTargetOccupancy';
import { isOccupancyTargetSupported } from '../utils/buildOccupancyTarget';
import type { OccupancyTargetSelection } from '../utils/occupancyRules';

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
  const { cancelReservation, vacate, loading, error, clearError } =
    useOccupancyMutations(spaceId);

  const [flowContext, setFlowContext] = useState<OccupancyFlowContext | null>(null);
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

  const afterMutation = useCallback(async () => {
    showToast(t('occupancy.success.updated'));
    onSuccess?.();
  }, [onSuccess, showToast, t]);

  const openWizard = useCallback(
    (
      mode: 'ALLOCATE' | 'RESERVE' | 'MOVE_IN' | 'TRANSFER' | 'VACATE',
      context: OccupancyFlowContext,
      resolvedOccupancy?: OccupancyResponse | null,
    ) => {
      openOccupancyWizardFromRef({
        spaceId,
        mode,
        memberId: resolvedOccupancy?.memberId,
        bedId: context.target.bedId,
        roomId: context.target.roomId,
        unitId: context.target.unitId,
        buildingId: context.target.buildingId,
        occupancyId: resolvedOccupancy?.occupancyId,
      });
    },
    [spaceId],
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

  const startReserve = useCallback(
    (context: OccupancyFlowContext) => {
      clearError();
      openWizard('RESERVE', context);
    },
    [clearError, openWizard],
  );

  const startWalkIn = useCallback(
    (context: OccupancyFlowContext) => {
      clearError();
      openWizard('ALLOCATE', context);
    },
    [clearError, openWizard],
  );

  const startMoveIn = useCallback(
    async (context: OccupancyFlowContext) => {
      clearError();
      const resolved = await ensureContext(context);
      if (!resolved.occupancy?.occupancyId) {
        showToast(t('occupancy.errors.noReserved'));
        return;
      }
      openWizard('MOVE_IN', resolved, resolved.occupancy);
    },
    [clearError, ensureContext, openWizard, showToast, t],
  );

  const startTransfer = useCallback(
    async (context: OccupancyFlowContext) => {
      clearError();
      const resolved = await ensureContext(context);
      if (!resolved.occupancy?.occupancyId) {
        showToast(t('occupancy.errors.noActive'));
        return;
      }
      openWizard('TRANSFER', resolved, resolved.occupancy);
    },
    [clearError, ensureContext, openWizard, showToast, t],
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
      clearError();
      const resolved = await ensureContext(context);
      if (!resolved.occupancy?.occupancyId) {
        showToast(t('occupancy.errors.noActive'));
        return;
      }
      openWizard('VACATE', resolved, resolved.occupancy);
    },
    [clearError, ensureContext, openWizard, showToast, t],
  );

  return {
    isEnabled,
    loading: loading || resolvingOccupancy,
    error,
    target,
    accommodationStatus,
    occupancy,
    startReserve,
    startWalkIn,
    startMoveIn,
    startTransfer,
    startCancelReservation,
    startVacate,
  };
}
