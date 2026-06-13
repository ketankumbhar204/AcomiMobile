import { useEffect, useState } from 'react';
import type { AccommodationStatus, UUID } from '../api/types';
import { fetchTargetOccupancy } from '../utils/fetchTargetOccupancy';

export function useBedOccupantLabel(
  spaceId: UUID,
  bedId: UUID,
  status: AccommodationStatus,
): string | null {
  const [occupantLabel, setOccupantLabel] = useState<string | null>(null);

  useEffect(() => {
    if (status !== 'OCCUPIED' && status !== 'RESERVED') {
      setOccupantLabel(null);
      return;
    }

    let cancelled = false;
    void fetchTargetOccupancy(spaceId, { bedId }).then(occupancy => {
      if (!cancelled) {
        setOccupantLabel(occupancy?.memberName ?? null);
      }
    });

    return () => {
      cancelled = true;
    };
  }, [bedId, spaceId, status]);

  return occupantLabel;
}
