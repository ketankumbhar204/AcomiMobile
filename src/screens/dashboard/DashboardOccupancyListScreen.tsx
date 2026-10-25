import { useLayoutEffect } from 'react';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { UUID } from '../../api/types';
import type { DashboardOccupancyListMode } from '../../hooks/useSpaceOccupancyList';
import type { MainStackParamList } from '../../navigation/types';

type Route = {
  key: string;
  name: 'DashboardOccupancyList';
  params: {
    spaceId: UUID;
    mode: DashboardOccupancyListMode;
  };
};

type Nav = NativeStackNavigationProp<MainStackParamList>;

/**
 * Older entry points open the resident list. Occupied beds and move-ins now use
 * the same bed cards as vacant beds, with the property-operations cards as the filter.
 */
export function DashboardOccupancyListScreen() {
  const navigation = useNavigation<Nav>();
  const route = useRoute<Route>();
  const { spaceId, mode } = route.params;

  useLayoutEffect(() => {
    navigation.replace('DashboardBedInventory', {
      spaceId,
      status: 'OCCUPIED',
      focus: mode === 'moveInsThisMonth' ? 'moveIns' : 'occupied',
    });
  }, [mode, navigation, spaceId]);

  return null;
}
