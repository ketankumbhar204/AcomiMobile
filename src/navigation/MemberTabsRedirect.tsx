import React, { useEffect } from 'react';
import { View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { MainStackParamList, MemberTabParamList } from './types';

type Nav = NativeStackNavigationProp<MainStackParamList>;

/** Redirect legacy stack routes into MemberTabs. */
export function MemberTabsRedirect({
  screen = 'Home',
}: {
  screen?: keyof MemberTabParamList;
}) {
  const navigation = useNavigation<Nav>();

  useEffect(() => {
    navigation.replace('MemberTabs', { screen });
  }, [navigation, screen]);

  return <View />;
}
