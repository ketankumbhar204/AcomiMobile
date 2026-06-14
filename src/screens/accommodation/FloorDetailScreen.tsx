import React, { useCallback, useLayoutEffect, useState } from 'react';
import { StyleSheet, Text } from 'react-native';
import { useFocusEffect, useNavigation, useRoute } from '@react-navigation/native';
import type {
  NativeStackNavigationProp,
  NativeStackScreenProps,
} from '@react-navigation/native-stack';
import { useTranslation } from 'react-i18next';
import { accommodationApi } from '../../api/accommodationApi';
import type { FloorResponse } from '../../api/types';
import {
  AccommodationDetailRow,
  AccommodationLifecycleActions,
  formatAccommodationDate,
} from '../../components/accommodation';
import { Button, Card, HeaderBackButton, RequireAccommodationAccess, Screen, SkeletonCard } from '../../components/ui';
import { useActiveSpaceId } from '../../hooks/useActiveSpaceId';
import { useSpacePermissions } from '../../hooks/useSpacePermissions';
import {
  useDeactivateFloor,
  useDeleteFloor,
  useRestoreFloor,
} from '../../hooks/accommodationLifecycle';
import { useAccommodationLifecycleConfirm } from '../../hooks/useAccommodationLifecycleConfirm';
import type { MainStackParamList } from '../../navigation/types';
import { useToastStore } from '../../store/toastStore';
import { spacing, typography } from '../../theme';
import { formatFloorHeaderTitle } from '../../utils/accommodationLabels';
import { getAccommodationErrorMessage } from '../../utils/accommodationErrors';

type Nav = NativeStackNavigationProp<MainStackParamList, 'FloorDetail'>;
type Route = NativeStackScreenProps<MainStackParamList, 'FloorDetail'>['route'];

export function FloorDetailScreen() {
  const { t, i18n } = useTranslation();
  const navigation = useNavigation<Nav>();
  const route = useRoute<Route>();
  const { buildingId, floorId, buildingName } = route.params;
  const spaceId = useActiveSpaceId(route.params.spaceId);
  const showToast = useToastStore(state => state.showToast);
  const { confirmDeactivate, confirmRestore, confirmDelete } =
    useAccommodationLifecycleConfirm();
  const { mutate: deactivateFloor, loading: deactivating } = useDeactivateFloor();
  const { mutate: restoreFloor, loading: restoring } = useRestoreFloor();
  const { mutate: deleteFloor, loading: deleting } = useDeleteFloor();
  const lifecycleLoading = deactivating || restoring || deleting;

  const permissions = useSpacePermissions(spaceId);

  const [floor, setFloor] = useState<FloorResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useLayoutEffect(() => {
    navigation.setOptions({
      title: t('accommodation.floors.detailTitle'),
      headerBackVisible: false,
      headerLeft: () => <HeaderBackButton />,
    });
  }, [navigation, t, i18n.language]);

  const loadFloor = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await accommodationApi.getFloorById(spaceId, floorId);
      setFloor(data);
    } catch (err) {
      setError(getAccommodationErrorMessage(err, 'accommodation.errors.loadFloors'));
    } finally {
      setLoading(false);
    }
  }, [floorId, spaceId]);

  useFocusEffect(useCallback(() => { void loadFloor(); }, [loadFloor]));

  if (loading && !floor) {
    return <Screen contentStyle={styles.content}><SkeletonCard /></Screen>;
  }

  return (
    <RequireAccommodationAccess spaceId={spaceId}>
    <Screen scrollable contentStyle={styles.content}>
      {error ? <Text style={styles.errorText}>{error}</Text> : null}
      {floor ? (
        <>
          <Card>
            <AccommodationDetailRow label={t('accommodation.fields.name')} value={floor.name} />
            <AccommodationDetailRow
              label={t('accommodation.floors.floorNumberLabel')}
              value={String(floor.floorNumber)}
            />
            <AccommodationDetailRow
              label={t('accommodation.floors.sortOrder')}
              value={String(floor.sortOrder)}
            />
            <AccommodationDetailRow
              label={t('accommodation.fields.created')}
              value={formatAccommodationDate(floor.createdAt)}
            />
            <AccommodationDetailRow
              label={t('accommodation.fields.updated')}
              value={formatAccommodationDate(floor.updatedAt)}
            />
          </Card>

          <Button
            label={t('accommodation.rooms.view')}
            onPress={() =>
              navigation.navigate('AccommodationRooms', {
                spaceId,
                buildingId,
                buildingName,
                parentType: 'floor',
                parentId: floor.floorId,
                parentName: floor.name,
              })
            }
            style={styles.action}
          />

          <AccommodationLifecycleActions
            actions={floor.actions}
            role={permissions.membershipRole}
            loading={lifecycleLoading}
            onEdit={() =>
              navigation.navigate('FloorForm', {
                spaceId,
                buildingId,
                mode: 'edit',
                floorId,
              })
            }
            onDeactivate={() =>
              confirmDeactivate(
                () => deactivateFloor(spaceId, floorId),
                () => {
                  showToast(t('accommodation.lifecycle.deactivateSuccess'));
                  navigation.goBack();
                },
              )
            }
            onRestore={() =>
              confirmRestore(
                () => restoreFloor(spaceId, floorId),
                () => {
                  showToast(t('accommodation.lifecycle.restoreSuccess'));
                  void loadFloor();
                },
              )
            }
            onDelete={() =>
              confirmDelete(
                'floor',
                () => deleteFloor(spaceId, floorId),
                () => {
                  showToast(t('accommodation.lifecycle.deleteSuccess'));
                  navigation.goBack();
                },
              )
            }
          />
        </>
      ) : null}
    </Screen>
    </RequireAccommodationAccess>
  );
}

const styles = StyleSheet.create({
  content: { padding: spacing.xxl, paddingBottom: spacing.section },
  errorText: { ...typography.body, color: '#DC2626' },
  action: { marginTop: spacing.sm },
});
