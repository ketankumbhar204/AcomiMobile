import type { UUID } from '../../../api/types';

export type OccupancyWizardMode =
  | 'ALLOCATE'
  | 'RESERVE'
  | 'MOVE_IN'
  | 'TRANSFER'
  | 'VACATE';

export type OccupancyWizardStep =
  | 'member'
  | 'target'
  | 'stay_type'
  | 'stay_details'
  | 'reserve_dates'
  | 'transfer_current'
  | 'contract'
  | 'review'
  | 'vacate_confirm';

export type OccupancyWizardParams = {
  spaceId: UUID;
  mode: OccupancyWizardMode;
  memberId?: UUID;
  bedId?: UUID;
  roomId?: UUID;
  unitId?: UUID;
  buildingId?: UUID;
  floorId?: UUID;
  occupancyId?: UUID;
};
