import React, { useEffect } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useAuthStore } from '../store/authStore';
import { colors } from '../theme';
import { AuthNavigator } from './AuthNavigator';
import { MainNavigator } from './MainNavigator';
import { navigationRef } from './navigationRef';
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
  const rootStackKey = isAuthenticated ? 'authenticated' : 'unauthenticated';

  useEffect(() => {
    bootstrap();
  }, [bootstrap]);

  return (
    <NavigationContainer ref={navigationRef}>
      <Stack.Navigator
        key={rootStackKey}
        screenOptions={{ headerShown: false }}>
        {isBootstrapping ? (
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
