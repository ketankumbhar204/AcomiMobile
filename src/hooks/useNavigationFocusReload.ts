import { useCallback, useContext, useEffect } from 'react';
import { NavigationContext } from '@react-navigation/native';

/**
 * Reload when a navigation route is focused. Falls back to a one-time load when
 * no navigator is present (e.g. app-level overlays must not use useFocusEffect).
 */
export function useNavigationFocusReload(load: () => void | Promise<void>, enabled = true) {
  const navigation = useContext(NavigationContext);

  useEffect(() => {
    if (!enabled) {
      return;
    }

    if (!navigation) {
      void load();
      return;
    }

    void load();

    const unsubscribe = navigation.addListener('focus', () => {
      void load();
    });

    return unsubscribe;
  }, [enabled, load, navigation]);
}
