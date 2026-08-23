import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { LoginScreen } from '../screens/auth/LoginScreen';
import { OtpScreen } from '../screens/auth/OtpScreen';
import { RegisterPasswordScreen } from '../screens/auth/RegisterPasswordScreen';
import { RegisterScreen } from '../screens/auth/RegisterScreen';
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
        name="Register"
        component={RegisterScreen}
        options={{ headerShown: false }}
      />
      {/* OTP screens remain mounted for future OTP authentication. Production login/register do not navigate here. */}
      <Stack.Screen
        name="OtpVerification"
        component={OtpScreen}
        options={{ headerShown: true }}
      />
      <Stack.Screen
        name="RegisterPassword"
        component={RegisterPasswordScreen}
        options={{ headerShown: true }}
      />
    </Stack.Navigator>
  );
}
