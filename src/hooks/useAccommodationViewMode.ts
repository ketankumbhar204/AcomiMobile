import { useEffect } from 'react';
import {
  useAccommodationViewModeStore,
  type AccommodationViewMode,
} from '../store/accommodationViewModeStore';

export function useAccommodationViewMode(): {
  viewMode: AccommodationViewMode;
  isLayout: boolean;
  isList: boolean;
  setViewMode: (mode: AccommodationViewMode) => void;
} {
  const viewMode = useAccommodationViewModeStore(state => state.viewMode);
  const hydrated = useAccommodationViewModeStore(state => state.hydrated);
  const hydrate = useAccommodationViewModeStore(state => state.hydrate);
  const setViewMode = useAccommodationViewModeStore(state => state.setViewMode);

  useEffect(() => {
    if (!hydrated) {
      void hydrate();
    }
  }, [hydrated, hydrate]);

  return {
    viewMode,
    isLayout: viewMode === 'layout',
    isList: viewMode === 'list',
    setViewMode,
  };
}
