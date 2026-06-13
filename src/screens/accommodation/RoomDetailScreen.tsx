import React, { useCallback, useLayoutEffect, useMemo, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useFocusEffect, useNavigation, useRoute } from '@react-navigation/native';
import type {
  NativeStackNavigationProp,
  NativeStackScreenProps,
} from '@react-navigation/native-stack';
import { useTranslation } from 'react-i18next';
import { accommodationApi } from '../../api/accommodationApi';
import type { RoomResponse } from '../../api/types';
import {
  AccommodationDetailRow,
  AccommodationLifecycleActions,
  AccommodationStatusBadge,
  formatAccommodationDate,
} from '../../components/accommodation';
import { Button, Card, HeaderBackButton, Screen, SkeletonCard } from '../../components/ui';
import { AccommodationOccupantSection } from '../../components/occupancy';
import { useActiveSpaceId } from '../../hooks/useActiveSpaceId';
import { useTargetOccupancy } from '../../hooks/useTargetOccupancy';
import {
  useDeactivateRoom,
  useDeleteRoom,
  useRestoreRoom,
} from '../../hooks/accommodationLifecycle';
import { useAccommodationLifecycleConfirm } from '../../hooks/useAccommodationLifecycleConfirm';
import { toAccommodationBedsParams } from '../../utils/accommodationNavigation';
import type { MainStackParamList } from '../../navigation/types';
import { useSpaceStore } from '../../store/spaceStore';
import { useToastStore } from '../../store/toastStore';
import { spacing, typography } from '../../theme';
import { getAccommodationErrorMessage } from '../../utils/accommodationErrors';
import { canViewSpaceOccupancies } from '../../utils/occupancyPermissions';
import { useAccommodationUiProfile } from '../../hooks/useAccommodationUiProfile';

type Nav = NativeStackNavigationProp<MainStackParamList, 'RoomDetail'>;
type Route = NativeStackScreenProps<MainStackParamList, 'RoomDetail'>['route'];

export function RoomDetailScreen() {
  const { t, i18n } = useTranslation();
  const navigation = useNavigation<Nav>();
  const route = useRoute<Route>();
  const { buildingId, roomId, floorId, unitId } = route.params;
  const spaceId = useActiveSpaceId(route.params.spaceId);
  const showToast = useToastStore(state => state.showToast);
  const { confirmDeactivate, confirmRestore, confirmDelete } =
    useAccommodationLifecycleConfirm();
  const { mutate: deactivateRoom, loading: deactivating } = useDeactivateRoom();
  const { mutate: restoreRoom, loading: restoring } = useRestoreRoom();
  const { mutate: deleteRoom, loading: deleting } = useDeleteRoom();
  const lifecycleLoading = deactivating || restoring || deleting;

  const mySpaces = useSpaceStore(state => state.mySpaces);
  const spaceType = useMemo(
    () => mySpaces.find(space => space.spaceId === spaceId)?.spaceType,
    [mySpaces, spaceId],
  );
  const currentRole = useMemo(
    () => mySpaces.find(space => space.spaceId === spaceId)?.membershipRole,
    [mySpaces, spaceId],
  );
  const { profile } = useAccommodationUiProfile(spaceId, spaceType, buildingId);

  const [room, setRoom] = useState<RoomResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const showsOccupant =
    room?.status === 'OCCUPIED' || room?.status === 'RESERVED';
  const canViewOccupant = canViewSpaceOccupancies(currentRole);
  const {
    occupancy,
    loading: occupancyLoading,
    error: occupancyError,
    refresh: refreshOccupancy,
  } = useTargetOccupancy(
    spaceId,
    { roomId },
    { enabled: showsOccupant && canViewOccupant },
  );

  useLayoutEffect(() => {
    navigation.setOptions({
      title: t('accommodation.rooms.detailTitle'),
      headerBackVisible: false,
      headerLeft: () => <HeaderBackButton />,
    });
  }, [navigation, t, i18n.language]);

  const loadRoom = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await accommodationApi.getRoom(spaceId, roomId);
      setRoom(data);
    } catch (err) {
      setError(getAccommodationErrorMessage(err, 'accommodation.errors.loadRooms'));
    } finally {
      setLoading(false);
    }
  }, [roomId, spaceId]);

  useFocusEffect(
    useCallback(() => {
      void loadRoom();
      void refreshOccupancy();
    }, [loadRoom, refreshOccupancy]),
  );

  if (loading && !room) {
    return <Screen contentStyle={styles.content}><SkeletonCard /></Screen>;
  }

  return (
    <Screen scrollable contentStyle={styles.content}>
      {error ? <Text style={styles.errorText}>{error}</Text> : null}
      {room ? (
        <>
          <View style={styles.badgeRow}>
            <AccommodationStatusBadge status={room.status} />
          </View>
          <Card>
            <AccommodationDetailRow label={t('accommodation.fields.name')} value={room.name} />
            <AccommodationDetailRow
              label={t('accommodation.rooms.roomNumberLabel')}
              value={room.roomNumber}
            />
            <AccommodationDetailRow
              label={t('accommodation.roomType.label')}
              value={t(`accommodation.roomType.${room.roomType}`)}
            />
            <AccommodationDetailRow
              label={t('accommodation.rooms.capacity')}
              value={String(room.capacity)}
            />
            <AccommodationDetailRow
              label={t('accommodation.status.label')}
              value={t(`accommodation.status.${room.status}`)}
            />
            <AccommodationDetailRow
              label={t('accommodation.fields.created')}
              value={formatAccommodationDate(room.createdAt)}
            />
            <AccommodationDetailRow
              label={t('accommodation.fields.updated')}
              value={formatAccommodationDate(room.updatedAt)}
            />
          </Card>

          {showsOccupant && canViewOccupant ? (
            <AccommodationOccupantSection
              spaceId={spaceId}
              occupancy={occupancy}
              loading={occupancyLoading}
              error={occupancyError}
            />
          ) : null}

          {profile?.showBeds ? (
            <Button
              label={t('accommodation.beds.view')}
              onPress={() =>
                navigation.navigate(
                  'AccommodationBeds',
                  toAccommodationBedsParams({
                    spaceId,
                    buildingId: room.buildingId ?? buildingId,
                    roomId: room.roomId,
                    roomName: room.name,
                    floorId: room.floorId ?? floorId ?? undefined,
                    unitId: room.unitId ?? unitId ?? undefined,
                  }),
                )
              }
              style={styles.action}
            />
          ) : null}

          <AccommodationLifecycleActions
            actions={room.actions}
            role={currentRole}
            loading={lifecycleLoading}
            onEdit={() =>
              navigation.navigate('RoomForm', {
                spaceId,
                buildingId,
                parentType: room.floorId ? 'floor' : 'unit',
                parentId: (room.floorId ?? room.unitId) as string,
                mode: 'edit',
                roomId,
              })
            }
            onDeactivate={() =>
              confirmDeactivate(
                () => deactivateRoom(spaceId, roomId),
                () => {
                  showToast(t('accommodation.lifecycle.deactivateSuccess'));
                  navigation.goBack();
                },
              )
            }
            onRestore={() =>
              confirmRestore(
                () => restoreRoom(spaceId, roomId),
                () => {
                  showToast(t('accommodation.lifecycle.restoreSuccess'));
                  void loadRoom();
                },
              )
            }
            onDelete={() =>
              confirmDelete(
                'room',
                () => deleteRoom(spaceId, roomId),
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
  );
}

const styles = StyleSheet.create({
  content: { padding: spacing.xxl, paddingBottom: spacing.section },
  errorText: { ...typography.body, color: '#DC2626' },
  badgeRow: { marginBottom: spacing.md },
  action: { marginTop: spacing.sm },
});
