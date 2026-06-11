import { useCallback, useEffect } from 'react';
import { mySpaceResponseToSpace } from '../api';
import type { Space } from '../api/types';
import { useSpaceStore } from '../store/spaceStore';

type UseMySpacesResult = {
  spaces: Space[];
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
};

/** @deprecated Prefer useSpaceStore directly */
export function useMySpaces(): UseMySpacesResult {
  const mySpaces = useSpaceStore(state => state.mySpaces);
  const isLoading = useSpaceStore(state => state.loading);
  const error = useSpaceStore(state => state.error);
  const loadMySpaces = useSpaceStore(state => state.loadMySpaces);
  const refresh = useSpaceStore(state => state.refresh);

  const refetch = useCallback(async () => {
    await refresh();
  }, [refresh]);

  useEffect(() => {
    loadMySpaces();
  }, [loadMySpaces]);

  return {
    spaces: mySpaces.map(mySpaceResponseToSpace),
    isLoading,
    error,
    refetch,
  };
}
