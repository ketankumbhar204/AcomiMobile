import { accommodationApi } from '../api/accommodationApi';
import type { AllocationTargetType, UUID } from '../api/types';

export type TargetCatalogDefaults = {
  defaultRent?: number | null;
  defaultDeposit?: number | null;
};

export async function fetchTargetCatalogDefaults(
  spaceId: UUID,
  targetType: AllocationTargetType,
  ids: { bedId?: string; roomId?: string; unitId?: string },
  bedRoomId?: string,
): Promise<TargetCatalogDefaults> {
  switch (targetType) {
    case 'BED': {
      if (!ids.bedId) {
        return {};
      }
      const bed = bedRoomId
        ? await accommodationApi.getBed(spaceId, bedRoomId, ids.bedId)
        : await accommodationApi.getBedById(spaceId, ids.bedId);
      return {
        defaultRent: bed.defaultRent ?? null,
        defaultDeposit: bed.defaultDeposit ?? null,
      };
    }
    case 'ROOM': {
      if (!ids.roomId) {
        return {};
      }
      const room = await accommodationApi.getRoom(spaceId, ids.roomId);
      return {
        defaultRent: room.defaultRent ?? null,
        defaultDeposit: room.defaultDeposit ?? null,
      };
    }
    case 'UNIT': {
      if (!ids.unitId) {
        return {};
      }
      const unit = await accommodationApi.getUnitById(spaceId, ids.unitId);
      return {
        defaultRent: unit.defaultRent ?? null,
        defaultDeposit: unit.defaultDeposit ?? null,
      };
    }
    default:
      return {};
  }
}
