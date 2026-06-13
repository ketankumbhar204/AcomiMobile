import React from 'react';
import { useTranslation } from 'react-i18next';
import type { SpaceType } from '../../api/types';
import { MoveInModal } from './MoveInModal';
import { OccupancyMemberPickerModal } from './OccupancyMemberPickerModal';
import { OccupancyTargetPickerModal } from './OccupancyTargetPickerModal';
import type { useAccommodationOccupancyFlow } from '../../hooks/useAccommodationOccupancyFlow';

type FlowController = ReturnType<typeof useAccommodationOccupancyFlow>;

type AccommodationOccupancyFlowModalsProps = {
  spaceId: string;
  spaceType: SpaceType;
  flow: FlowController;
};

export function AccommodationOccupancyFlowModals({
  spaceId,
  spaceType,
  flow,
}: AccommodationOccupancyFlowModalsProps) {
  const { t } = useTranslation();

  if (!flow.target) {
    return null;
  }

  return (
    <>
      <OccupancyMemberPickerModal
        visible={flow.memberPickerVisible}
        spaceId={spaceId}
        onClose={() => flow.setMemberPickerVisible(false)}
        onSelect={flow.handleMemberSelected}
      />

      <OccupancyTargetPickerModal
        visible={flow.allocationVisible}
        spaceId={spaceId}
        spaceType={spaceType}
        mode={flow.allocationMode}
        title={
          flow.allocationMode === 'RESERVE'
            ? t('occupancy.reserve.title')
            : t('occupancy.walkIn.title')
        }
        memberName={flow.selectedMember?.fullName}
        initialSelection={flow.target}
        skipSelectPhase
        showCheckoutDate
        loading={flow.loading}
        onClose={flow.closeAllocationFlow}
        onConfirm={(_selection, extras) => {
          if (flow.allocationMode === 'RESERVE') {
            void flow.handleReserve(extras);
          } else {
            void flow.handleWalkIn(extras);
          }
        }}
      />

      <OccupancyTargetPickerModal
        visible={flow.transferVisible}
        spaceId={spaceId}
        spaceType={spaceType}
        mode="TRANSFER"
        title={t('occupancy.transfer.title')}
        memberName={flow.occupancy?.memberName}
        loading={flow.loading}
        onClose={() => flow.setTransferVisible(false)}
        onConfirm={flow.handleTransfer}
      />

      <MoveInModal
        visible={flow.moveInVisible}
        moveInDate={flow.occupancy?.moveInDate}
        loading={flow.loading}
        onClose={() => flow.setMoveInVisible(false)}
        onConfirm={flow.handleMoveIn}
      />
    </>
  );
}
