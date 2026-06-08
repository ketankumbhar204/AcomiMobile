import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { HeaderBackButton } from '../components/ui';
import { stackHeaderOptions } from '../theme';
import { ScreenPlaceholder } from './ScreenPlaceholder';
import type { AuthStackParamList } from './types';

const Stack = createNativeStackNavigator<AuthStackParamList>();

function LoginScreen() {
  return <ScreenPlaceholder title="Login" />;
}

function OtpVerificationScreen() {
  return <ScreenPlaceholder title="OTP Verification" />;
}

export function AuthNavigator() {
  return (
    <Stack.Navigator screenOptions={stackHeaderOptions}>
      <Stack.Screen
        name="Login"
        component={LoginScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="OtpVerification"
        component={OtpVerificationScreen}
        options={{
          title: 'Verify OTP',
          headerBackVisible: false,
          headerLeft: () => <HeaderBackButton />,
        }}
      />
    </Stack.Navigator>
  );
}
