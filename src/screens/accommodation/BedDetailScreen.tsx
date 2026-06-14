import React, { useCallback, useLayoutEffect, useMemo, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useFocusEffect, useNavigation, useRoute } from '@react-navigation/native';
import type {
  NativeStackNavigationProp,
  NativeStackScreenProps,
} from '@react-navigation/native-stack';
import { useTranslation } from 'react-i18next';
import { accommodationApi } from '../../api/accommodationApi';
import type { BedResponse } from '../../api/types';
import {
  AccommodationContextTrail,
  AccommodationDetailRow,
  AccommodationLifecycleActions,
  AccommodationStatusBadge,
  formatAccommodationDate,
} from '../../components/accommodation';
import { AccommodationOccupantSection, AccommodationOccupancyActions } from '../../components/occupancy';
import { Card, HeaderBackButton, RequireAccommodationAccess, Screen, SkeletonCard } from '../../components/ui';
import { useActiveSpaceId } from '../../hooks/useActiveSpaceId';
import { useSpacePermissions } from '../../hooks/useSpacePermissions';
import { useTargetOccupancy } from '../../hooks/useTargetOccupancy';
import {
  useDeactivateBed,
  useDeleteBed,
  useRestoreBed,
} from '../../hooks/accommodationLifecycle';
import { useAccommodationLifecycleConfirm } from '../../hooks/useAccommodationLifecycleConfirm';
import type { MainStackParamList } from '../../navigation/types';
import { useToastStore } from '../../store/toastStore';
import { spacing, typography } from '../../theme';
import { buildAccommodationTrail } from '../../utils/accommodationContext';
import { getAccommodationErrorMessage } from '../../utils/accommodationErrors';
import { buildBedOccupancyTarget } from '../../utils/buildOccupancyTarget';
import { navigateToAccommodationTrailSegment } from '../../utils/accommodationNavigation';

type Nav = NativeStackNavigationProp<MainStackParamList, 'BedDetail'>;
type Route = NativeStackScreenProps<MainStackParamList, 'BedDetail'>['route'];

export function BedDetailScreen() {
  const { t, i18n } = useTranslation();
  const navigation = useNavigation<Nav>();
  const route = useRoute<Route>();
  const {
    buildingId,
    roomId,
    bedId,
    buildingName,
    parentName,
    parentType,
    floorId,
    unitId,
    roomName,
    bedLabel,
  } = route.params;
  const spaceId = useActiveSpaceId(route.params.spaceId);
  const showToast = useToastStore(state => state.showToast);
  const { confirmDeactivate, confirmRestore, confirmDelete } =
    useAccommodationLifecycleConfirm();
  const { mutate: deactivateBed, loading: deactivating } = useDeactivateBed();
  const { mutate: restoreBed, loading: restoring } = useRestoreBed();
  const { mutate: deleteBed, loading: deleting } = useDeleteBed();
  const lifecycleLoading = deactivating || restoring || deleting;

  const permissions = useSpacePermissions(spaceId);
  const spaceType = permissions.spaceType;

  const [bed, setBed] = useState<BedResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const showsOccupant =
    bed?.status === 'OCCUPIED' || bed?.status === 'RESERVED';
  const canViewOccupant = permissions.canViewSpaceOccupancies;
  const canManageOccupancyActions = permissions.canManageOccupancy;
  const hasBedOccupant = Boolean(bed?.occupant);
  const {
    occupancy,
    loading: occupancyLoading,
    error: occupancyError,
    refresh: refreshOccupancy,
  } = useTargetOccupancy(
    spaceId,
    { bedId },
    { enabled: showsOccupant && (canViewOccupant || canManageOccupancyActions) },
  );

  const occupancyTarget = useMemo(() => {
    if (!bed) {
      return null;
    }
    return buildBedOccupancyTarget({
      buildingId,
      buildingName,
      floorId,
      floorName: parentType === 'floor' ? parentName : undefined,
      unitId,
      unitName: parentType === 'unit' ? parentName : undefined,
      roomId,
      roomName: roomName ?? '',
      bedId: bed.bedId,
      bedName: bed.name ?? bed.bedNumber,
    });
  }, [
    bed,
    buildingId,
    buildingName,
    floorId,
    parentName,
    parentType,
    roomId,
    roomName,
    unitId,
  ]);

  const trailContext = useMemo(
    () => ({
      spaceId,
      buildingId,
      buildingName,
      floorId,
      floorName: parentType === 'floor' ? parentName : undefined,
      unitId,
      unitName: parentType === 'unit' ? parentName : undefined,
      roomId,
      roomName,
      bedLabel: bedLabel ?? bed?.bedNumber ?? bed?.name,
    }),
    [
      bed?.bedNumber,
      bed?.name,
      bedLabel,
      buildingId,
      buildingName,
      floorId,
      parentName,
      parentType,
      roomId,
      roomName,
      spaceId,
      unitId,
    ],
  );

  const trailSegments = useMemo(
    () => buildAccommodationTrail(trailContext, 'bed'),
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
      title: bed?.name ?? bedLabel ?? t('accommodation.beds.detailTitle'),
      headerBackVisible: false,
      headerLeft: () => <HeaderBackButton />,
    });
  }, [bed?.name, bedLabel, navigation, t, i18n.language]);

  const loadBed = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await accommodationApi.getBedById(spaceId, bedId);
      setBed(data);
    } catch (err) {
      setError(getAccommodationErrorMessage(err, 'accommodation.errors.loadBeds'));
    } finally {
      setLoading(false);
    }
  }, [bedId, spaceId]);

  useFocusEffect(
    useCallback(() => {
      void loadBed();
      void refreshOccupancy();
    }, [loadBed, refreshOccupancy]),
  );

  if (loading && !bed) {
    return <Screen contentStyle={styles.content}><SkeletonCard /></Screen>;
  }

  return (
    <RequireAccommodationAccess spaceId={spaceId}>
    <Screen scrollable contentStyle={styles.content}>
      {error ? <Text style={styles.errorText}>{error}</Text> : null}
      {bed ? (
        <>
          <AccommodationContextTrail segments={trailSegments} onNavigate={onTrailNavigate} />
          <View style={styles.badgeRow}>
            <AccommodationStatusBadge status={bed.status} />
          </View>
          <Card>
            <AccommodationDetailRow label={t('accommodation.fields.name')} value={bed.name} />
            <AccommodationDetailRow
              label={t('accommodation.beds.bedNumberLabel')}
              value={bed.bedNumber}
            />
            <AccommodationDetailRow
              label={t('accommodation.status.label')}
              value={t(`accommodation.status.${bed.status}`)}
            />
            <AccommodationDetailRow
              label={t('accommodation.fields.created')}
              value={formatAccommodationDate(bed.createdAt)}
            />
            <AccommodationDetailRow
              label={t('accommodation.fields.updated')}
              value={formatAccommodationDate(bed.updatedAt)}
            />
          </Card>

          {showsOccupant && canViewOccupant ? (
            <AccommodationOccupantSection
              spaceId={spaceId}
              occupant={bed.occupant}
              occupancy={occupancy}
              loading={!hasBedOccupant && occupancyLoading}
              error={!hasBedOccupant ? occupancyError : null}
            />
          ) : null}

          {bed && spaceType && occupancyTarget && canManageOccupancyActions ? (
            <AccommodationOccupancyActions
              spaceId={spaceId}
              spaceType={spaceType}
              accommodationStatus={bed.status}
              target={occupancyTarget}
              occupancy={occupancy}
              onSuccess={() => {
                void loadBed();
                void refreshOccupancy();
              }}
            />
          ) : null}

          <AccommodationLifecycleActions
            actions={bed.actions}
            role={permissions.membershipRole}
            loading={lifecycleLoading}
            onEdit={() =>
              navigation.navigate('BedForm', {
                spaceId,
                buildingId: route.params.buildingId,
                roomId,
                mode: 'edit',
                bedId,
              })
            }
            onDeactivate={() =>
              confirmDeactivate(
                () => deactivateBed(spaceId, bedId),
                () => {
                  showToast(t('accommodation.lifecycle.deactivateSuccess'));
                  navigation.goBack();
                },
              )
            }
            onRestore={() =>
              confirmRestore(
                () => restoreBed(spaceId, bedId),
                () => {
                  showToast(t('accommodation.lifecycle.restoreSuccess'));
                  void loadBed();
                },
              )
            }
            onDelete={() =>
              confirmDelete(
                'bed',
                () => deleteBed(spaceId, bedId),
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
  badgeRow: { marginBottom: spacing.md },
});
