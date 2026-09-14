import React, { useEffect } from 'react';
import { View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { MainStackParamList } from '../navigation/types';

type Nav = NativeStackNavigationProp<MainStackParamList, 'JoinSpace'>;

/** Backward-compatible — invitations now live on Member Home. */
export function JoinSpaceScreen() {
  const navigation = useNavigation<Nav>();

  useEffect(() => {
    navigation.replace('MemberTabs', { screen: 'Home' });
  }, [navigation]);

  return <View />;
}
