import React, { useCallback, useLayoutEffect, useMemo, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import {
  useFocusEffect,
  useNavigation,
  useRoute,
} from '@react-navigation/native';
import type {
  NativeStackNavigationProp,
  NativeStackScreenProps,
} from '@react-navigation/native-stack';
import { useTranslation } from 'react-i18next';
import { BedDouble } from 'lucide-react-native';
import { accommodationApi } from '../../api/accommodationApi';
import type { RoomResponse } from '../../api/types';
import {
  AccommodationDetailRow,
  AccommodationEntityHero,
  AccommodationLifecycleActions,
  AccommodationStatusBadge,
  formatAccommodationDate,
} from '../../components/accommodation';
import { DashboardSectionTitle } from '../../components/dashboard/DashboardSectionTitle';
import { DashboardActionRow } from '../../components/dashboard/shared/DashboardActionRow';
import {
  Card,
  HeaderBackButton,
  RequireAccommodationAccess,
  Screen,
  SkeletonCard,
} from '../../components/ui';
import {
  AccommodationOccupantSection,
  AccommodationOccupancyActions,
} from '../../components/occupancy';
import { useActiveSpaceId } from '../../hooks/useActiveSpaceId';
import { useSpacePermissions } from '../../hooks/useSpacePermissions';
import { useTargetOccupancy } from '../../hooks/useTargetOccupancy';
import {
  useDeactivateRoom,
  useDeleteRoom,
  useRestoreRoom,
} from '../../hooks/accommodationLifecycle';
import { useAccommodationLifecycleConfirm } from '../../hooks/useAccommodationLifecycleConfirm';
import { toAccommodationBedsParams } from '../../utils/accommodationNavigation';
import type { MainStackParamList } from '../../navigation/types';
import { useToastStore } from '../../store/toastStore';
import { spacing, typography } from '../../theme';
import { getAccommodationErrorMessage } from '../../utils/accommodationErrors';
import {
  buildRoomOccupancyTarget,
  isOccupancyTargetSupported,
} from '../../utils/buildOccupancyTarget';
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

  const permissions = useSpacePermissions(spaceId);
  const spaceType = permissions.spaceType;
  const { profile } = useAccommodationUiProfile(spaceId, spaceType, buildingId);

  const [room, setRoom] = useState<RoomResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const showsOccupant =
    room?.status === 'OCCUPIED' || room?.status === 'RESERVED';
  const canViewOccupant = permissions.canViewSpaceOccupancies;
  const canManageOccupancyActions = permissions.canManageOccupancy;
  const supportsRoomOccupancy = Boolean(
    spaceType && isOccupancyTargetSupported(spaceType, 'ROOM'),
  );
  const {
    occupancy,
    loading: occupancyLoading,
    error: occupancyError,
    refresh: refreshOccupancy,
  } = useTargetOccupancy(
    spaceId,
    { roomId },
    {
      enabled: showsOccupant && (canViewOccupant || canManageOccupancyActions),
    },
  );

  const occupancyTarget = useMemo(() => {
    if (!room || !supportsRoomOccupancy) {
      return null;
    }
    return buildRoomOccupancyTarget({
      buildingId: room.buildingId ?? buildingId,
      buildingName: '',
      floorId: room.floorId ?? floorId ?? undefined,
      unitId: room.unitId ?? unitId ?? undefined,
      roomId: room.roomId,
      roomName: room.name,
    });
  }, [buildingId, floorId, room, supportsRoomOccupancy, unitId]);

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
      setError(
        getAccommodationErrorMessage(err, 'accommodation.errors.loadRooms'),
      );
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
    return (
      <Screen contentStyle={styles.content}>
        <SkeletonCard />
        <View style={styles.gap} />
        <SkeletonCard />
        <View style={styles.gap} />
        <SkeletonCard />
      </Screen>
    );
  }

  return (
    <RequireAccommodationAccess spaceId={spaceId}>
      <Screen scrollable contentStyle={styles.content}>
        {error ? (
          <View style={styles.errorBanner}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        ) : null}
        {room ? (
          <>
            <AccommodationEntityHero
              level="room"
              title={room.name}
              subtitle={`${t('accommodation.rooms.roomNumberLabel')}: ${
                room.roomNumber
              }`}
              meta={t(`accommodation.roomType.${room.roomType}`)}
              badge={<AccommodationStatusBadge status={room.status} />}
            />

            <DashboardSectionTitle
              title={t('accommodation.setup.propertyOverview')}
            />
            <Card style={styles.infoCard}>
              <AccommodationDetailRow
                label={t('accommodation.fields.name')}
                value={room.name}
              />
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

            {room &&
            spaceType &&
            occupancyTarget &&
            canManageOccupancyActions ? (
              <AccommodationOccupancyActions
                spaceId={spaceId}
                spaceType={spaceType}
                accommodationStatus={room.status}
                target={occupancyTarget}
                occupancy={occupancy}
                onSuccess={() => {
                  void loadRoom();
                  void refreshOccupancy();
                }}
              />
            ) : null}

            {profile?.showBeds ? (
              <View style={styles.actionsSection}>
                <DashboardSectionTitle
                  title={t('membership.details.actionsHeading', {
                    defaultValue: 'Actions',
                  })}
                />
                <DashboardActionRow
                  icon={BedDouble}
                  accent="#16A34A"
                  title={t('accommodation.beds.view')}
                  subtitle={t('accommodation.layout.dashboard.bedsSection')}
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
                />
              </View>
            ) : null}

            <AccommodationLifecycleActions
              actions={room.actions}
              role={permissions.membershipRole}
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
    </RequireAccommodationAccess>
  );
}

const styles = StyleSheet.create({
  content: { padding: spacing.lg, paddingBottom: spacing.xxxl },
  infoCard: { borderRadius: 18, marginBottom: spacing.xl },
  actionsSection: { marginBottom: spacing.xl },
  gap: { height: spacing.md },
  errorBanner: {
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FECACA',
    borderRadius: 18,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  errorText: { ...typography.body, fontSize: 14, color: '#DC2626' },
});
