import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useTranslation } from 'react-i18next';
import type {
  CurrentOccupancySummaryResponse,
  MemberDetailsResponse,
  MembershipRole,
  OccupancyResponse,
  SpaceType,
} from '../../api/types';
import { Button, Card, useConfirmDialog } from '../ui';
import type { MainStackParamList } from '../../navigation/types';
import { openOccupancyWizardFromRef } from '../../features/occupancy/OccupancyWizard';
import { useMemberOccupancies } from '../../hooks/useMemberOccupancies';
import { useOccupancyMutations } from '../../hooks/useOccupancyMutations';
import { useSpacePermissions } from '../../hooks/useSpacePermissions';
import { useMemberStore } from '../../store/memberStore';
import { useToastStore } from '../../store/toastStore';
import { useAuthStore } from '../../store/authStore';
import { colors, spacing, typography } from '../../theme';
import { isAccommodationApplicable } from '../../utils/accommodationProfile';
import { supportsSpaceAmenities } from '../../utils/amenities';
import {
  canShowOccupancyActionsForMember,
  canViewMemberOccupancyForProfile,
  shouldShowOccupancySection,
} from '../../utils/occupancyPermissions';
import {
  formatOccupancyAllocatedDate,
  getOccupancyExitDate,
} from '../../utils/occupancyRules';
import { OccupancyContractSnapshotCard } from './OccupancyContractSnapshotCard';

type Nav = NativeStackNavigationProp<MainStackParamList>;

type MemberAccommodationSectionProps = {
  spaceId: string;
  spaceType: SpaceType | undefined;
  member: MemberDetailsResponse;
  currentRole?: MembershipRole;
};

function LocationLine({ label, value }: { label: string; value?: string | null }) {
  if (!value) {
    return null;
  }
  return (
    <View style={styles.locationRow}>
      <Text style={styles.locationLabel}>{label}</Text>
      <Text style={styles.locationValue}>{value}</Text>
    </View>
  );
}

function summaryFromOccupancy(
  occupancy: OccupancyResponse,
): CurrentOccupancySummaryResponse {
  return {
    occupancyId: occupancy.occupancyId,
    occupancyStatus: occupancy.status,
    targetType: occupancy.targetType,
    buildingId: occupancy.buildingId,
    buildingName: occupancy.buildingName,
    floorId: occupancy.floorId,
    floorName: occupancy.floorName,
    unitId: occupancy.unitId,
    unitName: occupancy.unitName,
    roomId: occupancy.roomId,
    roomName: occupancy.roomName,
    bedId: occupancy.bedId,
    bedName: occupancy.bedName,
    moveInDate: occupancy.moveInDate,
  };
}

function AccommodationLocationDetails({
  occupancy,
}: {
  occupancy: CurrentOccupancySummaryResponse;
}) {
  const { t } = useTranslation();

  return (
    <View style={styles.locationBlock}>
      <LocationLine label={t('occupancy.section.building')} value={occupancy.buildingName} />
      <LocationLine label={t('occupancy.section.floor')} value={occupancy.floorName} />
      <LocationLine label={t('occupancy.section.unit')} value={occupancy.unitName} />
      <LocationLine label={t('occupancy.section.room')} value={occupancy.roomName} />
      <LocationLine label={t('occupancy.section.bed')} value={occupancy.bedName} />
    </View>
  );
}

function OccupancyDateRow({ label, value }: { label: string; value?: string | null }) {
  if (!value) {
    return null;
  }
  return (
    <View style={styles.dateRow}>
      <Text style={styles.locationLabel}>{label}</Text>
      <Text style={styles.dateValue}>{formatOccupancyAllocatedDate(value)}</Text>
    </View>
  );
}

function AssignedAmenitiesList({ amenities }: { amenities: { label: string }[] }) {
  const { t } = useTranslation();
  if (amenities.length === 0) {
    return null;
  }
  return (
    <View style={styles.amenitiesBlock}>
      <Text style={styles.locationLabel}>{t('occupancy.amenities.assigned')}</Text>
      <Text style={styles.amenitiesValue}>{amenities.map(item => item.label).join(', ')}</Text>
    </View>
  );
}

export function MemberAccommodationSection({
  spaceId,
  spaceType,
  member,
  currentRole,
}: MemberAccommodationSectionProps) {
  const { t } = useTranslation();
  const navigation = useNavigation<Nav>();
  const showToast = useToastStore(state => state.showToast);
  const refreshMember = useMemberStore(state => state.refreshMember);
  const { showConfirm } = useConfirmDialog();
  const viewerUserId = useAuthStore(state => state.userId);
  const spacePermissions = useSpacePermissions(spaceId);

  const showSection = Boolean(
    spaceType &&
      isAccommodationApplicable(spaceType) &&
      shouldShowOccupancySection(member.role) &&
      canViewMemberOccupancyForProfile(
        member.role,
        member.linkedUserId,
        currentRole,
        viewerUserId,
        spacePermissions,
      ),
  );

  const { data: occupancyData } = useMemberOccupancies(spaceId, member.memberId, {
    enabled: showSection,
  });
  const { cancelReservation, loading, error } = useOccupancyMutations(spaceId);

  if (!showSection || !spaceType) {
    return null;
  }

  const canManage = canShowOccupancyActionsForMember(
    member.role,
    currentRole,
    spacePermissions,
  );
  const isAllocated = member.occupancyStatus === 'ALLOCATED';
  const isReserved = member.occupancyStatus === 'RESERVED';

  const activeOccupancy = occupancyData?.currentOccupancy;
  const reservedOccupancy = occupancyData?.reservedOccupancy;
  const activeOccupancyId = activeOccupancy?.occupancyId;
  const reservedOccupancyId = reservedOccupancy?.occupancyId;

  const activeSummary =
    member.currentOccupancy?.occupancyStatus === 'ACTIVE'
      ? member.currentOccupancy
      : activeOccupancy
        ? summaryFromOccupancy(activeOccupancy)
        : member.currentOccupancy;

  const reservedSummary =
    member.currentOccupancy?.occupancyStatus === 'RESERVED'
      ? member.currentOccupancy
      : reservedOccupancy
        ? summaryFromOccupancy(reservedOccupancy)
        : null;

  const assignedAmenities =
    member.assignedAmenities?.length
      ? member.assignedAmenities
      : activeOccupancy?.amenities?.length
        ? activeOccupancy.amenities
        : reservedOccupancy?.amenities?.length
          ? reservedOccupancy.amenities
          : [];

  function openWizard(mode: 'ALLOCATE' | 'RESERVE' | 'MOVE_IN' | 'TRANSFER' | 'VACATE') {
    openOccupancyWizardFromRef({
      spaceId,
      mode,
      memberId: member.memberId,
      occupancyId:
        mode === 'MOVE_IN'
          ? reservedOccupancyId
          : mode === 'TRANSFER' || mode === 'VACATE'
            ? activeOccupancyId
            : undefined,
    });
  }

  async function afterMutation() {
    await refreshMember(member.memberId);
    showToast(t('occupancy.success.updated'));
  }

  function confirmCancelReservation() {
    showConfirm({
      title: t('occupancy.cancelReservation.title'),
      message: t('occupancy.cancelReservation.message'),
      confirmLabel: t('occupancy.actions.cancelReservation'),
      destructive: true,
      onConfirm: async () => {
        if (!reservedOccupancyId) {
          showToast(t('occupancy.errors.noReserved'));
          return;
        }
        try {
          await cancelReservation(reservedOccupancyId);
          await afterMutation();
        } catch {
          // error surfaced via hook
        }
      },
    });
  }

  return (
    <View style={styles.wrap}>
      <Text style={styles.sectionTitle}>{t('occupancy.section.title')}</Text>
      <Card style={styles.card}>
        {isAllocated && activeSummary ? (
          <>
            <Text style={styles.cardHeading}>{t('occupancy.section.currentAccommodation')}</Text>
            <Text style={styles.statusBadge}>{t('occupancy.status.ACTIVE')}</Text>
            <AccommodationLocationDetails occupancy={activeSummary} />
            <OccupancyDateRow
              label={t('occupancy.section.moveInDate')}
              value={activeOccupancy?.actualMoveInAt ?? activeOccupancy?.moveInDate}
            />
            <OccupancyDateRow
              label={t('occupancy.section.allocatedOn')}
              value={activeOccupancy?.allocatedAt}
            />
            <OccupancyDateRow
              label={t('occupancy.fields.expectedExit')}
              value={getOccupancyExitDate(activeOccupancy)}
            />
            {activeOccupancy ? (
              <OccupancyContractSnapshotCard occupancy={activeOccupancy} />
            ) : null}
            {supportsSpaceAmenities(spaceType) ? (
              <AssignedAmenitiesList amenities={assignedAmenities} />
            ) : null}
          </>
        ) : isReserved && reservedSummary ? (
          <>
            <Text style={styles.cardHeading}>{t('occupancy.section.reservedAccommodation')}</Text>
            <Text style={[styles.statusBadge, styles.statusReserved]}>
              {t('occupancy.status.RESERVED')}
            </Text>
            <AccommodationLocationDetails occupancy={reservedSummary} />
            <OccupancyDateRow
              label={t('occupancy.section.moveInDate')}
              value={reservedOccupancy?.moveInDate ?? reservedSummary.moveInDate}
            />
            <OccupancyDateRow
              label={t('occupancy.section.reservedOn')}
              value={reservedOccupancy?.reservedAt}
            />
            <OccupancyDateRow
              label={t('occupancy.fields.expectedExit')}
              value={getOccupancyExitDate(reservedOccupancy)}
            />
            {supportsSpaceAmenities(spaceType) ? (
              <AssignedAmenitiesList amenities={assignedAmenities} />
            ) : null}
          </>
        ) : (
          <>
            <Text style={styles.cardHeading}>{t('occupancy.section.noAccommodationTitle')}</Text>
            <Text style={styles.notAllocated}>{t('occupancy.section.noAccommodationBody')}</Text>
          </>
        )}

        {error ? <Text style={styles.errorText}>{error}</Text> : null}

        {canManage ? (
          <View style={styles.actions}>
            {isAllocated ? (
              <>
                <Button
                  label={t('occupancy.actions.transfer')}
                  variant="secondary"
                  onPress={() => openWizard('TRANSFER')}
                  disabled={loading}
                  style={styles.actionBtn}
                />
                <Button
                  label={t('occupancy.actions.vacate')}
                  variant="ghost"
                  onPress={() => openWizard('VACATE')}
                  disabled={loading}
                  style={styles.actionBtn}
                />
              </>
            ) : isReserved ? (
              <>
                <Button
                  label={t('occupancy.actions.moveIn')}
                  onPress={() => openWizard('MOVE_IN')}
                  disabled={loading}
                  style={styles.actionBtn}
                />
                <Button
                  label={t('occupancy.actions.cancelReservation')}
                  variant="ghost"
                  onPress={confirmCancelReservation}
                  disabled={loading}
                  style={styles.actionBtn}
                />
              </>
            ) : (
              <>
                <Button
                  label={t('occupancy.actions.reserve')}
                  onPress={() => openWizard('RESERVE')}
                  disabled={loading}
                  style={styles.actionBtn}
                />
                <Button
                  label={t('occupancy.actions.walkInAllocate')}
                  variant="secondary"
                  onPress={() => openWizard('ALLOCATE')}
                  disabled={loading}
                  style={styles.actionBtn}
                />
              </>
            )}
          </View>
        ) : null}

        <Button
          label={t('occupancy.actions.viewHistory')}
          variant="ghost"
          onPress={() =>
            navigation.navigate('MemberOccupancyHistory', {
              spaceId,
              memberId: member.memberId,
              memberName: member.fullName,
            })
          }
          style={styles.historyBtn}
        />
      </Card>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    marginBottom: spacing.lg,
  },
  sectionTitle: {
    ...typography.bodyStrong,
    marginBottom: spacing.sm,
  },
  card: {
    gap: spacing.xs,
  },
  cardHeading: {
    ...typography.bodyStrong,
    marginBottom: spacing.sm,
  },
  statusBadge: {
    ...typography.caption,
    color: colors.primaryDark,
    fontWeight: '600',
    marginBottom: spacing.sm,
  },
  statusReserved: {
    color: '#B45309',
  },
  locationBlock: {
    gap: spacing.xs,
    marginBottom: spacing.sm,
  },
  locationRow: {
    gap: 2,
  },
  locationLabel: {
    ...typography.caption,
    color: colors.muted,
  },
  locationValue: {
    ...typography.body,
  },
  dateRow: {
    marginTop: spacing.xs,
    gap: 2,
  },
  dateValue: {
    ...typography.bodyStrong,
  },
  amenitiesBlock: {
    marginTop: spacing.sm,
    gap: 2,
  },
  amenitiesValue: {
    ...typography.body,
  },
  notAllocated: {
    ...typography.body,
    color: colors.muted,
    marginBottom: spacing.sm,
  },
  actions: {
    marginTop: spacing.md,
    gap: spacing.sm,
  },
  actionBtn: {
    width: '100%',
  },
  historyBtn: {
    marginTop: spacing.sm,
  },
  errorText: {
    ...typography.caption,
    color: '#DC2626',
    marginTop: spacing.sm,
  },
});
