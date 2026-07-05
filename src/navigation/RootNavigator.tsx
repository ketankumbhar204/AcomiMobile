import React, { useEffect, useRef } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useAuthStore } from '../store/authStore';
import { useSpaceStore } from '../store/spaceStore';
import { colors } from '../theme';
import { AuthNavigator } from './AuthNavigator';
import { MainNavigator } from './MainNavigator';
import {
  navigationRef,
  navigateBootstrapResult,
  resetToAcceptInvitations,
  resetToDashboard,
  resetToMySpaces,
} from './navigationRef';
import type { RootStackParamList } from './types';
import type { SpaceBootstrapResult } from '../store/spaceStore';

const Stack = createNativeStackNavigator<RootStackParamList>();

function BootstrapScreen() {
  return (
    <View style={styles.splash}>
      <ActivityIndicator size="large" color={colors.primary} />
    </View>
  );
}

function applyStartupNavigation(result: SpaceBootstrapResult) {
  if (!navigationRef.isReady()) {
    return false;
  }

  console.log('[Dashboard] bootstrap navigation', result);
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

  return (
    <NavigationContainer ref={navigationRef} onReady={handleNavigationReady}>
      <Stack.Navigator
        key={rootStackKey}
        screenOptions={{ headerShown: false }}>
        {showBootstrap ? (
          <Stack.Screen name="Bootstrap" component={BootstrapScreen} />
        ) : isAuthenticated ? (
          <Stack.Screen name="Main" component={MainNavigator} />
        ) : (
          <Stack.Screen name="Auth" component={AuthNavigator} />
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  splash: {
    flex: 1,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
