import { useCallback } from 'react';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useTranslation } from 'react-i18next';
import { useConfirmDialog } from '../components/ui/ConfirmDialog';
import type { MainStackParamList } from '../navigation/types';
import { useSpaceStore } from '../store/spaceStore';

type MainNav = NativeStackNavigationProp<MainStackParamList>;

export function useDeactivateSpace() {
  const { t } = useTranslation();
  const navigation = useNavigation<MainNav>();
  const { showConfirm } = useConfirmDialog();
  const deactivateSpace = useSpaceStore(state => state.deactivateSpace);
  const isLoading = useSpaceStore(state => state.loading);

  const confirmDeactivate = useCallback(
    (spaceId: string, spaceName: string) => {
      showConfirm({
        title: t('spaces.details.deactivateTitle'),
        message: t('spaces.details.deactivateMessage', { name: spaceName }),
        confirmLabel: t('spaces.details.deactivateConfirm'),
        destructive: true,
        onConfirm: async () => {
          console.log('[DeactivateSpace] confirmed', spaceId);
          const success = await deactivateSpace(spaceId);
          if (success) {
            navigation.navigate('MySpaces');
          }
        },
      });
    },
    [deactivateSpace, navigation, showConfirm, t],
  );

  return { confirmDeactivate, isLoading };
}
