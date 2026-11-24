import React, { useEffect } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import type {
  NativeStackNavigationProp,
  NativeStackScreenProps,
} from '@react-navigation/native-stack';
import { useSpacePermissions } from '../hooks/useSpacePermissions';
import type { MainStackParamList } from '../navigation/types';
import { colors } from '../theme';
import { offersUseExistingChoice } from '../features/membership/addPersonChoice';

type Nav = NativeStackNavigationProp<MainStackParamList, 'ImportExistingPeople'>;
type Route = NativeStackScreenProps<MainStackParamList, 'ImportExistingPeople'>['route'];

/**
 * Legacy route kept for deep links and old navigation state.
 * The standalone import list is gone: Mess uses the search picker inside Add Member,
 * lodging returns to Members (existing residents come in through Move-in).
 */
export function ImportExistingPeopleScreen() {
  const navigation = useNavigation<Nav>();
  const route = useRoute<Route>();
  const { spaceId } = route.params;
  const { spaceType } = useSpacePermissions(spaceId);

  useEffect(() => {
    if (offersUseExistingChoice(spaceType)) {
      navigation.replace('AddMember', { spaceId, initialMode: 'search' });
      return;
    }
    navigation.replace('SpaceTabs', { spaceId, screen: 'Members' });
  }, [navigation, spaceId, spaceType]);

  return (
    <View style={styles.pending}>
      <ActivityIndicator color={colors.primary} />
    </View>
  );
}

const styles = StyleSheet.create({
  pending: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.background,
  },
});
