import type { SpaceType } from '../../api/types';
import type { useAccommodationOccupancyFlow } from '../../hooks/useAccommodationOccupancyFlow';
import { ExtendStayModal } from './ExtendStayModal';
import { ReservationCancellationSettlementModal } from './ReservationCancellationSettlementModal';
import { ReviseOpenEndedRentModal } from './ReviseOpenEndedRentModal';

export function AccommodationOccupancyFlowModals({
  spaceId,
  spaceType: _spaceType,
  flow,
}: {
  spaceId: string;
  spaceType: SpaceType;
  flow: ReturnType<typeof useAccommodationOccupancyFlow>;
}) {
  const isRevise = flow.extendSession?.variant === 'reviseOpenEnded';

  return (
    <>
      <ExtendStayModal
        visible={flow.extendSession != null && !isRevise}
        idempotencyKey={flow.extendSession?.idempotencyKey ?? ''}
        stayKind={flow.extendSession?.stayKind}
        moveInDate={flow.extendSession?.moveInDate}
        variant={
          flow.extendSession?.variant === 'renewal' ? 'renewal' : 'extend'
        }
        initialExpectedExitDate={flow.extendSession?.initialExpectedExitDate ?? ''}
        submitting={flow.loading}
        onClose={flow.closeExtend}
        onSubmit={flow.submitExtend}
      />
      <ReviseOpenEndedRentModal
        visible={isRevise}
        idempotencyKey={flow.extendSession?.idempotencyKey ?? ''}
        currentDailyRent={flow.extendSession?.currentDailyRent}
        submitting={flow.loading}
        onClose={flow.closeExtend}
        onSubmit={flow.submitExtend}
      />
      <ReservationCancellationSettlementModal
        visible={flow.cancelSettlementOccupancyId != null}
        spaceId={spaceId}
        occupancyId={flow.cancelSettlementOccupancyId}
        onClose={flow.closeCancelSettlement}
        onCancelled={() => {
          void flow.completeCancelSettlement();
        }}
      />
    </>
  );
}
