import { occupancyApi } from '../api/occupancyApi';
import type { OccupancyResponse, UUID } from '../api/types';

type TargetFilter = {
  bedId?: UUID;
  roomId?: UUID;
  unitId?: UUID;
};

export async function fetchTargetOccupancy(
  spaceId: UUID,
  target: TargetFilter,
): Promise<OccupancyResponse | null> {
  const hasTarget = Boolean(target.bedId || target.roomId || target.unitId);
  if (!hasTarget) {
    return null;
  }

  const activePage = await occupancyApi.listOccupancies(spaceId, {
    status: 'ACTIVE',
    bedId: target.bedId,
    roomId: target.roomId,
    unitId: target.unitId,
    size: 1,
  });
  if (activePage.content[0]) {
    return activePage.content[0];
  }

  const reservedPage = await occupancyApi.listOccupancies(spaceId, {
    status: 'RESERVED',
    bedId: target.bedId,
    roomId: target.roomId,
    unitId: target.unitId,
    size: 1,
  });
  return reservedPage.content[0] ?? null;
}
