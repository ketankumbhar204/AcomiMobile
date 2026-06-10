import React, { useLayoutEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import {
  CompositeNavigationProp,
  useNavigation,
  useRoute,
} from '@react-navigation/native';
import type { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import type {
  NativeStackNavigationProp,
  NativeStackScreenProps,
} from '@react-navigation/native-stack';
import { EmptyState, FAB, HeaderBackButton } from '../components/ui';
import type { MainStackParamList, SpaceTabParamList } from '../navigation/types';
import { colors } from '../theme';

type MembersNavigation = CompositeNavigationProp<
  BottomTabNavigationProp<SpaceTabParamList, 'Members'>,
  NativeStackNavigationProp<MainStackParamList>
>;

type MembersRoute = NativeStackScreenProps<
  Record<'Members', { spaceId: string }>,
  'Members'
>['route'];

export function MembersScreen() {
  const navigation = useNavigation<MembersNavigation>();
  const route = useRoute<MembersRoute>();
  const spaceId = route.params?.spaceId ?? '';

  useLayoutEffect(() => {
    navigation.setOptions({
      title: 'Members',
      headerBackVisible: false,
      headerLeft: () => <HeaderBackButton />,
      headerRight: undefined,
    });
  }, [navigation]);

  return (
    <View style={styles.root}>
      <EmptyState
        title="No members yet"
        description="Invite your first tenant, customer, or staff member to this space."
        icon="👥"
      />

      <FAB
        onPress={() => navigation.navigate('InviteMembers', { spaceId })}
        accessibilityLabel="Invite member"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.background,
  },
});
