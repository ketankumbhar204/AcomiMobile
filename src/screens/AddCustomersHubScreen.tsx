import { useLayoutEffect } from 'react';
import { useNavigation, useRoute } from '@react-navigation/native';
import type {
  NativeStackNavigationProp,
  NativeStackScreenProps,
} from '@react-navigation/native-stack';
import type { MainStackParamList } from '../navigation/types';

type Nav = NativeStackNavigationProp<MainStackParamList, 'AddCustomersHub'>;
type Route = NativeStackScreenProps<MainStackParamList, 'AddCustomersHub'>['route'];

/**
 * Legacy hub route. Adding a customer now starts from the choice sheet
 * on Add Member, then opens the existing form.
 */
export function AddCustomersHubScreen() {
  const navigation = useNavigation<Nav>();
  const route = useRoute<Route>();
  const { spaceId } = route.params;

  useLayoutEffect(() => {
    navigation.replace('AddMember', { spaceId });
  }, [navigation, spaceId]);

  return null;
}
