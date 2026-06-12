import { useMemo } from 'react';
import type { SpaceType, UUID } from '../api/types';
import {
  getAccommodationUiProfile,
  type AccommodationUiProfile,
} from '../utils/accommodationProfile';
import { useAccommodationSummary } from './useAccommodationSummary';

export function useAccommodationUiProfile(
  spaceId: UUID | null,
  spaceType: SpaceType | undefined,
  buildingId?: UUID | null,
): {
  profile: AccommodationUiProfile | null;
  summary: ReturnType<typeof useAccommodationSummary>['summary'];
  summaryLoading: boolean;
  summaryError: string | null;
  refreshSummary: ReturnType<typeof useAccommodationSummary>['refresh'];
} {
  const shouldLoadSummary = Boolean(spaceId && buildingId && spaceType);
  const { summary, loading, error, refresh } = useAccommodationSummary(
    shouldLoadSummary ? spaceId : null,
    shouldLoadSummary ? buildingId! : null,
  );

  const profile = useMemo(() => {
    if (!spaceType) {
      return null;
    }
    return getAccommodationUiProfile(spaceType, summary?.layoutMode);
  }, [spaceType, summary?.layoutMode]);

  return {
    profile,
    summary,
    summaryLoading: loading,
    summaryError: error,
    refreshSummary: refresh,
  };
}
