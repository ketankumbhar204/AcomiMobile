import React, { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import type {
  AccommodationStatus,
  OccupancyResponse,
  SpaceType,
} from '../../api/types';
import { Button } from '../ui';
import { useAccommodationOccupancyFlow } from '../../hooks/useAccommodationOccupancyFlow';
import { colors, spacing, typography } from '../../theme';
import { isOccupancyTargetSupported } from '../../utils/buildOccupancyTarget';
import type { OccupancyTargetSelection } from '../../utils/occupancyRules';
import { AccommodationOccupancyFlowModals } from './AccommodationOccupancyFlowModals';

type AccommodationOccupancyActionsProps = {
  spaceId: string;
  spaceType: SpaceType;
  canManage?: boolean;
  accommodationStatus: AccommodationStatus;
  target: OccupancyTargetSelection;
  occupancy?: OccupancyResponse | null;
  onSuccess?: () => void;
};

export function AccommodationOccupancyActions({
  spaceId,
  spaceType,
  canManage = true,
  accommodationStatus,
  target,
  occupancy = null,
  onSuccess,
}: AccommodationOccupancyActionsProps) {
  const { t } = useTranslation();

  const flow = useAccommodationOccupancyFlow({
    spaceId,
    spaceType,
    canManage,
    onSuccess,
  });

  const context = useMemo(
    () => ({
      target,
      accommodationStatus,
      occupancy,
    }),
    [accommodationStatus, occupancy, target],
  );

  const targetSupported = isOccupancyTargetSupported(spaceType, target.targetType);
  const showActions = canManage && targetSupported;

  if (!showActions) {
    return null;
  }

  if (accommodationStatus === 'MAINTENANCE' || accommodationStatus === 'BLOCKED') {
    return null;
  }

  const isAvailable = accommodationStatus === 'AVAILABLE';
  const isReserved = accommodationStatus === 'RESERVED';
  const isOccupied = accommodationStatus === 'OCCUPIED';

  return (
    <View style={styles.wrap}>
      <Text style={styles.sectionTitle}>{t('occupancy.accommodationActions.title')}</Text>

      {flow.error ? <Text style={styles.errorText}>{flow.error}</Text> : null}

      <View style={styles.actions}>
        {isAvailable ? (
          <>
            <Button
              label={t('occupancy.actions.allocate')}
              onPress={() => flow.startWalkIn(context)}
              disabled={flow.loading}
              style={styles.actionBtn}
            />
            <Button
              label={t('occupancy.actions.reserve')}
              variant="secondary"
              onPress={() => flow.startReserve(context)}
              disabled={flow.loading}
              style={styles.actionBtn}
            />
          </>
        ) : null}

        {isReserved ? (
          <>
            <Button
              label={t('occupancy.actions.moveIn')}
              onPress={() => void flow.startMoveIn(context)}
              disabled={flow.loading}
              style={styles.actionBtn}
            />
            <Button
              label={t('occupancy.actions.cancelReservation')}
              variant="ghost"
              onPress={() => void flow.startCancelReservation(context)}
              disabled={flow.loading}
              style={styles.actionBtn}
            />
          </>
        ) : null}

        {isOccupied ? (
          <>
            <Button
              label={t('occupancy.actions.transfer')}
              variant="secondary"
              onPress={() => void flow.startTransfer(context)}
              disabled={flow.loading}
              style={styles.actionBtn}
            />
            <Button
              label={t('occupancy.actions.vacate')}
              variant="ghost"
              onPress={() => void flow.startVacate(context)}
              disabled={flow.loading}
              style={styles.actionBtn}
            />
          </>
        ) : null}
      </View>

      <AccommodationOccupancyFlowModals spaceId={spaceId} spaceType={spaceType} flow={flow} />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    marginTop: spacing.lg,
    marginBottom: spacing.md,
  },
  sectionTitle: {
    ...typography.bodyStrong,
    marginBottom: spacing.sm,
  },
  actions: {
    gap: spacing.sm,
  },
  actionBtn: {
    width: '100%',
  },
  errorText: {
    ...typography.caption,
    color: '#DC2626',
    marginBottom: spacing.sm,
  },
});
