import React, { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useTranslation } from 'react-i18next';
import type { CurrentOccupancySummaryResponse, MemberDetailsResponse, MembershipRole, SpaceType } from '../../api/types';
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
  buildTransferRequest,
  formatOccupancyAllocatedDate,
} from '../../utils/occupancyRules';
import { OccupancyTargetPickerModal, type OccupancyTargetSelection } from './OccupancyTargetPickerModal';

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
  const { allocate, transfer, vacate, loading, error, clearError } =
    useOccupancyMutations(spaceId);

  const [allocateVisible, setAllocateVisible] = useState(false);
  const [transferVisible, setTransferVisible] = useState(false);

  if (!showSection || !spaceType) {
    return null;
  }

  const resolvedSpaceType = spaceType;

  const canManage = canShowOccupancyActionsForMember(member.role, currentRole);
  const isAllocated = member.occupancyStatus === 'ALLOCATED';
  const currentOccupancy = member.currentOccupancy;
  const activeOccupancyId = occupancyData?.currentOccupancy?.occupancyId;
  const allocatedAt = occupancyData?.currentOccupancy?.allocatedAt;

  function closePicker() {
    setAllocateVisible(false);
    setTransferVisible(false);
  }

  async function afterMutation() {
    await refreshMember(member.memberId);
    showToast(t('occupancy.success.updated'));
  }

  async function handleAllocate(
    selection: OccupancyTargetSelection,
    extras?: { expectedCheckoutDate?: string; remarks?: string },
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
      closePicker();
      await afterMutation();
    } catch {
      // error surfaced via hook
    }
  }

  async function handleTransfer(
    selection: OccupancyTargetSelection,
    extras?: { remarks?: string },
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
      closePicker();
      await afterMutation();
    } catch {
      // error surfaced via hook
    }
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
        {isAllocated && currentOccupancy ? (
          <>
            <Text style={styles.cardHeading}>{t('occupancy.section.currentAccommodation')}</Text>
            <AccommodationLocationDetails occupancy={currentOccupancy} />
            <View style={styles.allocatedOnRow}>
              <Text style={styles.locationLabel}>{t('occupancy.section.allocatedOn')}</Text>
              <Text style={styles.allocatedOnValue}>
                {formatOccupancyAllocatedDate(allocatedAt)}
              </Text>
            </View>
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
            ) : (
              <Button
                label={t('occupancy.actions.allocateAccommodation')}
                onPress={() => setAllocateVisible(true)}
                disabled={loading}
                style={styles.actionBtn}
              />
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
        visible={allocateVisible}
        spaceId={spaceId}
        spaceType={spaceType}
        title={t('occupancy.allocate.title')}
        showCheckoutDate
        loading={loading}
        onClose={closePicker}
        onConfirm={handleAllocate}
      />

      <OccupancyTargetPickerModal
        visible={transferVisible}
        spaceId={spaceId}
        spaceType={spaceType}
        title={t('occupancy.transfer.title')}
        loading={loading}
        onClose={closePicker}
        onConfirm={(selection, extras) => handleTransfer(selection, extras)}
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
  allocatedOnRow: {
    marginTop: spacing.sm,
    gap: 2,
  },
  allocatedOnValue: {
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
