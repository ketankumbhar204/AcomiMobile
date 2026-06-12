import React, { useEffect } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useAuthStore } from '../store/authStore';
import { useSpaceStore } from '../store/spaceStore';
import { ConfirmDialogProvider } from '../components/ui/ConfirmDialog';
import { colors } from '../theme';
import { AuthNavigator } from './AuthNavigator';
import { MainNavigator } from './MainNavigator';
import {
  navigationRef,
  resetToCreateSpace,
  resetToDashboard,
  resetToMySpaces,
} from './navigationRef';
import type { RootStackParamList } from './types';

const Stack = createNativeStackNavigator<RootStackParamList>();

function BootstrapScreen() {
  return (
    <View style={styles.splash}>
      <ActivityIndicator size="large" color={colors.primary} />
    </View>
  );
}

export function RootNavigator() {
  const isAuthenticated = useAuthStore(state => state.isAuthenticated);
  const isBootstrapping = useAuthStore(state => state.isBootstrapping);
  const bootstrap = useAuthStore(state => state.bootstrap);

  const isSpaceBootstrapping = useSpaceStore(state => state.isSpaceBootstrapping);
  const hasSpaceBootstrapped = useSpaceStore(state => state.hasSpaceBootstrapped);
  const bootstrapSpaces = useSpaceStore(state => state.bootstrapSpaces);
  const hydrateCurrentSpace = useSpaceStore(state => state.hydrateCurrentSpace);

  const rootStackKey = isAuthenticated ? 'authenticated' : 'unauthenticated';
  const showBootstrap =
    isBootstrapping || (isAuthenticated && !hasSpaceBootstrapped) || isSpaceBootstrapping;

  useEffect(() => {
    bootstrap();
    hydrateCurrentSpace();
  }, [bootstrap, hydrateCurrentSpace]);

  useEffect(() => {
    if (!isAuthenticated || isBootstrapping || hasSpaceBootstrapped) {
      return;
    }

    let isActive = true;

    bootstrapSpaces().then(result => {
      if (!isActive || !navigationRef.isReady()) {
        return;
      }

      console.log('[Dashboard] bootstrap navigation', result);

      if (result.route === 'SpaceTabs' && result.spaceId) {
        resetToDashboard(result.spaceId);
      } else if (result.route === 'CreateSpace') {
        resetToCreateSpace();
      } else {
        resetToMySpaces();
      }
    });

    return () => {
      isActive = false;
    };
  }, [bootstrapSpaces, hasSpaceBootstrapped, isAuthenticated, isBootstrapping]);

  return (
    <ConfirmDialogProvider>
      <NavigationContainer ref={navigationRef}>
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
    </ConfirmDialogProvider>
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
