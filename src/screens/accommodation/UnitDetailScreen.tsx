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
import { DoorOpen } from 'lucide-react-native';
import { accommodationApi } from '../../api/accommodationApi';
import type { UnitResponse } from '../../api/types';
import {
  AccommodationContextTrail,
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
  useDeactivateUnit,
  useDeleteUnit,
  useRestoreUnit,
} from '../../hooks/accommodationLifecycle';
import { useAccommodationLifecycleConfirm } from '../../hooks/useAccommodationLifecycleConfirm';
import type { MainStackParamList } from '../../navigation/types';
import { useToastStore } from '../../store/toastStore';
import { spacing, typography } from '../../theme';
import { buildAccommodationTrail } from '../../utils/accommodationContext';
import { getAccommodationErrorMessage } from '../../utils/accommodationErrors';
import { buildUnitOccupancyTarget } from '../../utils/buildOccupancyTarget';
import { navigateToAccommodationTrailSegment } from '../../utils/accommodationNavigation';
import { useAccommodationUiProfile } from '../../hooks/useAccommodationUiProfile';

type Nav = NativeStackNavigationProp<MainStackParamList, 'UnitDetail'>;
type Route = NativeStackScreenProps<MainStackParamList, 'UnitDetail'>['route'];

export function UnitDetailScreen() {
  const { t, i18n } = useTranslation();
  const navigation = useNavigation<Nav>();
  const route = useRoute<Route>();
  const { buildingId, buildingName, unitId } = route.params;
  const spaceId = useActiveSpaceId(route.params.spaceId);
  const showToast = useToastStore(state => state.showToast);
  const { confirmDeactivate, confirmRestore, confirmDelete } =
    useAccommodationLifecycleConfirm();
  const { mutate: deactivateUnit, loading: deactivating } = useDeactivateUnit();
  const { mutate: restoreUnit, loading: restoring } = useRestoreUnit();
  const { mutate: deleteUnit, loading: deleting } = useDeleteUnit();
  const lifecycleLoading = deactivating || restoring || deleting;

  const permissions = useSpacePermissions(spaceId);
  const spaceType = permissions.spaceType;
  const { profile } = useAccommodationUiProfile(spaceId, spaceType, buildingId);

  const [unit, setUnit] = useState<UnitResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const showsOccupant =
    unit?.status === 'OCCUPIED' || unit?.status === 'RESERVED';
  const canViewOccupant = permissions.canViewSpaceOccupancies;
  const canManageOccupancyActions = permissions.canManageOccupancy;
  const {
    occupancy,
    loading: occupancyLoading,
    error: occupancyError,
    refresh: refreshOccupancy,
  } = useTargetOccupancy(
    spaceId,
    { unitId },
    {
      enabled: showsOccupant && (canViewOccupant || canManageOccupancyActions),
    },
  );

  const occupancyTarget = useMemo(() => {
    if (!unit) {
      return null;
    }
    return buildUnitOccupancyTarget({
      buildingId,
      buildingName: buildingName ?? '',
      unitId: unit.unitId,
      unitName: unit.name,
    });
  }, [buildingId, buildingName, unit]);

  const trailContext = useMemo(
    () => ({
      spaceId,
      buildingId,
      buildingName,
      unitId,
      unitName: unit?.name,
    }),
    [buildingId, buildingName, spaceId, unit?.name, unitId],
  );

  const trailSegments = useMemo(
    () => buildAccommodationTrail(trailContext, 'unit'),
    [trailContext],
  );

  const onTrailNavigate = useCallback(
    (level: Parameters<typeof navigateToAccommodationTrailSegment>[2]) => {
      navigateToAccommodationTrailSegment(navigation, trailContext, level);
    },
    [navigation, trailContext],
  );

  useLayoutEffect(() => {
    navigation.setOptions({
      title: unit?.name ?? t('accommodation.units.detailTitle'),
      headerBackVisible: false,
      headerLeft: () => <HeaderBackButton />,
    });
  }, [navigation, t, unit?.name, i18n.language]);

  const loadUnit = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await accommodationApi.getUnitById(spaceId, unitId);
      setUnit(data);
    } catch (err) {
      setError(
        getAccommodationErrorMessage(err, 'accommodation.errors.loadUnits'),
      );
    } finally {
      setLoading(false);
    }
  }, [spaceId, unitId]);

  useFocusEffect(
    useCallback(() => {
      void loadUnit();
      void refreshOccupancy();
    }, [loadUnit, refreshOccupancy]),
  );

  if (loading && !unit) {
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
        {unit ? (
          <>
            <AccommodationContextTrail
              segments={trailSegments}
              onNavigate={onTrailNavigate}
            />
            <AccommodationEntityHero
              level="unit"
              title={unit.name}
              subtitle={buildingName}
              meta={`${t('accommodation.units.unitNumberLabel')}: ${
                unit.unitNumber
              }`}
              badge={<AccommodationStatusBadge status={unit.status} />}
            />

            <DashboardSectionTitle
              title={t('accommodation.setup.propertyOverview')}
            />
            <Card style={styles.infoCard}>
              <AccommodationDetailRow
                label={t('accommodation.fields.name')}
                value={unit.name}
              />
              <AccommodationDetailRow
                label={t('accommodation.units.unitNumberLabel')}
                value={unit.unitNumber}
              />
              <AccommodationDetailRow
                label={t('accommodation.status.label')}
                value={t(`accommodation.status.${unit.status}`)}
              />
              <AccommodationDetailRow
                label={t('accommodation.fields.created')}
                value={formatAccommodationDate(unit.createdAt)}
              />
              <AccommodationDetailRow
                label={t('accommodation.fields.updated')}
                value={formatAccommodationDate(unit.updatedAt)}
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

            {unit &&
            spaceType &&
            occupancyTarget &&
            canManageOccupancyActions ? (
              <AccommodationOccupancyActions
                spaceId={spaceId}
                spaceType={spaceType}
                accommodationStatus={unit.status}
                target={occupancyTarget}
                occupancy={occupancy}
                onSuccess={() => {
                  void loadUnit();
                  void refreshOccupancy();
                }}
              />
            ) : null}

            {profile?.showRoomsUnderUnit ? (
              <View style={styles.actionsSection}>
                <DashboardSectionTitle
                  title={t('membership.details.actionsHeading', {
                    defaultValue: 'Actions',
                  })}
                />
                <DashboardActionRow
                  icon={DoorOpen}
                  accent="#EA580C"
                  title={t('accommodation.rooms.view')}
                  subtitle={t('accommodation.layout.dashboard.roomsSection')}
                  onPress={() =>
                    navigation.navigate('AccommodationRooms', {
                      spaceId,
                      buildingId,
                      buildingName,
                      parentType: 'unit',
                      parentId: unit.unitId,
                      parentName: unit.name,
                    })
                  }
                />
              </View>
            ) : null}

            <AccommodationLifecycleActions
              actions={unit.actions}
              role={permissions.membershipRole}
              loading={lifecycleLoading}
              onEdit={() =>
                navigation.navigate('UnitForm', {
                  spaceId,
                  buildingId,
                  mode: 'edit',
                  unitId,
                })
              }
              onDeactivate={() =>
                confirmDeactivate(
                  () => deactivateUnit(spaceId, unitId),
                  () => {
                    showToast(t('accommodation.lifecycle.deactivateSuccess'));
                    navigation.goBack();
                  },
                )
              }
              onRestore={() =>
                confirmRestore(
                  () => restoreUnit(spaceId, unitId),
                  () => {
                    showToast(t('accommodation.lifecycle.restoreSuccess'));
                    void loadUnit();
                  },
                )
              }
              onDelete={() =>
                confirmDelete(
                  'unit',
                  () => deleteUnit(spaceId, unitId),
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
