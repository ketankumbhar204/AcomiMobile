import { useCallback, useState } from 'react';
import { useTranslation } from 'react-i18next';
import type {
  AccommodationStatus,
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
import {
  createExtensionIdempotencyKey,
  defaultMonthlyRenewalEndDate,
} from '../utils/extendStay';
import type { ExtendOccupancyRequest } from '../api/types';

export type OccupancyFlowContext = {
  target: OccupancyTargetSelection;
  accommodationStatus: AccommodationStatus;
  occupancy?: OccupancyResponse | null;
  catalogRent?: number | null;
  catalogDeposit?: number | null;
  catalogKnown?: boolean;
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
  const { cancelReservation, extendStay, loading, error, clearError } = useOccupancyMutations(spaceId);

  const [flowContext, setFlowContext] = useState<OccupancyFlowContext | null>(null);
  const [extendSession, setExtendSession] = useState<{
    occupancyId: string;
    idempotencyKey: string;
    stayKind?: 'MONTHLY' | 'SHORT' | 'OPEN_ENDED' | null;
    moveInDate?: string | null;
    variant: 'extend' | 'renewal' | 'reviseOpenEnded';
    initialExpectedExitDate: string;
    currentDailyRent?: number | null;
  } | null>(null);
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
    ): boolean => {
      return openOccupancyWizardFromRef({
        spaceId,
        mode,
        memberId: resolvedOccupancy?.memberId,
        bedId: context.target.bedId,
        roomId: context.target.roomId,
        unitId: context.target.unitId,
        buildingId: context.target.buildingId,
        occupancyId: resolvedOccupancy?.occupancyId,
        prefilledTarget: context.target,
        catalogRent: context.catalogRent,
        catalogDeposit: context.catalogDeposit,
        catalogKnown: context.catalogKnown,
      });
    },
    [spaceId],
  );

  const [cancelSettlementOccupancyId, setCancelSettlementOccupancyId] = useState<string | null>(
    null,
  );

  const startReserve = useCallback(
    (context: OccupancyFlowContext): boolean => {
      clearError();
      return openWizard('RESERVE', context);
    },
    [clearError, openWizard],
  );

  const startWalkIn = useCallback(
    (context: OccupancyFlowContext): boolean => {
      clearError();
      return openWizard('ALLOCATE', context);
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
      const resolved = await ensureContext(context);
      const occupancyId =
        resolved.occupancy?.occupancyId ?? context.occupancy?.occupancyId ?? null;
      if (!occupancyId) {
        showToast(t('occupancy.errors.noReserved'));
        return;
      }
      setCancelSettlementOccupancyId(occupancyId);
    },
    [ensureContext, showToast, t],
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

  const startExtend = useCallback(
    async (context: OccupancyFlowContext) => {
      clearError();
      const resolved = await ensureContext(context);
      if (!resolved.occupancy?.occupancyId) {
        showToast(t('occupancy.errors.noActive'));
        return;
      }
      if (resolved.occupancy.stayKind === 'OPEN_ENDED') {
        setExtendSession({
          occupancyId: resolved.occupancy.occupancyId,
          idempotencyKey: createExtensionIdempotencyKey(),
          stayKind: 'OPEN_ENDED',
          moveInDate: resolved.occupancy.moveInDate ?? null,
          variant: 'reviseOpenEnded',
          initialExpectedExitDate: '',
          currentDailyRent: resolved.occupancy.rentSnapshot ?? null,
        });
        return;
      }
      setExtendSession({
        occupancyId: resolved.occupancy.occupancyId,
        idempotencyKey: createExtensionIdempotencyKey(),
        stayKind: resolved.occupancy.stayKind ?? null,
        moveInDate: resolved.occupancy.moveInDate ?? null,
        variant: 'extend',
        initialExpectedExitDate: '',
      });
    },
    [clearError, ensureContext, showToast, t],
  );

  /** OPEN_ENDED: revise daily rent without changing planned end or stayKind. */
  const startReviseOpenEndedRent = useCallback(
    async (context: OccupancyFlowContext) => {
      clearError();
      const resolved = await ensureContext(context);
      if (!resolved.occupancy?.occupancyId) {
        showToast(t('occupancy.errors.noActive'));
        return;
      }
      if (resolved.occupancy.stayKind !== 'OPEN_ENDED') {
        showToast(
          t('occupancy.reviseRent.onlyOpenEnded', {
            defaultValue: 'Daily rent revision is only for No Fixed Move-Out Date stays.',
          }),
        );
        return;
      }
      setExtendSession({
        occupancyId: resolved.occupancy.occupancyId,
        idempotencyKey: createExtensionIdempotencyKey(),
        stayKind: 'OPEN_ENDED',
        moveInDate: resolved.occupancy.moveInDate ?? null,
        variant: 'reviseOpenEnded',
        initialExpectedExitDate: '',
        currentDailyRent: resolved.occupancy.rentSnapshot ?? null,
      });
    },
    [clearError, ensureContext, showToast, t],
  );

  /** Monthly renewal uses the same extend API (D-11 / D-15) with a +1 month preset. */
  const startRenewMonthly = useCallback(
    async (context: OccupancyFlowContext) => {
      clearError();
      const resolved = await ensureContext(context);
      if (!resolved.occupancy?.occupancyId) {
        showToast(t('occupancy.errors.noActive'));
        return;
      }
      if (resolved.occupancy.stayKind === 'SHORT') {
        showToast(
          t('occupancy.extend.renewalNotForShort', {
            defaultValue: 'Short stays use Extend stay, not monthly renewal.',
          }),
        );
        return;
      }
      if (resolved.occupancy.stayKind === 'OPEN_ENDED') {
        await startReviseOpenEndedRent(resolved);
        return;
      }
      setExtendSession({
        occupancyId: resolved.occupancy.occupancyId,
        idempotencyKey: createExtensionIdempotencyKey(),
        stayKind: resolved.occupancy.stayKind ?? null,
        moveInDate: resolved.occupancy.moveInDate ?? null,
        variant: 'renewal',
        initialExpectedExitDate: defaultMonthlyRenewalEndDate(
          resolved.occupancy.expectedExitDate,
        ),
      });
    },
    [clearError, ensureContext, showToast, startReviseOpenEndedRent, t],
  );

  const closeExtend = useCallback(() => {
    if (loading) {
      return;
    }
    setExtendSession(null);
  }, [loading]);

  const submitExtend = useCallback(
    async (body: ExtendOccupancyRequest) => {
      if (!extendSession) {
        return;
      }
      await extendStay(extendSession.occupancyId, body);
      setExtendSession(null);
      await afterMutation();
    },
    [afterMutation, extendSession, extendStay],
  );

  const closeCancelSettlement = useCallback(() => {
    setCancelSettlementOccupancyId(null);
  }, []);

  const completeCancelSettlement = useCallback(async () => {
    setCancelSettlementOccupancyId(null);
    await afterMutation();
  }, [afterMutation]);

  return {
    isEnabled,
    loading: loading || resolvingOccupancy,
    error,
    target,
    accommodationStatus,
    occupancy,
    extendSession,
    cancelSettlementOccupancyId,
    closeCancelSettlement,
    completeCancelSettlement,
    startReserve,
    startWalkIn,
    startMoveIn,
    startTransfer,
    startCancelReservation,
    startVacate,
    startExtend,
    startRenewMonthly,
    startReviseOpenEndedRent,
    closeExtend,
    submitExtend,
  };
}
