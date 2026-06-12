import { useCallback, useState } from 'react';
import { accommodationLifecycleApi } from '../api/accommodationLifecycleApi';
import type { UUID } from '../api/types';
import { invalidateAccommodationQueries } from '../utils/accommodationQueryCache';

type LifecycleMutate = (...args: UUID[]) => Promise<void>;

function createLifecycleHook(
  label: string,
  mutateFn: (...args: UUID[]) => Promise<void>,
): () => { mutate: LifecycleMutate; loading: boolean } {
  return function useLifecycleMutation() {
    const [loading, setLoading] = useState(false);

    const mutate = useCallback<LifecycleMutate>(
      async (...args) => {
        console.log(`[${label}]`, args);
        setLoading(true);
        try {
          await mutateFn(...args);
          invalidateAccommodationQueries();
        } catch (err) {
          console.error(`[${label}] failed`, err);
          throw err;
        } finally {
          setLoading(false);
        }
      },
      [],
    );

    return { mutate, loading };
  };
}

export const useDeactivateBuilding = createLifecycleHook(
  'useDeactivateBuilding',
  accommodationLifecycleApi.deactivateBuilding,
);
export const useRestoreBuilding = createLifecycleHook(
  'useRestoreBuilding',
  accommodationLifecycleApi.restoreBuilding,
);
export const useDeleteBuilding = createLifecycleHook(
  'useDeleteBuilding',
  accommodationLifecycleApi.deleteBuilding,
);

export const useDeactivateFloor = createLifecycleHook(
  'useDeactivateFloor',
  accommodationLifecycleApi.deactivateFloor,
);
export const useRestoreFloor = createLifecycleHook(
  'useRestoreFloor',
  accommodationLifecycleApi.restoreFloor,
);
export const useDeleteFloor = createLifecycleHook(
  'useDeleteFloor',
  accommodationLifecycleApi.deleteFloor,
);

export const useDeactivateUnit = createLifecycleHook(
  'useDeactivateUnit',
  accommodationLifecycleApi.deactivateUnit,
);
export const useRestoreUnit = createLifecycleHook(
  'useRestoreUnit',
  accommodationLifecycleApi.restoreUnit,
);
export const useDeleteUnit = createLifecycleHook(
  'useDeleteUnit',
  accommodationLifecycleApi.deleteUnit,
);

export const useDeactivateRoom = createLifecycleHook(
  'useDeactivateRoom',
  accommodationLifecycleApi.deactivateRoom,
);
export const useRestoreRoom = createLifecycleHook(
  'useRestoreRoom',
  accommodationLifecycleApi.restoreRoom,
);
export const useDeleteRoom = createLifecycleHook(
  'useDeleteRoom',
  accommodationLifecycleApi.deleteRoom,
);

export const useDeactivateBed = createLifecycleHook(
  'useDeactivateBed',
  accommodationLifecycleApi.deactivateBed,
);
export const useRestoreBed = createLifecycleHook(
  'useRestoreBed',
  accommodationLifecycleApi.restoreBed,
);
export const useDeleteBed = createLifecycleHook(
  'useDeleteBed',
  accommodationLifecycleApi.deleteBed,
);
