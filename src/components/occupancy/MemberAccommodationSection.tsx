import React, { useState } from 'react';
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
import { useMemberOccupancies } from '../../hooks/useMemberOccupancies';
import { useOccupancyMutations } from '../../hooks/useOccupancyMutations';
import { useMemberStore } from '../../store/memberStore';
import { useToastStore } from '../../store/toastStore';
import { colors, spacing, typography } from '../../theme';
import { isAccommodationApplicable } from '../../utils/accommodationProfile';
import {
  canShowOccupancyActionsForMember,
  canViewMemberOccupancy,
  shouldShowOccupancySection,
} from '../../utils/occupancyPermissions';
import {
  buildAllocateRequest,
  buildReserveRequest,
  buildTransferRequest,
  formatOccupancyAllocatedDate,
  getOccupancyExitDate,
  type OccupancyTargetSelection,
} from '../../utils/occupancyRules';
import { MoveInModal, type MoveInFormValues } from './MoveInModal';
import {
  OccupancyTargetPickerModal,
  type OccupancyPickerExtras,
} from './OccupancyTargetPickerModal';

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

  const showSection = Boolean(
    spaceType &&
      isAccommodationApplicable(spaceType) &&
      shouldShowOccupancySection(member.role) &&
      canViewMemberOccupancy(currentRole),
  );

  const { data: occupancyData } = useMemberOccupancies(spaceId, member.memberId, {
    enabled: showSection,
  });
  const {
    allocate,
    reserve,
    moveIn,
    cancelReservation,
    transfer,
    vacate,
    loading,
    error,
    clearError,
  } = useOccupancyMutations(spaceId);

  const [reserveVisible, setReserveVisible] = useState(false);
  const [walkInVisible, setWalkInVisible] = useState(false);
  const [transferVisible, setTransferVisible] = useState(false);
  const [moveInVisible, setMoveInVisible] = useState(false);

  if (!showSection || !spaceType) {
    return null;
  }

  const resolvedSpaceType = spaceType;
  const canManage = canShowOccupancyActionsForMember(member.role, currentRole);
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

  function closePickers() {
    setReserveVisible(false);
    setWalkInVisible(false);
    setTransferVisible(false);
  }

  async function afterMutation() {
    await refreshMember(member.memberId);
    showToast(t('occupancy.success.updated'));
  }

  async function handleReserve(
    selection: OccupancyTargetSelection,
    extras?: OccupancyPickerExtras,
  ) {
    clearError();
    const { body, errorKey } = buildReserveRequest(
      member.memberId,
      resolvedSpaceType,
      selection.targetType,
      {
        bedId: selection.bedId,
        roomId: selection.roomId,
        unitId: selection.unitId,
      },
      {
        moveInDate: extras?.moveInDate ?? '',
        expectedExitDate: extras?.expectedExitDate,
        expectedCheckoutDate: extras?.expectedCheckoutDate,
        memberCategory: extras?.memberCategory,
        remarks: extras?.remarks,
      },
    );
    if (!body || errorKey) {
      showToast(t(errorKey ?? 'occupancy.errors.generic'));
      return;
    }
    try {
      await reserve(body);
      closePickers();
      await afterMutation();
    } catch {
      // error surfaced via hook
    }
  }

  async function handleWalkIn(
    selection: OccupancyTargetSelection,
    extras?: OccupancyPickerExtras,
  ) {
    clearError();
    const { body, errorKey } = buildAllocateRequest(
      member.memberId,
      resolvedSpaceType,
      selection.targetType,
      {
        bedId: selection.bedId,
        roomId: selection.roomId,
        unitId: selection.unitId,
      },
      extras,
    );
    if (!body || errorKey) {
      showToast(t(errorKey ?? 'occupancy.errors.generic'));
      return;
    }
    try {
      await allocate(body);
      closePickers();
      await afterMutation();
    } catch {
      // error surfaced via hook
    }
  }

  async function handleTransfer(
    selection: OccupancyTargetSelection,
    extras?: OccupancyPickerExtras,
  ) {
    if (!activeOccupancyId) {
      showToast(t('occupancy.errors.noActive'));
      return;
    }

    clearError();
    const { body, errorKey } = buildTransferRequest(
      resolvedSpaceType,
      selection.targetType,
      {
        bedId: selection.bedId,
        roomId: selection.roomId,
        unitId: selection.unitId,
      },
      extras?.remarks,
    );
    if (!body || errorKey) {
      showToast(t(errorKey ?? 'occupancy.errors.generic'));
      return;
    }
    try {
      await transfer(activeOccupancyId, body);
      closePickers();
      await afterMutation();
    } catch {
      // error surfaced via hook
    }
  }

  async function handleMoveIn(values: MoveInFormValues) {
    if (!reservedOccupancyId) {
      showToast(t('occupancy.errors.noReserved'));
      return;
    }
    clearError();
    try {
      await moveIn(reservedOccupancyId, {
        expectedExitDate: values.expectedExitDate ?? null,
        allowEarlyMoveIn: values.allowEarlyMoveIn,
        agreementSigned: values.agreementSigned,
        remarks: values.remarks ?? null,
      });
      setMoveInVisible(false);
      await afterMutation();
    } catch {
      // error surfaced via hook
    }
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

  function confirmVacate() {
    showConfirm({
      title: t('occupancy.vacate.title'),
      message: t('occupancy.vacate.message'),
      confirmLabel: t('occupancy.vacate.confirm'),
      destructive: true,
      onConfirm: async () => {
        if (!activeOccupancyId) {
          showToast(t('occupancy.errors.noActive'));
          return;
        }
        try {
          await vacate(activeOccupancyId);
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
                  onPress={() => setTransferVisible(true)}
                  disabled={loading}
                  style={styles.actionBtn}
                />
                <Button
                  label={t('occupancy.actions.vacate')}
                  variant="ghost"
                  onPress={confirmVacate}
                  disabled={loading}
                  style={styles.actionBtn}
                />
              </>
            ) : isReserved ? (
              <>
                <Button
                  label={t('occupancy.actions.moveIn')}
                  onPress={() => setMoveInVisible(true)}
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
                  onPress={() => setReserveVisible(true)}
                  disabled={loading}
                  style={styles.actionBtn}
                />
                <Button
                  label={t('occupancy.actions.walkInAllocate')}
                  variant="secondary"
                  onPress={() => setWalkInVisible(true)}
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

      <OccupancyTargetPickerModal
        visible={reserveVisible}
        spaceId={spaceId}
        spaceType={spaceType}
        mode="RESERVE"
        title={t('occupancy.reserve.title')}
        memberName={member.fullName}
        loading={loading}
        onClose={closePickers}
        onConfirm={handleReserve}
      />

      <OccupancyTargetPickerModal
        visible={walkInVisible}
        spaceId={spaceId}
        spaceType={spaceType}
        mode="WALK_IN"
        title={t('occupancy.walkIn.title')}
        memberName={member.fullName}
        showCheckoutDate
        loading={loading}
        onClose={closePickers}
        onConfirm={handleWalkIn}
      />

      <OccupancyTargetPickerModal
        visible={transferVisible}
        spaceId={spaceId}
        spaceType={spaceType}
        mode="TRANSFER"
        title={t('occupancy.transfer.title')}
        memberName={member.fullName}
        loading={loading}
        onClose={closePickers}
        onConfirm={handleTransfer}
      />

      <MoveInModal
        visible={moveInVisible}
        moveInDate={reservedOccupancy?.moveInDate ?? reservedSummary?.moveInDate}
        loading={loading}
        onClose={() => setMoveInVisible(false)}
        onConfirm={handleMoveIn}
      />
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
