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
  BedDetailHero,
  BuilderRowLifecycleMenu,
  formatAccommodationDate,
  HeaderMenuSlot,
} from '../../components/accommodation';
import { AccommodationOccupantSection, AccommodationOccupancyActions } from '../../components/occupancy';
import { Card, HeaderBackButton, RequireAccommodationAccess, Screen, SkeletonCard } from '../../components/ui';
import { useActiveSpaceId } from '../../hooks/useActiveSpaceId';
import { useSpacePermissions } from '../../hooks/useSpacePermissions';
import { useTargetOccupancy } from '../../hooks/useTargetOccupancy';
import type { MainStackParamList } from '../../navigation/types';
import { useToastStore } from '../../store/toastStore';
import { spacing, typography } from '../../theme';
import { buildAccommodationTrail } from '../../utils/accommodationContext';
import { getAccommodationErrorMessage } from '../../utils/accommodationErrors';
import { buildBedOccupancyTarget } from '../../utils/buildOccupancyTarget';
import { formatBedDisplayLabel } from '../../utils/formatBedDisplayLabel';
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

  const resolvedBedLabel = bed?.bedNumber ?? bed?.name ?? bedLabel;
  const displayBedLabel = useMemo(
    () => formatBedDisplayLabel(resolvedBedLabel, t),
    [resolvedBedLabel, t],
  );

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
      bedLabel: displayBedLabel,
    }),
    [
      buildingId,
      buildingName,
      displayBedLabel,
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

  useLayoutEffect(() => {
    navigation.setOptions({
      title: displayBedLabel || t('accommodation.beds.detailTitle'),
      headerBackVisible: false,
      headerLeft: () => <HeaderBackButton />,
      headerRight:
        bed && permissions.canManageAccommodation
          ? () => (
              <HeaderMenuSlot>
                <BuilderRowLifecycleMenu
                  spaceId={spaceId}
                  buildingId={buildingId}
                  entityType="bed"
                  entityId={bedId}
                  roomId={roomId}
                  role={permissions.membershipRole}
                  onEdit={() =>
                    navigation.navigate('BedForm', {
                      spaceId,
                      buildingId: route.params.buildingId,
                      roomId,
                      mode: 'edit',
                      bedId,
                    })
                  }
                  onSuccess={action => {
                    if (action === 'delete' || action === 'deactivate') {
                      showToast(
                        t(
                          action === 'delete'
                            ? 'accommodation.lifecycle.deleteSuccess'
                            : 'accommodation.lifecycle.deactivateSuccess',
                        ),
                      );
                      navigation.goBack();
                      return;
                    }
                    showToast(t('accommodation.lifecycle.restoreSuccess'));
                    void loadBed();
                  }}
                />
              </HeaderMenuSlot>
            )
          : undefined,
    });
  }, [
    bed,
    bedId,
    buildingId,
    displayBedLabel,
    loadBed,
    navigation,
    permissions.canManageAccommodation,
    permissions.membershipRole,
    roomId,
    route.params.buildingId,
    showToast,
    spaceId,
    t,
    i18n.language,
  ]);

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
          <BedDetailHero
            label={displayBedLabel}
            status={bed.status}
            occupantName={
              bed.occupant?.memberName ??
              occupancy?.memberName ??
              null
            }
            subtitle={
              occupancy?.moveInDate
                ? t('occupancy.section.moveInDate') + ': ' + formatAccommodationDate(occupancy.moveInDate)
                : null
            }
          />
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
        </>
      ) : null}
    </Screen>
    </RequireAccommodationAccess>
  );
}

const styles = StyleSheet.create({
  content: { padding: spacing.xxl, paddingBottom: spacing.section },
  errorText: { ...typography.body, color: '#DC2626' },
});
