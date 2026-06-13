import type { SpaceType } from '../../api/types';
import type { useAccommodationOccupancyFlow } from '../../hooks/useAccommodationOccupancyFlow';

/** @deprecated Occupancy flows use OccupancyWizard screen — this component is a no-op. */
export function AccommodationOccupancyFlowModals(_props: {
  spaceId: string;
  spaceType: SpaceType;
  flow: ReturnType<typeof useAccommodationOccupancyFlow>;
}) {
  return null;
}
