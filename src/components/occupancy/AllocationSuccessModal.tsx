import React from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { Check } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { Button } from '../ui';
import { colors, radius, shadows, spacing, typography } from '../../theme';

export type OccupancySuccessOperation = 'ALLOCATE' | 'RESERVE' | 'TRANSFER' | 'MOVE_IN';

type AllocationSuccessModalProps = {
  visible: boolean;
  operation?: OccupancySuccessOperation;
  memberName: string;
  locationLabel: string;
  onViewDetails: () => void;
  onDone: () => void;
};

function headlineKey(operation: OccupancySuccessOperation): string {
  switch (operation) {
    case 'RESERVE':
      return 'occupancy.success.reservedHeadline';
    case 'TRANSFER':
      return 'occupancy.success.transferredHeadline';
    case 'MOVE_IN':
      return 'occupancy.success.movedInHeadline';
    case 'ALLOCATE':
    default:
      return 'occupancy.success.allocatedHeadline';
  }
}

function detailKey(operation: OccupancySuccessOperation): string {
  switch (operation) {
    case 'RESERVE':
      return 'occupancy.success.reservedDetail';
    case 'TRANSFER':
      return 'occupancy.success.transferredDetail';
    case 'MOVE_IN':
      return 'occupancy.success.movedInDetail';
    case 'ALLOCATE':
    default:
      return 'occupancy.success.allocatedDetail';
  }
}

function primaryActionKey(operation: OccupancySuccessOperation): string {
  switch (operation) {
    case 'RESERVE':
      return 'occupancy.success.viewReservation';
    case 'TRANSFER':
      return 'occupancy.success.viewStay';
    case 'MOVE_IN':
      return 'occupancy.success.viewStay';
    case 'ALLOCATE':
    default:
      return 'occupancy.success.viewDetails';
  }
}

export function AllocationSuccessModal({
  visible,
  operation = 'ALLOCATE',
  memberName,
  locationLabel,
  onViewDetails,
  onDone,
}: AllocationSuccessModalProps) {
  const { t } = useTranslation();

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onDone}>
      <View style={styles.backdrop}>
        <View style={styles.card}>
          <View style={styles.rings}>
            <View style={styles.ringOuter}>
              <View style={styles.ringMiddle}>
                <View style={styles.ringInner}>
                  <Check size={36} color={colors.white} strokeWidth={3} />
                </View>
              </View>
            </View>
          </View>
          <Text style={styles.title}>{t('occupancy.success.title')}</Text>
          <Text style={styles.headline}>
            {t(headlineKey(operation), {
              defaultValue:
                operation === 'RESERVE'
                  ? 'Accommodation reserved successfully!'
                  : operation === 'TRANSFER'
                    ? 'Tenant transferred successfully!'
                    : operation === 'MOVE_IN'
                      ? 'Move-in completed successfully!'
                      : 'Tenant allocated successfully!',
            })}
          </Text>
          <Text style={styles.detail}>
            {t(detailKey(operation), {
              name: memberName,
              location: locationLabel,
              defaultValue:
                operation === 'RESERVE'
                  ? '{{name}} has a reservation at {{location}}.'
                  : operation === 'TRANSFER'
                    ? '{{name}} has been transferred to {{location}}.'
                    : operation === 'MOVE_IN'
                      ? '{{name}} has moved into {{location}}.'
                      : '{{name}} has been allocated to {{location}}.',
            })}
          </Text>
          <Button
            label={t(primaryActionKey(operation), {
              defaultValue:
                operation === 'RESERVE'
                  ? 'View reservation'
                  : operation === 'ALLOCATE'
                    ? 'View details'
                    : 'View stay',
            })}
            onPress={onViewDetails}
            style={styles.primaryBtn}
          />
          <Pressable
            onPress={onDone}
            style={({ pressed }) => [styles.doneBtn, pressed && styles.donePressed]}
            accessibilityRole="button">
            <Text style={styles.doneLabel}>{t('common.done')}</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: colors.overlayScrim,
    justifyContent: 'center',
    padding: spacing.xl,
  },
  card: {
    backgroundColor: colors.white,
    borderRadius: 24,
    padding: spacing.xl,
    alignItems: 'center',
    ...shadows.raised,
  },
  rings: {
    marginBottom: spacing.lg,
  },
  ringOuter: {
    width: 112,
    height: 112,
    borderRadius: 56,
    backgroundColor: `${colors.primary}18`,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ringMiddle: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: `${colors.primary}28`,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ringInner: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    ...typography.h2,
    fontSize: 28,
    lineHeight: 34,
    fontWeight: '800',
    color: colors.textPrimary,
    marginBottom: spacing.xs,
  },
  headline: {
    ...typography.bodyStrong,
    fontSize: 16,
    textAlign: 'center',
    color: colors.textPrimary,
    marginBottom: spacing.sm,
  },
  detail: {
    ...typography.body,
    textAlign: 'center',
    color: colors.textSecondary,
    marginBottom: spacing.xl,
    lineHeight: 22,
  },
  primaryBtn: {
    alignSelf: 'stretch',
    marginBottom: spacing.sm,
  },
  doneBtn: {
    alignSelf: 'stretch',
    minHeight: 48,
    borderRadius: radius.button,
    borderWidth: 1.5,
    borderColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.white,
  },
  donePressed: {
    backgroundColor: colors.successTint,
  },
  doneLabel: {
    ...typography.bodyStrong,
    color: colors.primaryDark,
    fontWeight: '700',
  },
});
