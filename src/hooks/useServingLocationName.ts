import { useCallback, useEffect, useState } from 'react';
import type { UUID } from '../api/types';
import { useSpaceStore } from '../store/spaceStore';
import { findMySpaceEntry } from '../utils/spacePermissions';
import { loadCustomServingLocationName, saveCustomServingLocationName } from '../utils/servingLocationStorage';

export function useServingLocationName(spaceId: UUID | null | undefined) {
  const mySpaces = useSpaceStore(state => state.mySpaces);
  const selectedSpace = useSpaceStore(state => state.selectedSpace);
  const [customName, setCustomName] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const defaultName =
    (selectedSpace?.id === spaceId ? selectedSpace.name : null) ??
    findMySpaceEntry(mySpaces, spaceId ?? undefined)?.spaceName ??
    '';

  const servingLocationName = customName?.trim() || defaultName;

  const reload = useCallback(async () => {
    if (!spaceId) {
      setCustomName(null);
      return;
    }
    setLoading(true);
    try {
      const stored = await loadCustomServingLocationName(spaceId);
      setCustomName(stored);
    } finally {
      setLoading(false);
    }
  }, [spaceId]);

  useEffect(() => {
    void reload();
  }, [reload]);

  const updateServingLocationName = useCallback(
    async (name: string) => {
      if (!spaceId) {
        return;
      }
      await saveCustomServingLocationName(spaceId, name);
      const stored = await loadCustomServingLocationName(spaceId);
      setCustomName(stored);
    },
    [spaceId],
  );

  return {
    defaultName,
    servingLocationName,
    customName,
    loading,
    reload,
    updateServingLocationName,
  };
}
