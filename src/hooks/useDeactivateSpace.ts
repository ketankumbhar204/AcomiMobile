import { useCallback } from 'react';
import { Alert } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useTranslation } from 'react-i18next';
import type { MainStackParamList } from '../navigation/types';
import { useSpaceStore } from '../store/spaceStore';

type MainNav = NativeStackNavigationProp<MainStackParamList>;

export function useDeactivateSpace() {
  const { t } = useTranslation();
  const navigation = useNavigation<MainNav>();
  const deactivateSpace = useSpaceStore(state => state.deactivateSpace);
  const isLoading = useSpaceStore(state => state.loading);

  const confirmDeactivate = useCallback(
    (spaceId: string, spaceName: string) => {
      Alert.alert(
        t('spaces.details.deactivateTitle'),
        t('spaces.details.deactivateMessage', { name: spaceName }),
        [
          { text: t('common.cancel'), style: 'cancel' },
          {
            text: t('spaces.details.deactivateConfirm'),
            style: 'destructive',
            onPress: async () => {
              console.log('[DeactivateSpace] confirmed', spaceId);
              const success = await deactivateSpace(spaceId);
              if (success) {
                navigation.navigate('MySpaces');
              }
            },
          },
        ],
      );
    },
    [deactivateSpace, navigation, t],
  );

  return { confirmDeactivate, isLoading };
}
