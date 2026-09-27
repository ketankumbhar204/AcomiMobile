import React, { useEffect } from 'react';
import { View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { FindAPlaceParams, MainStackParamList, MemberTabParamList } from './types';

type Nav = NativeStackNavigationProp<MainStackParamList>;

/** Redirect legacy stack routes into MemberTabs. */
export function MemberTabsRedirect({
  screen = 'Home',
  findAPlaceParams,
}: {
  screen?: keyof MemberTabParamList;
  findAPlaceParams?: FindAPlaceParams;
}) {
  const navigation = useNavigation<Nav>();

  useEffect(() => {
    if (screen === 'FindAPlace' && findAPlaceParams) {
      navigation.replace('MemberTabs', { screen, params: findAPlaceParams });
      return;
    }
    navigation.replace('MemberTabs', { screen });
  }, [findAPlaceParams, navigation, screen]);

  return <View />;
}
