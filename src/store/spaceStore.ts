import { create } from 'zustand';
import type { Space, UUID } from '../api/types';

interface SpaceState {
  selectedSpaceId: UUID | null;
  selectedSpace: Space | null;
  setSelectedSpace: (space: Space) => void;
  clearSelectedSpace: () => void;
}

export const useSpaceStore = create<SpaceState>(set => ({
  selectedSpaceId: null,
  selectedSpace: null,

  setSelectedSpace: space =>
    set({ selectedSpaceId: space.id, selectedSpace: space }),

  clearSelectedSpace: () =>
    set({ selectedSpaceId: null, selectedSpace: null }),
}));
