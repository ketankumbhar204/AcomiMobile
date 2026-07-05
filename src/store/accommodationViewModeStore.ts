import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';

export type AccommodationViewMode = 'list' | 'layout';

const STORAGE_KEY = 'accommodation.viewMode';

type AccommodationViewModeState = {
  viewMode: AccommodationViewMode;
  hydrated: boolean;
  setViewMode: (mode: AccommodationViewMode) => void;
  hydrate: () => Promise<void>;
};

export const useAccommodationViewModeStore = create<AccommodationViewModeState>(set => ({
  viewMode: 'layout',
  hydrated: false,
  setViewMode: mode => {
    set({ viewMode: mode });
    void AsyncStorage.setItem(STORAGE_KEY, mode);
  },
  hydrate: async () => {
    try {
      const stored = await AsyncStorage.getItem(STORAGE_KEY);
      if (stored === 'list' || stored === 'layout') {
        set({ viewMode: stored, hydrated: true });
        return;
      }
    } catch {
      // fall through to default
    }
    set({ hydrated: true });
  },
}));
