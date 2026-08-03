import React, { useCallback, useLayoutEffect, useState } from 'react';
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
import { DoorOpen } from 'lucide-react-native';
import { accommodationApi } from '../../api/accommodationApi';
import type { FloorResponse } from '../../api/types';
import {
  AccommodationDetailRow,
  AccommodationEntityHero,
  AccommodationLifecycleActions,
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
import { colors, spacing, typography } from '../../theme';
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
  const { mutate: deactivateFloor, loading: deactivating } =
    useDeactivateFloor();
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
      setError(
        getAccommodationErrorMessage(err, 'accommodation.errors.loadFloors'),
      );
    } finally {
      setLoading(false);
    }
  }, [floorId, spaceId]);

  useFocusEffect(
    useCallback(() => {
      void loadFloor();
    }, [loadFloor]),
  );

  if (loading && !floor) {
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
        {floor ? (
          <>
            <AccommodationEntityHero
              level="floor"
              title={floor.name}
              subtitle={buildingName}
              meta={`${t('accommodation.floors.floorNumberLabel')}: ${
                floor.floorNumber
              }`}
              badge={
                <View
                  style={[
                    styles.activityBadge,
                    !floor.active && styles.activityBadgeInactive,
                  ]}
                >
                  <Text
                    style={[
                      styles.activityBadgeText,
                      !floor.active && styles.activityBadgeTextInactive,
                    ]}
                  >
                    {floor.active
                      ? t('accommodation.active', { defaultValue: 'Active' })
                      : t('accommodation.inactive.deactivated')}
                  </Text>
                </View>
              }
            />

            <DashboardSectionTitle
              title={t('accommodation.setup.propertyOverview')}
            />
            <Card style={styles.infoCard}>
              <AccommodationDetailRow
                label={t('accommodation.fields.name')}
                value={floor.name}
              />
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

            <View style={styles.actionsSection}>
              <DashboardSectionTitle
                title={t('membership.details.actionsHeading', {
                  defaultValue: 'Actions',
                })}
              />
              <DashboardActionRow
                icon={DoorOpen}
                accent="#7C3AED"
                title={t('accommodation.rooms.view')}
                subtitle={t('accommodation.layout.dashboard.roomsSection')}
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
              />
            </View>

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
  content: { padding: spacing.lg, paddingBottom: spacing.xxxl },
  infoCard: { borderRadius: 18, marginBottom: spacing.xl },
  actionsSection: { marginBottom: spacing.xl },
  gap: { height: spacing.md },
  activityBadge: {
    borderRadius: 18,
    backgroundColor: '#F3E8FF',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
  },
  activityBadgeInactive: { backgroundColor: colors.surface },
  activityBadgeText: {
    ...typography.caption,
    color: '#7C3AED',
    fontWeight: '700',
  },
  activityBadgeTextInactive: { color: colors.textSecondary },
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
