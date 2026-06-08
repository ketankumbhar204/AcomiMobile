import { useLayoutEffect } from 'react';
import { useNavigation } from '@react-navigation/native';
import { HeaderBackButton } from '../components/ui/HeaderBackButton';

export function useScreenBackButton(enabled = true) {
  const navigation = useNavigation();

  useLayoutEffect(() => {
    if (!enabled) {
      return;
    }

    navigation.setOptions({
      headerBackVisible: false,
      headerLeft: () => <HeaderBackButton />,
    });
  }, [navigation, enabled]);
}
