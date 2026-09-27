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
import { accommodationApi } from '../../api/accommodationApi';
import type { BedResponse } from '../../api/types';
import {
  AccommodationContextTrail,
  AccommodationDetailRow,
  BedDetailHero,
  BedPricingDisplay,
  BuilderRowLifecycleMenu,
  formatAccommodationDate,
  HeaderMenuSlot,
  PersistedBedInteractionHost,
} from '../../components/accommodation';
import { DashboardSectionTitle } from '../../components/dashboard/DashboardSectionTitle';
import {
  AccommodationOccupantSection,
  AccommodationOccupancyActions,
} from '../../components/occupancy';
import {
  Card,
  HeaderBackButton,
  RequireAccommodationAccess,
  Screen,
  SkeletonCard,
} from '../../components/ui';
import { useActiveSpaceId } from '../../hooks/useActiveSpaceId';
import { usePersistedBedInteraction } from '../../hooks/usePersistedBedInteraction';
import { useSpacePermissions } from '../../hooks/useSpacePermissions';
import { canEditEntityPhoto } from '../../files/entityPhoto';
import { EntityPhotoProvider } from '../../files/EntityPhotoContext';
import { useTargetOccupancy } from '../../hooks/useTargetOccupancy';
import type { MainStackParamList } from '../../navigation/types';
import { useToastStore } from '../../store/toastStore';
import { colors, radius, shadows, spacing, typography } from '../../theme';
import { buildAccommodationTrail } from '../../utils/accommodationContext';
import { getAccommodationErrorMessage } from '../../utils/accommodationErrors';
import { buildBedOccupancyTarget } from '../../utils/buildOccupancyTarget';
import { formatBedDisplayLabel } from '../../utils/formatBedDisplayLabel';
import { handleAccommodationTrailPress } from '../../utils/accommodationNavigation';
import { persistedTargetFromRoomBed } from '../../utils/persistedBedTarget';

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
  const canManage = permissions.canManageAccommodation;
  const hasBedOccupant = Boolean(bed?.occupant);
  const {
    occupancy,
    loading: occupancyLoading,
    error: occupancyError,
    refresh: refreshOccupancy,
  } = useTargetOccupancy(
    spaceId,
    { bedId },
    {
      enabled: showsOccupant && (canViewOccupant || canManageOccupancyActions),
    },
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
      bedId,
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
      bedId,
    ],
  );

  const trailSegments = useMemo(
    () => buildAccommodationTrail(trailContext, 'bed'),
    [trailContext],
  );

  const onTrailNavigate = useCallback(
    (level: Parameters<typeof handleAccommodationTrailPress>[2]) => {
      handleAccommodationTrailPress(navigation, trailContext, level, canManage);
    },
    [canManage, navigation, trailContext],
  );

  const loadBed = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await accommodationApi.getBedById(spaceId, bedId);
      setBed(data);
    } catch (err) {
      setError(
        getAccommodationErrorMessage(err, 'accommodation.errors.loadBeds'),
      );
    } finally {
      setLoading(false);
    }
  }, [bedId, spaceId]);

  const bedInteraction = usePersistedBedInteraction({
    spaceId,
    spaceType,
    canEditStructure: canManage,
    canManageOccupancy: canManageOccupancyActions,
    onSuccess: async () => {
      await loadBed();
      await refreshOccupancy();
    },
  });

  const openBedEditor = useCallback(() => {
    if (!bed || !canManage) {
      return;
    }
    bedInteraction.open(
      persistedTargetFromRoomBed({
        bedId: bed.bedId,
        roomId,
        label: bed.bedNumber || bed.name,
        status: bed.status,
        rent: bed.defaultRent,
        deposit: bed.defaultDeposit,
        buildingId,
        buildingName,
        roomName: roomName ?? parentName ?? '',
        floorId,
        unitId,
        parentName,
        parentType,
      }),
    );
  }, [
    bed,
    bedInteraction,
    buildingId,
    buildingName,
    canManage,
    floorId,
    parentName,
    parentType,
    roomId,
    roomName,
    unitId,
  ]);

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
                  onEdit={openBedEditor}
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
    openBedEditor,
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
      <EntityPhotoProvider
        spaceId={spaceId}
        canEdit={canEditEntityPhoto(permissions.membershipRole)}>
      <Screen scrollable contentStyle={styles.content}>
        {error ? (
          <View style={styles.errorBanner}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        ) : null}
        {bed ? (
          <>
            <AccommodationContextTrail
              segments={trailSegments}
              onNavigate={onTrailNavigate}
            />
            <BedDetailHero
              label={displayBedLabel}
              status={bed.status}
              bedNumber={bed.bedNumber}
              roomName={roomName ?? parentName}
              bedId={bed.bedId}
              photoFileId={bed.photoFileId}
              occupantName={
                bed.occupant?.memberName ?? occupancy?.memberName ?? null
              }
              subtitle={
                occupancy?.moveInDate
                  ? t('occupancy.section.moveInDate') +
                    ': ' +
                    formatAccommodationDate(occupancy.moveInDate)
                  : null
              }
              onEdit={canManage ? openBedEditor : undefined}
            />

            <View style={styles.pricingCard}>
              <BedPricingDisplay
                rent={bed.defaultRent}
                deposit={bed.defaultDeposit}
                layout="row"
              />
            </View>

            {showsOccupant && canViewOccupant ? (
              <AccommodationOccupantSection
                spaceId={spaceId}
                occupant={bed.occupant}
                occupancy={occupancy}
                loading={!hasBedOccupant && occupancyLoading}
                error={!hasBedOccupant ? occupancyError : null}
              />
            ) : null}

            {bed &&
            spaceType &&
            occupancyTarget &&
            canManageOccupancyActions ? (
              <AccommodationOccupancyActions
                spaceId={spaceId}
                spaceType={spaceType}
                accommodationStatus={bed.status}
                target={occupancyTarget}
                occupancy={occupancy}
                layout="stack"
                onSuccess={() => {
                  void loadBed();
                  void refreshOccupancy();
                }}
              />
            ) : null}

            <DashboardSectionTitle
              title={t('accommodation.setup.propertyOverview')}
            />
            <Card style={styles.infoCard}>
              <AccommodationDetailRow
                label={t('accommodation.fields.name')}
                value={bed.name}
              />
              <AccommodationDetailRow
                label={t('accommodation.beds.bedNumberLabel')}
                value={bed.bedNumber}
              />
              <AccommodationDetailRow
                label={t('accommodation.status.label')}
                value={t(`accommodation.status.${bed.status}`)}
              />
              {roomName ? (
                <AccommodationDetailRow
                  label={t('occupancy.section.room')}
                  value={roomName}
                />
              ) : null}
              {trailContext.unitName ? (
                <AccommodationDetailRow
                  label={t('occupancy.section.unit')}
                  value={trailContext.unitName}
                />
              ) : null}
              {trailContext.floorName ? (
                <AccommodationDetailRow
                  label={t('occupancy.section.floor')}
                  value={trailContext.floorName}
                />
              ) : null}
              {buildingName ? (
                <AccommodationDetailRow
                  label={t('occupancy.section.building')}
                  value={buildingName}
                />
              ) : null}
              <AccommodationDetailRow
                label={t('accommodation.fields.created')}
                value={formatAccommodationDate(bed.createdAt)}
              />
              <AccommodationDetailRow
                label={t('accommodation.fields.updated')}
                value={formatAccommodationDate(bed.updatedAt)}
              />
            </Card>
          </>
        ) : null}
        <PersistedBedInteractionHost
          interaction={bedInteraction}
          spaceId={spaceId}
          spaceType={spaceType}
        />
      </Screen>
      </EntityPhotoProvider>
    </RequireAccommodationAccess>
  );
}

const styles = StyleSheet.create({
  content: { padding: spacing.lg, paddingBottom: spacing.xxxl },
  infoCard: { borderRadius: 18, marginBottom: spacing.xl },
  gap: { height: spacing.md },
  pricingCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    borderRadius: radius.card,
    borderWidth: 1,
    borderColor: colors.border,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
    marginBottom: spacing.md,
    ...shadows.sm,
  },
  pricingCol: {
    flex: 1,
    minWidth: 0,
    gap: spacing.xs,
  },
  pricingDivider: {
    width: StyleSheet.hairlineWidth,
    alignSelf: 'stretch',
    backgroundColor: colors.border,
    marginHorizontal: spacing.md,
  },
  pricingLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  pricingIcon: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pricingLabel: {
    ...typography.caption,
    color: colors.textSecondary,
    fontWeight: '600',
  },
  pricingValue: {
    ...typography.h3,
    fontSize: 20,
    lineHeight: 26,
    color: colors.textPrimary,
    paddingLeft: 36,
  },
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
