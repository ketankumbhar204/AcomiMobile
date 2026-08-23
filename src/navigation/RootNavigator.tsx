import React, { useEffect, useMemo, useRef } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import {
  DefaultTheme,
  NavigationContainer,
  type Theme,
} from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useAuthStore } from '../store/authStore';
import { useSpaceStore } from '../store/spaceStore';
import { colors } from '../theme';
import { AuthNavigator } from './AuthNavigator';
import { MainNavigator } from './MainNavigator';
import {
  navigationRef,
  navigateBootstrapResult,
} from './navigationRef';
import type { RootStackParamList } from './types';
import type { SpaceBootstrapResult } from '../store/spaceStore';
import { devLog } from '../utils/devLog';

const Stack = createNativeStackNavigator<RootStackParamList>();

const navigationTheme: Theme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    background: colors.background,
    card: colors.background,
    primary: colors.primary,
    text: colors.textPrimary,
    border: colors.border,
    notification: colors.primary,
  },
};

function applyStartupNavigation(result: SpaceBootstrapResult) {
  if (!navigationRef.isReady()) {
    return false;
  }

  devLog('[Dashboard] bootstrap navigation', result);
  navigateBootstrapResult(result);
  return true;
}

export function RootNavigator() {
  const isAuthenticated = useAuthStore(state => state.isAuthenticated);
  const isBootstrapping = useAuthStore(state => state.isBootstrapping);
  const bootstrap = useAuthStore(state => state.bootstrap);

  const isSpaceBootstrapping = useSpaceStore(state => state.isSpaceBootstrapping);
  const hasSpaceBootstrapped = useSpaceStore(state => state.hasSpaceBootstrapped);
  const bootstrapSpaces = useSpaceStore(state => state.bootstrapSpaces);
  const hydrateCurrentSpace = useSpaceStore(state => state.hydrateCurrentSpace);

  const pendingNavigationRef = useRef<SpaceBootstrapResult | null>(null);
  const bootstrapStartedRef = useRef(false);

  const rootStackKey = isAuthenticated ? 'authenticated' : 'unauthenticated';
  const showBootstrap =
    isBootstrapping || (isAuthenticated && !hasSpaceBootstrapped) || isSpaceBootstrapping;

  useEffect(() => {
    bootstrap().then(() => {
      if (useAuthStore.getState().isAuthenticated) {
        void useAuthStore.getState().refreshUser();
      }
    });
    hydrateCurrentSpace();
  }, [bootstrap, hydrateCurrentSpace]);

  useEffect(() => {
    if (!isAuthenticated) {
      bootstrapStartedRef.current = false;
      pendingNavigationRef.current = null;
    }
  }, [isAuthenticated]);

  useEffect(() => {
    if (!isAuthenticated || isBootstrapping || bootstrapStartedRef.current) {
      return;
    }

    bootstrapStartedRef.current = true;
    let isActive = true;

    bootstrapSpaces().then(result => {
      if (!isActive) {
        return;
      }
      pendingNavigationRef.current = result;
      if (!applyStartupNavigation(result)) {
        return;
      }
      pendingNavigationRef.current = null;
    });

    return () => {
      isActive = false;
    };
  }, [bootstrapSpaces, isAuthenticated, isBootstrapping]);

  function handleNavigationReady() {
    const pending = pendingNavigationRef.current;
    if (!pending) {
      return;
    }
    if (applyStartupNavigation(pending)) {
      pendingNavigationRef.current = null;
    }
  }

  const stack = useMemo(
    () => (
      <Stack.Navigator
        key={rootStackKey}
        screenOptions={{
          headerShown: false,
          animation: 'none',
          contentStyle: { backgroundColor: colors.background },
        }}>
        {isAuthenticated ? (
          <Stack.Screen name="Main" component={MainNavigator} />
        ) : (
          <Stack.Screen name="Auth" component={AuthNavigator} />
        )}
      </Stack.Navigator>
    ),
    [isAuthenticated, rootStackKey],
  );

  return (
    <View style={styles.root}>
      <NavigationContainer
        ref={navigationRef}
        theme={navigationTheme}
        onReady={handleNavigationReady}>
        {stack}
      </NavigationContainer>
      {showBootstrap ? (
        <View style={styles.splashOverlay} pointerEvents="auto">
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.background,
  },
  splashOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 100,
  },
});
