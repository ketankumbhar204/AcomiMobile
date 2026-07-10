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
import { MemberOccupancyStatusBadge } from '../member/MemberOccupancyStatusBadge';
import type { MainStackParamList } from '../../navigation/types';
import { openOccupancyWizardFromRef } from '../../features/occupancy/OccupancyWizard';
import { useMemberOccupancies } from '../../hooks/useMemberOccupancies';
import { useOccupancyMutations } from '../../hooks/useOccupancyMutations';
import { useSpacePermissions } from '../../hooks/useSpacePermissions';
import { useMemberStore } from '../../store/memberStore';
import { useToastStore } from '../../store/toastStore';
import { useAuthStore } from '../../store/authStore';
import { colors, radius, spacing, typography } from '../../theme';
import { isAccommodationApplicable } from '../../utils/accommodationProfile';
import { supportsSpaceAmenities } from '../../utils/amenities';
import {
  canShowOccupancyActionsForMember,
  canViewMemberOccupancyForProfile,
  shouldShowOccupancySection,
} from '../../utils/occupancyPermissions';
import {
  formatOccupancyAllocatedDate,
  formatOccupancyLocationHierarchy,
  getOccupiedDayCount,
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

function StayLocationBlock({
  occupancy,
}: {
  occupancy: CurrentOccupancySummaryResponse;
}) {
  const { primary, secondary } = formatOccupancyLocationHierarchy(occupancy);
  if (!primary && !secondary) {
    return null;
  }
  return (
    <View style={styles.locationBlock}>
      {primary ? (
        <Text style={styles.locationPrimary} numberOfLines={2}>
          📍 {primary}
        </Text>
      ) : null}
      {secondary ? (
        <Text style={styles.locationSecondary} numberOfLines={2}>
          {secondary}
        </Text>
      ) : null}
    </View>
  );
}

function TimelineCell({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.timelineCell}>
      <Text style={styles.timelineLabel}>{label}</Text>
      <Text style={styles.timelineValue} numberOfLines={2}>
        {value}
      </Text>
    </View>
  );
}

function StayTimeline({
  moveInLabel,
  moveInValue,
  middleLabel,
  middleValue,
  exitLabel,
  exitValue,
}: {
  moveInLabel: string;
  moveInValue: string;
  middleLabel: string;
  middleValue: string;
  exitLabel: string;
  exitValue: string;
}) {
  return (
    <View style={styles.timelineRow}>
      <TimelineCell label={moveInLabel} value={moveInValue} />
      <TimelineCell label={middleLabel} value={middleValue} />
      <TimelineCell label={exitLabel} value={exitValue} />
    </View>
  );
}

function AssignedAmenityChips({ amenities }: { amenities: { label: string }[] }) {
  const { t } = useTranslation();
  if (amenities.length === 0) {
    return null;
  }
  return (
    <View style={styles.amenitiesBlock}>
      <Text style={styles.amenitiesTitle}>{t('occupancy.amenities.assigned')}</Text>
      <View style={styles.amenityChipRow}>
        {amenities.map(item => (
          <View key={item.label} style={styles.amenityChip}>
            <Text style={styles.amenityChipLabel} numberOfLines={1}>
              {item.label}
            </Text>
          </View>
        ))}
      </View>
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

  const dash = t('occupancy.section.timelineEmpty');

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

  const moveInRaw =
    activeOccupancy?.actualMoveInAt ??
    activeOccupancy?.moveInDate ??
    activeSummary?.moveInDate;
  const occupiedDays = getOccupiedDayCount(moveInRaw);
  const occupiedForLabel =
    occupiedDays == null
      ? dash
      : t('occupancy.section.occupiedDays', { count: occupiedDays });

  const exitRaw = getOccupancyExitDate(activeOccupancy) ?? getOccupancyExitDate(reservedOccupancy);

  return (
    <View style={styles.wrap}>
      <Text style={styles.sectionTitle}>{t('occupancy.section.title')}</Text>

      <Card style={styles.stayCard}>
        {isAllocated && activeSummary ? (
          <>
            <View style={styles.cardHeader}>
              <Text style={styles.cardHeading}>{t('occupancy.section.currentlyStaying')}</Text>
              <MemberOccupancyStatusBadge status={member.occupancyStatus} />
            </View>
            <StayLocationBlock occupancy={activeSummary} />
            <StayTimeline
              moveInLabel={t('occupancy.section.movedIn')}
              moveInValue={formatOccupancyAllocatedDate(moveInRaw)}
              middleLabel={t('occupancy.section.occupiedFor')}
              middleValue={occupiedForLabel}
              exitLabel={t('occupancy.section.expectedMoveOut')}
              exitValue={formatOccupancyAllocatedDate(exitRaw)}
            />
            {supportsSpaceAmenities(spaceType) ? (
              <AssignedAmenityChips amenities={assignedAmenities} />
            ) : null}
          </>
        ) : isReserved && reservedSummary ? (
          <>
            <View style={styles.cardHeader}>
              <Text style={styles.cardHeading}>{t('occupancy.section.reservedStay')}</Text>
              <MemberOccupancyStatusBadge status={member.occupancyStatus} />
            </View>
            <StayLocationBlock occupancy={reservedSummary} />
            <StayTimeline
              moveInLabel={t('occupancy.section.movedIn')}
              moveInValue={formatOccupancyAllocatedDate(
                reservedOccupancy?.moveInDate ?? reservedSummary.moveInDate,
              )}
              middleLabel={t('occupancy.section.reservedOnShort')}
              middleValue={formatOccupancyAllocatedDate(reservedOccupancy?.reservedAt)}
              exitLabel={t('occupancy.section.expectedMoveOut')}
              exitValue={formatOccupancyAllocatedDate(getOccupancyExitDate(reservedOccupancy))}
            />
            {supportsSpaceAmenities(spaceType) ? (
              <AssignedAmenityChips amenities={assignedAmenities} />
            ) : null}
          </>
        ) : (
          <>
            <View style={styles.cardHeader}>
              <Text style={styles.cardHeading}>{t('occupancy.section.noStayTitle')}</Text>
              <MemberOccupancyStatusBadge status={member.occupancyStatus ?? 'VACATED'} />
            </View>
            <Text style={styles.notAllocated}>{t('occupancy.section.noStayBody')}</Text>
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
          label={t('occupancy.actions.viewHistoryShort')}
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

      {isAllocated && activeOccupancy ? (
        <OccupancyContractSnapshotCard occupancy={activeOccupancy} />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    marginBottom: spacing.lg,
    gap: spacing.md,
  },
  sectionTitle: {
    ...typography.bodyStrong,
    marginBottom: spacing.xs,
  },
  stayCard: {
    gap: spacing.md,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
    flexWrap: 'wrap',
  },
  cardHeading: {
    ...typography.bodyStrong,
    flexShrink: 1,
  },
  locationBlock: {
    gap: 4,
  },
  locationPrimary: {
    ...typography.bodyStrong,
    color: colors.textPrimary,
  },
  locationSecondary: {
    ...typography.body,
    color: colors.textSecondary,
    paddingLeft: 22,
  },
  timelineRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    paddingTop: spacing.xs,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
  },
  timelineCell: {
    flex: 1,
    gap: 2,
  },
  timelineLabel: {
    ...typography.caption,
    color: colors.muted,
  },
  timelineValue: {
    ...typography.bodyStrong,
    fontSize: 13,
  },
  amenitiesBlock: {
    gap: spacing.sm,
  },
  amenitiesTitle: {
    ...typography.caption,
    color: colors.muted,
    fontWeight: '600',
  },
  amenityChipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  amenityChip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs + 2,
    borderRadius: radius.button,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.lightGreen,
  },
  amenityChipLabel: {
    ...typography.caption,
    color: colors.textPrimary,
    fontWeight: '600',
  },
  notAllocated: {
    ...typography.body,
    color: colors.muted,
  },
  actions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  actionBtn: {
    flexGrow: 1,
    flexBasis: '40%',
    minWidth: 120,
  },
  historyBtn: {
    marginTop: -spacing.xs,
  },
  errorText: {
    ...typography.caption,
    color: '#DC2626',
  },
});
