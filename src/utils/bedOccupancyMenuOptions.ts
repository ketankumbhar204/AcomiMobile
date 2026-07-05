import type { TFunction } from 'i18next';
import type { BedListItemResponse } from '../../api/types';
import { isOccupancyTargetSupported } from './buildOccupancyTarget';
import type { OccupancyFlowContext } from '../hooks/useAccommodationOccupancyFlow';
import type { useAccommodationOccupancyFlow } from '../hooks/useAccommodationOccupancyFlow';

export type RowMenuOption = {
  label: string;
  action: () => void;
  destructive?: boolean;
};

type FlowController = ReturnType<typeof useAccommodationOccupancyFlow>;

export function buildBedOccupancyMenuOptions(
  bed: BedListItemResponse,
  spaceType: Parameters<typeof isOccupancyTargetSupported>[0],
  context: OccupancyFlowContext,
  flow: FlowController,
  t: TFunction,
  onViewDetail: () => void,
): RowMenuOption[] {
  if (!isOccupancyTargetSupported(spaceType, context.target.targetType)) {
    return [];
  }

  if (bed.status === 'MAINTENANCE' || bed.status === 'BLOCKED') {
    return [];
  }

  if (bed.status === 'AVAILABLE') {
    return [
      {
        label: t('occupancy.hierarchy.menu.reserveBed'),
        action: () => flow.startReserve(context),
      },
      {
        label: t('occupancy.hierarchy.menu.allocateResident'),
        action: () => flow.startWalkIn(context),
      },
    ];
  }

  if (bed.status === 'RESERVED') {
    return [
      {
        label: t('occupancy.quickActions.viewReservation'),
        action: onViewDetail,
      },
      {
        label: t('occupancy.actions.moveIn'),
        action: () => void flow.startMoveIn(context),
      },
      {
        label: t('occupancy.actions.cancelReservation'),
        action: () => void flow.startCancelReservation(context),
        destructive: true,
      },
    ];
  }

  if (bed.status === 'OCCUPIED') {
    return [
      {
        label: t('occupancy.quickActions.viewOccupant'),
        action: onViewDetail,
      },
      {
        label: t('occupancy.actions.transfer'),
        action: () => void flow.startTransfer(context),
      },
      {
        label: t('occupancy.actions.vacate'),
        action: () => void flow.startVacate(context),
        destructive: true,
      },
    ];
  }

  return [];
}
