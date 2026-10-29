import { useEffect } from 'react';
import { Linking } from 'react-native';
import { navigationRef } from './navigationRef';
import { ingestMealPollUrl, setMealPollNavigationReady } from './mealPollLink';

/**
 * Capture https://app.acomi.in meal-poll links on cold start and while the app
 * is already open. The destination stays queued until auth, navigation, and
 * space bootstrap are ready, then opens once.
 *
 * The ready flag is set on the next turn so startup navigation can land first.
 */
export function useMealPollDeepLink(canOpen: boolean): void {
  useEffect(() => {
    let cancelled = false;
    const subscription = Linking.addEventListener('url', event => {
      ingestMealPollUrl(event.url);
    });
    Linking.getInitialURL()
      .then(url => {
        if (!cancelled) {
          ingestMealPollUrl(url);
        }
      })
      .catch(() => {
        // A missing initial URL is a normal launcher start.
      });
    return () => {
      cancelled = true;
      subscription.remove();
    };
  }, []);

  useEffect(() => {
    if (!canOpen) {
      setMealPollNavigationReady(false);
      return;
    }
    let attempts = 0;
    let timer: ReturnType<typeof setTimeout> | undefined;
    const openWhenMounted = () => {
      if (navigationRef.isReady()) {
        setMealPollNavigationReady(true);
        return;
      }
      attempts += 1;
      if (attempts < 10) {
        timer = setTimeout(openWhenMounted, 50);
      }
    };
    timer = setTimeout(openWhenMounted, 0);
    return () => {
      if (timer !== undefined) {
        clearTimeout(timer);
      }
    };
  }, [canOpen]);
}
