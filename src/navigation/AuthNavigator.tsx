import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { LoginScreen } from '../screens/auth/LoginScreen';
import { OtpScreen } from '../screens/auth/OtpScreen';
import { stackHeaderOptions } from '../theme';
import type { AuthStackParamList } from './types';

const Stack = createNativeStackNavigator<AuthStackParamList>();

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
        component={OtpScreen}
        options={{
          title: 'Verify OTP',
          headerBackVisible: false,
        }}
      />
    </Stack.Navigator>
  );
}
