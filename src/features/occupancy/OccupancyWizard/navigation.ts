import { CommonActions } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { UUID } from '../../../api/types';
import type { MainStackParamList } from '../../../navigation/types';
import { navigationRef } from '../../../navigation/navigationRef';
import type { OccupancyWizardMode } from './types';

export type OccupancyWizardNavParams = {
  spaceId: UUID;
  mode: OccupancyWizardMode;
  memberId?: UUID;
  bedId?: UUID;
  roomId?: UUID;
  unitId?: UUID;
  buildingId?: UUID;
  occupancyId?: UUID;
};

export function navigateToMemberDetailsAfterOccupancy(
  navigation: NativeStackNavigationProp<MainStackParamList>,
  spaceId: UUID,
  memberId: UUID,
) {
  navigation.replace('MemberDetails', { spaceId, memberId });
}

export function navigateToMemberDetailsAfterOccupancyFromRef(
  spaceId: UUID,
  memberId: UUID,
) {
  if (!navigationRef.isReady()) {
    return;
  }
  navigationRef.dispatch(
    CommonActions.navigate({
      name: 'MemberDetails',
      params: { spaceId, memberId },
    }),
  );
}

export function openOccupancyWizard(
  navigation: NativeStackNavigationProp<MainStackParamList>,
  params: OccupancyWizardNavParams,
) {
  navigation.navigate('OccupancyWizard', params);
}

export function openOccupancyWizardFromRef(params: OccupancyWizardNavParams) {
  if (!navigationRef.isReady()) {
    return;
  }
  navigationRef.dispatch(
    CommonActions.navigate({
      name: 'Main',
      params: {
        screen: 'OccupancyWizard',
        params,
      },
    } as never),
  );
}
